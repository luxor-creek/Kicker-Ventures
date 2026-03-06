"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  ArrowLeft,
  Bot,
  Calendar,
  Check,
  ChevronRight,
  FileText,
  Hand,
  Loader2,
  Mic,
  MicOff,
  Plus,
  Send,
  Sparkles,
  Users,
  Wrench,
  Github,
  Share2,
  BarChart3,
  MessageSquare,
  Palette,
  Code2,
  Megaphone,
  Database,
  Globe,
  FolderOpen,
  Mail,
  Rocket,
  X,
} from "lucide-react"
import { agents, employees, clients, type Project, type KanbanStatus } from "@/lib/workspace-data"

// ----- Tool Integration Hub -----

type ToolStatus = "not_linked" | "connected" | "error"
type ToolCategory = "developer" | "marketing" | "general" | "design"

interface ProjectTool {
  id: string
  name: string
  icon: React.ElementType
  description: string
  category: ToolCategory
  linkedRoles: string[]
  defaultStatus: ToolStatus
}

const projectTools: ProjectTool[] = [
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

// Category labels for Piper's contextual hints
const categoryHints: Record<ToolCategory, string> = {
  developer: "Since we have a developer on the team, here are some tools to sync code and infrastructure.",
  marketing: "Your marketing crew will love these -- connect ad platforms and email tools to keep campaigns in sync.",
  design: "For your design workflow, these tools keep assets and prototypes linked to the project.",
  general: "These collaboration tools keep the whole team connected.",
}

// ----- Types -----

interface PiperMessage {
  id: string
  role: "piper" | "user"
  text: string
  chips?: string[]
  field?: keyof FormData
}

interface FormData {
  name: string
  description: string
  deadline: string
  client: string
  teamMembers: string[]
  brief: string
  tools: string[]
}

type FormField = keyof FormData

interface FieldValidation {
  valid: boolean
  message: string
  piperMessage: string
}

// ----- Validation -----

function validateField(field: FormField, value: string | string[]): FieldValidation {
  switch (field) {
    case "name": {
      const v = (value as string).trim()
      if (v.length > 0 && v.length < 3) {
        return {
          valid: false,
          message: "Name too short (min 3 characters).",
          piperMessage: "That's a bit short! Give it a name with at least 3 letters.",
        }
      }
      if (v.length > 50) {
        return {
          valid: false,
          message: "Name too long (max 50 characters).",
          piperMessage: "Whoa, let's keep it under 50 characters. A punchy name sticks better!",
        }
      }
      return { valid: true, message: "", piperMessage: "" }
    }
    case "deadline": {
      if (!value) return { valid: true, message: "", piperMessage: "" }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const picked = new Date(value as string)
      if (picked < today) {
        return {
          valid: false,
          message: "Date must be today or later.",
          piperMessage: "Time travel? I wish! Let's pick a date today or later.",
        }
      }
      return { valid: true, message: "", piperMessage: "" }
    }
    default:
      return { valid: true, message: "", piperMessage: "" }
  }
}

// ----- Piper conversation flow -----

const PIPER_STEPS: {
  field: FormField
  question: string
  chips?: string[]
  inputType?: "text" | "date" | "textarea" | "select" | "team"
}[] = [
  {
    field: "name",
    question: "Hey there! I'm Piper, your project setup assistant. We can set up the project together here, or use the manual form to the right.\n\nSo, what are we calling this mission?",
    inputType: "text",
  },
  {
    field: "description",
    question: "Love it! In one sentence, what does success look like for this project?",
    chips: ["Launch a product", "Rebrand initiative", "Marketing campaign", "Client deliverable"],
    inputType: "text",
  },
  {
    field: "client",
    question: "Is this for an external client, or is it an internal project?",
    chips: clients,
    inputType: "select",
  },
  {
    field: "deadline",
    question: "Do we have a hard deadline, or is this more of an ongoing thing?",
    chips: ["No deadline", "End of week", "End of month"],
    inputType: "date",
  },
  {
    field: "teamMembers",
    question: "Who else is joining the squad? Pick your agents and team members.",
    inputType: "team",
  },
  {
    field: "brief",
    question: "Last step! Write a brief for the team -- goals, deliverables, anything they should know going in.",
    chips: ["Keep it lean", "Full scope needed", "Just goals for now"],
    inputType: "textarea",
  },
]

// ----- Helpers -----

const allMembers = [
  ...agents.map((a) => ({ id: a.id, name: a.name, role: a.role, avatar: a.avatar, type: "agent" as const })),
  ...employees.map((e) => ({ id: e.id, name: e.name, role: e.role, avatar: e.avatar, type: "employee" as const })),
]

// ----- Component -----

interface CreateProjectProps {
  onBack: () => void
  onSave: (project: Project) => void
}

export function CreateProject({ onBack, onSave }: CreateProjectProps) {
  // Form state
  const [form, setForm] = useState<FormData>({
    name: "",
    description: "",
    deadline: "",
    client: "",
    teamMembers: [],
    brief: "",
    tools: [],
  })
  
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormField, string>>>({})

  // Piper chat
  const [messages, setMessages] = useState<PiperMessage[]>([
    {
      id: "p0",
      role: "piper",
      text: PIPER_STEPS[0].question,
      chips: PIPER_STEPS[0].chips,
      field: PIPER_STEPS[0].field,
    },
  ])
  const [currentStep, setCurrentStep] = useState(0)
  const [chatInput, setChatInput] = useState("")
  const [manualMode, setManualMode] = useState(false)
  const [piperTyping, setPiperTyping] = useState(false)
  const [projectReady, setProjectReady] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Track (mobile): "piper" or "form"
  const [activeTrack, setActiveTrack] = useState<"piper" | "form">("piper")

  // Voice
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Form field unlock tracker
  const [unlockedFields, setUnlockedFields] = useState<Set<FormField>>(new Set(["name"]))

  // Scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, piperTyping])

  // Update form field with validation
  function updateField(field: FormField, value: string | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    // Validate inline
    const validation = validateField(field, value)
    setFieldErrors((prev) => ({
      ...prev,
      [field]: validation.valid ? undefined : validation.message,
    }))
  }

  // Process user answer and advance Piper
  const advancePiper = useCallback(
    (userText: string) => {
      const step = PIPER_STEPS[currentStep]
      if (!step) return

      // Validate before advancing
      if (step.field === "name") {
        const v = validateField("name", userText)
        if (!v.valid) {
          // Show Piper's validation response instead of advancing
          setMessages((prev) => [
            ...prev,
            { id: `u${Date.now()}`, role: "user", text: userText },
            { id: `pv${Date.now()}`, role: "piper", text: v.piperMessage, field: step.field },
          ])
          return
        }
      }
      if (step.field === "deadline" && userText !== "No deadline" && userText !== "End of week" && userText !== "End of month") {
        const v = validateField("deadline", userText)
        if (!v.valid) {
          setMessages((prev) => [
            ...prev,
            { id: `u${Date.now()}`, role: "user", text: userText },
            { id: `pv${Date.now()}`, role: "piper", text: v.piperMessage, field: step.field },
          ])
          return
        }
      }

      // Add user message
      const userMsg: PiperMessage = {
        id: `u${Date.now()}`,
        role: "user",
        text: userText,
      }
      setMessages((prev) => [...prev, userMsg])

      // Update form
      if (step.field === "teamMembers") {
        // handled via picker
      } else if (step.field === "deadline") {
        // Handle chip shortcuts
        if (userText === "No deadline") {
          updateField("deadline", "")
        } else if (userText === "End of week") {
          const d = new Date()
          d.setDate(d.getDate() + (7 - d.getDay()))
          updateField("deadline", d.toISOString().split("T")[0])
        } else if (userText === "End of month") {
          const d = new Date()
          d.setMonth(d.getMonth() + 1, 0)
          updateField("deadline", d.toISOString().split("T")[0])
        } else {
          updateField("deadline", userText)
        }
      } else {
        updateField(step.field, userText)
      }

      const nextStep = currentStep + 1

      if (nextStep < PIPER_STEPS.length) {
        setPiperTyping(true)
        setTimeout(() => {
          const next = PIPER_STEPS[nextStep]
          const piperMsg: PiperMessage = {
            id: `p${Date.now()}`,
            role: "piper",
            text: next.question,
            chips: next.chips,
            field: next.field,
          }
          setMessages((prev) => [...prev, piperMsg])
          setUnlockedFields((prev) => new Set([...prev, next.field]))
          setCurrentStep(nextStep)
          setPiperTyping(false)
        }, 800)
      } else {
        // All steps done
        setPiperTyping(true)
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `p-done`,
              role: "piper",
              text: "We're all set! Your project is looking great. Hit that Create Project button on the form and let's make it happen!",
            },
          ])
          setProjectReady(true)
          setPiperTyping(false)
          setUnlockedFields(new Set(PIPER_STEPS.map((s) => s.field)))
        }, 800)
      }
    },
    [currentStep]
  )

  function handleChatSend() {
    const text = chatInput.trim()
    if (!text) return
    setChatInput("")
    advancePiper(text)
  }

  function handleChip(chip: string) {
    advancePiper(chip)
  }

  // Toggle team member
  function toggleTeamMember(memberId: string) {
    setForm((prev) => {
      const next = prev.teamMembers.includes(memberId)
        ? prev.teamMembers.filter((id) => id !== memberId)
        : [...prev.teamMembers, memberId]
      return { ...prev, teamMembers: next }
    })
  }

  // Tool connection states
  const [toolStatuses, setToolStatuses] = useState<Record<string, ToolStatus>>(() => {
    const init: Record<string, ToolStatus> = {}
    projectTools.forEach((t) => { init[t.id] = t.defaultStatus })
    return init
  })
  const [connectingTool, setConnectingTool] = useState<string | null>(null)
  const [toolsSkipped, setToolsSkipped] = useState(false)

  // Compute suggested tools based on selected team members
  const suggestedTools = projectTools.filter((tool) =>
    tool.linkedRoles.some((role) => form.teamMembers.includes(role))
  )

  // Which categories are represented
  const activeCategories = [...new Set(suggestedTools.map((t) => t.category))]

  function handleConnectTool(toolId: string) {
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

  function handleDisconnectTool(toolId: string) {
    setToolStatuses((prev) => ({ ...prev, [toolId]: "not_linked" }))
    setForm((prev) => ({
      ...prev,
      tools: prev.tools.filter((id) => id !== toolId),
    }))
  }

  function toggleTool(toolId: string) {
    setForm((prev) => {
      const next = prev.tools.includes(toolId)
        ? prev.tools.filter((id) => id !== toolId)
        : [...prev.tools, toolId]
      return { ...prev, tools: next }
    })
  }

  // Confirm team selection in chat
  function confirmTeam() {
    const names = form.teamMembers
      .map((id) => allMembers.find((m) => m.id === id)?.name)
      .filter(Boolean)
      .join(", ")
    advancePiper(names || "No team members selected")
  }

  // Switch to manual mode
  function goManual() {
    setManualMode(true)
    setActiveTrack("form")
    setUnlockedFields(new Set(PIPER_STEPS.map((s) => s.field)))
    setMessages((prev) => [
      ...prev,
      {
        id: `p-manual`,
        role: "piper",
        text: "No worries! I'll step aside. Fill out the form at your own pace -- I'm here if you need me.",
      },
    ])
  }

  // Voice
  const toggleVoice = useCallback(() => {
    if (isListening) {
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
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognitionRef.current = recognition
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join("")
      setChatInput(transcript)
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.start()
    setIsListening(true)
  }, [isListening])

  // Save project
  function handleCreateProject() {
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

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: form.name.trim(),
      description: form.description.trim(),
      date: new Date().toLocaleDateString(),
      progress: 0,
      status: "Active",
      kanbanStatus: "Brief Needed" as KanbanStatus,
      deadline: form.deadline || "TBD",
      agents: form.teamMembers.filter((id) => agents.some((a) => a.id === id)),
      tasks: [],
      client: form.client || undefined,
      brief: form.brief || undefined,
      teamMembers: form.teamMembers,
    }
    onSave(newProject)
  }

  const currentPiperField = PIPER_STEPS[currentStep]?.field
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
          onClick={onBack}
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
            setActiveTrack("piper")
            if (manualMode) {
              /* still allow switching back to see chat */
            }
          }}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors",
            activeTrack === "piper"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Sparkles className="h-3.5 w-3.5" />
          Chat with Piper
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
        {/* Track A: Piper Chat */}
        <div
          className={cn(
            "flex flex-col overflow-hidden",
            activeTrack === "piper"
              ? "flex-1"
              : "hidden md:flex md:w-[380px] md:shrink-0 md:border-r md:border-border"
          )}
          style={{ background: "hsl(222 47% 14% / 0.04)" }}
        >
          {/* Piper header */}
          <div className="flex items-center gap-3 border-b border-border/50 px-4 py-3">
            <div className="relative">
              <Avatar className="h-9 w-9 ring-2 ring-accent/30">
                <AvatarImage src="/agents/piper.jpg" alt="Piper" />
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">P</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-card bg-emerald-500">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-200" />
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Piper</p>
              <p className="text-[11px] text-muted-foreground">Project Setup Assistant</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="outline" className="border-accent/30 text-[10px] text-accent">
                <Bot className="mr-1 h-2.5 w-2.5" />
                AI
              </Badge>
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
                  {msg.role === "piper" && (
                    <Avatar className="mt-0.5 h-7 w-7 shrink-0 ring-1 ring-accent/20">
                      <AvatarImage src="/agents/piper.jpg" alt="Piper" />
                      <AvatarFallback className="bg-accent text-accent-foreground text-[9px]">P</AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line",
                      msg.role === "piper"
                        ? "rounded-tl-md bg-card text-card-foreground shadow-sm"
                        : "rounded-tr-md bg-accent text-accent-foreground"
                    )}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Smart chips - horizontal scroll */}
              {!manualMode && !piperTyping && !projectReady && PIPER_STEPS[currentStep]?.chips && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 pl-9 scrollbar-none">
                  {PIPER_STEPS[currentStep].chips!.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChip(chip)}
                      className="shrink-0 rounded-full border border-accent/30 bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:border-accent hover:bg-accent/10 hover:shadow-sm active:scale-95"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Team member picker inline */}
              {!manualMode && !piperTyping && currentPiperField === "teamMembers" && !projectReady && (
                <div className="ml-9 space-y-2 rounded-xl border border-border bg-card p-2.5 shadow-sm">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Select Team Members</p>
                  <div className="flex flex-wrap gap-1.5">
                    {allMembers.map((m) => {
                      const selected = form.teamMembers.includes(m.id)
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggleTeamMember(m.id)}
                          className={cn(
                            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all active:scale-95",
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
                      {form.teamMembers.length} selected
                    </p>
                  )}
                  <button
                    onClick={confirmTeam}
                    className="flex items-center gap-1.5 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    <ChevronRight className="h-3 w-3" />
                    Confirm Team
                  </button>
                </div>
              )}

              {/* Piper typing indicator */}
              {piperTyping && (
                <div className="flex gap-2.5">
                  <Avatar className="mt-0.5 h-7 w-7 shrink-0 ring-1 ring-accent/20">
                    <AvatarImage src="/agents/piper.jpg" alt="Piper" />
                    <AvatarFallback className="bg-accent text-accent-foreground text-[9px]">P</AvatarFallback>
                  </Avatar>
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

          {/* Chat input */}
          {!manualMode && !projectReady && currentPiperField !== "teamMembers" && (
            <div className="border-t border-border/50 p-3">
              <div className="flex items-center gap-2">
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
                {currentPiperField === "deadline" ? (
                  <input
                    type="date"
                    min={todayStr}
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-accent"
                  />
                ) : currentPiperField === "brief" ? (
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleChatSend()
                      }
                    }}
                    placeholder="Write the brief..."
                    rows={2}
                    className="flex-1 resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-accent"
                  />
                ) : (
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChatSend()}
                    placeholder={isListening ? "Listening..." : "Type your answer..."}
                    className={cn(
                      "flex-1 rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-accent",
                      isListening && "ring-1 ring-destructive/50"
                    )}
                  />
                )}
                <button
                  onClick={handleChatSend}
                  disabled={!chatInput.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
                  aria-label="Send"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
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
                    locked={!unlockedFields.has("name")}
                    active={currentPiperField === "name" && !manualMode}
                    error={fieldErrors.name}
                  >
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      disabled={!unlockedFields.has("name")}
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
                    locked={!unlockedFields.has("description")}
                    active={currentPiperField === "description" && !manualMode}
                    error={fieldErrors.description}
                  >
                    <textarea
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      disabled={!unlockedFields.has("description")}
                      placeholder="In one sentence, what does success look like?"
                      rows={1}
                      className="w-full resize-none rounded-md border border-input bg-card px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:ring-2 focus:ring-accent/50 disabled:cursor-not-allowed disabled:opacity-40"
                    />
                  </FormFieldWrapper>

                  {/* Client */}
                  <FormFieldWrapper
                    label="Client"
                    locked={!unlockedFields.has("client")}
                    active={currentPiperField === "client" && !manualMode}
                    hint="Select if this is for an external client"
                  >
                    <select
                      value={form.client}
                      onChange={(e) => updateField("client", e.target.value)}
                      disabled={!unlockedFields.has("client")}
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
                  locked={!unlockedFields.has("deadline")}
                  active={currentPiperField === "deadline" && !manualMode}
                  error={fieldErrors.deadline}
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="date"
                      min={todayStr}
                      value={form.deadline}
                      onChange={(e) => updateField("deadline", e.target.value)}
                      disabled={!unlockedFields.has("deadline")}
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
                  locked={!unlockedFields.has("brief")}
                  active={currentPiperField === "brief" && !manualMode}
                >
                  <textarea
                    value={form.brief}
                    onChange={(e) => updateField("brief", e.target.value)}
                    disabled={!unlockedFields.has("brief")}
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
                  locked={!unlockedFields.has("teamMembers")}
                  active={currentPiperField === "teamMembers" && !manualMode}
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {allMembers.map((m) => {
                        const selected = form.teamMembers.includes(m.id)
                        return (
                          <button
                            key={m.id}
                            onClick={() => unlockedFields.has("teamMembers") && toggleTeamMember(m.id)}
                            disabled={!unlockedFields.has("teamMembers")}
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
                          {/* Category hint from Piper */}
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
                onClick={onBack}
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

          {/* Floating Piper FAB (visible on form track, mobile only, when not on piper track) */}
          {activeTrack === "form" && !manualMode && (
            <button
              onClick={() => setActiveTrack("piper")}
              className="absolute bottom-20 right-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/25 transition-transform hover:scale-105 md:hidden"
              aria-label="Chat with Piper"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src="/agents/piper.jpg" alt="Piper" />
                <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">P</AvatarFallback>
              </Avatar>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ----- Sub-components -----

function FormFieldWrapper({
  label,
  locked,
  active,
  required,
  error,
  hint,
  children,
}: {
  label: string
  locked: boolean
  active: boolean
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
}) {
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
            (Chat with Piper to unlock)
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
