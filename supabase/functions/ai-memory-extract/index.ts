import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getEmbedding(text: string): Promise<number[] | null> {
  const key = Deno.env.get('OPENAI_API_KEY')
  if (!key) return null
  try {
    const r = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
    })
    const d = await r.json()
    return d?.data?.[0]?.embedding || null
  } catch { return null }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
    const { conversation_id, agent_id, user_id } = await req.json()
    if (!conversation_id || !agent_id || !user_id) return new Response(JSON.stringify({ error: 'Missing fields' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: messages } = await supabase.from('ai_messages').select('role, content, created_at').eq('conversation_id', conversation_id).order('created_at', { ascending: true })
    if (!messages || messages.length < 2) return new Response(JSON.stringify({ extracted: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const { data: existingMemories } = await supabase.from('ai_agent_memory').select('content').eq('agent_id', agent_id).eq('is_active', true).order('created_at', { ascending: false }).limit(100)
    const existingContents = (existingMemories || []).map((m: any) => m.content).join('\n---\n')
    const convText = messages.map((m: any) => `${m.role}: ${m.content}`).join('\n\n')

    const extractionPrompt = `You are a memory extraction system for an AI agent. Analyze this conversation and extract ONLY information worth remembering long-term.\n\nExtract: Facts, Decisions, Preferences, Warnings, Context, Task Results.\nRules: Single self-contained statements. Specific and concrete. importance 8-10 for critical, 5-7 for useful, 1-4 for minor. is_pinned=true for foundational facts.\n\nExisting memories (do not duplicate):\n${existingContents.substring(0, 3000)}\n\nRespond with ONLY a JSON array. Example:\n[{"content": "The GitHub repo is luxor-creek/viaxo", "memory_type": "fact", "category": "infrastructure", "importance": 9, "is_pinned": true, "tags": ["github", "repo"]}]`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: `${extractionPrompt}\n\n---CONVERSATION---\n${convText.substring(0, 6000)}` }] }),
    })
    if (!claudeRes.ok) throw new Error(`Claude API ${claudeRes.status}`)

    const claudeData = await claudeRes.json()
    let memories: any[] = []
    try { memories = JSON.parse((claudeData.content?.[0]?.text || '[]').replace(/```json\n?|```\n?/g, '').trim()) } catch { return new Response(JSON.stringify({ extracted: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
    if (!Array.isArray(memories) || !memories.length) return new Response(JSON.stringify({ extracted: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    let saved = 0, dupes = 0
    for (const mem of memories) {
      const embedding = await getEmbedding(mem.content)
      if (embedding) {
        const { data: existingId } = await supabase.rpc('deduplicate_memory', { p_agent_id: agent_id, p_new_content: mem.content, p_new_embedding: JSON.stringify(embedding), p_similarity_threshold: 0.90 })
        if (existingId) { dupes++; await supabase.from('ai_agent_memory').update({ content: mem.content, importance: Math.max(mem.importance || 5, 5), updated_at: new Date().toISOString(), tags: mem.tags || [] }).eq('id', existingId); continue }
      }
      const { error } = await supabase.from('ai_agent_memory').insert({ agent_id, user_id, memory_type: mem.memory_type || 'fact', category: mem.category || 'general', content: mem.content, importance: mem.importance || 5, is_pinned: mem.is_pinned || false, tags: mem.tags || [], source_conversation_id: conversation_id, embedding: embedding ? JSON.stringify(embedding) : null })
      if (!error) saved++
    }

    if (messages.length >= 6) {
      const sumRes = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, messages: [{ role: 'user', content: `Summarize this conversation as JSON: {summary, key_facts[], decisions_made[], open_questions[]}. ONLY JSON.\n\n${convText.substring(0, 5000)}` }] }) })
      if (sumRes.ok) {
        try {
          const sumObj = JSON.parse((await sumRes.json()).content?.[0]?.text?.replace(/```json\n?|```\n?/g, '').trim())
          await supabase.from('ai_conversation_summaries').insert({ conversation_id, agent_id, user_id, summary: sumObj.summary, key_facts: sumObj.key_facts || [], decisions_made: sumObj.decisions_made || [], open_questions: sumObj.open_questions || [], message_count: messages.length })
        } catch {}
      }
    }

    return new Response(JSON.stringify({ extracted: saved, duplicates_updated: dupes, total_candidates: memories.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})