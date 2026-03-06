# Viaxo AI Team — Project Context

> Last updated: February 18, 2026
> Owner: Paul (paul@kickervideo.com)
> Repo: github.com/luxor-creek/viaxo-venture-studio
> Live: https://viaxo.netlify.app

---

## 1. What This Is

Viaxo is a project management platform with an embedded AI team — eight autonomous agents that act as virtual employees. Each agent has a distinct role, personality, persistent memory, and access to real tools (GitHub, Netlify, database, web search, video production, etc.).

The AI team replaces a previous Lindy.ai integration. Unlike Lindy, the agents are fully custom, operate inside the Viaxo workspace, and share a persistent memory system with vector-based retrieval. Agents can delegate tasks to each other via the delegate_to_agent tool.

Viaxo also offers **deployable chat widgets** — embeddable AI support agents that can be placed on any external website with custom branding, knowledge bases, and agent names.

---

## 2. The AI Team

| Agent | Role | Model | Provider | Slug |
|-------|------|-------|----------|------|
| Dave | CTO | claude-sonnet-4-20250514 | Anthropic | dave |
| Marnie | CMO | llama-3.3-70b-versatile | Groq | marnie |
| Sadie | Social Media Manager | llama-3.1-8b-instant | Groq | sadie |
| Luna | Customer Service Lead | llama-3.3-70b-versatile | Groq | luna |
| Nathan | Lead Generation | llama-3.3-70b-versatile | Groq | nathan |
| Mistol | Project Lead | deepseek-chat (V3) | DeepSeek | mistol |
| Emmy | Video Creator | deepseek-chat (V3) | DeepSeek | emmy |
| Sentinel | System Guardian | — (runs natively in Postgres) | None | sentinel |

Dave runs on Claude (smartest, most expensive). Mistol and Emmy run on DeepSeek V3 (cost-effective, capable). The others run on Groq/Llama for speed and cost efficiency. Default model for new agents is DeepSeek V3. Sentinel runs entirely in Postgres — no LLM calls needed.

### Mistol — Persistent Project Lead

Mistol has a dual role:
1. **Project creation** — Helps users create and structure new projects
2. **Project oversight** — When chatting inside a project, reviews tasks, deadlines, stalled items, agent progress. Flags blockers, overdue items, suggests next steps.

Mistol is always available in every project via the **"Ask Mistol"** button at the top of the project view, regardless of which agents are assigned to the project.

### Sentinel — System Guardian (v3)

Sentinel monitors the health of the entire AI team automatically. It does NOT use an LLM — all logic runs as native SQL functions inside Postgres.

**What it checks every 15 minutes:**
- Cost monitoring — warns at $5/day, critical at $20/day, with trend comparison
- Error detection — groups edge function errors by type, flags recurring bugs
- Stuck task detection — kills tasks stuck >30 minutes
- Memory cleanup — prunes old low-importance memories when agents exceed 1,000
- Agent auto-disable — pauses agents with 5+ consecutive task failures
- Budget tracking — warns at 80%, critical at 95%

**How it runs:**
- `pg_cron` calls `SELECT sentinel_run_scan()` every 15 minutes — pure SQL, no HTTP
- Daily report at 6 AM UTC via edge function (for markdown formatting)
- Weekly cleanup (Sundays 5 AM UTC) deletes monitoring data >90 days old
- All thresholds are configurable via the `sentinel_config` table

**Key design:** Sentinel was originally an edge function invoked via HTTP, but pg_net's HTTP client proved unreliable for cron-triggered edge function calls (consistent crashes on cold start). The scan logic was moved to a native Postgres function (`sentinel_run_scan()`) which completes in ~18-300ms and runs reliably every time.

Agent personality prompts and HITL (Human-In-The-Loop) criteria are stored in the **ai_agents** database table (`personality_prompt` and `hitl_criteria` columns), not hardcoded in the edge function.

Each agent has two modes:
- **Chat mode**: Conversational — answer questions, brainstorm, review work
- **Autonomous mode**: Execute end-to-end tasks with tool use, work logging, and escalation

---

## 3. Architecture

### Infrastructure
- **Frontend**: React (Vite + JSX), Tailwind CSS, deployed on Netlify
- **Backend**: Supabase (Postgres + Edge Functions + Auth + RLS + Storage)
- **AI Routing**: Edge function handles multi-model routing (Anthropic, Groq, DeepSeek APIs)
- **Embeddings**: OpenAI text-embedding-3-small (1536 dimensions) for memory search
- **Secrets Management**: Supabase Vault (encrypted at rest) for API keys and auth tokens
- **Source Control**: GitHub (luxor-creek/viaxo-venture-studio)
- **Deploy Pipeline**: GitHub → Netlify auto-deploy

### Supabase Project
- **Project ID**: mzqjivtidadjaawmlslz
- **URL**: https://mzqjivtidadjaawmlslz.supabase.co
- **Region**: us-east-2
- **Storage**: `assets` bucket (public) — hosts widget.js for embeddable chat

### Edge Functions

| Function | Version | Purpose |
|----------|---------|---------|
| **ai-chat** | v47 | Main agent endpoint. Auth, agent lookup, memory, multi-model LLM, streaming SSE, tool execution, delegation, message storage, auto memory extraction. |
| **ai-memory-extract** | v14 | Extracts facts/decisions/preferences from conversations, deduplicates (92% threshold), generates summaries for 6+ message conversations. |
| **widget-chat** | v3 | Public chat endpoint for embeddable widgets. Auth via widget API key (no JWT). Supports DeepSeek, Anthropic, Groq. |
| **agent-sentinel** | v11 | Sentinel edge function — used for manual invocations and daily reports. Authenticated via x-sentinel-key header (vault-stored secret). Cron scans use the SQL function instead. |
| **check-integrations** | v3 | Returns live connection status of all API integrations. |
| **manage-integrations** | v2 | Test API keys, save/toggle/delete integrations. Stores keys in Vault. |
| **manage-agent-tools** | v9 | Updates agent tool assignments in the database. |
| **agent-settings** | v8 | Updates agent model/provider settings. |
| **github-proxy** | v8 | Proxies GitHub API calls through edge function. |
| **github-helper** | v7 | GitHub operations for Dave. |
| **test-mike-apis** | v5 | Test endpoint for verifying API keys. |

All edge functions have `verify_jwt: false` — auth is handled internally via Bearer token, API key, or custom header.

### Scheduled Jobs (pg_cron)

| Job | Schedule | Command |
|-----|----------|---------|
| sentinel-scan | Every 15 min | `SELECT sentinel_run_scan()` |
| sentinel-daily-report | 6 AM UTC daily | HTTP POST to agent-sentinel edge function (mode: report) |
| sentinel-weekly-cleanup | Sundays 5 AM UTC | `SELECT sentinel_cleanup_old_data()` |

### Supabase Edge Function Secrets
- ANTHROPIC_API_KEY, OPENAI_API_KEY, GROQ_API_KEY, DEEPSEEK_API_KEY
- ELEVENLABS_API_KEY, PEXELS_API_KEY, PIXABAY_API_KEY, SHOTSTACK_API_KEY
- GITHUB_PAT / GITHUB_PAT_NEW, GITHUB_REPO

### Vault Secrets
- sentinel_auth_key — Shared secret for authenticating sentinel edge function invocations
- GITHUB_PAT, GITHUB_PAT_NEW, DEEPSEEK_API_KEY

---

## 4. Security Posture

A comprehensive security audit was performed on February 18, 2026. Five critical vulnerabilities were identified and fixed:

### Vulnerabilities Fixed

1. **Sentinel SQL functions exposed to anon role** — All 13 sentinel functions were callable by anyone with the public anon key. **Fix:** `REVOKE ALL FROM PUBLIC` + `GRANT EXECUTE TO service_role` on all sentinel functions.

2. **Sentinel tables exposed to anon role** — sentinel_config, sentinel_metrics, sentinel_alerts, sentinel_runs, edge_function_errors were all readable/writable by anonymous users. **Fix:** RLS enabled with no anon/authenticated policies. Service_role bypasses RLS.

3. **Core agent tables exposed to anon role** — ai_agents, ai_agent_tasks, ai_agent_memory, ai_agent_notifications had full CRUD grants to anon. **Fix:** Revoked INSERT, UPDATE, DELETE from anon on all core tables.

4. **Edge function unauthenticated** — agent-sentinel accepted requests from anyone. **Fix:** Custom auth via x-sentinel-key header checked against a vault-stored secret.

5. **No input validation on destructive functions** — Kill tasks with timeout=0, prune memories with max_importance=10 could wipe all data. **Fix:** Parameter guards added (min timeout 5 min, max importance cap 7, min age 7 days).

### Additional Hardening
- **Mutable search_path fixed** — All SECURITY DEFINER functions now have `SET search_path TO 'public'`
- **Sentinel self-protection** — Database trigger prevents Sentinel's `is_paused` from being set to true
- **Column-level revokes** — Direct UPDATE on `is_paused` and `health_score` revoked from anon/authenticated
- **Data retention** — Weekly cleanup cron deletes sentinel data >90 days old

---

## 5. Database Schema

### AI Tables

**ai_agents** — Agent definitions (8 rows including Sentinel)
- id, slug, name, title, role, avatar_emoji, color, personality_prompt, hitl_criteria, tools (jsonb), model_provider, model_name, temperature, is_active, health_score, is_paused, paused_reason, paused_at, require_approval, allow_page_edits, allow_external_apis, created_at, updated_at

**ai_conversations** — Chat sessions (user_id, agent_id, project_id, title, status, search_text)

**ai_messages** — Messages (conversation_id, role, content, target_agent_id, search_text)

**ai_agent_memory** — Persistent memory with vector embeddings (1536 dimensions)

**ai_agent_tasks** — Task tracking for autonomous mode

**ai_agent_work_log** — Step-by-step audit trail during autonomous tasks

**ai_agent_notifications** — Notifications and escalations to the user

**ai_agent_delegations** — Inter-agent delegation records (depth-limited to 3)

**ai_agent_credentials** — Stored credentials for agent integrations

### Sentinel Tables

**sentinel_config** — Configurable thresholds (key-value, editable without redeploy)

**sentinel_metrics** — Time-series data recorded every scan

**sentinel_alerts** — Deduplicated alerts with fingerprinting and escalation levels (1-3)

**sentinel_runs** — Audit trail of every scan (duration_ms, findings, error)

**edge_function_errors** — Error logs from all edge functions

### Operations Tables

**llm_call_log** — Every LLM API call (provider, model, tokens, cost, duration)

**account_token_budgets** — Daily token budget tracking ($200/day default)

**projects** — User projects (with soft-delete)

**integrations** — User integration configs

### Chat Widget Tables

**chat_widgets** — Widget configurations (api_key, agent_name, prompt, knowledge_base, FAQs)

**widget_conversations** / **widget_messages** — Visitor chat sessions (no auth)

### Key Database Functions

**Sentinel:** sentinel_run_scan(), sentinel_system_health_v2(), sentinel_agent_scorecard_v2(), sentinel_error_summary(), sentinel_kill_stuck_tasks(), sentinel_prune_memories(), sentinel_auto_disable_agents(), sentinel_check_alert(), sentinel_record_metrics(), sentinel_cleanup_old_data()

**Memory:** search_agent_memories, get_recent_agent_memories, get_agent_memory_context, deduplicate_memory

**Operations:** check_and_update_budget(), record_token_usage()

---

## 6. Agent Tools

**Dave (CTO)**: save_memory, search_memory, web_search, log_work, escalate, delegate_to_agent, update_project_status, update_task_status

**Marnie (CMO)**: save_memory, search_memory, web_search, create_social_post, send_email, log_work, escalate, delegate_to_agent, update_project_status, update_task_status

**Sadie (Social Media)**: save_memory, search_memory, web_search, create_social_post, log_work, escalate, delegate_to_agent

**Luna (Customer Service)**: save_memory, search_memory, web_search, query_tickets, create_faq, query_database, manage_credentials, escalate, log_work, delegate_to_agent, update_project_status, update_task_status

**Nathan (Lead Gen)**: save_memory, search_memory, web_search, create_lead, update_lead, search_leads, send_email, log_work, escalate, delegate_to_agent

**Mistol (Project Lead)**: save_memory, search_memory, log_work, delegate_to_agent, update_project_status, update_task_status, escalate, web_search

**Emmy (Video Creator)**: save_memory, search_memory, web_search, search_stock_video, search_stock_music, generate_voiceover, render_video, log_work, escalate, delegate_to_agent, update_project_status, update_task_status

Tool execution loop: LLM requests tool → edge function executes → result sent back → LLM decides next action. Max iterations: 30 (Emmy auto) / 10 (auto) / 15 (Emmy chat) / 5 (chat).

---

## 7. Memory System

1. **Auto-extraction**: After every chat, ai-memory-extract saves facts/decisions/preferences with embeddings
2. **Deduplication**: >90% cosine similarity → update existing instead of creating duplicate
3. **Retrieval**: Pinned (50) + semantic matches (15, threshold 0.45) + recent (10) injected into prompt
4. **Summaries**: Generated for 6+ message conversations. Last 10 loaded into context
5. **Pinned memories**: Always loaded regardless of semantic relevance
6. **Auto-pruning**: Sentinel prunes memories >90 days old with importance ≤4 when agent exceeds 1,000

---

## 8. Chat Widget System

Deploy AI chat agents on external websites via embeddable widgets.

1. Create widget in Settings → Chat Widgets
2. Each widget gets: unique API key (wk_...), independent conversations, isolated knowledge
3. Embed: `<script src="https://mzqjivtidadjaawmlslz.supabase.co/storage/v1/object/public/assets/widget.js" data-widget-key="wk_YOUR_KEY"></script>`
4. Public endpoint: `widget-chat` edge function (no JWT needed)

---

## 9. Guardrails (ai-chat)

| Guardrail | Value |
|-----------|-------|
| Input char cap | 12,000 |
| Output token cap (chat) | 800 |
| Output token cap (autonomous) | 1,200 |
| Max delegation depth | 3 |
| Rate limit | 10 seconds between messages |
| Daily message cap | 30 |
| Daily token budget | $200 |

---

## 10. Current Status

### Working
- All 8 agents with models, prompts, HITL criteria
- Sentinel system guardian — scanning every 15 min, auto-healing, daily reports
- Full security audit completed — all critical vulnerabilities fixed
- Multi-model routing (Anthropic/Groq/DeepSeek/OpenAI)
- Memory system (save/search/deduplicate/extract/pin/auto-prune)
- Streaming SSE, autonomous mode, delegation
- Emmy video production (Pexels/ElevenLabs/Pixabay/Shotstack)
- Chat widget system
- Budget enforcement ($200/day)

### Not Yet Built
- Guard module (prompt injection defense) — dev plan complete
- Multi-agent orchestration (Mistol routing to multiple agents)
- Workflow builder (visual)
- Full GitHub/Netlify tool wiring for Dave
- File upload in chat
- Widget analytics + conversation viewer

---

## 11. Guard Module (Planned)

Prompt injection defense system. Dev plan completed February 18, 2026. See `guard-module-dev-plan.md`.

**Four defense layers:** Heuristic input scanner (<5ms, every message) → LLM classifier (flagged messages only) → Output scanner (response validation) → Action gate (destructive action checkpoint).

**Key threat:** Delegation chain attacks — compromised agent injects malicious instructions into delegations to other agents. Guard scans all delegation content.

**Phased rollout:** Week 1 monitor-only → Week 2 blocking + classifier → Week 3 output scanner → Week 4 memory poisoning defense.

---

## 12. Links

- **Supabase**: https://supabase.com/dashboard/project/mzqjivtidadjaawmlslz
- **GitHub**: https://github.com/luxor-creek/viaxo-venture-studio
- **Live Site**: https://viaxo.netlify.app
