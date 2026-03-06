// workspace-data.js — Central data store
const SUPABASE_URL = "https://mzqjivtidadjaawmlslz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cWppdnRpZGFkamFhd21sc2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTYxMDUsImV4cCI6MjA4NjU3MjEwNX0.o9WeG3HCDvPQ6SIv_EuzxR44VTZiMPfbUG3r7Ar8WD4";

// ─── Agent Definitions ───────────────────────────────────────────
export const AGENTS = [
  {
    slug: "dave", name: "Dave", title: "CTO", emoji: "👨‍💻", avatar: "/agents/dave.png",
    color: "#1e40af", bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700",
    model: "claude-sonnet-4-20250514", modelLabel: "Claude Sonnet 4", provider: "anthropic", temperature: 0.7,
    tools: [
      { id: "github", name: "GitHub", icon: "🐙", category: "development", enabled: true, description: "Repository management, PRs, issues, code review" },
      { id: "netlify", name: "Netlify", icon: "🚀", category: "development", enabled: true, description: "Deploy, build logs, site management" },
      { id: "web_search", name: "Web Search", icon: "🔍", category: "general", enabled: true, description: "Search the internet for information" },
      { id: "google_sheets", name: "Google Sheets", icon: "📊", category: "productivity", enabled: true, description: "Read, write, and manage spreadsheets" },
      { id: "google_docs", name: "Google Docs", icon: "📝", category: "productivity", enabled: true, description: "Create and edit documents" },
      { id: "excel", name: "Excel / CSV", icon: "📈", category: "productivity", enabled: true, description: "Process Excel files and CSV data" },
      { id: "code_executor", name: "Code Executor", icon: "⚡", category: "development", enabled: true, description: "Run code snippets in sandboxed environment" },
      { id: "database_query", name: "Database Query", icon: "🗄️", category: "development", enabled: true, description: "Query Supabase tables and views" },
      { id: "api_tester", name: "API Tester", icon: "🔌", category: "development", enabled: true, description: "Test REST and GraphQL endpoints" },
      { id: "docker", name: "Docker", icon: "🐳", category: "development", enabled: false, description: "Container management and deployment" },
      { id: "jira", name: "Jira", icon: "📋", category: "development", enabled: false, description: "Issue tracking and sprint management" },
      { id: "figma", name: "Figma", icon: "🎨", category: "development", enabled: false, description: "Design file access and inspection" },
      { id: "slack_bot", name: "Slack Bot", icon: "💬", category: "communication", enabled: false, description: "Post messages and read channels" },
      { id: "sentry", name: "Sentry", icon: "🐛", category: "development", enabled: false, description: "Error tracking and monitoring" },
      { id: "aws", name: "AWS", icon: "☁️", category: "infrastructure", enabled: false, description: "Cloud infrastructure management" },
      { id: "vercel", name: "Vercel", icon: "▲", category: "development", enabled: false, description: "Serverless deployment platform" },
    ],
  },
  {
    slug: "marnie", name: "Marnie", title: "Marketing Lead", emoji: "👩‍💼", avatar: "/agents/marnie.png",
    color: "#7c3aed", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700",
    model: "deepseek-chat", modelLabel: "DeepSeek V3", provider: "deepseek", temperature: 0.8,
    tools: [
      { id: "web_search", name: "Web Search", icon: "🔍", category: "general", enabled: true, description: "Search for market research" },
      { id: "google_docs", name: "Google Docs", icon: "📝", category: "productivity", enabled: true, description: "Create marketing briefs" },
      { id: "google_sheets", name: "Google Sheets", icon: "📊", category: "productivity", enabled: true, description: "Campaign tracking" },
      { id: "google_analytics", name: "Google Analytics", icon: "📊", category: "analytics", enabled: false, description: "Website traffic data" },
      { id: "mailchimp", name: "Mailchimp", icon: "📧", category: "marketing", enabled: false, description: "Email campaigns" },
      { id: "hubspot", name: "HubSpot", icon: "🧲", category: "marketing", enabled: false, description: "CRM and marketing automation" },
    ],
  },
  {
    slug: "sadie", name: "Sadie", title: "Social Media", emoji: "📱", avatar: "/agents/sadie.png",
    color: "#ec4899", bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700",
    model: "deepseek-chat", modelLabel: "DeepSeek V3", provider: "deepseek", temperature: 0.7,
    tools: [
      { id: "social_post", name: "Social Post", icon: "📤", category: "social", enabled: true, description: "Create and schedule posts" },
      { id: "web_browser", name: "Web Browser", icon: "🌐", category: "social", enabled: true, description: "Browse websites, research trends, monitor competitors" },
      { id: "web_search", name: "Web Search", icon: "🔍", category: "general", enabled: true, description: "Search trending topics and content ideas" },
      { id: "image_gen", name: "Image Generator", icon: "🖼️", category: "creative", enabled: false, description: "Generate social media graphics" },
      { id: "canva", name: "Canva", icon: "🎨", category: "creative", enabled: false, description: "Design social templates" },
      { id: "buffer", name: "Buffer", icon: "📅", category: "social", enabled: false, description: "Social scheduling and analytics" },
      { id: "instagram_api", name: "Instagram", icon: "📸", category: "social", enabled: false, description: "Post and manage Instagram" },
      { id: "twitter_api", name: "X (Twitter)", icon: "🐦", category: "social", enabled: false, description: "Post and manage tweets" },
      { id: "linkedin_api", name: "LinkedIn", icon: "💼", category: "social", enabled: false, description: "Post and manage LinkedIn" },
      { id: "tiktok_api", name: "TikTok", icon: "🎵", category: "social", enabled: false, description: "Post and manage TikTok" },
    ],
  },
  {
    slug: "luna", name: "Luna", title: "Customer Service", emoji: "💬", avatar: "/agents/luna.png",
    color: "#059669", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700",
    model: "llama-3.3-70b-versatile", modelLabel: "Llama 3.3 70B", provider: "groq", temperature: 0.6,
    tools: [
      { id: "web_search", name: "Web Search", icon: "🔍", category: "general", enabled: true, description: "Search for answers" },
      { id: "email_send", name: "Email", icon: "📧", category: "communication", enabled: false, description: "Send customer emails" },
      { id: "zendesk", name: "Zendesk", icon: "🎫", category: "support", enabled: false, description: "Ticket management" },
      { id: "intercom", name: "Intercom", icon: "💬", category: "support", enabled: false, description: "Live chat" },
    ],
  },
  {
    slug: "nathan", name: "Nathan", title: "Lead Gen", emoji: "🎯", avatar: "/agents/nathan.png",
    color: "#ea580c", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700",
    model: "deepseek-chat", modelLabel: "DeepSeek V3", provider: "deepseek", temperature: 0.7,
    tools: [
      { id: "leads_crud", name: "Leads Manager", icon: "👥", category: "sales", enabled: true, description: "Create, update, manage leads" },
      { id: "web_search", name: "Web Search", icon: "🔍", category: "general", enabled: true, description: "Research companies and prospects" },
      { id: "snov_io", name: "Snov.io", icon: "📧", category: "sales", enabled: false, description: "Email finder and verification" },
      { id: "lemlist", name: "Lemlist", icon: "📨", category: "sales", enabled: false, description: "Cold email outreach" },
      { id: "linkedin_api", name: "LinkedIn", icon: "💼", category: "sales", enabled: false, description: "Prospect research" },
      { id: "salesforce", name: "Salesforce", icon: "☁️", category: "sales", enabled: false, description: "CRM data and pipeline" },
    ],
  },
  {
    slug: "mistol", name: "Mistol", title: "Project Lead", emoji: "📋", avatar: "/agents/mistol.png",
    color: "#8B5CF6", bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-700",
    model: "deepseek-chat", modelLabel: "DeepSeek V3", provider: "deepseek", temperature: 0.7,
    tools: [
      { id: "web_search", name: "Web Search", icon: "🔍", logo: "https://cdn.simpleicons.org/google/4285F4", category: "general", enabled: true, description: "Research project requirements" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
  },
  {
    slug: "emmy", name: "Emmy", title: "Video Creator", emoji: "🎬", avatar: "/agents/emmy.png",
    color: "#dc2626", bg: "bg-red-50", border: "border-red-200", text: "text-red-700",
    model: "deepseek-chat", modelLabel: "DeepSeek V3", provider: "deepseek", temperature: 0.7,
    tools: [
      { id: "search_stock_footage", name: "Stock Footage", icon: "🎥", category: "video", enabled: true, description: "Search Pexels for HD stock video and images" },
      { id: "search_stock_music", name: "Stock Music", icon: "🎵", category: "video", enabled: true, description: "Search for background music tracks" },
      { id: "generate_voiceover", name: "Voiceover (ElevenLabs)", icon: "🎙️", category: "video", enabled: true, description: "Generate AI voiceover narration with ElevenLabs" },
      { id: "build_video_timeline", name: "Video Timeline", icon: "🎞️", category: "video", enabled: true, description: "Build Shotstack video timeline from scenes" },
      { id: "render_video", name: "Render Video", icon: "🔄", category: "video", enabled: true, description: "Submit timeline to Shotstack for rendering" },
      { id: "check_render_status", name: "Render Status", icon: "✅", category: "video", enabled: true, description: "Check video render progress and get final URL" },
      { id: "web_search", name: "Web Search", icon: "🔍", category: "general", enabled: true, description: "Research topics for video content" },
    ],
  },
];

// ─── LLM Models (all Llama versions included) ────────────────────
export const LLM_MODELS = {
  anthropic: [
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { value: "claude-haiku-4-5-20251001", label: "Claude Haiku 4.5" },
    { value: "claude-opus-4-6", label: "Claude Opus 4.6" },
  ],
  deepseek: [
    { value: "deepseek-chat", label: "DeepSeek V3 (Chat)" },
    { value: "deepseek-reasoner", label: "DeepSeek R1 (Reasoner)" },
  ],
  groq: [
    { value: "deepseek-r1-distill-llama-70b", label: "DeepSeek R1 70B (Groq)" },
    { value: "deepseek-r1-distill-qwen-32b", label: "DeepSeek R1 32B (Groq)" },
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
    { value: "llama-3.1-70b-versatile", label: "Llama 3.1 70B Versatile" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
    { value: "llama-3.2-90b-vision-preview", label: "Llama 3.2 90B Vision" },
    { value: "llama-3.2-11b-vision-preview", label: "Llama 3.2 11B Vision" },
    { value: "llama-3.2-3b-preview", label: "Llama 3.2 3B" },
    { value: "llama-3.2-1b-preview", label: "Llama 3.2 1B" },
    { value: "llama3-70b-8192", label: "Llama 3 70B" },
    { value: "llama3-8b-8192", label: "Llama 3 8B" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B" },
  ],
};
export const ALL_MODELS = [...LLM_MODELS.anthropic, ...LLM_MODELS.deepseek, ...LLM_MODELS.groq];

export const KANBAN_COLUMNS = [
  { id: "todo", label: "To Do", color: "#3b82f6" },
  { id: "in_progress", label: "In Progress", color: "#f59e0b" },
  { id: "stalled", label: "Stalled", color: "#ef4444" },
  { id: "needs_approval", label: "Needs Approval", color: "#8b5cf6" },
  { id: "done", label: "Done", color: "#10b981" },
];

// ─── Integration Catalog ─────────────────────────────────────────
export const INTEGRATION_CATALOG = [
  { id: "groq", name: "Groq", icon: "⚡", category: "AI / LLM", description: "Fast LLM inference for Llama models", fields: [{ key: "api_key", label: "API Key", type: "password" }], testEndpoint: "https://api.groq.com/openai/v1/models" },
  { id: "anthropic", name: "Anthropic", icon: "🧠", category: "AI / LLM", description: "Claude models for advanced reasoning", fields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { id: "openai", name: "OpenAI", icon: "🤖", category: "AI / LLM", description: "GPT models and embeddings", fields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { id: "deepseek", name: "DeepSeek", icon: "🔮", category: "AI / LLM", description: "DeepSeek V3 and R1 reasoning models — fast, cost-effective, 128K context", fields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { id: "github", name: "GitHub", icon: "🐙", category: "Development", description: "Repository management and CI/CD", fields: [{ key: "access_token", label: "Personal Access Token", type: "password" }] },
  { id: "netlify", name: "Netlify", icon: "🚀", category: "Development", description: "Web deployment and hosting", fields: [{ key: "access_token", label: "Access Token", type: "password" }] },
  { id: "google", name: "Google Workspace", icon: "🔷", category: "Productivity", description: "Sheets, Docs, Drive, Calendar", fields: [{ key: "service_account_json", label: "Service Account JSON", type: "textarea" }] },
  { id: "slack", name: "Slack", icon: "💬", category: "Communication", description: "Team messaging", fields: [{ key: "bot_token", label: "Bot Token", type: "password" }, { key: "webhook_url", label: "Webhook URL", type: "text" }] },
  { id: "snov_io", name: "Snov.io", icon: "📧", category: "Sales", description: "Email finder and verification", fields: [{ key: "api_key", label: "API Key", type: "password" }, { key: "user_id", label: "User ID", type: "text" }] },
  { id: "lemlist", name: "Lemlist", icon: "📨", category: "Sales", description: "Cold email outreach", fields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { id: "hubspot", name: "HubSpot", icon: "🧲", category: "Marketing", description: "CRM and marketing automation", fields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { id: "salesforce", name: "Salesforce", icon: "☁️", category: "Sales", description: "Enterprise CRM", fields: [{ key: "client_id", label: "Client ID", type: "text" }, { key: "client_secret", label: "Client Secret", type: "password" }, { key: "instance_url", label: "Instance URL", type: "text" }] },
  { id: "zendesk", name: "Zendesk", icon: "🎫", category: "Support", description: "Customer support tickets", fields: [{ key: "subdomain", label: "Subdomain", type: "text" }, { key: "api_token", label: "API Token", type: "password" }, { key: "email", label: "Admin Email", type: "text" }] },
  { id: "stripe", name: "Stripe", icon: "💳", category: "Finance", description: "Payment processing", fields: [{ key: "secret_key", label: "Secret Key", type: "password" }] },
  { id: "sendgrid", name: "SendGrid", icon: "✉️", category: "Communication", description: "Transactional email", fields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { id: "twilio", name: "Twilio", icon: "📞", category: "Communication", description: "SMS and voice", fields: [{ key: "account_sid", label: "Account SID", type: "text" }, { key: "auth_token", label: "Auth Token", type: "password" }] },
  { id: "notion", name: "Notion", icon: "📓", category: "Productivity", description: "Workspace and knowledge base", fields: [{ key: "api_key", label: "Integration Token", type: "password" }] },
  { id: "figma", name: "Figma", icon: "🎨", category: "Design", description: "Design files", fields: [{ key: "access_token", label: "Personal Access Token", type: "password" }] },
  { id: "jira", name: "Jira", icon: "📋", category: "Development", description: "Issue tracking", fields: [{ key: "domain", label: "Domain", type: "text" }, { key: "email", label: "Email", type: "text" }, { key: "api_token", label: "API Token", type: "password" }] },
  { id: "aws", name: "AWS", icon: "☁️", category: "Infrastructure", description: "Cloud infrastructure", fields: [{ key: "access_key_id", label: "Access Key ID", type: "text" }, { key: "secret_access_key", label: "Secret Access Key", type: "password" }, { key: "region", label: "Region", type: "text" }] },
  { id: "vercel", name: "Vercel", icon: "▲", category: "Development", description: "Serverless deployment", fields: [{ key: "access_token", label: "Access Token", type: "password" }] },
];

// ─── Auth helper ─────────────────────────────────────────────────
function getToken() {
  try { const s = localStorage.getItem("sb-mzqjivtidadjaawmlslz-auth-token"); if (s) return JSON.parse(s).access_token; } catch {} return null;
}
function getHeaders() {
  const t = getToken();
  return { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, ...(t ? { Authorization: `Bearer ${t}` } : {}), Prefer: "return=representation" };
}

// ─── Projects CRUD ───────────────────────────────────────────────
export async function createProject(p) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/projects`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ name: p.name, description: p.description||"", status: p.status||"todo", priority: p.priority||"medium", color: p.color||"#3b82f6", assigned_agents: p.assignedAgents||[], due_date: p.dueDate||null, created_at: new Date().toISOString() }) });
  if (!r.ok) throw new Error(await r.text()); const d = await r.json(); return d[0]||d;
}
export async function fetchProjects() { const r = await fetch(`${SUPABASE_URL}/rest/v1/projects?archived_at=is.null&order=created_at.desc`, { headers: getHeaders() }); if (!r.ok) return []; return r.json(); }
export async function updateProject(id, u) { const r = await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${id}`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify(u) }); if (!r.ok) throw new Error("Update failed"); const d = await r.json(); return d[0]||d; }
export async function deleteProject(id) { await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${id}`, { method: "DELETE", headers: getHeaders() }); }

// ─── Tasks CRUD ──────────────────────────────────────────────────
export async function createTask(t) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks`, { method: "POST", headers: getHeaders(), body: JSON.stringify({ project_id: t.projectId, title: t.title, description: t.description||"", status: t.status||"todo", priority: t.priority||"medium", assigned_agent: t.assignedAgent||null, due_date: t.dueDate||null, created_at: new Date().toISOString() }) });
  if (!r.ok) throw new Error(await r.text()); const d = await r.json(); return d[0]||d;
}
export async function fetchTasks(pid) { const u = pid ? `${SUPABASE_URL}/rest/v1/tasks?project_id=eq.${pid}&order=created_at.desc` : `${SUPABASE_URL}/rest/v1/tasks?order=created_at.desc`; const r = await fetch(u, { headers: getHeaders() }); if (!r.ok) return []; return r.json(); }
export async function updateTask(id, u) { const r = await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`, { method: "PATCH", headers: getHeaders(), body: JSON.stringify(u) }); if (!r.ok) throw new Error("Update failed"); const d = await r.json(); return d[0]||d; }
export async function deleteTask(id) { await fetch(`${SUPABASE_URL}/rest/v1/tasks?id=eq.${id}`, { method: "DELETE", headers: getHeaders() }); }

// ─── Agent Chat Stream ───────────────────────────────────────────
export async function callAgentStream({ agentSlug, message, conversationId, mode, taskTitle, projectId, onChunk, onMeta, onToolStart, onToolDone, onDelegationStart, onDelegationDone, onDone, onError }) {
  const token = getToken();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY }, body: JSON.stringify({ agent_slug: agentSlug, message, conversation_id: conversationId||undefined, mode: mode||"chat", task_title: taskTitle||undefined, project_id: projectId||undefined, stream: true }) });
  if (!res.ok) throw new Error(`Agent error ${res.status}: ${await res.text()}`);
  const reader = res.body.getReader(), decoder = new TextDecoder(); let buffer = "";
  while (true) { const { done, value } = await reader.read(); if (done) break; buffer += decoder.decode(value, { stream: true }); const lines = buffer.split("\n"); buffer = lines.pop()||""; let evt = "";
    for (const line of lines) { if (line.startsWith("event: ")) { evt = line.slice(7).trim(); continue; } if (line.startsWith("data: ")) { try { const d = JSON.parse(line.slice(6)); if (evt==="text"&&onChunk) onChunk(d.chunk); else if (evt==="meta"&&onMeta) onMeta(d); else if (evt==="tool_start"&&onToolStart) onToolStart(d); else if (evt==="tool_done"&&onToolDone) onToolDone(d); else if (evt==="delegation_start"&&onDelegationStart) onDelegationStart(d); else if (evt==="delegation_done"&&onDelegationDone) onDelegationDone(d); else if (evt==="done"&&onDone) onDone(d); else if (evt==="error"&&onError) onError(d); } catch {} } } }
}

// ─── Integrations ────────────────────────────────────────────────
export async function fetchIntegrations() { const r = await fetch(`${SUPABASE_URL}/rest/v1/integrations?order=created_at.desc`, { headers: getHeaders() }); if (!r.ok) return []; return r.json(); }
export async function saveIntegration(i) { const r = await fetch(`${SUPABASE_URL}/rest/v1/integrations`, { method: "POST", headers: { ...getHeaders(), Prefer: "return=representation,resolution=merge-duplicates" }, body: JSON.stringify({ provider_id: i.providerId, name: i.name, credentials: i.credentials, is_active: true, created_at: new Date().toISOString() }) }); if (!r.ok) throw new Error(await r.text()); const d = await r.json(); return d[0]||d; }
export async function testIntegrationConnection(providerId, creds) {
  const cat = INTEGRATION_CATALOG.find(c => c.id === providerId);
  if (!cat?.testEndpoint) return { success: true, message: "Saved (no test endpoint)." };
  try { const h = {}; if (providerId==="groq") h["Authorization"]=`Bearer ${creds.api_key}`; else if (providerId==="anthropic") { h["x-api-key"]=creds.api_key; h["anthropic-version"]="2023-06-01"; } else if (providerId==="openai") h["Authorization"]=`Bearer ${creds.api_key}`; const r = await fetch(cat.testEndpoint, { method: "GET", headers: h }); return r.ok ? { success: true, message: "Connection successful!" } : { success: false, message: `HTTP ${r.status}` }; } catch (e) { return { success: false, message: e.message }; }
}

export function getAgent(slug) { return AGENTS.find(a => a.slug === slug); }
export function getProject(projects, id) { return projects.find(p => p.id === id); }

// ═══════════════════════════════════════════════════════════════
// BACKWARD-COMPATIBLE EXPORTS
// These re-export the original mock data so existing components
// (TeamView, AgentsView, CompanyChat, WorkspaceSidebar, etc.)
// continue to work without modification.
// ═══════════════════════════════════════════════════════════════

// ----- Agent Tool Integration Data -----

// Per-agent tool sets
export const agentToolSets = {
  dave: {
    active: [
      { id: "github-branch", name: "GitHub (Branch)", logo: "https://cdn.simpleicons.org/github/ffffff", description: "Create new branches for features or fixes", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "repo_url", label: "Repository URL", type: "url", placeholder: "https://github.com/org/repo" }, { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." }], status: "active" },
      { id: "github-pr", name: "GitHub (PR)", logo: "https://cdn.simpleicons.org/github/ffffff", description: "Create pull requests for code review", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "repo_url", label: "Repository URL", type: "url", placeholder: "https://github.com/org/repo" }, { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." }], status: "active" },
      { id: "github-read", name: "GitHub (Read)", logo: "https://cdn.simpleicons.org/github/ffffff", description: "Read files and directories from your repository", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "repo_url", label: "Repository URL", type: "url", placeholder: "https://github.com/org/repo" }], status: "active" },
      { id: "github-write", name: "GitHub (Write)", logo: "https://cdn.simpleicons.org/github/ffffff", description: "Create or update files in your repository", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "repo_url", label: "Repository URL", type: "url", placeholder: "https://github.com/org/repo" }, { key: "token", label: "Personal Access Token", type: "password", placeholder: "ghp_..." }], status: "active" },
      { id: "github-list", name: "GitHub (List)", logo: "https://cdn.simpleicons.org/github/ffffff", description: "List files and directories in your repository", category: "developer", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "vercel-deploy", name: "Vercel", logo: "https://cdn.simpleicons.org/vercel/ffffff", description: "Deploy projects and manage hosting", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "token", label: "Vercel API Token", type: "password", placeholder: "..." }, { key: "project_id", label: "Project ID", type: "text", placeholder: "prj_..." }], status: "active" },
      { id: "supabase", name: "Supabase", logo: "https://cdn.simpleicons.org/supabase", description: "Database queries and schema migrations", category: "developer", preInstalled: true, requiresSetup: true, fields: [{ key: "url", label: "Supabase URL", type: "url", placeholder: "https://xxx.supabase.co" }, { key: "key", label: "Service Role Key", type: "password", placeholder: "eyJ..." }], status: "active" },
      { id: "db-migration", name: "Database Migration", logo: "https://cdn.simpleicons.org/postgresql/ffffff", description: "Run database schema migrations", category: "developer", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Research trends, competitors, and documentation", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "credential-mgr", name: "Credential Manager", logo: "https://cdn.simpleicons.org/1password/ffffff", description: "Securely store and manage API keys and passwords", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }, { key: "token", label: "Bot Token", type: "password", placeholder: "xoxb-..." }], status: "not_linked" },
      { id: "linear", name: "Linear", logo: "https://cdn.simpleicons.org/linear", description: "Create and manage issues and project boards", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "lin_api_..." }], status: "not_linked" },
      { id: "notion", name: "Notion", logo: "https://cdn.simpleicons.org/notion/ffffff", description: "Wiki, notes, and knowledge base integration", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "token", label: "Integration Token", type: "password", placeholder: "secret_..." }, { key: "database_id", label: "Database ID", type: "text", placeholder: "..." }], status: "not_linked" },
      { id: "sentry", name: "Sentry", logo: "https://cdn.simpleicons.org/sentry", description: "Error tracking and performance monitoring", category: "developer", preInstalled: false, requiresSetup: true, fields: [{ key: "dsn", label: "DSN", type: "url", placeholder: "https://xxx@sentry.io/xxx" }, { key: "token", label: "Auth Token", type: "password", placeholder: "sntrys_..." }], status: "not_linked" },
    ],
  },
  marnie: {
    active: [
      { id: "google-analytics", name: "Google Analytics", logo: "https://cdn.simpleicons.org/googleanalytics", description: "Traffic, conversions, and audience insights", category: "marketing", preInstalled: true, requiresSetup: true, fields: [{ key: "property_id", label: "Property ID", type: "text", placeholder: "UA-XXXXXXX" }, { key: "api_key", label: "API Key", type: "password", placeholder: "..." }], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Research trends, competitors, and markets", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "mailchimp", name: "Mailchimp", logo: "https://cdn.simpleicons.org/mailchimp", description: "Email campaigns and automation workflows", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "xxxxxxx-us1" }, { key: "server", label: "Server Prefix", type: "text", placeholder: "us1" }], status: "not_linked" },
      { id: "hubspot", name: "HubSpot", logo: "https://cdn.simpleicons.org/hubspot", description: "CRM, contacts, and marketing automation", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "Private App Token", type: "password", placeholder: "pat-..." }], status: "not_linked" },
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }], status: "not_linked" },
      { id: "notion", name: "Notion", logo: "https://cdn.simpleicons.org/notion/ffffff", description: "Wiki, notes, and knowledge base integration", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "token", label: "Integration Token", type: "password", placeholder: "secret_..." }], status: "not_linked" },
      { id: "email-sender", name: "Email Sender", logo: "https://cdn.simpleicons.org/minutemailer", description: "Send emails directly from the agent", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "smtp_host", label: "SMTP Host", type: "text", placeholder: "smtp.example.com" }, { key: "smtp_user", label: "Username", type: "text", placeholder: "user@example.com" }, { key: "smtp_pass", label: "Password", type: "password", placeholder: "..." }], status: "not_linked" },
    ],
  },
  sadie: {
    active: [
      { id: "social-suite", name: "Social Suite", logo: "https://cdn.simpleicons.org/buffer", description: "Schedule posts and track engagement across platforms", category: "marketing", preInstalled: true, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "..." }], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Research trends, hashtags, and viral content", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "image-gen", name: "Image Generator", logo: "https://cdn.simpleicons.org/openai/ffffff", description: "Generate images from text descriptions", category: "creative", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "canva", name: "Canva", logo: "https://cdn.simpleicons.org/canva", description: "Create and edit social media graphics", category: "creative", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "..." }], status: "not_linked" },
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }], status: "not_linked" },
      { id: "notion", name: "Notion", logo: "https://cdn.simpleicons.org/notion/ffffff", description: "Content calendar and editorial planning", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "token", label: "Integration Token", type: "password", placeholder: "secret_..." }], status: "not_linked" },
      { id: "meta-ads", name: "Meta Ads", logo: "https://cdn.simpleicons.org/meta", description: "Facebook and Instagram ad management", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "access_token", label: "Access Token", type: "password", placeholder: "EAAx..." }, { key: "ad_account_id", label: "Ad Account ID", type: "text", placeholder: "act_..." }], status: "not_linked" },
    ],
  },
  luna: {
    active: [
      { id: "live-chat", name: "Live Chat", logo: "https://cdn.simpleicons.org/livechat", description: "Handle real-time customer conversations", category: "communication", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "escalation", name: "Escalation", logo: "https://cdn.simpleicons.org/pagerduty", description: "Escalate complex issues to human team leads", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "credential-mgr", name: "Credential Manager", logo: "https://cdn.simpleicons.org/1password/ffffff", description: "Securely store and manage API keys and passwords", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Look up product info and help articles", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "zendesk", name: "Zendesk", logo: "https://cdn.simpleicons.org/zendesk", description: "Ticket management and customer support platform", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "subdomain", label: "Subdomain", type: "text", placeholder: "yourcompany" }, { key: "api_token", label: "API Token", type: "password", placeholder: "..." }, { key: "email", label: "Agent Email", type: "text", placeholder: "agent@company.com" }], status: "not_linked" },
      { id: "intercom", name: "Intercom", logo: "https://cdn.simpleicons.org/intercom", description: "Customer messaging and engagement platform", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "token", label: "Access Token", type: "password", placeholder: "dG9rOi..." }], status: "not_linked" },
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }], status: "not_linked" },
    ],
  },
  nathan: {
    active: [
      { id: "crm", name: "CRM (Leads)", logo: "https://cdn.simpleicons.org/salesforce", description: "Create, update, and search leads in the CRM", category: "marketing", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "email-sender", name: "Email Sender", logo: "https://cdn.simpleicons.org/minutemailer", description: "Draft and send outreach emails to prospects", category: "communication", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Research prospects, companies, and industries", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "hubspot", name: "HubSpot", logo: "https://cdn.simpleicons.org/hubspot", description: "CRM, contacts, and sales automation", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "Private App Token", type: "password", placeholder: "pat-..." }], status: "not_linked" },
      { id: "linkedin", name: "LinkedIn", logo: "https://cdn.simpleicons.org/linkedin", description: "Social selling and prospect research", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "access_token", label: "Access Token", type: "password", placeholder: "..." }], status: "not_linked" },
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }], status: "not_linked" },
      { id: "apollo", name: "Apollo.io", logo: "https://cdn.simpleicons.org/apollo", description: "Prospect enrichment and contact database", category: "marketing", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "..." }], status: "not_linked" },
    ],
  },
  mistol: {
    active: [
      { id: "project-status", name: "Project Status", logo: "https://cdn.simpleicons.org/todoist", description: "Update project and task statuses", category: "productivity", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "task-status", name: "Task Status", logo: "https://cdn.simpleicons.org/todoist", description: "Update individual task statuses", category: "productivity", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to the best-suited team member", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "escalation", name: "Escalation", logo: "https://cdn.simpleicons.org/pagerduty", description: "Escalate blockers that need human attention", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Research topics for project planning", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "linear", name: "Linear", logo: "https://cdn.simpleicons.org/linear", description: "Issue tracking and project boards", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "lin_api_..." }], status: "not_linked" },
      { id: "notion", name: "Notion", logo: "https://cdn.simpleicons.org/notion/ffffff", description: "Wiki, docs, and project documentation", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "token", label: "Integration Token", type: "password", placeholder: "secret_..." }], status: "not_linked" },
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }], status: "not_linked" },
      { id: "google-calendar", name: "Google Calendar", logo: "https://cdn.simpleicons.org/googlecalendar", description: "Schedule meetings and manage deadlines", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "..." }], status: "not_linked" },
    ],
  },
  emmy: {
    active: [
      { id: "stock-footage", name: "Stock Footage (Pexels)", logo: "https://cdn.simpleicons.org/pexels", description: "Search HD stock video and images for scenes", category: "creative", preInstalled: true, requiresSetup: true, fields: [{ key: "api_key", label: "Pexels API Key", type: "password", placeholder: "..." }], status: "active" },
      { id: "voiceover", name: "Voiceover (ElevenLabs)", logo: "https://cdn.simpleicons.org/elevenlabs", description: "Generate AI voiceover narration with Mike voice", category: "creative", preInstalled: true, requiresSetup: true, fields: [{ key: "api_key", label: "ElevenLabs API Key", type: "password", placeholder: "..." }], status: "active" },
      { id: "video-render", name: "Video Render (Shotstack)", logo: "https://cdn.simpleicons.org/shotstack", description: "Build timelines and render final videos", category: "creative", preInstalled: true, requiresSetup: true, fields: [{ key: "api_key", label: "Shotstack API Key", type: "password", placeholder: "..." }], status: "active" },
      { id: "stock-music", name: "Stock Music (Pixabay)", logo: "https://cdn.simpleicons.org/pixabay", description: "Search royalty-free background music", category: "creative", preInstalled: true, requiresSetup: true, fields: [{ key: "api_key", label: "Pixabay API Key", type: "password", placeholder: "..." }], status: "active" },
      { id: "web-search", name: "Web Search", logo: "https://cdn.simpleicons.org/google/ffffff", description: "Research topics for video content", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "work-logger", name: "Work Logger", logo: "https://cdn.simpleicons.org/clockify/ffffff", description: "Log completed work and progress updates", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "delegate", name: "Delegate to Agent", logo: "https://cdn.simpleicons.org/probot/ffffff", description: "Delegate tasks to other team members", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-save", name: "Memory (Save)", logo: "https://cdn.simpleicons.org/databricks/ffffff", description: "Save persistent knowledge across conversations", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
      { id: "memory-search", name: "Memory (Search)", logo: "https://cdn.simpleicons.org/algolia/ffffff", description: "Search saved knowledge and context", category: "system", preInstalled: true, requiresSetup: false, fields: [], status: "active" },
    ],
    available: [
      { id: "google-drive", name: "Google Drive", logo: "https://cdn.simpleicons.org/googledrive", description: "Store and share scripts and video assets", category: "productivity", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "API Key", type: "password", placeholder: "..." }], status: "not_linked" },
      { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", description: "Send messages and updates to Slack channels", category: "communication", preInstalled: false, requiresSetup: true, fields: [{ key: "webhook_url", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }], status: "not_linked" },
      { id: "youtube", name: "YouTube", logo: "https://cdn.simpleicons.org/youtube", description: "Upload rendered videos directly to YouTube", category: "creative", preInstalled: false, requiresSetup: true, fields: [{ key: "api_key", label: "YouTube API Key", type: "password", placeholder: "AIza..." }, { key: "channel_id", label: "Channel ID", type: "text", placeholder: "UC..." }], status: "not_linked" },
    ],
  },
}
// ----- Agents -----

export const agents = [
  {
    id: "marnie",
    name: "Marnie",
    avatar: "/agents/marnie.png",
    role: "Marketing Lead",
    status: "active",
    expertise: "Campaign strategy, market research, competitive analysis, brand positioning",
    profileNotes: "Marnie handles all marketing strategy and research. She excels at identifying market trends and translating data into actionable campaign briefs.",
  },
  {
    id: "luna",
    name: "Luna",
    avatar: "/agents/luna.png",
    role: "Customer Service Chat",
    status: "working",
    expertise: "Customer support, live chat, FAQ management, sentiment analysis, ticket triage",
    profileNotes: "Luna manages all inbound customer interactions. She is trained on the full product knowledge base and can escalate complex issues to the team.",
  },
  {
    id: "dave",
    name: "Dave",
    avatar: "/agents/dave.png",
    role: "CTO Developer",
    status: "active",
    expertise: "Full-stack development, CI/CD pipelines, system architecture, code review, DevOps",
    profileNotes: "Dave is the engineering backbone. He manages all technical infrastructure, deploys code, and reviews architecture decisions before they go live.",
  },
  {
    id: "sadie",
    name: "Sadie",
    avatar: "/agents/sadie.png",
    role: "Social Media",
    status: "idle",
    expertise: "Social media strategy, content creation, scheduling, engagement analytics, copywriting",
    profileNotes: "Sadie runs all social channels. She creates and schedules posts, tracks engagement metrics, and adapts content strategy based on performance data.",
  },
  {
    id: "nathan",
    name: "Nathan",
    avatar: "/agents/nathan.png",
    role: "Lead Gen",
    status: "active",
    expertise: "Lead generation, prospecting, outreach campaigns, CRM management, sales pipeline optimization",
    profileNotes: "Nathan handles all lead generation and outreach. He researches prospects, manages the CRM pipeline, qualifies leads, and coordinates cold outreach campaigns with the marketing team.",
  },
  {
    id: "mistol",
    name: "Mistol",
    avatar: "/agents/mistol.png",
    role: "Project Lead",
    status: "active",
    expertise: "Project management, task delegation, timeline coordination, team orchestration, progress tracking",
    profileNotes: "Mistol is the project coordinator. She breaks down initiatives into tasks, assigns work to the right agents, tracks deadlines, and keeps everyone aligned. She can delegate to any team member.",
  },
  {
    id: "emmy",
    name: "Emmy",
    avatar: "/agents/emmy.png",
    role: "Video Creator",
    status: "active",
    expertise: "Video production, scriptwriting, stock footage sourcing, voiceover generation, video rendering, storytelling",
    profileNotes: "Emmy produces professional 10-minute videos from concept to final render. She writes scripts, sources stock footage from Pexels, generates voiceover with ElevenLabs (using the Mike voice), assembles timelines, and renders via Shotstack — all autonomously.",
  },
]

// ----- Employees -----

export const employees = [
  {
    id: "emp-maria",
    name: "Maria Chen",
    email: "maria@kicker.ventures",
    role: "Design Lead",
  },
  {
    id: "emp-james",
    name: "James Walker",
    email: "james@kicker.ventures",
    role: "Marketing",
  },
]

// ----- Clients -----

export const clients = ["Internal", "Meridian Corp", "GreenCut Pro", "Kicker Video"]
// ----- Projects -----

export const projects = [
  {
    id: "cut-grass",
    name: "Cut Grass",
    description: "Get the yard professionally serviced before the wedding on the 22nd. Need to research vendors, compare quotes, and schedule the service at least 5 days in advance. Budget is $500 max. The backyard and front need to be done -- edging, mowing, and hedge trimming.",
    date: "2/12/2026",
    progress: 65,
    status: "Active",
    kanbanStatus: "In Progress",
    deadline: "3 days left",
    deadlineDate: "2026-02-17",
    agents: ["marnie", "dave"],
    tasks: [
      { id: "t1", title: "Research lawn services", date: "Feb 13", status: "Completed", assignedAgents: ["marnie"], progress: 100, notes: "Found 3 top-rated vendors in the area. GreenCut Pro has the best reviews and pricing. Marnie compiled a comparison spreadsheet.", deadline: "Feb 13, 2026", priority: "High" },
      { id: "t2", title: "Compare vendor quotes", date: "Feb 13", status: "In Progress", assignedAgents: ["dave", "marnie"], progress: 60, notes: "Dave is reaching out to vendors for formal quotes. Expected turnaround is 24 hours.", deadline: "Feb 14, 2026", priority: "High" },
      { id: "t3", title: "Schedule service", date: "Feb 14", status: "Todo", assignedAgents: [], progress: 0, notes: "Pending vendor selection. Need to book at least 5 days before the wedding.", deadline: "Feb 16, 2026", priority: "Medium" },
    ],
    documents: [
      { id: "d1", name: "Vendor Comparison Sheet", type: "sheet", url: "https://docs.google.com/spreadsheets/d/example1", addedBy: "Marnie", addedAt: "Feb 13" },
      { id: "d2", name: "Wedding Day Checklist", type: "doc", url: "https://docs.google.com/document/d/example2", addedBy: "Paul", addedAt: "Feb 12" },
    ],
  },
  {
    id: "sideline",
    name: "Sideline",
    description: "Launch the Sideline product landing page and marketing site. Includes design, development, copy, and deployment to a staging environment. Target audience is sports coaches and team managers. Must be mobile-first and SEO-optimized from day one.",
    date: "2/12/2026",
    progress: 30,
    status: "Pre-Launch",
    kanbanStatus: "To Do",
    deadline: "3 weeks left",
    deadlineDate: "2026-03-05",
    agents: ["dave", "sadie", "luna"],
    tasks: [
      { id: "t4", title: "Finalize landing page design", date: "Feb 13", status: "In Progress", assignedAgents: ["sadie", "dave"], progress: 75, notes: "Sadie has completed hero section and features grid. Still working on testimonials and footer. Using the new Kicker brand colors.", deadline: "Feb 15, 2026", priority: "High" },
      { id: "t5", title: "Set up CI/CD pipeline", date: "Feb 13", status: "In Progress", assignedAgents: ["dave"], progress: 80, notes: "GitHub Actions workflow configured. Running into a minor issue with staging deploy script env vars. Fix in progress.", deadline: "Feb 14, 2026", priority: "High" },
      { id: "t6", title: "Write launch copy", date: "Feb 14", status: "Todo", assignedAgents: ["sadie"], progress: 0, notes: "Waiting for landing page design to finalize before writing copy to match the visual hierarchy.", deadline: "Feb 17, 2026", priority: "Medium" },
      { id: "t7", title: "Deploy staging environment", date: "Feb 15", status: "Todo", assignedAgents: ["dave"], progress: 0, notes: "Blocked by CI/CD pipeline completion. Will auto-deploy once pipeline is green.", deadline: "Feb 18, 2026", priority: "Low" },
    ],
    brief: "Build and launch a conversion-focused landing page for Sideline. The page should communicate the product value prop clearly in the hero, include a features grid, social proof section, and a strong CTA. Target launch date is March 5.",
    documents: [
      { id: "d3", name: "Landing Page Wireframe", type: "doc", url: "https://docs.google.com/document/d/example3", addedBy: "Sadie", addedAt: "Feb 12" },
      { id: "d4", name: "Launch Plan Deck", type: "slide", url: "https://docs.google.com/presentation/d/example4", addedBy: "Paul", addedAt: "Feb 11" },
      { id: "d5", name: "SEO Keyword Research", type: "sheet", url: "https://docs.google.com/spreadsheets/d/example5", addedBy: "Marnie", addedAt: "Feb 13" },
      { id: "d6", name: "Project Brief", type: "brief", content: "Build and launch a conversion-focused landing page for Sideline. The page should communicate the product value prop clearly in the hero, include a features grid, social proof section, and a strong CTA.", addedBy: "Piper", addedAt: "Feb 10" },
    ],
  },
  {
    id: "kicker-rebrand",
    name: "Kicker Rebrand",
    description: "Complete brand refresh for Kicker Video ahead of Q2 launch. Includes new color palette, typography system, logo variants (horizontal, stacked, icon-only), and a comprehensive brand guidelines document. All deliverables need dark and light mode versions.",
    date: "2/10/2026",
    progress: 90,
    status: "Active",
    kanbanStatus: "Done",
    deadline: "2 days left",
    deadlineDate: "2026-02-16",
    agents: ["marnie", "sadie"],
    tasks: [
      { id: "t8", title: "Finalize color palette", date: "Feb 10", status: "Completed", assignedAgents: ["sadie"], progress: 100, notes: "Final palette: Navy primary, Gold accent, Warm gray neutrals. Approved by Paul on Feb 10.", deadline: "Feb 10, 2026", priority: "High" },
      { id: "t9", title: "Update brand guidelines doc", date: "Feb 12", status: "Completed", assignedAgents: ["marnie"], progress: 100, notes: "Brand guidelines PDF exported and distributed. Includes typography, color specs, logo usage rules, and spacing guidelines.", deadline: "Feb 12, 2026", priority: "Medium" },
      { id: "t10", title: "Design new logo variants", date: "Feb 13", status: "In Progress", assignedAgents: ["sadie", "marnie"], progress: 45, notes: "Working on horizontal, stacked, and icon-only variants. Dark and light versions needed for each.", deadline: "Feb 15, 2026", priority: "High" },
    ],
    documents: [
      { id: "d7", name: "Brand Guidelines v2", type: "doc", url: "https://docs.google.com/document/d/example6", addedBy: "Marnie", addedAt: "Feb 12" },
      { id: "d8", name: "Color Palette Specs", type: "sheet", url: "https://docs.google.com/spreadsheets/d/example7", addedBy: "Sadie", addedAt: "Feb 10" },
      { id: "d9", name: "Logo Variants Preview", type: "slide", url: "https://docs.google.com/presentation/d/example8", addedBy: "Sadie", addedAt: "Feb 13" },
    ],
  },
]

// ----- Today's Tasks -----

export const todaysTasks = [
  { id: "t-review-quotes", title: "Review vendor quotes for lawn service", date: "Feb 14", status: "In Progress", assignedAgents: ["marnie"], progress: 60, priority: "High" },
  { id: "t-staging-fix", title: "Fix staging deploy env vars", date: "Feb 14", status: "In Progress", assignedAgents: ["dave"], progress: 40, priority: "High" },
  { id: "t-social-post", title: "Draft social media launch teaser", date: "Feb 14", status: "Todo", assignedAgents: ["sadie"], progress: 0, priority: "Medium" },
  { id: "t-logo-variants", title: "Export logo variants (dark + light)", date: "Feb 14", status: "Todo", assignedAgents: ["sadie", "marnie"], progress: 0, priority: "Medium" },
  { id: "t-support-faq", title: "Update customer FAQ for Q2 changes", date: "Feb 14", status: "Todo", assignedAgents: ["luna"], progress: 0, priority: "Low" },
]

// ----- Agent Messages (dashboard feed) -----

export const agentMessages = [
  {
    id: "m1",
    agentId: "marnie",
    agentName: "Marnie",
    avatar: "/agents/marnie.png",
    message: "Finished researching lawn service options. Found 3 top-rated vendors in the area. Ready for your review.",
    timestamp: "2 min ago",
    projectId: "cut-grass",
  },
  {
    id: "m2",
    agentId: "dave",
    agentName: "Dave",
    avatar: "/agents/dave.png",
    message: "CI/CD pipeline is 80% configured. Running into a minor issue with the staging deploy script. Working on a fix.",
    timestamp: "15 min ago",
    projectId: "sideline",
  },
  {
    id: "m3",
    agentId: "luna",
    agentName: "Luna",
    avatar: "/agents/luna.png",
    message: "Updated project timelines across all active projects. Sideline is on track, Cut Grass needs attention on vendor selection.",
    timestamp: "1 hr ago",
  },
  {
    id: "m4",
    agentId: "sadie",
    agentName: "Sadie",
    avatar: "/agents/sadie.png",
    message: "Landing page mockup v2 is ready. Incorporated the new brand colors from the Kicker Rebrand palette.",
    timestamp: "2 hrs ago",
    projectId: "sideline",
  },
  {
    id: "m5",
    agentId: "marnie",
    agentName: "Marnie",
    avatar: "/agents/marnie.png",
    message: "Brand guidelines document has been finalized and exported as PDF. All logo variants are cataloged.",
    timestamp: "3 hrs ago",
    projectId: "kicker-rebrand",
  },
]

// ----- Chat Channels & Messages -----

export const chatChannels = [
  { id: "general", name: "general", description: "Company-wide announcements and updates" },
  { id: "projects", name: "projects", description: "Project updates and discussion" },
  { id: "random", name: "random", description: "Water cooler, parties, and off-topic" },
  { id: "clients", name: "clients", description: "Client-related discussions (private)" },
]

export const chatMessages = [
  {
    id: "cm1",
    channelId: "general",
    senderId: "admin-paul",
    senderName: "Paul",
    senderAvatar: "/agents/paul.png",
    senderType: "admin",
    message: "Hey team! Quick reminder -- the Q2 kickoff is Monday at 10am. @Marnie can you pull the latest market data before then?",
    timestamp: "10:15 AM",
    mentions: ["marnie"],
  },
  {
    id: "cm2",
    channelId: "general",
    senderId: "marnie",
    senderName: "Marnie",
    senderAvatar: "/agents/marnie.png",
    senderType: "agent",
    message: "On it, Paul! I will have the full market analysis ready by Sunday evening.",
    timestamp: "10:17 AM",
  },
  {
    id: "cm3",
    channelId: "general",
    senderId: "emp-maria",
    senderName: "Maria Chen",
    senderType: "employee",
    message: "Also, don't forget -- the holiday party is on the 20th. RSVP link is in your email!",
    timestamp: "10:32 AM",
  },
  {
    id: "cm4",
    channelId: "projects",
    senderId: "luna",
    senderName: "Luna",
    senderAvatar: "/agents/luna.png",
    senderType: "agent",
    message: "Updated the Cut Grass timeline. We are tight on the vendor selection -- @emp-james can you follow up with GreenCut Pro today?",
    timestamp: "9:45 AM",
    mentions: ["emp-james"],
  },
  {
    id: "cm5",
    channelId: "projects",
    senderId: "emp-james",
    senderName: "James Walker",
    senderType: "employee",
    message: "Will call them this afternoon. I will update the thread when I hear back.",
    timestamp: "9:52 AM",
  },
  {
    id: "cm6",
    channelId: "random",
    senderId: "sadie",
    senderName: "Sadie",
    senderAvatar: "/agents/sadie.png",
    senderType: "agent",
    message: "Who is bringing the cookies for Friday? Asking for... research purposes.",
    timestamp: "11:00 AM",
  },
  {
    id: "cm7",
    channelId: "random",
    senderId: "emp-maria",
    senderName: "Maria Chen",
    senderType: "employee",
    message: "I got the cookies covered! @Sadie you are on playlist duty.",
    timestamp: "11:05 AM",
    mentions: ["sadie"],
  },
  {
    id: "cm8",
    channelId: "clients",
    senderId: "admin-paul",
    senderName: "Paul",
    senderAvatar: "/agents/paul.png",
    senderType: "admin",
    message: "Just got off a call with Meridian Corp. They want to move up the launch date by two weeks. @Dave can you assess the engineering impact?",
    timestamp: "2:10 PM",
    mentions: ["dave"],
  },
  {
    id: "cm9",
    channelId: "clients",
    senderId: "dave",
    senderName: "Dave",
    senderAvatar: "/agents/dave.png",
    senderType: "agent",
    message: "Reviewing the current sprint scope now. I will have a feasibility report in the #projects channel within the hour.",
    timestamp: "2:14 PM",
  },
]

export function getAllMembers() {
  return [
    { id: "admin-paul", name: "Paul", type: "admin" },
    ...agents.map((a) => ({ id: a.id, name: a.name, type: "agent" })),
    ...employees.map((e) => ({ id: e.id, name: e.name, type: "employee" })),
  ]
}
