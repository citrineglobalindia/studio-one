import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Users, UserPlus, Mail, Shield, Smartphone, Monitor,
  MoreVertical, Trash2, Edit3, Loader2, Search, BadgeCheck,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useRole, ALL_ROLES, type AppRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Surface = "web" | "pwa" | "both";
type MemberRole = AppRole | "owner";

interface MemberRow {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  login_surface: Surface;
  invited_email: string | null;
  invited_at: string | null;
  joined_at: string | null;
  created_at: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const SURFACE_META: Record<Surface, { label: string; icon: typeof Monitor; color: string }> = {
  web: { label: "Web only", icon: Monitor, color: "text-sky-500 bg-sky-500/10 border-sky-500/30" },
  pwa: { label: "Mobile only", icon: Smartphone, color: "text-violet-500 bg-violet-500/10 border-violet-500/30" },
  both: { label: "Web + Mobile", icon: BadgeCheck, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
};

const ROLE_BADGE: Record<string, string> = {
  owner: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  admin: "bg-primary/15 text-primary border-primary/30",
  manager: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  hr: "bg-cyan-500/15 text-cyan-500 border-cyan-500/30",
  accounts: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  photographer: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  videographer: "bg-rose-500/15 text-rose-500 border-rose-500/30",
  editor: "bg-purple-500/15 text-purple-500 border-purple-500/30",
  telecaller: "bg-green-500/15 text-green-500 border-green-500/30",
  vendor: "bg-slate-500/15 text-slate-400 border-slate-500/30",
};

interface InviteForm {
  email: string;
  display_name: string;
  role: AppRole;
  login_surface: Surface;
}

const blankInvite: InviteForm = {
  email: "",
  display_name: "",
  role: "manager",
  login_surface: "both",
};

async function callManageMember(token: string, body: Record<string, unknown>) {
  const url =
    (import.meta.env.VITE_SUPABASE_URL || "https://tivlznrjwtdtjmmfrczo.supabase.co") +
    "/functions/v1/manage-member";
  const anon =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ||
    "";
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
    body: JSON.stringify(body),
  });
  const json = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(json.error || `HTTP ${resp.status}`);
  return json;
}

export default function MembersPage() {
  const { user } = useAuth();
  const { organization } = useOrg();
  const { isAdmin, currentRole } = useRole();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const [search, setSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editing, setEditing] = useState<MemberRow | null>(null);
  const [form, setForm] = useState<InviteForm>(blankInvite);

  const canManage = isAdmin || currentRole === "manager";

  // Load members + their profile/email join. RLS already restricts to org.
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["org-members", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<MemberRow[]> => {
      const { data: rows, error } = await supabase
        .from("organization_members")
        .select(`
          id, organization_id, user_id, role, login_surface,
          invited_email, invited_at, joined_at, created_at
        `)
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!rows || rows.length === 0) return [];

      // Profile lookup for display name + avatar
      const userIds = rows.map((r) => r.user_id).filter(Boolean);
      const { data: profs } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);

      const profMap = new Map(
        (profs || []).map((p) => [p.user_id, p])
      );

      return rows.map((r) => {
        const p = profMap.get(r.user_id);
        return {
          ...r,
          login_surface: (r.login_surface as Surface) || "both",
          role: r.role as MemberRole,
          display_name: p?.display_name ?? null,
          avatar_url: p?.avatar_url ?? null,
          email: r.invited_email ?? null,
        };
      });
    },
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return members;
    const q = search.toLowerCase();
    return members.filter(
      (m) =>
        (m.email || "").toLowerCase().includes(q) ||
        (m.display_name || "").toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    );
  }, [members, search]);

  const totals = useMemo(() => {
    const t = { total: members.length, web: 0, pwa: 0, both: 0 };
    for (const m of members) t[m.login_surface] += 1;
    return t;
  }, [members]);

  const inviteMut = useMutation({
    mutationFn: async (payload: InviteForm) => {
      if (!orgId) throw new Error("No studio loaded");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      return callManageMember(token, {
        action: "invite",
        organization_id: orgId,
        email: payload.email,
        display_name: payload.display_name || undefined,
        role: payload.role,
        login_surface: payload.login_surface,
      });
    },
    onSuccess: (res) => {
      toast.success(
        res.was_existing_user
          ? "Existing user added to studio. They'll see it on next login."
          : "Member invited — password reset email sent.",
      );
      qc.invalidateQueries({ queryKey: ["org-members", orgId] });
      setInviteOpen(false);
      setForm(blankInvite);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMut = useMutation({
    mutationFn: async (vars: { memberId: string; role?: MemberRole; surface?: Surface }) => {
      if (!orgId) throw new Error("No studio loaded");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      return callManageMember(token, {
        action: "update",
        organization_id: orgId,
        member_id: vars.memberId,
        role: vars.role,
        login_surface: vars.surface,
      });
    },
    onSuccess: () => {
      toast.success("Member updated");
      qc.invalidateQueries({ queryKey: ["org-members", orgId] });
      setEditing(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeMut = useMutation({
    mutationFn: async (memberId: string) => {
      if (!orgId) throw new Error("No studio loaded");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      return callManageMember(token, {
        action: "remove",
        organization_id: orgId,
        member_id: memberId,
      });
    },
    onSuccess: () => {
      toast.success("Member removed");
      qc.invalidateQueries({ queryKey: ["org-members", orgId] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Reset form whenever the dialog opens
  useEffect(() => {
    if (inviteOpen) setForm(blankInvite);
  }, [inviteOpen]);

  if (!canManage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center bg-muted/20">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">Admins only</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Only the studio owner, admins and managers can invite or manage members.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Studio Members</h1>
            <p className="text-sm text-muted-foreground">
              Invite teammates, choose their role and decide where they sign in.
            </p>
          </div>
        </div>
        <Button onClick={() => setInviteOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <UserPlus className="h-4 w-4" /> Invite Member
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total members", value: totals.total, icon: Users, color: "text-primary bg-primary/10" },
          { label: "Web access", value: totals.web, icon: Monitor, color: "text-sky-500 bg-sky-500/10" },
          { label: "Mobile access", value: totals.pwa, icon: Smartphone, color: "text-violet-500 bg-violet-500/10" },
          { label: "Both surfaces", value: totals.both, icon: BadgeCheck, color: "text-emerald-500 bg-emerald-500/10" },
        ].map((k) => (
          <Card key={k.label} className="p-4 bg-card">
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", k.color)}>
                <k.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground leading-none">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      {/* Member list */}
      <Card className="overflow-hidden">
        <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 px-4 py-2.5 border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div>Member</div>
          <div>Role</div>
          <div>Login surface</div>
          <div className="text-right">Actions</div>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading members…
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No members match your search.
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((m, i) => {
              const surface = SURFACE_META[m.login_surface];
              const isOwnerRow = m.role === "owner";
              const isYou = m.user_id === user?.id;
              const SurfaceIcon = surface.icon;

              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="grid grid-cols-[1.5fr_1fr_1fr_120px] gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {(m.display_name || m.email || "?").substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {m.display_name || m.email || "Unknown"}
                        </p>
                        {isYou && (
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-primary/30 text-primary">
                            You
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {m.email || "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize text-xs px-2.5 py-0.5",
                        ROLE_BADGE[m.role] || "bg-muted text-muted-foreground"
                      )}
                    >
                      {m.role}
                    </Badge>
                  </div>

                  <div>
                    <Badge
                      variant="outline"
                      className={cn("text-xs px-2.5 py-0.5 inline-flex items-center gap-1.5", surface.color)}
                    >
                      <SurfaceIcon className="h-3 w-3" />
                      {surface.label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-end">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8" disabled={isOwnerRow && !isYou}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditing(m)} disabled={isOwnerRow}>
                          <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit role / surface
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          disabled={isOwnerRow || isYou}
                          onClick={() => {
                            if (confirm(`Remove ${m.display_name || m.email}?`)) {
                              removeMut.mutate(m.id);
                            }
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove from studio
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Invite Member
            </DialogTitle>
            <DialogDescription>
              We'll create the user, attach them to your studio with the role you choose, and email a password-reset link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input
                type="email"
                placeholder="teammate@yourstudio.com"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Display name (optional)</Label>
              <Input
                placeholder="Arjun Mehta"
                value={form.display_name}
                onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Role *</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((p) => ({ ...p, role: v as AppRole }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Determines which dashboard and modules they see by default.
                Per-role module access can be tuned in Access Control.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Login surface *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(SURFACE_META) as Surface[]).map((s) => {
                  const meta = SURFACE_META[s];
                  const SI = meta.icon;
                  const active = form.login_surface === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, login_surface: s }))}
                      className={cn(
                        "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all",
                        active
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      <SI className="h-4 w-4" />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Web blocks the mobile app. Mobile blocks the desktop dashboard. Both lets them switch.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={() => inviteMut.mutate(form)}
              disabled={!form.email.trim() || inviteMut.isPending}
              className="gap-2"
            >
              {inviteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Send invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" /> Edit Member
            </DialogTitle>
            <DialogDescription>
              Update {editing?.display_name || editing?.email}'s role and login surface.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <EditMemberForm
              member={editing}
              onSave={(role, surface) =>
                updateMut.mutate({ memberId: editing.id, role, surface })
              }
              saving={updateMut.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditMemberForm({
  member,
  onSave,
  saving,
}: {
  member: MemberRow;
  onSave: (role: MemberRole, surface: Surface) => void;
  saving: boolean;
}) {
  const [role, setRole] = useState<MemberRole>(member.role);
  const [surface, setSurface] = useState<Surface>(member.login_surface);

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as MemberRole)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {ALL_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Login surface</Label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(SURFACE_META) as Surface[]).map((s) => {
              const meta = SURFACE_META[s];
              const SI = meta.icon;
              const active = surface === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSurface(s)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all",
                    active
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40"
                  )}
                >
                  <SI className="h-4 w-4" />
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(role, surface)} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
