import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, GripVertical } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  assigned_to: string | null;
  created_by: string;
  created_at: string;
}

interface Props {
  userId: string;
  isAdmin: boolean;
}

const columns = [
  { id: "todo", label: "To Do", color: "border-muted-foreground/30" },
  { id: "in_progress", label: "In Progress", color: "border-primary/50" },
  { id: "stalled", label: "Stalled", color: "border-red-500/50" },
  { id: "done", label: "Done", color: "border-green-500/50" },
];

const TaskBoard = ({ userId, isAdmin }: Props) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").order("created_at", { ascending: false });
    if (data) setTasks(data);
  };

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("user_id, full_name");
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((p) => (map[p.user_id] = p.full_name));
      setProfiles(map);
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchProfiles();
  }, []);

  const addTask = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    await supabase.from("tasks").insert({ title: newTitle.trim(), created_by: userId });
    setNewTitle("");
    setAdding(false);
    fetchTasks();
  };

  const moveTask = async (taskId: string, newStatus: string) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    fetchTasks();
  };

  const confirmDelete = (taskId: string) => {
    setDeleteTargetId(taskId);
    setDeleteConfirmOpen(true);
  };

  const deleteTask = async () => {
    if (!deleteTargetId) return;
    await supabase.from("tasks").delete().eq("id", deleteTargetId);
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
    fetchTasks();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="New task…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          className="max-w-xs"
        />
        <Button size="sm" onClick={addTask} disabled={adding}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <div key={col.id} className={`space-y-2 border-t-2 ${col.color} pt-3`}>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {col.label}
              <span className="ml-2 text-xs">({tasks.filter((t) => t.status === col.id).length})</span>
            </h3>
            {tasks
              .filter((t) => t.status === col.id)
              .map((task) => (
                <Card key={task.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{task.title}</p>
                    <GripVertical className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
                  </div>
                  {task.assigned_to && (
                    <p className="text-xs text-muted-foreground">→ {profiles[task.assigned_to] || "Unassigned"}</p>
                  )}
                  <div className="flex gap-1 flex-wrap">
                    {columns
                      .filter((c) => c.id !== col.id)
                      .map((c) => (
                        <button
                          key={c.id}
                          onClick={() => moveTask(task.id, c.id)}
                          className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground hover:text-foreground transition-colors"
                        >
                          → {c.label}
                        </button>
                      ))}
                    {isAdmin && (
                      <button
                        onClick={() => confirmDelete(task.id)}
                        className="text-[10px] px-2 py-0.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </Card>
              ))}
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={deleteTask}
      />
    </div>
  );
};

export default TaskBoard;
