import { useState, useRef } from "react";
import { cn } from "../lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Check,
  AlertTriangle,
  Globe,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Search,
  Shield,
  SlidersHorizontal,
  Sparkles,
  Upload,
  Wrench,
  X,
  Eye,
  EyeOff
} from "lucide-react";
import {
  agents as initialAgents,
  agentToolSets
} from "../lib/workspace-data";
const categoryLabels = {
  system: "System",
  developer: "Developer",
  communication: "Communication",
  creative: "Creative",
  marketing: "Marketing",
  productivity: "Productivity"
};
function ToolLogo({ src, name, size = "sm" }) {
  const [imgError, setImgError] = useState(false);
  const s = size === "md" ? "h-8 w-8" : "h-5 w-5";
  const fs = size === "md" ? "text-[11px]" : "text-[9px]";
  if (imgError) {
    return <div className={cn(s, "flex items-center justify-center rounded bg-muted", fs, "font-bold text-muted-foreground")}>
        {name[0]}
      </div>;
  }
  return <img
    src={src}
    alt={name}
    className={cn(s, "object-contain")}
    onError={() => setImgError(true)}
  />;
}
function StatusDot({ status }) {
  if (status === "active") return <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />;
  if (status === "error") return <span className="h-1.5 w-1.5 rounded-full bg-destructive" />;
  return <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />;
}
function ToolInfoModal({ tool, onClose }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <ToolLogo src={tool.logo} name={tool.name} size="md" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">{tool.name}</h3>
              <div className="flex items-center gap-1.5">
                <Badge variant="outline" className="text-[9px] capitalize">{categoryLabels[tool.category]}</Badge>
                {tool.preInstalled && <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <Shield className="h-2.5 w-2.5" />
                    Pre-installed
                  </span>}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-muted/30 px-4 py-3">
          <p className="text-xs font-medium text-muted-foreground">Purpose</p>
          <p className="mt-1 text-sm leading-relaxed text-card-foreground">{tool.description}</p>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
          <div className="flex items-center gap-2">
            <StatusDot status={tool.status} />
            <span className={cn(
    "text-xs font-medium capitalize",
    tool.status === "active" && "text-emerald-600",
    tool.status === "error" && "text-destructive",
    tool.status === "not_linked" && "text-muted-foreground"
  )}>
              {tool.status === "active" ? "Connected" : tool.status === "error" ? "Error" : "Not Linked"}
            </span>
          </div>
          {tool.preInstalled && <span className="text-[10px] text-muted-foreground">Set by admin</span>}
        </div>
      </div>
    </div>;
}
function ConnectModal({
  tool,
  onClose,
  onConnected
}) {
  const [fieldValues, setFieldValues] = useState({});
  const [showPasswords, setShowPasswords] = useState({});
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState("idle");
  function updateField(key, value) {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
    setTestResult("idle");
  }
  function toggleShowPassword(key) {
    setShowPasswords((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function handleTest() {
    setTesting(true);
    setTestResult("idle");
    setTimeout(() => {
      const allFilled2 = (tool.fields || []).every((f) => (fieldValues[f.key] || "").trim());
      if (allFilled2) {
        setTestResult("success");
      } else {
        setTestResult("error");
      }
      setTesting(false);
    }, 2e3);
  }
  function handleConnect() {
    onConnected(tool.id);
    onClose();
  }
  const allFilled = (tool.fields || []).every((f) => (fieldValues[f.key] || "").trim());
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
        {
    /* Header */
  }
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <ToolLogo src={tool.logo} name={tool.name} size="md" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-card-foreground">Connect {tool.name}</h3>
              <p className="text-[11px] text-muted-foreground">{tool.description}</p>
            </div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {
    /* Fields */
  }
        <div className="space-y-3 px-5 py-4">
          {(tool.fields || []).map((field) => <div key={field.key}>
              <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">{field.label}</label>
              <div className="relative">
                <input
    type={field.type === "password" && !showPasswords[field.key] ? "password" : "text"}
    value={fieldValues[field.key] || ""}
    onChange={(e) => updateField(field.key, e.target.value)}
    placeholder={field.placeholder}
    className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-9 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-accent/50"
  />
                {field.type === "password" && <button
    onClick={() => toggleShowPassword(field.key)}
    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
  >
                    {showPasswords[field.key] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>}
              </div>
            </div>)}

          {
    /* Test result feedback */
  }
          {testResult === "success" && <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
              <Check className="h-4 w-4 text-emerald-600" />
              <p className="text-xs font-medium text-emerald-600">Connection successful</p>
            </div>}
          {testResult === "error" && <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-xs font-medium text-destructive">Error -- confirm the data or link info and try again</p>
            </div>}
        </div>

        {
    /* Footer */
  }
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <button
    onClick={onClose}
    className="rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
  >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            {testResult !== "success" ? <button
    onClick={handleTest}
    disabled={!allFilled || testing}
    className="flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-40"
  >
                {testing ? <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Testing...
                  </> : "Test Connection"}
              </button> : <button
    onClick={handleConnect}
    className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
  >
                <Check className="h-3 w-3" />
                Connected
              </button>}
          </div>
        </div>
      </div>
    </div>;
}
function ActiveToolGrid({
  tools,
  onClickTool
}) {
  const grouped = {};
  tools.forEach((t) => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });
  const categoryOrder = ["developer", "marketing", "creative", "communication", "productivity", "system"];
  return <div className="space-y-3">
      {categoryOrder.map((cat) => {
    const items = grouped[cat];
    if (!items || items.length === 0) return null;
    return <div key={cat}>
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{categoryLabels[cat]}</p>
            <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {items.map((tool) => <button
      key={tool.id}
      onClick={() => onClickTool(tool)}
      className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-left transition-all hover:border-accent/40 hover:bg-muted/50"
    >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                    <ToolLogo src={tool.logo} name={tool.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-xs font-semibold text-card-foreground">{tool.name}</p>
                      {tool.category === "system" && <Badge variant="outline" className="text-[8px] py-0 px-1">System</Badge>}
                    </div>
                    <p className="truncate text-[10px] text-muted-foreground">{tool.description}</p>
                  </div>
                  {tool.requiresSetup && tool.status === "active" && <StatusDot status="active" />}
                </button>)}
            </div>
          </div>;
  })}
    </div>;
}
function AvailableToolList({
  tools,
  search,
  onSearch,
  onConnect,
  connectedIds
}) {
  const filtered = tools.filter(
    (t) => t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = {};
  filtered.forEach((t) => {
    if (!grouped[t.category]) grouped[t.category] = [];
    grouped[t.category].push(t);
  });
  const categoryOrder = ["communication", "creative", "marketing", "productivity", "developer", "system"];
  return <div>
      {
    /* Search */
  }
      <div className="relative mb-3">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
    type="text"
    value={search}
    onChange={(e) => onSearch(e.target.value)}
    placeholder="Search tools..."
    className="w-full rounded-lg border border-input bg-background py-2 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-accent/50"
  />
      </div>

      {
    /* Categorized list */
  }
      <div className="space-y-3">
        {categoryOrder.map((cat) => {
    const items = grouped[cat];
    if (!items || items.length === 0) return null;
    return <div key={cat}>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{categoryLabels[cat]}</p>
              <div className="space-y-1">
                {items.map((tool) => {
      const isConnected = connectedIds.has(tool.id);
      return <div key={tool.id} className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted">
                        <ToolLogo src={tool.logo} name={tool.name} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-xs font-semibold text-card-foreground">{tool.name}</p>
                          {tool.requiresSetup && !isConnected && <Badge variant="outline" className="text-[8px] py-0 px-1 border-amber-300 text-amber-600">Requires Setup</Badge>}
                        </div>
                        <p className="truncate text-[10px] text-muted-foreground">{tool.description}</p>
                      </div>
                      {isConnected ? <span className="flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                          <Check className="h-3 w-3" />
                          Connected
                        </span> : <button
        onClick={() => onConnect(tool)}
        className="rounded-md bg-accent px-2.5 py-1 text-[10px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
      >
                          + Connect
                        </button>}
                    </div>;
    })}
              </div>
            </div>;
  })}
        {filtered.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No matching tools found</p>}
      </div>
    </div>;
}
const modelOptions = [
  { value: "deepseek-chat", label: "DeepSeek V3", desc: "Best value — fast & capable" },
  { value: "deepseek-reasoner", label: "DeepSeek R1", desc: "Advanced reasoning" },
  { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", desc: "Balanced performance" },
  { value: "claude-opus-4-6", label: "Claude Opus 4.6", desc: "Best for creative & complex tasks" },
  { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)", desc: "Fast open-source via Groq" },
  { value: "gpt-4o", label: "GPT-4o", desc: "OpenAI reasoning & code" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Fast & cost-efficient" },
];
const rolePresets = [
  "CTO",
  "CMO",
  "Social Media",
  "Customer Service",
  "Lead Gen",
  "Video Creator",
  "WordPress Specialist",
  "Shopify Expert",
  "SEO Analyst",
  "Content Writer",
  "Data Analyst",
  "DevOps Engineer"
];
const guardrailDefaults = [
  { id: "page-edits", label: "Allow Page Edits", default: false },
  { id: "image-swaps", label: "Allow Image Swaps", default: false },
  { id: "human-approval", label: "Require Human Approval", default: true },
  { id: "data-access", label: "Allow Database Queries", default: false },
  { id: "external-api", label: "Allow External API Calls", default: false }
];
function CreateAgentModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    role: "",
    model: "deepseek-chat",
    creativity: 30,
    systemPrompt: { identity: "", tone: "", rules: "" },
    websiteUrl: "",
    websiteStatus: "idle",
    guardrails: Object.fromEntries(guardrailDefaults.map((g) => [g.id, g.default])),
    avatarPreview: null
  });
  const [step, setStep] = useState("config");
  const [expandedPromptSections, setExpandedPromptSections] = useState({
    identity: true,
    tone: false,
    rules: false
  });
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const fileInputRef = useRef(null);
  function togglePromptSection(key) {
    setExpandedPromptSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }
  function handleAuthorize() {
    setForm((prev) => ({ ...prev, websiteStatus: "testing" }));
    setTimeout(() => {
      if (form.websiteUrl.trim().length > 5) {
        setForm((prev) => ({ ...prev, websiteStatus: "active" }));
      } else {
        setForm((prev) => ({ ...prev, websiteStatus: "error" }));
      }
    }, 2200);
  }
  function handleAvatarUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setForm((prev) => ({ ...prev, avatarPreview: url }));
    }
  }
  function handleCreate() {
    const newAgent = {
      id: `agent-${Date.now()}`,
      name: form.name || "New Agent",
      avatar: form.avatarPreview || "",
      role: form.role || "Agent",
      status: "idle",
      expertise: form.systemPrompt.identity || void 0,
      profileNotes: form.systemPrompt.tone || void 0
    };
    onCreate(newAgent);
    onClose();
  }
  const canCreate = form.name.trim().length > 0 && form.role.trim().length > 0;
  return <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 pt-8 sm:pt-12" onClick={onClose}>
      <div className="relative w-full max-w-3xl rounded-xl border border-border bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {
    /* ---- Top Identity Header ---- */
  }
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex items-start gap-4">
            {
    /* Avatar slot */
  }
            <button
    onClick={() => fileInputRef.current?.click()}
    className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition-colors hover:border-accent/50"
  >
              {form.avatarPreview ? <img src={form.avatarPreview} alt="Avatar" className="h-full w-full object-cover" /> : <Upload className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-accent" />}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </button>

            <div className="min-w-0 flex-1 space-y-2">
              <input
    value={form.name}
    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
    placeholder="Agent Name"
    className="w-full bg-transparent text-lg font-bold text-card-foreground placeholder:text-muted-foreground/40 outline-none sm:text-xl"
  />
              <div className="relative">
                <button
    onClick={() => setShowRoleDropdown((v) => !v)}
    className="flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs text-card-foreground transition-colors hover:bg-muted"
  >
                  {form.role || "Select Role..."}
                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                </button>
                {showRoleDropdown && <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowRoleDropdown(false)} />
                    <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-56 overflow-y-auto rounded-lg border border-border bg-card py-1 shadow-lg">
                      {rolePresets.map((r) => <button
    key={r}
    onClick={() => {
      setForm((prev) => ({ ...prev, role: r }));
      setShowRoleDropdown(false);
    }}
    className={cn(
      "block w-full px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted",
      form.role === r ? "font-semibold text-accent" : "text-card-foreground"
    )}
  >
                          {r}
                        </button>)}
                    </div>
                  </>}
              </div>
            </div>

            {
    /* Close + Launch */
  }
            <div className="flex items-center gap-2">
              {step === "config" ? <button
    onClick={handleCreate}
    disabled={!canCreate}
    className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
  >
                  Create Agent
                </button> : <button
    onClick={handleCreate}
    disabled={!canCreate}
    className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-40"
  >
                  Launch Agent
                </button>}
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {
    /* Step tabs */
  }
          <div className="mt-4 flex gap-4 border-t border-border/50 pt-3">
            <button
    onClick={() => setStep("config")}
    className={cn(
      "border-b-2 pb-2 text-xs font-semibold transition-colors",
      step === "config" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
    )}
  >
              Configuration
            </button>
            <button
    onClick={() => setStep("sandbox")}
    className={cn(
      "border-b-2 pb-2 text-xs font-semibold transition-colors",
      step === "sandbox" ? "border-accent text-accent" : "border-transparent text-muted-foreground hover:text-foreground"
    )}
  >
              Sandbox Preview
            </button>
          </div>
        </div>

        {
    /* ---- Configuration Panel ---- */
  }
        {step === "config" && <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">

            {
    /* Left Column: The Brain */
  }
            <div className="space-y-4">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <SlidersHorizontal className="h-3 w-3" />
                Configuration
              </h3>

              {
    /* Model selection */
  }
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">Model</label>
                <div className="space-y-1">
                  {modelOptions.map((m) => <button
    key={m.value}
    onClick={() => setForm((prev) => ({ ...prev, model: m.value }))}
    className={cn(
      "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-all",
      form.model === m.value ? "border-accent bg-accent/5" : "border-border bg-card hover:border-accent/30"
    )}
  >
                      <div>
                        <p className={cn("text-xs font-semibold", form.model === m.value ? "text-accent" : "text-card-foreground")}>{m.label}</p>
                        <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                      </div>
                      {form.model === m.value && <Check className="h-3.5 w-3.5 text-accent" />}
                    </button>)}
                </div>
              </div>

              {
    /* Creativity slider */
  }
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-muted-foreground">Strictness vs. Creativity</label>
                  <span className="text-[10px] text-muted-foreground">{form.creativity}%</span>
                </div>
                <input
    type="range"
    min={0}
    max={100}
    value={form.creativity}
    onChange={(e) => setForm((prev) => ({ ...prev, creativity: Number(e.target.value) }))}
    className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-accent"
  />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[9px] text-muted-foreground">Precise</span>
                  <span className="text-[9px] text-muted-foreground">Creative</span>
                </div>
                {form.creativity < 40 && <p className="mt-1 text-[9px] text-accent">Recommended for specialists and code-heavy roles</p>}
              </div>

              {
    /* System prompt sections */
  }
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">System Prompt</label>
                <div className="space-y-1.5">
                  {[
    { key: "identity", label: "Identity", placeholder: "Who is this agent? What is their expertise and background..." },
    { key: "tone", label: "Tone", placeholder: "How should this agent communicate? Formal, casual, technical..." },
    { key: "rules", label: "Rules", placeholder: "What is this agent forbidden from doing? Boundaries and limits..." }
  ].map(({ key, label, placeholder }) => <div key={key} className="rounded-lg border border-border">
                      <button
    onClick={() => togglePromptSection(key)}
    className="flex w-full items-center justify-between px-3 py-2 text-left"
  >
                        <span className="text-[11px] font-semibold text-card-foreground">{label}</span>
                        {expandedPromptSections[key] ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
                      </button>
                      {expandedPromptSections[key] && <div className="border-t border-border px-3 py-2">
                          <textarea
    value={form.systemPrompt[key]}
    onChange={(e) => setForm((prev) => ({
      ...prev,
      systemPrompt: { ...prev.systemPrompt, [key]: e.target.value }
    }))}
    rows={3}
    placeholder={placeholder}
    className="w-full rounded-md bg-muted/30 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 outline-none"
  />
                        </div>}
                    </div>)}
                </div>
              </div>
            </div>

            {
    /* Right Column: Agent Handshake */
  }
            <div className="space-y-4">
              <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <Globe className="h-3 w-3" />
                Agent Handshake
              </h3>

              {
    /* Connection card */
  }
              <div className="rounded-lg border border-border bg-muted/20 p-4">
                <label className="mb-1.5 block text-[11px] font-semibold text-muted-foreground">Website URL</label>
                <div className="flex gap-2">
                  <input
    value={form.websiteUrl}
    onChange={(e) => setForm((prev) => ({ ...prev, websiteUrl: e.target.value, websiteStatus: "idle" }))}
    placeholder="https://client-site.com"
    className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-accent/50"
  />
                  <button
    onClick={handleAuthorize}
    disabled={!form.websiteUrl.trim() || form.websiteStatus === "testing"}
    className="shrink-0 rounded-lg bg-accent px-3 py-2 text-[11px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
  >
                    {form.websiteStatus === "testing" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Authorize"}
                  </button>
                </div>

                {
    /* Status indicator */
  }
                <div className="mt-3 flex items-center gap-2">
                  {form.websiteStatus === "idle" && <>
                      <span className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                      <span className="text-[10px] text-muted-foreground">Not connected</span>
                    </>}
                  {form.websiteStatus === "testing" && <>
                      <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
                      <span className="text-[10px] text-amber-600">Authorizing...</span>
                    </>}
                  {form.websiteStatus === "active" && <>
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-[10px] font-medium text-emerald-600">API Active</span>
                    </>}
                  {form.websiteStatus === "error" && <>
                      <span className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-[10px] font-medium text-destructive">Authorization failed -- check URL</span>
                    </>}
                </div>
              </div>

              {
    /* Guardrail checklist */
  }
              <div>
                <div className="mb-2 flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-accent" />
                  <label className="text-[11px] font-semibold text-muted-foreground">Guardrails</label>
                </div>
                <div className="space-y-1">
                  {guardrailDefaults.map((g) => <label
    key={g.id}
    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/30"
  >
                      <div
    onClick={() => setForm((prev) => ({
      ...prev,
      guardrails: { ...prev.guardrails, [g.id]: !prev.guardrails[g.id] }
    }))}
    className={cn(
      "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
      form.guardrails[g.id] ? "border-accent bg-accent" : "border-muted-foreground/30"
    )}
  >
                        {form.guardrails[g.id] && <Check className="h-2.5 w-2.5 text-accent-foreground" />}
                      </div>
                      <span className="text-xs text-card-foreground">{g.label}</span>
                      {g.id === "human-approval" && form.guardrails[g.id] && <Badge variant="outline" className="ml-auto text-[8px] border-amber-300 py-0 px-1 text-amber-600">Recommended</Badge>}
                    </label>)}
                </div>
              </div>
            </div>
          </div>}

        {
    /* ---- Sandbox Panel ---- */
  }
        {step === "sandbox" && <div className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {
    /* Left: Chat test */
  }
              <div className="rounded-lg border border-border">
                <div className="border-b border-border px-4 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Test Chat</p>
                </div>
                <div className="flex h-64 flex-col">
                  <div className="flex-1 overflow-y-auto p-3">
                    <div className="flex items-start gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        <Bot className="h-3 w-3 text-accent" />
                      </div>
                      <div className="rounded-lg bg-muted/50 px-3 py-2">
                        <p className="text-xs leading-relaxed text-card-foreground">
                          {form.name ? `Hi, I'm ${form.name}` : "Hi, I'm your new agent"}. {form.role ? `I'm configured as a ${form.role}.` : "I'm ready to be configured."} How can I help?
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-border p-2">
                    <div className="flex gap-2">
                      <input
    placeholder="Test a message..."
    className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none"
    disabled
  />
                      <button disabled className="rounded-lg bg-accent/50 px-3 py-1.5 text-[10px] font-semibold text-accent-foreground">
                        Send
                      </button>
                    </div>
                    <p className="mt-1.5 text-center text-[9px] text-muted-foreground">Sandbox testing available after launch</p>
                  </div>
                </div>
              </div>

              {
    /* Right: Ghost preview */
  }
              <div className="rounded-lg border border-border">
                <div className="border-b border-border px-4 py-2.5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Site Preview</p>
                </div>
                <div className="flex h-64 items-center justify-center bg-muted/20">
                  {form.websiteUrl && form.websiteStatus === "active" ? <div className="text-center">
                      <Globe className="mx-auto mb-2 h-8 w-8 text-accent/30" />
                      <p className="text-xs font-medium text-card-foreground">{form.websiteUrl}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground">Live preview loads after agent launch</p>
                    </div> : <div className="text-center">
                      <Globe className="mx-auto mb-2 h-8 w-8 text-muted-foreground/20" />
                      <p className="text-xs text-muted-foreground">Connect a website in Configuration to enable preview</p>
                    </div>}
                </div>
              </div>
            </div>
          </div>}
      </div>
    </div>;
}
export function AgentsView() {
  const [expandedAgentId, setExpandedAgentId] = useState(null);
  const [viewingTool, setViewingTool] = useState(null);
  const [connectingTool, setConnectingTool] = useState(null);
  const [connectedToolsByAgent, setConnectedToolsByAgent] = useState({});
  const [toolSearches, setToolSearches] = useState({});
  const [showCreateAgent, setShowCreateAgent] = useState(false);
  const [editingAgentId, setEditingAgentId] = useState(null);
  const [editExpertise, setEditExpertise] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [agentList, setAgentList] = useState(initialAgents);
  function toggleExpand(agentId) {
    setExpandedAgentId((prev) => prev === agentId ? null : agentId);
  }
  function startEditing(agent) {
    setEditingAgentId(agent.id);
    setEditExpertise(agent.expertise || "");
    setEditNotes(agent.profileNotes || "");
  }
  function saveEditing() {
    if (!editingAgentId) return;
    setAgentList(
      (prev) => prev.map(
        (a) => a.id === editingAgentId ? { ...a, expertise: editExpertise.trim() || void 0, profileNotes: editNotes.trim() || void 0 } : a
      )
    );
    setEditingAgentId(null);
  }
  function cancelEditing() {
    setEditingAgentId(null);
  }
  function handleCreateAgent(agent) {
    setAgentList((prev) => [...prev, agent]);
  }
  function handleToolConnected(agentId, toolId) {
    setConnectedToolsByAgent((prev) => {
      const next = { ...prev };
      if (!next[agentId]) next[agentId] = /* @__PURE__ */ new Set();
      next[agentId] = /* @__PURE__ */ new Set([...next[agentId], toolId]);
      return next;
    });
  }
  return <div className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {
    /* Header */
  }
        <div className="mb-6 pl-10 md:pl-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-accent" />
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">AI Agents</h1>
            </div>
            <button
    onClick={() => setShowCreateAgent(true)}
    className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90 sm:px-4"
  >
              <Plus className="h-3.5 w-3.5" />
              Create Agent
            </button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {agentList.length} agent{agentList.length !== 1 && "s"} in your workspace. Click to manage tools and profile.
          </p>
        </div>

        {
    /* Agent cards */
  }
        <div className="space-y-3">
          {agentList.map((agent) => {
    const isExpanded = expandedAgentId === agent.id;
    const isEditing = editingAgentId === agent.id;
    const toolSet = agentToolSets[agent.id];
    const activeCount = toolSet?.active.length || 0;
    const availableCount = toolSet?.available.length || 0;
    const connected = connectedToolsByAgent[agent.id] || /* @__PURE__ */ new Set();
    const toolSearch = toolSearches[agent.id] || "";
    return <div
      key={agent.id}
      className={cn(
        "overflow-hidden rounded-xl border transition-colors",
        isExpanded ? "border-accent/40 bg-card" : "border-border bg-card"
      )}
    >
                {
      /* Row header */
    }
                <button
      onClick={() => toggleExpand(agent.id)}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left sm:gap-4 sm:px-5"
    >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
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

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-card-foreground">{agent.name}</p>
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
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{agent.role}</p>
                  </div>

                  {
      /* Tool counts */
    }
                  <div className="hidden items-center gap-2 sm:flex">
                    <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1">
                      <Wrench className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {activeCount} active
                      </span>
                    </div>
                    {availableCount > 0 && <span className="text-[10px] text-muted-foreground">
                        {availableCount - connected.size} available
                      </span>}
                  </div>

                  {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>

                {
      /* Expanded content */
    }
                {isExpanded && toolSet && <div className="border-t border-border/50">
                    {
      /* Profile section */
    }
                    <div className="border-b border-border/50 bg-muted/20 px-4 py-4 sm:px-5">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 text-accent" />
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Profile</p>
                        </div>
                        {!isEditing && <button
      onClick={(e) => {
        e.stopPropagation();
        startEditing(agent);
      }}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>}
                      </div>

                      {isEditing ? <div className="space-y-2.5">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Expertise</label>
                            <textarea
      value={editExpertise}
      onChange={(e) => setEditExpertise(e.target.value)}
      rows={2}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-accent/50"
      placeholder="Areas of expertise..."
    />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Profile Notes</label>
                            <textarea
      value={editNotes}
      onChange={(e) => setEditNotes(e.target.value)}
      rows={3}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-accent/50"
      placeholder="Notes about this agent..."
    />
                          </div>
                          <div className="flex items-center gap-2">
                            <button
      onClick={saveEditing}
      className="rounded-md bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
    >
                              Save
                            </button>
                            <button
      onClick={cancelEditing}
      className="rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
    >
                              Cancel
                            </button>
                          </div>
                        </div> : <div className="grid gap-2.5 sm:grid-cols-2">
                          {agent.expertise && <div>
                              <p className="mb-0.5 text-[10px] font-medium text-muted-foreground">Expertise</p>
                              <p className="text-xs leading-relaxed text-card-foreground">{agent.expertise}</p>
                            </div>}
                          {agent.profileNotes && <div>
                              <p className="mb-0.5 text-[10px] font-medium text-muted-foreground">Notes</p>
                              <p className="text-xs leading-relaxed text-card-foreground">{agent.profileNotes}</p>
                            </div>}
                        </div>}
                    </div>

                    {
      /* Active Tools */
    }
                    <div className="border-b border-border/50 px-4 py-4 sm:px-5">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                          Active Tools
                        </p>
                        <span className="text-[10px] text-muted-foreground">{activeCount} tools</span>
                      </div>
                      <ActiveToolGrid
      tools={toolSet.active}
      onClickTool={(tool) => setViewingTool(tool)}
    />
                    </div>

                    {
      /* Available Tools */
    }
                    {toolSet.available.length > 0 && <div className="px-4 py-4 sm:px-5">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            Add Tools
                          </p>
                          <span className="text-[10px] text-muted-foreground">
                            {toolSet.available.length - connected.size} available
                          </span>
                        </div>
                        <AvailableToolList
      tools={toolSet.available}
      search={toolSearch}
      onSearch={(s) => setToolSearches((prev) => ({ ...prev, [agent.id]: s }))}
      onConnect={(tool) => setConnectingTool({ tool, agentId: agent.id })}
      connectedIds={connected}
    />
                      </div>}
                  </div>}
              </div>;
  })}
        </div>
      </div>

      {
    /* Tool info modal */
  }
      {viewingTool && <ToolInfoModal
    tool={viewingTool}
    onClose={() => setViewingTool(null)}
  />}

      {
    /* Connect modal */
  }
      {connectingTool && <ConnectModal
    tool={connectingTool.tool}
    onClose={() => setConnectingTool(null)}
    onConnected={(toolId) => handleToolConnected(connectingTool.agentId, toolId)}
  />}

      {
    /* Create Agent modal */
  }
      {showCreateAgent && <CreateAgentModal
    onClose={() => setShowCreateAgent(false)}
    onCreate={handleCreateAgent}
  />}
    </div>;
}
