import { useState, useEffect, useRef } from "react"; 
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  ArrowLeft, CalendarIcon, MoreHorizontal, Copy, CheckSquare, Plus, Send, X,
} from "lucide-react";

// ── Types ──
interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  project_id: string | null;
  assigned_to: string | null;
  deadline: string | null;
  created_at: string;
}

interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  user_id: string;
  title: string | null;
}

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  position: number;
}

interface ActivityEntry {
  id: string;
  type: string;
  content: string;
  agent_role: string | null;
  user_id: string | null;
  created_at: string;
}

interface OutputEntry {
  id: string;
  agent_role: string;
  title: string;
  content: string;
  preview_text: string | null;
  created_at: string;
}


// ── Agent config ──
const AI_AGENTS = [
  { user_id: "11eca39b-4245-4304-8516-87dbb678975c", role: "marketing", name: "Marnie", label: "Marketing" },
  { user_id: "3eb634be-e47d-4137-95fe-1933c0dae0ae", role: "cto", name: "Dave", label: "CTO" },
  { user_id: "1894d3f8-9d6e-4964-8dbb-802c64f0c701", role: "social", name: "Sadie", label: "Social Media" },
  { user_id: "69292b90-3047-4b70-baba-39e172e445d9", role: "assistant", name: "Luna", label: "Live Chat" },
];


const STATUS_OPTIONS = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "stalled", label: "Stalled" },
  { value: "done", label: "Done" },
];

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-muted-foreground",
  working: "bg-yellow-500",
  waiting_review: "bg-blue-500",
  done: "bg-green-500",
};

// ── Props ──
interface Props {
  task: Task;
  userId: string;
  allProfiles: TeamMember[];
  onBack: () => void;
  onTaskUpdated: () => void;
}

const TaskDetailView = ({ task, userId, allProfiles, onBack, onTaskUpdated }: Props) => {
  // ── State ──
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");
  const [status, setStatus] = useState(task.status);
  const [deadline, setDeadline] = useState<Date | null>(task.deadline ? new Date(task.deadline) : null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newCheckItem, setNewCheckItem] = useState("");
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [outputs, setOutputs] = useState<OutputEntry[]>([]);
  const [expandedOutput, setExpandedOutput] = useState<string | null>(null);

  // Right column
  const [activeTab, setActiveTab] = useState<string>("activity");
  const [agentStatuses, setAgentStatuses] = useState<Record<string, string>>({});
  const [showMenu, setShowMenu] = useState(false);

  const titleSaveTimeout = useRef<ReturnType<typeof setTimeout>>();
  const descSaveTimeout = useRef<ReturnType<typeof setTimeout>>();

  // ── Load data ──
  useEffect(() => {
    loadChecklist();
    loadActivity();
    loadOutputs();
    initAgentStatuses();
  }, [task.id]);

  // Realtime for activity
  useEffect(() => {
    const channel = supabase
      .channel(`task-activity-${task.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "task_activity", filter: `task_id=eq.${task.id}` },
        (payload) => {
          setActivity((prev) => [...prev, payload.new as ActivityEntry]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [task.id]);

  const initAgentStatuses = () => {
    const statuses: Record<string, string> = {};
    AI_AGENTS.forEach((a) => { statuses[a.role] = "idle"; });
    setAgentStatuses(statuses);
  };

  const loadChecklist = async () => {
    const { data } = await supabase.from("task_checklist_items").select("*").eq("task_id", task.id).order("position");
    setChecklist(data || []);
  };

  const loadActivity = async () => {
    const { data } = await supabase.from("task_activity").select("*").eq("task_id", task.id).order("created_at");
    setActivity(data || []);
  };

  const loadOutputs = async () => {
    const { data } = await supabase.from("task_outputs").select("*").eq("task_id", task.id).order("created_at", { ascending: false });
    setOutputs(data || []);
  };


  // ── Save handlers ──
  const saveTitle = (newTitle: string) => {
    setTitle(newTitle);
    clearTimeout(titleSaveTimeout.current);
    titleSaveTimeout.current = setTimeout(async () => {
      await supabase.from("tasks").update({ title: newTitle }).eq("id", task.id);
      onTaskUpdated();
    }, 800);
  };

  const saveDescription = (newDesc: string) => {
    setDescription(newDesc);
    clearTimeout(descSaveTimeout.current);
    descSaveTimeout.current = setTimeout(async () => {
      await supabase.from("tasks").update({ description: newDesc }).eq("id", task.id);
    }, 800);
  };

  const changeStatus = async (newStatus: string) => {
    setStatus(newStatus);
    await supabase.from("tasks").update({ status: newStatus }).eq("id", task.id);
    await supabase.from("task_activity").insert({ task_id: task.id, user_id: userId, type: "system", content: `Status changed to ${newStatus.replace("_", " ")}` });
    onTaskUpdated();
  };

  const changeDeadline = async (date: Date | undefined) => {
    const d = date || null;
    setDeadline(d);
    await supabase.from("tasks").update({ deadline: d?.toISOString() || null }).eq("id", task.id);
    onTaskUpdated();
  };

  // ── Checklist ──
  const addCheckItem = async () => {
    if (!newCheckItem.trim()) return;
    await supabase.from("task_checklist_items").insert({ task_id: task.id, label: newCheckItem.trim(), position: checklist.length });
    setNewCheckItem("");
    loadChecklist();
  };

  const toggleCheckItem = async (item: ChecklistItem) => {
    await supabase.from("task_checklist_items").update({ completed: !item.completed }).eq("id", item.id);
    loadChecklist();
  };

  const deleteCheckItem = async (id: string) => {
    await supabase.from("task_checklist_items").delete().eq("id", id);
    loadChecklist();
  };

  const checklistProgress = checklist.length > 0 ? Math.round((checklist.filter((c) => c.completed).length / checklist.length) * 100) : 0;


  const postComment = async (comment: string) => {
    if (!comment.trim()) return;
    await supabase.from("task_activity").insert({ task_id: task.id, user_id: userId, type: "comment", content: comment.trim() });
  };

  // ── Helpers ──
  const getProfileName = (uid: string | null) => {
    if (!uid) return "System";
    const p = allProfiles.find((pr) => pr.user_id === uid);
    return p?.full_name || "Unknown";
  };

  const getAgentByRole = (role: string) => AI_AGENTS.find((a) => a.role === role);
  const assignee = allProfiles.find((p) => p.user_id === task.assigned_to);

  const activeAgent = AI_AGENTS.find((a) => a.role === activeTab);
  const isAgentTab = activeTab !== "activity";

  return (
    <div className="space-y-4">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Tasks
      </Button>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* ══════════════ LEFT COLUMN (65%) ══════════════ */}
        <div className="flex-1 lg:w-[65%] space-y-6">
          {/* Header row */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Input
                value={title}
                onChange={(e) => saveTitle(e.target.value)}
                className="text-xl font-bold border-none shadow-none px-0 focus-visible:ring-0 h-auto"
                placeholder="Task title"
              />
              <div className="flex items-center gap-1 shrink-0">
                <Popover open={showMenu} onOpenChange={setShowMenu}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-1" align="end">
                    <button
                      className="w-full text-left text-sm px-3 py-2 rounded hover:bg-muted flex items-center gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/workspace?task=${task.id}`);
                        setShowMenu(false);
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" /> Copy link
                    </button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Select value={status} onValueChange={changeStatus}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", !deadline && "text-muted-foreground")}>
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {deadline ? format(deadline, "MMM d, yyyy") : "Set due date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={deadline || undefined} onSelect={changeDeadline} className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>

              {assignee && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {assignee.avatar_url ? (
                    <img src={assignee.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold">
                      {assignee.full_name?.[0]}
                    </div>
                  )}
                  <span>{assignee.full_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-2">Description</p>
            <Textarea
              value={description}
              onChange={(e) => saveDescription(e.target.value)}
              placeholder="Add a description…"
              className="min-h-[100px] resize-y"
            />
          </div>

          {/* Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Checklist</p>
              <span className="text-xs text-muted-foreground">{checklistProgress}%</span>
            </div>
            {checklist.length > 0 && (
              <div className="w-full bg-muted rounded-full h-1.5 mb-3">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${checklistProgress}%` }} />
              </div>
            )}
            <div className="space-y-1">
              {checklist.map((item) => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <button onClick={() => toggleCheckItem(item)} className="shrink-0">
                    <CheckSquare className={cn("w-4 h-4", item.completed ? "text-primary" : "text-muted-foreground")} />
                  </button>
                  <span className={cn("text-sm flex-1", item.completed && "line-through text-muted-foreground")}>{item.label}</span>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100" onClick={() => deleteCheckItem(item.id)}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <Input
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCheckItem()}
                placeholder="Add item…"
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline" className="h-8" onClick={addCheckItem}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {/* Outputs */}
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Outputs</p>
            {outputs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No outputs yet. Assign work to a team member to generate artifacts.</p>
            ) : (
              <div className="space-y-2">
                {outputs.map((out) => {
                  const agent = getAgentByRole(out.agent_role);
                  return (
                    <Card key={out.id} className="p-3">
                      <div className="flex items-center gap-2 mb-1">
                        {agent && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold">
                              {agent.name[0]}
                            </div>
                            <span className="text-xs font-medium">{agent.name}</span>
                            <span className="text-[10px] text-muted-foreground">· {agent.label}</span>
                          </div>
                        )}
                        <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(out.created_at), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-sm font-medium">{out.title}</p>
                      {expandedOutput === out.id ? (
                        <div className="mt-2">
                          <p className="text-sm whitespace-pre-wrap">{out.content}</p>
                          <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs" onClick={() => setExpandedOutput(null)}>Collapse</Button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-muted-foreground mt-1">{out.preview_text || out.content.slice(0, 120)}…</p>
                          <Button variant="ghost" size="sm" className="mt-1 h-6 text-xs" onClick={() => setExpandedOutput(out.id)}>Expand</Button>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════ RIGHT COLUMN (35%) ══════════════ */}
        <div className="lg:w-[35%] space-y-4">
          {/* AI Operator Bar */}
          <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
            {AI_AGENTS.map((agent) => (
              <button
                key={agent.role}
                onClick={() => setActiveTab(agent.role)}
                className={cn(
                  "flex flex-col items-center gap-1 p-2 rounded-lg transition-colors flex-1 min-w-0 relative",
                  activeTab === agent.role ? "bg-background shadow-sm" : "hover:bg-muted/50"
                )}
              >
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                    {agent.name[0]}
                  </div>
                  <div className={cn(
                    "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                    STATUS_COLORS[agentStatuses[agent.role] || "idle"]
                  )} />
                </div>
                <span className="text-[10px] font-medium truncate w-full text-center">{agent.name}</span>
                <span className="text-[9px] text-muted-foreground truncate w-full text-center">{agent.label}</span>
              </button>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/50">
            <button
              onClick={() => setActiveTab("activity")}
              className={cn(
                "text-xs px-3 py-2 font-medium transition-colors border-b-2",
                activeTab === "activity" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Activity
            </button>
            {AI_AGENTS.map((agent) => (
              <button
                key={agent.role}
                onClick={() => setActiveTab(agent.role)}
                className={cn(
                  "text-xs px-3 py-2 font-medium transition-colors border-b-2",
                  activeTab === agent.role ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {agent.name}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="border border-border/50 rounded-lg overflow-hidden flex flex-col" style={{ height: "calc(100vh - 22rem)" }}>
            {/* ── Activity Tab ── */}
            {activeTab === "activity" && (
              <>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {activity.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-6">No activity yet.</p>
                    )}
                    {activity.map((entry) => {
                      const isAI = entry.type === "ai_update";
                      const isSystem = entry.type === "system";
                      return (
                        <div key={entry.id} className={cn("rounded-lg p-2.5 text-sm", isAI ? "bg-primary/5 border border-primary/10" : isSystem ? "bg-muted/50" : "")}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-medium">
                              {isAI && entry.agent_role
                                ? `${getAgentByRole(entry.agent_role)?.name || entry.agent_role}`
                                : isSystem ? "System" : getProfileName(entry.user_id)}
                            </span>
                            {isAI && entry.agent_role && (
                              <span className="text-[9px] text-muted-foreground">· {getAgentByRole(entry.agent_role)?.label}</span>
                            )}
                            {isAI && (
                              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">Generated</span>
                            )}
                            <span className="text-[10px] text-muted-foreground ml-auto">{format(new Date(entry.created_at), "MMM d, h:mm a")}</span>
                          </div>
                          <p className="text-xs whitespace-pre-wrap">{entry.content}</p>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="border-t border-border/50 p-2">
                  <ActivityComposer onSend={postComment} />
                </div>
              </>
            )}

            {/* ── Individual AI Tab ── */}
            {isAgentTab && activeAgent && (
              <div className="flex-1 flex items-center justify-center p-4">
                <p className="text-sm text-muted-foreground text-center">
                  Chat with {activeAgent.name} from the <strong>AI Team</strong> tab.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Bottom spacing for mobile/desktop so chat input isn't flush with screen edge */}
      <div className="h-16 lg:h-8 shrink-0" />
    </div>
  );
};

// ── Small sub-components ──
const ActivityComposer = ({ onSend }: { onSend: (msg: string) => void }) => {
  const [value, setValue] = useState("");
  const handleSend = () => {
    if (!value.trim()) return;
    onSend(value);
    setValue("");
  };
  return (
    <div className="flex gap-2">
      <Input value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} placeholder="Add a comment…" className="flex-1 h-8 text-sm" />
      <Button size="icon" className="h-8 w-8" onClick={handleSend} disabled={!value.trim()}>
        <Send className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
};

export default TaskDetailView;
