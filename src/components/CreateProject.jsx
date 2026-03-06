import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "../lib/utils"
import { AGENTS, createProject } from "../lib/workspace-data"
import {
  AlertCircle, ArrowLeft, Bot, Calendar, Check, FileText,
  Hand, Loader2, Mic, MicOff, Plus, Send, Sparkles, Users, Wrench,
  Github, Share2, BarChart3, MessageSquare, Palette, Code2, Megaphone,
  Database, Globe, FolderOpen, Mail, Rocket, X,
} from "lucide-react"

// ----- Tool Integration Hub -----


const projectTools = [
  // Developer tools
  { id: "github", name: "GitHub", icon: Github, description: "Repositories, PRs & code reviews", category: "developer", linkedRoles: ["dave"], defaultStatus: "not_linked" },
  { id: "vercel", name: "Vercel", icon: Rocket, description: "Deployments & hosting", category: "developer", linkedRoles: ["dave"], defaultStatus: "connected" },
  { id: "supabase", name: "Supabase", icon: Database, description: "Database & auth backend", category: "developer", linkedRoles: ["dave"], defaultStatus: "not_linked" },
  // Marketing tools
  { id: "mailchimp", name: "Mailchimp", icon: Mail, description: "Email campaigns & automations", category: "marketing", linkedRoles: ["marnie", "emp-james"], defaultStatus: "not_linked" },
  { id: "meta-ads", name: "Meta Ads", icon: Megaphone, description: "Facebook & Instagram ad manager", category: "marketing", linkedRoles: ["marnie", "sadie", "emp-james"], defaultStatus: "not_linked" },
  { id: "analytics", name: "Google Analytics", icon: BarChart3, description: "Traffic, conversions & audiences", category: "marketing", linkedRoles: ["marnie", "sadie", "emp-james"], defaultStatus: "connected" },
  // Design tools
  { id: "figma", name: "Figma", icon: Palette, description: "UI design & prototyping", category: "design", linkedRoles: ["emp-maria", "sadie"], defaultStatus: "not_linked" },
  // General / Collaboration
  { id: "slack", name: "Slack", icon: MessageSquare, description: "Team messaging & notifications", category: "general", linkedRoles: ["luna", "marnie", "dave", "sadie", "emp-maria", "emp-james"], defaultStatus: "connected" },
  { id: "google-drive", name: "Google Drive", icon: FolderOpen, description: "Shared docs, sheets & files", category: "general", linkedRoles: ["marnie", "dave", "sadie", "luna", "emp-maria", "emp-james"], defaultStatus: "not_linked" },
  { id: "notion", name: "Notion", icon: FileText, description: "Wiki, notes & knowledge base", category: "general", linkedRoles: ["marnie", "dave", "sadie", "luna", "emp-maria", "emp-james"], defaultStatus: "not_linked" },
  // Social
  { id: "social", name: "Social Suite", icon: Share2, description: "Post scheduling & engagement", category: "marketing", linkedRoles: ["sadie"], defaultStatus: "not_linked" },
]

// Category labels for Mistol's contextual hints
const categoryHints = {
  developer: "Since we have a developer on the team, here are some tools to sync code and infrastructure.",
  marketing: "Your marketing crew will love these -- connect ad platforms and email tools to keep campaigns in sync.",
  design: "For your design workflow, these tools keep assets and prototypes linked to the project.",
  general: "These collaboration tools keep the whole team connected.",
}

// ----- Types -----

// ----- Validation -----

function validateField(field, value) {
  switch (field) {
    case "name": {
      const v = (value).trim()
      if (v.length > 0 && v.length < 3) {
        return {
          valid: false,
          message: "Name too short (min 3 characters).",
          mistolMessage: "That's a bit short! Give it a name with at least 3 letters.",
        }
      }
      if (v.length > 50) {
        return {
          valid: false,
          message: "Name too long (max 50 characters).",
          mistolMessage: "Whoa, let's keep it under 50 characters. A punchy name sticks better!",
        }
      }
      return { valid: true, message: "", mistolMessage: "" }
    }
    case "deadline": {
      if (!value) return { valid: true, message: "", mistolMessage: "" }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const picked = new Date(value)
      if (picked < today) {
        return {
          valid: false,
          message: "Date must be today or later.",
          mistolMessage: "Time travel? I wish! Let's pick a date today or later.",
        }
      }
      return { valid: true, message: "", mistolMessage: "" }
    }
    default:
      return { valid: true, message: "", mistolMessage: "" }
  }
}

// ----- Helpers -----

const clients = ["Internal", "Meridian Corp", "GreenCut Pro", "Kicker Video"]

// ----- Mistol AI Configuration -----

const SUPABASE_URL = "https://mzqjivtidadjaawmlslz.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cWppdnRpZGFkamFhd21sc2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTYxMDUsImV4cCI6MjA4NjU3MjEwNX0.o9WeG3HCDvPQ6SIv_EuzxR44VTZiMPfbUG3r7Ar8WD4"

function getAuthToken() {
  try {
    const raw = localStorage.getItem("sb-mzqjivtidadjaawmlslz-auth-token")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.access_token || null
  } catch { return null }
}

// Build the system prompt with live data about available agents/clients
function buildMistolSystemPrompt() {
  const agentList = AGENTS
    .filter((a) => a.slug !== "mistol")
    .map((a) => `- ${a.slug}: ${a.name} (${a.title || a.role})`)
    .join("\n")

  return `You are Mistol, a sharp, warm, and focused business project coordinator at a creative agency. You help people set up new projects through natural conversation.

PERSONALITY: Professional but approachable. You use a confident, slightly playful tone — like a project manager who's great at her job and easy to talk to. Keep responses concise (1-3 sentences usually). No emojis. No corporate jargon.

YOUR JOB: Through natural conversation, gather the following project details. You do NOT need to ask them one by one — listen carefully because the user might give you multiple pieces of info at once, or even dump everything in one message. Roll with it.

FIELDS TO GATHER:
- name: Project name (required, 3-50 chars)
- description: One-line description of what success looks like
- client: Who this is for. Known clients: ${clients.join(", ")}. Can also be a new client name.
- deadline: A target date (ISO format YYYY-MM-DD) or null if open-ended
- teamMembers: Array of agent slugs to assign. Available agents:
${agentList}
- brief: A short brief for the team — goals, deliverables, context

RULES:
1. Start by greeting the user and asking what they're working on. Be natural — don't list the fields.
2. As the user talks, extract whatever info you can. If they say "I need to launch the GreenCut rebrand by end of March with Dave and Sadie", you should extract name, description, client, deadline, and teamMembers all at once.
3. After extracting info, acknowledge what you got naturally and ask about what's missing — but conversationally, not like a form.
4. The only required field is "name". Everything else is optional. If the user seems done, tell them they can hit Create.
5. For deadlines: interpret relative dates. "End of week" = next Sunday. "End of month" = last day of current month. "Next Friday" = compute the date. Always output ISO format.
6. For team members: YOU should SUGGEST the right team members based on what you learn about the project. Don't ask the user to pick — instead, recommend who should be on the team based on the project needs. Example: if the user describes a website redesign, suggest the developer and designer. If it's a marketing campaign, suggest the CMO and social media lead. Always include your suggestions in the "teamMembers" field.
7. YOU ARE STRICTLY A BUSINESS PROJECT COORDINATOR. If the user asks about news, sports, weather, trivia, personal advice, coding help, or ANYTHING not related to setting up this project, politely redirect: "That's outside my lane — I'm here to get your project set up. What are we building?"
8. Do not answer general knowledge questions. Do not engage in small talk beyond brief pleasantries. Always steer back to the project.
9. If the user provides info that updates a field you already extracted, use the new value (they're correcting themselves).
10. When all key fields are gathered (at minimum a name), let the user know the project looks good and they can create it — or keep chatting to refine.

RESPONSE FORMAT: You MUST respond with valid JSON only. No markdown, no backticks, no preamble. The JSON must have exactly two keys:
{
  "reply": "Your conversational message to the user",
  "fields": {
    // Only include fields you extracted or updated from THIS message.
    // Omit fields you didn't extract anything for.
  }
}`
}

// Call Mistol through the Supabase edge function (non-streaming)
// The edge function handles auth, rate limiting, and API key management
async function callMistolAI(conversationHistory) {
  try {
    const token = getAuthToken()
    if (!token) throw new Error("Not authenticated")

    // Extract just the last user message for the edge function
    const lastUserMsg = [...conversationHistory].reverse().find(m => m.role === "user")
    if (!lastUserMsg) throw new Error("No user message")

    // We send the full system prompt + conversation as a single message
    // so the edge function's Mistol agent processes it with proper context
    const systemPrompt = buildMistolSystemPrompt()
    const contextMessage = `[SYSTEM CONTEXT FOR JSON RESPONSE]\n${systemPrompt}\n\n[CONVERSATION HISTORY]\n${conversationHistory.map(m => `${m.role}: ${m.content}`).join("\n")}\n\n[LATEST USER MESSAGE]\n${lastUserMsg.content}\n\nRespond with valid JSON only. No markdown, no backticks. Format: {"reply": "your message", "fields": {...}}`

    const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        agent_slug: "mistol",
        message: contextMessage,
        mode: "chat",
        stream: false,
      }),
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error("Edge function error:", res.status, errBody)
      throw new Error(`Edge function error: ${res.status} — ${errBody}`)
    }
    const data = await res.json()
    const raw = data.message || ""

    // Try to parse as JSON — the agent should return JSON per its personality_prompt
    try {
      // Strip markdown fences if present
      const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      const parsed = JSON.parse(cleaned)
      if (parsed.reply) return parsed
    } catch {
      // If not valid JSON, use the raw text as the reply
    }

    return { reply: raw || "Sorry, I hit a snag. Try again or use the manual form.", fields: {} }
  } catch (err) {
    console.error("Mistol AI error:", err)
    return { reply: "Sorry, I hit a snag. Try again or use the manual form to the right.", fields: {} }
  }
}


const allMembers = AGENTS
  .filter((a) => a.slug !== "mistol")
  .map((a) => ({ id: a.slug, name: a.name, role: a.title || a.role, avatar: a.avatar_emoji, type: "agent" }))


// ----- Component -----

export default function CreateProject({ onClose, onCreated }) {
  // Form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    deadline: "",
    client: "",
    teamMembers: [],
    brief: "",
    tools: [],
  })
  
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState({})

  // Mistol chat
  const GREETING = "Hey! I'm Mistol, your project coordinator. Tell me what you're working on — a name, a quick description, whatever you've got — and I'll help get it set up. Or just use the form on the right if you prefer."
  const [messages, setMessages] = useState([
    { id: "p0", role: "mistol", text: GREETING },
  ])
  // AI conversation history (role/content pairs for DeepSeek)
  const [aiHistory, setAiHistory] = useState([
    { role: "assistant", content: JSON.stringify({ reply: GREETING, fields: {} }) },
  ])
  const [chatInput, setChatInput] = useState("")
  const [manualMode, setManualMode] = useState(false)
  const [mistolTyping, setMistolTyping] = useState(false)
  const [projectReady, setProjectReady] = useState(false)
  const chatEndRef = useRef(null)
  const chatTextareaRef = useRef(null)

  // Auto-resize textarea when chatInput changes (covers voice input)
  useEffect(() => {
    const el = chatTextareaRef.current
    if (el) {
      el.style.height = "auto"
      el.style.height = el.scrollHeight + "px"
    }
  }, [chatInput])

  // Track (mobile): "mistol" or "form"
  const [activeTrack, setActiveTrack] = useState("mistol")

  // Voice
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  // All fields unlocked — no gating in free-flow mode
  const allFields = new Set(["name", "description", "client", "deadline", "teamMembers", "brief"])

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, mistolTyping])

  // Update form field with validation
  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Validate inline
    const validation = validateField(field, value)
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validation.valid ? undefined : validation.message,
    }))
  }

  // Send message to Mistol AI and apply extracted fields
  const sendToMistol = useCallback(
    async (userText) => {
      // Add user message to UI
      const userMsg = { id: `u${Date.now()}`, role: "user", text: userText }
      setMessages((prev) => [...prev, userMsg])

      // Build updated AI history
      const newHistory = [...aiHistory, { role: "user", content: userText }]
      setAiHistory(newHistory)
      setMistolTyping(true)

      // Call DeepSeek
      const result = await callMistolAI(newHistory)
      const { reply, fields } = result

      // Apply extracted fields to form
      if (fields && typeof fields === "object") {
        Object.entries(fields).forEach(([key, value]) => {
          if (value === null || value === undefined) return
          if (key === "teamMembers" && Array.isArray(value)) {
            // Validate slugs against known agents (case-insensitive, also match by name)
            const validSlugs = value.map((s) => {
              const lower = String(s).toLowerCase()
              const match = allMembers.find((m) => m.id === lower || m.name.toLowerCase() === lower)
              return match ? match.id : null
            }).filter(Boolean)
            if (validSlugs.length > 0) {
              setForm((prev) => ({ ...prev, teamMembers: validSlugs }))
            }
          } else if (key === "deadline") {
            // Validate date
            const v = validateField("deadline", value)
            if (v.valid) updateField("deadline", value)
          } else if (key === "name") {
            const v = validateField("name", value)
            if (v.valid) updateField("name", value)
          } else if (["description", "client", "brief"].includes(key)) {
            updateField(key, String(value))
          }
        })
        // Check if project has enough to be ready
        setProjectReady((prev) => {
          const nameOk = (fields.name || form.name || "").trim().length >= 3
          return nameOk || prev
        })
      }

      // Add Mistol reply to UI
      const mistolMsg = { id: `p${Date.now()}`, role: "mistol", text: reply }
      setMessages((prev) => [...prev, mistolMsg])
      setAiHistory((prev) => [...prev, { role: "assistant", content: JSON.stringify(result) }])
      setMistolTyping(false)
    },
    [aiHistory, form.name]
  )

  function handleChatSend() {
    const text = chatInput.trim()
    if (!text || mistolTyping) return
    setChatInput("")
    sendToMistol(text)
  }

  // Toggle team member
  function toggleTeamMember(memberId) {
    setForm((prev) => {
      const next = prev.teamMembers.includes(memberId)
        ? prev.teamMembers.filter((id) => id !== memberId)
        : [...prev.teamMembers, memberId]
      return { ...prev, teamMembers: next }
    })
  }

  // Tool connection states
  const [toolStatuses, setToolStatuses] = useState(() => {
    const init = {}
    projectTools.forEach((t) => { init[t.id] = t.defaultStatus })
    return init
  })
  const [connectingTool, setConnectingTool] = useState(null)
  const [toolsSkipped, setToolsSkipped] = useState(false)

  // Compute suggested tools based on selected team members
  const suggestedTools = projectTools.filter((tool) =>
    tool.linkedRoles.some((role) => form.teamMembers.includes(role))
  )

  // Which categories are represented
  const activeCategories = [...new Set(suggestedTools.map((t) => t.category))]

  function handleConnectTool(toolId) {
    setConnectingTool(toolId)
    // Simulate OAuth handshake
    setTimeout(() => {
      setToolStatuses((prev) => ({ ...prev, [toolId]: "connected" }))
      setConnectingTool(null)
      // Auto-add to form tools
      setForm((prev) => ({
        ...prev,
        tools: prev.tools.includes(toolId) ? prev.tools : [...prev.tools, toolId],
      }))
    }, 1800)
  }

  function handleDisconnectTool(toolId) {
    setToolStatuses((prev) => ({ ...prev, [toolId]: "not_linked" }))
    setForm((prev) => ({
      ...prev,
      tools: prev.tools.filter((id) => id !== toolId),
    }))
  }

  function toggleTool(toolId) {
    setForm((prev) => {
      const next = prev.tools.includes(toolId)
        ? prev.tools.filter((id) => id !== toolId)
        : [...prev.tools, toolId]
      return { ...prev, tools: next }
    })
  }

  // Confirm team selection in chat
  // Switch to manual mode
  function goManual() {
    setManualMode(true)
    setActiveTrack("form")
    setMessages((prev) => [
      ...prev,
      {
        id: `p-manual`,
        role: "mistol",
        text: "No worries! I'll step aside. Fill out the form at your own pace -- I'm here if you need me.",
      },
    ])
  }

  // Voice
  const toggleVoice = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current._userStopped = true
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert("Voice recognition is not supported in this browser.")
      return
    }
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognitionRef.current = recognition
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("")
      setChatInput(transcript)
    }
    recognition.onend = () => {
      if (recognitionRef.current && recognitionRef.current._userStopped) {
        setIsListening(false)
        recognitionRef.current._userStopped = false
      } else if (recognitionRef.current) {
        try { recognitionRef.current.start() } catch (e) { setIsListening(false) }
      }
    }
    recognition.onerror = (e) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return
      setIsListening(false)
    }
    recognition.start()
    setIsListening(true)
  }, [isListening])

  // Save project
  async function handleCreateProject() {
    // Final validation
    const nameVal = validateField("name", form.name)
    if (!nameVal.valid || !form.name.trim()) {
      setFieldErrors((prev) => ({ ...prev, name: nameVal.message || "Project name is required." }))
      return
    }
    const deadlineVal = validateField("deadline", form.deadline)
    if (!deadlineVal.valid) {
      setFieldErrors((prev) => ({ ...prev, deadline: deadlineVal.message }))
      return
    }

    try {
      const result = await createProject({
        name: form.name.trim(),
        description: form.description.trim(),
        deadline: form.deadline || null,
        assignedAgents: form.teamMembers.filter((id) => AGENTS.some((a) => a.slug === id)),
        client: form.client || null,
        brief: form.brief || null,
      })
      onCreated(result)
    } catch (err) {
      console.error("Failed to create project:", err)
      setFieldErrors((prev) => ({ ...prev, name: "Failed to save project. Please try again." }))
    }
  }

  const todayStr = new Date().toISOString().split("T")[0]

  // Count filled fields for progress
  const filledCount = [
    form.name.trim(),
    form.description.trim(),
    form.client,
    form.deadline,
    form.teamMembers.length > 0 ? "yes" : "",
    form.brief.trim(),
    form.tools.length > 0 ? "yes" : "",
  ].filter(Boolean).length

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-4">
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-4 w-4 text-accent" />
          <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
            Create New Project
          </h1>
        </div>
        {/* Progress indicator */}
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <div className="flex gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 w-5 rounded-full transition-colors",
                  i < filledCount ? "bg-accent" : "bg-border"
                )}
              />
            ))}
          </div>
          <span className="text-[11px] text-muted-foreground">{filledCount}/7</span>
        </div>
      </header>

      {/* Segmented Control (Tab Bar) for both mobile and when in manual mode */}
      <div className="flex border-b border-border bg-card">
        <button
          onClick={() => {
            setActiveTrack("mistol")
            if (manualMode) {
              /* still allow switching back to see chat */
            }
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            activeTrack === "mistol"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Chat with Mistol
        </button>
        <button
          onClick={() => setActiveTrack("form")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            activeTrack === "form"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="h-3.5 w-3.5" />
          Manual Form
          {filledCount > 0 && (
            <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-accent/20 px-1 text-[9px] font-bold text-accent">
              {filledCount}
            </span>
          )}
        </button>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Track A: Mistol Chat */}
        <div
          className={cn(
            "flex flex-col overflow-hidden",
            activeTrack === "mistol"
              ? "flex-1"
              : "hidden md:flex md:w-[380px] md:shrink-0 md:border-r md:border-border"
          )}
          style={{ background: "hsl(222 47% 14% / 0.04)" }}
        >
          {/* Mistol header */}
          <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
            <div className="relative">
              <div className="h-9 w-9 ring-2 ring-accent/30">
                <img src="/agents/mistol.png" alt="Mistol" className="h-full w-full rounded-full object-cover" />
                <span className="bg-accent text-accent-foreground text-xs font-bold">P</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-card bg-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-200" />
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Mistol</p>
              <p className="text-[11px] text-muted-foreground">Project Setup Assistant</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="border-accent/30 text-[10px] text-accent">
                <Bot className="mr-1 h-2.5 w-2.5" />
                AI
              </span>
              {!manualMode && (
                <button
                  onClick={goManual}
                  className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Hand className="h-3 w-3" />
                  <span className="hidden sm:inline">{"I'll do it myself"}</span>
                  <span className="sm:hidden">Manual</span>
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="mx-auto flex max-w-lg flex-col gap-3">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" && "flex-row-reverse")}>
                  {msg.role === "mistol" && (
                    <div className="mt-0.5 h-7 w-7 shrink-0 ring-1 ring-accent/20">
                      <img src="/agents/mistol.png" alt="Mistol" className="h-full w-full rounded-full object-cover" />
                      <span className="bg-accent text-accent-foreground text-[9px]">P</span>
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                      msg.role === "mistol"
                        ? "rounded-tl-md bg-card text-card-foreground shadow-sm"
                        : "rounded-tr-md bg-accent text-accent-foreground"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Team members suggested by Mistol — shown as read-only badges when assigned */}
              {!manualMode && form.teamMembers.length > 0 && !mistolTyping && (
                <div className="ml-9 space-y-2 rounded-xl border border-border bg-card p-2.5 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Team Members (suggested by Mistol)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {form.teamMembers.map((id) => {
                      const m = allMembers.find((m) => m.id === id)
                      if (!m) return null
                      return (
                        <div
                          key={m.id}
                          className="flex items-center gap-1.5 rounded-full border border-accent bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
                        >
                          <Bot className="h-3 w-3 shrink-0 opacity-60" />
                          <span>{m.name}</span>
                          <span className="text-[10px] opacity-60">({m.role})</span>
                          <button
                            onClick={() => toggleTeamMember(m.id)}
                            className="ml-0.5 opacity-50 hover:opacity-100"
                            aria-label={`Remove ${m.name}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Mistol typing indicator */}
              {mistolTyping && (
                <div className="flex gap-2.5">
                  <div className="mt-0.5 h-7 w-7 shrink-0 ring-1 ring-accent/20">
                    <img src="/agents/mistol.png" alt="Mistol" className="h-full w-full rounded-full object-cover" />
                    <span className="bg-accent text-accent-foreground text-[9px]">P</span>
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-card px-4 py-3 shadow-sm">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          </div>

          {/* Chat input — always visible when on Mistol track */}
          {activeTrack === "mistol" && (
            <div className="border-t border-border/50 p-3">
              {manualMode ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <p className="text-[11px] text-muted-foreground">You switched to manual mode.</p>
                  <button
                    onClick={() => {
                      setManualMode(false)
                      setMessages((prev) => [
                        ...prev,
                        { id: `p-back-${Date.now()}`, role: "mistol", text: "Welcome back! Where were we? Tell me more about your project and I'll keep filling things in." },
                      ])
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    <Sparkles className="h-3 w-3" />
                    Resume chat with Mistol
                  </button>
                </div>
              ) : (
                <div>
                  {isListening && (
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                      </span>
                      <span className="text-[11px] font-medium text-red-500">Recording — click mic to stop. Or click send.</span>
                    </div>
                  )}
                  <div className="flex items-end gap-2">
                  <button
                    onClick={toggleVoice}
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isListening
                        ? "bg-destructive text-destructive-foreground animate-pulse"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    aria-label={isListening ? "Stop listening" : "Voice input"}
                  >
                    {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  </button>
                  <textarea
                    ref={chatTextareaRef}
                    value={chatInput}
                    onChange={(e) => {
                      setChatInput(e.target.value)
                      e.target.style.height = "auto"
                      e.target.style.height = e.target.scrollHeight + "px"
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleChatSend()
                      }
                    }}
                    placeholder={isListening ? "Listening..." : "Describe your project in as much detail as you like... (Shift+Enter for new line)"}
                    disabled={mistolTyping}
                    rows={2}
                    className={cn(
                      "flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-1 focus:ring-accent disabled:opacity-50 overflow-y-auto",
                      isListening && "ring-1 ring-destructive/50"
                    )}
                    style={{ minHeight: "60px", maxHeight: "40vh" }}
                  />
                  <button
                    onClick={handleChatSend}
                    disabled={!chatInput.trim() || mistolTyping}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
                    aria-label="Send"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Track B: Manual Form */}
        <div
          className={cn(
            "relative flex flex-1 flex-col overflow-hidden",
            activeTrack === "form"
              ? "flex"
              : "hidden md:flex"
          )}
        >
          {/* Scrollable form area */}
          <div className="flex-1 overflow-y-auto pb-20">
            <div className="mx-auto w-full max-w-2xl px-4 py-4 sm:px-6 sm:py-5">

              {/* Section: The Basics */}
              <div className="mb-5">
                <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-accent/10 text-[9px] font-bold text-accent">1</span>
                  The Basics
                </h3>
                <div className="space-y-2.5">
                  {/* Project Name */}
                  <FormFieldWrapper
                    label="Project Name"
                    required
                    locked={!allFields.has("name")}
                    active={false}
                    error={fieldErrors.name}
                  >
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      disabled={!allFields.has("name")}
                      placeholder="Enter project name (3-50 characters)"
                      maxLength={50}
                      className={cn(
                        "w-full rounded-md border bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-40",
                        fieldErrors.name ? "border-destructive" : "border-input"
                      )}
                    />
                    {form.name && !fieldErrors.name && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{form.name.length}/50</p>
                    )}
                  </FormFieldWrapper>

                  {/* Description */}
                  <FormFieldWrapper
                    label="Description / Objective"
                    locked={!allFields.has("description")}
                    active={false}
                    error={fieldErrors.description}
                  >
                    <textarea
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      disabled={!allFields.has("description")}
                      placeholder="In one sentence, what does success look like?"
                      rows={1}
                      className="w-full resize-none rounded-md border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </FormFieldWrapper>

                  {/* Client */}
                  <FormFieldWrapper
                    label="Client"
                    locked={!allFields.has("client")}
                    active={false}
                    hint="Select if this is for an external client"
                  >
                    <select
                      value={form.client}
                      onChange={(e) => updateField("client", e.target.value)}
                      disabled={!allFields.has("client")}
                      className="w-full rounded-md border border-input bg-card px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <option value="">Select a client...</option>
                      {clients.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </FormFieldWrapper>
                </div>
              </div>

              {/* Section: Timeline */}
              <div className="mb-5">
                <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-accent/10 text-[9px] font-bold text-accent">2</span>
                  Timeline
                </h3>
                <FormFieldWrapper
                  label="Deadline"
                  locked={!allFields.has("deadline")}
                  active={false}
                  error={fieldErrors.deadline}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="date"
                      min={todayStr}
                      value={form.deadline}
                      onChange={(e) => updateField("deadline", e.target.value)}
                      disabled={!allFields.has("deadline")}
                      className={cn(
                        "flex-1 rounded-md border bg-card px-2.5 py-1.5 text-sm text-foreground outline-none transition-colors focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-40",
                        fieldErrors.deadline ? "border-destructive" : "border-input"
                      )}
                    />
                  </div>
                </FormFieldWrapper>
              </div>

              {/* Section: Brief */}
              <div className="mb-5">
                <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-accent/10 text-[9px] font-bold text-accent">3</span>
                  Brief
                </h3>
                <FormFieldWrapper
                  label="Project Brief"
                  locked={!allFields.has("brief")}
                  active={false}
                >
                  <textarea
                    value={form.brief}
                    onChange={(e) => updateField("brief", e.target.value)}
                    disabled={!allFields.has("brief")}
                    placeholder="Goals, deliverables, key requirements..."
                    rows={3}
                    className="w-full resize-none rounded-md border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                </FormFieldWrapper>
              </div>

              {/* Section: Team */}
              <div className="mb-5">
                <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-accent/10 text-[9px] font-bold text-accent">4</span>
                  Team
                </h3>
                <FormFieldWrapper
                  label="Team Members"
                  locked={!allFields.has("teamMembers")}
                  active={false}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {allMembers.map((m) => {
                        const selected = form.teamMembers.includes(m.id)
                        return (
                          <button
                            key={m.id}
                            onClick={() => allFields.has("teamMembers") && toggleTeamMember(m.id)}
                            disabled={!allFields.has("teamMembers")}
                            className={cn(
                              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40",
                              selected
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border bg-card text-muted-foreground hover:border-accent/50"
                            )}
                          >
                            {m.type === "agent" ? (
                              <Bot className="h-3 w-3 shrink-0 opacity-60" />
                            ) : (
                              <Users className="h-3 w-3 shrink-0 opacity-60" />
                            )}
                            <span>{m.role}</span>
                            {selected && <Check className="h-3 w-3 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>
                    {form.teamMembers.length > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        {form.teamMembers.length} member{form.teamMembers.length !== 1 && "s"} selected
                      </p>
                    )}
                  </div>
                </FormFieldWrapper>
              </div>

              {/* Section: Tools - Integration Hub */}
              <div className="mb-2">
                <h3 className="mb-2.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span className="flex h-4 w-4 items-center justify-center rounded bg-accent/10 text-[9px] font-bold text-accent">5</span>
                  <Wrench className="h-3 w-3" />
                  Tools
                </h3>

                {form.teamMembers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-3 py-5 text-center">
                    <Wrench className="mx-auto mb-1.5 h-5 w-5 text-muted-foreground/30" />
                    <p className="text-xs text-muted-foreground">Select team members above to see suggested integrations</p>
                  </div>
                ) : toolsSkipped ? (
                  <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">
                    <p className="text-xs text-muted-foreground">
                      Tools skipped. You can add them later in Project Settings.
                    </p>
                    <button
                      onClick={() => setToolsSkipped(false)}
                      className="mt-1.5 text-[11px] font-medium text-accent underline-offset-2 hover:underline"
                    >
                      Show tools again
                    </button>
                  </div>
                ) : suggestedTools.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border px-3 py-4 text-center">
                    <p className="text-xs text-muted-foreground">No integrations matched for the selected team</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Category-grouped tool cards */}
                    {activeCategories.map((category) => {
                      const categoryTools = suggestedTools.filter((t) => t.category === category)
                      if (categoryTools.length === 0) return null
                      return (
                        <div key={category}>
                          {/* Category hint from Mistol */}
                          <div className="mb-2 flex items-start gap-2">
                            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10">
                              <Sparkles className="h-2.5 w-2.5 text-accent" />
                            </div>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                              {categoryHints[category]}
                            </p>
                          </div>

                          {/* Tool cards - vertical stack */}
                          <div className="space-y-1.5">
                            {categoryTools.map((tool) => {
                              const status = toolStatuses[tool.id] || "not_linked"
                              const isConnecting = connectingTool === tool.id
                              const isConnected = status === "connected"
                              const isError = status === "error"

                              return (
                                <div
                                  key={tool.id}
                                  className={cn(
                                    "flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-all",
                                    isConnecting && "border-accent/40 bg-accent/5",
                                    isConnected && !isConnecting && "border-emerald-500/30 bg-emerald-500/5",
                                    isError && "border-destructive/30 bg-destructive/5",
                                    !isConnected && !isError && !isConnecting && "border-border bg-card"
                                  )}
                                >
                                  {/* Icon */}
                                  <div className={cn(
                                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                    isConnected ? "bg-emerald-500/10 text-emerald-600" :
                                    isError ? "bg-destructive/10 text-destructive" :
                                    "bg-muted text-muted-foreground"
                                  )}>
                                    {isConnecting ? (
                                      <Loader2 className="h-4 w-4 animate-spin text-accent" />
                                    ) : (
                                      <tool.icon className="h-4 w-4" />
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs font-semibold text-card-foreground">{tool.name}</p>
                                      {isConnected && (
                                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600">
                                          <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                          Connected
                                        </span>
                                      )}
                                      {isError && (
                                        <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[9px] font-medium text-destructive">
                                          <span className="h-1 w-1 rounded-full bg-destructive" />
                                          Reconnect
                                        </span>
                                      )}
                                    </div>
                                    <p className="truncate text-[10px] text-muted-foreground">
                                      {isConnecting ? "Establishing secure connection..." : tool.description}
                                    </p>
                                  </div>

                                  {/* Action button */}
                                  <div className="shrink-0">
                                    {isConnecting ? (
                                      <span className="text-[10px] font-medium text-accent">Connecting...</span>
                                    ) : isConnected ? (
                                      <button
                                        onClick={() => handleDisconnectTool(tool.id)}
                                        className="rounded-md border border-border px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                      >
                                        Disconnect
                                      </button>
                                    ) : isError ? (
                                      <button
                                        onClick={() => handleConnectTool(tool.id)}
                                        className="rounded-md border border-destructive/30 bg-destructive/5 px-2.5 py-1 text-[10px] font-semibold text-destructive transition-colors hover:bg-destructive/10"
                                      >
                                        Fix
                                      </button>
                                    ) : (
                                      <button
                                        onClick={() => handleConnectTool(tool.id)}
                                        className="rounded-md bg-accent px-2.5 py-1 text-[10px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                                      >
                                        Connect
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}

                    {/* Summary + skip */}
                    <div className="flex items-center justify-between pt-1">
                      {form.tools.length > 0 ? (
                        <p className="text-[10px] text-muted-foreground">
                          {form.tools.length} tool{form.tools.length !== 1 && "s"} connected
                        </p>
                      ) : (
                        <p className="text-[10px] text-muted-foreground">No tools connected yet</p>
                      )}
                      <button
                        onClick={() => setToolsSkipped(true)}
                        className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      >
                        Skip for now
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sticky Footer: Create Project button */}
          <div className="absolute inset-x-0 bottom-0 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-sm sm:px-8">
            <div className="mx-auto flex max-w-2xl items-center gap-3">
              <button
                onClick={handleCreateProject}
                disabled={!form.name.trim() || form.name.trim().length < 3 || !!fieldErrors.name || !!fieldErrors.deadline}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                  projectReady
                    ? "animate-pulse bg-accent text-accent-foreground shadow-lg shadow-accent/25 hover:shadow-accent/40"
                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                )}
              >
                {projectReady ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    {"Let's Do This!"}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Project
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <div className="ml-auto hidden text-[11px] text-muted-foreground sm:block">
                {!form.name.trim()
                  ? "Project name required to continue"
                  : form.name.trim().length < 3
                  ? "Name needs at least 3 characters"
                  : `${filledCount} of 7 fields completed`}
              </div>
            </div>
          </div>

          {/* Floating Mistol FAB (visible on form track, mobile only, when not on mistol track) */}
          {activeTrack === "form" && !manualMode && (
            <button
              onClick={() => setActiveTrack("mistol")}
              className="absolute bottom-20 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/25 transition-transform hover:scale-105 md:hidden"
              aria-label="Chat with Mistol"
            >
              <div className="h-8 w-8">
                <img src="/agents/mistol.png" alt="Mistol" className="h-full w-full rounded-full object-cover" />
                <span className="bg-accent text-accent-foreground text-xs font-bold">P</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ----- Sub-components -----

function FormFieldWrapper({ label, locked, active, required, error, hint, children }) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-all",
        error
          ? "border-destructive/50 bg-destructive/5"
          : locked
          ? "border-border/50 bg-muted/30 opacity-60"
          : active
          ? "border-accent/40 bg-accent/5 shadow-sm"
          : "border-border bg-card"
      )}
    >
      <label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
        {locked && (
          <span className="text-[10px] font-normal normal-case tracking-normal">
            (Chat with Mistol to unlock)
          </span>
        )}
        {active && (
          <span className="flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
        )}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">{hint}</p>
      )}
    </div>
  )
}
