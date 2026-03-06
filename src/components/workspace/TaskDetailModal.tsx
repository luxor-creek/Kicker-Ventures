import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, FileText, FileSpreadsheet, Presentation, File, CalendarIcon, User, Plus, X, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";

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

interface Props {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: TeamMember[];
  allDocs: ProjectDoc[];
  userId: string;
  onChatWithMember: (member: TeamMember) => void;
}

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

const DocIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "google_doc": return <FileText className="w-4 h-4 text-blue-600 shrink-0" />;
    case "google_sheet": return <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />;
    case "google_slide": return <Presentation className="w-4 h-4 text-orange-500 shrink-0" />;
    case "pdf": return <File className="w-4 h-4 text-red-600 shrink-0" />;
    default: return <FileText className="w-4 h-4 text-muted-foreground shrink-0" />;
  }
};

const TaskDetailModal = ({ task, open, onOpenChange, teamMembers, allDocs, userId, onChatWithMember }: Props) => {
  const [linkedDocIds, setLinkedDocIds] = useState<string[]>([]);
  const [showDocPicker, setShowDocPicker] = useState(false);

  useEffect(() => {
    if (task && open) loadLinkedDocs();
  }, [task, open]);

  const loadLinkedDocs = async () => {
    if (!task) return;
    const { data } = await supabase
      .from("task_documents")
      .select("document_id")
      .eq("task_id", task.id);
    setLinkedDocIds((data || []).map((d: any) => d.document_id));
  };

  const linkDoc = async (docId: string) => {
    if (!task) return;
    await supabase.from("task_documents").insert({ task_id: task.id, document_id: docId, added_by: userId });
    setLinkedDocIds((prev) => [...prev, docId]);
    setShowDocPicker(false);
  };

  const unlinkDoc = async (docId: string) => {
    if (!task) return;
    await supabase.from("task_documents").delete().eq("task_id", task.id).eq("document_id", docId);
    setLinkedDocIds((prev) => prev.filter((id) => id !== docId));
  };

  if (!task) return null;

  const linkedDocs = allDocs.filter((d) => linkedDocIds.includes(d.id));
  const unlinkableDocs = allDocs.filter((d) => !linkedDocIds.includes(d.id));
  const assignee = teamMembers.find((m) => m.user_id === task.assigned_to);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 overflow-hidden">
        <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
          {/* Left side — Task details + docs */}
          <div className="flex-1 p-6 overflow-y-auto border-r border-border/50">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Status badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium capitalize px-2 py-1 rounded ${
                  task.status === "done" ? "bg-green-100 text-green-700" :
                  task.status === "in_progress" ? "bg-yellow-100 text-yellow-700" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {task.status.replace("_", " ")}
                </span>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Description</p>
                  <p className="text-sm">{task.description}</p>
                </div>
              )}

              {/* Assignee */}
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Assigned To</p>
                {assignee ? (
                  <div className="flex items-center gap-2">
                    {assignee.avatar_url ? (
                      <img src={assignee.avatar_url} alt={assignee.full_name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-semibold">{assignee.full_name?.[0]}</span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium">{assignee.full_name}</p>
                      {assignee.title && <p className="text-xs text-muted-foreground">{assignee.title}</p>}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unassigned</p>
                )}
              </div>

              {/* Deadline */}
              {task.deadline && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Deadline</p>
                  <p className="text-sm flex items-center gap-1.5">
                    <CalendarIcon className="w-3.5 h-3.5" />
                    {format(new Date(task.deadline), "PPP")}
                  </p>
                </div>
              )}

              {/* Linked Documents */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Linked Documents</p>
                  <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setShowDocPicker(!showDocPicker)}>
                    <Plus className="w-3 h-3 mr-1" /> Link Doc
                  </Button>
                </div>

                {showDocPicker && unlinkableDocs.length > 0 && (
                  <Card className="p-2 mb-2 space-y-1">
                    <p className="text-xs text-muted-foreground mb-1">Select a document to link:</p>
                    <ScrollArea className="max-h-32">
                      {unlinkableDocs.map((doc) => (
                        <button
                          key={doc.id}
                          onClick={() => linkDoc(doc.id)}
                          className="w-full text-left text-sm px-2 py-1.5 rounded hover:bg-muted flex items-center gap-2 transition-colors"
                        >
                          <DocIcon type={doc.doc_type} />
                          <span className="truncate">{doc.title}</span>
                        </button>
                      ))}
                    </ScrollArea>
                  </Card>
                )}

                {linkedDocs.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No documents linked to this task yet.</p>
                ) : (
                  <div className="space-y-1">
                    {linkedDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between group rounded px-2 py-1.5 hover:bg-muted/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <DocIcon type={doc.doc_type} />
                          {doc.external_url || doc.file_url ? (
                            <a href={doc.external_url || doc.file_url || "#"} target="_blank" rel="noopener noreferrer" className="text-sm hover:underline truncate">{doc.title}</a>
                          ) : (
                            <span className="text-sm truncate">{doc.title}</span>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100" onClick={() => unlinkDoc(doc.id)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side — Team members with chat buttons */}
          <div className="w-full md:w-64 shrink-0 p-4 overflow-y-auto bg-muted/30">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-3">Team</p>
            <div className="space-y-2">
              {teamMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  {member.avatar_url ? (
                    <img src={member.avatar_url} alt={member.full_name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold">{member.full_name?.[0] || "?"}</span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{member.full_name}</p>
                    {member.title && <p className="text-[10px] text-muted-foreground truncate">{member.title}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 shrink-0"
                    title={`Chat with ${member.full_name}`}
                    onClick={() => onChatWithMember(member)}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              {teamMembers.length === 0 && <p className="text-xs text-muted-foreground">No team members.</p>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaskDetailModal;
export { AI_AGENT_IDS, AGENT_ROLE_MAP };
