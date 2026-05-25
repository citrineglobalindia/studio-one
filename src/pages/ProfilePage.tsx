import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, MapPin, Calendar, Shield, Edit3,
  Save, X, Loader2, Camera, Building2, BadgeCheck, LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useRole, ALL_ROLES } from "@/contexts/RoleContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

function initials(name: string) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const { organization } = useOrg();
  const { currentRole } = useRole();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ display_name: "", phone: "", bio: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle();
      setProfile(data);
      setForm({
        display_name: (data as any)?.display_name || "",
        phone: (data as any)?.phone || "",
        bio: (data as any)?.bio || "",
      });
      setLoading(false);
    })();
  }, [user]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        display_name: form.display_name.trim() || null,
        phone: form.phone.trim() || null,
      } as any).eq("user_id", user.id);
      if (error) throw error;
      setProfile((p: any) => ({ ...p, display_name: form.display_name, phone: form.phone }));
      setEditing(false);
      toast.success("Profile updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "User";
  const roleLabel = ALL_ROLES.find((r) => r.value === currentRole)?.label || currentRole;

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-rose-400/10 to-amber-300/10" />
        <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-rose-400/15 blur-3xl" />

        <div className="relative p-6 md:p-8 grid grid-cols-1 md:grid-cols-[auto,1fr,auto] gap-6 items-center">
          {/* Avatar */}
          <div className="relative shrink-0 mx-auto md:mx-0">
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-3xl bg-background/70 backdrop-blur border-4 border-background shadow-2xl flex items-center justify-center">
              <span className="text-3xl md:text-4xl font-bold text-primary tracking-tight">{initials(displayName)}</span>
            </div>
            <button className="absolute -bottom-1 -right-1 h-9 w-9 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg border-4 border-background hover:scale-105 transition-transform">
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          {/* Identity */}
          <div className="min-w-0 text-center md:text-left">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-medium">My profile</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight mt-1">{displayName}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2 justify-center md:justify-start">
              <Badge variant="outline" className="text-xs gap-1 bg-primary/10 border-primary/30 text-primary capitalize">
                <BadgeCheck className="h-3 w-3" /> {roleLabel}
              </Badge>
              {organization?.name && (
                <Badge variant="outline" className="text-xs gap-1 bg-card">
                  <Building2 className="h-3 w-3" /> {organization.name}
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-3 text-xs text-muted-foreground justify-center md:justify-start">
              {user?.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</span>}
              {profile?.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{profile.phone}</span>}
            </div>
          </div>
          {/* Edit toggle */}
          <div className="flex md:flex-col items-center md:items-end gap-2 shrink-0">
            {!editing ? (
              <Button onClick={() => setEditing(true)} variant="outline" className="gap-2"><Edit3 className="h-3.5 w-3.5" /> Edit profile</Button>
            ) : (
              <div className="flex gap-1.5">
                <Button onClick={() => setEditing(false)} variant="ghost" size="sm"><X className="h-3.5 w-3.5" /></Button>
                <Button onClick={save} size="sm" className="gap-1.5" disabled={saving}>
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Save
                </Button>
              </div>
            )}
            <Button onClick={async () => { await signOut(); navigate("/auth"); }} variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 gap-1.5">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </Button>
          </div>
        </div>
      </motion.div>

      {/* DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border/80 bg-card p-5 space-y-3.5 border-l-[3px] border-l-primary">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-muted/40 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <h4 className="text-sm font-semibold text-foreground tracking-tight">Personal details</h4>
          </div>

          <Field label="Display name">
            {editing
              ? <Input value={form.display_name} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} />
              : <ReadValue v={profile?.display_name} />
            }
          </Field>

          <Field label="Email">
            <ReadValue v={user?.email} />
            <p className="text-[10px] text-muted-foreground mt-1">Email cannot be changed here</p>
          </Field>

          <Field label="Phone">
            {editing
              ? <Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} placeholder="+91 98765 43210" />
              : <ReadValue v={profile?.phone} />
            }
          </Field>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="rounded-xl border border-border/80 bg-card p-5 space-y-3.5 border-l-[3px] border-l-emerald-500">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-muted/40 flex items-center justify-center">
              <Shield className="h-4 w-4 text-emerald-500" />
            </div>
            <h4 className="text-sm font-semibold text-foreground tracking-tight">Role &amp; access</h4>
          </div>

          <Field label="Current role"><ReadValue v={roleLabel} /></Field>
          <Field label="Studio"><ReadValue v={organization?.name || "—"} /></Field>
          <Field label="Member since">
            <ReadValue v={profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" }) : "—"} />
          </Field>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] uppercase tracking-wide text-muted-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}

function ReadValue({ v }: { v: any }) {
  if (!v) return <p className="text-sm text-muted-foreground/60">—</p>;
  return <p className="text-sm text-foreground break-words">{String(v)}</p>;
}
