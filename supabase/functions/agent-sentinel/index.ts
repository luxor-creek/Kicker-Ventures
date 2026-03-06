import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/*
  ================================================================
  SENTINEL v3 — CTO-Grade System Guardian
  ================================================================
  
  Design Principles:
  1. SQL-first: All aggregation in Postgres. Zero N+1 queries.
  2. Config-driven: All thresholds in sentinel_config table.
     Change a number, behavior changes. No redeploy.
  3. Time-series: Every scan writes metrics. Trend detection built-in.
  4. Escalation ladder: Alerts fingerprinted + escalated (warn→crit→page).
  5. Auto-heal hierarchy: kill stuck → prune memory → pause agents.
  6. Multi-tenant ready: All queries support user_id scoping.
  7. Scales to 1000+ agents: Batch SQL, no per-agent queries.
  
  Modes:
  - "scan"   → Quick health check + auto-heal (every 15 min)
  - "report" → Full daily digest with scorecard (daily 6 AM UTC)
  
  SQL Functions (all O(1) per-agent via aggregation):
  - sentinel_system_health_v2(since)    → system metrics + trends
  - sentinel_agent_scorecard_v2(since)  → all agents in one query
  - sentinel_kill_stuck_tasks(mins)     → bulk kill
  - sentinel_prune_memories(max,age,imp) → bulk prune
  - sentinel_auto_disable_agents(n)     → pause failing agents
  - sentinel_error_summary(since)       → grouped errors
  - sentinel_check_alert(fp,cooldown)   → dedup + escalation
  - sentinel_record_metrics(sys,agents) → batch time-series write
  - sentinel_config_val(key)            → typed config lookup
  ================================================================
*/

interface Finding {
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  category: string
  message: string
  action: string
  auto_healed: boolean
  fingerprint?: string
}

interface Config {
  [key: string]: number
}

async function loadConfig(supabase: any): Promise<Config> {
  const { data } = await supabase
    .from('sentinel_config')
    .select('key, value')
  if (!data) return {}
  const config: Config = {}
  for (const row of data) {
    config[row.key] = Number(row.value) || 0
  }
  return config
}

function fp(category: string, detail: string): string {
  const str = `${category}:${detail}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0
  }
  return `${category}_${Math.abs(hash).toString(36)}`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const startTime = Date.now()
  const timings: Record<string, number> = {}

  const { data: runRecord } = await supabase
    .from('sentinel_runs')
    .insert({ mode: 'scan', started_at: new Date().toISOString() })
    .select('id')
    .single()
  const runId = runRecord?.id

  try {
    const body = await req.json().catch(() => ({}))
    const mode = body.mode || 'scan'
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    if (runId) await supabase.from('sentinel_runs').update({ mode }).eq('id', runId)

    // ─── LOAD CONFIG ───
    const t0 = Date.now()
    const cfg = await loadConfig(supabase)
    timings.config = Date.now() - t0

    const findings: Finding[] = []

    const [{ data: sentinel }, { data: admins }] = await Promise.all([
      supabase.from('ai_agents').select('id').eq('slug', 'sentinel').single(),
      supabase.from('user_roles').select('user_id').eq('role', 'admin'),
    ])
    const sentinelId = sentinel?.id
    const adminUserIds = admins?.length
      ? (admins as any[]).map((a: any) => a.user_id)
      : ['fa022882-f253-4d58-b14c-d71f052210a3']

    // ═══════════════════════════════════════════
    // PHASE 1: System Health + Trends
    // ═══════════════════════════════════════════
    const t1 = Date.now()
    const { data: health } = await supabase.rpc('sentinel_system_health_v2', { p_since: oneDayAgo })
    timings.health = Date.now() - t1
    const h = health as any

    if (h) {
      const trend = h.trend || {}

      // Cost
      const costWarn = cfg.cost_warn_threshold || 5
      const costCrit = cfg.cost_critical_threshold || 20
      if (Number(h.total_cost) > costWarn) {
        const sev = Number(h.total_cost) > costCrit ? 'CRITICAL' : 'WARNING'
        const trendStr = trend.cost_delta_pct > 0 ? ` (↑${trend.cost_delta_pct}% vs prev period)` : ''
        findings.push({ severity: sev as any, category: 'cost_spike',
          message: `24h cost: $${Number(h.total_cost).toFixed(2)} across ${h.total_llm_calls} calls${trendStr}`,
          action: sev === 'CRITICAL' ? 'Immediate review — possible runaway' : 'Monitor usage trend',
          auto_healed: false, fingerprint: fp('cost', sev) })
      }

      // Slow responses
      if (Number(h.avg_duration_ms) > (cfg.slow_response_ms || 15000) && h.total_llm_calls > 10) {
        const trendStr = trend.duration_delta_pct > 20 ? ` (↑${trend.duration_delta_pct}% degrading)` : ''
        findings.push({ severity: 'WARNING', category: 'slow_responses',
          message: `Avg LLM: ${(Number(h.avg_duration_ms) / 1000).toFixed(1)}s${trendStr}`,
          action: 'Check provider status or context size', auto_healed: false, fingerprint: fp('slow', 'warn') })
      }

      // Delegations
      const delWarn = cfg.delegation_fail_warn || 2
      if (h.failed_delegations > delWarn) {
        const sev = h.failed_delegations > (cfg.delegation_fail_critical || 10) ? 'CRITICAL' : 'WARNING'
        findings.push({ severity: sev as any, category: 'delegation_failures',
          message: `${h.failed_delegations} failed delegations in 24h`,
          action: 'Check model compatibility', auto_healed: false, fingerprint: fp('deleg', sev) })
      }

      // Unread errors
      if (h.unread_errors > 0) {
        findings.push({ severity: 'CRITICAL', category: 'unread_errors',
          message: `${h.unread_errors} error(s) unread >24h`,
          action: 'Check Audit Log', auto_healed: false, fingerprint: fp('unread', 'crit') })
      }

      // Runaways
      if (h.runaways > 0) {
        const sev = h.runaways > (cfg.runaway_critical || 5) ? 'CRITICAL' : 'WARNING'
        findings.push({ severity: sev as any, category: 'runaways',
          message: `${h.runaways} runaway(s) in 24h`,
          action: 'Review task complexity', auto_healed: false, fingerprint: fp('runaway', sev) })
      }

      // Crashes
      if (h.crashes > 0) {
        findings.push({ severity: 'CRITICAL', category: 'crashes',
          message: `${h.crashes} crash(es) in 24h`,
          action: 'Code bugs — check stack traces', auto_healed: false, fingerprint: fp('crash', 'crit') })
      }

      // Paused agents
      if (h.paused_agents > 0) {
        findings.push({ severity: 'WARNING', category: 'paused_agents',
          message: `${h.paused_agents} agent(s) paused`,
          action: 'Review and re-enable', auto_healed: false, fingerprint: fp('paused', 'warn') })
      }

      // Open alerts backlog
      if (h.open_alerts > 10) {
        findings.push({ severity: 'WARNING', category: 'alert_backlog',
          message: `${h.open_alerts} unresolved alerts`,
          action: 'Review stale alerts', auto_healed: false, fingerprint: fp('backlog', 'warn') })
      }
    }

    // ═══════════════════════════════════════════
    // PHASE 2: Error Grouping
    // ═══════════════════════════════════════════
    const t2 = Date.now()
    const { data: errors } = await supabase.rpc('sentinel_error_summary', { p_since: oneDayAgo })
    timings.errors = Date.now() - t2
    if (errors?.length) {
      for (const e of errors as any[]) {
        findings.push({
          severity: e.severity as any, category: e.severity === 'CRITICAL' ? 'recurring_error' : 'edge_error',
          message: `${e.function_name}: "${e.error_signature}" (${e.occurrence_count}x)`,
          action: e.severity === 'CRITICAL' ? 'Code bug — recurring' : `${e.occurrence_count} occurrence(s)`,
          auto_healed: false, fingerprint: fp('err', `${e.function_name}_${e.error_signature}`) })
      }
    }

    // ═══════════════════════════════════════════
    // PHASE 3: Auto-heal — Kill Stuck Tasks
    // ═══════════════════════════════════════════
    const t3 = Date.now()
    const stuckMin = cfg.stuck_task_minutes || 30
    const { data: killed } = await supabase.rpc('sentinel_kill_stuck_tasks', { p_timeout_minutes: stuckMin })
    timings.stuck = Date.now() - t3
    if (killed?.length) {
      for (const k of killed as any[]) {
        findings.push({ severity: 'WARNING', category: 'stuck_task',
          message: `"${k.task_title}" by ${k.agent_name} stuck since ${k.stuck_since}`,
          action: `Auto-killed after ${stuckMin}min`, auto_healed: true, fingerprint: fp('stuck', k.task_id) })
      }
    }

    // ═══════════════════════════════════════════
    // PHASE 4: Auto-heal — Prune Memory
    // ═══════════════════════════════════════════
    const t4 = Date.now()
    const { data: pruned } = await supabase.rpc('sentinel_prune_memories', {
      p_max_per_agent: cfg.memory_prune_count || 1000,
      p_min_age_days: cfg.memory_prune_age_days || 90,
      p_max_importance: cfg.memory_prune_max_importance || 4,
    })
    timings.prune = Date.now() - t4
    if (pruned?.length) {
      for (const p of pruned as any[]) {
        findings.push({ severity: 'INFO', category: 'memory_cleanup',
          message: `Pruned ${p.pruned_count} memories from ${p.agent_name}`,
          action: 'Auto-pruned old low-importance', auto_healed: true })
      }
    }

    // ═══════════════════════════════════════════
    // PHASE 5: Auto-heal — Disable Failing Agents
    // ═══════════════════════════════════════════
    const t5 = Date.now()
    const { data: disabled } = await supabase.rpc('sentinel_auto_disable_agents', {
      p_max_consecutive_failures: cfg.auto_disable_consecutive_failures || 5,
    })
    timings.disable = Date.now() - t5
    if (disabled?.length) {
      for (const d of disabled as any[]) {
        findings.push({ severity: 'CRITICAL', category: 'agent_disabled',
          message: `${d.agent_name} auto-paused: ${d.consecutive_failures} consecutive failures`,
          action: 'Review and re-enable manually', auto_healed: true,
          fingerprint: fp('disabled', d.agent_slug) })
      }
    }

    // ═══════════════════════════════════════════
    // PHASE 6: Budget Check
    // ═══════════════════════════════════════════
    const t6 = Date.now()
    const { data: budget } = await supabase
      .from('account_token_budgets')
      .select('daily_tokens_used, daily_token_limit')
      .limit(1).single()
    timings.budget = Date.now() - t6

    if (budget) {
      const pct = ((budget as any).daily_tokens_used / (budget as any).daily_token_limit) * 100
      const budgetWarn = cfg.budget_warn_pct || 80
      const budgetCrit = cfg.budget_critical_pct || 95
      if (pct > budgetWarn) {
        findings.push({ severity: pct > budgetCrit ? 'CRITICAL' : 'WARNING', category: 'budget',
          message: `Budget at ${pct.toFixed(0)}%`, action: pct > budgetCrit ? 'Agents blocked imminently' : 'Approaching limit',
          auto_healed: false, fingerprint: fp('budget', pct > budgetCrit ? 'crit' : 'warn') })
      }
    }

    // ═══════════════════════════════════════════
    // METRICS: Time-series data point
    // ═══════════════════════════════════════════
    await supabase.rpc('sentinel_record_metrics', {
      p_system_data: {
        cost: Number(h?.total_cost || 0), llm_calls: Number(h?.total_llm_calls || 0),
        errors: Number(h?.edge_errors || 0), avg_ms: Number(h?.avg_duration_ms || 0),
        agents: Number(h?.total_agents || 0), findings: findings.length,
        healed: findings.filter(f => f.auto_healed).length,
      },
    }).catch(() => {})

    // ═══════════════════════════════════════════
    // REPORT MODE
    // ═══════════════════════════════════════════
    if (mode === 'report') {
      const t8 = Date.now()
      const { data: scorecard } = await supabase.rpc('sentinel_agent_scorecard_v2', { p_since: oneDayAgo })
      timings.scorecard = Date.now() - t8
      const agents = (scorecard || []) as any[]

      // Memory bloat from scorecard data
      for (const a of agents) {
        if (a.memory_count > (cfg.memory_warn_count || 500)) {
          findings.push({ severity: a.memory_count > (cfg.memory_prune_count || 1000) ? 'WARNING' : 'INFO',
            category: 'memory_bloat', message: `${a.agent_name}: ${a.memory_count} memories`,
            action: a.memory_count > (cfg.memory_prune_count || 1000) ? 'Auto-pruning triggered' : 'Approaching threshold', auto_healed: false })
        }
      }

      // Agent metrics to time-series
      await supabase.rpc('sentinel_record_metrics', {
        p_system_data: { report: true, agent_count: agents.length },
        p_agent_data: agents.map((a: any) => ({
          agent_id: a.agent_id,
          data: { score: a.health_score, completed: Number(a.tasks_completed), failed: Number(a.tasks_failed),
            calls: Number(a.llm_calls), cost: Number(a.total_cost), mem: Number(a.memory_count) },
        })),
      }).catch(() => {})

      const totalCost = agents.reduce((s: number, a: any) => s + Number(a.total_cost), 0)
      const totalCalls = agents.reduce((s: number, a: any) => s + Number(a.llm_calls), 0)
      const degraded = agents.filter((a: any) => a.health === 'DEGRADED' || a.health === 'PAUSED')
      const autoHealed = findings.filter(f => f.auto_healed).length
      const needsAttention = findings.filter(f => !f.auto_healed && f.severity !== 'INFO').length

      const trend = h?.trend || {}
      const trends: string[] = []
      if (trend.cost_delta_pct > 20) trends.push(`⬆️ Cost +${trend.cost_delta_pct}%`)
      if (trend.cost_delta_pct < -20) trends.push(`⬇️ Cost ${trend.cost_delta_pct}%`)
      if (trend.calls_delta_pct > 50) trends.push(`⬆️ Calls +${trend.calls_delta_pct}%`)
      if (trend.duration_delta_pct > 30) trends.push(`⬆️ Latency +${trend.duration_delta_pct}%`)

      const lines = [
        `# 🛡️ SENTINEL DAILY REPORT — ${now.toISOString().split('T')[0]}`,
        '',
        `## System`,
        `- **Agents**: ${agents.length}${degraded.length ? ` (${degraded.length} degraded/paused)` : ''}`,
        `- **LLM**: ${totalCalls} calls | $${totalCost.toFixed(4)}`,
        `- **Errors**: ${h?.edge_errors || 0} | **Crashes**: ${h?.crashes || 0} | **Runaways**: ${h?.runaways || 0}`,
        `- **Auto-healed**: ${autoHealed} | **Needs attention**: ${needsAttention}`,
        trends.length ? `- **Trends**: ${trends.join(' | ')}` : '',
        '',
      ]

      const showAll = agents.length <= 20
      const topByCost = [...agents].sort((a: any, b: any) => Number(b.total_cost) - Number(a.total_cost))
      const displayed = showAll ? topByCost : topByCost.slice(0, 10)

      lines.push(
        showAll ? `## Agents` : `## Top ${displayed.length} of ${agents.length} Agents`,
        '| Agent | HP | Score | ✅ | ❌ | LLM | Cost | Mem |',
        '|-------|----|-------|----|----|-----|------|-----|',
        ...displayed.map((a: any) => {
          const icon = a.health === 'HEALTHY' ? '✅' : a.health === 'DEGRADED' ? '🔴' : a.health === 'PAUSED' ? '⏸️' : '🟡'
          return `| ${a.agent_name} | ${icon} | ${a.health_score} | ${a.tasks_completed} | ${a.tasks_failed} | ${a.llm_calls} | $${Number(a.total_cost).toFixed(4)} | ${a.memory_count} |`
        }),
      )

      if (!showAll) {
        const rest = topByCost.slice(10)
        lines.push(`| _${rest.length} others_ | -- | -- | -- | -- | ${rest.reduce((s: number, a: any) => s + Number(a.llm_calls), 0)} | $${rest.reduce((s: number, a: any) => s + Number(a.total_cost), 0).toFixed(4)} | -- |`)
      }

      lines.push('', `## Findings (${findings.length})`)
      if (findings.length > 0) {
        const bySev: Record<string, Finding[]> = {}
        for (const f of findings) { (bySev[f.severity] ??= []).push(f) }
        for (const sev of ['CRITICAL', 'WARNING', 'INFO'] as const) {
          if (bySev[sev]?.length) {
            lines.push(`\n### ${sev} (${bySev[sev].length})`)
            lines.push(...bySev[sev].map(f => `- **${f.category}**: ${f.message} → ${f.action}${f.auto_healed ? ' ✅' : ''}`))
          }
        }
      } else {
        lines.push('- All clear')
      }

      const dur = Date.now() - startTime
      lines.push('', `---`, `*${dur}ms | ${Object.entries(timings).map(([k, v]) => `${k}:${v}ms`).join(' ')}*`)
      if (needsAttention === 0 && !h?.edge_errors) lines.push('', '**All systems nominal.** 🟢')

      const report = lines.filter(l => l !== '').join('\n')

      if (sentinelId) {
        for (const uid of adminUserIds) {
          await supabase.from('ai_agent_notifications').insert({
            user_id: uid, agent_id: sentinelId, notification_type: 'daily_report',
            title: `🛡️ Daily Report — ${now.toISOString().split('T')[0]}`,
            message: report, is_read: false,
          }).catch(() => {})
        }
      }

      if (runId) {
        await supabase.from('sentinel_runs').update({
          completed_at: new Date().toISOString(), duration_ms: dur,
          total_findings: findings.length, auto_healed: autoHealed,
          needs_attention: needsAttention, findings: JSON.stringify(findings),
          agent_count: agents.length, scan_duration_breakdown: timings,
          metrics_snapshot: { cost: totalCost, calls: totalCalls, degraded: degraded.length, trend },
        }).eq('id', runId)
      }

      return new Response(JSON.stringify({ mode: 'report', duration_ms: dur, agent_count: agents.length, report, findings }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ═══════════════════════════════════════════
    // SCAN MODE: Deduplicated + Escalated Alerts
    // ═══════════════════════════════════════════
    const actionable = findings.filter(f => f.severity === 'CRITICAL' || f.severity === 'WARNING')
    const cooldown = cfg.alert_cooldown_minutes || 60

    if (actionable.length > 0 && sentinelId) {
      const toSend: { finding: Finding; level: number }[] = []

      for (const f of actionable) {
        const fprint = f.fingerprint || fp(f.category, f.message)
        const { data: check } = await supabase.rpc('sentinel_check_alert', {
          p_fingerprint: fprint, p_cooldown_minutes: cooldown,
        }).catch(() => ({ data: [{ should_alert: true, escalation_level: 1 }] }))

        const row = Array.isArray(check) ? check[0] : check
        if (row?.should_alert !== false) {
          const level = row?.escalation_level || 1
          toSend.push({ finding: f, level })
          await supabase.from('sentinel_alerts').insert({
            category: f.category, fingerprint: fprint,
            severity: level >= 3 ? 'CRITICAL' : f.severity,
            message: f.message, action: f.action,
            auto_healed: f.auto_healed, escalation_level: level,
          }).catch(() => {})
        }
      }

      if (toSend.length > 0) {
        const escalated = toSend.filter(a => a.level >= 2)
        const msg = toSend.map(({ finding: f, level }) => {
          const pre = level >= 3 ? '🚨 ESCALATED' : level >= 2 ? '⚠️ REPEAT' : `[${f.severity}]`
          return `${pre} ${f.category}\n${f.message}\n→ ${f.action}${f.auto_healed ? ' (auto-healed)' : ''}`
        }).join('\n\n---\n\n')

        const nType = toSend.some(a => a.level >= 3) ? 'critical_escalation'
          : toSend.some(a => !a.finding.auto_healed) ? 'system_error' : 'info'

        const title = escalated.length
          ? `🚨 Sentinel: ${toSend.length} issue(s), ${escalated.length} escalated`
          : `🛡️ Sentinel: ${toSend.length} issue(s)`

        for (const uid of adminUserIds) {
          await supabase.from('ai_agent_notifications').insert({
            user_id: uid, agent_id: sentinelId, notification_type: nType,
            title, message: msg, is_read: false,
          }).catch(() => {})
        }
      }
    }

    // Auto-resolve 24h+ old alerts
    await supabase.from('sentinel_alerts')
      .update({ resolved_at: now.toISOString(), resolved_by: 'auto' })
      .is('resolved_at', null)
      .lt('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString())
      .catch(() => {})

    const duration = Date.now() - startTime
    if (runId) {
      await supabase.from('sentinel_runs').update({
        completed_at: new Date().toISOString(), duration_ms: duration,
        total_findings: findings.length,
        auto_healed: findings.filter(f => f.auto_healed).length,
        needs_attention: findings.filter(f => !f.auto_healed && f.severity !== 'INFO').length,
        findings: JSON.stringify(findings), agent_count: h?.total_agents || 0,
        scan_duration_breakdown: timings,
      }).eq('id', runId)
    }

    return new Response(JSON.stringify({
      mode: 'scan', run_id: runId, duration_ms: duration,
      total_findings: findings.length,
      auto_healed: findings.filter(f => f.auto_healed).length,
      needs_attention: findings.filter(f => !f.auto_healed && f.severity !== 'INFO').length,
      findings, timings,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('Sentinel error:', error)
    if (runId) {
      await supabase.from('sentinel_runs').update({
        completed_at: new Date().toISOString(), duration_ms: Date.now() - startTime,
        error: (error as Error).message,
      }).eq('id', runId).catch(() => {})
    }
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
