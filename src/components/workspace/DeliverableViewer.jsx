import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { FileText, Video, Table2, Mail, Users, Code, Pencil, Download, Check, RotateCcw, X, Clock, AlertTriangle, Eye, Edit3, ChevronDown, Loader2 } from "lucide-react";

const SUPABASE_URL = "https://mzqjivtidadjaawmlslz.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cWppdnRpZGFkamFhd21sc2x6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5OTYxMDUsImV4cCI6MjA4NjU3MjEwNX0.o9WeG3HCDvPQ6SIv_EuzxR44VTZiMPfbUG3r7Ar8WD4";

function getToken() {
  try {
    const raw = localStorage.getItem("sb-mzqjivtidadjaawmlslz-auth-token");
    if (!raw) return null;
    return JSON.parse(raw)?.access_token || null;
  } catch { return null; }
}

const TYPE_ICONS = {
  document: FileText,
  social_post: Pencil,
  video: Video,
  spreadsheet: Table2,
  email_draft: Mail,
  lead_list: Users,
  code_review: Code,
  script: FileText,
  other: FileText,
};

const STATUS_STYLES = {
  draft: { label: "Draft", bg: "bg-muted/30", text: "text-muted-foreground", dot: "bg-muted-foreground" },
  needs_review: { label: "Needs Review", bg: "bg-amber-500/10", text: "text-amber-500", dot: "bg-amber-500" },
  approved: { label: "Approved", bg: "bg-emerald-500/10", text: "text-emerald-500", dot: "bg-emerald-500" },
  revision_requested: { label: "Revision Requested", bg: "bg-orange-500/10", text: "text-orange-500", dot: "bg-orange-500" },
  rejected: { label: "Rejected", bg: "bg-red-500/10", text: "text-red-500", dot: "bg-red-500" },
  expired: { label: "Expired", bg: "bg-muted/30", text: "text-muted-foreground", dot: "bg-muted-foreground" },
};

export function DeliverableBadge({ count, hasReview }) {
  if (!count) return null;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
      hasReview ? "bg-amber-500/10 text-amber-500" : "bg-muted/30 text-muted-foreground"
    )}>
      📎 {count}
      {hasReview && <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />}
    </span>
  );
}

export function DeliverableList({ taskId, projectId }) {
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadDeliverables();
  }, [taskId, projectId]);

  async function loadDeliverables() {
    setLoading(true);
    const token = getToken();
    if (!token) return;

    let url = `${SUPABASE_URL}/rest/v1/agent_deliverables?order=created_at.desc&limit=50`;
    if (taskId) url += `&task_id=eq.${taskId}`;
    else if (projectId) url += `&project_id=eq.${projectId}`;

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
      });
      if (res.ok) {
        const data = await res.json();
        setDeliverables(data || []);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!deliverables.length) {
    return (
      <div className="py-8 text-center">
        <FileText className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
        <p className="text-xs text-muted-foreground">No deliverables yet</p>
        <p className="text-[10px] text-muted-foreground/60">Agents will create deliverables here when they produce work for review</p>
      </div>
    );
  }

  if (selected) {
    return <DeliverableDetail deliverable={selected} onBack={() => { setSelected(null); loadDeliverables(); }} />;
  }

  return (
    <div className="space-y-2">
      {deliverables.map((d) => {
        const Icon = TYPE_ICONS[d.deliverable_type] || FileText;
        const status = STATUS_STYLES[d.status] || STATUS_STYLES.draft;
        const daysLeft = d.expires_at ? Math.max(0, Math.ceil((new Date(d.expires_at) - Date.now()) / (1000 * 60 * 60 * 24))) : null;

        return (
          <button
            key={d.id}
            onClick={() => setSelected(d)}
            className="flex w-full items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/20"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/30">
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-card-foreground">{d.title}</p>
                {d.version > 1 && <span className="shrink-0 text-[9px] text-muted-foreground">v{d.version}</span>}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-muted-foreground capitalize">{d.deliverable_type.replace('_', ' ')}</span>
                <span className="text-[10px] text-muted-foreground">•</span>
                <span className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {daysLeft !== null && daysLeft <= 3 && d.status !== 'expired' && (
                <span className="flex items-center gap-1 text-[9px] text-amber-500">
                  <Clock className="h-3 w-3" />
                  {daysLeft}d left
                </span>
              )}
              <span className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium", status.bg, status.text)}>
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
                {status.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DeliverableDetail({ deliverable, onBack }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(deliverable.content || "");
  const [reviewNotes, setReviewNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [exporting, setExporting] = useState(null); // 'docx' | 'xlsx' | etc.

  const status = STATUS_STYLES[deliverable.status] || STATUS_STYLES.draft;
  const Icon = TYPE_ICONS[deliverable.deliverable_type] || FileText;
  const isExpired = deliverable.status === 'expired';
  const daysLeft = deliverable.expires_at ? Math.max(0, Math.ceil((new Date(deliverable.expires_at) - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  async function updateStatus(newStatus) {
    setSaving(true);
    const token = getToken();
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/agent_deliverables?id=eq.${deliverable.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({
          status: newStatus,
          review_notes: reviewNotes || null,
          content: editing ? content : deliverable.content,
          updated_at: new Date().toISOString(),
        }),
      });
      onBack();
    } catch (err) { console.error(err); }
    setSaving(false);
  }

  async function saveEdits() {
    setSaving(true);
    const token = getToken();
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/agent_deliverables?id=eq.${deliverable.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ content, updated_at: new Date().toISOString() }),
      });
      setEditing(false);
    } catch (err) { console.error(err); }
    setSaving(false);
  }

  async function handleExport(format) {
    setExporting(format);
    setShowExport(false);
    try {
      const token = getToken();
      const res = await fetch(`${SUPABASE_URL}/functions/v1/export-deliverable`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ deliverable_id: deliverable.id, format }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Export failed: ${err.error || res.status}`);
        setExporting(null);
        return;
      }
      const data = await res.json();
      if (format === "google_doc" || format === "google_sheet") {
        window.open(data.google_url, "_blank");
      } else if (data.url) {
        const a = document.createElement("a");
        a.href = data.url;
        a.download = data.filename || "export";
        a.click();
      }
    } catch (err) { alert(`Export error: ${err.message}`); }
    setExporting(null);
  }

  function downloadContent() {
    if (deliverable.file_url) {
      window.open(deliverable.file_url, "_blank");
      return;
    }
    const ext = deliverable.file_type || "md";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${deliverable.title.replace(/[^a-zA-Z0-9 ]/g, "").replace(/ +/g, "-").toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-xs text-muted-foreground hover:text-card-foreground">← Back</button>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-card-foreground">{deliverable.title}</h3>
            {deliverable.version > 1 && <span className="text-[10px] text-muted-foreground bg-muted/30 rounded px-1.5 py-0.5">v{deliverable.version}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {daysLeft !== null && !isExpired && (
            <span className={cn("flex items-center gap-1 text-[10px]", daysLeft <= 3 ? "text-amber-500" : "text-muted-foreground")}>
              <Clock className="h-3 w-3" />
              {daysLeft} days left
            </span>
          )}
          <span className={cn("flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium", status.bg, status.text)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
        </div>
      </div>

      {/* Expired banner */}
      {isExpired && (
        <div className="mb-4 rounded-lg border border-muted bg-muted/20 px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">This file has expired and is no longer available for download. The record is kept for reference.</p>
        </div>
      )}

      {/* Review notes from previous round */}
      {deliverable.review_notes && (
        <div className="mb-4 rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3">
          <p className="text-[10px] font-semibold text-orange-500 mb-1">Your Review Notes</p>
          <p className="text-xs text-card-foreground">{deliverable.review_notes}</p>
        </div>
      )}

      {/* Content viewer / editor */}
      <div className="flex-1 overflow-auto rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <div className="flex items-center gap-2">
            {!isExpired && deliverable.content && (
              <>
                <button
                  onClick={() => setEditing(false)}
                  className={cn("flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
                    !editing ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-card-foreground")}
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className={cn("flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
                    editing ? "bg-accent/10 text-accent" : "text-muted-foreground hover:text-card-foreground")}
                >
                  <Edit3 className="h-3 w-3" /> Edit
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editing && (
              <button onClick={saveEdits} disabled={saving} className="rounded bg-accent px-2.5 py-1 text-[10px] font-semibold text-accent-foreground">
                {saving ? "Saving..." : "Save Edits"}
              </button>
            )}
            {!isExpired && (
              <div className="relative">
                <button
                  onClick={() => setShowExport(!showExport)}
                  className="flex items-center gap-1 rounded border border-border px-2 py-1 text-[10px] text-muted-foreground hover:text-card-foreground"
                >
                  {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />}
                  {exporting ? `Exporting ${exporting}...` : "Export"}
                  <ChevronDown className="h-2.5 w-2.5" />
                </button>
                {showExport && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg">
                    <button onClick={() => downloadContent()} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-card-foreground hover:bg-muted/30">
                      <Download className="h-3 w-3 text-muted-foreground" />
                      Download as {deliverable.file_type || "md"}
                    </button>
                    <div className="mx-2 my-1 border-t border-border" />
                    <p className="px-3 py-1 text-[9px] font-semibold text-muted-foreground uppercase">Microsoft</p>
                    {(deliverable.deliverable_type === "lead_list" || deliverable.deliverable_type === "spreadsheet") ? (
                      <>
                        <button onClick={() => handleExport("xlsx")} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-card-foreground hover:bg-muted/30">
                          <span className="text-xs">📊</span> Export as Excel (.xls)
                        </button>
                        <button onClick={() => handleExport("csv")} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-card-foreground hover:bg-muted/30">
                          <span className="text-xs">📄</span> Export as CSV
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleExport("docx")} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-card-foreground hover:bg-muted/30">
                        <span className="text-xs">📝</span> Export as Word (.doc)
                      </button>
                    )}
                    <div className="mx-2 my-1 border-t border-border" />
                    <p className="px-3 py-1 text-[9px] font-semibold text-muted-foreground uppercase">Google</p>
                    {(deliverable.deliverable_type === "lead_list" || deliverable.deliverable_type === "spreadsheet") ? (
                      <button onClick={() => handleExport("google_sheet")} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-card-foreground hover:bg-muted/30">
                        <span className="text-xs">📊</span> Open in Google Sheets
                      </button>
                    ) : (
                      <button onClick={() => handleExport("google_doc")} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] text-card-foreground hover:bg-muted/30">
                        <span className="text-xs">📄</span> Open in Google Docs
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4">
          {deliverable.deliverable_type === 'video' && deliverable.file_url && !isExpired ? (
            <div className="flex flex-col items-center gap-4">
              <video controls className="max-h-[400px] w-full rounded-lg bg-black" src={deliverable.file_url} />
              {deliverable.metadata?.thumbnail_url && (
                <img src={deliverable.metadata.thumbnail_url} alt="Thumbnail" className="h-20 rounded border border-border" />
              )}
            </div>
          ) : deliverable.deliverable_type === 'lead_list' && content ? (
            <div className="overflow-x-auto">
              <LeadListTable content={content} />
            </div>
          ) : deliverable.deliverable_type === 'social_post' && content ? (
            <SocialPostPreview content={content} metadata={deliverable.metadata} />
          ) : editing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] w-full resize-none bg-transparent text-sm text-card-foreground focus:outline-none font-mono leading-relaxed"
            />
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">
              {content || (isExpired ? "File expired — content no longer available." : "No content.")}
            </div>
          )}
        </div>
      </div>

      {/* Review actions */}
      {!isExpired && deliverable.status !== 'approved' && (
        <div className="mt-4 border-t border-border pt-4">
          {showReviewPanel ? (
            <div className="space-y-3">
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add review notes (optional for approval, recommended for revisions)..."
                className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-card-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateStatus("approved")}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-600"
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </button>
                <button
                  onClick={() => updateStatus("revision_requested")}
                  disabled={saving || !reviewNotes.trim()}
                  className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Request Revision
                </button>
                <button
                  onClick={() => updateStatus("rejected")}
                  disabled={saving}
                  className="flex items-center gap-1.5 rounded-lg border border-red-500/30 px-4 py-2 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <X className="h-3.5 w-3.5" /> Reject
                </button>
                <button onClick={() => setShowReviewPanel(false)} className="ml-auto text-xs text-muted-foreground hover:text-card-foreground">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReviewPanel(true)}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground transition-colors hover:bg-accent/90"
            >
              Review this deliverable
            </button>
          )}
        </div>
      )}

      {deliverable.status === 'approved' && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3">
          <Check className="h-4 w-4 text-emerald-500" />
          <p className="text-xs font-medium text-emerald-500">Approved</p>
          {deliverable.review_notes && <p className="text-xs text-emerald-500/70 ml-2">— {deliverable.review_notes}</p>}
        </div>
      )}
    </div>
  );
}

function LeadListTable({ content }) {
  try {
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => line.split(",").map(c => c.trim().replace(/^"|"$/g, '')));

    return (
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-semibold text-muted-foreground">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-muted/10">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-card-foreground">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  } catch {
    return <pre className="text-xs text-card-foreground whitespace-pre-wrap">{content}</pre>;
  }
}

function SocialPostPreview({ content, metadata }) {
  const platform = metadata?.platform || "general";

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-accent/20" />
          <div>
            <p className="text-xs font-semibold text-card-foreground">Kicker</p>
            <p className="text-[9px] text-muted-foreground capitalize">{platform}</p>
          </div>
        </div>
        <div className="whitespace-pre-wrap text-sm leading-relaxed text-card-foreground">{content}</div>
        {metadata?.hashtags && (
          <p className="mt-2 text-xs text-accent">{metadata.hashtags}</p>
        )}
      </div>
    </div>
  );
}

export default DeliverableList;
