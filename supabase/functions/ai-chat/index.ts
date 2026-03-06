import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AgentTool {
  name: string
  description: string
  input_schema: Record<string, unknown>
}

const MAX_DELEGATION_DEPTH = 3

const GUARDRAILS = {
  INPUT_CHAR_CAP: 12000,
  OUTPUT_TOKEN_CAP: 800,
  MEMO_OUTPUT_CAP: 1000,
  AUTONOMOUS_OUTPUT_CAP: 1200,
  DELEGATION_OUTPUT_CAP: 800,
  MAX_HISTORY_USER: 6,
  MAX_HISTORY_ASSISTANT: 5,
  RATE_LIMIT_SECONDS: 10,
  DAILY_MESSAGE_CAP: 30,
  FIRST_30_DAYS_CAP: 400,
}

const VALID_REASON_CODES = new Set([
  'scoped_answer', 'clarify_objective', 'next_steps', 'midpoint_summary',
  'diagnostic_memo', 'final_review_summary', 'rewrite_for_tone',
  'delegation_task', 'autonomous_task', 'tool_followup',
])

const TEMPLATE_RESPONSES: Record<string, string> = {
  redirect_off_topic: "I'm focused on helping with your project tasks. Could you rephrase that as something I can help with?",
  usage_cap_message: "You've reached your usage limit. Your limits reset automatically — check back soon.",
  rate_limited: "Please wait a few seconds before sending another message.",
  input_too_long: "That message is too long. Please keep it under 2,000 characters.",
  budget_blocked: "Your token budget has been reached for this period. No worries — it resets automatically.",
}

function checkDeterministicPath(message: string, _mode: string): string | null {
  const lower = message.trim().toLowerCase()

  if (!lower || lower.length === 0) return "Could you say more? I need a bit more to go on."

  // Allow single numbers/letters through — users select numbered options this way
  if (/^\d+$/.test(lower)) return null // Numeric option selection → needs LLM

  if (/^(hi|hey|hello|yo|sup|what'?s up|howdy)\s*[!.?]*$/i.test(lower)) {
    return "Hey! What can I help you with today?"
  }

  if (/^(thanks|thank you|thx|ty|bye|goodbye|see ya|later)\s*[!.?]*$/i.test(lower)) {
    return "You're welcome! Let me know if you need anything else."
  }

  return null // Needs LLM
}

// ═══ LOCAL ANSWER LAYER ═══
// Answers questions from local data (project info, tasks, memories, docs) without calling LLM
// Returns null if the question requires LLM reasoning
async function tryLocalAnswer(
  message: string,
  ctx: { supabase: any; userId: string; agentId: string; agentName: string; uniqueMemories: any[]; pastSummaries: any[] }
): Promise<string | null> {
  const lower = message.toLowerCase().replace(/[[\](){}]/g, '').trim()

  // Skip if message contains project context prefix (first message) — let LLM handle the full intro
  if (lower.includes('[project context]')) return null
  // Skip if message is a command/request (action words)
  if (/\b(please|can you|could you|create|make|build|write|update|change|fix|deploy|send|draft|help me|do |set up)\b/i.test(lower)) return null
  // Skip if message contains group chat prefix
  if (lower.includes('[group chat')) return null
  // Skip complex multi-sentence messages
  if (message.split(/[.!?]/).filter(s => s.trim()).length > 2) return null

  // ── Pattern: Project status / deadline / info ──
  // These are answered from the project context already embedded in the conversation
  // The frontend sends [Project Context] on first message, so we check memories instead

  // ── Pattern: Task queries ──
  if (/\b(what|which|list|show|how many)\b.*\b(task|tasks|todo|to-do|assigned|doing)\b/i.test(lower) ||
      /\btask(s)?\b.*\b(status|list|assigned)\b/i.test(lower)) {
    // Extract project ID from recent memory context if available
    const projectMemory = ctx.uniqueMemories.find((m: any) => m.category === 'project' || m.content?.includes('project'))
    if (!projectMemory) return null

    // Try to answer from memories about tasks
    const taskMemories = ctx.uniqueMemories.filter((m: any) =>
      m.category === 'task' || m.memory_type === 'task_result' ||
      m.content?.toLowerCase().includes('task')
    )
    if (taskMemories.length > 0) {
      return `Based on what I know:\n\n${taskMemories.map((m: any) => `• ${m.content}`).join('\n')}\n\nWant me to check for the latest updates?`
    }
    return null
  }

  // ── Pattern: "What did we decide / discuss / talk about" ──
  if (/\b(what|when) did (we|you|i)\b.*\b(decide|discuss|talk|say|agree|mention)\b/i.test(lower) ||
      /\b(recap|summary|summarize|catch me up|what happened)\b/i.test(lower)) {
    const summaries = ctx.pastSummaries || []
    const decisionMemories = ctx.uniqueMemories.filter((m: any) =>
      m.memory_type === 'decision' || m.memory_type === 'fact'
    )

    if (summaries.length > 0 || decisionMemories.length > 0) {
      let answer = ''
      if (decisionMemories.length > 0) {
        answer += 'Key decisions and facts I recall:\n\n'
        answer += decisionMemories.slice(0, 5).map((m: any) => `• ${m.content}`).join('\n')
      }
      if (summaries.length > 0) {
        if (answer) answer += '\n\n'
        answer += 'From our recent conversations:\n\n'
        answer += summaries.slice(0, 2).map((s: any) => `• ${s.summary}`).join('\n')
        const allDecisions = summaries.flatMap((s: any) => s.decisions_made || [])
        if (allDecisions.length > 0) {
          answer += '\n\nDecisions made:\n' + allDecisions.slice(0, 5).map((d: string) => `• ${d}`).join('\n')
        }
      }
      return answer
    }
    return null
  }

  // ── Pattern: "Do you remember / what do you know about X" ──
  if (/\b(do you remember|do you know|what do you know|tell me what you know)\b/i.test(lower)) {
    // Extract the topic after "about"
    const aboutMatch = lower.match(/about\s+(.+)/)
    const topic = aboutMatch ? aboutMatch[1] : lower.replace(/^.*\b(remember|know)\b\s*/, '')
    if (topic) {
      const relevant = ctx.uniqueMemories.filter((m: any) =>
        m.content?.toLowerCase().includes(topic.trim())
      )
      if (relevant.length > 0) {
        return `Here's what I know about that:\n\n${relevant.slice(0, 5).map((m: any) => `• ${m.content}`).join('\n')}`
      }
    }
    return null
  }

  // ── Pattern: "Who is on the team / project" ──
  if (/\b(who|which agents?|team members?|who'?s)\b.*\b(team|project|assigned|working|involved)\b/i.test(lower)) {
    const teamMemories = ctx.uniqueMemories.filter((m: any) =>
      m.category === 'team_assignment' || m.content?.toLowerCase().includes('assigned') ||
      m.content?.toLowerCase().includes('team')
    )
    if (teamMemories.length > 0) {
      return `From what I know about the team:\n\n${teamMemories.slice(0, 5).map((m: any) => `• ${m.content}`).join('\n')}`
    }
    return null
  }

  return null // Couldn't answer locally → needs LLM
}

function trimContext(messages: any[]): any[] {
  if (messages.length <= 3) return messages

  const userMsgs: any[] = []
  const assistantMsgs: any[] = []

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role === 'user' && userMsgs.length < GUARDRAILS.MAX_HISTORY_USER) userMsgs.unshift(m)
    else if (m.role === 'assistant' && assistantMsgs.length < GUARDRAILS.MAX_HISTORY_ASSISTANT) assistantMsgs.unshift(m)
  }

  const trimmed: any[] = []
  let ui = 0, ai = 0
  for (const m of messages) {
    if (m.role === 'user' && userMsgs.includes(m)) { trimmed.push(m); ui++ }
    else if (m.role === 'assistant' && assistantMsgs.includes(m)) { trimmed.push(m); ai++ }
  }

  return trimmed.length > 0 ? trimmed : messages.slice(-3)
}

function estimateInputTokens(systemPrompt: string, messages: any[], tools: any[]): number {
  let chars = systemPrompt.length
  for (const m of messages) {
    if (typeof m.content === 'string') chars += m.content.length
    else if (Array.isArray(m.content)) chars += JSON.stringify(m.content).length
  }
  chars += JSON.stringify(tools).length
  return Math.ceil(chars / 4) // rough estimate
}

async function callLLM(
  provider: string, modelName: string, systemPrompt: string,
  messages: any[], tools: any[], maxTokens: number, temperature: number = 0.7
): Promise<{ content: any[]; stop_reason?: string; usage?: { input_tokens: number; output_tokens: number } }> {
  if (provider === 'groq' || provider === 'deepseek') {
    const isDeepSeek = provider === 'deepseek'
    const API_KEY = isDeepSeek ? Deno.env.get('DEEPSEEK_API_KEY') : Deno.env.get('GROQ_API_KEY')
    const BASE_URL = isDeepSeek ? 'https://api.deepseek.com/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions'
    if (!API_KEY) throw new Error(`${provider.toUpperCase()}_API_KEY not configured`)

    const groqMessages: any[] = [{ role: 'system', content: systemPrompt }]
    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        groqMessages.push({ role: msg.role, content: msg.content })
      } else if (Array.isArray(msg.content)) {
        if (msg.role === 'user' && msg.content[0]?.type === 'tool_result') {
          for (const tr of msg.content) {
            groqMessages.push({ role: 'tool', tool_call_id: tr.tool_use_id, content: tr.content })
          }
        } else if (msg.role === 'assistant') {
          const tp = msg.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n')
          const tc = msg.content.filter((c: any) => c.type === 'tool_use').map((t: any) => ({
            id: t.id, type: 'function', function: { name: t.name, arguments: JSON.stringify(t.input) }
          }))
          const am: any = { role: 'assistant' }
          if (tp) am.content = tp
          if (tc.length) am.tool_calls = tc
          groqMessages.push(am)
        }
      }
    }

    const groqBody: any = { model: modelName, messages: groqMessages, max_tokens: maxTokens, temperature }
    if (tools.length > 0) {
      groqBody.tools = tools.map((t: any) => ({
        type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema }
      }))
      groqBody.tool_choice = 'auto'
    }

    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
      body: JSON.stringify(groqBody),
    })
    if (!res.ok) throw new Error(`${provider} API ${res.status}: ${await res.text()}`)
    const data = await res.json()
    const choice = data.choices?.[0]
    if (!choice) throw new Error('No response from Groq')

    const content: any[] = []
    if (choice.message?.content) content.push({ type: 'text', text: choice.message.content })
    if (choice.message?.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        content.push({ type: 'tool_use', id: tc.id, name: tc.function.name, input: JSON.parse(tc.function.arguments || '{}') })
      }
    }
    return { content, stop_reason: choice.finish_reason, usage: { input_tokens: data.usage?.prompt_tokens || 0, output_tokens: data.usage?.completion_tokens || 0 } }
  } else {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
    if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

    const body: any = { model: modelName, max_tokens: maxTokens, system: systemPrompt, messages, temperature }
    if (tools.length > 0) body.tools = tools.map((t: any) => ({ name: t.name, description: t.description, input_schema: t.input_schema }))

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return { content: data.content || [], stop_reason: data.stop_reason, usage: { input_tokens: data.usage?.input_tokens || 0, output_tokens: data.usage?.output_tokens || 0 } }
  }
}

async function callLLMStreamAnthropic(
  modelName: string, systemPrompt: string, messages: any[], tools: any[],
  maxTokens: number, onTextChunk: (chunk: string) => void, temperature: number = 0.7
): Promise<{ content: any[]; stop_reason?: string; usage?: { input_tokens: number; output_tokens: number } }> {
  const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured')

  const body: any = { model: modelName, max_tokens: maxTokens, system: systemPrompt, messages, stream: true, temperature }
  if (tools.length > 0) body.tools = tools.map((t: any) => ({ name: t.name, description: t.description, input_schema: t.input_schema }))

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Claude API ${res.status}: ${await res.text()}`)

  const content: any[] = []
  let stopReason = ''
  let currentBlock: any = null
  let inputJsonBuf = ''
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let usageIn = 0, usageOut = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const evt = JSON.parse(data)
        switch (evt.type) {
          case 'message_start':
            if (evt.message?.usage) usageIn = evt.message.usage.input_tokens || 0
            break
          case 'content_block_start':
            if (evt.content_block.type === 'text') {
              currentBlock = { type: 'text', text: '' }
            } else if (evt.content_block.type === 'tool_use') {
              currentBlock = { type: 'tool_use', id: evt.content_block.id, name: evt.content_block.name, input: {} }
              inputJsonBuf = ''
            }
            break
          case 'content_block_delta':
            if (evt.delta.type === 'text_delta' && currentBlock?.type === 'text') {
              currentBlock.text += evt.delta.text
              onTextChunk(evt.delta.text)
            } else if (evt.delta.type === 'input_json_delta' && currentBlock?.type === 'tool_use') {
              inputJsonBuf += evt.delta.partial_json
            }
            break
          case 'content_block_stop':
            if (currentBlock) {
              if (currentBlock.type === 'tool_use') {
                try { currentBlock.input = JSON.parse(inputJsonBuf || '{}') } catch { currentBlock.input = {} }
              }
              content.push(currentBlock)
              currentBlock = null
            }
            break
          case 'message_delta':
            if (evt.delta?.stop_reason) stopReason = evt.delta.stop_reason
            if (evt.usage) usageOut = evt.usage.output_tokens || 0
            break
        }
      } catch { /* skip parse errors */ }
    }
  }

  return { content, stop_reason: stopReason, usage: { input_tokens: usageIn, output_tokens: usageOut } }
}

async function callLLMStreamGroq(
  modelName: string, systemPrompt: string, messages: any[], tools: any[],
  maxTokens: number, onTextChunk: (chunk: string) => void, temperature: number = 0.7,
  provider: string = 'groq'
): Promise<{ content: any[]; stop_reason?: string; usage?: { input_tokens: number; output_tokens: number } }> {
  const isDeepSeek = provider === 'deepseek'
  const API_KEY = isDeepSeek ? Deno.env.get('DEEPSEEK_API_KEY') : Deno.env.get('GROQ_API_KEY')
  const BASE_URL = isDeepSeek ? 'https://api.deepseek.com/chat/completions' : 'https://api.groq.com/openai/v1/chat/completions'
  if (!API_KEY) throw new Error(`${provider.toUpperCase()}_API_KEY not configured`)

  const groqMessages: any[] = [{ role: 'system', content: systemPrompt }]
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      groqMessages.push({ role: msg.role, content: msg.content })
    } else if (Array.isArray(msg.content)) {
      if (msg.role === 'user' && msg.content[0]?.type === 'tool_result') {
        for (const tr of msg.content) {
          groqMessages.push({ role: 'tool', tool_call_id: tr.tool_use_id, content: tr.content })
        }
      } else if (msg.role === 'assistant') {
        const tp = msg.content.filter((c: any) => c.type === 'text').map((c: any) => c.text).join('\n')
        const tc = msg.content.filter((c: any) => c.type === 'tool_use').map((t: any) => ({
          id: t.id, type: 'function', function: { name: t.name, arguments: JSON.stringify(t.input) }
        }))
        const am: any = { role: 'assistant' }
        if (tp) am.content = tp
        if (tc.length) am.tool_calls = tc
        groqMessages.push(am)
      }
    }
  }

  const groqBody: any = { model: modelName, messages: groqMessages, max_tokens: maxTokens, temperature, stream: true }
  if (tools.length > 0) {
    groqBody.tools = tools.map((t: any) => ({
      type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema }
    }))
    groqBody.tool_choice = 'auto'
  }

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify(groqBody),
  })
  if (!res.ok) throw new Error(`${provider} API ${res.status}: ${await res.text()}`)

  let textContent = ''
  const toolCallsMap: Record<number, { id: string; name: string; args: string }> = {}
  let finishReason = ''
  const reader = res.body!.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let usageData = { input_tokens: 0, output_tokens: 0 }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6).trim()
      if (data === '[DONE]') continue
      try {
        const evt = JSON.parse(data)
        const delta = evt.choices?.[0]?.delta
        if (!delta) {
          if (evt.usage) {
            usageData = { input_tokens: evt.usage.prompt_tokens || 0, output_tokens: evt.usage.completion_tokens || 0 }
          }
          continue
        }
        if (delta.content) { textContent += delta.content; onTextChunk(delta.content) }
        if (delta.tool_calls) {
          for (const tc of delta.tool_calls) {
            if (!toolCallsMap[tc.index]) toolCallsMap[tc.index] = { id: tc.id || '', name: '', args: '' }
            if (tc.id) toolCallsMap[tc.index].id = tc.id
            if (tc.function?.name) toolCallsMap[tc.index].name = tc.function.name
            if (tc.function?.arguments) toolCallsMap[tc.index].args += tc.function.arguments
          }
        }
        if (evt.choices?.[0]?.finish_reason) finishReason = evt.choices[0].finish_reason
      } catch { /* skip */ }
    }
  }

  const content: any[] = []
  if (textContent) content.push({ type: 'text', text: textContent })
  for (const idx of Object.keys(toolCallsMap).map(Number).sort()) {
    const tc = toolCallsMap[idx]
    content.push({ type: 'tool_use', id: tc.id, name: tc.name, input: JSON.parse(tc.args || '{}') })
  }

  return { content, stop_reason: finishReason, usage: usageData }
}

function callLLMStream(
  provider: string, modelName: string, systemPrompt: string, messages: any[], tools: any[],
  maxTokens: number, onTextChunk: (chunk: string) => void, temperature: number = 0.7
): Promise<{ content: any[]; stop_reason?: string; usage?: { input_tokens: number; output_tokens: number } }> {
  if (provider === 'groq' || provider === 'deepseek') return callLLMStreamGroq(modelName, systemPrompt, messages, tools, maxTokens, onTextChunk, temperature, provider)
  else return callLLMStreamAnthropic(modelName, systemPrompt, messages, tools, maxTokens, onTextChunk, temperature)
}

function getToolDefinitions(agentTools: string[]): AgentTool[] {
  const allTools: Record<string, AgentTool> = {
    search_memory: { name: 'search_memory', description: 'Search your persistent memory for relevant information.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    save_memory: { name: 'save_memory', description: 'Save important information to persistent memory.', input_schema: { type: 'object', properties: { content: { type: 'string' }, memory_type: { type: 'string', enum: ['fact', 'preference', 'decision', 'project', 'relationship'] }, category: { type: 'string' }, importance: { type: 'number' } }, required: ['content', 'memory_type', 'category'] } },
    update_memory: { name: 'update_memory', description: 'Update an existing memory with new content. Use when information has changed or a previous memory is outdated. Provide a search term to find the memory to update.', input_schema: { type: 'object', properties: { search_term: { type: 'string', description: 'Text to search for in existing memories to find the one to update' }, new_content: { type: 'string', description: 'The updated content to replace the old memory' }, importance: { type: 'number' } }, required: ['search_term', 'new_content'] } },
    delete_memory: { name: 'delete_memory', description: 'Delete an outdated or incorrect memory. Use when information is no longer true or relevant. Provide a search term to find the memory to delete.', input_schema: { type: 'object', properties: { search_term: { type: 'string', description: 'Text to search for in existing memories to find the one to delete' } }, required: ['search_term'] } },
    web_search: { name: 'web_search', description: 'Search the web for current information.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    send_slack: { name: 'send_slack', description: 'Post a message to the user\'s Slack channel. Use for important updates, completed tasks, escalations, or anything the user should see in Slack.', input_schema: { type: 'object', properties: { title: { type: 'string', description: 'Bold headline for the Slack message' }, message: { type: 'string', description: 'The message body (supports Slack markdown: *bold*, _italic_, `code`)' }, notification_type: { type: 'string', enum: ['info', 'task_complete', 'escalation', 'deploy', 'warning'], description: 'Type affects the icon shown' } }, required: ['title', 'message'] } },
    log_work: { name: 'log_work', description: 'Log a completed work item or progress update.', input_schema: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, status: { type: 'string', enum: ['completed', 'in_progress', 'blocked', 'stalled'] } }, required: ['title', 'description'] } },
    create_deliverable: { name: 'create_deliverable', description: 'Create a deliverable for user review. Use this instead of pasting long content in chat. The deliverable appears in the task view with a review status. ALWAYS use this for: marketing plans, social posts, scripts, lead lists, email drafts, reports, technical specs, video outputs, or any work product the user needs to review/approve/edit.', input_schema: { type: 'object', properties: { title: { type: 'string', description: 'Descriptive title e.g. "Q2 Marketing Plan" or "Instagram Carousel — Feb Launch"' }, deliverable_type: { type: 'string', enum: ['document', 'social_post', 'video', 'spreadsheet', 'email_draft', 'lead_list', 'code_review', 'script', 'other'] }, content: { type: 'string', description: 'The full content in markdown (for docs), JSON (for structured data), or CSV (for lead lists). Use markdown formatting for documents.' }, file_url: { type: 'string', description: 'URL to a rendered file (video URL from Shotstack, etc). Only for binary files.' }, file_type: { type: 'string', description: 'File extension: md, csv, mp4, pdf, json' }, task_id: { type: 'string', description: 'Task ID to attach this deliverable to (optional)' }, project_id: { type: 'string', description: 'Project ID to attach this deliverable to (optional)' }, metadata: { type: 'object', description: 'Extra data: { platform: "instagram", thumbnail_url: "...", recipients: [...] }' } }, required: ['title', 'deliverable_type', 'content'] } },
    update_deliverable: { name: 'update_deliverable', description: 'Update an existing deliverable with a new version. Use when user requests revisions. Creates a new version linked to the original.', input_schema: { type: 'object', properties: { deliverable_id: { type: 'string', description: 'ID of the deliverable to revise' }, content: { type: 'string', description: 'Updated content' }, file_url: { type: 'string', description: 'Updated file URL (for re-rendered videos etc)' }, revision_notes: { type: 'string', description: 'What changed in this version' } }, required: ['deliverable_id', 'content'] } },
    check_deliverable_status: { name: 'check_deliverable_status', description: 'Check the review status of your deliverables. See if work was approved, has revision notes, or is still pending.', input_schema: { type: 'object', properties: { deliverable_id: { type: 'string', description: 'Specific deliverable ID to check (optional — omit to see all recent)' } }, required: [] } },
    escalate: { name: 'escalate', description: 'Escalate an issue that requires human attention.', input_schema: { type: 'object', properties: { reason: { type: 'string' }, severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] } }, required: ['reason', 'severity'] } },
    create_lead: { name: 'create_lead', description: 'Create a new lead in the CRM.', input_schema: { type: 'object', properties: { name: { type: 'string' }, email: { type: 'string' }, company: { type: 'string' }, notes: { type: 'string' } }, required: ['name'] } },
    update_lead: { name: 'update_lead', description: 'Update an existing lead.', input_schema: { type: 'object', properties: { lead_id: { type: 'string' }, status: { type: 'string' }, notes: { type: 'string' } }, required: ['lead_id'] } },
    search_leads: { name: 'search_leads', description: 'Search leads by name, email, company, or status.', input_schema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } },
    create_social_post: { name: 'create_social_post', description: 'Create a social media post draft.', input_schema: { type: 'object', properties: { platform: { type: 'string', enum: ['twitter', 'linkedin', 'instagram', 'facebook'] }, content: { type: 'string' }, scheduled_for: { type: 'string' } }, required: ['platform', 'content'] } },
    update_project_status: {
      name: 'update_project_status',
      description: 'Update project status.',
      input_schema: { type: 'object', properties: { project_id: { type: 'string' }, status: { type: 'string', enum: ['todo', 'in_progress', 'stalled', 'needs_approval', 'done'] }, reason: { type: 'string' } }, required: ['project_id', 'status'] }
    },
    update_task_status: {
      name: 'update_task_status',
      description: 'Update task status.',
      input_schema: { type: 'object', properties: { task_id: { type: 'string' }, status: { type: 'string', enum: ['Todo', 'In Progress', 'Stalled', 'Needs Approval', 'Completed'] }, reason: { type: 'string' } }, required: ['task_id', 'status'] }
    },
    send_email: { name: 'send_email', description: 'Draft and send an email.', input_schema: { type: 'object', properties: { to: { type: 'string' }, subject: { type: 'string' }, body: { type: 'string' }, lead_id: { type: 'string' } }, required: ['to', 'subject', 'body'] } },
    delegate_to_agent: {
      name: 'delegate_to_agent',
      description: 'Delegate task to another agent.',
      input_schema: {
        type: 'object',
        properties: {
          target_agent_slug: { type: 'string' },
          task: { type: 'string' },
          context: { type: 'string' },
        },
        required: ['target_agent_slug', 'task'],
      },
    },
    search_stock_footage: {
      name: 'search_stock_footage',
      description: 'Search Pexels for stock video/images.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          media_type: { type: 'string', enum: ['video', 'photo'] },
          orientation: { type: 'string', enum: ['landscape', 'portrait', 'square'] },
          per_page: { type: 'number' },
          min_duration: { type: 'number' },
          max_duration: { type: 'number' },
        },
        required: ['query'],
      },
    },
    search_stock_music: {
      name: 'search_stock_music',
      description: 'Search Pixabay for background music.',
      input_schema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          min_duration: { type: 'number' },
        },
        required: ['query'],
      },
    },
    generate_voiceover: {
      name: 'generate_voiceover',
      description: 'Generate voiceover via ElevenLabs TTS.',
      input_schema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          voice: { type: 'string', enum: ['mike-viaxo', 'adam', 'antoni', 'arnold', 'bill', 'brian', 'charlie', 'chris', 'daniel', 'george', 'james', 'laura', 'lily', 'rachel', 'sarah'] },
          voice_id: { type: 'string' },
          model: { type: 'string', enum: ['eleven_multilingual_v2', 'eleven_turbo_v2_5', 'eleven_v3'] },
          stability: { type: 'number' },
          similarity_boost: { type: 'number' },
          scene_index: { type: 'number' },
          video_project_id: { type: 'string' },
        },
        required: ['text'],
      },
    },
    build_video_timeline: {
      name: 'build_video_timeline',
      description: 'Build Shotstack video timeline. Min 600s.',
      input_schema: {
        type: 'object',
        properties: {
          video_project_id: { type: 'string' },
          scenes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                scene_index: { type: 'number' },
                title: { type: 'string' },
                duration: { type: 'number' },
                visual_type: { type: 'string', enum: ['video', 'image'] },
                visual_url: { type: 'string' },
                visual_trim: { type: 'number' },
                voiceover_url: { type: 'string' },
                text_overlay: { type: 'string' },
                effect: { type: 'string', enum: ['zoomIn', 'zoomOut', 'slideLeft', 'slideRight', 'slideUp', 'slideDown'] },
                transition: { type: 'string', enum: ['fade', 'dissolve', 'wipeLeft', 'wipeRight', 'slideLeft', 'slideRight', 'carouselLeft', 'carouselRight'] },
              },
              required: ['scene_index', 'duration', 'visual_type', 'visual_url'],
            },
          },
          music_url: { type: 'string' },
          music_volume: { type: 'number' },
          resolution: { type: 'string', enum: ['sd', 'hd', '1080'] },
        },
        required: ['video_project_id', 'scenes'],
      },
    },
    render_video: {
      name: 'render_video',
      description: 'Submit timeline to Shotstack for rendering.',
      input_schema: {
        type: 'object',
        properties: {
          video_project_id: { type: 'string' },
        },
        required: ['video_project_id'],
      },
    },
    check_render_status: {
      name: 'check_render_status',
      description: 'Check Shotstack render status.',
      input_schema: {
        type: 'object',
        properties: {
          video_project_id: { type: 'string' },
          render_id: { type: 'string' },
        },
        required: ['video_project_id'],
      },
    },
    create_project_tasks: {
      name: 'create_project_tasks',
      description: 'Create multiple tasks for a project. Use this after the user approves your suggested task plan. Each task needs a title, and optionally a description, priority, deadline, and assigned agent slug.',
      input_schema: {
        type: 'object',
        properties: {
          project_id: { type: 'string', description: 'The project UUID to create tasks for' },
          tasks: {
            type: 'array',
            description: 'Array of tasks to create',
            items: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string', enum: ['Low', 'Medium', 'High'] },
                deadline: { type: 'string', description: 'ISO date string' },
                assigned_agent: { type: 'string', description: 'Agent slug (dave, luna, marnie, sadie, nathan, emmy, mistol)' },
              },
              required: ['title'],
            },
          },
        },
        required: ['project_id', 'tasks'],
      },
    },
    create_video_project: {
      name: 'create_video_project',
      description: 'Create a new video project record. Must be called before build_video_timeline or render_video. Returns the video project ID needed for subsequent video tools.',
      input_schema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Title of the video project' },
          description: { type: 'string', description: 'Description of the video' },
          target_duration_seconds: { type: 'number', description: 'Target duration in seconds (default 600 = 10min)' },
        },
        required: ['title'],
      },
    },
  }
  return agentTools.filter(t => allTools[t]).map(t => allTools[t])
}

// ═══ DELEGATION SMART ROUTING ═══
// Intercepts data-lookup delegations and answers from DB without LLM.
// Only passes through to full LLM when the task requires judgment/reasoning.
async function tryDelegationDataLookup(
  task: string, targetSlug: string, ctx: { supabase: any; userId: string }
): Promise<string | null> {
  const lower = task.toLowerCase()
  const { supabase, userId } = ctx

  // ── Pattern: Task/status queries ──
  if (/\b(what|which|list|show|how many|status|open|pending|overdue)\b.*\b(task|tasks|ticket|tickets|todo|assigned)\b/i.test(lower) ||
      /\btask(s)?\b.*\b(status|list|assigned|open|pending)\b/i.test(lower)) {
    const { data: tasks } = await supabase.from('tasks')
      .select('title, status, assigned_agent, deadline')
      .eq('user_id', userId).limit(20)
    if (tasks?.length) {
      return `Current tasks (${tasks.length}):\n\n` + tasks.map((t: any) =>
        `• [${t.status}] ${t.title}${t.assigned_agent ? ` → ${t.assigned_agent}` : ''}${t.deadline ? ` (due: ${t.deadline})` : ''}`
      ).join('\n')
    }
    return 'No tasks found.'
  }

  // ── Pattern: Project status/info queries ──
  if (/\b(what|which|list|show|status|update)\b.*\b(project|projects)\b/i.test(lower) ||
      /\bproject(s)?\b.*\b(status|list|progress|deadline)\b/i.test(lower)) {
    const { data: projects } = await supabase.from('projects')
      .select('name, status, deadline, description')
      .eq('user_id', userId).limit(10)
    if (projects?.length) {
      return `Projects (${projects.length}):\n\n` + projects.map((p: any) =>
        `• ${p.name} [${p.status || 'active'}]${p.deadline ? ` — due: ${p.deadline}` : ''}${p.description ? `\n  ${p.description.substring(0, 100)}` : ''}`
      ).join('\n')
    }
    return 'No projects found.'
  }

  // ── Pattern: Customer/ticket lookups (Luna's domain) ──
  if (targetSlug === 'luna' && /\b(ticket|tickets|customer|support|open|pending|complaint)\b/i.test(lower)) {
    const { data: tickets } = await supabase.from('support_tickets')
      .select('subject, status, priority, customer_name, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(15)
      .then((r: any) => r).catch(() => ({ data: null }))
    if (tickets?.length) {
      return `Support tickets (${tickets.length}):\n\n` + tickets.map((t: any) =>
        `• [${t.status}/${t.priority}] ${t.subject} — ${t.customer_name || 'Unknown'}`
      ).join('\n')
    }
    // Table might not exist yet — fall through to LLM
    return null
  }

  // ── Pattern: Lead/prospect lookups (Nathan's domain) ──
  if (targetSlug === 'nathan' && /\b(lead|leads|prospect|pipeline|outreach|campaign)\b.*\b(list|show|status|how many|count)\b/i.test(lower)) {
    const { data: leads } = await supabase.from('leads')
      .select('name, company, status, score, created_at')
      .eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      .then((r: any) => r).catch(() => ({ data: null }))
    if (leads?.length) {
      return `Leads (${leads.length}):\n\n` + leads.map((l: any) =>
        `• ${l.name}${l.company ? ` @ ${l.company}` : ''} [${l.status}] score: ${l.score || 'N/A'}`
      ).join('\n')
    }
    return null
  }

  // ── Pattern: Memory/knowledge lookups ("what do we know about X") ──
  if (/\b(what do (we|you) know|what.*remember|check.*memory|look up|find.*info)\b/i.test(lower)) {
    const topic = lower.replace(/^.*\b(know about|remember about|look up|find info on|check.*about)\b\s*/i, '').trim()
    if (topic && topic.length > 2) {
      const { data: memories } = await supabase.rpc('search_memories', {
        p_agent_id: null, p_user_id: userId, p_query: topic, p_limit: 10,
      }).then((r: any) => r).catch(() => ({ data: null }))
      if (memories?.length) {
        return `Here's what we know about "${topic}":\n\n` + memories.map((m: any) =>
          `• [${m.memory_type}/${m.category}] ${m.content}`
        ).join('\n')
      }
    }
    return null
  }

  // ── Pattern: Simple factual lookups that don't need reasoning ──
  if (/^(how many|count|total|what is the|what are the|list all|show all|get all)\b/i.test(lower) &&
      !/\b(should|would|could|recommend|suggest|think|decide|strategy|plan|approach|opinion|best way)\b/i.test(lower)) {
    // This looks like a pure data query, but we don't have a specific handler.
    // Check agent memories for an answer
    const { data: targetAgentRow } = await supabase.from('ai_agents').select('id').eq('slug', targetSlug).single()
    if (targetAgentRow) {
      const { data: memories } = await supabase.rpc('search_memories', {
        p_agent_id: targetAgentRow.id, p_user_id: userId, p_query: task, p_limit: 5,
      }).then((r: any) => r).catch(() => ({ data: null }))
      if (memories?.length >= 2) {
        return `From ${targetSlug}'s knowledge:\n\n` + memories.map((m: any) =>
          `• ${m.content}`
        ).join('\n')
      }
    }
    return null // Not enough data — needs LLM
  }

  // No data-lookup pattern matched → requires LLM judgment
  return null
}

async function executeDelegation(
  toolInput: Record<string, unknown>,
  ctx: { supabase: any; agentId: string; userId: string; conversationId: string; taskId?: string; delegationDepth: number; guardrails?: any }
): Promise<string> {
  const { supabase, agentId, userId, conversationId, delegationDepth } = ctx
  const { target_agent_slug, task, context: delegationContext } = toolInput as { target_agent_slug: string; task: string; context?: string }

  if (delegationDepth >= MAX_DELEGATION_DEPTH) {
    return `Delegation rejected: max depth (${MAX_DELEGATION_DEPTH}) reached. Handle this task directly or ask the user for help.`
  }

  const { data: targetAgent, error: taErr } = await supabase
    .from('ai_agents').select('*').eq('slug', target_agent_slug).single()
  if (taErr || !targetAgent) return `Error: Agent "${target_agent_slug}" not found.`

  if (targetAgent.id === agentId) return 'Error: Cannot delegate to yourself.'

  // ═══ SMART ROUTING LAYER ═══
  // Before spinning up an LLM call, check if this delegation is a data lookup
  // that can be answered directly from the DB without using tokens.
  const dataAnswer = await tryDelegationDataLookup(task, target_agent_slug, { supabase, userId })
  if (dataAnswer) {
    // Log as zero-cost delegation
    await supabase.from('ai_agent_delegations').insert({
      requesting_agent_id: agentId, target_agent_id: targetAgent.id, user_id: userId,
      source_conversation_id: conversationId, task, context: delegationContext || null,
      status: 'completed', delegation_depth: delegationDepth + 1,
      result: dataAnswer, started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
    }).then(r => r).catch(() => {})

    await supabase.rpc('record_token_usage', {
      p_user_id: userId, p_agent_id: targetAgent.id, p_conversation_id: conversationId,
      p_reason_code: 'delegation_data_lookup', p_model_provider: 'none', p_model_name: 'local',
      p_tokens_in: 0, p_tokens_out: 0, p_mode: 'delegation', p_was_cached: true,
    }).then(r => r).catch(() => {})

    return `[Data from ${targetAgent.name} (${targetAgent.title})]\n\n${dataAnswer}`
  }
  // ═══ END SMART ROUTING — falls through to full LLM delegation ═══

  const { data: requestingAgent } = await supabase
    .from('ai_agents').select('name, slug').eq('id', agentId).single()

  const { data: delegation, error: delErr } = await supabase
    .from('ai_agent_delegations').insert({
      requesting_agent_id: agentId,
      target_agent_id: targetAgent.id,
      user_id: userId,
      source_conversation_id: conversationId,
      task,
      context: delegationContext || null,
      status: 'in_progress',
      delegation_depth: delegationDepth + 1,
      started_at: new Date().toISOString(),
    }).select('id').single()
  if (delErr) return `Delegation error: ${delErr.message}`

  try {
    const targetProvider = targetAgent.model_provider || 'anthropic'
    const targetModel = targetAgent.model_name || 'claude-sonnet-4-20250514'
    const targetTemp = targetAgent.temperature ?? 0.7

    let targetSystemPrompt = targetAgent.personality_prompt || `You are ${targetAgent.name}, ${targetAgent.title}. You are a skilled professional at Viaxo. Be thorough, concise, and action-oriented in completing delegated tasks.`
    targetSystemPrompt += `\n\n## DELEGATION CONTEXT\nYou have been delegated a task by ${requestingAgent?.name || 'another agent'} (${requestingAgent?.slug || 'unknown'}).\nTask: ${task}`
    if (delegationContext) targetSystemPrompt += `\nContext: ${delegationContext}`
    targetSystemPrompt += '\n\nComplete this task thoroughly and return your results. Be concise but complete.'

    const { data: memories } = await supabase.rpc('search_memories', {
      p_agent_id: targetAgent.id, p_user_id: userId, p_query: task, p_limit: 5
    }).then(r => r).catch(() => ({ data: null }))
    if (memories?.length) {
      targetSystemPrompt += '\n\n## Relevant Memories\n' + memories.map((m: any) => `- [${m.memory_type}] ${m.content}`).join('\n')
    }

    const targetTools = getToolDefinitions(targetAgent.tools || [])
    const llmMessages = [{ role: 'user', content: task }]

    let finalResponse = ''
    let toolUseCount = 0
    const MAX_ITERATIONS = 5

    while (toolUseCount < MAX_ITERATIONS) {
      const startTime = Date.now()
      const result = await callLLM(targetProvider, targetModel, targetSystemPrompt, llmMessages, targetTools, GUARDRAILS.DELEGATION_OUTPUT_CAP, targetTemp)
      const duration = Date.now() - startTime
      const content = result.content

      await supabase.rpc('record_token_usage', {
        p_user_id: userId, p_agent_id: targetAgent.id, p_conversation_id: conversationId,
        p_reason_code: 'delegation_task', p_model_provider: targetProvider, p_model_name: targetModel,
        p_tokens_in: result.usage?.input_tokens || estimateInputTokens(targetSystemPrompt, llmMessages, targetTools),
        p_tokens_out: result.usage?.output_tokens || 0,
        p_mode: 'delegation', p_duration_ms: duration,
      }).then(r => r).catch(() => {})

      const toolUses = content.filter((c: any) => c.type === 'tool_use')
      const textBlocks = content.filter((c: any) => c.type === 'text')

      if (toolUses.length === 0) {
        finalResponse = textBlocks.map((t: any) => t.text).join('\n')
        break
      }

      llmMessages.push({ role: 'assistant', content })
      const toolResults = []
      for (const tu of toolUses) {
        const r = await executeTool(tu.name, tu.input, {
          supabase, agentId: targetAgent.id, userId, conversationId,
          taskId: ctx.taskId, delegationDepth: delegationDepth + 1,
          guardrails: { require_approval: targetAgent.require_approval ?? true, allow_page_edits: targetAgent.allow_page_edits ?? true, allow_external_apis: targetAgent.allow_external_apis ?? true },
        })
        toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: r })
      }
      llmMessages.push({ role: 'user', content: toolResults })
      toolUseCount++
      if (textBlocks.length) finalResponse += textBlocks.map((t: any) => t.text).join('\n')
    }

    await supabase.from('ai_agent_delegations').update({
      status: 'completed',
      result: finalResponse.substring(0, 10000),
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', delegation.id)

    return `[Delegation to ${targetAgent.name} (${targetAgent.title}) completed]\n\n${finalResponse}`

  } catch (err) {
    await supabase.from('ai_agent_delegations').update({
      status: 'failed',
      error_message: (err as Error).message,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq('id', delegation.id)

    return `Delegation to ${target_agent_slug} failed: ${(err as Error).message}`
  }
}

async function executeTool(
  toolName: string, toolInput: Record<string, unknown>,
  ctx: { supabase: any; agentId: string; userId: string; conversationId: string; taskId?: string; delegationDepth: number; guardrails?: { require_approval: boolean; allow_page_edits: boolean; allow_external_apis: boolean } }
): Promise<string> {
  const { supabase, agentId, userId, conversationId } = ctx
  const guardrails = ctx.guardrails || { require_approval: true, allow_page_edits: true, allow_external_apis: true }

  // ═══ GUARDRAIL ENFORCEMENT ═══
  const EXTERNAL_API_TOOLS = ['web_search', 'github_read_file', 'github_list_files', 'github_create_branch', 'github_create_or_update_file', 'github_create_pull_request', 'netlify_trigger_deploy', 'netlify_get_deploys', 'execute_migration', 'query_database', 'render_video', 'check_render_status', 'build_video_timeline', 'search_stock_footage', 'search_stock_music', 'generate_voiceover', 'create_outreach', 'manage_leads']
  const PAGE_EDIT_TOOLS = ['update_project_status', 'update_task_status', 'create_project_tasks']

  if (!guardrails.allow_external_apis && EXTERNAL_API_TOOLS.includes(toolName)) {
    return `⚠️ External API calls are disabled for this agent. The "${toolName}" tool requires external API access. Ask Paul to enable "Allow External API Calls" in agent settings.`
  }
  if (!guardrails.allow_page_edits && PAGE_EDIT_TOOLS.includes(toolName)) {
    return `⚠️ Page edits are disabled for this agent. The "${toolName}" tool requires page edit permission. Ask Paul to enable "Allow Page Edits" in agent settings.`
  }

  // Approval enforcement: in autonomous mode, destructive actions need approval
  const APPROVAL_REQUIRED_TOOLS = ['github_create_or_update_file', 'github_create_pull_request', 'netlify_trigger_deploy', 'execute_migration', 'render_video', 'create_outreach', 'create_project_tasks']
  if (guardrails.require_approval && APPROVAL_REQUIRED_TOOLS.includes(toolName)) {
    // Create an escalation notification so the user can approve
    await supabase.from('ai_agent_notifications').insert({
      user_id: userId, agent_id: agentId, task_id: ctx.taskId || null,
      notification_type: 'escalation',
      title: `Approval needed: ${toolName}`,
      message: `I need your approval to execute "${toolName}" with: ${JSON.stringify(toolInput).substring(0, 500)}`,
      options: JSON.stringify([{ label: 'Approve', value: 'approve' }, { label: 'Deny', value: 'deny' }]),
    }).then(r => r).catch(() => {})
    return `⏸️ This action requires approval. I've sent a notification requesting permission to execute "${toolName}". Waiting for Paul to approve.`
  }

  try {
    switch (toolName) {
      case 'delegate_to_agent':
        return await executeDelegation(toolInput, ctx)

      case 'search_memory': {
        const { data } = await supabase.rpc('search_memories', {
          p_agent_id: agentId, p_user_id: userId, p_query: toolInput.query, p_limit: 5,
        })
        if (!data?.length) return 'No memories found for that query.'
        return data.map((m: any) => `[${m.memory_type}/${m.category}] (imp: ${m.importance}) ${m.content}`).join('\n')
      }

      case 'save_memory': {
        const { error } = await supabase.from('ai_agent_memory').insert({
          agent_id: agentId, user_id: userId, content: toolInput.content,
          memory_type: toolInput.memory_type, category: toolInput.category,
          importance: toolInput.importance || 5, source: 'tool',
        })
        return error ? `Error saving memory: ${error.message}` : 'Memory saved successfully.'
      }

      case 'update_memory': {
        // Find the memory matching the search term
        const { data: matches } = await supabase.from('ai_agent_memory')
          .select('id, content')
          .eq('agent_id', agentId).eq('user_id', userId).eq('is_active', true)
          .ilike('content', `%${toolInput.search_term}%`)
          .limit(1)
        if (!matches || matches.length === 0) return `No memory found matching "${toolInput.search_term}". Try a different search term, or use save_memory to create a new one.`
        const oldMemory = matches[0]
        // Mark old as superseded and create new
        await supabase.from('ai_agent_memory').update({ is_active: false, superseded_by: null }).eq('id', oldMemory.id)
        const { data: newMem, error } = await supabase.from('ai_agent_memory').insert({
          agent_id: agentId, user_id: userId, content: toolInput.new_content,
          memory_type: 'fact', category: 'updated', importance: toolInput.importance || 7,
          source: 'tool',
        }).select('id').single()
        if (error) return `Error updating memory: ${error.message}`
        // Link superseded_by
        await supabase.from('ai_agent_memory').update({ superseded_by: newMem.id }).eq('id', oldMemory.id)
        return `Memory updated. Old: "${oldMemory.content.substring(0, 80)}..." → New: "${toolInput.new_content.substring(0, 80)}..."`
      }

      case 'delete_memory': {
        const { data: matches } = await supabase.from('ai_agent_memory')
          .select('id, content')
          .eq('agent_id', agentId).eq('user_id', userId).eq('is_active', true)
          .ilike('content', `%${toolInput.search_term}%`)
          .limit(1)
        if (!matches || matches.length === 0) return `No memory found matching "${toolInput.search_term}".`
        const mem = matches[0]
        // Don't delete system seeds — just deactivate
        await supabase.from('ai_agent_memory').update({ is_active: false }).eq('id', mem.id)
        return `Memory deleted: "${mem.content.substring(0, 100)}..."`
      }

      case 'web_search': {
        const query = toolInput.query as string
        const res = await fetch(`https://api.tavily.com/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ api_key: Deno.env.get('TAVILY_API_KEY'), query, max_results: 5 }),
        })
        if (!res.ok) return `Web search failed: ${res.status}`
        const data = await res.json()
        return (data.results || []).map((r: any) => `${r.title}\n${r.url}\n${r.content?.substring(0, 300)}`).join('\n\n')
      }

      case 'send_slack': {
        // Get agent info for the Slack message
        const { data: agentRow } = await supabase.from('ai_agents').select('slug, name').eq('id', agentId).single()
        const slackRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/slack-notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
          body: JSON.stringify({
            user_id: userId,
            agent_slug: agentRow?.slug || 'mistol',
            agent_name: agentRow?.name || 'Viaxo',
            notification_type: toolInput.notification_type || 'info',
            title: toolInput.title,
            message: toolInput.message,
          }),
        })
        if (!slackRes.ok) {
          const errText = await slackRes.text()
          return `Slack message failed: ${errText}`
        }
        const result = await slackRes.json()
        if (result.skipped) return 'Slack is not configured for this user. They can set it up in Settings → Integrations → Slack.'
        return `Slack message sent: "${toolInput.title}"`
      }

      case 'create_deliverable': {
        const { data: agentRow } = await supabase.from('ai_agents').select('slug, name').eq('id', agentId).single()
        const isVideo = toolInput.deliverable_type === 'video'
        const expiresAt = isVideo ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null

        // Auto-create a task if none provided and none in context
        let linkedTaskId = toolInput.task_id || ctx.taskId || null
        let linkedProjectId = toolInput.project_id || null

        if (!linkedTaskId) {
          // Create a task for this deliverable so it shows up in the task board
          const { data: newTask, error: taskErr } = await supabase.from('tasks').insert({
            title: toolInput.title,
            description: `Deliverable created by ${agentRow?.name || 'agent'}: ${toolInput.deliverable_type}`,
            status: 'Needs Approval',
            assigned_agent: agentRow?.slug || null,
            user_id: userId,
            project_id: linkedProjectId,
          }).select('id, project_id').single()

          if (!taskErr && newTask) {
            linkedTaskId = newTask.id
            if (!linkedProjectId && newTask.project_id) linkedProjectId = newTask.project_id
          }
        } else {
          // Update existing task to Needs Approval
          await supabase.from('tasks').update({
            status: 'Needs Approval', updated_at: new Date().toISOString(),
          }).eq('id', linkedTaskId).then(r => r).catch(() => {})
        }

        const { data: deliverable, error: delErr } = await supabase.from('agent_deliverables').insert({
          agent_id: agentId,
          user_id: userId,
          conversation_id: conversationId,
          task_id: linkedTaskId,
          project_id: linkedProjectId,
          title: toolInput.title,
          deliverable_type: toolInput.deliverable_type,
          content: toolInput.content,
          file_url: toolInput.file_url || null,
          file_type: toolInput.file_type || (toolInput.deliverable_type === 'document' ? 'md' : toolInput.deliverable_type === 'lead_list' ? 'csv' : toolInput.deliverable_type === 'video' ? 'mp4' : 'md'),
          status: 'needs_review',
          version: 1,
          expires_at: expiresAt,
          metadata: toolInput.metadata || {},
        }).select('id').single()

        if (delErr) return `Failed to create deliverable: ${delErr.message}`

        // Create notification with task link
        await supabase.from('ai_agent_notifications').insert({
          user_id: userId, agent_id: agentId,
          notification_type: 'needs_approval',
          title: `📎 Deliverable ready: ${toolInput.title}`,
          message: `${agentRow?.name || 'Agent'} has created a ${toolInput.deliverable_type} for your review. Open the task "${toolInput.title}" to view, edit, and approve.${isVideo ? '\n\n⏰ This video file will be available for 14 days — download it before then.' : ''}`,
          task_id: linkedTaskId || null,
        }).then(r => r).catch(() => {})

        let response = `✅ Deliverable created: "${toolInput.title}" (${toolInput.deliverable_type})\n`
        response += `📋 Status: Needs Approval\n`
        response += `🔗 Task: ${linkedTaskId || 'none'}\n`
        response += `📎 Deliverable ID: ${deliverable.id}\n\n`
        response += `The user has been notified and can find this in their task board under "${toolInput.title}". They can open it to preview, edit, export to Word/Google Docs, and approve or request revisions.`
        if (isVideo) response += '\n\n⏰ This video file will be available for 14 days. A reminder will be sent on day 13.'
        return response
      }

      case 'update_deliverable': {
        // Get original deliverable
        const { data: original, error: origErr } = await supabase.from('agent_deliverables')
          .select('*')
          .eq('id', toolInput.deliverable_id)
          .single()
        if (origErr || !original) return `Deliverable not found: ${toolInput.deliverable_id}`

        const isVideo = original.deliverable_type === 'video'
        const newExpiresAt = isVideo ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString() : null

        // Create new version
        const { data: newVersion, error: newErr } = await supabase.from('agent_deliverables').insert({
          agent_id: agentId,
          user_id: userId,
          conversation_id: conversationId,
          task_id: original.task_id,
          project_id: original.project_id,
          title: original.title,
          deliverable_type: original.deliverable_type,
          content: toolInput.content,
          file_url: toolInput.file_url || original.file_url,
          file_type: original.file_type,
          status: 'needs_review',
          version: original.version + 1,
          parent_deliverable_id: original.id,
          expires_at: newExpiresAt,
          metadata: { ...original.metadata, revision_notes: toolInput.revision_notes || null, previous_version: original.id },
        }).select('id').single()

        if (newErr) return `Failed to create revision: ${newErr.message}`

        // Mark old version as superseded
        await supabase.from('agent_deliverables')
          .update({ status: 'revision_requested', updated_at: new Date().toISOString() })
          .eq('id', original.id)

        // Notify
        await supabase.from('ai_agent_notifications').insert({
          user_id: userId, agent_id: agentId,
          notification_type: 'needs_approval',
          title: `📎 Revision ready: ${original.title} (v${original.version + 1})`,
          message: `Updated based on your feedback.${toolInput.revision_notes ? ` Changes: ${toolInput.revision_notes}` : ''}`,
          task_id: original.task_id || null,
        }).then(r => r).catch(() => {})

        return `Revision created: "${original.title}" v${original.version + 1} — status: Needs Review. New ID: ${newVersion.id}`
      }

      case 'check_deliverable_status': {
        if (toolInput.deliverable_id) {
          const { data, error } = await supabase.from('agent_deliverables')
            .select('id, title, deliverable_type, status, version, review_notes, expires_at, created_at, agent_id')
            .eq('id', toolInput.deliverable_id)
            .single()
          if (error || !data) return 'Deliverable not found.'
          // Get agent name for context
          const { data: delAgent } = await supabase.from('ai_agents').select('name, slug').eq('id', data.agent_id).single()
          let result = `"${data.title}" by ${delAgent?.name || 'unknown'} (${data.deliverable_type} v${data.version})\nStatus: ${data.status}`
          if (data.review_notes) result += `\nReview notes: ${data.review_notes}`
          if (data.expires_at) result += `\nExpires: ${new Date(data.expires_at).toLocaleDateString()}`
          return result
        }

        // Check if this is Mistol — she gets cross-team visibility
        const { data: selfAgent } = await supabase.from('ai_agents').select('slug').eq('id', agentId).single()
        const isMistol = selfAgent?.slug === 'mistol'

        let query = supabase.from('agent_deliverables')
          .select('id, title, deliverable_type, status, version, review_notes, created_at, agent_id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)

        // Non-Mistol agents only see their own deliverables
        if (!isMistol) {
          query = query.eq('agent_id', agentId)
        }

        const { data: recent } = await query
        if (!recent?.length) return isMistol ? 'No deliverables found across any agent.' : 'No deliverables found.'

        // For Mistol, group by agent and include agent names
        if (isMistol) {
          const agentIds = [...new Set(recent.map((d: any) => d.agent_id))]
          const { data: agentNames } = await supabase.from('ai_agents').select('id, name, slug').in('id', agentIds)
          const nameMap: Record<string, string> = {}
          for (const a of (agentNames || [])) nameMap[a.id] = a.name

          const needsReview = recent.filter((d: any) => d.status === 'needs_review')
          const revisionRequested = recent.filter((d: any) => d.status === 'revision_requested')
          const approved = recent.filter((d: any) => d.status === 'approved')
          const other = recent.filter((d: any) => !['needs_review', 'revision_requested', 'approved'].includes(d.status))

          let result = `Team deliverables overview (${recent.length} total):\n`
          if (needsReview.length) {
            result += `\n📋 NEEDS REVIEW (${needsReview.length}):\n` + needsReview.map((d: any) =>
              `  • "${d.title}" by ${nameMap[d.agent_id] || '?'} (${d.deliverable_type} v${d.version}) — waiting since ${new Date(d.created_at).toLocaleDateString()}`
            ).join('\n')
          }
          if (revisionRequested.length) {
            result += `\n\n🔄 REVISION REQUESTED (${revisionRequested.length}):\n` + revisionRequested.map((d: any) =>
              `  • "${d.title}" by ${nameMap[d.agent_id] || '?'} — Feedback: ${d.review_notes?.substring(0, 100) || 'none'} | ID: ${d.id}`
            ).join('\n')
          }
          if (approved.length) {
            result += `\n\n✅ APPROVED (${approved.length}):\n` + approved.map((d: any) =>
              `  • "${d.title}" by ${nameMap[d.agent_id] || '?'} (${d.deliverable_type} v${d.version})`
            ).join('\n')
          }
          if (other.length) {
            result += `\n\n📁 OTHER (${other.length}):\n` + other.map((d: any) =>
              `  • "${d.title}" by ${nameMap[d.agent_id] || '?'} — ${d.status}`
            ).join('\n')
          }
          return result
        }

        return recent.map((d: any) =>
          `• "${d.title}" (${d.deliverable_type} v${d.version}) — ${d.status}${d.review_notes ? ` | Notes: ${d.review_notes.substring(0, 100)}` : ''}`
        ).join('\n')
      }

      case 'log_work': {
        const { error } = await supabase.from('ai_work_logs').insert({
          agent_id: agentId, user_id: userId, conversation_id: conversationId,
          task_id: ctx.taskId || null, title: toolInput.title,
          description: toolInput.description, status: toolInput.status || 'completed',
        })
        return error ? `Error logging work: ${error.message}` : `Work logged: ${toolInput.title}`
      }

      case 'escalate': {
        await supabase.from('ai_agent_notifications').insert({
          user_id: userId, agent_id: agentId, task_id: ctx.taskId || null,
          notification_type: 'escalation', title: `Escalation: ${toolInput.reason}`,
          message: `Severity: ${toolInput.severity}\nReason: ${toolInput.reason}`,
        })
        if (ctx.taskId) {
          await supabase.from('ai_agent_tasks').update({
            status: 'stalled', updated_at: new Date().toISOString(),
          }).eq('id', ctx.taskId).then(r => r).catch(() => {})
          await supabase.from('tasks').update({
            status: 'Stalled', updated_at: new Date().toISOString(),
          }).eq('id', ctx.taskId).then(r => r).catch(() => {})
        }
        return `Escalated to user. Severity: ${toolInput.severity}. Reason: ${toolInput.reason}. Task status set to Stalled — waiting for human input.`
      }

      case 'create_lead': {
        const { data, error } = await supabase.from('leads').insert({
          user_id: userId, name: toolInput.name, email: toolInput.email || null,
          company: toolInput.company || null, notes: toolInput.notes || null, status: 'new',
        }).select('id, name').single()
        return error ? `Error creating lead: ${error.message}` : `Lead created: ${data.name} (ID: ${data.id})`
      }

      case 'update_lead': {
        const updates: any = {}
        if (toolInput.status) updates.status = toolInput.status
        if (toolInput.notes) updates.notes = toolInput.notes
        const { error } = await supabase.from('leads').update(updates).eq('id', toolInput.lead_id).eq('user_id', userId)
        return error ? `Error updating lead: ${error.message}` : `Lead ${toolInput.lead_id} updated.`
      }

      case 'search_leads': {
        const { data } = await supabase.from('leads').select('id, name, email, company, status, notes')
          .eq('user_id', userId).or(`name.ilike.%${toolInput.query}%,email.ilike.%${toolInput.query}%,company.ilike.%${toolInput.query}%`)
          .limit(10)
        if (!data?.length) return 'No leads found.'
        return data.map((l: any) => `${l.name} (${l.email || 'no email'}) - ${l.company || 'no company'} - Status: ${l.status}`).join('\n')
      }

      case 'create_social_post': {
        const { data, error } = await supabase.from('social_posts').insert({
          user_id: userId, agent_id: agentId, platform: toolInput.platform,
          content: toolInput.content, scheduled_for: toolInput.scheduled_for || null, status: 'draft',
        }).select('id').single()
        return error ? `Error creating post: ${error.message}` : `Social post drafted for ${toolInput.platform} (ID: ${data.id})`
      }

      case 'send_email': {
        const { error } = await supabase.from('email_drafts').insert({
          user_id: userId, agent_id: agentId, to_address: toolInput.to,
          subject: toolInput.subject, body: toolInput.body, lead_id: toolInput.lead_id || null,
          status: 'draft',
        })
        return error ? `Error drafting email: ${error.message}` : `Email drafted to ${toolInput.to}: "${toolInput.subject}"`
      }

      case 'update_project_status': {
        const { project_id, status, reason } = toolInput as { project_id: string; status: string; reason?: string }
        const { error } = await supabase.from('projects').update({
          status, updated_at: new Date().toISOString(),
        }).eq('id', project_id)
        if (error) return `Error updating project status: ${error.message}`
        if (status === 'stalled') {
          await supabase.from('ai_agent_notifications').insert({
            user_id: userId, agent_id: agentId, task_id: null,
            notification_type: 'stalled', title: `Project stalled — needs your input`,
            message: reason || 'Agent hit a blocker and needs human guidance.',
          }).then(r => r).catch(() => {})
        } else if (status === 'needs_approval') {
          await supabase.from('ai_agent_notifications').insert({
            user_id: userId, agent_id: agentId, task_id: null,
            notification_type: 'needs_approval', title: `Project ready for review`,
            message: reason || 'Agent completed the work and is waiting for your approval.',
          }).then(r => r).catch(() => {})
        }
        return `Project status updated to "${status}".${reason ? ` Reason: ${reason}` : ''}`
      }

      case 'update_task_status': {
        const { task_id, status: taskStatus, reason: taskReason } = toolInput as { task_id: string; status: string; reason?: string }
        const { error } = await supabase.from('tasks').update({
          status: taskStatus, updated_at: new Date().toISOString(),
        }).eq('id', task_id)
        if (error) return `Error updating task status: ${error.message}`
        if (taskStatus === 'Stalled') {
          await supabase.from('ai_agent_notifications').insert({
            user_id: userId, agent_id: agentId, task_id: task_id,
            notification_type: 'stalled', title: `Task stalled — needs your input`,
            message: taskReason || 'Agent hit a blocker and needs human guidance.',
          }).then(r => r).catch(() => {})
        } else if (taskStatus === 'Needs Approval') {
          await supabase.from('ai_agent_notifications').insert({
            user_id: userId, agent_id: agentId, task_id: task_id,
            notification_type: 'needs_approval', title: `Task ready for review`,
            message: taskReason || 'Agent completed the work and is waiting for your approval.',
          }).then(r => r).catch(() => {})
        }
        return `Task status updated to "${taskStatus}".${taskReason ? ` Reason: ${taskReason}` : ''}`
      }

      case 'search_stock_footage': {
        const PEXELS_API_KEY = Deno.env.get('PEXELS_API_KEY')
        if (!PEXELS_API_KEY) return 'PEXELS_API_KEY missing'
        const mediaType = (toolInput.media_type as string) || 'video'
        const orientation = (toolInput.orientation as string) || 'landscape'
        const perPage = Math.min((toolInput.per_page as number) || 5, 15)
        const query = encodeURIComponent(toolInput.query as string)

        let url: string
        if (mediaType === 'video') {
          url = `https://api.pexels.com/videos/search?query=${query}&orientation=${orientation}&per_page=${perPage}&size=medium`
          if (toolInput.min_duration) url += `&min_duration=${toolInput.min_duration}`
          if (toolInput.max_duration) url += `&max_duration=${toolInput.max_duration}`
        } else {
          url = `https://api.pexels.com/v1/search?query=${query}&orientation=${orientation}&per_page=${perPage}`
        }

        const pRes = await fetch(url, { headers: { 'Authorization': PEXELS_API_KEY } })
        if (!pRes.ok) return `Pexels API error: ${pRes.status}`
        const pData = await pRes.json()

        if (mediaType === 'video') {
          const videos = (pData.videos || []).map((v: any) => {
            const hdFile = v.video_files?.find((f: any) => f.quality === 'hd' && f.width >= 1280) || v.video_files?.[0]
            return {
              id: v.id,
              duration: v.duration,
              width: v.width,
              height: v.height,
              url: hdFile?.link || '',
              preview: v.image,
              videographer: v.user?.name || 'Unknown',
            }
          })
          if (!videos.length) return `No stock videos found for "${toolInput.query}". Try a broader search term.`
          return `Found ${videos.length} stock videos for "${toolInput.query}":\n` + videos.map((v: any, i: number) =>
            `${i + 1}. ID: ${v.id} | Duration: ${v.duration}s | ${v.width}x${v.height} | By: ${v.videographer}\n   URL: ${v.url}`
          ).join('\n')
        } else {
          const photos = (pData.photos || []).map((p: any) => ({
            id: p.id, width: p.width, height: p.height,
            url: p.src?.large2x || p.src?.large || p.src?.original,
            photographer: p.photographer,
          }))
          if (!photos.length) return `No stock photos found for "${toolInput.query}". Try a broader search term.`
          return `Found ${photos.length} stock photos for "${toolInput.query}":\n` + photos.map((p: any, i: number) =>
            `${i + 1}. ID: ${p.id} | ${p.width}x${p.height} | By: ${p.photographer}\n   URL: ${p.url}`
          ).join('\n')
        }
      }

      case 'search_stock_music': {
        const PIXABAY_API_KEY = Deno.env.get('PIXABAY_API_KEY')
        if (!PIXABAY_API_KEY) {
          return 'PIXABAY_API_KEY not configured. For now, you can use any direct MP3 URL for background music. Free options:\n- https://cdn.pixabay.com/audio/2024/11/29/audio_e8e1af3a1f.mp3 (Upbeat Corporate)\n- https://cdn.pixabay.com/audio/2024/06/14/audio_25f59fdd06.mp3 (Calm Ambient)\n- https://cdn.pixabay.com/audio/2023/10/30/audio_1825e3da5c.mp3 (Cinematic)\nOr ask the user to provide a music URL.'
        }
        const mQuery = encodeURIComponent(toolInput.query as string)
        const minDur = (toolInput.min_duration as number) || 0
        const mRes = await fetch(`https://pixabay.com/api/?key=${PIXABAY_API_KEY}&q=${mQuery}&media_type=music&min_duration=${minDur}&per_page=5`)
        if (!mRes.ok) return `Pixabay API error: ${mRes.status}`
        const mData = await mRes.json()
        const tracks = (mData.hits || []).map((t: any) => ({
          id: t.id, title: t.tags, duration: t.duration, url: t.audio,
        }))
        if (!tracks.length) return `No music found for "${toolInput.query}". Try broader terms like "ambient", "corporate", "cinematic".`
        return `Found ${tracks.length} music tracks:\n` + tracks.map((t: any, i: number) =>
          `${i + 1}. "${t.title}" | Duration: ${t.duration}s\n   URL: ${t.url}`
        ).join('\n')
      }

      case 'generate_voiceover': {
        const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY')
        if (!ELEVENLABS_API_KEY) return 'ELEVENLABS_API_KEY missing'
        const text = toolInput.text as string
        if (!text || text.length < 10) return 'Error: Voiceover text must be at least 10 characters.'
        const sceneIdx = toolInput.scene_index as number
        const model = (toolInput.model as string) || 'eleven_multilingual_v2'
        const stability = (toolInput.stability as number) ?? 0.5
        const similarityBoost = (toolInput.similarity_boost as number) ?? 0.75

        const voiceMap: Record<string, string> = {
          'mike-viaxo': 'rsjbInfzT1ucuiXvO63I',
          adam: 'pNInz6obpgDQGcFmaJgB',
          antoni: 'ErXwobaYiN019PkySvjV',
          arnold: 'VR6AewLTigWG4xSOukaG',
          bill: 'pqHfZKP75CvOlQylNhV4',
          brian: 'nPczCjzI2devNBz1zQrb',
          charlie: 'IKne3meq5aSn9XLyUdCD',
          chris: 'iP95p4xoKVk53GoZ742B',
          daniel: 'onwK4e9ZLuTAKqWW03F9',
          george: 'JBFqnCBsd6RMkjVDRZzb',
          james: 'ZQe5CZNOzWyzPSCn5a3c',
          laura: 'FGY2WhTYpPnrIDTdsKH5',
          lily: 'pFZP5JQG7iQjIQuC4Bku',
          rachel: '21m00Tcm4TlvDq8ikWAM',
          sarah: 'EXAVITQu4vr4xnSDxMaL',
        }

        const voiceName = (toolInput.voice as string) || 'mike-viaxo'
        const voiceId = (toolInput.voice_id as string) || voiceMap[voiceName] || voiceMap['mike-viaxo']

        const ttsRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': ELEVENLABS_API_KEY,
            'Accept': 'audio/mpeg',
          },
          body: JSON.stringify({
            text,
            model_id: model,
            voice_settings: { stability, similarity_boost: similarityBoost },
          }),
        })
        if (!ttsRes.ok) return `ElevenLabs TTS error: ${ttsRes.status} - ${await ttsRes.text()}`

        const audioBytes = await ttsRes.arrayBuffer()
        const fileName = `voiceover_${Date.now()}_scene${sceneIdx ?? 'x'}.mp3`
        const storagePath = `video-voiceovers/${userId}/${fileName}`

        const { error: upErr } = await supabase.storage
          .from('video-assets')
          .upload(storagePath, audioBytes, { contentType: 'audio/mpeg', upsert: true })

        if (upErr) {
          if (upErr.message?.includes('not found') || upErr.message?.includes('Bucket')) {
            await supabase.storage.createBucket('video-assets', { public: true }).then(r => r).catch(() => {})
            const { error: upErr2 } = await supabase.storage
              .from('video-assets')
              .upload(storagePath, audioBytes, { contentType: 'audio/mpeg', upsert: true })
            if (upErr2) return `Storage upload error: ${upErr2.message}`
          } else {
            return `Storage upload error: ${upErr.message}`
          }
        }

        const { data: urlData } = supabase.storage.from('video-assets').getPublicUrl(storagePath)
        const audioUrl = urlData?.publicUrl || ''

        const wordCount = text.split(/\s+/).length
        const estDuration = Math.ceil((wordCount / 150) * 60)

        if (toolInput.video_project_id) {
          const { data: vp } = await supabase.from('video_projects')
            .select('voiceover_segments').eq('id', toolInput.video_project_id).single()
          const segments = vp?.voiceover_segments || []
          segments.push({ scene_index: sceneIdx ?? segments.length, text: text.substring(0, 200), audio_url: audioUrl, duration: estDuration })
          await supabase.from('video_projects').update({
            voiceover_segments: segments, updated_at: new Date().toISOString(),
          }).eq('id', toolInput.video_project_id)
        }

        return `Voiceover generated successfully (ElevenLabs).\n- Voice: ${voiceName} (${voiceId})\n- Model: ${model}\n- Estimated duration: ${estDuration}s\n- Audio URL: ${audioUrl}\n- Scene: ${sceneIdx ?? 'unassigned'}\n- File size: ${(audioBytes.byteLength / 1024).toFixed(1)}KB`
      }

      case 'build_video_timeline': {
        const vpId = toolInput.video_project_id as string
        const scenes = toolInput.scenes as any[]
        const musicUrl = toolInput.music_url as string
        const musicVol = (toolInput.music_volume as number) ?? 0.15
        const resolution = (toolInput.resolution as string) || 'hd'

        if (!scenes?.length) return 'Error: No scenes provided.'

        const totalDuration = scenes.reduce((sum: number, s: any) => sum + (s.duration || 0), 0)
        if (totalDuration < 580) return `Error: Total duration is only ${totalDuration}s. Must be at least 600s (10 minutes). Add more scenes or increase scene durations.`

        const videoTrackClips: any[] = []
        const textTrackClips: any[] = []
        const voiceTrackClips: any[] = []
        let currentStart = 0

        for (const scene of scenes) {
          const clip: any = {
            start: currentStart,
            length: scene.duration,
            fit: 'cover',
          }

          if (scene.visual_type === 'video') {
            clip.asset = { type: 'video', src: scene.visual_url, volume: 0 }
            if (scene.visual_trim) clip.asset.trim = scene.visual_trim
          } else {
            clip.asset = { type: 'image', src: scene.visual_url }
            if (scene.effect) clip.effect = scene.effect || 'zoomIn'
          }

          if (scene.transition) {
            clip.transition = { in: scene.transition }
          }

          videoTrackClips.push(clip)

          if (scene.text_overlay || scene.title) {
            textTrackClips.push({
              asset: {
                type: 'html',
                html: `<div style="font-family: 'Montserrat', sans-serif; color: #fff; font-size: 36px; text-shadow: 2px 2px 8px rgba(0,0,0,0.8); padding: 20px; text-align: center;">${scene.text_overlay || scene.title}</div>`,
                width: 800,
                height: 100,
              },
              start: currentStart,
              length: Math.min(scene.duration, 5), // Show text for max 5s
              position: 'bottom',
              offset: { y: 0.15 },
              transition: { in: 'fade', out: 'fade' },
            })
          }

          if (scene.voiceover_url) {
            voiceTrackClips.push({
              asset: { type: 'audio', src: scene.voiceover_url, volume: 1 },
              start: currentStart,
              length: scene.duration,
            })
          }

          currentStart += scene.duration
        }

        const tracks = [
          { clips: textTrackClips }, // Top layer: text
          { clips: videoTrackClips }, // Middle: video/images
        ]
        if (voiceTrackClips.length) tracks.push({ clips: voiceTrackClips }) // Voiceover audio

        const timeline: any = {
          tracks: tracks.filter(t => t.clips.length > 0),
          background: '#000000',
        }

        if (musicUrl) {
          timeline.soundtrack = { src: musicUrl, effect: 'fadeInFadeOut', volume: musicVol }
        }

        const outputMap: Record<string, any> = {
          'sd': { format: 'mp4', resolution: 'sd' },
          'hd': { format: 'mp4', resolution: 'hd' },
          '1080': { format: 'mp4', size: { width: 1920, height: 1080 } },
        }

        const shotStackPayload = { timeline, output: outputMap[resolution] || outputMap['hd'] }

        await supabase.from('video_projects').update({
          shotstack_timeline: shotStackPayload,
          production_status: 'building_timeline',
          updated_at: new Date().toISOString(),
        }).eq('id', vpId)

        return `Video timeline built successfully!\n- Total scenes: ${scenes.length}\n- Total duration: ${totalDuration}s (${Math.floor(totalDuration / 60)}m ${totalDuration % 60}s)\n- Resolution: ${resolution}\n- Music: ${musicUrl ? 'Yes' : 'No'}\n- Voiceover scenes: ${voiceTrackClips.length}\n\nTimeline saved to video project ${vpId}. Ready to render with render_video tool.`
      }

      case 'render_video': {
        const SHOTSTACK_API_KEY = Deno.env.get('SHOTSTACK_API_KEY')
        if (!SHOTSTACK_API_KEY) return 'SHOTSTACK_API_KEY missing'
        const vpId = toolInput.video_project_id as string

        const { data: vp, error: vpErr } = await supabase.from('video_projects')
          .select('shotstack_timeline, title').eq('id', vpId).single()
        if (vpErr || !vp) return `Error: Video project ${vpId} not found.`
        if (!vp.shotstack_timeline) return 'Error: No timeline built yet. Use build_video_timeline first.'

        const SHOTSTACK_URL = Deno.env.get('SHOTSTACK_ENV') === 'production'
          ? 'https://api.shotstack.io/v1/render'
          : 'https://api.shotstack.io/stage/render'

        const renderRes = await fetch(SHOTSTACK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': SHOTSTACK_API_KEY },
          body: JSON.stringify(vp.shotstack_timeline),
        })
        if (!renderRes.ok) {
          const errText = await renderRes.text()
          await supabase.from('video_projects').update({
            production_status: 'failed', render_error: errText, updated_at: new Date().toISOString(),
          }).eq('id', vpId)
          return `Shotstack render failed: ${renderRes.status} - ${errText}`
        }

        const renderData = await renderRes.json()
        const renderId = renderData.response?.id

        await supabase.from('video_projects').update({
          shotstack_render_id: renderId,
          production_status: 'rendering',
          render_started_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', vpId)

        return `Video render submitted to Shotstack!\n- Render ID: ${renderId}\n- Project: ${vp.title}\n- Status: queued\n\nUse check_render_status to monitor progress. A 10-minute video typically takes 2-5 minutes to render.`
      }

      case 'check_render_status': {
        const SHOTSTACK_API_KEY = Deno.env.get('SHOTSTACK_API_KEY')
        if (!SHOTSTACK_API_KEY) return 'SHOTSTACK_API_KEY missing'
        const vpId = toolInput.video_project_id as string

        const { data: vp } = await supabase.from('video_projects')
          .select('shotstack_render_id, title').eq('id', vpId).single()
        if (!vp?.shotstack_render_id) return 'Error: No render ID found. Submit a render first with render_video.'

        const renderId = (toolInput.render_id as string) || vp.shotstack_render_id
        const SHOTSTACK_URL = Deno.env.get('SHOTSTACK_ENV') === 'production'
          ? `https://api.shotstack.io/v1/render/${renderId}`
          : `https://api.shotstack.io/stage/render/${renderId}`

        const statusRes = await fetch(SHOTSTACK_URL, {
          headers: { 'x-api-key': SHOTSTACK_API_KEY },
        })
        if (!statusRes.ok) return `Status check failed: ${statusRes.status}`
        const statusData = await statusRes.json()
        const status = statusData.response?.status
        const renderUrl = statusData.response?.url

        if (status === 'done' && renderUrl) {
          await supabase.from('video_projects').update({
            production_status: 'render_complete',
            render_url: renderUrl,
            render_completed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', vpId)
          return `🎬 Video render COMPLETE!\n- Title: ${vp.title}\n- Status: done\n- Video URL: ${renderUrl}\n\nThe video is ready for review!`
        } else if (status === 'failed') {
          const errMsg = statusData.response?.error || 'Unknown render error'
          await supabase.from('video_projects').update({
            production_status: 'failed', render_error: errMsg, updated_at: new Date().toISOString(),
          }).eq('id', vpId)
          return `Video render FAILED: ${errMsg}`
        } else {
          return `Video render in progress.\n- Title: ${vp.title}\n- Status: ${status}\n- Render ID: ${renderId}\n\nCheck again in 30-60 seconds.`
        }
      }

      case 'create_project_tasks': {
        const projectId = toolInput.project_id as string
        const tasksToCreate = toolInput.tasks as any[]
        if (!tasksToCreate?.length) return 'Error: No tasks provided.'
        if (tasksToCreate.length > 20) return 'Error: Maximum 20 tasks at once.'

        const created = []
        const errors = []
        for (const t of tasksToCreate) {
          const { data, error } = await supabase.from('tasks').insert({
            title: t.title,
            description: t.description || '',
            status: 'Todo',
            priority: t.priority || 'Medium',
            project_id: projectId,
            user_id: userId,
            assigned_agent: t.assigned_agent || null,
            due_date: t.deadline || null,
          }).select('id, title, assigned_agent').single()
          if (error) errors.push(`"${t.title}": ${error.message}`)
          else created.push(data)
        }

        let result = `Created ${created.length} task(s) for the project:\n`
        result += created.map((t: any, i: number) => `${i + 1}. ${t.title}${t.assigned_agent ? ` → ${t.assigned_agent}` : ''}`).join('\n')
        if (errors.length) result += `\n\nFailed (${errors.length}): ${errors.join('; ')}`
        return result
      }

      case 'create_video_project': {
        const title = toolInput.title as string
        const description = (toolInput.description as string) || ''
        const targetDuration = (toolInput.target_duration_seconds as number) || 600

        const { data, error } = await supabase.from('video_projects').insert({
          user_id: userId,
          agent_id: agentId,
          conversation_id: conversationId,
          title,
          description,
          target_duration_seconds: targetDuration,
          production_status: 'not_started',
          script_status: 'draft',
        }).select('id, title').single()

        if (error) return `Error creating video project: ${error.message}`
        return `Video project created!\n- ID: ${data.id}\n- Title: ${data.title}\n- Target duration: ${targetDuration}s (${Math.floor(targetDuration / 60)}m)\n\nUse this ID for search_stock_footage, generate_voiceover, build_video_timeline, and render_video.`
      }

      default:
        return `Unknown tool: ${toolName}`
    }
  } catch (err) {
    return `Tool execution error (${toolName}): ${(err as Error).message}`
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'No auth header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!).auth.getUser(token)
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const body = await req.json()
    const { agent_slug, message, conversation_id, mode = 'chat', task_title, stream = false, initiative_id, initiative_state } = body

    if (!agent_slug || !message) {
      return new Response(JSON.stringify({ error: 'agent_slug and message are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (message.length > GUARDRAILS.INPUT_CHAR_CAP) {
      const templateMsg = TEMPLATE_RESPONSES.input_too_long
      await supabase.rpc('record_token_usage', {
        p_user_id: user.id, p_agent_id: null, p_conversation_id: conversation_id || null,
        p_reason_code: 'input_too_long', p_model_provider: 'none', p_model_name: 'template',
        p_tokens_in: 0, p_tokens_out: 0, p_mode: mode, p_was_cached: true,
      }).then(r => r).catch(() => {})

      if (stream) {
        const encoder = new TextEncoder()
        const body = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ conversation_id: conversation_id || null, mode })}\n\n`))
            controller.enqueue(encoder.encode(`event: text\ndata: ${JSON.stringify({ chunk: templateMsg })}\n\n`))
            controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ conversation_id: conversation_id || null })}\n\n`))
            controller.close()
          },
        })
        return new Response(body, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } })
      }
      return new Response(JSON.stringify({ message: templateMsg, guardrail: 'input_too_long' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: rateLimitResult, error: rlErr } = await supabase.rpc('check_and_update_budget', { p_user_id: user.id })
    if (rlErr) console.error('Budget check error:', rlErr)

    if (rateLimitResult && !rateLimitResult.allowed) {
      const templateMsg = rateLimitResult.message || TEMPLATE_RESPONSES[rateLimitResult.reason] || TEMPLATE_RESPONSES.budget_blocked

      await supabase.rpc('record_token_usage', {
        p_user_id: user.id, p_agent_id: null, p_conversation_id: conversation_id || null,
        p_reason_code: rateLimitResult.reason, p_model_provider: 'none', p_model_name: 'template',
        p_tokens_in: 0, p_tokens_out: 0, p_mode: mode, p_was_cached: true,
      }).then(r => r).catch(() => {})

      if (stream) {
        const encoder = new TextEncoder()
        const body = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ conversation_id: conversation_id || null, mode })}\n\n`))
            controller.enqueue(encoder.encode(`event: text\ndata: ${JSON.stringify({ chunk: templateMsg })}\n\n`))
            controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ conversation_id: conversation_id || null })}\n\n`))
            controller.close()
          },
        })
        return new Response(body, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } })
      }
      return new Response(JSON.stringify({ message: templateMsg, guardrail: rateLimitResult.reason }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const deterministicResponse = checkDeterministicPath(message, mode)
    if (deterministicResponse) {
      if (stream) {
        const encoder = new TextEncoder()
        const body = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(`event: meta\ndata: ${JSON.stringify({ conversation_id: conversation_id || null, mode })}\n\n`))
            controller.enqueue(encoder.encode(`event: text\ndata: ${JSON.stringify({ chunk: deterministicResponse })}\n\n`))
            controller.enqueue(encoder.encode(`event: done\ndata: ${JSON.stringify({ conversation_id: conversation_id || null })}\n\n`))
            controller.close()
          },
        })
        return new Response(body, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } })
      }
      return new Response(JSON.stringify({ message: deterministicResponse, guardrail: 'deterministic' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { data: agent, error: agentErr } = await supabase.from('ai_agents').select('*').eq('slug', agent_slug).single()
    if (agentErr || !agent) return new Response(JSON.stringify({ error: 'Agent not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    const provider = agent.model_provider || 'anthropic'
    const modelName = agent.model_name || 'claude-sonnet-4-20250514'
    const temperature = agent.temperature ?? 0.7

    let outputCap = GUARDRAILS.OUTPUT_TOKEN_CAP
    if (mode === 'autonomous') outputCap = GUARDRAILS.AUTONOMOUS_OUTPUT_CAP
    else if (message.toLowerCase().includes('diagnostic') || message.toLowerCase().includes('memo')) outputCap = GUARDRAILS.MEMO_OUTPUT_CAP
    if (agent.slug === 'emmy') outputCap = Math.max(outputCap, 2000)

    let convId = conversation_id
    let taskId = body.task_id || null

    if (!convId) {
      const { data: conv, error: convErr } = await supabase.from('ai_conversations').insert({
        user_id: user.id, agent_id: agent.id, title: message.substring(0, 100),
      }).select('id').single()
      if (convErr) throw convErr
      convId = conv.id
    }

    await supabase.from('ai_messages').insert({ conversation_id: convId, role: 'user', content: message })

    const { data: history } = await supabase.from('ai_messages').select('role, content')
      .eq('conversation_id', convId).order('created_at', { ascending: true }).limit(20)

    if (mode === 'autonomous' && !taskId) {
      const { data: taskData } = await supabase.from('ai_agent_tasks').insert({
        agent_id: agent.id, user_id: user.id, conversation_id: convId,
        title: task_title || message.substring(0, 100), status: 'in_progress',
        input_data: { message, mode },
      }).select('id').single()
      taskId = taskData?.id
    }

    const { data: searchMemories } = await supabase.rpc('search_memories', {
      p_agent_id: agent.id, p_user_id: user.id, p_query: message, p_limit: 30,
    }).then(r => r).catch(() => ({ data: [] }))

    const { data: pinnedMemories } = await supabase.from('ai_agent_memory')
      .select('*').eq('agent_id', agent.id).eq('user_id', user.id).eq('is_pinned', true)
      .limit(10).then(r => r).catch(() => ({ data: [] }))

    const memMap = new Map<string, any>()
    for (const m of [...(pinnedMemories || []), ...(searchMemories || [])]) {
      if (!memMap.has(m.id)) memMap.set(m.id, m)
    }
    const uniqueMemories = Array.from(memMap.values())

    const { data: pastSummaries } = await supabase.from('ai_conversation_summaries')
      .select('summary, decisions_made, created_at')
      .eq('agent_id', agent.id).eq('user_id', user.id)
      .order('created_at', { ascending: false }).limit(3)
      .then(r => r).catch(() => ({ data: [] }))

    let systemPrompt = agent.personality_prompt || `You are ${agent.name}, ${agent.title}.`

    if (mode === 'autonomous') {
      systemPrompt += '\n\n## CURRENT MODE: AUTONOMOUS\nExecute tasks independently. Use log_work for every step. Only escalate per defined criteria. Do NOT ask questions. Keep responses concise.'
    } else {
      systemPrompt += '\n\n## CURRENT MODE: CHAT\nConversation mode. Answer, brainstorm, review. Keep responses concise and focused.'
    }

    systemPrompt += '\n\n## MEMORY INSTRUCTIONS\nYou have persistent memory. NEVER ask the user to repeat info in your memories.\n- Use save_memory for NEW info worth remembering (preferences, decisions, facts, project details)\n- Use update_memory when existing info has changed (search for the old memory, provide new content)\n- Use delete_memory when info is wrong or no longer relevant\n- Use search_memory to find specific info not shown below\nAlways check your memories below before asking the user a question they may have already answered.'

    const pinnedMems = uniqueMemories.filter((m: any) => m.source === 'pinned' || m.is_pinned)
    if (pinnedMems.length) {
      systemPrompt += '\n\n## Core Knowledge\n' + pinnedMems.map((m: any) => `- [${m.memory_type}/${m.category}] ${m.content}`).join('\n')
    }

    const otherMems = uniqueMemories.filter((m: any) => m.source !== 'pinned' && !m.is_pinned)
    if (otherMems.length) {
      systemPrompt += '\n\n## Relevant Memories\n' + otherMems.map((m: any) => `- [${m.memory_type}/${m.category}] (imp: ${m.importance}) ${m.content}`).join('\n')
    }

    if (pastSummaries?.length) {
      systemPrompt += '\n\n## Recent Conversations\n' + pastSummaries.map((s: any) => {
        let l = `- ${s.summary}`
        if (s.decisions_made?.length) l += ` | Decisions: ${s.decisions_made.join('; ')}`
        return l
      }).join('\n')
    }

    if (taskId) systemPrompt += `\n\n## Active Task ID: ${taskId}`

    // Inject pending deliverable revisions so agent knows about them
    const { data: pendingRevisions } = await supabase.from('agent_deliverables')
      .select('id, title, deliverable_type, status, review_notes, version, agent_id')
      .eq('user_id', user.id)
      .in('status', ['revision_requested', 'rejected', 'needs_review'])
      .order('updated_at', { ascending: false })
      .limit(15)
      .then(r => r).catch(() => ({ data: null }))

    if (agent.slug === 'mistol' && pendingRevisions?.length) {
      // Mistol gets the full cross-team deliverable picture
      const agentIds = [...new Set(pendingRevisions.map((d: any) => d.agent_id))]
      const { data: agentNames } = await supabase.from('ai_agents').select('id, name').in('id', agentIds).then(r => r).catch(() => ({ data: [] }))
      const nameMap: Record<string, string> = {}
      for (const a of (agentNames || [])) nameMap[a.id] = a.name

      const needsReview = pendingRevisions.filter((d: any) => d.status === 'needs_review')
      const revisionRequested = pendingRevisions.filter((d: any) => d.status === 'revision_requested')
      const rejected = pendingRevisions.filter((d: any) => d.status === 'rejected')

      systemPrompt += '\n\n## 📊 TEAM DELIVERABLE STATUS'
      if (needsReview.length) {
        systemPrompt += `\n\n📋 Awaiting user review (${needsReview.length}):\n` + needsReview.map((d: any) =>
          `- "${d.title}" by ${nameMap[d.agent_id] || '?'} (${d.deliverable_type} v${d.version})`
        ).join('\n')
      }
      if (revisionRequested.length) {
        systemPrompt += `\n\n🔄 Revision requested (${revisionRequested.length}):\n` + revisionRequested.map((d: any) =>
          `- "${d.title}" by ${nameMap[d.agent_id] || '?'} — Feedback: ${d.review_notes || 'none'} | ID: ${d.id}`
        ).join('\n')
      }
      if (rejected.length) {
        systemPrompt += `\n\n❌ Rejected (${rejected.length}):\n` + rejected.map((d: any) =>
          `- "${d.title}" by ${nameMap[d.agent_id] || '?'} — Reason: ${d.review_notes || 'none'}`
        ).join('\n')
      }
      if (!needsReview.length && !revisionRequested.length && !rejected.length) {
        systemPrompt += '\nAll deliverables are either approved or in progress. No action items.'
      }
      systemPrompt += '\n\nProactively mention any stale items or pending revisions when giving project updates. If the user asks you to manage a revision, delegate to the original agent with their exact feedback.'
    } else if (pendingRevisions?.length) {
      // Other agents only see their own pending revisions
      const myRevisions = pendingRevisions.filter((d: any) => d.agent_id === agent.id && d.status !== 'needs_review')
      if (myRevisions.length) {
        systemPrompt += '\n\n## ⚠️ PENDING DELIVERABLE REVISIONS\nThe user has reviewed your work and requested changes. Address these proactively:\n'
        systemPrompt += myRevisions.map((d: any) =>
          `- "${d.title}" (${d.deliverable_type} v${d.version}) — ${d.status.toUpperCase()}${d.review_notes ? `. User feedback: ${d.review_notes}` : ''}. ID: ${d.id}`
        ).join('\n')
        systemPrompt += '\n\nUse update_deliverable to submit revised versions. Mention these to the user if relevant to the conversation.'
      }
    }

    if (initiative_id && initiative_state) {
      systemPrompt += `\n\n## Initiative Context (ID: ${initiative_id})\n${JSON.stringify(initiative_state)}`
    }

    systemPrompt += '\n\n## DELEGATION\nYou can delegate tasks to other team members using delegate_to_agent when a task is better suited to their expertise. Available agents: dave (CTO), marnie (Marketing Lead), sadie (Social Media), luna (Customer Service), nathan (Lead Gen), mistol (Project Lead), emmy (Video Creator).\n\nData lookups (task lists, project status, ticket counts, lead info) are answered instantly from the database — no need to frame these as big requests. Delegation is best for judgment calls: "Should we refund this customer?", "What marketing angle works here?", "Review this code approach."'

    systemPrompt += '\n\n## STATUS MANAGEMENT\nYou can update project and task statuses using update_project_status and update_task_status tools. Valid project statuses: todo, in_progress, stalled, needs_approval, done. Valid task statuses: Todo, In Progress, Stalled, Needs Approval, Completed.\n\nTwo statuses require human attention:\n- "stalled" / "Stalled" = You are BLOCKED. You cannot continue without human input (a decision, information, access, or approval to proceed). The user needs to unblock you.\n- "needs_approval" / "Needs Approval" = You FINISHED the work. The deliverable is ready for the user to review, verify, or approve before it can be considered done. You are not blocked — you are waiting at a quality gate.\n\nWhen you set either status, you MUST include a clear, actionable reason so the user knows exactly what to do.'

    const agentHitl = agent.hitl_criteria
    if (agentHitl) {
      systemPrompt += agentHitl
    }

    const fullMsgs = (history || []).map((m: any) => ({ role: m.role === 'system' ? 'user' : m.role, content: m.content }))
    const msgs = trimContext(fullMsgs)

    const tools = getToolDefinitions(agent.tools || [])

    const reasonCode = mode === 'autonomous' ? 'autonomous_task' : 'scoped_answer'

    // ═══ LOCAL ANSWER LAYER ═══
    // Try to answer from local data (memories, project info, tasks, docs) before calling LLM
    // This saves tokens for questions that can be answered from existing context
    let localAnswer: string | null = null
    if (mode === 'chat') {
      localAnswer = await tryLocalAnswer(message, { supabase, userId: user.id, agentId: agent.id, agentName: agent.name, uniqueMemories, pastSummaries })
    }

    if (localAnswer && stream) {
      // Return local answer as streamed response (no LLM call)
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          const send = (event: string, data: any) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
          }
          send('meta', { conversation_id: convId, task_id: taskId || null, mode, agent: { slug: agent.slug, name: agent.name, title: agent.title } })
          // Stream the local answer in chunks for natural feel
          const words = localAnswer!.split(' ')
          for (let i = 0; i < words.length; i += 3) {
            const chunk = words.slice(i, i + 3).join(' ') + ' '
            send('text', { chunk })
          }
          send('done', { conversation_id: convId })

          // Save messages to DB
          await supabase.from('ai_messages').insert({ conversation_id: convId, role: 'user', content: message })
          await supabase.from('ai_messages').insert({ conversation_id: convId, role: 'assistant', content: localAnswer })

          // Log as cached (zero tokens used)
          await supabase.rpc('record_token_usage', {
            p_user_id: user.id, p_agent_id: agent.id, p_conversation_id: convId,
            p_reason_code: 'local_answer', p_model_provider: 'none', p_model_name: 'local',
            p_tokens_in: 0, p_tokens_out: 0, p_mode: mode, p_was_cached: true,
          }).then(r => r).catch(() => {})

          controller.close()
        }
      })
      return new Response(readableStream, { headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } })
    }

    if (stream) {
      const encoder = new TextEncoder()
      const readableStream = new ReadableStream({
        async start(controller) {
          const send = (event: string, data: any) => {
            controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
          }

          try {
            send('meta', { conversation_id: convId, task_id: taskId || null, mode, agent: { slug: agent.slug, name: agent.name, title: agent.title } })

            let llmMessages = [...msgs]
            let fullResponse = ''
            let toolUseCount = 0
            const MAX_ITERATIONS = mode === 'autonomous' ? (agent.slug === 'emmy' ? 30 : 10) : (agent.slug === 'emmy' ? 15 : 5)
            while (toolUseCount < MAX_ITERATIONS) {
              const startTime = Date.now()
              const result = await callLLMStream(provider, modelName, systemPrompt, llmMessages, tools, outputCap, (chunk) => {
                send('text', { chunk })
              }, temperature)
              const duration = Date.now() - startTime
              const content = result.content

              const currentReasonCode = toolUseCount === 0 ? reasonCode : 'tool_followup'
              await supabase.rpc('record_token_usage', {
                p_user_id: user.id, p_agent_id: agent.id, p_conversation_id: convId,
                p_reason_code: currentReasonCode, p_model_provider: provider, p_model_name: modelName,
                p_tokens_in: result.usage?.input_tokens || estimateInputTokens(systemPrompt, llmMessages, tools),
                p_tokens_out: result.usage?.output_tokens || 0,
                p_mode: mode, p_duration_ms: duration,
              }).then(r => r).catch(() => {})

              const toolUses = content.filter((c: any) => c.type === 'tool_use')
              const textBlocks = content.filter((c: any) => c.type === 'text')

              if (toolUses.length === 0) {
                fullResponse += textBlocks.map((t: any) => t.text).join('\n')
                break
              }

              llmMessages.push({ role: 'assistant', content })
              const toolResults = []
              for (const tu of toolUses) {
                send('tool_start', { tool: tu.name, input: tu.input })

                if (tu.name === 'delegate_to_agent') {
                  send('delegation_start', { target: tu.input.target_agent_slug, task: tu.input.task })
                }

                const r = await executeTool(tu.name, tu.input, {
                  supabase, agentId: agent.id, userId: user.id,
                  conversationId: convId, taskId, delegationDepth: 0,
                  guardrails: { require_approval: agent.require_approval ?? true, allow_page_edits: agent.allow_page_edits ?? true, allow_external_apis: agent.allow_external_apis ?? true },
                })
                toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: r })
                send('tool_done', { tool: tu.name, result: r.substring(0, 500) })

                if (tu.name === 'delegate_to_agent') {
                  send('delegation_done', { target: tu.input.target_agent_slug, result: r.substring(0, 500) })
                }
              }
              llmMessages.push({ role: 'user', content: toolResults })
              toolUseCount++
              if (textBlocks.length) fullResponse += textBlocks.map((t: any) => t.text).join('\n')
            }

            await supabase.from('ai_messages').insert({ conversation_id: convId, role: 'assistant', content: fullResponse })

            if (taskId) {
              const wasEscalated = fullResponse.toLowerCase().includes('escalat')
              if (!wasEscalated) {
                await supabase.from('ai_agent_tasks').update({
                  status: 'completed', completed_at: new Date().toISOString(),
                  output_data: { summary: fullResponse.substring(0, 1000) },
                }).eq('id', taskId)
                await supabase.from('ai_agent_notifications').insert({
                  user_id: user.id, agent_id: agent.id, task_id: taskId,
                  notification_type: 'task_complete',
                  title: `Task completed: ${task_title || 'Autonomous task'}`,
                  message: fullResponse.substring(0, 500),
                })
              }
            }

            send('done', {
              conversation_id: convId,
              task_id: taskId || null,
              tokens_used: 0, // Will be filled from logs
              reason_code: reasonCode,
            })

            EdgeRuntime.waitUntil(
              fetch(`${supabaseUrl}/functions/v1/ai-memory-extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
                body: JSON.stringify({ conversation_id: convId, agent_id: agent.id, user_id: user.id }),
              }).then(r => r).catch(e => console.error('Memory extraction failed:', e))
            )

          } catch (err) {
            send('error', { message: (err as Error).message })
          } finally {
            controller.close()
          }
        },
      })

      return new Response(readableStream, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      })
    }

    let llmMessages = [...msgs]
    let finalResponse = ''
    let toolUseCount = 0
    const MAX_ITERATIONS = mode === 'autonomous' ? (agent.slug === 'emmy' ? 30 : 10) : (agent.slug === 'emmy' ? 15 : 5)

    while (toolUseCount < MAX_ITERATIONS) {
      const startTime = Date.now()
      const result = await callLLM(provider, modelName, systemPrompt, llmMessages, tools, outputCap, temperature)
      const duration = Date.now() - startTime
      const content = result.content

      const currentReasonCode = toolUseCount === 0 ? reasonCode : 'tool_followup'
      await supabase.rpc('record_token_usage', {
        p_user_id: user.id, p_agent_id: agent.id, p_conversation_id: convId,
        p_reason_code: currentReasonCode, p_model_provider: provider, p_model_name: modelName,
        p_tokens_in: result.usage?.input_tokens || estimateInputTokens(systemPrompt, llmMessages, tools),
        p_tokens_out: result.usage?.output_tokens || 0,
        p_mode: mode, p_duration_ms: duration,
      }).then(r => r).catch(() => {})

      const toolUses = content.filter((c: any) => c.type === 'tool_use')
      const textBlocks = content.filter((c: any) => c.type === 'text')

      if (toolUses.length === 0) {
        finalResponse = textBlocks.map((t: any) => t.text).join('\n')
        break
      }

      llmMessages.push({ role: 'assistant', content })
      const toolResults = []
      for (const tu of toolUses) {
        const r = await executeTool(tu.name, tu.input, {
          supabase, agentId: agent.id, userId: user.id,
          conversationId: convId, taskId, delegationDepth: 0,
          guardrails: { require_approval: agent.require_approval ?? true, allow_page_edits: agent.allow_page_edits ?? true, allow_external_apis: agent.allow_external_apis ?? true },
        })
        toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: r })
      }
      llmMessages.push({ role: 'user', content: toolResults })
      toolUseCount++
      if (textBlocks.length) finalResponse += textBlocks.map((t: any) => t.text).join('\n')
    }

    await supabase.from('ai_messages').insert({ conversation_id: convId, role: 'assistant', content: finalResponse })

    if (taskId) {
      const wasEscalated = finalResponse.toLowerCase().includes('escalat')
      if (!wasEscalated) {
        await supabase.from('ai_agent_tasks').update({
          status: 'completed', completed_at: new Date().toISOString(),
          output_data: { summary: finalResponse.substring(0, 1000) },
        }).eq('id', taskId)
        await supabase.from('ai_agent_notifications').insert({
          user_id: user.id, agent_id: agent.id, task_id: taskId,
          notification_type: 'task_complete',
          title: `Task completed: ${task_title || 'Autonomous task'}`,
          message: finalResponse.substring(0, 500),
        })
      }
    }

    EdgeRuntime.waitUntil(
      fetch(`${supabaseUrl}/functions/v1/ai-memory-extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${supabaseServiceKey}` },
        body: JSON.stringify({ conversation_id: convId, agent_id: agent.id, user_id: user.id }),
      }).then(r => r).catch(e => console.error('Memory extraction failed:', e))
    )

    return new Response(JSON.stringify({
      conversation_id: convId,
      task_id: taskId || null,
      mode,
      agent: { slug: agent.slug, name: agent.name, title: agent.title, avatar_emoji: agent.avatar_emoji, color: agent.color },
      message: finalResponse,
      reason_code: reasonCode,
      tokens_used: 0, // Aggregated from logs
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (error) {
    console.error('ai-chat error:', error)
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
