import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Plus, FileText, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Doc {
  id: string;
  title: string;
  content: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Props {
  userId: string;
  isAdmin: boolean;
}

const Documents = ({ userId, isAdmin }: Props) => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Doc | null>(null);
  const [openNew, setOpenNew] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchDocs = async () => {
    const { data } = await supabase.from("documents").select("*").order("updated_at", { ascending: false });
    if (data) setDocs(data);
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
    fetchDocs();
    fetchProfiles();
  }, []);

  const createDoc = async () => {
    if (!title.trim()) return;
    setSaving(true);
    await supabase.from("documents").insert({ title: title.trim(), content: content.trim(), created_by: userId });
    setTitle("");
    setContent("");
    setOpenNew(false);
    setSaving(false);
    fetchDocs();
  };

  const updateDoc = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from("documents").update({ title: selected.title, content: selected.content }).eq("id", selected.id);
    setSaving(false);
    fetchDocs();
  };

  const confirmDelete = (id: string) => {
    setDeleteTargetId(id);
    setDeleteConfirmOpen(true);
  };

  const deleteDoc = async () => {
    if (!deleteTargetId) return;
    await supabase.from("documents").delete().eq("id", deleteTargetId);
    if (selected?.id === deleteTargetId) setSelected(null);
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
    fetchDocs();
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-10rem)]">
      {/* Sidebar */}
      <div className="w-56 shrink-0 space-y-2 overflow-auto">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Documents</p>
          <Dialog open={openNew} onOpenChange={setOpenNew}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6"><Plus className="w-3 h-3" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Document</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title" />
                <Textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Content…" rows={6} />
                <Button onClick={createDoc} disabled={saving} className="w-full">{saving ? "Creating…" : "Create"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        {docs.map((doc) => (
          <button
            key={doc.id}
            onClick={() => setSelected(doc)}
            className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
              selected?.id === doc.id ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-3 h-3 shrink-0" />
            <span className="truncate">{doc.title}</span>
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col border border-border/50 rounded-lg overflow-hidden">
        {selected ? (
          <>
            <div className="border-b border-border/50 px-4 py-2 flex items-center justify-between">
              <Input
                value={selected.title}
                onChange={(e) => setSelected({ ...selected, title: e.target.value })}
                className="border-0 font-medium text-sm p-0 h-auto focus-visible:ring-0"
              />
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" onClick={updateDoc} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                {isAdmin && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => confirmDelete(selected.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={selected.content || ""}
              onChange={(e) => setSelected({ ...selected, content: e.target.value })}
              className="flex-1 border-0 rounded-none resize-none focus-visible:ring-0 p-4"
              placeholder="Start writing…"
            />
            <div className="border-t border-border/50 px-4 py-1">
              <p className="text-[10px] text-muted-foreground">By {profiles[selected.created_by] || "Unknown"}</p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Select a document or create a new one
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={deleteDoc}
      />
    </div>
  );
};

export default Documents;
