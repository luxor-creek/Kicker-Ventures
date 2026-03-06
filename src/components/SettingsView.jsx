import { useState, useRef, useEffect } from "react";
import { cn } from "../lib/utils";
import {
  Bell,
  Building2,
  Check,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  Globe,
  Key,
  Loader2,
  Lock,
  MessageSquare,
  Palette,
  Plus,
  ScrollText,
  Settings,
  Shield,
  SlidersHorizontal,
  Upload,
  User,
  Users,
  X
} from "lucide-react";
const settingsSections = [
  { id: "workspace", label: "Workspace", icon: Building2 },
  { id: "account", label: "Account", icon: User },
  { id: "permissions", label: "Permissions", icon: Shield },
  { id: "agent-defaults", label: "Agent Defaults", icon: SlidersHorizontal },
  { id: "integrations", label: "Integrations", icon: Key },
  { id: "chat-widgets", label: "Chat Widgets", icon: MessageSquare },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "audit-log", label: "Audit Log", icon: ScrollText }
];
const initialTeam = [
  { id: "paul", name: "Paul", email: "paul@kickervideo.com", role: "admin", avatar: "/agents/paul.png" },
  { id: "inv-1", name: "Sarah Chen", email: "sarah@kickervideo.com", role: "editor", avatar: "" },
  { id: "inv-2", name: "Tom Broker", email: "tom@kickervideo.com", role: "viewer", avatar: "" }
];
const initialIntegrations = [];
const auditEntries = [
  { id: "1", timestamp: "Feb 14, 2026 \u2014 4:32 PM", user: "Paul", action: "Created agent Dave (CTO)", type: "agent" },
  { id: "2", timestamp: "Feb 14, 2026 \u2014 3:18 PM", user: "Paul", action: "Updated project Sideline description", type: "project" },
  { id: "3", timestamp: "Feb 14, 2026 \u2014 1:05 PM", user: "Dave (AI)", action: "Deployed staging environment via Vercel", type: "deploy" },
  { id: "4", timestamp: "Feb 13, 2026 \u2014 11:40 AM", user: "Paul", action: "Connected GitHub integration", type: "integration" },
  { id: "5", timestamp: "Feb 13, 2026 \u2014 10:15 AM", user: "Marnie (AI)", action: "Sent email campaign via Mailchimp", type: "agent" },
  { id: "6", timestamp: "Feb 12, 2026 \u2014 5:55 PM", user: "Paul", action: "Invited Sarah Chen as editor", type: "team" },
  { id: "7", timestamp: "Feb 12, 2026 \u2014 2:30 PM", user: "Luna (AI)", action: "Escalated ticket #482 to Paul", type: "agent" },
  { id: "8", timestamp: "Feb 11, 2026 \u2014 9:00 AM", user: "Paul", action: "Updated billing plan to Pro", type: "billing" }
];
function IntegrationLogo({ src, name }) {
  const [err, setErr] = useState(false);
  if (err) {
    return <div className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[9px] font-bold text-muted-foreground">
        {name[0]}
      </div>;
  }
  return <img src={src} alt={name} className="h-5 w-5 object-contain" onError={() => setErr(true)} />;
}
export function SettingsView() {
  const [activeSection, setActiveSection] = useState("workspace");
  const [companyName, setCompanyName] = useState("Kicker Video");
  const [companyUrl, setCompanyUrl] = useState("https://kickervideo.com");
  const [timezone, setTimezone] = useState("America/New_York");
  const logoInputRef = useRef(null);
  const [companyLogo, setCompanyLogo] = useState(null);
  const [userName, setUserName] = useState("Paul");
  const [userEmail, setUserEmail] = useState("paul@kickervideo.com");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [team, setTeam] = useState(initialTeam);
  const [inviteEmail, setInviteEmail] = useState("");
  const [defaultModel, setDefaultModel] = useState("deepseek-chat");
  const [defaultCreativity, setDefaultCreativity] = useState(30);
  const [defaultHumanApproval, setDefaultHumanApproval] = useState(true);
  const [defaultPageEdits, setDefaultPageEdits] = useState(false);
  const [defaultExternalApi, setDefaultExternalApi] = useState(false);
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [showKeyFor, setShowKeyFor] = useState(null);
  // Add new integration form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIntName, setNewIntName] = useState("");
  const [newIntDesc, setNewIntDesc] = useState("");
  const [newIntCategory, setNewIntCategory] = useState("custom");
  const [newIntEnvKey, setNewIntEnvKey] = useState("");
  const [newIntApiKey, setNewIntApiKey] = useState("");
  const [newIntBaseUrl, setNewIntBaseUrl] = useState("");
  const [testResult, setTestResult] = useState(null); // { success, error, duration_ms }
  const [testing, setTesting] = useState(false);
  const [savingInt, setSavingInt] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackSaving, setSlackSaving] = useState(false);
  const [slackSaved, setSlackSaved] = useState(false);
  const [slackTesting, setSlackTesting] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState(null);
  const [togglingSlug, setTogglingSlug] = useState(null);
  // Merge system integrations (from edge func) with user overrides (from DB)
  const [userOverrides, setUserOverrides] = useState({});
  const [notifAgentError, setNotifAgentError] = useState(true);
  const [notifTaskComplete, setNotifTaskComplete] = useState(true);
  const [notifEscalation, setNotifEscalation] = useState(true);
  const [notifDeploy, setNotifDeploy] = useState(false);
  const [notifWeeklyDigest, setNotifWeeklyDigest] = useState(true);
  const [notifChannel, setNotifChannel] = useState("browser");
  const [plan] = useState("pro");
  const [billingData, setBillingData] = useState({ tokens: 0, agents: 0, messages: 0 });
  // Chat widgets
  const [widgets, setWidgets] = useState([]);
  const [widgetsLoading, setWidgetsLoading] = useState(false);
  const [showWidgetForm, setShowWidgetForm] = useState(false);
  const [editingWidget, setEditingWidget] = useState(null);
  const [wName, setWName] = useState("");
  const [wAgentName, setWAgentName] = useState("Luna");
  const [wCompany, setWCompany] = useState("");
  const [wSiteUrl, setWSiteUrl] = useState("");
  const [wAvatarUrl, setWAvatarUrl] = useState("");
  const [wPrompt, setWPrompt] = useState("");
  const [wWelcome, setWWelcome] = useState("Hi! How can I help you today?");
  const [wColor, setWColor] = useState("#6366f1");
  const [wModel, setWModel] = useState("deepseek");
  const [wRequireEmail, setWRequireEmail] = useState(false);
  const [wKnowledge, setWKnowledge] = useState("");
  const [wFaqQ, setWFaqQ] = useState("");
  const [wFaqA, setWFaqA] = useState("");
  const [wFaqs, setWFaqs] = useState([]);
  const [savingWidget, setSavingWidget] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  async function handleSave() {
    setSaving(true);
    try {
      const token = getAuthToken();
      if (token) {
        // Save guardrails to all agents
        const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_agents?select=id`, {
          headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL },
        });
        if (res.ok) {
          // Update all agents with default guardrails
          await fetch(`${SUPABASE_URL}/rest/v1/ai_agents`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
            body: JSON.stringify({
              require_approval: defaultHumanApproval,
              allow_page_edits: defaultPageEdits,
              allow_external_apis: defaultExternalApi,
            }),
          });
        }
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2e3);
    } catch (err) { console.error("Save failed:", err); }
    setSaving(false);
  }
  function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCompanyLogo(url);
    }
  }
  function inviteTeamMember() {
    if (!inviteEmail.trim()) return;
    setTeam((prev) => [
      ...prev,
      { id: `inv-${Date.now()}`, name: inviteEmail.split("@")[0], email: inviteEmail, role: "viewer", avatar: "" }
    ]);
    setInviteEmail("");
  }
  function saveIntegrationKey(id) {
    setIntegrations(
      (prev) => prev.map(
        (i) => i.id === id ? { ...i, value: editValue, connected: editValue.trim().length > 0 } : i
      )
    );
    setEditingIntegration(null);
    setEditValue("");
  }

  async function testIntegration(slug, apiKey, baseUrl) {
    setTesting(true);
    setTestResult(null);
    try {
      const token = getAuthToken();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-integrations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "test", slug, api_key: apiKey, base_url: baseUrl }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) { setTestResult({ success: false, error: err.message }); }
    setTesting(false);
  }

  async function saveNewIntegration() {
    setSavingInt(true);
    try {
      const token = getAuthToken();
      const slug = newIntName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-integrations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL, "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save", slug, name: newIntName, description: newIntDesc, category: newIntCategory,
          env_key: newIntEnvKey || `${newIntName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY`,
          api_key: newIntApiKey, base_url: newIntBaseUrl,
        }),
      });
      if (res.ok) {
        // Reset form and refresh
        setShowAddForm(false);
        setNewIntName(""); setNewIntDesc(""); setNewIntCategory("custom"); setNewIntEnvKey(""); setNewIntApiKey(""); setNewIntBaseUrl(""); setTestResult(null);
        // Trigger re-fetch
        setIntegrationsLoading(true);
        setTimeout(() => { setActiveSection(""); requestAnimationFrame(() => setActiveSection("integrations")); }, 100);
      }
    } catch (err) { console.error("Save integration failed:", err); }
    setSavingInt(false);
  }

  async function toggleIntegration(integration) {
    setTogglingSlug(integration.id);
    try {
      const token = getAuthToken();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/manage-integrations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", slug: integration.id, name: integration.name, env_key: integration.key_name }),
      });
      if (res.ok) {
        const data = await res.json();
        setIntegrations(prev => prev.map(i => i.id === integration.id ? { ...i, is_enabled: data.is_enabled } : i));
      }
    } catch (err) { console.error("Toggle failed:", err); }
    setTogglingSlug(null);
  }

  // Fetch live integration status from edge function
  const SUPABASE_URL = "https://mzqjivtidadjaawmlslz.supabase.co";
  const SUPABASE_ANON_KEY_BILL = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cWppdnRpZGFkamFhd21sc2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTYxMDUsImV4cCI6MjA4NjU3MjEwNX0.o9WeG3HCDvPQ6SIv_EuzxR44VTZiMPfbUG3r7Ar8WD4";

  function getAuthToken() {
    try {
      const raw = localStorage.getItem("sb-mzqjivtidadjaawmlslz-auth-token");
      if (!raw) return null;
      return JSON.parse(raw)?.access_token || null;
    } catch { return null; }
  }

  // Load guardrails from first agent (they're synced across all agents via handleSave)
  useEffect(() => {
    async function loadGuardrails() {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_agents?select=require_approval,allow_page_edits,allow_external_apis&limit=1`, {
          headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL },
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows?.length > 0) {
            setDefaultHumanApproval(rows[0].require_approval ?? true);
            setDefaultPageEdits(rows[0].allow_page_edits ?? false);
            setDefaultExternalApi(rows[0].allow_external_apis ?? false);
          }
        }
      } catch (err) { console.error("Load guardrails failed:", err); }
    }
    loadGuardrails();
  }, []);

  // Load Slack settings
  useEffect(() => {
    async function loadSlack() {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/user_integration_settings?integration_id=eq.slack&select=settings,is_active`, {
          headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL },
        });
        if (res.ok) {
          const rows = await res.json();
          if (rows?.length > 0) {
            setSlackWebhook(rows[0].settings?.webhook_url || "");
            setSlackEnabled(rows[0].is_active ?? false);
          }
        }
      } catch (err) { console.error("Load Slack settings failed:", err); }
    }
    loadSlack();
  }, []);

  async function saveSlackSettings() {
    setSlackSaving(true);
    try {
      const token = getAuthToken();
      if (!token) return;
      // Upsert
      await fetch(`${SUPABASE_URL}/rest/v1/user_integration_settings`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
        body: JSON.stringify({
          integration_id: "slack",
          settings: { webhook_url: slackWebhook },
          is_active: slackEnabled,
          updated_at: new Date().toISOString(),
        }),
      });
      setSlackSaved(true);
      setTimeout(() => setSlackSaved(false), 2000);
    } catch (err) { console.error("Save Slack failed:", err); }
    setSlackSaving(false);
  }

  async function testSlackWebhook() {
    if (!slackWebhook.trim()) return;
    setSlackTesting(true);
    setSlackTestResult(null);
    try {
      const res = await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "KickerVentures",
          icon_emoji: ":robot_face:",
          text: ":wave: *Kicker connected!* Your AI team can now post updates to this channel.",
        }),
      });
      setSlackTestResult(res.ok ? { success: true } : { success: false, error: `HTTP ${res.status}` });
    } catch (err) {
      setSlackTestResult({ success: false, error: err.message });
    }
    setSlackTesting(false);
  }

  useEffect(() => {
    async function fetchIntegrations() {
      setIntegrationsLoading(true);
      try {
        const token = getAuthToken();
        // Fetch system integrations from edge function
        const sysRes = await fetch(`${SUPABASE_URL}/functions/v1/check-integrations`, {
          headers: { apikey: SUPABASE_ANON_KEY_BILL },
        });
        let sysIntegrations = [];
        if (sysRes.ok) sysIntegrations = await sysRes.json();

        // Fetch user overrides + custom integrations from DB
        let dbOverrides = {};
        let customIntegrations = [];
        if (token) {
          const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/integrations?select=*`, {
            headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL },
          });
          if (dbRes.ok) {
            const rows = await dbRes.json();
            for (const row of (rows || [])) {
              dbOverrides[row.slug] = row;
              // If slug not in system list, it's a custom integration
              if (!sysIntegrations.find(s => s.id === row.slug)) {
                customIntegrations.push({
                  id: row.slug,
                  name: row.name,
                  desc: row.description,
                  category: row.category || "custom",
                  key_name: row.env_key,
                  connected: row.is_connected,
                  is_enabled: row.is_enabled,
                  logo: "",
                  isCustom: true,
                });
              }
            }
          }
        }
        setUserOverrides(dbOverrides);

        // Merge: apply DB overrides to system integrations
        const merged = sysIntegrations.map(s => {
          const override = dbOverrides[s.id];
          return {
            ...s,
            is_enabled: override ? override.is_enabled : s.connected, // default: enabled if connected
            _hasOverride: !!override,
          };
        });

        setIntegrations([...merged, ...customIntegrations]);
      } catch (err) { console.error("Integration check failed:", err); }
      setIntegrationsLoading(false);
    }
    if (activeSection === "integrations") fetchIntegrations();
  }, [activeSection]);

  // ─── Chat Widgets ─────────────────────────────────────────
  useEffect(() => {
    async function fetchWidgets() {
      const token = getAuthToken();
      if (!token) return;
      setWidgetsLoading(true);
      try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_widgets?select=*&order=created_at.desc`, {
          headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL },
        });
        if (res.ok) setWidgets(await res.json());
      } catch (err) { console.error("Widget fetch failed:", err); }
      setWidgetsLoading(false);
    }
    if (activeSection === "chat-widgets") fetchWidgets();
  }, [activeSection]);

  async function saveWidget() {
    const token = getAuthToken();
    if (!token || !wName.trim()) return;
    setSavingWidget(true);
    try {
      const parts = token.split(".");
      const userId = JSON.parse(atob(parts[1])).sub;
      const slug = wName.toLowerCase().replace(/[^a-z0-9]/g, "-");
      const knowledgeBase = wKnowledge.trim() ? wKnowledge.split("\n").filter(l => l.trim()).map(l => {
        const [title, ...rest] = l.split(":");
        return { title: title.trim(), content: rest.join(":").trim() || title.trim() };
      }) : [];
      const body = {
        user_id: userId, slug, name: wName, agent_name: wAgentName, company_name: wCompany, site_url: wSiteUrl,
        avatar_url: wAvatarUrl,
        custom_prompt: wPrompt, welcome_message: wWelcome, primary_color: wColor,
        model_provider: wModel === "anthropic" ? "anthropic" : wModel === "groq" ? "groq" : "deepseek",
        model_name: wModel === "anthropic" ? "claude-sonnet-4-20250514" : wModel === "groq" ? "llama-3.3-70b-versatile" : "deepseek-chat",
        require_email: wRequireEmail, knowledge_base: knowledgeBase, faq_entries: wFaqs,
      };
      if (editingWidget) {
        await fetch(`${SUPABASE_URL}/rest/v1/chat_widgets?id=eq.${editingWidget.id}`, {
          method: "PATCH", headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify({ ...body, updated_at: new Date().toISOString() }),
        });
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/chat_widgets`, {
          method: "POST", headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL, "Content-Type": "application/json", Prefer: "return=minimal" },
          body: JSON.stringify(body),
        });
      }
      setShowWidgetForm(false); setEditingWidget(null); resetWidgetForm();
      // Refresh
      const res = await fetch(`${SUPABASE_URL}/rest/v1/chat_widgets?select=*&order=created_at.desc`, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL },
      });
      if (res.ok) setWidgets(await res.json());
    } catch (err) { console.error("Save widget failed:", err); }
    setSavingWidget(false);
  }

  async function deleteWidget(id) {
    if (!confirm("Delete this widget? All conversations will be lost.")) return;
    const token = getAuthToken();
    await fetch(`${SUPABASE_URL}/rest/v1/chat_widgets?id=eq.${id}`, {
      method: "DELETE", headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL, Prefer: "return=minimal" },
    });
    setWidgets(prev => prev.filter(w => w.id !== id));
  }

  async function toggleWidget(w) {
    const token = getAuthToken();
    await fetch(`${SUPABASE_URL}/rest/v1/chat_widgets?id=eq.${w.id}`, {
      method: "PATCH", headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ is_active: !w.is_active }),
    });
    setWidgets(prev => prev.map(x => x.id === w.id ? { ...x, is_active: !x.is_active } : x));
  }

  function editWidget(w) {
    setEditingWidget(w);
    setWName(w.name); setWAgentName(w.agent_name || "Luna"); setWCompany(w.company_name || ""); setWSiteUrl(w.site_url || "");
    setWAvatarUrl(w.avatar_url || "");
    setWPrompt(w.custom_prompt || ""); setWWelcome(w.welcome_message || "");
    setWColor(w.primary_color || "#6366f1"); setWRequireEmail(w.require_email || false);
    setWModel(w.model_provider || "deepseek");
    setWFaqs(w.faq_entries || []);
    setWKnowledge((w.knowledge_base || []).map(k => `${k.title}: ${k.content}`).join("\n"));
    setShowWidgetForm(true);
  }

  function resetWidgetForm() {
    setWName(""); setWAgentName("Luna"); setWCompany(""); setWSiteUrl(""); setWAvatarUrl(""); setWPrompt(""); setWWelcome("Hi! How can I help you today?");
    setWColor("#6366f1"); setWModel("deepseek"); setWRequireEmail(false); setWKnowledge(""); setWFaqs([]); setWFaqQ(""); setWFaqA("");
  }

  // Live billing data

  async function exportBillingPDF() {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const w = doc.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;
    try {
      const logoImg = new Image();
      logoImg.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => { logoImg.onload = resolve; logoImg.onerror = reject; logoImg.src = "/images/viaxo-ai-logo.png"; });
      const canvas = document.createElement("canvas");
      canvas.width = logoImg.naturalWidth; canvas.height = logoImg.naturalHeight;
      canvas.getContext("2d").drawImage(logoImg, 0, 0);
      doc.addImage(canvas.toDataURL("image/png"), "PNG", margin, y, 30, 30 * (logoImg.naturalHeight / logoImg.naturalWidth));
      y += 18;
    } catch { y += 5; }
    doc.setFontSize(18); doc.setFont("helvetica", "bold"); doc.text("Usage Report", margin + 35, y); y += 7;
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120);
    const monthStart = billingData.month_start ? new Date(billingData.month_start) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const periodStr = `${monthStart.toLocaleDateString("en-US", { month: "long", day: "numeric" })} – ${monthEnd.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
    doc.text(`Period: ${periodStr}`, margin + 35, y); y += 5;
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`, margin + 35, y); y += 5;
    doc.text("Kicker Video · paul@kickervideo.com", margin + 35, y); y += 12;
    doc.setDrawColor(220, 220, 220); doc.line(margin, y, w - margin, y); y += 8;
    doc.setTextColor(0, 0, 0); doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.text("Summary", margin, y); y += 7;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    const summaryItems = [["Total Spend", `$${Number(billingData.total_cost || 0).toFixed(4)}`], ["Total API Calls", String(billingData.total_messages || 0)], ["Total Tokens", Number(billingData.total_tokens || 0).toLocaleString()], ["Active Agents", String(billingData.agent_count || 0)]];
    for (const [label, val] of summaryItems) { doc.setFont("helvetica", "normal"); doc.setTextColor(100, 100, 100); doc.text(label, margin, y); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0); doc.text(val, margin + 50, y); y += 6; }
    y += 6;
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(0, 0, 0); doc.text("Spend by Provider", margin, y); y += 7;
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 100, 100);
    doc.text("Provider", margin, y); doc.text("Model", margin + 30, y); doc.text("Calls", margin + 80, y); doc.text("Tokens In", margin + 100, y); doc.text("Tokens Out", margin + 125, y); doc.text("Cost", w - margin, y, { align: "right" }); y += 2;
    doc.setDrawColor(230, 230, 230); doc.line(margin, y, w - margin, y); y += 4;
    doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40);
    let providerTotal = 0;
    for (const p of (billingData.providers || []).filter(p => p.provider !== "none")) { doc.text(p.provider, margin, y); doc.text(p.model_name, margin + 30, y); doc.text(String(p.calls), margin + 80, y); doc.text(Number(p.tokens_in).toLocaleString(), margin + 100, y); doc.text(Number(p.tokens_out).toLocaleString(), margin + 125, y); doc.setFont("helvetica", "bold"); doc.text(`$${Number(p.cost).toFixed(4)}`, w - margin, y, { align: "right" }); doc.setFont("helvetica", "normal"); providerTotal += Number(p.cost); y += 5.5; }
    doc.line(margin, y, w - margin, y); y += 4;
    doc.setFont("helvetica", "bold"); doc.text("Total", margin, y); doc.text(`$${providerTotal.toFixed(4)}`, w - margin, y, { align: "right" }); y += 10;
    doc.setFontSize(11); doc.text("Spend by Project", margin, y); y += 7;
    doc.setFontSize(8); doc.setFont("helvetica", "bold"); doc.setTextColor(100, 100, 100);
    doc.text("Project", margin, y); doc.text("Calls", margin + 90, y); doc.text("Tokens", margin + 115, y); doc.text("Cost", w - margin, y, { align: "right" }); y += 2; doc.line(margin, y, w - margin, y); y += 4;
    doc.setFont("helvetica", "normal"); doc.setTextColor(40, 40, 40);
    let projectTotal = 0;
    if ((billingData.projects || []).length > 0) { for (const proj of billingData.projects) { doc.text(proj.project_name, margin, y); doc.text(String(proj.calls), margin + 90, y); doc.text(Number(proj.total_tokens).toLocaleString(), margin + 115, y); doc.setFont("helvetica", "bold"); doc.text(`$${Number(proj.cost).toFixed(4)}`, w - margin, y, { align: "right" }); doc.setFont("helvetica", "normal"); projectTotal += Number(proj.cost); y += 5.5; } doc.line(margin, y, w - margin, y); y += 4; doc.setFont("helvetica", "bold"); doc.text("Total", margin, y); doc.text(`$${projectTotal.toFixed(4)}`, w - margin, y, { align: "right" }); } else { doc.setTextColor(150, 150, 150); doc.text("No project-linked usage this period.", margin, y); }
    y = doc.internal.pageSize.getHeight() - 15; doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(180, 180, 180); doc.text("Generated by Kicker · kicker.ventures", margin, y); doc.text(periodStr, w - margin, y, { align: "right" });
    const monthName = monthStart.toLocaleDateString("en-US", { month: "long", year: "numeric" }).replace(" ", "-");
    doc.save(`KickerVentures-Usage-Report-${monthName}.pdf`);
  }

  // Fetch live billing data via RPC
  useEffect(() => {
    async function fetchBilling() {
      const token = getAuthToken();
      if (!token) return;
      try {
        // Get user id from token
        const parts = token.split(".");
        const payload = JSON.parse(atob(parts[1]));
        const userId = payload.sub;

        const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_billing_dashboard`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL, "Content-Type": "application/json" },
          body: JSON.stringify({ p_user_id: userId }),
        });
        if (res.ok) {
          const d = await res.json();
          setBillingData(d || {});
        }
      } catch (err) { console.error("Billing fetch error:", err); }
    }
    if (activeSection === "billing") fetchBilling();
  }, [activeSection]);

  // Fetch live audit log
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [expandedAudit, setExpandedAudit] = useState(null);
  const [auditTab, setAuditTab] = useState("activity"); // "activity" or "debug"

  useEffect(() => {
    async function fetchAuditLog() {
      const token = getAuthToken();
      if (!token) return;
      setAuditLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY_BILL };
        const [notifRes, workRes, delegRes, llmRes, errRes] = await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/ai_agent_notifications?select=*&order=created_at.desc&limit=30`, { headers }).catch(() => null),
          fetch(`${SUPABASE_URL}/rest/v1/ai_work_logs?select=*&order=created_at.desc&limit=30`, { headers }).catch(() => null),
          fetch(`${SUPABASE_URL}/rest/v1/ai_agent_delegations?select=*,requesting:requesting_agent_id(name),target:target_agent_id(name)&order=created_at.desc&limit=20`, { headers }).catch(() => null),
          fetch(`${SUPABASE_URL}/rest/v1/llm_call_log?select=*&order=created_at.desc&limit=50`, { headers }).catch(() => null),
          fetch(`${SUPABASE_URL}/rest/v1/edge_function_errors?select=*&order=created_at.desc&limit=20`, { headers }).catch(() => null),
        ]);

        const activity = [];
        const debug = [];

        // Notifications → Activity
        if (notifRes?.ok) {
          const notifs = await notifRes.json();
          for (const n of (notifs || [])) {
            const icon = n.notification_type === "escalation" ? "🚨" : n.notification_type === "task_complete" ? "✅" : n.notification_type === "stalled" ? "⏸️" : n.notification_type === "needs_approval" ? "👀" : "🔔";
            activity.push({
              id: `notif-${n.id}`,
              time: new Date(n.created_at),
              icon,
              title: n.title || n.notification_type,
              detail: n.message || "",
              type: n.notification_type,
            });
          }
        }

        // Work logs → Activity
        if (workRes?.ok) {
          const logs = await workRes.json();
          for (const l of (logs || [])) {
            const icon = l.status === "completed" ? "✅" : l.status === "in_progress" ? "🔄" : l.status === "blocked" ? "🚫" : "📋";
            activity.push({
              id: `work-${l.id}`,
              time: new Date(l.created_at),
              icon,
              title: l.title,
              detail: l.description || "",
              type: "work",
            });
          }
        }

        // Delegations → Activity
        if (delegRes?.ok) {
          const dels = await delegRes.json();
          for (const d of (dels || [])) {
            const fromName = d.requesting?.name || "Agent";
            const toName = d.target?.name || "Agent";
            const icon = d.status === "completed" ? "🤝" : d.status === "failed" ? "❌" : "➡️";
            activity.push({
              id: `del-${d.id}`,
              time: new Date(d.created_at),
              icon,
              title: `${fromName} delegated to ${toName}: "${d.task?.substring(0, 80)}"`,
              detail: d.status === "completed" ? `Result: ${(d.result || "").substring(0, 200)}` : d.status === "failed" ? `Error: ${d.error_message || "Unknown"}` : `Status: ${d.status}`,
              type: "delegation",
            });
          }
        }

        // LLM calls → Debug
        if (llmRes?.ok) {
          const logs = await llmRes.json();
          for (const l of (logs || [])) {
            debug.push({
              id: `llm-${l.id}`,
              time: new Date(l.created_at),
              title: `${l.reason_code || "api_call"} — ${l.model_provider}/${l.model_name}`,
              detail: `Tokens in: ${l.tokens_in || 0} | Tokens out: ${l.tokens_out || 0} | Cost: $${Number(l.estimated_cost || 0).toFixed(5)} | Duration: ${l.duration_ms || 0}ms | Mode: ${l.mode_at_time || "chat"} | Cached: ${l.was_cached ? "Yes" : "No"}`,
              type: "llm",
            });
          }
        }

        // Errors → Debug (highlighted)
        if (errRes?.ok) {
          const errs = await errRes.json();
          for (const e of (errs || [])) {
            debug.push({
              id: `err-${e.id}`,
              time: new Date(e.created_at),
              title: `⚠️ ERROR: ${e.function_name} — ${(e.error_message || "").substring(0, 100)}`,
              detail: e.error_stack || e.error_message || "",
              type: "error",
              isError: true,
            });
          }
        }

        activity.sort((a, b) => b.time - a.time);
        debug.sort((a, b) => b.time - a.time);

        setAuditLog({ activity: activity.slice(0, 50), debug: debug.slice(0, 50) });
      } catch (err) { console.error("Audit fetch error:", err); }
      setAuditLoading(false);
    }
    if (activeSection === "audit-log") fetchAuditLog();
  }, [activeSection]);
  return <main className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        {
    /* Header */
  }
        <div className="mb-6 pl-10 md:pl-0">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-accent" />
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Settings</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Manage your workspace, account, and integrations.</p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {
    /* Left Nav */
  }
          <nav className="shrink-0 md:w-48">
            <div className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:overflow-visible md:pb-0">
              {settingsSections.map((section) => {
    const isActive = activeSection === section.id;
    return <button
      key={section.id}
      onClick={() => setActiveSection(section.id)}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
        isActive ? "bg-accent/10 text-accent" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </button>;
  })}
            </div>
          </nav>

          {
    /* Right Content */
  }
          <div className="min-w-0 flex-1">
            <div className="rounded-xl border border-border bg-card">

              {
    /* ---- WORKSPACE ---- */
  }
              {activeSection === "workspace" && <div className="p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-card-foreground">Workspace</h2>
                  <div className="space-y-5">
                    {
    /* Company Logo */
  }
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Company Logo</label>
                      <div className="flex items-center gap-4">
                        <button
    onClick={() => logoInputRef.current?.click()}
    className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted transition-colors hover:border-accent/50"
  >
                          {companyLogo ? <img src={companyLogo} alt="Logo" className="h-full w-full object-cover" /> : <Upload className="h-5 w-5 text-muted-foreground group-hover:text-accent" />}
                          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                        </button>
                        <p className="text-[11px] text-muted-foreground">Upload a square logo (at least 128x128px). PNG or SVG recommended.</p>
                      </div>
                    </div>
                    {
    /* Company Name */
  }
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Company Name</label>
                      <input
    value={companyName}
    onChange={(e) => setCompanyName(e.target.value)}
    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50 sm:max-w-sm"
  />
                    </div>
                    {
    /* Company URL */
  }
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Website URL</label>
                      <input
    value={companyUrl}
    onChange={(e) => setCompanyUrl(e.target.value)}
    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent/50 sm:max-w-sm"
  />
                    </div>
                    {
    /* Timezone */
  }
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
                </div>}

              {
    /* ---- ACCOUNT ---- */
  }
              {activeSection === "account" && <div className="p-5 sm:p-6">
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
                    {
    /* Password */
  }
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
                    {
    /* 2FA */
  }
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
                </div>}

              {
    /* ---- PERMISSIONS ---- */
  }
              {activeSection === "permissions" && <div className="p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-card-foreground">Team Permissions</h2>
                  <div className="space-y-4">
                    {
    /* Invite */
  }
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
                    {
    /* Team list */
  }
                    <div className="space-y-1">
                      {team.map((member) => <div key={member.id} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                            {member.avatar ? <img src={member.avatar} alt={member.name} className="h-full w-full object-cover" /> : <span className="text-[10px] font-bold text-muted-foreground">{member.name[0].toUpperCase()}</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-card-foreground">{member.name}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{member.email}</p>
                          </div>
                          <select
    value={member.role}
    onChange={(e) => setTeam(
      (prev) => prev.map(
        (m) => m.id === member.id ? { ...m, role: e.target.value } : m
      )
    )}
    className="rounded-md border border-input bg-background px-2 py-1 text-[11px] text-foreground outline-none"
  >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          {member.id !== "paul" && <button
    onClick={() => setTeam((prev) => prev.filter((m) => m.id !== member.id))}
    className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
  >
                              <X className="h-3 w-3" />
                            </button>}
                        </div>)}
                    </div>
                  </div>
                </div>}

              {
    /* ---- AGENT DEFAULTS ---- */
  }
              {activeSection === "agent-defaults" && <div className="p-5 sm:p-6">
                  <h2 className="mb-1 text-base font-bold text-card-foreground">Agent Defaults</h2>
                  <p className="mb-5 text-xs text-muted-foreground">These defaults apply when creating new agents.</p>
                  <div className="space-y-5">
                    {
    /* Default model */
  }
                    <div>
                      <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Default Model</label>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {[
    { value: "deepseek-chat", label: "DeepSeek V3", desc: "Best value — fast & capable", logo: "https://cdn.simpleicons.org/deepseek/4D6BFE" },
    { value: "deepseek-reasoner", label: "DeepSeek R1", desc: "Advanced reasoning", logo: "https://cdn.simpleicons.org/deepseek/4D6BFE" },
    { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4", desc: "Balanced performance", logo: "https://cdn.simpleicons.org/anthropic/191919" },
    { value: "claude-opus-4-5", label: "Claude Opus 4.5", desc: "Best for creative writing", logo: "https://cdn.simpleicons.org/anthropic/191919" },
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", desc: "Groq — fast versatile reasoning", logo: "https://cdn.simpleicons.org/meta/0467DF" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B", desc: "Groq — ultra-fast lightweight", logo: "https://cdn.simpleicons.org/meta/0467DF" }
  ].map((m) => <button
    key={m.value}
    onClick={() => setDefaultModel(m.value)}
    className={cn(
      "flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-all",
      defaultModel === m.value ? "border-accent bg-accent/5" : "border-border hover:border-accent/30"
    )}
  >
                            <div className="flex items-center gap-2.5">
                              <img src={m.logo} alt="" className="h-4 w-4 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
                              <div>
                                <p className={cn("text-xs font-semibold", defaultModel === m.value ? "text-accent" : "text-card-foreground")}>{m.label}</p>
                                <p className="text-[10px] text-muted-foreground">{m.desc}</p>
                              </div>
                            </div>
                            {defaultModel === m.value && <Check className="h-3.5 w-3.5 text-accent" />}
                          </button>)}
                      </div>
                    </div>
                    {
    /* Default creativity */
  }
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
                    {
    /* Default guardrails */
  }
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-muted-foreground">Default Guardrails</label>
                      <div className="space-y-1">
                        {[
    { state: defaultHumanApproval, set: setDefaultHumanApproval, label: "Require Human Approval", rec: true },
    { state: defaultPageEdits, set: setDefaultPageEdits, label: "Allow Page Edits", rec: false },
    { state: defaultExternalApi, set: setDefaultExternalApi, label: "Allow External API Calls", rec: false }
  ].map(({ state, set, label, rec }) => <label key={label} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/30">
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
                            {rec && state && <span className="ml-auto rounded-full border border-amber-300 px-1.5 py-0.5 text-[8px] font-medium text-amber-600">Recommended</span>}
                          </label>)}
                      </div>
                    </div>
                    <button onClick={handleSave} className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? "Saved" : "Save Defaults"}
                    </button>
                  </div>
                </div>}

              {
    /* ---- INTEGRATIONS ---- */
  }
              {activeSection === "integrations" && <div className="p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="mb-1 text-base font-bold text-card-foreground">Global Integrations</h2>
                      <p className="text-xs text-muted-foreground">Live connection status. Toggle on/off or add custom integrations.</p>
                    </div>
                    <button
                      onClick={() => { setShowAddForm(!showAddForm); setTestResult(null); }}
                      className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
                    >
                      <Plus className="h-3 w-3" />
                      Add New
                    </button>
                  </div>

                  {/* Add new integration form */}
                  {showAddForm && (
                    <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
                      <h3 className="mb-3 text-xs font-bold text-card-foreground">New Integration</h3>
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Name *</label>
                            <input value={newIntName} onChange={e => setNewIntName(e.target.value)} placeholder="e.g. Resend" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Category</label>
                            <select value={newIntCategory} onChange={e => setNewIntCategory(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50">
                              <option value="ai">🧠 AI Provider</option>
                              <option value="video">🎬 Video & Media</option>
                              <option value="dev">⚙️ Development</option>
                              <option value="business">💼 Business</option>
                              <option value="custom">📦 Custom</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Description</label>
                          <input value={newIntDesc} onChange={e => setNewIntDesc(e.target.value)} placeholder="What does this integration do?" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Env Variable Name</label>
                            <input value={newIntEnvKey} onChange={e => setNewIntEnvKey(e.target.value)} placeholder={newIntName ? `${newIntName.toUpperCase().replace(/[^A-Z0-9]/g, "_")}_API_KEY` : "AUTO_GENERATED"} className="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Base URL <span className="text-muted-foreground/60">(optional)</span></label>
                            <input value={newIntBaseUrl} onChange={e => setNewIntBaseUrl(e.target.value)} placeholder="https://api.example.com" className="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">API Key *</label>
                          <input type="password" value={newIntApiKey} onChange={e => setNewIntApiKey(e.target.value)} placeholder="Paste your API key..." className="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                        </div>
                        {testResult && (
                          <div className={cn("rounded-md px-3 py-2 text-xs", testResult.success ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-destructive/10 text-destructive border border-destructive/20")}>
                            {testResult.success ? (
                              <span className="flex items-center gap-1.5"><Check className="h-3 w-3" /> Connection successful{testResult.duration_ms ? ` (${testResult.duration_ms}ms)` : ""}</span>
                            ) : (
                              <span>❌ {testResult.error || "Connection failed"}</span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => testIntegration(newIntName.toLowerCase().replace(/[^a-z0-9]/g, "-"), newIntApiKey, newIntBaseUrl)}
                            disabled={!newIntApiKey.trim() || testing}
                            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-40"
                          >
                            {testing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe className="h-3 w-3" />}
                            Test
                          </button>
                          <button
                            onClick={saveNewIntegration}
                            disabled={!newIntName.trim() || !newIntApiKey.trim() || savingInt}
                            className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-40"
                          >
                            {savingInt ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            Add Now
                          </button>
                          <button onClick={() => { setShowAddForm(false); setTestResult(null); }} className="rounded-md px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {integrationsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-accent" />
                      <span className="ml-2 text-xs text-muted-foreground">Checking connections...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Slack Configuration */}
                      <div className="rounded-lg border border-border bg-card p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4A154B]/10">
                              <span className="text-lg">💬</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-card-foreground">Slack</p>
                              <p className="text-[10px] text-muted-foreground">Agents post updates and alerts to your Slack channels</p>
                            </div>
                          </div>
                          <div
                            onClick={() => setSlackEnabled(!slackEnabled)}
                            className={cn(
                              "flex h-5 w-9 cursor-pointer items-center rounded-full px-0.5 transition-colors",
                              slackEnabled ? "bg-emerald-500" : "bg-muted-foreground/20"
                            )}
                          >
                            <div className={cn("h-4 w-4 rounded-full bg-white shadow transition-transform", slackEnabled ? "translate-x-4" : "translate-x-0")} />
                          </div>
                        </div>
                        {slackEnabled && (
                          <div className="space-y-3 pt-2 border-t border-border">
                            <div>
                              <label className="mb-1 block text-[10px] font-medium text-muted-foreground">Webhook URL</label>
                              <input
                                type="url"
                                value={slackWebhook}
                                onChange={(e) => setSlackWebhook(e.target.value)}
                                placeholder="https://hooks.slack.com/services/T.../B.../..."
                                className="w-full rounded-md border border-border bg-card px-3 py-2 text-xs text-card-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none"
                              />
                              <p className="mt-1 text-[9px] text-muted-foreground">
                                Create one at <a href="https://api.slack.com/messaging/webhooks" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">api.slack.com/messaging/webhooks</a> → pick a channel → copy the URL
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={saveSlackSettings}
                                disabled={slackSaving}
                                className="rounded-md bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
                              >
                                {slackSaving ? "Saving..." : slackSaved ? "Saved ✓" : "Save"}
                              </button>
                              <button
                                onClick={testSlackWebhook}
                                disabled={slackTesting || !slackWebhook.trim()}
                                className="rounded-md border border-border px-3 py-1.5 text-[11px] font-medium text-card-foreground transition-colors hover:bg-muted/30 disabled:opacity-50"
                              >
                                {slackTesting ? "Sending..." : "Send Test Message"}
                              </button>
                              {slackTestResult && (
                                <span className={cn("text-[10px] font-medium", slackTestResult.success ? "text-emerald-500" : "text-red-400")}>
                                  {slackTestResult.success ? "✓ Sent to Slack!" : `✗ ${slackTestResult.error}`}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {[
                        { key: "ai", label: "AI Providers", icon: "🧠" },
                        { key: "video", label: "Video & Media", icon: "🎬" },
                        { key: "dev", label: "Development", icon: "⚙️" },
                        { key: "business", label: "Business", icon: "💼" },
                        { key: "custom", label: "Custom", icon: "📦" },
                      ].map(group => {
                        const items = integrations.filter(i => i.category === group.key);
                        if (items.length === 0) return null;
                        const connectedCount = items.filter(i => i.connected).length;
                        const enabledCount = items.filter(i => i.is_enabled !== false).length;
                        return (
                          <div key={group.key}>
                            <div className="mb-2 flex items-center gap-2">
                              <span className="text-sm">{group.icon}</span>
                              <h3 className="text-xs font-bold text-card-foreground">{group.label}</h3>
                              <span className="text-[10px] text-muted-foreground">{connectedCount} connected · {enabledCount} enabled</span>
                            </div>
                            <div className="space-y-1.5">
                              {items.map(integration => {
                                const isEnabled = integration.is_enabled !== false;
                                const isToggling = togglingSlug === integration.id;
                                return (
                                  <div key={integration.id} className={cn(
                                    "flex items-center gap-3 rounded-lg border px-4 py-3 transition-all",
                                    !isEnabled && "opacity-50",
                                    integration.connected && isEnabled ? "border-emerald-500/30 bg-emerald-500/5" : "border-border"
                                  )}>
                                    <IntegrationLogo src={integration.logo} name={integration.name} />
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs font-semibold text-card-foreground">{integration.name}</p>
                                        {integration.connected && isEnabled ? (
                                          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600">
                                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                                          </span>
                                        ) : integration.connected && !isEnabled ? (
                                          <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600">
                                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Paused
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                                            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" /> Not configured
                                          </span>
                                        )}
                                        {integration.isCustom && <span className="rounded bg-muted px-1 py-0.5 text-[8px] font-medium text-muted-foreground">Custom</span>}
                                      </div>
                                      {integration.desc && <p className="mt-0.5 text-[10px] text-muted-foreground">{integration.desc}</p>}
                                      {integration.key_name && !integration.connected && (
                                        <p className="mt-0.5 font-mono text-[9px] text-muted-foreground/60">env: {integration.key_name}</p>
                                      )}
                                    </div>
                                    <button onClick={() => toggleIntegration(integration)} disabled={isToggling} className="shrink-0" title={isEnabled ? "Disable" : "Enable"}>
                                      {isToggling ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : (
                                        <div className={cn("relative h-5 w-9 rounded-full transition-colors cursor-pointer", isEnabled ? "bg-emerald-500" : "bg-muted-foreground/30")}>
                                          <div className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all", isEnabled ? "left-[18px]" : "left-0.5")} />
                                        </div>
                                      )}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>}

              {
    /* ---- CHAT WIDGETS ---- */
  }
              {activeSection === "chat-widgets" && <div className="p-5 sm:p-6">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="mb-1 text-base font-bold text-card-foreground">Chat Widgets</h2>
                      <p className="text-xs text-muted-foreground">Deploy AI support agents on any website. Each widget gets its own knowledge base and branding.</p>
                    </div>
                    <button onClick={() => { resetWidgetForm(); setEditingWidget(null); setShowWidgetForm(!showWidgetForm); }} className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground hover:bg-accent/90">
                      <Plus className="h-3 w-3" /> Create Widget
                    </button>
                  </div>

                  {/* Create / Edit form */}
                  {showWidgetForm && (
                    <div className="mb-6 rounded-lg border border-accent/30 bg-accent/5 p-4">
                      <h3 className="mb-3 text-xs font-bold text-card-foreground">{editingWidget ? "Edit Widget" : "New Widget"}</h3>
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Widget Name *</label>
                            <input value={wName} onChange={e => setWName(e.target.value)} placeholder="e.g. Acme Support" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Agent Name <span className="text-muted-foreground/60">(shown in chat header)</span></label>
                            <input value={wAgentName} onChange={e => setWAgentName(e.target.value)} placeholder="Luna" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Company Name</label>
                            <input value={wCompany} onChange={e => setWCompany(e.target.value)} placeholder="Acme Corp" className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Agent Avatar URL <span className="text-muted-foreground/60">(optional)</span></label>
                            <input value={wAvatarUrl} onChange={e => setWAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.png" className="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Website URL</label>
                            <input value={wSiteUrl} onChange={e => setWSiteUrl(e.target.value)} placeholder="https://acme.com" className="w-full rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                          </div>
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">AI Model</label>
                            <select value={wModel} onChange={e => setWModel(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50">
                              <option value="deepseek">DeepSeek V3 (best value)</option>
                              <option value="anthropic">Claude Sonnet 4 (premium)</option>
                              <option value="groq">Llama 3.3 70B (fastest)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Welcome Message</label>
                          <input value={wWelcome} onChange={e => setWWelcome(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Custom Instructions</label>
                          <textarea value={wPrompt} onChange={e => setWPrompt(e.target.value)} rows={3} placeholder="Tell the agent how to behave, what to know, what tone to use..." className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50 resize-y" />
                        </div>
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Knowledge Base <span className="text-muted-foreground/60">(one per line: Title: Content)</span></label>
                          <textarea value={wKnowledge} onChange={e => setWKnowledge(e.target.value)} rows={3} placeholder={"Pricing: Our plans start at $29/mo\nRefund Policy: 30-day money back guarantee\nHours: Mon-Fri 9am-5pm EST"} className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50 resize-y font-mono" />
                        </div>
                        {/* FAQ builder */}
                        <div>
                          <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">FAQ Entries</label>
                          {wFaqs.length > 0 && (
                            <div className="mb-2 space-y-1">
                              {wFaqs.map((faq, i) => (
                                <div key={i} className="flex items-start gap-2 rounded-md border border-border bg-background px-2 py-1.5 text-[11px]">
                                  <div className="flex-1"><strong>Q:</strong> {faq.question}<br /><strong>A:</strong> {faq.answer}</div>
                                  <button onClick={() => setWFaqs(prev => prev.filter((_, j) => j !== i))} className="shrink-0 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex gap-2">
                            <input value={wFaqQ} onChange={e => setWFaqQ(e.target.value)} placeholder="Question" className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-accent/50" />
                            <input value={wFaqA} onChange={e => setWFaqA(e.target.value)} placeholder="Answer" className="flex-1 rounded-md border border-input bg-background px-2 py-1 text-[11px] text-foreground outline-none focus:ring-1 focus:ring-accent/50" />
                            <button onClick={() => { if (wFaqQ.trim() && wFaqA.trim()) { setWFaqs(prev => [...prev, { question: wFaqQ, answer: wFaqA }]); setWFaqQ(""); setWFaqA(""); } }} className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium text-card-foreground hover:bg-muted/80">Add</button>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div>
                            <label className="mb-1 block text-[10px] font-semibold text-muted-foreground">Brand Color</label>
                            <div className="flex items-center gap-2">
                              <input type="color" value={wColor} onChange={e => setWColor(e.target.value)} className="h-8 w-8 cursor-pointer rounded border border-input" />
                              <input value={wColor} onChange={e => setWColor(e.target.value)} className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 font-mono text-xs text-foreground outline-none focus:ring-2 focus:ring-accent/50" />
                            </div>
                          </div>
                          <div className="flex items-end">
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 hover:bg-muted/30">
                              <div onClick={() => setWRequireEmail(!wRequireEmail)} className={cn("flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded border transition-colors", wRequireEmail ? "border-accent bg-accent" : "border-muted-foreground/30")}>
                                {wRequireEmail && <Check className="h-2.5 w-2.5 text-accent-foreground" />}
                              </div>
                              <span className="text-xs text-card-foreground">Require visitor email</span>
                            </label>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button onClick={saveWidget} disabled={!wName.trim() || savingWidget} className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[11px] font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-40">
                            {savingWidget ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                            {editingWidget ? "Save Changes" : "Create Widget"}
                          </button>
                          <button onClick={() => { setShowWidgetForm(false); setEditingWidget(null); }} className="rounded-md px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Widget list */}
                  {widgetsLoading ? (
                    <div className="flex items-center justify-center py-12"><Loader2 className="h-5 w-5 animate-spin text-accent" /><span className="ml-2 text-xs text-muted-foreground">Loading widgets...</span></div>
                  ) : widgets.length === 0 && !showWidgetForm ? (
                    <div className="rounded-lg border border-dashed border-border py-12 text-center">
                      <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/30" />
                      <p className="mt-2 text-sm font-medium text-card-foreground">No widgets yet</p>
                      <p className="mt-1 text-xs text-muted-foreground">Create your first chat widget to deploy on a website.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {widgets.map(w => (
                        <div key={w.id} className={cn("rounded-lg border p-4 transition-all", w.is_active ? "border-emerald-500/30 bg-emerald-500/5" : "border-border opacity-60")}>
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 h-8 w-8 shrink-0 rounded-lg" style={{ background: w.primary_color || "#6366f1" }}>
                              <div className="flex h-full w-full items-center justify-center text-white text-sm">💬</div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-card-foreground">{w.name}</p>
                                {w.is_active ? (
                                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live</span>
                                ) : (
                                  <span className="flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" /> Paused</span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground">Agent: <strong>{w.agent_name || "Luna"}</strong> · {w.company_name || "No company"} · {w.site_url || "No URL"}</p>
                              <p className="mt-0.5 text-[10px] text-muted-foreground">{w.model_provider}/{w.model_name} · {w.total_conversations || 0} conversations · {w.total_messages || 0} messages</p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button onClick={() => editWidget(w)} className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-card-foreground hover:bg-muted">Edit</button>
                              <button onClick={() => toggleWidget(w)} className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-card-foreground hover:bg-muted">{w.is_active ? "Pause" : "Activate"}</button>
                              <button onClick={() => deleteWidget(w.id)} className="rounded-md border border-border px-2 py-1 text-[10px] font-medium text-destructive hover:bg-destructive/10">Delete</button>
                            </div>
                          </div>
                          {/* Embed code */}
                          <div className="mt-3 rounded-md border border-border bg-muted/30 p-3">
                            <p className="mb-1.5 text-[10px] font-semibold text-muted-foreground">Embed Code — paste before &lt;/body&gt;</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 rounded bg-background px-2 py-1.5 font-mono text-[10px] text-card-foreground border border-border overflow-x-auto whitespace-nowrap">
                                {`<script src="https://mzqjivtidadjaawmlslz.supabase.co/storage/v1/object/public/assets/widget.js" data-widget-id="${w.api_key}"></script>`}
                              </code>
                              <button onClick={() => { navigator.clipboard.writeText(`<script src="https://mzqjivtidadjaawmlslz.supabase.co/storage/v1/object/public/assets/widget.js" data-widget-id="${w.api_key}"></script>`); }} className="shrink-0 rounded-md bg-accent px-2 py-1.5 text-[10px] font-medium text-accent-foreground hover:bg-accent/90">Copy</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>}

              {
    /* ---- NOTIFICATIONS ---- */
  }
              {activeSection === "notifications" && <div className="p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-card-foreground">Notifications</h2>
                  <div className="space-y-5">
                    {
    /* Channel */
  }
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-muted-foreground">Delivery Channel</label>
                      <div className="flex gap-2">
                        {["browser", "email", "both"].map((ch) => <button
    key={ch}
    onClick={() => setNotifChannel(ch)}
    className={cn(
      "rounded-lg border px-3 py-2 text-xs font-medium capitalize transition-colors",
      notifChannel === ch ? "border-accent bg-accent/10 text-accent" : "border-border text-muted-foreground hover:border-accent/30"
    )}
  >
                            {ch}
                          </button>)}
                      </div>
                    </div>
                    {
    /* Toggles */
  }
                    <div>
                      <label className="mb-2 block text-xs font-semibold text-muted-foreground">Alert Types</label>
                      <div className="space-y-1">
                        {[
    { state: notifAgentError, set: setNotifAgentError, label: "Agent errors & failures", desc: "Get alerted when an agent encounters an error" },
    { state: notifTaskComplete, set: setNotifTaskComplete, label: "Task completions", desc: "Notify when agents finish assigned tasks" },
    { state: notifEscalation, set: setNotifEscalation, label: "Escalations", desc: "Alert when an agent escalates to a human" },
    { state: notifDeploy, set: setNotifDeploy, label: "Deployments", desc: "Notify on successful or failed deploys" },
    { state: notifWeeklyDigest, set: setNotifWeeklyDigest, label: "Weekly digest", desc: "Summary of agent activity and metrics" }
  ].map(({ state, set, label, desc }) => <label key={label} className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/30">
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
                          </label>)}
                      </div>
                    </div>
                    <button onClick={handleSave} className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90">
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? "Saved" : "Save Preferences"}
                    </button>
                  </div>
                </div>}

              {
    /* ---- BILLING ---- */
  }
              {activeSection === "billing" && <div className="p-5 sm:p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-base font-bold text-card-foreground">Billing</h2>
                    <button
                      onClick={exportBillingPDF}
                      disabled={!billingData.total_messages}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Download className="h-3 w-3" />
                      Export PDF
                    </button>
                  </div>
                  <div className="space-y-5">

                    {/* Month total */}
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border border-border p-4 text-center">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Total Spend</p>
                        <p className="mt-1 text-2xl font-bold text-accent">${Number(billingData.total_cost || 0).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">this month</p>
                      </div>
                      <div className="rounded-lg border border-border p-4 text-center">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">API Calls</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{Number(billingData.total_messages || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">this month</p>
                      </div>
                      <div className="rounded-lg border border-border p-4 text-center">
                        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Active Agents</p>
                        <p className="mt-1 text-2xl font-bold text-foreground">{billingData.agent_count || 0}</p>
                        <p className="text-[10px] text-muted-foreground">deployed</p>
                      </div>
                    </div>

                    {/* Usage by Provider with costs */}
                    <div className="rounded-lg border border-border p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-card-foreground">Spend by Provider</h3>
                        <p className="text-[10px] text-muted-foreground">This month</p>
                      </div>
                      {(billingData.providers || []).filter(p => p.provider !== "none").length > 0 ? (
                        <div>
                          {/* Stacked horizontal bar showing relative spend */}
                          <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-muted">
                            {(billingData.providers || []).filter(p => p.provider !== "none").map((p, i) => {
                              const pct = billingData.total_cost > 0 ? (p.cost / billingData.total_cost) * 100 : 0;
                              return <div key={i} title={`${p.provider}: $${Number(p.cost).toFixed(4)}`} className={cn(
                                "h-full transition-all",
                                p.provider === "deepseek" && "bg-blue-500",
                                p.provider === "anthropic" && "bg-orange-400",
                                p.provider === "groq" && "bg-emerald-500",
                                !["deepseek","anthropic","groq"].includes(p.provider) && "bg-muted-foreground"
                              )} style={{ width: `${Math.max(pct, 1)}%` }} />;
                            })}
                          </div>
                          {/* Provider rows */}
                          <div className="space-y-1.5">
                            {(billingData.providers || []).filter(p => p.provider !== "none").map((p, i) => {
                              const pct = billingData.total_cost > 0 ? ((p.cost / billingData.total_cost) * 100).toFixed(0) : 0;
                              return (
                                <div key={i} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/30 transition-colors">
                                  <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", p.provider === "deepseek" && "bg-blue-500", p.provider === "anthropic" && "bg-orange-400", p.provider === "groq" && "bg-emerald-500", !["deepseek","anthropic","groq"].includes(p.provider) && "bg-muted-foreground")} />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <p className="text-xs font-semibold text-card-foreground capitalize">{p.provider}</p>
                                      <p className="text-[10px] text-muted-foreground">· {p.model_name}</p>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">{p.calls} calls · {Number(p.tokens_in).toLocaleString()} in / {Number(p.tokens_out).toLocaleString()} out</p>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-card-foreground">${Number(p.cost).toFixed(4)}</p>
                                    <p className="text-[10px] text-muted-foreground">{pct}%</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {/* Total row */}
                          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                            <p className="text-xs font-semibold text-card-foreground">Total</p>
                            <p className="text-sm font-bold text-accent">${Number(billingData.total_cost || 0).toFixed(4)}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="py-4 text-center text-xs text-muted-foreground">No usage data yet this month.</p>
                      )}
                    </div>

                    {/* Cost per Project */}
                    <div className="rounded-lg border border-border p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-xs font-bold text-card-foreground">Spend by Project</h3>
                        <p className="text-[10px] text-muted-foreground">This month</p>
                      </div>
                      {(billingData.projects || []).length > 0 ? (
                        <div>
                          <div className="space-y-1.5">
                            {(billingData.projects || []).map((proj, i) => (
                              <div key={i} className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/30 transition-colors">
                                <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent/60" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-card-foreground truncate">{proj.project_name}</p>
                                  <p className="text-[10px] text-muted-foreground">{proj.calls} calls · {Number(proj.total_tokens).toLocaleString()} tokens</p>
                                </div>
                                <p className="text-xs font-bold text-card-foreground shrink-0">${Number(proj.cost).toFixed(4)}</p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                            <p className="text-xs font-semibold text-card-foreground">Total</p>
                            <p className="text-sm font-bold text-accent">${(billingData.projects || []).reduce((sum, p) => sum + Number(p.cost), 0).toFixed(4)}</p>
                          </div>
                        </div>
                      ) : (
                        <p className="py-4 text-center text-xs text-muted-foreground">No project-linked usage yet. Costs appear here when agents work within projects.</p>
                      )}
                    </div>
                  </div>
                </div>}

              {
    /* ---- AUDIT LOG ---- */
  }
              {activeSection === "audit-log" && <div className="p-5 sm:p-6">
                  <h2 className="mb-4 text-base font-bold text-card-foreground">Audit Log</h2>

                  {/* Tabs */}
                  <div className="mb-4 flex gap-1 rounded-lg bg-muted p-1">
                    {[
                      { id: "activity", label: "Activity", desc: "What your team did" },
                      { id: "debug", label: "Debug Console", desc: "For Dave" }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => { setAuditTab(tab.id); setExpandedAudit(null); }}
                        className={cn(
                          "flex-1 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                          auditTab === tab.id ? "bg-card text-card-foreground shadow-sm" : "text-muted-foreground hover:text-card-foreground"
                        )}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {auditLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-5 w-5 animate-spin text-accent" />
                      <span className="ml-2 text-xs text-muted-foreground">Loading...</span>
                    </div>
                  ) : auditTab === "activity" ? (
                    /* ─── ACTIVITY TAB ─── */
                    (auditLog.activity || []).length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">No activity yet. Events will appear here as your team works.</p>
                    ) : (
                      <div className="space-y-1">
                        {(auditLog.activity || []).map((entry) => (
                          <button
                            key={entry.id}
                            onClick={() => setExpandedAudit(expandedAudit === entry.id ? null : entry.id)}
                            className="flex w-full items-start gap-3 rounded-lg border border-border px-3 py-2.5 text-left transition-colors hover:bg-muted/30"
                          >
                            <span className="mt-0.5 text-base shrink-0">{entry.icon}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs text-card-foreground leading-snug">{entry.title}</p>
                              <p className="text-[10px] text-muted-foreground">{entry.time.toLocaleString()}</p>
                              {expandedAudit === entry.id && entry.detail && (
                                <div className="mt-2 rounded-md border border-border bg-muted/20 px-3 py-2">
                                  <p className="text-[11px] text-card-foreground whitespace-pre-wrap">{entry.detail}</p>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  ) : (
                    /* ─── DEBUG TAB ─── */
                    (auditLog.debug || []).length === 0 ? (
                      <p className="py-8 text-center text-xs text-muted-foreground">No debug entries yet.</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="mb-3 text-[11px] text-muted-foreground">Raw API calls and errors. Share with Dave for troubleshooting.</p>
                        {(auditLog.debug || []).map((entry) => (
                          <button
                            key={entry.id}
                            onClick={() => setExpandedAudit(expandedAudit === entry.id ? null : entry.id)}
                            className={cn(
                              "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors hover:bg-muted/30",
                              entry.isError ? "border-destructive/30 bg-destructive/5" : "border-border"
                            )}
                          >
                            <span className="mt-0.5 shrink-0 font-mono text-[10px] text-muted-foreground">{entry.isError ? "⚠️" : "›"}</span>
                            <div className="min-w-0 flex-1">
                              <p className={cn("text-xs font-mono leading-snug", entry.isError ? "text-destructive" : "text-card-foreground")}>{entry.title}</p>
                              <p className="text-[10px] text-muted-foreground">{entry.time.toLocaleString()}</p>
                              {expandedAudit === entry.id && entry.detail && (
                                <div className="mt-2 rounded-md border border-border bg-muted/20 px-3 py-2">
                                  <pre className="text-[10px] text-card-foreground whitespace-pre-wrap font-mono">{entry.detail}</pre>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )
                  )}
                </div>}
            </div>
          </div>
        </div>
      </div>
    </main>;
}
