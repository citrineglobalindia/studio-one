import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Users, UserPlus, Mail, Phone, Shield, Smartphone, Monitor, BadgeCheck,
  MoreVertical, Trash2, Edit3, Loader2, Search, Star, IndianRupee, Zap,
  Camera, Video, LayoutGrid, List, KeyRound, Send, Eye, EyeOff,
  Copy, MailOpen, Check,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { useRole, ALL_ROLES, getCreatableRoles, type AppRole } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────
type Surface = "web" | "pwa" | "both";
type UserRole = AppRole | "owner";

/** Unified user row — joins organization_members + team_members + profiles. */
interface StudioUser {
  // org membership (RBAC)
  member_id: string | null;          // organization_members.id
  user_id: string | null;            // auth.users.id
  org_role: UserRole | null;
  login_surface: Surface;
  invited_email: string | null;

  // team profile (operational)
  team_member_id: string | null;     // team_members.id
  full_name: string;
  role: AppRole;                     // canonical operational role
  email: string | null;
  phone: string | null;
  daily_rate: number;
  experience_years: number;
  specialties: string[];
  rating: number;
  availability: string;
  notes: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}

interface UserForm {
  email: string;
  display_name: string;
  role: AppRole;
  login_surface: Surface;
  send_invite: boolean;
  phone: string;
  daily_rate: string;
  experience_years: string;
  specialties: string;
  notes: string;
}

const blankForm: UserForm = {
  email: "",
  display_name: "",
  role: "telecaller",
  login_surface: "both",
  send_invite: true,
  phone: "",
  daily_rate: "",
  experience_years: "",
  specialties: "",
  notes: "",
};

const SURFACE_META: Record<Surface, { label: string; short: string; icon: typeof Monitor; color: string }> = {
  web: { label: "Web only", short: "Web", icon: Monitor, color: "text-sky-500 bg-sky-500/10 border-sky-500/30" },
  pwa: { label: "Mobile only", short: "Mobile", icon: Smartphone, color: "text-violet-500 bg-violet-500/10 border-violet-500/30" },
  both: { label: "Web + Mobile", short: "Both", icon: BadgeCheck, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30" },
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

const ROLE_ICON: Record<string, typeof Camera> = {
  photographer: Camera,
  videographer: Video,
  editor: Edit3,
};

// ─── Edge function caller ─────────────────────────────────────────────────
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

// ─── Main page ────────────────────────────────────────────────────────────
export default function TeamPage() {
  const { user } = useAuth();
  const { organization } = useOrg();
  const { isAdmin, currentRole } = useRole();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterSurface, setFilterSurface] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<StudioUser | null>(null);
  const [detail, setDetail] = useState<StudioUser | null>(null);
  const [resetUser, setResetUser] = useState<StudioUser | null>(null);
  const [form, setForm] = useState<UserForm>(blankForm);

  const canManage = isAdmin || currentRole === "administrator";

  const { data: studioUsers = [], isLoading } = useQuery({
    queryKey: ["studio-users", orgId],
    enabled: !!orgId,
    queryFn: async (): Promise<StudioUser[]> => {
      // Pull both tables in parallel + profiles, then merge by (user_id, team_member_id).
      const [membersRes, teamRes] = await Promise.all([
        supabase
          .from("organization_members")
          .select("id, user_id, role, login_surface, invited_email")
          .eq("organization_id", orgId!),
        supabase
          .from("team_members")
          .select("*")
          .eq("organization_id", orgId!),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (teamRes.error) throw teamRes.error;

      const members = membersRes.data || [];
      const teams = teamRes.data || [];

      const userIds = [...new Set([
        ...members.map((m) => m.user_id).filter(Boolean),
        ...teams.map((t) => t.user_id).filter(Boolean),
      ])];

      const { data: profs } = userIds.length
        ? await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", userIds)
        : { data: [] as { user_id: string; display_name: string | null; avatar_url: string | null }[] };

      const profMap = new Map((profs || []).map((p) => [p.user_id, p]));
      const memberMap = new Map(members.filter((m) => m.user_id).map((m) => [m.user_id, m]));
      const teamByUser = new Map(teams.filter((t) => t.user_id).map((t) => [t.user_id, t]));
      const usedTeamIds = new Set<string>();

      const rows: StudioUser[] = [];

      // 1) every org member — join with team profile if linked
      for (const m of members) {
        if (!m.user_id) continue;
        const t = teamByUser.get(m.user_id);
        const p = profMap.get(m.user_id);
        if (t) usedTeamIds.add(t.id);
        rows.push({
          member_id: m.id,
          user_id: m.user_id,
          org_role: (m.role as UserRole) ?? null,
          login_surface: ((m.login_surface as Surface) || "both"),
          invited_email: m.invited_email ?? null,
          team_member_id: t?.id ?? null,
          full_name: t?.full_name || p?.display_name || m.invited_email || "Unknown",
          role: ((t?.role as AppRole) || (m.role as AppRole) || "editor"),
          email: t?.email || m.invited_email || null,
          phone: t?.phone || null,
          daily_rate: Number(t?.daily_rate || 0),
          experience_years: Number(t?.experience_years || 0),
          specialties: (t?.specialties as string[]) || [],
          rating: Number(t?.rating || 0),
          availability: (t?.availability as string) || "available",
          notes: t?.notes || null,
          display_name: p?.display_name || null,
          avatar_url: p?.avatar_url || null,
        });
      }

      // 2) team members without auth (contractors) — show with "no login" badge
      for (const t of teams) {
        if (t.user_id && memberMap.has(t.user_id)) continue; // already included above
        if (usedTeamIds.has(t.id)) continue;
        rows.push({
          member_id: null,
          user_id: t.user_id || null,
          org_role: null,
          login_surface: "both",
          invited_email: null,
          team_member_id: t.id,
          full_name: t.full_name,
          role: t.role as AppRole,
          email: t.email,
          phone: t.phone,
          daily_rate: Number(t.daily_rate || 0),
          experience_years: Number(t.experience_years || 0),
          specialties: (t.specialties as string[]) || [],
          rating: Number(t.rating || 0),
          availability: t.availability || "available",
          notes: t.notes,
        });
      }

      return rows.sort((a, b) => a.full_name.localeCompare(b.full_name));
    },
  });

  const filtered = useMemo(() => {
    return studioUsers.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch = !q || `${u.full_name} ${u.email || ""} ${u.phone || ""} ${u.role}`.toLowerCase().includes(q);
      const matchRole = filterRole === "all" || u.role === filterRole;
      const matchSurface = filterSurface === "all" || u.login_surface === filterSurface;
      return matchSearch && matchRole && matchSurface;
    });
  }, [studioUsers, search, filterRole, filterSurface]);

  const totals = useMemo(() => ({
    total: studioUsers.length,
    withLogin: studioUsers.filter((u) => !!u.user_id).length,
    web: studioUsers.filter((u) => u.user_id && u.login_surface === "web").length,
    pwa: studioUsers.filter((u) => u.user_id && u.login_surface === "pwa").length,
    both: studioUsers.filter((u) => u.user_id && u.login_surface === "both").length,
  }), [studioUsers]);

  const inviteMut = useMutation({
    mutationFn: async (payload: UserForm) => {
      if (!orgId) throw new Error("No studio loaded");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      return callManageMember(token, {
        action: "invite",
        organization_id: orgId,
        email: payload.email.trim() || undefined,
        display_name: payload.display_name.trim() || undefined,
        role: payload.role,
        login_surface: payload.login_surface,
        send_invite: payload.send_invite,
        phone: payload.phone.trim() || null,
        daily_rate: payload.daily_rate ? Number(payload.daily_rate) : null,
        experience_years: payload.experience_years ? Number(payload.experience_years) : null,
        specialties: payload.specialties
          ? payload.specialties.split(",").map((s) => s.trim()).filter(Boolean)
          : null,
        notes: payload.notes.trim() || null,
      });
    },
    onSuccess: (res) => {
      const msg = res.has_login
        ? res.was_existing_user
          ? "Existing user attached to studio."
          : "User invited — password reset email sent."
        : "Contractor record added (no login).";
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["studio-users", orgId] });
      qc.invalidateQueries({ queryKey: ["team_members", orgId] }); // legacy hook
      setAddOpen(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: async (vars: {
      memberId: string | null;
      teamMemberId: string | null;
      role: AppRole;
      surface: Surface;
      patch: Partial<UserForm>;
    }) => {
      if (!orgId) throw new Error("No studio loaded");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      return callManageMember(token, {
        action: "update",
        organization_id: orgId,
        member_id: vars.memberId,
        team_member_id: vars.teamMemberId,
        role: vars.role,
        login_surface: vars.surface,
        display_name: vars.patch.display_name?.trim() || undefined,
        phone: vars.patch.phone !== undefined ? (vars.patch.phone.trim() || null) : undefined,
        daily_rate: vars.patch.daily_rate !== undefined
          ? (vars.patch.daily_rate ? Number(vars.patch.daily_rate) : null)
          : undefined,
        experience_years: vars.patch.experience_years !== undefined
          ? (vars.patch.experience_years ? Number(vars.patch.experience_years) : null)
          : undefined,
        specialties: vars.patch.specialties !== undefined
          ? (vars.patch.specialties.split(",").map((s) => s.trim()).filter(Boolean))
          : undefined,
        notes: vars.patch.notes !== undefined ? (vars.patch.notes.trim() || null) : undefined,
      });
    },
    onSuccess: () => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["studio-users", orgId] });
      qc.invalidateQueries({ queryKey: ["team_members", orgId] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resetMut = useMutation({
    mutationFn: async (vars: { user: StudioUser; mode: "email" | "set"; password?: string }) => {
      if (!orgId) throw new Error("No studio loaded");
      if (!vars.user.email) throw new Error("This user has no email on file.");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");

      // Existing auth user → straight reset
      if (vars.user.user_id) {
        return callManageMember(token, {
          action: "reset_password",
          organization_id: orgId,
          target_user_id: vars.user.user_id,
          member_id: vars.user.member_id,
          mode: vars.mode,
          new_password: vars.password,
        });
      }

      // No auth user yet (legacy contractor) → invite + optional initial password.
      // We pass link_team_member_id so the existing team_members row is upgraded
      // in place rather than duplicated.
      const res = await callManageMember(token, {
        action: "invite",
        organization_id: orgId,
        email: vars.user.email,
        display_name: vars.user.full_name,
        role: vars.user.role,
        login_surface: "both",
        send_invite: vars.mode === "email",
        initial_password: vars.mode === "set" ? vars.password : undefined,
        link_team_member_id: vars.user.team_member_id || undefined,
      });
      return { ...res, mode: vars.mode, was_promotion: true };
    },
    onSuccess: (res: any, vars) => {
      const wasPromotion = res.was_promotion === true;
      if (vars.mode === "email") {
        toast.success(
          wasPromotion
            ? `Login created. Reset email sent to ${res.email}.`
            : `Password-reset email sent to ${res.email}.`
        );
      } else {
        toast.success(
          wasPromotion
            ? `Login created for ${res.email}. Password copied to clipboard.`
            : `New password set for ${res.email}. Copied to your clipboard — paste it to share.`,
          { duration: 6000 }
        );
      }
      qc.invalidateQueries({ queryKey: ["studio-users", orgId] });
      qc.invalidateQueries({ queryKey: ["team_members", orgId] });
      setResetUser(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeMut = useMutation({
    mutationFn: async (u: StudioUser) => {
      if (!orgId) throw new Error("No studio loaded");
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error("Not signed in");
      return callManageMember(token, {
        action: "remove",
        organization_id: orgId,
        member_id: u.member_id,
        team_member_id: u.team_member_id,
      });
    },
    onSuccess: () => {
      toast.success("User removed");
      qc.invalidateQueries({ queryKey: ["studio-users", orgId] });
      qc.invalidateQueries({ queryKey: ["team_members", orgId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Reset form when add dialog opens
  useEffect(() => {
    if (addOpen) {
      const allowed = getCreatableRoles(currentRole);
      const next: typeof blankForm = {
        ...blankForm,
        role: (allowed.includes(blankForm.role) ? blankForm.role : (allowed[0] ?? blankForm.role)) as AppRole,
      };
      setForm(next);
    }
  }, [addOpen, currentRole]);

  if (!canManage) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8 text-center bg-muted/20">
          <Shield className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="text-lg font-semibold">Admins only</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Only the studio owner, admins and managers can manage users.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <Users className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Studio Users</h1>
            <p className="text-sm text-muted-foreground">
              Everyone in your studio. Invite by email, pick their role and decide where they sign in.
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-2 shadow-lg shadow-primary/20">
          <UserPlus className="h-4 w-4" /> Add User
        </Button>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total users", value: totals.total, icon: Users, color: "text-primary bg-primary/10" },
          { label: "With login", value: totals.withLogin, icon: KeyRound, color: "text-emerald-500 bg-emerald-500/10" },
          { label: "Web only", value: totals.web, icon: Monitor, color: "text-sky-500 bg-sky-500/10" },
          { label: "Mobile only", value: totals.pwa, icon: Smartphone, color: "text-violet-500 bg-violet-500/10" },
          { label: "Both surfaces", value: totals.both, icon: BadgeCheck, color: "text-emerald-500 bg-emerald-500/10" },
        ].map((k) => (
          <Card key={k.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", k.color)}>
                <k.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-foreground leading-none">{k.value}</p>
                <p className="text-xs text-muted-foreground mt-1 truncate">{k.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All roles</SelectItem>
            {ALL_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSurface} onValueChange={setFilterSurface}>
          <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="All surfaces" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All surfaces</SelectItem>
            <SelectItem value="web">Web only</SelectItem>
            <SelectItem value="pwa">Mobile only</SelectItem>
            <SelectItem value="both">Both</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode("grid")}
            className={cn("px-3 py-2 text-xs", viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}
          ><LayoutGrid className="h-3.5 w-3.5" /></button>
          <button
            onClick={() => setViewMode("list")}
            className={cn("px-3 py-2 text-xs", viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground")}
          ><List className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="py-16 text-center text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" /> Loading users…
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-16 text-center text-sm text-muted-foreground">
          <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          {search || filterRole !== "all" || filterSurface !== "all"
            ? "No users match your filters."
            : "No users yet — invite your first teammate."}
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((u) => (
            <UserCard
              key={`${u.member_id || ""}-${u.team_member_id || ""}`}
              user={u}
              isYou={u.user_id === user?.id}
              onClick={() => setDetail(u)}
              onEdit={() => setEditing(u)}
              onResetPassword={() => setResetUser(u)}
              onRemove={() => {
                if (confirm(`Remove ${u.full_name}?`)) removeMut.mutate(u);
              }}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="hidden md:grid grid-cols-[1.5fr_1fr_1fr_1fr_120px] gap-4 px-4 py-2.5 border-b border-border bg-muted/30 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            <div>User</div>
            <div>Role</div>
            <div>Login</div>
            <div>Day rate</div>
            <div className="text-right">Actions</div>
          </div>
          <div className="divide-y divide-border/60">
            {filtered.map((u) => {
              const surface = SURFACE_META[u.login_surface];
              const SurfaceIcon = surface.icon;
              const isYou = u.user_id === user?.id;
              return (
                <div
                  key={`${u.member_id || ""}-${u.team_member_id || ""}`}
                  className="grid grid-cols-[1.5fr_1fr_1fr_1fr_120px] gap-4 px-4 py-3 items-center hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setDetail(u)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={u.full_name} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1.5">
                        {u.full_name}
                        {isYou && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary">You</Badge>}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{u.email || u.phone || "—"}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("capitalize text-xs px-2.5 py-0.5 w-fit", ROLE_BADGE[u.role] || "bg-muted text-muted-foreground")}>
                    {u.org_role === "owner" ? "Owner" : u.role}
                  </Badge>
                  <div className="flex items-center gap-1.5">
                    {u.user_id ? (
                      <Badge variant="outline" className={cn("text-xs inline-flex items-center gap-1", surface.color)}>
                        <SurfaceIcon className="h-3 w-3" />
                        {surface.short}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground bg-muted/30 border-border">No login</Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground">
                    {u.daily_rate ? `₹${(u.daily_rate / 1000).toFixed(0)}K` : "—"}
                  </p>
                  <div className="flex items-center justify-end" onClick={(e) => e.stopPropagation()}>
                    <RowActions
                      u={u}
                      isYou={isYou}
                      onEdit={() => setEditing(u)}
                      onResetPassword={() => setResetUser(u)}
                      onRemove={() => removeMut.mutate(u)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add User dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Add Studio User
            </DialogTitle>
            <DialogDescription>
              Every user gets a role + login surface. Add an email if they should be able to sign in;
              skip the email to add a contractor record only.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <UserFormFields form={form} setForm={setForm} mode="create" allowedRoles={getCreatableRoles(currentRole)} />
          </ScrollArea>
          <DialogFooter className="px-6 py-4 border-t border-border">
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              onClick={() => inviteMut.mutate(form)}
              disabled={inviteMut.isPending || !form.display_name.trim()}
              className="gap-2"
            >
              {inviteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {form.email ? "Send invite" : "Save user"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="px-6 pt-6 pb-3 border-b border-border">
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" /> Edit {editing?.full_name}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <EditUserForm
              user={editing}
              onSave={(role, surface, patch) =>
                updateMut.mutate({
                  memberId: editing.member_id,
                  teamMemberId: editing.team_member_id,
                  role,
                  surface,
                  patch,
                })
              }
              saving={updateMut.isPending}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Detail sheet */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-w-md">
          {detail && <UserDetailView user={detail} onEdit={() => { setDetail(null); setEditing(detail); }} />}
        </DialogContent>
      </Dialog>

      {/* Reset Password dialog */}
      <Dialog open={!!resetUser} onOpenChange={(o) => !o && setResetUser(null)}>
        <DialogContent className="max-w-md">
          {resetUser && (
            <ResetPasswordDialog
              user={resetUser}
              saving={resetMut.isPending}
              onSubmit={(mode, password) => resetMut.mutate({ user: resetUser, mode, password })}
              onCancel={() => setResetUser(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────
function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const initials = name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div
      className={cn(
        "rounded-xl bg-primary/10 flex items-center justify-center shrink-0",
        size === "md" ? "h-10 w-10" : "h-14 w-14"
      )}
    >
      <span className={cn("font-bold text-primary", size === "md" ? "text-sm" : "text-lg")}>
        {initials}
      </span>
    </div>
  );
}

function UserCard({ user, isYou, onClick, onEdit, onResetPassword, onRemove }: {
  user: StudioUser;
  isYou: boolean;
  onClick: () => void;
  onEdit: () => void;
  onResetPassword: () => void;
  onRemove: () => void;
}) {
  const surface = SURFACE_META[user.login_surface];
  const SurfaceIcon = surface.icon;
  const RoleIcon = ROLE_ICON[user.role];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/40 hover:shadow-lg transition-all cursor-pointer group"
    >
      <div className="h-1 bg-gradient-to-r from-primary/60 to-primary/20" />
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Avatar name={user.full_name} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-base font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {user.full_name}
              </p>
              {isYou && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary">You</Badge>}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <Badge variant="outline" className={cn("capitalize text-[10px] px-2 py-0", ROLE_BADGE[user.role] || "bg-muted text-muted-foreground")}>
                {RoleIcon && <RoleIcon className="h-2.5 w-2.5 mr-1 inline" />}
                {user.org_role === "owner" ? "Owner" : user.role}
              </Badge>
              {user.user_id ? (
                <Badge variant="outline" className={cn("text-[10px] inline-flex items-center gap-1 px-2 py-0", surface.color)}>
                  <SurfaceIcon className="h-2.5 w-2.5" />
                  {surface.short}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-2 py-0 text-muted-foreground bg-muted/30">No login</Badge>
              )}
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <RowActions
              u={user}
              isYou={isYou}
              onEdit={onEdit}
              onResetPassword={onResetPassword}
              onRemove={onRemove}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border/50">
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">{user.experience_years}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Yrs</p>
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground">
              {user.daily_rate ? `₹${(user.daily_rate / 1000).toFixed(0)}K` : "—"}
            </p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Rate</p>
          </div>
          <div className="text-center flex flex-col items-center">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
              <p className="text-sm font-bold text-foreground">{user.rating.toFixed(1)}</p>
            </div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Rating</p>
          </div>
        </div>

        {(user.email || user.phone) && (
          <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
            {user.email && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                <Mail className="h-3 w-3 shrink-0" /> {user.email}
              </p>
            )}
            {user.phone && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3 w-3 shrink-0" /> {user.phone}
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function RowActions({ u, isYou, onEdit, onResetPassword, onRemove }: {
  u: StudioUser;
  isYou: boolean;
  onEdit: () => void;
  onResetPassword: () => void;
  onRemove: () => void;
}) {
  const isOwner = u.org_role === "owner";
  // Reset is enabled whenever we have an email — if the user has no auth
  // account yet (legacy contractor), the dialog will create one and set the
  // password in one shot.
  const canReset = !!u.email || !!u.user_id;
  const resetLabel = u.user_id ? "Reset password" : "Create login & set password";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit} disabled={isOwner && !isYou}>
          <Edit3 className="h-3.5 w-3.5 mr-2" /> Edit user
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onResetPassword} disabled={!canReset}>
          <KeyRound className="h-3.5 w-3.5 mr-2" /> {resetLabel}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          disabled={isOwner || isYou}
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5 mr-2" /> Remove from studio
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserFormFields({
  form, setForm, mode, allowedRoles,
}: {
  form: UserForm;
  setForm: (f: UserForm | ((p: UserForm) => UserForm)) => void;
  mode: "create" | "edit";
  allowedRoles: AppRole[];
}) {
  const update = <K extends keyof UserForm>(k: K, v: UserForm[K]) =>
    setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="px-6 py-4 space-y-5">
      {/* Identity */}
      <Section title="Identity">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Full name *</Label>
            <Input
              placeholder="Arjun Mehta"
              value={form.display_name}
              onChange={(e) => update("display_name", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email {mode === "create" && "(required for login)"}</Label>
            <Input
              type="email"
              placeholder="arjun@studio.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              disabled={mode === "edit"}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Phone</Label>
            <Input
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
        </div>
      </Section>

      {/* Access */}
      <Section title="Access" subtitle="Who they are inside the studio">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Role *</Label>
            <Select value={form.role} onValueChange={(v) => update("role", v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.filter((r) => allowedRoles.includes(r.value)).map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">
              Drives default dashboard + sidebar. Tune per-role module access in /access-control.
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
                    onClick={() => update("login_surface", s)}
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
              Web blocks /m. Mobile blocks the desktop dashboard. Both lets them switch.
            </p>
          </div>
          {mode === "create" && form.email && (
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-muted/20">
              <div>
                <p className="text-sm font-medium text-foreground">Send password-reset email</p>
                <p className="text-[11px] text-muted-foreground">So they can pick their own password.</p>
              </div>
              <Switch checked={form.send_invite} onCheckedChange={(v) => update("send_invite", v)} />
            </div>
          )}
        </div>
      </Section>

      {/* Operational */}
      <Section title="Operational details" subtitle="For team scheduling, billing & event assignment">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Daily rate (₹)</Label>
            <Input
              type="number"
              placeholder="5000"
              value={form.daily_rate}
              onChange={(e) => update("daily_rate", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Experience (years)</Label>
            <Input
              type="number"
              placeholder="5"
              value={form.experience_years}
              onChange={(e) => update("experience_years", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Specialties (comma-separated)</Label>
            <Input
              placeholder="Candid, Traditional, Drone"
              value={form.specialties}
              onChange={(e) => update("specialties", e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-xs">Notes</Label>
            <Textarea
              className="min-h-[60px]"
              placeholder="Anything else worth remembering..."
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
            />
          </div>
        </div>
      </Section>
    </div>
  );
}

function EditUserForm({ user, onSave, saving, onCancel }: {
  user: StudioUser;
  onSave: (role: AppRole, surface: Surface, patch: Partial<UserForm>) => void;
  saving: boolean;
  onCancel: () => void;
}) {
  const { isAdmin, currentRole } = useRole();
  const [form, setForm] = useState<UserForm>({
    email: user.email || "",
    display_name: user.full_name,
    role: user.role,
    login_surface: user.login_surface,
    send_invite: false,
    phone: user.phone || "",
    daily_rate: user.daily_rate ? String(user.daily_rate) : "",
    experience_years: user.experience_years ? String(user.experience_years) : "",
    specialties: user.specialties.join(", "),
    notes: user.notes || "",
  });

  return (
    <>
      <ScrollArea className="max-h-[70vh]">
        <UserFormFields form={form} setForm={setForm} mode="edit" allowedRoles={isAdmin ? (ALL_ROLES.filter(r => r.value !== "admin").map(r => r.value)) : getCreatableRoles(currentRole)} />
      </ScrollArea>
      <DialogFooter className="px-6 py-4 border-t border-border">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button
          onClick={() => onSave(form.role, form.login_surface, form)}
          disabled={saving || !form.display_name.trim()}
          className="gap-2"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit3 className="h-4 w-4" />}
          Save changes
        </Button>
      </DialogFooter>
    </>
  );
}

function UserDetailView({ user, onEdit }: { user: StudioUser; onEdit: () => void }) {
  const surface = SURFACE_META[user.login_surface];
  const SurfaceIcon = surface.icon;

  return (
    <>
      <DialogHeader>
        <DialogTitle>User profile</DialogTitle>
      </DialogHeader>
      <div className="space-y-5 mt-2">
        <div className="flex items-center gap-4">
          <Avatar name={user.full_name} size="lg" />
          <div className="min-w-0">
            <p className="text-lg font-semibold text-foreground truncate">{user.full_name}</p>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <Badge variant="outline" className={cn("capitalize text-xs", ROLE_BADGE[user.role] || "bg-muted text-muted-foreground")}>
                {user.org_role === "owner" ? "Owner" : user.role}
              </Badge>
              {user.user_id ? (
                <Badge variant="outline" className={cn("text-xs inline-flex items-center gap-1", surface.color)}>
                  <SurfaceIcon className="h-3 w-3" />
                  {surface.label}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs text-muted-foreground bg-muted/30">No login account</Badge>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-muted/30 border border-border p-3 text-center">
            <Zap className="h-4 w-4 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{user.experience_years}</p>
            <p className="text-[10px] text-muted-foreground">Yrs Exp</p>
          </div>
          <div className="rounded-xl bg-muted/30 border border-border p-3 text-center">
            <IndianRupee className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
            <p className="text-lg font-bold">{user.daily_rate ? `₹${(user.daily_rate/1000).toFixed(0)}K` : "—"}</p>
            <p className="text-[10px] text-muted-foreground">Day Rate</p>
          </div>
          <div className="rounded-xl bg-muted/30 border border-border p-3 text-center">
            <Star className="h-4 w-4 text-amber-500 mx-auto mb-1 fill-amber-500" />
            <p className="text-lg font-bold">{user.rating.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Rating</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
          {user.email && <p className="text-sm flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {user.email}</p>}
          {user.phone && <p className="text-sm flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {user.phone}</p>}
        </div>

        {user.specialties.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Specialties</p>
            <div className="flex flex-wrap gap-1.5">
              {user.specialties.map((s, i) => <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>)}
            </div>
          </div>
        )}

        {user.notes && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</p>
            <p className="text-sm text-foreground">{user.notes}</p>
          </div>
        )}

        <Button onClick={onEdit} variant="outline" className="w-full gap-2">
          <Edit3 className="h-4 w-4" /> Edit user
        </Button>
      </div>
    </>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

/** Generate a memorable-but-strong 14-char password using browser crypto. */
function generateStrongPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  const body = Array.from(bytes).map((b) => chars[b % chars.length]).join("");
  return body + Math.floor(Math.random() * 10) + "!";
}

/**
 * Streamlined password-reset dialog:
 *   - Opens with a strong password ALREADY generated and visible
 *   - Default action: "Set & Copy" — sets the password and copies it to
 *     clipboard so admin can paste it to the user immediately.
 *   - Secondary: type a custom password if you prefer
 *   - Tertiary:  send a recovery email instead (single click, no fields)
 *
 * The fastest path is now: open dialog → click Set & Copy → done.
 */
function ResetPasswordDialog({
  user, saving, onSubmit, onCancel,
}: {
  user: StudioUser;
  saving: boolean;
  onSubmit: (mode: "email" | "set", password?: string) => void;
  onCancel: () => void;
}) {
  const [password, setPassword] = useState<string>(() => generateStrongPassword());
  const [showPw, setShowPw] = useState(true);
  const [copied, setCopied] = useState(false);

  function regenerate() {
    setPassword(generateStrongPassword());
    setCopied(false);
  }

  async function copyPassword() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (_) {
      toast.error("Couldn't access clipboard. Copy the password manually.");
    }
  }

  /** Set the password and copy it to clipboard in one go. */
  async function setAndCopy() {
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    // Best-effort copy first so admin has it even if API fails
    try { await navigator.clipboard.writeText(password); } catch (_) { /* ignore */ }
    onSubmit("set", password);
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" />
          {user.user_id ? "Reset password" : "Create login & set password"}
        </DialogTitle>
        <DialogDescription>
          For <span className="font-medium text-foreground">{user.full_name}</span>
          {user.email && <span className="text-muted-foreground"> ({user.email})</span>}.
          {!user.user_id && (
            <span className="block mt-1 text-xs">
              This user doesn't have a login account yet. We'll create one with this password
              so they can sign in immediately.
            </span>
          )}
        </DialogDescription>
      </DialogHeader>

      {/* Big password field — pre-filled, visible, primary action */}
      <div className="space-y-3 py-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs">New password</Label>
            <button
              type="button"
              onClick={regenerate}
              className="text-[11px] text-primary hover:underline"
            >
              Generate new
            </button>
          </div>
          <div className="relative">
            <Input
              type={showPw ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setCopied(false); }}
              className="pr-20 font-mono text-base tracking-tight"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                type="button"
                onClick={copyPassword}
                aria-label="Copy password"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label="Toggle visibility"
              >
                {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Auto-generated. Edit if you'd like — minimum 8 characters.
          </p>
        </div>

        {/* Primary action */}
        <Button
          onClick={setAndCopy}
          disabled={saving || password.length < 8}
          className="w-full gap-2 h-11"
          size="lg"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
          Set password & copy
        </Button>

        {/* Divider */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              Or
            </span>
          </div>
        </div>

        {/* Secondary: send email */}
        <Button
          variant="outline"
          onClick={() => onSubmit("email")}
          disabled={saving || !user.email}
          className="w-full gap-2"
        >
          <MailOpen className="h-4 w-4" />
          Send reset email instead
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          User picks their own password from a link mailed to them.
        </p>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </DialogFooter>
    </>
  );
}
