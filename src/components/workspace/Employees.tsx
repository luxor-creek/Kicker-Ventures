import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { UserPlus, X, User, Mail, Phone, Briefcase, Pencil, Trash2, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ConfirmDialog";

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  title: string;
  phone: string;
  avatar_url: string | null;
  created_at: string;
}

interface Props {
  isAdmin: boolean;
  currentUserId: string;
}




const Employees = ({ isAdmin, currentUserId }: Props) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [open, setOpen] = useState(false);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    if (data) setProfiles(data);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const addEmployee = async () => {
    if (!email || !password || !name) return;
    setAdding(true);
    setError("");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setError("Not authenticated"); setAdding(false); return; }
    const res = await supabase.functions.invoke("add-employee", { body: { email, password, full_name: name } });
    if (res.error) { setError(res.error.message || "Failed to create employee"); setAdding(false); return; }
    setName(""); setEmail(""); setPassword("");
    setOpen(false); setAdding(false);
    fetchProfiles();
  };

  const openEdit = (p: Profile) => {
    setEditProfile({ ...p });
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editProfile) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: editProfile.full_name,
      title: editProfile.title,
      phone: editProfile.phone,
    }).eq("user_id", editProfile.user_id);
    if (error) { toast({ title: "Error saving", variant: "destructive" }); }
    else { toast({ title: "Profile updated!" }); }
    setSaving(false);
    setEditOpen(false);
    fetchProfiles();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, userId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    const filePath = `${userId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);
    if (uploadError) { toast({ title: "Upload failed", variant: "destructive" }); setUploadingAvatar(false); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);
    await supabase.from("profiles").update({ avatar_url: urlData.publicUrl }).eq("user_id", userId);
    if (editProfile && editProfile.user_id === userId) {
      setEditProfile({ ...editProfile, avatar_url: urlData.publicUrl });
    }
    toast({ title: "Photo uploaded!" });
    setUploadingAvatar(false);
    fetchProfiles();
  };

  const confirmDeleteEmployee = (userId: string) => {
    setDeleteTargetId(userId);
    setDeleteConfirmOpen(true);
  };

  const deleteEmployee = async () => {
    if (!deleteTargetId) return;
    await supabase.from("project_members").delete().eq("user_id", deleteTargetId);
    await supabase.from("user_roles").delete().eq("user_id", deleteTargetId);
    toast({ title: "Employee removed from projects" });
    setDeleteConfirmOpen(false);
    setDeleteTargetId(null);
    fetchProfiles();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Team Members</h2>
        {isAdmin && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><UserPlus className="w-4 h-4 mr-1" /> Add Employee</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Full Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" /></div>
                <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" /></div>
                <div><Label>Password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" /></div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button onClick={addEmployee} disabled={adding} className="w-full">{adding ? "Creating…" : "Create Account"}</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => (
          <Card key={p.user_id} className="p-5">
            <div className="flex items-start gap-4">
              <div className="relative">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.full_name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.full_name || "—"}</p>
                {p.title && <p className="text-xs text-primary font-medium">{p.title}</p>}
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" />{p.email}</p>
                  {p.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Phone className="w-3 h-3" />{p.phone}</p>}
                </div>
                </div>
              {isAdmin && (
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(p)}><Pencil className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => confirmDeleteEmployee(p.user_id)}><Trash2 className="w-3 h-3" /></Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Team Member</DialogTitle></DialogHeader>
          {editProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {editProfile.avatar_url ? (
                    <img src={editProfile.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center"><User className="w-7 h-7 text-primary" /></div>
                  )}
                  <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer">
                    <Camera className="w-3 h-3 text-primary-foreground" />
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarUpload(e, editProfile.user_id)} disabled={uploadingAvatar} />
                  </label>
                </div>
                <div>
                  <p className="font-medium text-sm">{editProfile.full_name}</p>
                  <p className="text-xs text-muted-foreground">{editProfile.email}</p>
                </div>
              </div>
              <div><Label>Full Name</Label><Input value={editProfile.full_name} onChange={(e) => setEditProfile({ ...editProfile, full_name: e.target.value })} /></div>
              <div><Label>Title / Role</Label><Input value={editProfile.title} onChange={(e) => setEditProfile({ ...editProfile, title: e.target.value })} placeholder="e.g. Marketing Manager" /></div>
              <div><Label>Phone</Label><Input value={editProfile.phone} onChange={(e) => setEditProfile({ ...editProfile, phone: e.target.value })} placeholder="+1 555 123 4567" /></div>
              <Button onClick={saveEdit} disabled={saving} className="w-full">{saving ? "Saving…" : "Save Changes"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={deleteEmployee}
      />
    </div>
  );
};

export default Employees;
