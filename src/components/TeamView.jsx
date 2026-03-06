import { useState } from "react";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Crown,
  ExternalLink,
  FileText,
  Mail,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  User,
  Users,
  Wrench,
  X
} from "lucide-react";
import { agents as initialAgents, employees as initialEmployees, agentToolSets } from "../lib/workspace-data";
const admin = {
  name: "Paul",
  email: "paul@kickervideo.com",
  avatar: "/agents/paul.png",
  role: "Admin"
};
function ToolLogo({ src, name }) {
  const [err, setErr] = useState(false);
  if (err) {
    return <div className="flex h-4 w-4 items-center justify-center rounded bg-muted text-[8px] font-bold text-muted-foreground">
        {name[0]}
      </div>;
  }
  return <img src={src} alt={name} className="h-4 w-4 object-contain" onError={() => setErr(true)} />;
}
export function TeamView({ onNavigateToAgents }) {
  const [agentList, setAgentList] = useState(initialAgents);
  const [employeeList, setEmployeeList] = useState(initialEmployees);
  const [modal, setModal] = useState(null);
  const [editTargetId, setEditTargetId] = useState(null);
  const [agentName, setAgentName] = useState("");
  const [agentRole, setAgentRole] = useState("");
  const [agentExpertise, setAgentExpertise] = useState("");
  const [agentNotes, setAgentNotes] = useState("");
  const [agentStatus, setAgentStatus] = useState("idle");
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [empName, setEmpName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empRole, setEmpRole] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState(null);
  function resetForms() {
    setAgentName("");
    setAgentRole("");
    setAgentExpertise("");
    setAgentNotes("");
    setAgentStatus("idle");
    setEmpName("");
    setEmpEmail("");
    setEmpRole("");
    setEditTargetId(null);
    setModal(null);
    setConfirmDeleteId(null);
    setConfirmDeleteType(null);
  }
  function openAddAgent() {
    resetForms();
    setModal("addAgent");
  }
  function openEditAgent(agent) {
    resetForms();
    setAgentName(agent.name);
    setAgentRole(agent.role);
    setAgentExpertise(agent.expertise || "");
    setAgentNotes(agent.profileNotes || "");
    setAgentStatus(agent.status);
    setEditTargetId(agent.id);
    setModal("editAgent");
  }
  function saveAgent() {
    if (!agentName.trim() || !agentRole.trim()) return;
    if (modal === "addAgent") {
      const newAgent = {
        id: `agent-${Date.now()}`,
        name: agentName.trim(),
        avatar: "",
        role: agentRole.trim(),
        status: agentStatus,
        expertise: agentExpertise.trim() || void 0,
        profileNotes: agentNotes.trim() || void 0
      };
      setAgentList((prev) => [...prev, newAgent]);
    } else if (modal === "editAgent" && editTargetId) {
      setAgentList(
        (prev) => prev.map(
          (a) => a.id === editTargetId ? {
            ...a,
            name: agentName.trim(),
            role: agentRole.trim(),
            status: agentStatus,
            expertise: agentExpertise.trim() || void 0,
            profileNotes: agentNotes.trim() || void 0
          } : a
        )
      );
    }
    resetForms();
  }
  function deleteAgent(id) {
    setAgentList((prev) => prev.filter((a) => a.id !== id));
    setConfirmDeleteId(null);
    setConfirmDeleteType(null);
  }
  function openAddEmployee() {
    resetForms();
    setModal("addEmployee");
  }
  function openEditEmployee(emp) {
    resetForms();
    setEmpName(emp.name);
    setEmpEmail(emp.email);
    setEmpRole(emp.role);
    setEditTargetId(emp.id);
    setModal("editEmployee");
  }
  function saveEmployee() {
    if (!empName.trim() || !empEmail.trim()) return;
    if (modal === "addEmployee") {
      const newEmp = {
        id: `emp-${Date.now()}`,
        name: empName.trim(),
        email: empEmail.trim(),
        role: empRole.trim() || "Team Member"
      };
      setEmployeeList((prev) => [...prev, newEmp]);
    } else if (modal === "editEmployee" && editTargetId) {
      setEmployeeList(
        (prev) => prev.map(
          (e) => e.id === editTargetId ? { ...e, name: empName.trim(), email: empEmail.trim(), role: empRole.trim() || "Team Member" } : e
        )
      );
    }
    resetForms();
  }
  function deleteEmployee(id) {
    setEmployeeList((prev) => prev.filter((e) => e.id !== id));
    setConfirmDeleteId(null);
    setConfirmDeleteType(null);
  }
  function requestDelete(id, type) {
    setConfirmDeleteId(id);
    setConfirmDeleteType(type);
  }
  const totalMembers = 1 + agentList.length + employeeList.length;
  return <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {
    /* Header */
  }
        <div className="mb-6 pl-10 md:pl-0">
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Team</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalMembers} members across your workspace
          </p>
        </div>

        <div className="space-y-8">
          {
    /* =============== ADMIN =============== */
  }
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-foreground">Admin</h2>
            </div>
            <div className="rounded-xl border border-border bg-card">
              <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4">
                <Avatar className="h-10 w-10 ring-2 ring-amber-400/40">
                  <AvatarImage src={admin.avatar} alt={admin.name} />
                  <AvatarFallback className="bg-accent text-accent-foreground font-bold">P</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">{admin.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                </div>
                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200 text-[11px]">
                  {admin.role}
                </Badge>
              </div>
            </div>
          </section>

          {
    /* =============== AI AGENTS =============== */
  }
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-foreground">AI Agents</h2>
                <Badge variant="outline" className="ml-1 text-[11px]">{agentList.length}</Badge>
              </div>
              <button
    onClick={openAddAgent}
    className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
  >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Create Agent</span>
                <span className="sm:hidden">Create</span>
              </button>
            </div>

            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {agentList.length === 0 ? <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Bot className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No agents yet</p>
                </div> : agentList.map((agent) => {
    const isExpanded = expandedAgentId === agent.id;
    return <div key={agent.id}>
                    <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={agent.avatar} alt={agent.name} />
                          <AvatarFallback className="bg-accent/20 text-accent text-xs font-bold">
                            {agent.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-card",
        agent.status === "active" && "bg-emerald-500",
        agent.status === "working" && "bg-amber-500",
        agent.status === "idle" && "bg-muted-foreground"
      )}
    />
                      </div>
                      <button
      onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
      className="min-w-0 flex-1 text-left"
    >
                        <p className="truncate text-sm font-medium text-card-foreground">{agent.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{agent.role}</p>
                      </button>
                      <Badge
      variant="outline"
      className={cn(
        "hidden text-[10px] capitalize sm:inline-flex",
        agent.status === "active" && "border-emerald-200 text-emerald-700",
        agent.status === "working" && "border-amber-200 text-amber-700",
        agent.status === "idle" && "border-border text-muted-foreground"
      )}
    >
                        {agent.status}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <button
      onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={isExpanded ? "Collapse profile" : "Expand profile"}
    >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                        <button
      onClick={() => openEditAgent(agent)}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      aria-label={`Edit ${agent.name}`}
    >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {confirmDeleteId === agent.id && confirmDeleteType === "agent" ? <div className="flex items-center gap-1">
                            <button
      onClick={() => deleteAgent(agent.id)}
      className="rounded bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90"
    >
                              Yes
                            </button>
                            <button
      onClick={() => {
        setConfirmDeleteId(null);
        setConfirmDeleteType(null);
      }}
      className="rounded border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
    >
                              No
                            </button>
                          </div> : <button
      onClick={() => requestDelete(agent.id, "agent")}
      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      aria-label={`Delete ${agent.name}`}
    >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>}
                      </div>
                    </div>

                    {
      /* Expanded agent profile */
    }
                    {isExpanded && (() => {
      const toolSet = agentToolSets[agent.id];
      const activeTools = toolSet?.active || [];
      return <div className="border-t border-border/50 bg-muted/30 px-4 py-3 sm:px-5 sm:py-4">
                        <div className="grid gap-3 sm:grid-cols-2">
                          {agent.expertise && <div>
                              <div className="mb-1 flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3 text-accent" />
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Expertise</p>
                              </div>
                              <p className="text-xs leading-relaxed text-card-foreground">{agent.expertise}</p>
                            </div>}
                          {agent.profileNotes && <div>
                              <div className="mb-1 flex items-center gap-1.5">
                                <FileText className="h-3 w-3 text-accent" />
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Profile Notes</p>
                              </div>
                              <p className="text-xs leading-relaxed text-card-foreground">{agent.profileNotes}</p>
                            </div>}
                        </div>
                        {!agent.expertise && !agent.profileNotes && <p className="mb-3 text-xs text-muted-foreground">No profile details added yet. Click edit to add expertise and notes.</p>}

                        {
        /* Tools section */
      }
                        <div className={cn((agent.expertise || agent.profileNotes) && "mt-3 border-t border-border/50 pt-3")}>
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Wrench className="h-3 w-3 text-accent" />
                              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Tools
                              </p>
                              <span className="text-[10px] text-muted-foreground/60">({activeTools.length} active)</span>
                            </div>
                            {onNavigateToAgents && <button
        onClick={onNavigateToAgents}
        className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium text-accent transition-colors hover:bg-accent/10"
      >
                                <Pencil className="h-2.5 w-2.5" />
                                Edit Tools
                                <ExternalLink className="h-2.5 w-2.5" />
                              </button>}
                          </div>
                          {activeTools.length > 0 ? <div className="flex flex-wrap gap-1.5">
                              {activeTools.map((tool) => <div
        key={tool.id}
        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2 py-1 transition-colors hover:border-accent/30"
        title={tool.description}
      >
                                  <ToolLogo src={tool.logo} name={tool.name} />
                                  <span className="text-[10px] font-medium text-card-foreground">{tool.name}</span>
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Active" />
                                </div>)}
                            </div> : <p className="text-[11px] text-muted-foreground">
                              No tools configured.{" "}
                              {onNavigateToAgents && <button onClick={onNavigateToAgents} className="text-accent underline-offset-2 hover:underline">
                                  Add tools in Agents view
                                </button>}
                            </p>}
                        </div>
                      </div>;
    })()}

                    {confirmDeleteId === agent.id && confirmDeleteType === "agent" && <p className="px-5 pb-2 text-xs text-destructive">
                        Are you sure you want to delete this agent?
                      </p>}
                  </div>;
  })}
            </div>
          </section>

          {
    /* =============== EMPLOYEES =============== */
  }
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold text-foreground">Employees</h2>
                <Badge variant="outline" className="ml-1 text-[11px]">{employeeList.length}</Badge>
              </div>
              <button
    onClick={openAddEmployee}
    className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
  >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Employee</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>

            <div className="divide-y divide-border rounded-xl border border-border bg-card">
              {employeeList.length === 0 ? <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Users className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">No employees yet</p>
                </div> : employeeList.map((emp) => <div key={emp.id}>
                    <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-3.5">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={emp.avatar} alt={emp.name} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-xs font-bold">
                          {emp.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-card-foreground">{emp.name}</p>
                        <div className="flex items-center gap-1.5">
                          <Mail className="hidden h-3 w-3 text-muted-foreground sm:block" />
                          <p className="truncate text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="hidden text-[10px] sm:inline-flex">
                        {emp.role}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <button
    onClick={() => openEditEmployee(emp)}
    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    aria-label={`Edit ${emp.name}`}
  >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        {confirmDeleteId === emp.id && confirmDeleteType === "employee" ? <div className="flex items-center gap-1">
                            <button
    onClick={() => deleteEmployee(emp.id)}
    className="rounded bg-destructive px-2 py-0.5 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90"
  >
                              Yes
                            </button>
                            <button
    onClick={() => {
      setConfirmDeleteId(null);
      setConfirmDeleteType(null);
    }}
    className="rounded border border-border px-2 py-0.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted"
  >
                              No
                            </button>
                          </div> : <button
    onClick={() => requestDelete(emp.id, "employee")}
    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
    aria-label={`Delete ${emp.name}`}
  >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>}
                      </div>
                    </div>
                    {confirmDeleteId === emp.id && confirmDeleteType === "employee" && <p className="px-5 pb-2 text-xs text-destructive">
                        Are you sure you want to delete this employee?
                      </p>}
                  </div>)}
            </div>
          </section>
        </div>
      </div>

      {
    /* =============== MODAL OVERLAY =============== */
  }
      {modal && <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={resetForms} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl sm:p-6">
            {
    /* Modal header */
  }
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                {modal === "addAgent" && "Create AI Agent"}
                {modal === "editAgent" && "Edit Agent"}
                {modal === "addEmployee" && "Add Employee"}
                {modal === "editEmployee" && "Edit Employee"}
              </h3>
              <button
    onClick={resetForms}
    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    aria-label="Close"
  >
                <X className="h-4 w-4" />
              </button>
            </div>

            {
    /* Agent form */
  }
            {(modal === "addAgent" || modal === "editAgent") && <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Name</Label>
                  <Input
    value={agentName}
    onChange={(e) => setAgentName(e.target.value)}
    placeholder="e.g. Marnie"
    className="h-9 text-sm"
  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Role / Specialty</Label>
                  <Input
    value={agentRole}
    onChange={(e) => setAgentRole(e.target.value)}
    placeholder="e.g. Marketing Lead"
    className="h-9 text-sm"
  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Expertise</Label>
                  <Input
    value={agentExpertise}
    onChange={(e) => setAgentExpertise(e.target.value)}
    placeholder="e.g. Campaign strategy, market research, brand positioning"
    className="h-9 text-sm"
  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Profile Notes</Label>
                  <textarea
    value={agentNotes}
    onChange={(e) => setAgentNotes(e.target.value)}
    placeholder="Describe this agent's responsibilities, personality, or instructions..."
    rows={3}
    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</Label>
                  <Select value={agentStatus} onValueChange={(v) => setAgentStatus(v)}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="working">Working</SelectItem>
                      <SelectItem value="idle">Idle</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
    onClick={saveAgent}
    disabled={!agentName.trim() || !agentRole.trim()}
    className="flex-1 rounded-lg bg-accent py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
  >
                    {modal === "addAgent" ? "Create Agent" : "Save Changes"}
                  </button>
                  <button
    onClick={resetForms}
    className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
  >
                    Cancel
                  </button>
                </div>
              </div>}

            {
    /* Employee form */
  }
            {(modal === "addEmployee" || modal === "editEmployee") && <div className="space-y-4">
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Full Name</Label>
                  <Input
    value={empName}
    onChange={(e) => setEmpName(e.target.value)}
    placeholder="e.g. Jane Doe"
    className="h-9 text-sm"
  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</Label>
                  <Input
    type="email"
    value={empEmail}
    onChange={(e) => setEmpEmail(e.target.value)}
    placeholder="e.g. jane@kicker.ventures"
    className="h-9 text-sm"
  />
                </div>
                <div>
                  <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Role</Label>
                  <Input
    value={empRole}
    onChange={(e) => setEmpRole(e.target.value)}
    placeholder="e.g. Marketing"
    className="h-9 text-sm"
  />
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <button
    onClick={saveEmployee}
    disabled={!empName.trim() || !empEmail.trim()}
    className="flex-1 rounded-lg bg-accent py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
  >
                    {modal === "addEmployee" ? "Add Employee" : "Save Changes"}
                  </button>
                  <button
    onClick={resetForms}
    className="rounded-lg border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
  >
                    Cancel
                  </button>
                </div>
              </div>}
          </div>
        </div>}
    </div>;
}
