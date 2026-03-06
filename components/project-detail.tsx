"use client"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  ListChecks,
  Loader2,
  MessageSquare,
  Mic,
  MicOff,
  MoreVertical,
  Pencil,
  Plus,
  Presentation,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserPlus,
  Bot,
  Link,
  X,
  File,
  Eye,
  SlidersHorizontal,
} from "lucide-react"
import type { Project, Agent, Task, ProjectDocument } from "@/lib/workspace-data"
import {
  agents as allAgents,
  agentMessages as allMessages,
} from "@/lib/workspace-data"
import { useState, useRef, useCallback } from "react"
import { TaskDetailPanel } from "@/components/task-detail-panel"

interface ProjectDetailProps {
  project: Project
  onBack: () => void
}

const statusColors: Record<string, string> = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Pre-Launch": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-blue-100 text-blue-700 border-blue-200",
  "On Hold": "bg-muted text-muted-foreground border-border",
}

/* -- Task Status Icon -- */
function TaskStatusIcon({ status }: { status: string }) {
  switch (status) {
    case "Completed":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case "In Progress":
      return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/50" />
  }
}

/* -- Progress bar color by value -- */
function progressBarColor(progress: number): string {
  if (progress >= 100) return "[&>div]:bg-emerald-500"
  if (progress >= 50) return "[&>div]:bg-accent"
  if (progress > 0) return "[&>div]:bg-amber-500"
  return "[&>div]:bg-muted-foreground/20"
}

/* -- Document icon by type -- */
function DocIcon({ type }: { type: ProjectDocument["type"] }) {
  switch (type) {
    case "sheet":
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />
    case "slide":
      return <Presentation className="h-4 w-4 text-amber-500" />
    case "brief":
      return <Sparkles className="h-4 w-4 text-accent" />
    case "link":
      return <Link className="h-4 w-4 text-blue-500" />
    case "upload":
      return <File className="h-4 w-4 text-violet-500" />
    default:
      return <FileText className="h-4 w-4 text-blue-500" />
  }
}

function docTypeLabel(type: ProjectDocument["type"]): string {
  switch (type) {
    case "sheet": return "Google Sheet"
    case "slide": return "Google Slides"
    case "brief": return "Project Brief"
    case "link": return "External Link"
    case "upload": return "Uploaded File"
    default: return "Google Doc"
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB"
  return (bytes / (1024 * 1024)).toFixed(1) + " MB"
}

/* -- Read-only mini calendar for deadline popover -- */
function MiniCalendar({ dateStr }: { dateStr: string }) {
  const date = new Date(dateStr + "T00:00:00")
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const isToday = (d: number) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
  }

  return (
    <div>
      <p className="mb-2 text-center text-xs font-semibold text-foreground">{monthName}</p>
      <div className="grid grid-cols-7 gap-px text-center text-[10px]">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-0.5 font-medium text-muted-foreground">{d}</div>
        ))}
        {cells.map((d, i) => (
          <div
            key={i}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-[11px]",
              d === null && "invisible",
              d === day && "bg-accent font-bold text-accent-foreground",
              d !== null && d !== day && isToday(d) && "border border-accent/50 text-accent",
              d !== null && d !== day && !isToday(d) && "text-card-foreground"
            )}
          >
            {d}
          </div>
        ))}
      </div>
    </div>
  )
}

/* -- Main Component -- */
export function ProjectDetail({ project, onBack }: ProjectDetailProps) {
  // Sub-tab within the left panel
  const [subTab, setSubTab] = useState<"tasks" | "description" | "documents">("tasks")
  const [taskFilter, setTaskFilter] = useState<"All" | "In Progress" | "Todo" | "Completed">("All")
  const [mobilePanel, setMobilePanel] = useState<"main" | "chat">("main")
  const [chatInput, setChatInput] = useState("")
  const [isListening, setIsListening] = useState(false)
  const [deadlinePopover, setDeadlinePopover] = useState(false)
  const deadlineRef = useRef<HTMLButtonElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskPanelOpen, setTaskPanelOpen] = useState(false)
  const [tasks, setTasks] = useState<Task[]>(project.tasks)
  const [addingTask, setAddingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState("")

  // Description editing
  const [editingDesc, setEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState(project.description)

  // Documents
  const [documents, setDocuments] = useState<ProjectDocument[]>(project.documents || [])
  const [newDocName, setNewDocName] = useState("")
  const [newDocUrl, setNewDocUrl] = useState("")
  const [newDocType, setNewDocType] = useState<ProjectDocument["type"]>("doc")
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Stepped add flow: step 1 = name, step 2 = choose upload or link
  const [addStep, setAddStep] = useState<"idle" | "name" | "upload" | "link">("idle")

  // Doc filter
  type DocFilter = "all" | "upload" | "link" | "brief"
  const [docFilter, setDocFilter] = useState<DocFilter>("all")

  // Brief/doc viewer
  const [viewingDoc, setViewingDoc] = useState<ProjectDocument | null>(null)

  const toggleVoice = useCallback(() => {
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"
    recognitionRef.current = recognition

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("")
      setChatInput(transcript)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
    }

    recognition.start()
    setIsListening(true)
  }, [isListening])

  const projectAgents = project.agents
    .map((id) => allAgents.find((a) => a.id === id))
    .filter(Boolean) as Agent[]

  const projectMessages = allMessages.filter((m) => m.projectId === project.id)

  function handleOpenTask(task: Task) {
    setSelectedTask(task)
    setTaskPanelOpen(true)
  }

  function handleUpdateTask(updated: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setSelectedTask(updated)
  }

  function handleDeleteTask(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setTaskPanelOpen(false)
    setSelectedTask(null)
  }

  function addTask() {
    if (!newTaskTitle.trim()) return
    const newTask: Task = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Todo",
      assignedAgents: project.agents.length > 0 ? [project.agents[0]] : [],
      progress: 0,
      priority: "Medium",
    }
    setTasks((prev) => [...prev, newTask])
    setNewTaskTitle("")
    setAddingTask(false)
  }

  function saveDescription() {
    // In a real app, persist to DB
    setEditingDesc(false)
  }

  function resetAddFlow() {
    setAddStep("idle")
    setNewDocName("")
    setNewDocUrl("")
    setNewDocType("doc")
  }

  function addDocument() {
    if (!newDocName.trim()) return
    const doc: ProjectDocument = {
      id: `d-${Date.now()}`,
      name: newDocName.trim(),
      type: newDocType,
      url: newDocUrl.trim() || undefined,
      addedBy: "Paul",
      addedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    }
    setDocuments((prev) => [...prev, doc])
    resetAddFlow()
  }

  function deleteDocument(docId: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== docId))
  }

  function handleFiles(files: FileList | null, overrideName?: string) {
    if (!files || files.length === 0) return
    const now = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })
    const newDocs: ProjectDocument[] = Array.from(files).map((file, i) => ({
      id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: overrideName && files.length === 1 ? overrideName : file.name.replace(/\.[^.]+$/, ""),
      type: "upload" as const,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      addedBy: "Paul",
      addedAt: now,
    }))
    setDocuments((prev) => [...prev, ...newDocs])
    setIsDragging(false)
    resetAddFlow()
  }

  function onDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function onDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    handleFiles(e.dataTransfer.files)
  }

  const filteredTasks =
    taskFilter === "All"
      ? tasks
      : tasks.filter((t) => t.status === taskFilter)

  const completedTasks = tasks.filter((t) => t.status === "Completed").length
  const totalTasks = tasks.length
  const completionPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* -- Header Bar -- */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-6 sm:py-3.5">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBack}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              {project.name}
            </h1>
            <Badge
              variant="outline"
              className={cn("hidden text-[11px] font-medium border sm:inline-flex", statusColors[project.status])}
            >
              {project.status}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Completion summary */}
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-muted-foreground">
              {completedTasks}/{totalTasks} tasks
            </span>
            <Progress value={completionPct} className={cn("h-1.5 w-24", "[&>div]:bg-accent")} />
            <span className="text-xs font-semibold text-foreground">{completionPct}%</span>
          </div>

          {/* Deadline - clickable */}
          <div className="relative hidden md:block">
            <button
              ref={deadlineRef}
              onClick={() => setDeadlinePopover((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Calendar className="h-3.5 w-3.5" />
              {project.deadline}
            </button>
            {deadlinePopover && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDeadlinePopover(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-card p-3 shadow-lg">
                  {project.deadlineDate ? (
                    <>
                      <div className="mb-2.5 flex items-center justify-between">
                        <p className="text-[11px] font-medium text-muted-foreground">Project Deadline</p>
                        <p className="text-xs font-semibold text-foreground">
                          {new Date(project.deadlineDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <MiniCalendar dateStr={project.deadlineDate} />
                      <div className="mt-2.5 border-t border-border pt-2">
                        <p className="text-center text-[10px] text-muted-foreground">{project.deadline}</p>
                      </div>
                    </>
                  ) : (
                    <p className="py-2 text-center text-xs text-muted-foreground">No deadline date set</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Agent avatars */}
          <div className="flex items-center -space-x-2">
            {projectAgents.slice(0, 4).map((agent) => (
              <Avatar
                key={agent.id}
                className="h-7 w-7 border-2 border-card ring-1 ring-accent/20"
              >
                <AvatarImage src={agent.avatar} alt={agent.name} />
                <AvatarFallback className="bg-accent text-accent-foreground text-[9px] font-bold">
                  {agent.name[0]}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <button className="hidden items-center gap-1.5 rounded-lg border border-dashed border-accent/50 px-2.5 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/10 sm:flex">
            <UserPlus className="h-3 w-3" />
            Assign Agent
          </button>
        </div>
      </header>

      {/* Sub-tabs: Description | Documents | Tasks -- below header */}
      <div className="flex items-center gap-0 border-b border-border bg-card px-3 sm:px-5">
        {([
          { id: "tasks" as const, label: "Tasks", icon: ListChecks, count: totalTasks },
          { id: "description" as const, label: "Description", icon: FileText },
          { id: "documents" as const, label: "Documents", icon: FileSpreadsheet, count: documents.length },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:px-4",
              subTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                  subTab === tab.id
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Mobile tab toggle: Main vs Chat */}
      <div className="flex border-b border-border bg-card md:hidden">
        <button
          onClick={() => setMobilePanel("main")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
            mobilePanel === "main"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground"
          )}
        >
          <ListChecks className="h-3.5 w-3.5" />
          Project
        </button>
        <button
          onClick={() => setMobilePanel("chat")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
            mobilePanel === "chat"
              ? "border-b-2 border-accent text-accent"
              : "text-muted-foreground"
          )}
        >
          <MessageSquare className="h-3.5 w-3.5" />
          Agent Chat
        </button>
      </div>

      {/* -- Main content: Left panel + Chat (right) -- */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT: Sub-tab content */}
        <div className={cn(
          "flex flex-1 flex-col overflow-hidden md:border-r md:border-border",
          mobilePanel === "chat" ? "hidden md:flex" : "flex"
        )}>

          {/* === TASKS TAB === */}
          {subTab === "tasks" && (
            <>
              {/* Task filter tabs */}
              <div className="border-b border-border bg-card px-3 sm:px-5">
                <div className="flex">
                  {(["All", "In Progress", "Todo", "Completed"] as const).map((tab) => {
                    const count =
                      tab === "All"
                        ? tasks.length
                        : tasks.filter((t) => t.status === tab).length
                    return (
                      <button
                        key={tab}
                        onClick={() => setTaskFilter(tab)}
                        className={cn(
                          "flex shrink-0 items-center gap-1 border-b-2 px-2.5 py-2.5 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-4 sm:text-xs",
                          taskFilter === tab
                            ? "border-accent text-accent"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab}
                        <span
                          className={cn(
                            "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                            taskFilter === tab
                              ? "bg-accent text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Add Task bar */}
              <div className="border-b border-border bg-card px-3 py-2 sm:px-5">
                <button
                  onClick={() => setAddingTask(true)}
                  className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-accent/50 hover:bg-muted/50 hover:text-foreground"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add a task...
                </button>
              </div>

              {/* Inline add task form */}
              {addingTask && (
                <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2.5 sm:px-5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-accent/40">
                    <Plus className="h-2.5 w-2.5 text-accent/40" />
                  </div>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    autoFocus
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-card-foreground placeholder:text-muted-foreground outline-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addTask()
                      if (e.key === "Escape") { setAddingTask(false); setNewTaskTitle("") }
                    }}
                  />
                  <button
                    onClick={addTask}
                    disabled={!newTaskTitle.trim()}
                    className="rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => { setAddingTask(false); setNewTaskTitle("") }}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Task rows */}
              <div className="flex-1 overflow-y-auto bg-background">
                {filteredTasks.length > 0 ? (
                  <div className="divide-y divide-border">
                    {filteredTasks.map((task) => {
                      const taskAgents = task.assignedAgents
                        .map((id) => allAgents.find((a) => a.id === id))
                        .filter(Boolean)
                      return (
                        <div
                          key={task.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleOpenTask(task)}
                          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleOpenTask(task) }}
                          className="group flex cursor-pointer items-center gap-3 bg-card px-3 py-3 transition-colors hover:bg-muted/50 sm:gap-4 sm:px-5 sm:py-3.5"
                        >
                          <TaskStatusIcon status={task.status} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "text-[13px] font-medium text-card-foreground",
                                  task.status === "Completed" && "line-through text-muted-foreground"
                                )}
                              >
                                {task.title}
                              </span>
                            </div>
                            <div className="mt-1.5 flex items-center gap-2">
                              <Progress
                                value={task.progress}
                                className={cn("h-1 w-28", progressBarColor(task.progress))}
                              />
                              <span className="text-[10px] font-medium text-muted-foreground">
                                {task.progress}%
                              </span>
                            </div>
                          </div>
                          {taskAgents.length > 0 ? (
                            <div className="flex items-center -space-x-1.5">
                              {taskAgents.map((agent) => agent && (
                                <Avatar key={agent.id} className="h-5 w-5 border border-card">
                                  <AvatarImage src={agent.avatar} alt={agent.name} />
                                  <AvatarFallback className="bg-accent text-accent-foreground text-[8px] font-bold">
                                    {agent.name[0]}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {taskAgents.length === 1 && taskAgents[0] && (
                                <span className="ml-2.5 hidden text-[11px] text-muted-foreground lg:inline">
                                  {taskAgents[0].name}
                                </span>
                              )}
                              {taskAgents.length > 1 && (
                                <span className="ml-2.5 hidden text-[11px] text-muted-foreground lg:inline">
                                  {taskAgents.length} agents
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground/40">Unassigned</span>
                          )}
                          <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
                            <Clock className="h-3 w-3" />
                            {task.date}
                          </span>
                          <button
                            className="text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
                            aria-label="Task options"
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    No {taskFilter === "All" ? "" : taskFilter.toLowerCase()} tasks
                  </div>
                )}
              </div>
            </>
          )}

          {/* === DESCRIPTION TAB === */}
          {subTab === "description" && (
            <div className="flex-1 overflow-y-auto bg-background">
              <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-6">
                <div className="rounded-lg border border-border bg-card">
                  {/* Description header */}
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Description</h3>
                    <div className="flex items-center gap-1.5">
                      {editingDesc ? (
                        <>
                          <button
                            onClick={saveDescription}
                            className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                          >
                            <Save className="h-3 w-3" />
                            Save
                          </button>
                          <button
                            onClick={() => { setDescDraft(project.description); setEditingDesc(false) }}
                            className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => setEditingDesc(true)}
                          className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description body */}
                  <div className="px-4 py-4">
                    {editingDesc ? (
                      <textarea
                        value={descDraft}
                        onChange={(e) => setDescDraft(e.target.value)}
                        rows={6}
                        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors focus:ring-2 focus:ring-accent/50"
                        autoFocus
                      />
                    ) : (
                      <p className="text-sm leading-relaxed text-card-foreground">
                        {descDraft || "No description added yet."}
                      </p>
                    )}
                  </div>

                  {/* Meta info */}
                  <div className="border-t border-border px-4 py-2.5">
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {project.date}
                      </span>
                      <span className="relative">
                        <button
                          onClick={() => setDeadlinePopover((v) => !v)}
                          className="flex items-center gap-1 rounded px-1 py-0.5 transition-colors hover:bg-muted"
                        >
                          <Clock className="h-3 w-3" />
                          {project.deadline}
                        </button>
                        {deadlinePopover && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setDeadlinePopover(false)} />
                            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-card p-3 shadow-lg">
                              {project.deadlineDate ? (
                                <>
                                  <div className="mb-2.5 flex items-center justify-between">
                                    <p className="text-[11px] font-medium text-muted-foreground">Project Deadline</p>
                                    <p className="text-xs font-semibold text-foreground">
                                      {new Date(project.deadlineDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                  </div>
                                  <MiniCalendar dateStr={project.deadlineDate} />
                                  <div className="mt-2.5 border-t border-border pt-2">
                                    <p className="text-center text-[10px] text-muted-foreground">{project.deadline}</p>
                                  </div>
                                </>
                              ) : (
                                <p className="py-2 text-center text-xs text-muted-foreground">No deadline date set</p>
                              )}
                            </div>
                          </>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        {projectAgents.length} agent{projectAgents.length !== 1 ? "s" : ""} assigned
                      </span>
                      {project.client && (
                        <span>Client: {project.client}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Brief section (if exists) */}
                {project.brief && (
                  <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5">
                    <div className="flex items-center gap-2 border-b border-accent/10 px-4 py-2.5">
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      <h3 className="text-xs font-semibold text-accent">Project Brief</h3>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm leading-relaxed text-card-foreground">{project.brief}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* === DOCUMENTS TAB === */}
          {subTab === "documents" && (
            <div className="flex-1 overflow-y-auto bg-background">
              <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-6">

                {/* === Stepped Add Flow === */}
                {addStep === "idle" && (
                  <div className="mb-4 flex items-center gap-2">
                    <button
                      onClick={() => setAddStep("name")}
                      className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                    >
                      <Plus className="h-3 w-3" />
                      Add Document
                    </button>
                  </div>
                )}

                {/* Step 1: Enter name */}
                {addStep === "name" && (
                  <div className="mb-4 rounded-lg border border-accent/30 bg-card p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground">Step 1: Document Name</h4>
                      <button onClick={resetAddFlow} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={newDocName}
                      onChange={(e) => setNewDocName(e.target.value)}
                      placeholder="Give this document a name..."
                      autoFocus
                      className="mb-3 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newDocName.trim()) setAddStep("upload")
                      }}
                    />
                    <p className="mb-3 text-[11px] text-muted-foreground">How would you like to add this document?</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => newDocName.trim() && setAddStep("upload")}
                        disabled={!newDocName.trim()}
                        className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                      >
                        <Upload className="h-3 w-3" />
                        Upload a File
                      </button>
                      <button
                        onClick={() => newDocName.trim() && setAddStep("link")}
                        disabled={!newDocName.trim()}
                        className="flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-40"
                      >
                        <Link className="h-3 w-3" />
                        Add a Link
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2a: Upload file */}
                {addStep === "upload" && (
                  <div className="mb-4 rounded-lg border border-accent/30 bg-card p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground">
                        Upload: <span className="text-accent">{newDocName}</span>
                      </h4>
                      <button onClick={resetAddFlow} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mb-3 text-[11px] text-muted-foreground">Choose a file or drag and drop below</p>
                    <div
                      onDragOver={onDragOver}
                      onDragLeave={onDragLeave}
                      onDrop={(e) => { e.preventDefault(); e.stopPropagation(); handleFiles(e.dataTransfer.files, newDocName.trim()); }}
                      className={cn(
                        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 text-center transition-colors",
                        isDragging ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"
                      )}
                    >
                      <Upload className={cn("mb-1.5 h-5 w-5", isDragging ? "text-accent" : "text-muted-foreground/40")} />
                      <p className="text-xs font-medium text-card-foreground">
                        {isDragging ? "Drop here" : "Drag file here"}
                      </p>
                      <p className="mb-2 text-[10px] text-muted-foreground">Word, PDF, images, spreadsheets, etc.</p>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                      >
                        <Upload className="h-3 w-3" />
                        Browse Files
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files, newDocName.trim())}
                        accept=".doc,.docx,.pdf,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.svg,.zip"
                      />
                    </div>
                    <button
                      onClick={() => setAddStep("name")}
                      className="mt-2 text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                    >
                      Back
                    </button>
                  </div>
                )}

                {/* Step 2b: Add link */}
                {addStep === "link" && (
                  <div className="mb-4 rounded-lg border border-accent/30 bg-card p-4">
                    <div className="mb-1 flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-foreground">
                        Link: <span className="text-accent">{newDocName}</span>
                      </h4>
                      <button onClick={resetAddFlow} className="text-muted-foreground hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="mb-3 text-[11px] text-muted-foreground">Paste a URL to a Google Doc, Sheet, Slides, or any link</p>
                    <input
                      type="url"
                      value={newDocUrl}
                      onChange={(e) => setNewDocUrl(e.target.value)}
                      placeholder="https://docs.google.com/..."
                      autoFocus
                      className="mb-2.5 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent/50"
                    />
                    <div className="mb-3 flex items-center gap-2">
                      <label className="text-[11px] text-muted-foreground">Type:</label>
                      <select
                        value={newDocType}
                        onChange={(e) => setNewDocType(e.target.value as ProjectDocument["type"])}
                        className="rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                      >
                        <option value="doc">Google Doc</option>
                        <option value="sheet">Google Sheet</option>
                        <option value="slide">Google Slides</option>
                        <option value="brief">Brief</option>
                        <option value="link">External Link</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={addDocument}
                        disabled={!newDocUrl.trim()}
                        className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                        Add Link
                      </button>
                      <button
                        onClick={() => setAddStep("name")}
                        className="text-[11px] text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                )}

                {/* Filter/sort bar */}
                {documents.length > 0 && (
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      {(() => {
                        const filtered = docFilter === "all" ? documents
                          : docFilter === "upload" ? documents.filter((d) => d.type === "upload")
                          : docFilter === "brief" ? documents.filter((d) => d.type === "brief")
                          : documents.filter((d) => d.type !== "upload" && d.type !== "brief")
                        return `${filtered.length} of ${documents.length} document${documents.length !== 1 ? "s" : ""}`
                      })()}
                    </p>
                    <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
                      {([
                        { key: "all" as DocFilter, label: "All" },
                        { key: "upload" as DocFilter, label: "Uploads" },
                        { key: "link" as DocFilter, label: "Links" },
                        { key: "brief" as DocFilter, label: "Briefs" },
                      ]).map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setDocFilter(f.key)}
                          className={cn(
                            "rounded px-2 py-1 text-[10px] font-medium transition-colors",
                            docFilter === f.key
                              ? "bg-accent text-accent-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Document list */}
                {(() => {
                  const filtered = docFilter === "all" ? documents
                    : docFilter === "upload" ? documents.filter((d) => d.type === "upload")
                    : docFilter === "brief" ? documents.filter((d) => d.type === "brief")
                    : documents.filter((d) => d.type !== "upload" && d.type !== "brief")

                  return filtered.length > 0 ? (
                    <div className="divide-y divide-border rounded-lg border border-border bg-card">
                      {filtered.map((doc) => (
                        <div
                          key={doc.id}
                          className="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                          onClick={() => {
                            if (doc.type === "brief" && doc.content) {
                              setViewingDoc(doc)
                            } else if (doc.url) {
                              window.open(doc.url, "_blank", "noopener,noreferrer")
                            } else {
                              setViewingDoc(doc)
                            }
                          }}
                        >
                          <DocIcon type={doc.type} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-card-foreground">{doc.name}</p>
                              <Badge variant="outline" className="shrink-0 text-[9px] capitalize">
                                {docTypeLabel(doc.type)}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                              Added by {doc.addedBy} on {doc.addedAt}
                              {doc.fileSize && <span className="ml-1.5 text-muted-foreground/60">({doc.fileSize})</span>}
                            </p>
                            {doc.fileName && (
                              <p className="text-[10px] text-muted-foreground/50">{doc.fileName}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {doc.url && (
                              <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </span>
                            )}
                            {(doc.type === "brief" || doc.type === "upload") && (
                              <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
                                <Eye className="h-3.5 w-3.5" />
                              </span>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id) }}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                              aria-label={`Delete ${doc.name}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : documents.length > 0 ? (
                    <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                      <SlidersHorizontal className="mb-1.5 h-5 w-5 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">No {docFilter === "upload" ? "uploaded files" : docFilter === "brief" ? "briefs" : "linked documents"} found</p>
                    </div>
                  ) : (
                    <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                      <FileText className="mb-2 h-6 w-6 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
                      <p className="text-xs text-muted-foreground/60">Upload files or link Google Docs for agents to reference</p>
                    </div>
                  )
                })()}

                {/* Brief / Upload viewer modal */}
                {viewingDoc && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewingDoc(null)}>
                    <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <DocIcon type={viewingDoc.type} />
                          <div>
                            <h3 className="text-sm font-semibold text-card-foreground">{viewingDoc.name}</h3>
                            <p className="text-[11px] text-muted-foreground">
                              {docTypeLabel(viewingDoc.type)} -- Added by {viewingDoc.addedBy} on {viewingDoc.addedAt}
                            </p>
                          </div>
                        </div>
                        <button onClick={() => setViewingDoc(null)} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      {viewingDoc.content && (
                        <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">{viewingDoc.content}</p>
                        </div>
                      )}

                      {viewingDoc.fileName && (
                        <div className="mb-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <File className="h-5 w-5 text-violet-500" />
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{viewingDoc.fileName}</p>
                              {viewingDoc.fileSize && (
                                <p className="text-[11px] text-muted-foreground">{viewingDoc.fileSize}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {viewingDoc.url && (
                        <a
                          href={viewingDoc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open in New Tab
                        </a>
                      )}

                      {!viewingDoc.content && !viewingDoc.url && !viewingDoc.fileName && (
                        <p className="text-sm text-muted-foreground">No preview available for this document.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Agent Chat + Agents panel */}
        <div className={cn(
          "flex flex-col bg-primary md:w-[380px] md:shrink-0",
          mobilePanel === "main" ? "hidden md:flex" : "flex flex-1"
        )}>
          {/* Assigned agents strip */}
          <div className="border-b border-white/10 px-5 py-3.5">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold text-primary-foreground">
                <Bot className="h-3.5 w-3.5 text-accent" />
                Assigned Agents
              </h3>
              <span className="text-[10px] text-primary-foreground/40">
                {projectAgents.length} active
              </span>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {projectAgents.map((agent) => (
                <div key={agent.id} className="flex items-center gap-2 rounded-lg bg-white/5 px-2 py-1 sm:px-2.5 sm:py-1.5">
                  <div className="relative">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={agent.avatar} alt={agent.name} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-[8px] font-bold">
                        {agent.name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className={cn(
                        "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-primary",
                        agent.status === "active" && "bg-emerald-500",
                        agent.status === "working" && "bg-amber-500",
                        agent.status === "idle" && "bg-muted-foreground"
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-primary-foreground">{agent.name}</p>
                    <p className="text-[9px] text-primary-foreground/40">{agent.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
            <h3 className="text-sm font-semibold text-primary-foreground">Agent Chat</h3>
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
              {projectMessages.length}
            </span>
          </div>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {projectMessages.length > 0 ? (
              <div className="space-y-4">
                {projectMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2.5">
                    <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                      <AvatarImage src={msg.avatar} alt={msg.agentName} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-[9px] font-bold">
                        {msg.agentName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 max-w-[85%]">
                      <div className="mb-0.5 flex items-center gap-2">
                        <p className="text-[11px] font-medium text-primary-foreground/70">
                          {msg.agentName}
                        </p>
                        <span className="text-[10px] text-primary-foreground/30">
                          {msg.timestamp}
                        </span>
                      </div>
                      <div className="rounded-lg bg-white/10 px-3 py-2">
                        <p className="text-[13px] leading-relaxed text-primary-foreground/90">
                          {msg.message}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-primary-foreground/30">
                No agent messages yet
              </div>
            )}
          </div>

          {/* Chat input */}
          <div className="border-t border-white/10 p-3">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoice}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isListening
                    ? "bg-destructive text-destructive-foreground animate-pulse"
                    : "bg-white/10 text-primary-foreground/60 hover:bg-white/20 hover:text-primary-foreground"
                )}
                aria-label={isListening ? "Stop listening" : "Voice command"}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={isListening ? "Listening..." : "Type a message..."}
                className={cn(
                  "flex-1 rounded-lg bg-white/10 px-3 py-2 text-sm text-primary-foreground placeholder-primary-foreground/30 outline-none focus:ring-1 focus:ring-accent",
                  isListening && "ring-1 ring-destructive/50"
                )}
              />
              <button
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Detail Sheet */}
      <TaskDetailPanel
        task={selectedTask}
        open={taskPanelOpen}
        onClose={() => {
          setTaskPanelOpen(false)
          setSelectedTask(null)
        }}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        projectAgents={project.agents}
      />
    </div>
  )
}
