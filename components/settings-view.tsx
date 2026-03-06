"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import {
  Bell,
  Building2,
  Check,
  CreditCard,
  Eye,
  EyeOff,
  Globe,
  Key,
  Loader2,
  Lock,
  Palette,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Upload,
  User,
  Users,
  X,
} from "lucide-react"

// ---- Types ----

interface TeamMember {
  id: string
  name: string
  email: string
  role: "admin" | "editor" | "viewer"
  avatar: string
}

interface IntegrationKey {
  id: string
  name: string
  logo: string
  value: string
  connected: boolean
}

// ---- Static Data ----

const settingsSections = [
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "account", label: "Account", icon: User },
  { id: "permissions", label: "Permissions", icon: Shield },
  { id: "agent-defaults", label: "Agent Defaults", icon: SlidersHorizontal },
  { id: "integrations", label: "Integrations", icon: Key },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "audit-log", label: "Audit Log", icon: ScrollText },
] as const

type SectionId = (typeof settingsSections)[number]["id"]

const initialTeam: TeamMember[] = [
  { id: "paul", name: "Paul", email: "paul@kickervideo.com", role: "admin", avatar: "/agents/paul.png" },
  { id: "inv-1", name: "Sarah Chen", email: "sarah@kickervideo.com", role: "editor", avatar: "" },
  { id: "inv-2", name: "Tom Broker", email: "tom@kickervideo.com", role: "viewer", avatar: "" },
]

const initialIntegrations: IntegrationKey[] = [
  { id: "openai", name: "OpenAI", logo: "https://cdn.simpleicons.org/openai/ffffff", value: "sk-...redacted", connected: true },
  { id: "anthropic", name: "Anthropic", logo: "https://cdn.simpleicons.org/anthropic/ffffff", value: "", connected: false },
  { id: "github", name: "GitHub", logo: "https://cdn.simpleicons.org/github/ffffff", value: "ghp_...redacted", connected: true },
  { id: "slack", name: "Slack", logo: "https://cdn.simpleicons.org/slack", value: "", connected: false },
  { id: "vercel", name: "Vercel", logo: "https://cdn.simpleicons.org/vercel/ffffff", value: "vrcl_...redacted", connected: true },
  { id: "supabase", name: "Supabase", logo: "https://cdn.simpleicons.org/supabase", value: "", connected: false },
  { id: "stripe", name: "Stripe", logo: "https://cdn.simpleicons.org/stripe", value: "", connected: false },
]

const auditEntries = [
  { id: "1", timestamp: "Feb 14, 2026 — 4:32 PM", user: "Paul", action: "Created agent Dave (CTO)", type: "agent" as const },
  { id: "2", timestamp: "Feb 14, 2026 — 3:18 PM", user: "Paul", action: "Updated project Sideline description", type: "project" as const },
  { id: "3", timestamp: "Feb 14, 2026 — 1:05 PM", user: "Dave (AI)", action: "Deployed staging environment via Vercel", type: "deploy" as const },
  { id: "4", timestamp: "Feb 13, 2026 — 11:40 AM", user: "Paul", action: "Connected GitHub integration", type: "integration" as const },
  { id: "5", timestamp: "Feb 13, 2026 — 10:15 AM", user: "Marnie (AI)", action: "Sent email campaign via Mailchimp", type: "agent" as const },
  { id: "6", timestamp: "Feb 12, 2026 — 5:55 PM", user: "Paul", action: "Invited Sarah Chen as editor", type: "team" as const },
  { id: "7", timestamp: "Feb 12, 2026 — 2:30 PM", user: "Luna (AI)", action: "Escalated ticket #482 to Paul", type: "agent" as const },
  { id: "8", timestamp: "Feb 11, 2026 — 9:00 AM", user: "Paul", action: "Updated billing plan to Pro", type: "billing" as const },
]

function IntegrationLogo({ src, name }: { src: string; name: string }) {
  const [err, setErr] = useState(false)
  if (err) {
    return (
      <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[9px] font-bold text-muted-foreground">
        {name[0]}
      </div>
    )
  }
  return <img src={src} alt={name} className="h-5 w-5 object-contain" onError={() => setErr(true)} />
}

// ---- Main Component ----

export function SettingsView() {
  const [activeSection, setActiveSection] = useState<SectionId>("workspace")

  // Workspace state
  const [companyName, setCompanyName] = useState("Kicker Video")
  const [companyUrl, setCompanyUrl] = useState("https://kickervideo.com")
  const [timezone, setTimezone] = useState("America/New_York")
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [companyLogo, setCompanyLogo] = useState<string | null>(null)

  // Account state
  const [userName, setUserName] = useState("Paul")
  const [userEmail, setUserEmail] = useState("paul@kickervideo.com")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [twoFactor, setTwoFactor] = useState(false)

  // Team state
  const [team, setTeam] = useState<TeamMember[]>(initialTeam)
  const [inviteEmail, setInviteEmail] = useState("")

  // Agent defaults
  const [defaultModel, setDefaultModel] = useState("gpt-4o")
  const [defaultCreativity, setDefaultCreativity] = useState(30)
  const [defaultHumanApproval, setDefaultHumanApproval] = useState(true)
  const [defaultPageEdits, setDefaultPageEdits] = useState(false)
  const [defaultExternalApi, setDefaultExternalApi] = useState(false)

  // Integrations
  const [integrations, setIntegrations] = useState<IntegrationKey[]>(initialIntegrations)
  const [editingIntegration, setEditingIntegration] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [showKeyFor, setShowKeyFor] = useState<string | null>(null)

  // Notifications
  const [notifAgentError, setNotifAgentError] = useState(true)
  const [notifTaskComplete, setNotifTaskComplete] = useState(true)
  const [notifEscalation, setNotifEscalation] = useState(true)
  const [notifDeploy, setNotifDeploy] = useState(false)
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(true)
  const [notifChannel, setNotifChannel] = useState<"email" | "slack" | "both">("email")

  // Billing
  const [plan] = useState<"free" | "pro" | "enterprise">("pro")

  // Save toast
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 800)
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setCompanyLogo(url)
    }
  }

  function inviteTeamMember() {
    if (!inviteEmail.trim()) return
    setTeam((prev) => [
      ...prev,
      { id: `inv-${Date.now()}`, name: inviteEmail.split("@")[0], email: inviteEmail, role: "viewer", avatar: "" },
    ])
    setInviteEmail("")
  }

  function saveIntegrationKey(id: string) {
    setIntegrations((prev) =>
      prev.map((i) =>
        i.id === id ? { ...i, value: editValue, connected: editValue.trim().length > 0 } : i
      )
    )
    setEditingIntegration(null)
    setEditValue("")
  }

  return (
    <main className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 pl-10 md:pl-0">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Settings</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Manage your workspace, account, and integrations.</p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Left Nav */}
          <nav className="shrink-0 md:w-48">
            <div className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
              {settingsSections.map((section) => {
                const isActive = activeSection === section.id
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
                      isActive
                        ? "bg-accent/10 text-accent"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </button>
                )
              })}
            </div>
          </nav>

          {/* Right Content */}
          <div className="min-w-0 flex-1">
            <div className="rounded-xl border border-border bg-card">

              {/* ---- WORKSPACE ---- */}
              {activeSection === "workspace" && (
                <div className="p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-card-foreground">Workspace</h2>
                  <div className="space-y-5">
                    {/* Company Logo */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Company Logo</label>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => logoInputRef.current?.click()}
                          className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition-colors hover:border-accent/50"
                        >
                          {companyLogo ? (
                            <img src={companyLogo} alt="Logo" className="h-full w-full object-cover" />
                          ) : (
                            <Upload className="h-5 w-5 text-muted-foreground group-hover:text-accent" />
                          )}
                          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </button>
                        <p className="text-[11px] text-muted-foreground">Upload a square logo (at least 128x128px). PNG or SVG recommended.</p>
                      </div>
                    </div>
                    {/* Company Name */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Company Name</label>
                      <input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50 sm:max-w-sm"
                      />
                    </div>
                    {/* Company URL */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Website URL</label>
                      <input
                        value={companyUrl}
                        onChange={(e) => setCompanyUrl(e.target.value)}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50 sm:max-w-sm"
                      />
                    </div>
                    {/* Timezone */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                      >
                        <option value="America/New_York">Eastern Time (ET)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Berlin">Berlin (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                      </select>
                    </div>
                    <button onClick={handleSave} className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? "Saved" : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {/* ---- ACCOUNT ---- */}
              {activeSection === "account" && (
                <div className="p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-card-foreground">Account</h2>
                  <div className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Display Name</label>
                        <input
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      </div>
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Email</label>
                        <input
                          value={userEmail}
                          onChange={(e) => setUserEmail(e.target.value)}
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                        />
                      </div>
                    </div>
                    {/* Password */}
                    <div className="rounded-lg border border-border p-4">
                      <h3 className="mb-3 flex items-center gap-1.5 text-xs font-bold text-card-foreground">
                        <Lock className="h-3.5 w-3.5" /> Change Password
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">Current Password</label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              value={currentPassword}
                              onChange={(e) => setCurrentPassword(e.target.value)}
                              className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-9 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                            />
                            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">New Password</label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50"
                          />
                        </div>
                      </div>
                    </div>
                    {/* 2FA */}
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3">
                      <div
                        onClick={() => setTwoFactor(!twoFactor)}
                        className={cn(
                          "flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
                          twoFactor ? "border-accent bg-accent" : "border-muted-foreground/30"
                        )}
                      >
                        {twoFactor && <Check className="h-3 w-3 text-accent-foreground" />}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-card-foreground">Two-Factor Authentication</p>
                        <p className="text-[11px] text-muted-foreground">Add an extra layer of security to your account</p>
                      </div>
                    </label>
                    <button onClick={handleSave} className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? "Saved" : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}

              {/* ---- PERMISSIONS ---- */}
              {activeSection === "permissions" && (
                <div className="p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-card-foreground">Team Permissions</h2>
                  <div className="space-y-4">
                    {/* Invite */}
                    <div className="flex gap-2">
                      <input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Invite by email..."
                        className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-accent/50"
                        onKeyDown={(e) => e.key === "Enter" && inviteTeamMember()}
                      />
                      <button onClick={inviteTeamMember} className="shrink-0 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground hover:bg-accent/90">
                        Invite
                      </button>
                    </div>
                    {/* Team list */}
                    <div className="space-y-1">
                      {team.map((member) => (
                        <div key={member.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                            {member.avatar ? (
                              <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-muted-foreground">{member.name[0].toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-card-foreground">{member.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{member.email}</p>
                          </div>
                          <select
                            value={member.role}
                            onChange={(e) =>
                              setTeam((prev) =>
                                prev.map((m) =>
                                  m.id === member.id ? { ...m, role: e.target.value as TeamMember["role"] } : m
                                )
                              )
                            }
                            className="rounded-md border border-input bg-background px-2 py-1 text-[11px] text-foreground outline-none"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          {member.id !== "paul" && (
                            <button
                              onClick={() => setTeam((prev) => prev.filter((m) => m.id !== member.id))}
                              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ---- AGENT DEFAULTS ---- */}
              {activeSection === "agent-defaults" && (
                <div className="p-5 sm:p-6">
                  <h2 className="mb-1 text-base font-bold text-card-foreground">Agent Defaults</h2>
                  <p className="mb-5 text-xs text-muted-foreground">These defaults apply when creating new agents.</p>
                  <div className="space-y-5">
                    {/* Default model */}
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Default Model</label>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {[
                          { value: "gpt-4o", label: "GPT-4o", desc: "Best for reasoning & code" },
                          { value: "gpt-4o-mini", label: "GPT-4o Mini", desc: "Fast & cost-efficient" },
                          { value: "claude-opus-4.5", label: "Claude Opus 4.5", desc: "Best for creative writing" },
                          { value: "claude-sonnet-4", label: "Claude Sonnet 4", desc: "Balanced performance" },
                        ].map((m) => (
                          <button
                            key={m.value}
                            onClick={() => setDefaultModel(m.value)}
                            className={cn(
                              "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all",
                              defaultModel === m.value
                                ? "border-accent bg-accent/5"
                                : "border-border hover:border-accent/30"
                            )}
                          >
                            <div>
                              <p className={cn("text-xs font-semibold", defaultModel === m.value ? "text-accent" : "text-card-foreground")}>{m.label}</p>
                              <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                            </div>
                            {defaultModel === m.value && <Check className="h-3.5 w-3.5 text-accent" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Default creativity */}
                    <div>
                      <div className="mb-1.5 flex items-center justify-between">
                        <label className="text-xs font-semibold text-muted-foreground">Default Creativity</label>
                        <span className="text-[10px] text-muted-foreground">{defaultCreativity}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={defaultCreativity}
                        onChange={(e) => setDefaultCreativity(Number(e.target.value))}
                        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-accent sm:max-w-sm"
                      />
                      <div className="mt-1 flex items-center justify-between sm:max-w-sm">
                        <span className="text-[9px] text-muted-foreground">Precise</span>
                        <span className="text-[9px] text-muted-foreground">Creative</span>
                      </div>
                    </div>
                    {/* Default guardrails */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-muted-foreground">Default Guardrails</label>
                      <div className="space-y-1">
                        {[
                          { state: defaultHumanApproval, set: setDefaultHumanApproval, label: "Require Human Approval", rec: true },
                          { state: defaultPageEdits, set: setDefaultPageEdits, label: "Allow Page Edits", rec: false },
                          { state: defaultExternalApi, set: setDefaultExternalApi, label: "Allow External API Calls", rec: false },
                        ].map(({ state, set, label, rec }) => (
                          <label key={label} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/30">
                            <div
                              onClick={() => set(!state)}
                              className={cn(
                                "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
                                state ? "border-accent bg-accent" : "border-muted-foreground/30"
                              )}
                            >
                              {state && <Check className="h-2.5 w-2.5 text-accent-foreground" />}
                            </div>
                            <span className="text-xs text-card-foreground">{label}</span>
                            {rec && state && (
                              <span className="ml-auto rounded-full border border-amber-300 px-1.5 py-0.5 text-[8px] font-medium text-amber-600">Recommended</span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleSave} className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? "Saved" : "Save Defaults"}
                    </button>
                  </div>
                </div>
              )}

              {/* ---- INTEGRATIONS ---- */}
              {activeSection === "integrations" && (
                <div className="p-5 sm:p-6">
                  <h2 className="mb-1 text-base font-bold text-card-foreground">Global Integrations</h2>
                  <p className="mb-5 text-xs text-muted-foreground">API keys stored here are shared across all agents. Agent-specific keys override these.</p>
                  <div className="space-y-2">
                    {integrations.map((integration) => {
                      const isEditing = editingIntegration === integration.id
                      return (
                        <div key={integration.id} className={cn("rounded-lg border px-4 py-3 transition-all", integration.connected ? "border-emerald-500/30 bg-emerald-500/5" : "border-border")}>
                          <div className="flex items-center gap-3">
                            <IntegrationLogo src={integration.logo} name={integration.name} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-xs font-semibold text-card-foreground">{integration.name}</p>
                                {integration.connected && (
                                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600">
                                    <span className="h-1 w-1 rounded-full bg-emerald-500" />
                                    Connected
                                  </span>
                                )}
                              </div>
                              {integration.connected && !isEditing && (
                                <div className="mt-0.5 flex items-center gap-1">
                                  <p className="font-mono text-[10px] text-muted-foreground">
                                    {showKeyFor === integration.id ? integration.value : "••••••••••••"}
                                  </p>
                                  <button onClick={() => setShowKeyFor(showKeyFor === integration.id ? null : integration.id)} className="text-muted-foreground">
                                    {showKeyFor === integration.id ? <EyeOff className="h-2.5 w-2.5" /> : <Eye className="h-2.5 w-2.5" />}
                                  </button>
                                </div>
                              )}
                            </div>
                            {!isEditing && (
                              <button
                                onClick={() => { setEditingIntegration(integration.id); setEditValue(integration.connected ? integration.value : "") }}
                                className={cn(
                                  "shrink-0 rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors",
                                  integration.connected
                                    ? "border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                                    : "bg-accent text-accent-foreground hover:bg-accent/90"
                                )}
                              >
                                {integration.connected ? "Edit" : "Connect"}
                              </button>
                            )}
                          </div>
                          {isEditing && (
                            <div className="mt-3 flex gap-2 border-t border-border/50 pt-3">
                              <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                placeholder="Paste API key..."
                                className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground/50 outline-none focus:ring-2 focus:ring-accent/50"
                                autoFocus
                                onKeyDown={(e) => e.key === "Enter" && saveIntegrationKey(integration.id)}
                              />
                              <button onClick={() => saveIntegrationKey(integration.id)} className="rounded-md bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground hover:bg-accent/90">
                                Save
                              </button>
                              <button onClick={() => { setEditingIntegration(null); setEditValue("") }} className="rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted">
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* ---- NOTIFICATIONS ---- */}
              {activeSection === "notifications" && (
                <div className="p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-card-foreground">Notifications</h2>
                  <div className="space-y-5">
                    {/* Channel */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-muted-foreground">Delivery Channel</label>
                      <div className="flex gap-2">
                        {(["email", "slack", "both"] as const).map((ch) => (
                          <button
                            key={ch}
                            onClick={() => setNotifChannel(ch)}
                            className={cn(
                              "rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors",
                              notifChannel === ch
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-muted-foreground hover:border-accent/30"
                            )}
                          >
                            {ch}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Toggles */}
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-muted-foreground">Alert Types</label>
                      <div className="space-y-1">
                        {[
                          { state: notifAgentError, set: setNotifAgentError, label: "Agent errors & failures", desc: "Get alerted when an agent encounters an error" },
                          { state: notifTaskComplete, set: setNotifTaskComplete, label: "Task completions", desc: "Notify when agents finish assigned tasks" },
                          { state: notifEscalation, set: setNotifEscalation, label: "Escalations", desc: "Alert when an agent escalates to a human" },
                          { state: notifDeploy, set: setNotifDeploy, label: "Deployments", desc: "Notify on successful or failed deploys" },
                          { state: notifWeeklyDigest, set: setNotifWeeklyDigest, label: "Weekly digest", desc: "Summary of agent activity and metrics" },
                        ].map(({ state, set, label, desc }) => (
                          <label key={label} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/30">
                            <div
                              onClick={() => set(!state)}
                              className={cn(
                                "flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors",
                                state ? "border-accent bg-accent" : "border-muted-foreground/30"
                              )}
                            >
                              {state && <Check className="h-2.5 w-2.5 text-accent-foreground" />}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-card-foreground">{label}</p>
                              <p className="text-[11px] text-muted-foreground">{desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                    <button onClick={handleSave} className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? "Saved" : "Save Preferences"}
                    </button>
                  </div>
                </div>
              )}

              {/* ---- BILLING ---- */}
              {activeSection === "billing" && (
                <div className="p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-card-foreground">Billing</h2>
                  <div className="space-y-5">
                    {/* Current plan */}
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(["free", "pro", "enterprise"] as const).map((p) => (
                        <div
                          key={p}
                          className={cn(
                            "rounded-lg border p-4 text-center transition-all",
                            plan === p ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border"
                          )}
                        >
                          <p className={cn("text-sm font-bold capitalize", plan === p ? "text-accent" : "text-card-foreground")}>{p}</p>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {p === "free" && "$0/mo - 3 agents"}
                            {p === "pro" && "$49/mo - 10 agents"}
                            {p === "enterprise" && "Custom pricing"}
                          </p>
                          {plan === p && (
                            <span className="mt-2 inline-block rounded-full bg-accent/10 px-2 py-0.5 text-[9px] font-semibold text-accent">Current Plan</span>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Usage */}
                    <div className="rounded-lg border border-border p-4">
                      <h3 className="mb-3 text-xs font-bold text-card-foreground">Usage This Month</h3>
                      <div className="space-y-3">
                        {[
                          { label: "API Tokens", used: 842000, total: 1000000, format: (n: number) => `${(n / 1000).toFixed(0)}K` },
                          { label: "Agents", used: 4, total: 10, format: (n: number) => String(n) },
                          { label: "Deployments", used: 23, total: 100, format: (n: number) => String(n) },
                        ].map(({ label, used, total, format }) => (
                          <div key={label}>
                            <div className="mb-1 flex items-center justify-between">
                              <p className="text-[11px] font-medium text-card-foreground">{label}</p>
                              <p className="text-[10px] text-muted-foreground">{format(used)} / {format(total)}</p>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className={cn("h-full rounded-full transition-all", used / total > 0.8 ? "bg-amber-500" : "bg-accent")}
                                style={{ width: `${(used / total) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ---- AUDIT LOG ---- */}
              {activeSection === "audit-log" && (
                <div className="p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-card-foreground">Audit Log</h2>
                  <div className="space-y-1">
                    {auditEntries.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
                        <div className={cn(
                          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                          entry.type === "agent" && "bg-accent/10 text-accent",
                          entry.type === "project" && "bg-blue-500/10 text-blue-500",
                          entry.type === "deploy" && "bg-emerald-500/10 text-emerald-500",
                          entry.type === "integration" && "bg-purple-500/10 text-purple-500",
                          entry.type === "team" && "bg-pink-500/10 text-pink-500",
                          entry.type === "billing" && "bg-amber-500/10 text-amber-500",
                        )}>
                          {entry.type === "agent" && <SlidersHorizontal className="h-3 w-3" />}
                          {entry.type === "project" && <Palette className="h-3 w-3" />}
                          {entry.type === "deploy" && <Globe className="h-3 w-3" />}
                          {entry.type === "integration" && <Key className="h-3 w-3" />}
                          {entry.type === "team" && <Users className="h-3 w-3" />}
                          {entry.type === "billing" && <CreditCard className="h-3 w-3" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-card-foreground">
                            <span className="font-semibold">{entry.user}</span>{" "}
                            <span className="text-muted-foreground">--</span>{" "}
                            {entry.action}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{entry.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
