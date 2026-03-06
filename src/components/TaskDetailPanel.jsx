import { useState } from "react";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from "./ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import {
  Calendar,
  CheckCircle2,
  Circle,
  Clock,
  Loader2,
  Pencil,
  Save,
  Trash2,
  X,
  Bot,
  Plus,
  AlertTriangle
} from "lucide-react";
import { agents as allAgents } from "../lib/workspace-data";
function TaskStatusIcon({ status }) {
  switch (status) {
    case "Completed":
      return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "In Progress":
      return <Loader2 className="h-5 w-5 animate-spin text-amber-500" />;
    default:
      return <Circle className="h-5 w-5 text-muted-foreground/50" />;
  }
}
const statusColorMap = {
  Todo: "bg-muted text-muted-foreground border-border",
  "In Progress": "bg-amber-100 text-amber-700 border-amber-200",
  Completed: "bg-emerald-100 text-emerald-700 border-emerald-200"
};
const priorityColorMap = {
  Low: "bg-blue-100 text-blue-700 border-blue-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  High: "bg-red-100 text-red-700 border-red-200"
};
function progressBarColor(progress) {
  if (progress >= 100) return "[&>div]:bg-emerald-500";
  if (progress >= 50) return "[&>div]:bg-accent";
  if (progress > 0) return "[&>div]:bg-amber-500";
  return "[&>div]:bg-muted-foreground/20";
}
export function TaskDetailPanel({
  task,
  open,
  onClose,
  onUpdate,
  onDelete,
  projectAgents
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editStatus, setEditStatus] = useState("Todo");
  const [editProgress, setEditProgress] = useState(0);
  const [editPriority, setEditPriority] = useState("Medium");
  const [editDeadline, setEditDeadline] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addingAgent, setAddingAgent] = useState(false);
  const [confirmRemoveAgentId, setConfirmRemoveAgentId] = useState(null);
  function startEditing() {
    if (!task) return;
    setEditTitle(task.title);
    setEditNotes(task.notes || "");
    setEditStatus(task.status);
    setEditProgress(task.progress);
    setEditPriority(task.priority || "Medium");
    setEditDeadline(task.deadline || "");
    setEditing(true);
  }
  function cancelEditing() {
    setEditing(false);
    setShowDeleteConfirm(false);
  }
  function handleSave() {
    if (!task) return;
    onUpdate({
      ...task,
      title: editTitle,
      notes: editNotes,
      status: editStatus,
      progress: editProgress,
      priority: editPriority,
      deadline: editDeadline
    });
    setEditing(false);
  }
  function handleDelete() {
    if (!task) return;
    onDelete(task.id);
    setShowDeleteConfirm(false);
    onClose();
  }
  function handleAddAgent(agentId) {
    if (!task) return;
    if (task.assignedAgents.includes(agentId)) return;
    onUpdate({ ...task, assignedAgents: [...task.assignedAgents, agentId] });
    setAddingAgent(false);
  }
  function handleRemoveAgent(agentId) {
    if (!task) return;
    onUpdate({ ...task, assignedAgents: task.assignedAgents.filter((id) => id !== agentId) });
  }
  if (!task) return null;
  const assignedAgentObjects = task.assignedAgents.map((id) => allAgents.find((a) => a.id === id)).filter(Boolean);
  const unassignedAgents = allAgents.filter(
    (a) => !task.assignedAgents.includes(a.id)
  );
  return <Sheet
    open={open}
    onOpenChange={(o) => {
      if (!o) {
        setEditing(false);
        setAddingAgent(false);
        setShowDeleteConfirm(false);
        setConfirmRemoveAgentId(null);
        onClose();
      }
    }}
  >
      <SheetContent
    side="right"
    className="flex w-full flex-col overflow-hidden border-l border-border bg-card p-0 sm:max-w-[480px]"
  >
        {
    /* Header */
  }
        <SheetHeader className="border-b border-border px-6 py-5">
          <div className="flex items-start gap-3">
            <TaskStatusIcon status={editing ? editStatus : task.status} />
            <div className="min-w-0 flex-1">
              {editing ? <Input
    value={editTitle}
    onChange={(e) => setEditTitle(e.target.value)}
    className="mb-1 h-8 text-base font-semibold"
    autoFocus
  /> : <SheetTitle className="text-base leading-tight">{task.title}</SheetTitle>}
              <SheetDescription className="sr-only">
                Task: {task.title} - {editing ? editStatus : task.status}
              </SheetDescription>
              <div className="mt-1 flex items-center gap-2">
                <Badge
    variant="outline"
    className={cn(
      "border text-[10px] font-medium",
      statusColorMap[editing ? editStatus : task.status]
    )}
  >
                  {editing ? editStatus : task.status}
                </Badge>
                {(editing ? editPriority : task.priority) && <Badge
    variant="outline"
    className={cn(
      "border text-[10px] font-medium",
      priorityColorMap[(editing ? editPriority : task.priority) || "Medium"]
    )}
  >
                    {editing ? editPriority : task.priority}
                  </Badge>}
              </div>
            </div>
          </div>
        </SheetHeader>

        {
    /* Body */
  }
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-5 px-6 py-5">
            {
    /* Progress */
  }
            <div>
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Progress
              </Label>
              {editing ? <div className="flex items-center gap-3">
                  <Input
    type="number"
    min={0}
    max={100}
    value={editProgress}
    onChange={(e) => setEditProgress(Math.min(100, Math.max(0, Number(e.target.value))))}
    className="h-8 w-20 text-sm"
  />
                  <span className="text-xs text-muted-foreground">%</span>
                  <Progress
    value={editProgress}
    className={cn("h-2 flex-1", progressBarColor(editProgress))}
  />
                </div> : <div className="flex items-center gap-3">
                  <Progress
    value={task.progress}
    className={cn("h-2 flex-1", progressBarColor(task.progress))}
  />
                  <span className="text-sm font-semibold text-foreground">{task.progress}%</span>
                </div>}
            </div>

            {
    /* Deadline */
  }
            <div>
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Calendar className="mr-1 inline h-3 w-3" />
                Deadline
              </Label>
              {editing ? <Input
    value={editDeadline}
    onChange={(e) => setEditDeadline(e.target.value)}
    placeholder="e.g. Feb 15, 2026"
    className="h-9 text-sm"
  /> : <div className="flex items-center gap-2 text-sm text-foreground">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {task.deadline || "No deadline set"}
                  {task.deadline && <span className="text-xs text-muted-foreground">(Created {task.date})</span>}
                </div>}
            </div>

            {
    /* Status & Priority (edit mode) */
  }
            {editing && <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Todo">Todo</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Priority
                  </Label>
                  <Select value={editPriority} onValueChange={(v) => setEditPriority(v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>}

            {
    /* Notes */
  }
            <div>
              <Label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes
              </Label>
              {editing ? <Textarea
    value={editNotes}
    onChange={(e) => setEditNotes(e.target.value)}
    placeholder="Add notes about this task..."
    className="min-h-[120px] resize-none text-sm leading-relaxed"
  /> : <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                  <p className="text-sm leading-relaxed text-foreground">
                    {task.notes || "No notes yet."}
                  </p>
                </div>}
            </div>

            {
    /* Divider */
  }
            <div className="border-t border-border" />

            {
    /* Assigned Agents (compact, below notes) */
  }
            <div>
              <Label className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <Bot className="mr-1 inline h-3 w-3" />
                Assigned Agents ({task.assignedAgents.length})
              </Label>

              {assignedAgentObjects.length > 0 ? <div className="space-y-1.5">
                  {assignedAgentObjects.map((agent) => {
    if (!agent) return null;
    return <div key={agent.id}>
                        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={agent.avatar} alt={agent.name} />
                            <AvatarFallback className="bg-accent text-accent-foreground text-[9px] font-bold">
                              {agent.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                            {agent.name}
                          </span>
                          <Badge
      variant="outline"
      className={cn(
        "text-[9px] capitalize",
        agent.status === "active" && "border-emerald-200 text-emerald-700",
        agent.status === "working" && "border-amber-200 text-amber-700",
        agent.status === "idle" && "border-border text-muted-foreground"
      )}
    >
                            {agent.status}
                          </Badge>
                          {confirmRemoveAgentId === agent.id ? <div className="flex items-center gap-1">
                              <button
      onClick={() => {
        handleRemoveAgent(agent.id);
        setConfirmRemoveAgentId(null);
      }}
      className="rounded bg-destructive px-2 py-0.5 text-[10px] font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
    >
                                Yes
                              </button>
                              <button
      onClick={() => setConfirmRemoveAgentId(null)}
      className="rounded border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted"
    >
                                Cancel
                              </button>
                            </div> : <button
      onClick={() => setConfirmRemoveAgentId(agent.id)}
      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      aria-label={`Remove ${agent.name}`}
    >
                              <X className="h-3 w-3" />
                            </button>}
                        </div>
                        {confirmRemoveAgentId === agent.id && <p className="px-2.5 py-1 text-[11px] text-destructive">
                            Are you sure you want to remove this agent?
                          </p>}
                      </div>;
  })}
                </div> : <p className="mb-1 text-xs text-muted-foreground">No agents assigned yet.</p>}

              {
    /* Add agent dropdown */
  }
              {addingAgent ? <div className="mt-1.5 space-y-1.5">
                  <div className="rounded-md border border-border bg-background p-0.5">
                    {unassignedAgents.length > 0 ? unassignedAgents.map((agent) => <button
    key={agent.id}
    onClick={() => handleAddAgent(agent.id)}
    className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
  >
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={agent.avatar} alt={agent.name} />
                            <AvatarFallback className="bg-accent text-accent-foreground text-[8px] font-bold">
                              {agent.name[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-foreground">{agent.name}</span>
                          <span className="text-[10px] text-muted-foreground">{agent.role}</span>
                          {projectAgents.includes(agent.id) && <Badge variant="outline" className="ml-auto text-[8px]">On Project</Badge>}
                        </button>) : <p className="px-2.5 py-1.5 text-xs text-muted-foreground">All agents are already assigned.</p>}
                  </div>
                  <button
    onClick={() => setAddingAgent(false)}
    className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
  >
                    Cancel
                  </button>
                </div> : <button
    onClick={() => setAddingAgent(true)}
    className="mt-1.5 flex w-full items-center gap-1.5 rounded-md border border-dashed border-accent/40 px-2.5 py-2 text-xs text-muted-foreground transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
  >
                  <Plus className="h-3.5 w-3.5" />
                  Add Agent
                </button>}
            </div>
          </div>
        </div>

        {
    /* Footer actions */
  }
        <div className="border-t border-border px-6 py-3">
          {showDeleteConfirm ? <div className="flex items-center gap-3">
              <div className="flex flex-1 items-center gap-2 text-xs text-destructive">
                <AlertTriangle className="h-3.5 w-3.5" />
                Delete this task?
              </div>
              <button
    onClick={handleDelete}
    className="rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90"
  >
                Confirm
              </button>
              <button
    onClick={() => setShowDeleteConfirm(false)}
    className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted"
  >
                Cancel
              </button>
            </div> : editing ? <div className="flex items-center gap-2">
              <button
    onClick={handleSave}
    className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-accent py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
  >
                <Save className="h-3.5 w-3.5" />
                Save Changes
              </button>
              <button
    onClick={cancelEditing}
    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
  >
                Cancel
              </button>
            </div> : <div className="flex items-center gap-2">
              <button
    onClick={onClose}
    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
  >
                Close
              </button>
              <button
    onClick={startEditing}
    className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
  >
                <Pencil className="h-3 w-3" />
                Edit Task
              </button>
              <div className="flex-1" />
              <button
    onClick={() => setShowDeleteConfirm(true)}
    className="flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-2 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
  >
                <Trash2 className="h-3 w-3" />
                Delete
              </button>
            </div>}
        </div>
      </SheetContent>
    </Sheet>;
}
