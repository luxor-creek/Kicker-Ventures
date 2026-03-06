import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Users, FileText, CheckSquare, X, ArrowLeft, FolderOpen, Sparkles, CalendarIcon, Upload, Link, BookOpen, Trash2, FileSpreadsheet, Presentation, File, MessageSquare, Bell } from "lucide-react";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import TaskDetailView from "@/components/workspace/TaskDetailView";

interface Project {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

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

interface ProjectDoc {
  id: string;
  title: string;
  doc_type: string;
  external_url: string | null;
  file_url: string | null;
  created_at: string;
}

interface KBDoc {
  id: string;
  title: string;
  content: string | null;
  doc_type: string;
  file_url: string | null;
  external_url: string | null;
  created_at: string;
}

type ProjectTab = "tasks" | "documents" | "knowledge" | "team";

const TASK_COLUMNS = [
  { id: "todo", label: "To Do", color: "border-muted-foreground/30" },
  { id: "in_progress", label: "In Progress", color: "border-yellow-500/50" },
  { id: "stalled", label: "Stalled", color: "border-red-500/50" },
  { id: "done", label: "Done", color: "border-green-500/50" },
];

const DocIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "google_doc": return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
    case "google_sheet": return <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />;
    case "google_slide": return <Presentation className="w-4 h-4 text-orange-500 shrink-0" />;
    case "pdf": return <File className="w-4 h-4 text-red-600 shrink-0" />;
    default: return <FileText className="w-4 h-4 text-muted-foreground shrink-0" />;
  }
};

const AI_AGENT_IDS = [
  "3eb634be-e47d-4137-95fe-1933c0dae0ae",
  "11eca39b-4245-4304-8516-87dbb678975c",
  "1894d3f8-9d6e-4964-8dbb-802c64f0c701",
  "69292b90-3047-4b70-baba-39e172e445d9",
];

const AGENT_ROLE_MAP: Record<string, string> = {
  "3eb634be-e47d-4137-95fe-1933c0dae0ae": "cto",
  "11eca39b-4245-4304-8516-87dbb678975c": "marketing",
  "1894d3f8-9d6e-4964-8dbb-802c64f0c701": "social",
  "69292b90-3047-4b70-baba-39e172e445d9": "assistant",
};

const Projects = ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectTab, setProjectTab] = useState<ProjectTab>("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allProfiles, setAllProfiles] = useState<TeamMember[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newProject, setNewProject] = useState({ name: "", description: "" });
  const [newTask, setNewTask] = useState({ title: "", description: "", assigned_to: userId, deadline: null as Date | null });
  const [userName, setUserName] = useState("");
  const [projectDocs, setProjectDocs] = useState<ProjectDoc[]>([]);
  const [kbDocs, setKBDocs] = useState<KBDoc[]>([]);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [showNewKB, setShowNewKB] = useState(false);
  const [newDocType, setNewDocType] = useState<string>("google_doc");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocUrl, setNewDocUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [kbUploading, setKbUploading] = useState(false);
  const [newKBTitle, setNewKBTitle] = useState("");
  const [newKBContent, setNewKBContent] = useState("");
  const [newKBType, setNewKBType] = useState<string>("text");
  const [newKBUrl, setNewKBUrl] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteAction, setDeleteAction] = useState<(() => void) | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProjects();
    loadMyTasks();
    loadUserName();
    loadAllProfiles();
  }, [userId]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectTasks(selectedProject.id);
      loadTeamMembers(selectedProject.id);
      loadProjectDocs(selectedProject.id);
      loadKBDocs();
    }
  }, [selectedProject]);

  const loadAllProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, email, avatar_url, user_id, title");
    if (data) setAllProfiles(data);
  };

  const loadUserName = async () => {
    const { data } = await supabase.from("profiles").select("full_name").eq("user_id", userId).single();
    if (data) setUserName(data.full_name);
  };

  const loadProjects = async () => {
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (error) { toast({ title: "Error loading projects", variant: "destructive" }); return; }
    setProjects(data || []);
  };

  const loadMyTasks = async () => {
    const { data } = await supabase.from("tasks").select("*").eq("assigned_to", userId).in("status", ["todo", "in_progress", "stalled"]).order("created_at", { ascending: false }).limit(10);
    setMyTasks(data || []);
  };

  const loadProjectTasks = async (projectId: string) => {
    const { data } = await supabase.from("tasks").select("*").eq("project_id", projectId).order("created_at", { ascending: false });
    setTasks(data || []);
  };

  const loadTeamMembers = async (projectId: string) => {
    const { data: memberData } = await supabase.from("project_members").select("user_id").eq("project_id", projectId);
    if (!memberData || memberData.length === 0) { setTeamMembers([]); return; }
    const userIds = memberData.map((m) => m.user_id);
    const { data: profileData } = await supabase.from("profiles").select("id, full_name, email, avatar_url, user_id, title").in("user_id", userIds);
    setTeamMembers(profileData || []);
  };

  const loadProjectDocs = async (_projectId: string) => {
    const { data } = await supabase.from("documents").select("id, title, doc_type, external_url, file_url, created_at").order("created_at", { ascending: false });
    setProjectDocs(data || []);
  };

  const loadKBDocs = async () => {
    const { data } = await supabase.from("knowledge_base").select("*").order("created_at", { ascending: false });
    setKBDocs(data || []);
  };

  const createProject = async () => {
    if (!newProject.name.trim()) { toast({ title: "Project name required", variant: "destructive" }); return; }
    const { data, error } = await supabase.from("projects").insert([{ name: newProject.name, description: newProject.description, created_by: userId }]).select().single();
    if (error) { console.error("Error creating project:", error); toast({ title: "Error creating project", description: error.message, variant: "destructive" }); return; }
    const { data: allProfilesData } = await supabase.from("profiles").select("user_id");
    const allMembers = (allProfilesData || []).map((p) => ({ project_id: data.id, user_id: p.user_id, access_level: "full" }));
    const { error: memberError } = await supabase.from("project_members").insert(allMembers);
    if (memberError) console.error("Error adding members:", memberError);
    toast({ title: "Project created!" });
    setNewProject({ name: "", description: "" });
    setShowNewProject(false);
    loadProjects();
  };

  const createTask = async () => {
    if (!newTask.title.trim() || !selectedProject) { toast({ title: "Task title required", variant: "destructive" }); return; }
    const insertData = {
      title: newTask.title,
      description: newTask.description || "",
      project_id: selectedProject.id,
      created_by: userId,
      assigned_to: newTask.assigned_to || userId,
      deadline: newTask.deadline ? newTask.deadline.toISOString() : null,
      status: "todo",
    };
    const { error } = await supabase.from("tasks").insert([insertData]);
    if (error) {
      console.error("Task creation error:", error);
      toast({ title: "Error creating task", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Task created!" });
    setNewTask({ title: "", description: "", assigned_to: userId, deadline: null });
    setShowNewTask(false);
    loadProjectTasks(selectedProject.id);
    loadMyTasks();
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    await supabase.from("tasks").update({ status: newStatus }).eq("id", taskId);
    if (selectedProject) loadProjectTasks(selectedProject.id);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const filePath = `${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); setUploading(false); return; }
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
      const { error: insertError } = await supabase.from("documents").insert({ title: file.name, doc_type: "pdf", file_url: urlData.publicUrl, created_by: userId });
      if (insertError) { toast({ title: "Failed to save document record", description: insertError.message, variant: "destructive" }); setUploading(false); return; }
      toast({ title: "File uploaded!" });
      if (selectedProject) loadProjectDocs(selectedProject.id);
    } catch (err) {
      console.error("Upload error:", err);
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setUploading(false);
    e.target.value = "";
  };

  const handleKBFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setKbUploading(true);
    try {
      const filePath = `kb/${userId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);
      if (uploadError) { toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" }); setKbUploading(false); return; }
      const { data: urlData } = supabase.storage.from("documents").getPublicUrl(filePath);
      const { error: insertError } = await supabase.from("knowledge_base").insert({ title: file.name, doc_type: "pdf", file_url: urlData.publicUrl, created_by: userId });
      if (insertError) { toast({ title: "Failed to save KB record", description: insertError.message, variant: "destructive" }); setKbUploading(false); return; }
      toast({ title: "PDF uploaded to Knowledge Base!" });
      loadKBDocs();
    } catch (err) {
      console.error("KB Upload error:", err);
      toast({ title: "Upload failed", variant: "destructive" });
    }
    setKbUploading(false);
    e.target.value = "";
  };

  const createDoc = async () => {
    if (!newDocTitle.trim() || !newDocUrl.trim()) {
      toast({ title: "Title and URL are required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("documents").insert({ title: newDocTitle, doc_type: newDocType, external_url: newDocUrl, created_by: userId });
    if (error) {
      console.error("Doc creation error:", error);
      toast({ title: "Error adding document", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Document added!" });
    setNewDocTitle("");
    setNewDocUrl("");
    setShowNewDoc(false);
    if (selectedProject) loadProjectDocs(selectedProject.id);
  };

  const confirmDeleteDoc = (id: string) => {
    setDeleteAction(() => async () => {
      await supabase.from("documents").delete().eq("id", id);
      if (selectedProject) loadProjectDocs(selectedProject.id);
      setDeleteConfirmOpen(false);
      setDeleteAction(null);
    });
    setDeleteConfirmOpen(true);
  };

  const createKBDoc = async () => {
    if (!newKBTitle.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("knowledge_base").insert({
      title: newKBTitle,
      content: newKBContent || null,
      doc_type: newKBType,
      external_url: newKBType !== "text" ? newKBUrl || null : null,
      created_by: userId,
    });
    if (error) {
      console.error("KB creation error:", error);
      toast({ title: "Error adding KB item", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Knowledge base item added!" });
    setNewKBTitle("");
    setNewKBContent("");
    setNewKBUrl("");
    setShowNewKB(false);
    loadKBDocs();
  };

  const confirmDeleteKBDoc = (id: string) => {
    setDeleteAction(() => async () => {
      await supabase.from("knowledge_base").delete().eq("id", id);
      loadKBDocs();
      setDeleteConfirmOpen(false);
      setDeleteAction(null);
    });
    setDeleteConfirmOpen(true);
  };

  const getAssigneeName = (assignedTo: string | null) => {
    if (!assignedTo) return "Unassigned";
    const profile = allProfiles.find(p => p.user_id === assignedTo);
    return profile?.full_name || "Unknown";
  };

  const docTypeLabel = (type: string) => {
    const map: Record<string, string> = { google_doc: "Google Doc", google_sheet: "Google Sheet", google_slide: "Google Slide", pdf: "PDF", text: "Text" };
    return map[type] || type;
  };

  const handleChatWithMember = (member: TeamMember) => {
    if (AI_AGENT_IDS.includes(member.user_id)) {
      const role = AGENT_ROLE_MAP[member.user_id];
      sessionStorage.setItem("open_agent_chat", role || "assistant");
      window.dispatchEvent(new CustomEvent("switch-to-chat", { detail: { agentRole: role } }));
    } else {
      toast({ title: `Opening chat with ${member.full_name}`, description: "Switching to Company Chat…" });
      window.dispatchEvent(new CustomEvent("switch-to-chat", { detail: { userId: member.user_id } }));
    }
  };

  // ── If a task is selected, show inline task detail ──
  if (selectedTask) {
    return (
      <TaskDetailView
        task={selectedTask}
        userId={userId}
        allProfiles={allProfiles}
        onBack={() => {
          setSelectedTask(null);
          if (selectedProject) loadProjectTasks(selectedProject.id);
          loadMyTasks();
        }}
        onTaskUpdated={() => {
          if (selectedProject) loadProjectTasks(selectedProject.id);
          loadMyTasks();
        }}
      />
    );
  }

  // ── Dashboard View ──
  if (!selectedProject) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {userName || "there"}!</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening today.</p>
        </div>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <CheckSquare className="w-5 h-5 text-primary" />
            <h2 className="text-lg md:text-xl font-semibold">Today's Tasks</h2>
          </div>
          {myTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tasks assigned to you right now. 🎉</p>
          ) : (
            <div className="space-y-1.5">
              {myTasks.map((task) => (
                <Card
                  key={task.id}
                  className="p-3 cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {task.deadline && (
                        <span className="text-[10px] text-muted-foreground">{format(new Date(task.deadline), "MMM d")}</span>
                      )}
                      <span className={cn(
                        "text-[10px] font-medium capitalize px-1.5 py-0.5 rounded",
                        task.status === "done" ? "bg-green-100 text-green-700" :
                        task.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                        task.status === "stalled" ? "bg-red-100 text-red-700" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {task.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg md:text-xl font-semibold">Team Updates</h2>
          </div>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Team updates coming soon…</p>
          </Card>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h2 className="text-lg md:text-xl font-semibold">Projects</h2>
            </div>
            <Button size="sm" onClick={() => setShowNewProject(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          </div>

          {showNewProject && (
            <Card className="p-4 space-y-3 mb-4">
              <Input placeholder="Project name" value={newProject.name} onChange={(e) => setNewProject({ ...newProject, name: e.target.value })} />
              <Textarea placeholder="Description" value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
              <div className="flex gap-2">
                <Button onClick={createProject}>Create</Button>
                <Button variant="outline" onClick={() => setShowNewProject(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          {projects.length === 0 ? (
            <p className="text-muted-foreground">No projects yet. Create one to get started.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setSelectedProject(project)}>
                  <CardHeader className="pb-2"><CardTitle className="text-lg">{project.name}</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description || "No description"}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(project.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  // ── Project Detail View ──
  const projectTabs: { id: ProjectTab; label: string; icon: React.ReactNode }[] = [
    { id: "tasks", label: "Tasks", icon: <CheckSquare className="w-4 h-4" /> },
    { id: "documents", label: "Docs", icon: <FileText className="w-4 h-4" /> },
    { id: "knowledge", label: "KB", icon: <BookOpen className="w-4 h-4" /> },
    { id: "team", label: "Team", icon: <Users className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" onClick={() => { setSelectedProject(null); setProjectTab("tasks"); }} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold mb-1">{selectedProject.name}</h1>
        <p className="text-muted-foreground text-sm">{selectedProject.description || "No description"}</p>
      </div>

      <div className="flex gap-1 border-b border-border/50 pb-0 overflow-x-auto">
        {projectTabs.map((t) => (
          <Button key={t.id} variant={projectTab === t.id ? "secondary" : "ghost"} size="sm" onClick={() => setProjectTab(t.id)} className="gap-1.5 shrink-0">
            {t.icon} <span className="hidden sm:inline">{t.label}</span>
          </Button>
        ))}
      </div>

      {/* TASKS TAB - KANBAN */}
      {projectTab === "tasks" && (
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-bold">Tasks</h2>
            <Button onClick={() => setShowNewTask(true)} size="sm"><Plus className="w-4 h-4 mr-1" /> New Task</Button>
          </div>

          {showNewTask && (
            <Card className="p-4 space-y-3 mb-4">
              <Input placeholder="Task title" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
              <Textarea placeholder="Description (optional)" value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Assign to</label>
                  <Select value={newTask.assigned_to || userId} onValueChange={(val) => setNewTask({ ...newTask, assigned_to: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allProfiles.map((p) => (
                        <SelectItem key={p.user_id} value={p.user_id}>{p.full_name} {p.user_id === userId ? "(You)" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Deadline</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !newTask.deadline && "text-muted-foreground")}>
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {newTask.deadline ? format(newTask.deadline, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={newTask.deadline || undefined} onSelect={(d) => setNewTask({ ...newTask, deadline: d || null })} className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={createTask}>Create Task</Button>
                <Button variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
              </div>
            </Card>
          )}

          {/* Kanban Board with Drag & Drop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {TASK_COLUMNS.map((col) => {
              const colTasks = tasks.filter((t) => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className={`space-y-2 border-t-2 ${col.color} pt-3 min-h-[120px] rounded-b-md transition-colors ${draggedTaskId ? "bg-muted/30" : ""}`}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("bg-muted/60"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("bg-muted/60"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("bg-muted/60");
                    const taskId = e.dataTransfer.getData("text/plain");
                    if (taskId) {
                      updateTaskStatus(taskId, col.id);
                      setDraggedTaskId(null);
                    }
                  }}
                >
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {col.label}
                    <span className="ml-2 text-xs">({colTasks.length})</span>
                  </h3>
                  {colTasks.map((task) => (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", task.id);
                        setDraggedTaskId(task.id);
                      }}
                      onDragEnd={() => setDraggedTaskId(null)}
                      className={`p-3 space-y-2 cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors ${draggedTaskId === task.id ? "opacity-50" : ""}`}
                      onClick={() => setSelectedTask(task)}
                    >
                      <p className="text-sm font-medium leading-tight">{task.title}</p>
                      {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                      <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                        <span>→ {getAssigneeName(task.assigned_to)}</span>
                        {task.deadline && <span>· Due {format(new Date(task.deadline), "MMM d")}</span>}
                      </div>
                    </Card>
                  ))}
                  {colTasks.length === 0 && <p className="text-xs text-muted-foreground italic">No tasks</p>}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* DOCUMENTS TAB */}
      {projectTab === "documents" && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-lg md:text-xl font-bold">Documents</h2>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowNewDoc(true)}><Link className="w-4 h-4 mr-1" /> Add Link</Button>
              <label className="cursor-pointer">
                <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                <Button size="sm" variant="outline" asChild>
                  <span><Upload className="w-4 h-4 mr-1" /> {uploading ? "Uploading…" : "Upload PDF"}</span>
                </Button>
              </label>
            </div>
          </div>

          {showNewDoc && (
            <Card className="p-4 space-y-3">
              <Input placeholder="Document title" value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} />
              <Select value={newDocType} onValueChange={setNewDocType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="google_doc">Google Doc</SelectItem>
                  <SelectItem value="google_sheet">Google Sheet</SelectItem>
                  <SelectItem value="google_slide">Google Slide</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Paste URL…" value={newDocUrl} onChange={(e) => setNewDocUrl(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={createDoc}>Add</Button>
                <Button variant="outline" onClick={() => { setShowNewDoc(false); setNewDocTitle(""); setNewDocUrl(""); }}>Cancel</Button>
              </div>
            </Card>
          )}

          {projectDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents yet. Add a Google link or upload a PDF.</p>
          ) : (
            <div className="space-y-2">
              {projectDocs.map((doc) => (
                <Card key={doc.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <DocIcon type={doc.doc_type} />
                    <div className="min-w-0">
                      {doc.external_url || doc.file_url ? (
                        <a href={doc.external_url || doc.file_url || "#"} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate block">{doc.title}</a>
                      ) : (
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{docTypeLabel(doc.doc_type)}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => confirmDeleteDoc(doc.id)}><Trash2 className="w-3 h-3" /></Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* KNOWLEDGE BASE TAB */}
      {projectTab === "knowledge" && (
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <h2 className="text-lg md:text-xl font-bold">Knowledge Base</h2>
              <p className="text-xs text-muted-foreground">Global docs — brand guidelines, SOPs, templates, policies.</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowNewKB(true)}><Plus className="w-4 h-4 mr-1" /> Add</Button>
              <label className="cursor-pointer">
                <input type="file" accept=".pdf" className="hidden" onChange={handleKBFileUpload} disabled={kbUploading} />
                <Button size="sm" variant="outline" asChild>
                  <span><Upload className="w-4 h-4 mr-1" /> {kbUploading ? "Uploading…" : "Upload PDF"}</span>
                </Button>
              </label>
            </div>
          </div>

          {showNewKB && (
            <Card className="p-4 space-y-3">
              <Input placeholder="Title" value={newKBTitle} onChange={(e) => setNewKBTitle(e.target.value)} />
              <Select value={newKBType} onValueChange={setNewKBType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text / Notes</SelectItem>
                  <SelectItem value="google_doc">Google Doc Link</SelectItem>
                  <SelectItem value="google_sheet">Google Sheet Link</SelectItem>
                  <SelectItem value="google_slide">Google Slide Link</SelectItem>
                </SelectContent>
              </Select>
              {newKBType === "text" ? (
                <Textarea placeholder="Content…" value={newKBContent} onChange={(e) => setNewKBContent(e.target.value)} rows={4} />
              ) : (
                <Input placeholder="Paste URL…" value={newKBUrl} onChange={(e) => setNewKBUrl(e.target.value)} />
              )}
              <div className="flex gap-2">
                <Button onClick={createKBDoc}>Add</Button>
                <Button variant="outline" onClick={() => { setShowNewKB(false); setNewKBTitle(""); setNewKBContent(""); setNewKBUrl(""); }}>Cancel</Button>
              </div>
            </Card>
          )}

          {kbDocs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No knowledge base items yet.</p>
          ) : (
            <div className="space-y-2">
              {kbDocs.map((doc) => (
                <Card key={doc.id} className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <DocIcon type={doc.doc_type} />
                    <div className="min-w-0">
                      {doc.external_url || doc.file_url ? (
                        <a href={doc.external_url || doc.file_url || "#"} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline truncate block">{doc.title}</a>
                      ) : (
                        <p className="text-sm font-medium truncate">{doc.title}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{docTypeLabel(doc.doc_type)}</p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" onClick={() => confirmDeleteKBDoc(doc.id)}><Trash2 className="w-3 h-3" /></Button>
                  )}
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TEAM TAB */}
      {projectTab === "team" && (
        <section>
          <h2 className="text-lg md:text-xl font-bold mb-4">Team Members</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teamMembers.map((member) => (
              <Card key={member.id} className="p-4 flex items-center gap-3">
                {member.avatar_url ? (
                  <img src={member.avatar_url} alt={member.full_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold">{member.full_name?.[0] || "?"}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{member.full_name}</p>
                  {member.title && <p className="text-xs text-primary font-medium truncate">{member.title}</p>}
                  <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  title={`Chat with ${member.full_name}`}
                  onClick={() => handleChatWithMember(member)}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
              </Card>
            ))}
            {teamMembers.length === 0 && <p className="text-sm text-muted-foreground">No team members found.</p>}
          </div>
        </section>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={(open) => { setDeleteConfirmOpen(open); if (!open) setDeleteAction(null); }}
        onConfirm={() => deleteAction?.()}
      />
    </div>
  );
};

export default Projects;
