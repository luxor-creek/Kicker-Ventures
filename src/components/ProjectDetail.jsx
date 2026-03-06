import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
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
  SlidersHorizontal
} from "lucide-react";
import {
  agents as allAgents,
  agentMessages as allMessages,
  fetchTasks as fetchTasksFromDB
} from "../lib/workspace-data";
import { useState, useRef, useCallback, useEffect } from "react";
import { TaskDetailPanel } from "./TaskDetailPanel";

const SUPABASE_URL = "https://mzqjivtidadjaawmlslz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cWppdnRpZGFkamFhd21sc2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTYxMDUsImV4cCI6MjA4NjU3MjEwNX0.o9WeG3HCDvPQ6SIv_EuzxR44VTZiMPfbUG3r7Ar8WD4";

async function callAgentStream({ agentSlug, message, conversationId, mode, token, onChunk, onMeta, onToolStart, onToolDone, onAgentAdded, onDelegationStart, onDelegationDone, onDone, onError }) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ agent_slug: agentSlug, message, conversation_id: conversationId || undefined, mode: mode || "chat", stream: true }),
  });
  if (!res.ok) throw new Error(`Agent error: ${res.status}`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) { currentEvent = line.slice(7).trim(); continue; }
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          if (currentEvent === "text" && onChunk) onChunk(data.chunk);
          else if (currentEvent === "meta" && onMeta) onMeta(data);
          else if (currentEvent === "tool_start" && onToolStart) onToolStart(data);
          else if (currentEvent === "tool_done" && onToolDone) onToolDone(data);
          else if (currentEvent === "agent_added" && onAgentAdded) onAgentAdded(data);
          else if (currentEvent === "delegation_start" && onDelegationStart) onDelegationStart(data);
          else if (currentEvent === "delegation_done" && onDelegationDone) onDelegationDone(data);
          else if (currentEvent === "done" && onDone) onDone(data);
          else if (currentEvent === "error" && onError) onError(data);
        } catch {}
      }
    }
  }
}
const statusLabels = {
  in_progress: "Active", planning: "Pre-Launch", completed: "Completed",
  on_hold: "On Hold", not_started: "Not Started", stalled: "Stalled",
  needs_approval: "Needs Approval", done: "Done", todo: "To Do",
};
const statusColors = {
  Active: "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Pre-Launch": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-blue-100 text-blue-700 border-blue-200",
  "On Hold": "bg-muted text-muted-foreground border-border",
  Stalled: "bg-red-100 text-red-700 border-red-200",
  "Needs Approval": "bg-violet-100 text-violet-700 border-violet-200",
  in_progress: "bg-emerald-100 text-emerald-700 border-emerald-200",
  planning: "bg-amber-100 text-amber-700 border-amber-200",
  completed: "bg-blue-100 text-blue-700 border-blue-200",
  on_hold: "bg-muted text-muted-foreground border-border",
  not_started: "bg-gray-100 text-gray-700 border-gray-200",
  stalled: "bg-red-100 text-red-700 border-red-200",
  needs_approval: "bg-violet-100 text-violet-700 border-violet-200",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200",
  todo: "bg-blue-100 text-blue-700 border-blue-200",
};
function TaskStatusIcon({ status }) {
  switch (status) {
    case "Completed":
    case "Done":
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    case "In Progress":
      return <Loader2 className="h-4 w-4 animate-spin text-amber-500" />;
    case "Stalled":
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    case "Needs Approval":
      return <Eye className="h-4 w-4 text-violet-500" />;
    default:
      return <Circle className="h-4 w-4 text-muted-foreground/50" />;
  }
}
function progressBarColor(progress) {
  if (progress >= 100) return "[&>div]:bg-emerald-500";
  if (progress >= 50) return "[&>div]:bg-accent";
  if (progress > 0) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-muted-foreground/20";
}
function DocIcon({ type }) {
  switch (type) {
    case "sheet":
      return <FileSpreadsheet className="h-4 w-4 text-emerald-500" />;
    case "slide":
      return <Presentation className="h-4 w-4 text-amber-500" />;
    case "brief":
      return <Sparkles className="h-4 w-4 text-accent" />;
    case "link":
      return <Link className="h-4 w-4 text-blue-500" />;
    case "upload":
      return <File className="h-4 w-4 text-violet-500" />;
    default:
      return <FileText className="h-4 w-4 text-blue-500" />;
  }
}
function docTypeLabel(type) {
  switch (type) {
    case "sheet":
      return "Google Sheet";
    case "slide":
      return "Google Slides";
    case "brief":
      return "Project Brief";
    case "link":
      return "External Link";
    case "upload":
      return "Uploaded File";
    default:
      return "Google Doc";
  }
}
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
function MiniCalendar({ dateStr }) {
  const date = /* @__PURE__ */ new Date(dateStr + "T00:00:00");
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const monthName = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  const isToday = (d) => {
    return today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  };
  return <div>
      <p className="mb-2 text-center text-xs font-semibold text-foreground">{monthName}</p>
      <div className="grid grid-cols-7 gap-px text-center text-[10px]">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => <div key={d} className="py-0.5 font-medium text-muted-foreground">{d}</div>)}
        {cells.map((d, i) => <div
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
          </div>)}
      </div>
    </div>;
}
export function ProjectDetail({ project: rawProject, onBack }) {
  // Normalize Supabase fields → mock-data field names so all downstream code works
  const project = {
    ...rawProject,
    name: rawProject.name || rawProject.title || "Untitled",
    agents: rawProject.agents || rawProject.assigned_agents || [],
    tasks: rawProject.tasks || [],
    documents: rawProject.documents || [],
    description: rawProject.description || "",
    brief: rawProject.brief || null,
    client: rawProject.client || null,
    date: rawProject.date || (rawProject.created_at ? new Date(rawProject.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""),
    deadline: rawProject.deadline || (rawProject.due_date ? new Date(rawProject.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""),
    deadlineDate: rawProject.deadlineDate || (rawProject.due_date ? rawProject.due_date.split("T")[0] : null),
  };
  const [subTab, setSubTab] = useState("tasks");
  const [taskFilter, setTaskFilter] = useState("All");
  const [mobilePanel, setMobilePanel] = useState("main");
  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [deadlinePopover, setDeadlinePopover] = useState(false);
  const deadlineRef = useRef(null);
  const recognitionRef = useRef(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskPanelOpen, setTaskPanelOpen] = useState(false);
  const [tasks, setTasks] = useState(project.tasks || []);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(project.description || "");
  const [documents, setDocuments] = useState(project.documents || []);
  const [newDocName, setNewDocName] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [newDocType, setNewDocType] = useState("doc");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const [addStep, setAddStep] = useState("idle");
  const [docFilter, setDocFilter] = useState("all");
  const [viewingDoc, setViewingDoc] = useState(null);
  const [projectMenu, setProjectMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(project.name);
  const projectMenuRef = useRef(null);
  // ═══ Real AI Chat State ═══
  const [chatMessages, setChatMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatConversationId, setChatConversationId] = useState(null);
  const [chatAgent, setChatAgent] = useState(null); // selected agent slug for chat
  const [chatMode, setChatMode] = useState("group"); // "group" or "direct"
  const [extraAgents, setExtraAgents] = useState([]); // agents added to chat dynamically via add_agent_to_chat
  const [token, setToken] = useState(null);
  const chatEndRef = useRef(null);
  // ═══ Resizable Chat Panel ═══
  const [chatWidth, setChatWidth] = useState(420);
  const isResizing = useRef(false);
  const chatTextareaRef = useRef(null);

  // Auto-resize textarea when chatInput changes (covers voice input + programmatic updates)
  useEffect(() => {
    const el = chatTextareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = el.scrollHeight + "px";
    }
  }, [chatInput]);

  // Load auth token
  useEffect(() => {
    const storedToken = localStorage.getItem("sb-mzqjivtidadjaawmlslz-auth-token");
    if (storedToken) {
      try { const parsed = JSON.parse(storedToken); setToken(parsed?.access_token || parsed); }
      catch { setToken(storedToken); }
    }
  }, []);

  // Load tasks from DB for real (non-demo) projects
  const refreshTasks = useCallback(async () => {
    if (!project.id) return;
    try {
      const dbTasks = await fetchTasksFromDB(project.id);
      if (dbTasks && dbTasks.length > 0) {
        const mapped = dbTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          status: t.status || 'Todo',
          priority: t.priority || 'Medium',
          progress: t.status === 'Completed' ? 100 : t.status === 'In Progress' ? 50 : 0,
          assignedAgents: t.assigned_agent ? [t.assigned_agent] : [],
          deadline: t.due_date ? new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null,
          notes: t.description || '',
          date: new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        }));
        setTasks(prev => {
          // Merge: keep demo tasks, add/update DB tasks
          const demoTasks = prev.filter(t => typeof t.id === 'string' && t.id.startsWith('t'));
          const merged = [...demoTasks];
          for (const mt of mapped) {
            const idx = merged.findIndex(t => t.id === mt.id);
            if (idx >= 0) merged[idx] = mt;
            else merged.push(mt);
          }
          return merged;
        });
      }
    } catch (e) { console.error('Failed to load DB tasks:', e); }
  }, [project.id]);

  useEffect(() => { refreshTasks(); }, [refreshTasks]);

  const projectAgentIds = project.assigned_agents || project.agents || [];
  const projectAgents = projectAgentIds.map((agentId) => allAgents.find((a) => a.id === agentId || a.id === agentId?.toLowerCase())).filter(Boolean);
  // Only show project-assigned agents + any dynamically added agents (like Mistol via "Ask Mistol")
  const chatAgents = [...projectAgents, ...extraAgents.filter(ea => !projectAgents.find(ba => ba.id === ea.id))];
  const projectMessages = allMessages.filter((m) => m.projectId === project.id);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  // Build project context string (sent with first message so agent reads project data, not LLM)
  const buildProjectContext = useCallback(() => {
    const parts = [];
    if (project.id) parts.push(`Project ID: ${project.id}`);
    if (project.name) parts.push(`Project: ${project.name}`);
    if (project.description) parts.push(`Description: ${project.description}`);
    if (project.brief) parts.push(`Brief: ${project.brief}`);
    if (project.client) parts.push(`Client: ${project.client}`);
    if (project.deadline) parts.push(`Deadline: ${project.deadline}`);
    if (project.due_date) parts.push(`Due Date: ${project.due_date}`);
    if (projectAgentIds.length > 0) parts.push(`Assigned Agents: ${projectAgentIds.join(', ')}`);
    if (tasks.length > 0) {
      parts.push(`Tasks (${tasks.length}):\n` + tasks.map(t => `- [${t.status}] ${t.title}${t.assignedAgents?.length ? ` (assigned: ${t.assignedAgents.join(", ")})` : ""}`).join("\n"));
    }
    if (documents.length > 0) {
      parts.push(`Documents (${documents.length}):\n` + documents.map(d => `- ${d.name} (${d.type})${d.url ? ` → ${d.url}` : ""}`).join("\n"));
    }
    return parts.join("\n\n");
  }, [project, tasks, documents]);

  // Send chat message to real agent(s)
  const sendChatMessage = useCallback(async () => {
    if (!chatInput.trim() || chatLoading || !token) return;
    const isGroup = chatMode === "group" && chatAgents.length > 1;
    if (!isGroup && !chatAgent) return;

    const userText = chatInput.trim();
    setChatInput("");
    setChatLoading(true);

    // Include project context on first message of conversation
    const contextPrefix = !chatConversationId ? `[Project Context]\n${buildProjectContext()}\n\n[User Message]\n` : "";
    const fullMessage = contextPrefix + userText;

    const userMsg = { id: `u-${Date.now()}`, role: "user", content: userText, agentName: "You", avatar: null, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    setChatMessages(prev => [...prev, userMsg]);

    // Determine which agents to send to
    let agentsToMessage;
    if (!isGroup) {
      agentsToMessage = [chatAgents.find(a => a.id === chatAgent) || chatAgents[0]];
    } else {
      // Smart routing: detect if user is addressing a specific agent by name or @mention
      const lowerText = userText.toLowerCase();
      const mentioned = chatAgents.filter(a => {
        const name = a.name.toLowerCase();
        return lowerText.includes(`@${name}`) || lowerText.includes(name);
      });
      agentsToMessage = mentioned.length > 0 ? mentioned : chatAgents;
    }

    for (const agentInfo of agentsToMessage) {
      if (!agentInfo) continue;

      const assistantMsg = { id: `a-${Date.now()}-${agentInfo.id}`, role: "assistant", content: "", agentName: agentInfo.name, avatar: agentInfo.avatar, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), streaming: true };
      setChatMessages(prev => [...prev, assistantMsg]);

      let streamedContent = "";
      const msgId = assistantMsg.id;
      // Helper to update this specific agent's message by ID
      const updateMsg = (updater) => {
        setChatMessages(prev => prev.map(m => m.id === msgId ? updater(m) : m));
      };

      try {
        // In group mode, prepend context about who else is in the chat
        let groupPrefix = "";
        if (isGroup) {
          const others = chatAgents.filter(a => a.id !== agentInfo.id).map(a => `${a.name} (${a.role})`).join(", ");
          groupPrefix = `[Group Chat — also in this chat: ${others}. Keep your response focused on your expertise. Be concise — other agents will also respond.]\n`;
        }

        await callAgentStream({
          agentSlug: agentInfo.id, message: (isGroup ? groupPrefix : "") + fullMessage, conversationId: chatConversationId, mode: "chat", token,
          onMeta: (data) => { if (data.conversation_id) setChatConversationId(data.conversation_id); },
          onChunk: (chunk) => {
            streamedContent += chunk;
            updateMsg(m => ({ ...m, content: streamedContent }));
          },
          onAgentAdded: (data) => {
            if (data.agent_slug) {
              const addedAgent = allAgents.find(a => a.id === data.agent_slug);
              if (addedAgent) {
                setExtraAgents(prev => prev.find(a => a.id === addedAgent.id) ? prev : [...prev, addedAgent]);
              }
            }
          },
          onToolStart: (data) => {
            const toolLabel = data?.tool === 'delegate_to_agent'
              ? `_Delegating to ${data?.input?.target_agent_slug || 'agent'}..._`
              : data?.tool === 'add_agent_to_chat'
              ? `_Adding ${data?.input?.agent_slug || 'agent'} to chat..._`
              : '_Using tools..._';
            updateMsg(m => ({ ...m, content: streamedContent + "\n\n" + toolLabel }));
          },
          onDelegationStart: (data) => {
            const targetName = data?.target || 'agent';
            const targetAgent = allAgents.find(a => a.id === targetName);
            const label = `_⏳ ${targetAgent?.name || targetName} is working on this..._`;
            updateMsg(m => ({ ...m, content: streamedContent + "\n\n" + label }));
          },
          onDelegationDone: (data) => {
            const targetName = data?.target || 'agent';
            const targetAgent = allAgents.find(a => a.id === targetName);
            if (targetAgent) {
              setExtraAgents(prev => prev.find(a => a.id === targetAgent.id) ? prev : [...prev, targetAgent]);
            }
            updateMsg(m => ({ ...m, content: streamedContent }));
          },
          onToolDone: (data) => {
            updateMsg(m => ({ ...m, content: streamedContent }));
            if (data?.tool === 'create_project_tasks') {
              refreshTasks();
            }
          },
          onDone: () => {
            updateMsg(m => ({ ...m, streaming: false }));
          },
          onError: (data) => {
            updateMsg(m => ({ ...m, content: `Error: ${data.message}`, streaming: false }));
          },
        });
      } catch (err) {
        updateMsg(m => ({ ...m, content: `Error: ${err.message}`, streaming: false }));
      }
    }
    setChatLoading(false);
  }, [chatInput, chatLoading, token, chatAgent, chatMode, chatConversationId, buildProjectContext, chatAgents, refreshTasks]);

  const handleChatKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChatMessage(); } };

  // ═══ Resize handlers for draggable chat panel ═══
  const startResize = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startWidth = chatWidth;
    function onMouseMove(ev) {
      if (!isResizing.current) return;
      const delta = startX - ev.clientX;
      const newWidth = Math.min(Math.max(startWidth + delta, 340), 800);
      setChatWidth(newWidth);
    }
    function onMouseUp() {
      isResizing.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [chatWidth]);

  const toggleVoice = useCallback(() => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current._userStopped = true;
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognitionRef.current = recognition;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join("");
      setChatInput(transcript);
    };
    recognition.onend = () => {
      // Browser may auto-stop after a pause — restart unless user clicked stop
      if (recognitionRef.current && recognitionRef.current._userStopped) {
        setIsListening(false);
        recognitionRef.current._userStopped = false;
      } else if (recognitionRef.current) {
        try { recognitionRef.current.start(); } catch (e) { setIsListening(false); }
      }
    };
    recognition.onerror = (e) => {
      if (e.error === 'aborted' || e.error === 'no-speech') {
        // Not a real error — browser paused, let onend handle restart
        return;
      }
      setIsListening(false);
    };
    recognition.start();
    setIsListening(true);
  }, [isListening]);

  // Auto-select first assigned agent for chat (needed for DM mode and as fallback)
  useEffect(() => {
    if (!chatAgent && chatAgents.length > 0) {
      setChatAgent(chatAgents[0]?.id);
    }
    // Auto-set group mode when multiple agents assigned
    if (chatAgents.length > 1) {
      setChatMode("group");
    } else if (chatAgents.length === 1) {
      setChatMode("direct");
    }
  }, [chatAgents.length, chatAgent]);
  const deadlineLabel = project.deadline;
  const deadlineDateStr = project.deadlineDate;
  function handleOpenTask(task) {
    setSelectedTask(task);
    setTaskPanelOpen(true);
  }
  function handleUpdateTask(updated) {
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  }
  function handleDeleteTask(taskId) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTaskPanelOpen(false);
    setSelectedTask(null);
  }
  function addTask() {
    if (!newTaskTitle.trim()) return;
    const newTask = {
      id: `t-${Date.now()}`,
      title: newTaskTitle.trim(),
      date: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      status: "Todo",
      assignedAgents: projectAgentIds.length > 0 ? [projectAgentIds[0]] : [],
      progress: 0,
      priority: "Medium"
    };
    setTasks((prev) => [...prev, newTask]);
    setNewTaskTitle("");
    setAddingTask(false);
  }
  function saveDescription() {
    setEditingDesc(false);
  }

  async function archiveProject() {
    if (!confirm("Archive this project? It will be hidden from view but saved in the database.")) return;
    try {
      const t = getToken();
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${project.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}`, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ archived_at: new Date().toISOString(), status: "archived" }),
      });
      onBack();
    } catch (err) { console.error("Archive failed:", err); }
  }

  async function deleteProject() {
    if (!confirm("Permanently delete this project? This cannot be undone.")) return;
    if (!confirm("Are you really sure? All tasks, conversations, and data for this project will be lost.")) return;
    try {
      const t = getToken();
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${project.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${t}`, apikey: SUPABASE_ANON_KEY, Prefer: "return=minimal" },
      });
      onBack();
    } catch (err) { console.error("Delete failed:", err); }
  }

  async function saveProjectName() {
    if (!nameDraft.trim() || nameDraft.trim() === project.name) { setEditingName(false); return; }
    try {
      const t = getToken();
      await fetch(`${SUPABASE_URL}/rest/v1/projects?id=eq.${project.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${t}`, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ name: nameDraft.trim() }),
      });
      project.name = nameDraft.trim();
      setEditingName(false);
    } catch (err) { console.error("Rename failed:", err); }
  }

  function getToken() {
    try {
      const raw = localStorage.getItem("sb-mzqjivtidadjaawmlslz-auth-token");
      return JSON.parse(raw)?.access_token || null;
    } catch { return null; }
  }
  function resetAddFlow() {
    setAddStep("idle");
    setNewDocName("");
    setNewDocUrl("");
    setNewDocType("doc");
  }
  function addDocument() {
    if (!newDocName.trim()) return;
    const doc = {
      id: `d-${Date.now()}`,
      name: newDocName.trim(),
      type: newDocType,
      url: newDocUrl.trim() || void 0,
      addedBy: "Paul",
      addedAt: (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    };
    setDocuments((prev) => [...prev, doc]);
    resetAddFlow();
  }
  function deleteDocument(docId) {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  }
  function handleFiles(files, overrideName) {
    if (!files || files.length === 0) return;
    const now = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const newDocs = Array.from(files).map((file, i) => ({
      id: `d-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: overrideName && files.length === 1 ? overrideName : file.name.replace(/\.[^.]+$/, ""),
      type: "upload",
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      addedBy: "Paul",
      addedAt: now
    }));
    setDocuments((prev) => [...prev, ...newDocs]);
    setIsDragging(false);
    resetAddFlow();
  }
  function onDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }
  function onDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }
  function onDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    handleFiles(e.dataTransfer.files);
  }
  const filteredTasks = taskFilter === "All" ? tasks : tasks.filter((t) => t.status === taskFilter);
  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const totalTasks = tasks.length;
  const completionPct = totalTasks > 0 ? Math.round(completedTasks / totalTasks * 100) : 0;
  return <div className="flex flex-1 flex-col overflow-hidden">
      {
    /* -- Header Bar -- */
  }
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
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveProjectName(); if (e.key === "Escape") setEditingName(false); }}
                  className="rounded-md border border-accent bg-background px-2 py-1 text-base font-bold text-foreground outline-none focus:ring-1 focus:ring-accent sm:text-lg"
                />
                <button onClick={saveProjectName} className="rounded p-1 text-accent hover:bg-accent/10"><Check className="h-4 w-4" /></button>
                <button onClick={() => setEditingName(false)} className="rounded p-1 text-muted-foreground hover:bg-muted"><X className="h-4 w-4" /></button>
              </div>
            ) : (
              <h1 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                {project.name}
              </h1>
            )}
            <Badge
    variant="outline"
    className={cn("hidden text-[11px] font-medium border sm:inline-flex", statusColors[project.status])}
  >
              {statusLabels[project.status] || project.status}
            </Badge>
            {/* Project actions menu */}
            <div className="relative" ref={projectMenuRef}>
              <button
                onClick={() => setProjectMenu(!projectMenu)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {projectMenu && <>
                <div className="fixed inset-0 z-40" onClick={() => setProjectMenu(false)} />
                <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-lg border border-border bg-card py-1 shadow-lg">
                  <button onClick={() => { setEditingName(true); setProjectMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-card-foreground hover:bg-muted">
                    <Pencil className="h-3 w-3" /> Rename Project
                  </button>
                  <button onClick={() => { archiveProject(); setProjectMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-amber-600 hover:bg-muted">
                    <Eye className="h-3 w-3" /> Archive Project
                  </button>
                  <div className="my-1 border-t border-border" />
                  <button onClick={() => { deleteProject(); setProjectMenu(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-muted">
                    <Trash2 className="h-3 w-3" /> Delete Project
                  </button>
                </div>
              </>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {
    /* Completion summary */
  }
          <div className="hidden items-center gap-2 sm:flex">
            <span className="text-xs text-muted-foreground">
              {completedTasks}/{totalTasks} tasks
            </span>
            <Progress value={completionPct} className={cn("h-1.5 w-24", "[&>div]:bg-accent")} />
            <span className="text-xs font-semibold text-foreground">{completionPct}%</span>
          </div>

          {
    /* Deadline - clickable */
  }
          <div className="relative hidden md:block">
            <button
    ref={deadlineRef}
    onClick={() => setDeadlinePopover((v) => !v)}
    className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
  >
              <Calendar className="h-3.5 w-3.5" />
              {deadlineLabel}
            </button>
            {deadlinePopover && <>
                <div className="fixed inset-0 z-40" onClick={() => setDeadlinePopover(false)} />
                <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-card p-3 shadow-lg">
                  {deadlineDateStr ? <>
                      <div className="mb-2.5 flex items-center justify-between">
                        <p className="text-[11px] font-medium text-muted-foreground">Project Deadline</p>
                        <p className="text-xs font-semibold text-foreground">
                          {(/* @__PURE__ */ new Date(deadlineDateStr + "T00:00:00")).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                        </p>
                      </div>
                      <MiniCalendar dateStr={deadlineDateStr} />
                      <div className="mt-2.5 border-t border-border pt-2">
                        <p className="text-center text-[10px] text-muted-foreground">{deadlineLabel}</p>
                      </div>
                    </> : <p className="py-2 text-center text-xs text-muted-foreground">No deadline date set</p>}
                </div>
              </>}
          </div>

          {
    /* Agent avatars */
  }
          <div className="flex items-center -space-x-2">
            {projectAgents.slice(0, 4).map((agent) => <Avatar
    key={agent.id}
    className="h-7 w-7 border-2 border-card ring-1 ring-accent/20"
  >
                <AvatarImage src={agent.avatar} alt={agent.name} />
                <AvatarFallback className="bg-accent text-accent-foreground text-[9px] font-bold">
                  {agent.name[0]}
                </AvatarFallback>
              </Avatar>)}
          </div>
          <button 
            onClick={() => {
              const mistol = allAgents.find(a => a.id === "mistol");
              if (mistol) {
                setExtraAgents(prev => prev.find(a => a.id === "mistol") ? prev : [...prev, mistol]);
                setChatAgent("mistol");
              }
              setMobilePanel("chat");
            }}
            className="flex items-center gap-1.5 rounded-lg border border-accent/50 bg-accent/10 px-2.5 py-1.5 text-[11px] font-medium text-accent transition-colors hover:bg-accent/20 sm:flex"
          >
            <Sparkles className="h-3 w-3" />
            Ask Mistol
          </button>
        </div>
      </header>

      {
    /* Sub-tabs: Description | Documents | Tasks -- below header */
  }
      <div className="flex items-center gap-0 border-b border-border bg-card px-3 sm:px-5">
        {[
    { id: "tasks", label: "Tasks", icon: ListChecks, count: totalTasks },
    { id: "description", label: "Description", icon: FileText },
    { id: "documents", label: "Documents", icon: FileSpreadsheet, count: documents.length }
  ].map((tab) => <button
    key={tab.id}
    onClick={() => setSubTab(tab.id)}
    className={cn(
      "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:px-4",
      subTab === tab.id ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
    )}
  >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
            {tab.count !== void 0 && <span
    className={cn(
      "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
      subTab === tab.id ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
    )}
  >
                {tab.count}
              </span>}
          </button>)}
      </div>

      {
    /* Mobile tab toggle: Main vs Chat */
  }
      <div className="flex border-b border-border bg-card md:hidden">
        <button
    onClick={() => setMobilePanel("main")}
    className={cn(
      "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
      mobilePanel === "main" ? "border-b-2 border-accent text-accent" : "text-muted-foreground"
    )}
  >
          <ListChecks className="h-3.5 w-3.5" />
          Project
        </button>
        <button
    onClick={() => setMobilePanel("chat")}
    className={cn(
      "flex flex-1 items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors",
      mobilePanel === "chat" ? "border-b-2 border-accent text-accent" : "text-muted-foreground"
    )}
  >
          <MessageSquare className="h-3.5 w-3.5" />
          Agent Chat
        </button>
      </div>

      {
    /* -- Main content: Left panel + Chat (right) -- */
  }
      <div className="flex flex-1 overflow-hidden">
        {
    /* LEFT: Sub-tab content */
  }
        <div className={cn(
    "flex flex-1 flex-col overflow-hidden md:border-r md:border-border",
    mobilePanel === "chat" ? "hidden md:flex" : "flex"
  )}>

          {
    /* === TASKS TAB === */
  }
          {subTab === "tasks" && <>
              {
    /* Task filter tabs */
  }
              <div className="border-b border-border bg-card px-3 sm:px-5">
                <div className="flex">
                  {["All", "In Progress", "Todo", "Stalled", "Needs Approval", "Completed"].map((tab) => {
    const count = tab === "All" ? tasks.length : tasks.filter((t) => t.status === tab).length;
    return <button
      key={tab}
      onClick={() => setTaskFilter(tab)}
      className={cn(
        "flex shrink-0 items-center gap-1 border-b-2 px-2.5 py-2.5 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-4 sm:text-xs",
        taskFilter === tab ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
                        {tab}
                        <span
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
        taskFilter === tab ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
      )}
    >
                          {count}
                        </span>
                      </button>;
  })}
                </div>
              </div>

              {
    /* Add Task bar */
  }
              <div className="border-b border-border bg-card px-3 py-2 sm:px-5">
                <button
    onClick={() => setAddingTask(true)}
    className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:border-accent/50 hover:bg-muted/50 hover:text-foreground"
  >
                  <Plus className="h-3.5 w-3.5" />
                  Add a task...
                </button>
              </div>

              {
    /* Inline add task form */
  }
              {addingTask && <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2.5 sm:px-5">
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
      if (e.key === "Enter") addTask();
      if (e.key === "Escape") {
        setAddingTask(false);
        setNewTaskTitle("");
      }
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
    onClick={() => {
      setAddingTask(false);
      setNewTaskTitle("");
    }}
    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
  >
                    <X className="h-3 w-3" />
                  </button>
                </div>}

              {
    /* Task rows */
  }
              <div className="flex-1 overflow-y-auto bg-background">
                {filteredTasks.length > 0 ? <div className="divide-y divide-border">
                    {filteredTasks.map((task) => {
    const taskAgents = (task.assignedAgents || []).map((id) => allAgents.find((a) => a.id === id)).filter(Boolean);
    return <div
      key={task.id}
      role="button"
      tabIndex={0}
      onClick={() => handleOpenTask(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleOpenTask(task);
      }}
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
                          {taskAgents.length > 0 ? <div className="flex items-center -space-x-1.5">
                              {taskAgents.map((agent) => agent && <Avatar key={agent.id} className="h-5 w-5 border border-card">
                                  <AvatarImage src={agent.avatar} alt={agent.name} />
                                  <AvatarFallback className="bg-accent text-accent-foreground text-[8px] font-bold">
                                    {agent.name[0]}
                                  </AvatarFallback>
                                </Avatar>)}
                              {taskAgents.length === 1 && taskAgents[0] && <span className="ml-2.5 hidden text-[11px] text-muted-foreground lg:inline">
                                  {taskAgents[0].name}
                                </span>}
                              {taskAgents.length > 1 && <span className="ml-2.5 hidden text-[11px] text-muted-foreground lg:inline">
                                  {taskAgents.length} agents
                                </span>}
                            </div> : <span className="text-[11px] text-muted-foreground/40">Unassigned</span>}
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
                        </div>;
  })}
                  </div> : <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                    No {taskFilter === "All" ? "" : taskFilter.toLowerCase()} tasks
                  </div>}
              </div>
            </>}

          {
    /* === DESCRIPTION TAB === */
  }
          {subTab === "description" && <div className="flex-1 overflow-y-auto bg-background">
              <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-6">
                <div className="rounded-lg border border-border bg-card">
                  {
    /* Description header */
  }
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project Description</h3>
                    <div className="flex items-center gap-1.5">
                      {editingDesc ? <>
                          <button
    onClick={saveDescription}
    className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
  >
                            <Save className="h-3 w-3" />
                            Save
                          </button>
                          <button
    onClick={() => {
      setDescDraft(project.description);
      setEditingDesc(false);
    }}
    className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
  >
                            Cancel
                          </button>
                        </> : <button
    onClick={() => setEditingDesc(true)}
    className="flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
  >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>}
                    </div>
                  </div>

                  {
    /* Description body */
  }
                  <div className="px-4 py-4">
                    {editingDesc ? <textarea
    value={descDraft}
    onChange={(e) => setDescDraft(e.target.value)}
    rows={6}
    className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm leading-relaxed text-foreground outline-none transition-colors focus:ring-2 focus:ring-accent/50"
    autoFocus
  /> : <p className="text-sm leading-relaxed text-card-foreground">
                        {descDraft || "No description added yet."}
                      </p>}
                  </div>

                  {
    /* Meta info */
  }
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
                          {deadlineLabel}
                        </button>
                        {deadlinePopover && <>
                            <div className="fixed inset-0 z-40" onClick={() => setDeadlinePopover(false)} />
                            <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-lg border border-border bg-card p-3 shadow-lg">
                              {deadlineDateStr ? <>
                                  <div className="mb-2.5 flex items-center justify-between">
                                    <p className="text-[11px] font-medium text-muted-foreground">Project Deadline</p>
                                    <p className="text-xs font-semibold text-foreground">
                                      {(/* @__PURE__ */ new Date(deadlineDateStr + "T00:00:00")).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                                    </p>
                                  </div>
                                  <MiniCalendar dateStr={deadlineDateStr} />
                                  <div className="mt-2.5 border-t border-border pt-2">
                                    <p className="text-center text-[10px] text-muted-foreground">{deadlineLabel}</p>
                                  </div>
                                </> : <p className="py-2 text-center text-xs text-muted-foreground">No deadline date set</p>}
                            </div>
                          </>}
                      </span>
                      <span className="flex items-center gap-1">
                        <Bot className="h-3 w-3" />
                        {projectAgents.length} agent{projectAgents.length !== 1 ? "s" : ""} assigned
                      </span>
                      {project.client && <span>Client: {project.client}</span>}
                    </div>
                  </div>
                </div>

                {
    /* Brief section (if exists) */
  }
                {project.brief && <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5">
                    <div className="flex items-center gap-2 border-b border-accent/10 px-4 py-2.5">
                      <Sparkles className="h-3.5 w-3.5 text-accent" />
                      <h3 className="text-xs font-semibold text-accent">Project Brief</h3>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-sm leading-relaxed text-card-foreground">{project.brief}</p>
                    </div>
                  </div>}
              </div>
            </div>}

          {
    /* === DOCUMENTS TAB === */
  }
          {subTab === "documents" && <div className="flex-1 overflow-y-auto bg-background">
              <div className="mx-auto max-w-2xl px-4 py-5 sm:px-6 sm:py-6">

                {
    /* === Stepped Add Flow === */
  }
                {addStep === "idle" && <div className="mb-4 flex items-center gap-2">
                    <button
    onClick={() => setAddStep("name")}
    className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
  >
                      <Plus className="h-3 w-3" />
                      Add Document
                    </button>
                  </div>}

                {
    /* Step 1: Enter name */
  }
                {addStep === "name" && <div className="mb-4 rounded-lg border border-accent/30 bg-card p-4">
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
      if (e.key === "Enter" && newDocName.trim()) setAddStep("upload");
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
                  </div>}

                {
    /* Step 2a: Upload file */
  }
                {addStep === "upload" && <div className="mb-4 rounded-lg border border-accent/30 bg-card p-4">
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
    onDrop={(e) => {
      e.preventDefault();
      e.stopPropagation();
      handleFiles(e.dataTransfer.files, newDocName.trim());
    }}
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
                  </div>}

                {
    /* Step 2b: Add link */
  }
                {addStep === "link" && <div className="mb-4 rounded-lg border border-accent/30 bg-card p-4">
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
    onChange={(e) => setNewDocType(e.target.value)}
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
                  </div>}

                {
    /* Filter/sort bar */
  }
                {documents.length > 0 && <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      {(() => {
    const filtered = docFilter === "all" ? documents : docFilter === "upload" ? documents.filter((d) => d.type === "upload") : docFilter === "brief" ? documents.filter((d) => d.type === "brief") : documents.filter((d) => d.type !== "upload" && d.type !== "brief");
    return `${filtered.length} of ${documents.length} document${documents.length !== 1 ? "s" : ""}`;
  })()}
                    </p>
                    <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
                      {[
    { key: "all", label: "All" },
    { key: "upload", label: "Uploads" },
    { key: "link", label: "Links" },
    { key: "brief", label: "Briefs" }
  ].map((f) => <button
    key={f.key}
    onClick={() => setDocFilter(f.key)}
    className={cn(
      "rounded px-2 py-1 text-[10px] font-medium transition-colors",
      docFilter === f.key ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
    )}
  >
                          {f.label}
                        </button>)}
                    </div>
                  </div>}

                {
    /* Document list */
  }
                {(() => {
    const filtered = docFilter === "all" ? documents : docFilter === "upload" ? documents.filter((d) => d.type === "upload") : docFilter === "brief" ? documents.filter((d) => d.type === "brief") : documents.filter((d) => d.type !== "upload" && d.type !== "brief");
    return filtered.length > 0 ? <div className="divide-y divide-border rounded-lg border border-border bg-card">
                      {filtered.map((doc) => <div
      key={doc.id}
      className="group flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
      onClick={() => {
        if (doc.type === "brief" && doc.content) {
          setViewingDoc(doc);
        } else if (doc.url) {
          window.open(doc.url, "_blank", "noopener,noreferrer");
        } else {
          setViewingDoc(doc);
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
                            {doc.fileName && <p className="text-[10px] text-muted-foreground/50">{doc.fileName}</p>}
                          </div>
                          <div className="flex items-center gap-1">
                            {doc.url && <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </span>}
                            {(doc.type === "brief" || doc.type === "upload") && <span className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground">
                                <Eye className="h-3.5 w-3.5" />
                              </span>}
                            <button
      onClick={(e) => {
        e.stopPropagation();
        deleteDocument(doc.id);
      }}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
      aria-label={`Delete ${doc.name}`}
    >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>)}
                    </div> : documents.length > 0 ? <div className="flex h-24 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                      <SlidersHorizontal className="mb-1.5 h-5 w-5 text-muted-foreground/30" />
                      <p className="text-xs text-muted-foreground">No {docFilter === "upload" ? "uploaded files" : docFilter === "brief" ? "briefs" : "linked documents"} found</p>
                    </div> : <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border text-center">
                      <FileText className="mb-2 h-6 w-6 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">No documents yet</p>
                      <p className="text-xs text-muted-foreground/60">Upload files or link Google Docs for agents to reference</p>
                    </div>;
  })()}

                {
    /* Brief / Upload viewer modal */
  }
                {viewingDoc && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setViewingDoc(null)}>
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

                      {viewingDoc.content && <div className="mb-4 rounded-lg border border-border bg-muted/30 p-4">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">{viewingDoc.content}</p>
                        </div>}

                      {viewingDoc.fileName && <div className="mb-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <File className="h-5 w-5 text-violet-500" />
                            <div>
                              <p className="text-sm font-medium text-card-foreground">{viewingDoc.fileName}</p>
                              {viewingDoc.fileSize && <p className="text-[11px] text-muted-foreground">{viewingDoc.fileSize}</p>}
                            </div>
                          </div>
                        </div>}

                      {viewingDoc.url && <a
    href={viewingDoc.url}
    target="_blank"
    rel="noopener noreferrer"
    className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
  >
                          <ExternalLink className="h-3 w-3" />
                          Open in New Tab
                        </a>}

                      {!viewingDoc.content && !viewingDoc.url && !viewingDoc.fileName && <p className="text-sm text-muted-foreground">No preview available for this document.</p>}
                    </div>
                  </div>}
              </div>
            </div>}
        </div>

        {
    /* RIGHT: Agent Chat + Agents panel */
  }
        <div className={cn(
    "relative flex flex-col bg-primary",
    mobilePanel === "main" ? "hidden md:flex" : "flex flex-1"
  )} style={{ width: mobilePanel === "main" ? chatWidth : undefined, flexShrink: 0 }}>
          {/* Resize drag handle */}
          <div
            onMouseDown={startResize}
            className="absolute left-0 top-0 bottom-0 z-10 hidden md:flex w-1.5 cursor-col-resize items-center justify-center hover:bg-accent/30 active:bg-accent/40 transition-colors group"
            title="Drag to resize"
          >
            <div className="h-8 w-0.5 rounded-full bg-white/20 group-hover:bg-accent/70 transition-colors" />
          </div>
          {
    /* Compact chat header — shows agent name/avatar + selector, stays visible on mobile keyboard */
  }
          <div className="sticky top-0 z-10 border-b border-white/10 bg-primary">
            {/* Agent selector row — always visible */}
            <div className="flex items-center justify-between px-4 py-2.5 sm:px-5 sm:py-3">
              <div className="flex items-center gap-2.5">
                {/* Mobile back button */}
                <button
                  onClick={() => setMobilePanel("main")}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-primary-foreground/60 transition-colors hover:bg-white/10 hover:text-primary-foreground md:hidden"
                  aria-label="Back to project"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                {chatMode === "group" && chatAgents.length > 1 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {chatAgents.slice(0, 5).map((a) => (
                        <Avatar key={a.id} className="h-6 w-6 ring-1 ring-primary">
                          <AvatarImage src={a.avatar} alt={a.name} />
                          <AvatarFallback className="bg-accent text-accent-foreground text-[7px] font-bold">{a.name[0]}</AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-primary-foreground leading-tight">Group Chat</p>
                      <p className="text-[10px] text-primary-foreground/40 leading-tight">{chatAgents.map(a => a.name).join(", ")}</p>
                    </div>
                  </div>
                ) : chatAgent && (() => {
                  const currentAgent = chatAgents.find(a => a.id === chatAgent);
                  if (!currentAgent) return null;
                  return (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={currentAgent.avatar} alt={currentAgent.name} />
                          <AvatarFallback className="bg-accent text-accent-foreground text-[9px] font-bold">{currentAgent.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-primary",
                          currentAgent.status === "active" && "bg-emerald-500",
                          currentAgent.status === "working" && "bg-amber-500",
                          currentAgent.status === "idle" && "bg-muted-foreground"
                        )} />
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-primary-foreground leading-tight">{currentAgent.name}</p>
                        <p className="text-[10px] text-primary-foreground/40 leading-tight">{currentAgent.role}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <div className="flex items-center gap-2">
                {chatAgents.length > 1 && (
                  <div className="flex items-center gap-1 rounded-md bg-white/5 p-0.5">
                    <button
                      onClick={() => setChatMode("group")}
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
                        chatMode === "group" ? "bg-accent text-accent-foreground" : "text-primary-foreground/50 hover:text-primary-foreground"
                      )}
                    >Group</button>
                    <button
                      onClick={() => setChatMode("direct")}
                      className={cn(
                        "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
                        chatMode === "direct" ? "bg-accent text-accent-foreground" : "text-primary-foreground/50 hover:text-primary-foreground"
                      )}
                    >DM</button>
                  </div>
                )}
                {chatMode === "direct" && chatAgents.length > 1 && (
                  <select
                    value={chatAgent || ""}
                    onChange={(e) => { setChatAgent(e.target.value); }}
                    className="rounded-md bg-white/10 px-2 py-1 text-[11px] text-primary-foreground outline-none border border-white/10 focus:ring-1 focus:ring-accent"
                  >
                    {chatAgents.map((a) => (
                      <option key={a.id} value={a.id} className="bg-gray-900 text-white">{a.name} — {a.role || a.title}</option>
                    ))}
                  </select>
                )}
                {/* New chat button */}
                <button
                  onClick={() => { setChatConversationId(null); setChatMessages([]); setExtraAgents([]); }}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-primary-foreground/40 transition-colors hover:bg-white/10 hover:text-primary-foreground"
                  aria-label="New chat"
                  title="New chat"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[10px] font-bold text-accent-foreground">
                  {chatMessages.length || projectMessages.length}
                </span>
              </div>
            </div>

            {/* All assigned agents — hidden on mobile, shown on desktop */}
            <div className="hidden md:block border-t border-white/10 px-5 py-2.5">
              <div className="flex flex-wrap gap-2">
                {chatAgents.map((agent) => {
                  const isDynamic = extraAgents.find(ea => ea.id === agent.id);
                  return (
                  <div key={agent.id} className="relative flex items-center">
                    <button
                      onClick={() => { setChatAgent(agent.id); }}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors",
                        chatAgent === agent.id ? "bg-white/15 ring-1 ring-accent/50" : "bg-white/5 hover:bg-white/10",
                        isDynamic && "pr-5"
                      )}
                    >
                      <div className="relative">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={agent.avatar} alt={agent.name} />
                          <AvatarFallback className="bg-accent text-accent-foreground text-[7px] font-bold">{agent.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className={cn(
                          "absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full border border-primary",
                          agent.status === "active" && "bg-emerald-500",
                          agent.status === "working" && "bg-amber-500",
                          agent.status === "idle" && "bg-muted-foreground"
                        )} />
                      </div>
                      <p className="text-[10px] font-medium text-primary-foreground">{agent.name}</p>
                    </button>
                    {isDynamic && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExtraAgents(prev => prev.filter(a => a.id !== agent.id));
                          if (chatAgent === agent.id) {
                            setChatAgent(chatAgents.find(a => a.id !== agent.id)?.id || null);
                          }
                        }}
                        className="absolute right-0.5 top-1/2 -translate-y-1/2 flex h-3.5 w-3.5 items-center justify-center rounded-full text-primary-foreground/30 hover:bg-white/20 hover:text-primary-foreground/70 transition-colors"
                        aria-label={`Remove ${agent.name} from chat`}
                        title={`Remove ${agent.name}`}
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>
          </div>

          {
    /* Chat messages — real or fallback mock */
  }
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {chatMessages.length > 0 ? (
              <div className="space-y-4">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2.5">
                    {msg.role === "user" ? (
                      <div className="mt-0.5 h-7 w-7 shrink-0 rounded-full bg-accent/80 flex items-center justify-center text-[10px] font-bold text-accent-foreground">P</div>
                    ) : (
                      <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                        <AvatarImage src={msg.avatar} alt={msg.agentName} />
                        <AvatarFallback className="bg-accent text-accent-foreground text-[9px] font-bold">{msg.agentName?.[0] || "?"}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className="min-w-0 max-w-[85%]">
                      <div className="mb-0.5 flex items-center gap-2">
                        <p className="text-[11px] font-medium text-primary-foreground/70">{msg.agentName}</p>
                        <span className="text-[10px] text-primary-foreground/30">{msg.timestamp}</span>
                      </div>
                      <div className={cn("rounded-lg px-3 py-2", msg.role === "user" ? "bg-accent/20" : "bg-white/10")}>
                        <p className="text-[13px] leading-relaxed text-primary-foreground/90 whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {chatLoading && chatMessages[chatMessages.length - 1]?.role !== "assistant" && (
                  <div className="flex items-center gap-2 px-2">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-1.5 h-1.5 bg-primary-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-1.5 h-1.5 bg-primary-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                    <span className="text-[10px] text-primary-foreground/30">thinking...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            ) : projectMessages.length > 0 ? (
              <div className="space-y-4">
                {projectMessages.map((msg) => (
                  <div key={msg.id} className="flex gap-2.5">
                    <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                      <AvatarImage src={msg.avatar} alt={msg.agentName} />
                      <AvatarFallback className="bg-accent text-accent-foreground text-[9px] font-bold">{msg.agentName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 max-w-[85%]">
                      <div className="mb-0.5 flex items-center gap-2">
                        <p className="text-[11px] font-medium text-primary-foreground/70">{msg.agentName}</p>
                        <span className="text-[10px] text-primary-foreground/30">{msg.timestamp}</span>
                      </div>
                      <div className="rounded-lg bg-white/10 px-3 py-2">
                        <p className="text-[13px] leading-relaxed text-primary-foreground/90">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Bot className="h-8 w-8 text-primary-foreground/20 mb-2" />
                <p className="text-sm text-primary-foreground/30 mb-1">No messages yet</p>
                <p className="text-[11px] text-primary-foreground/20">{chatMode === "group" && chatAgents.length > 1 ? `Group chat with ${chatAgents.map(a => a.name).join(", ")}` : `Chat with ${chatAgent ? chatAgents.find(a => a.id === chatAgent)?.name || "an agent" : "an agent"} about this project`}</p>
              </div>
            )}
          </div>

          {
    /* Chat input */
  }
          <div className="border-t border-white/10 p-3">
            {!token && (
              <p className="text-[11px] text-amber-400/80 mb-2 text-center">⚠️ Not logged in — <a href="/login" className="underline hover:text-amber-300">sign in</a> to chat with agents</p>
            )}
            {isListening && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
                <span className="text-[11px] font-medium text-red-400">Recording — click mic to stop. Or click send.</span>
              </div>
            )}
            <div className="flex items-end gap-2">
              <button
    onClick={toggleVoice}
    className={cn(
      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors mb-0.5",
      isListening ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-white/10 text-primary-foreground/60 hover:bg-white/20 hover:text-primary-foreground"
    )}
    aria-label={isListening ? "Stop listening" : "Voice command"}
  >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
              <textarea
    ref={chatTextareaRef}
    value={chatInput}
    onChange={(e) => {
      setChatInput(e.target.value);
      // Auto-resize textarea — grow to fit all content
      e.target.style.height = "auto";
      e.target.style.height = e.target.scrollHeight + "px";
    }}
    onKeyDown={handleChatKey}
    placeholder={isListening ? "Listening..." : chatMode === "group" && chatAgents.length > 1 ? `Message ${chatAgents.map(a => a.name).join(", ")}...` : chatAgent ? `Message ${chatAgents.find(a => a.id === chatAgent)?.name || "agent"}...` : "Select an agent..."}
    disabled={!token || (chatMode === "direct" && !chatAgent) || chatAgents.length === 0}
    rows={1}
    className={cn(
      "flex-1 resize-none rounded-lg bg-white/10 px-3 py-2 text-sm text-primary-foreground placeholder-primary-foreground/30 outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 leading-relaxed overflow-y-auto",
      isListening && "ring-1 ring-destructive/50"
    )}
    style={{ minHeight: "36px", maxHeight: "40vh" }}
  />
              <button
    onClick={() => { sendChatMessage(); if (chatTextareaRef.current) { chatTextareaRef.current.style.height = "auto"; } }}
    disabled={!chatInput.trim() || chatLoading || !token || !chatAgent}
    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-30 mb-0.5"
    aria-label="Send message"
  >
                {chatLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </button>
            </div>
            <p className="mt-1 text-[10px] text-primary-foreground/20 text-center">Shift + Enter for new line</p>
          </div>
        </div>
      </div>

      {
    /* Task Detail Sheet */
  }
      <TaskDetailPanel
    task={selectedTask}
    open={taskPanelOpen}
    onClose={() => {
      setTaskPanelOpen(false);
      setSelectedTask(null);
    }}
    onUpdate={handleUpdateTask}
    onDelete={handleDeleteTask}
    projectAgents={projectAgentIds}
  />
    </div>;
}
