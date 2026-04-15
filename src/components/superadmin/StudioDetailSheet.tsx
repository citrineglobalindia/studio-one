import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ALL_ROLES, ALL_MODULES, type AppRole, type AppModule } from "@/contexts/RoleContext";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Building2, Users, FolderKanban, IndianRupee, Shield, Blocks,
  Eye, Save, Loader2, MapPin, Phone, Globe, Instagram, Palette,
  UserCheck, UserX, CheckCircle2, XCircle, LogIn, Copy, ExternalLink,
  Trash2, AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface StudioDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studioId: string;
  studioName: string;
  onUpdated: () => void;
}

interface OrgDetails {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  primary_color: string | null;
  team_size: string | null;
  owner_id: string;
  created_at: string;
}

export function StudioDetailSheet({ open, onOpenChange, studioId, studioName, onUpdated }: StudioDetailSheetProps) {
  const [org, setOrg] = useState<OrgDetails | null>(null);
  const [disabledRoles, setDisabledRoles] = useState<string[]>([]);
  const [restrictedModules, setRestrictedModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingRoles, setSavingRoles] = useState(false);
  const [savingModules, setSavingModules] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "", city: "", phone: "", website: "", instagram: "", primary_color: "#C4973B",
  });
  const [resetting, setResetting] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    if (!open || !studioId) return;
    fetchAll();
  }, [open, studioId]);

  const fetchAll = async () => {
    setLoading(true);
    const [orgRes, roleRes, modRes, clientsRes, projectsRes, membersRes, invoicesRes] = await Promise.all([
      supabase.from("organizations").select("*").eq("id", studioId).single(),
      supabase.from("studio_role_restrictions").select("disabled_roles").eq("organization_id", studioId).maybeSingle(),
      supabase.from("studio_module_restrictions").select("restricted_modules").eq("organization_id", studioId).maybeSingle(),
      supabase.from("clients").select("id", { count: "exact", head: true }).eq("organization_id", studioId),
      supabase.from("projects").select("id", { count: "exact", head: true }).eq("organization_id", studioId),
      supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", studioId),
      supabase.from("invoices").select("amount_paid").eq("organization_id", studioId),
    ]);

    if (orgRes.data) {
      const o = orgRes.data as OrgDetails;
      setOrg(o);
      setEditForm({
        name: o.name, city: o.city || "", phone: o.phone || "",
        website: o.website || "", instagram: o.instagram || "",
        primary_color: o.primary_color || "#C4973B",
      });
    }
    setDisabledRoles((roleRes.data as any)?.disabled_roles || []);
    setRestrictedModules((modRes.data as any)?.restricted_modules || []);
    setStats({
      clients: clientsRes.count || 0,
      projects: projectsRes.count || 0,
      members: membersRes.count || 0,
      revenue: (invoicesRes.data || []).reduce((s: number, i: any) => s + (Number(i.amount_paid) || 0), 0),
    });
    setLoading(false);
  };

  const toggleRole = (role: string) => {
    setDisabledRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  const toggleModule = (mod: string) => {
    setRestrictedModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  const saveRoles = async () => {
    setSavingRoles(true);
    const { error } = await supabase.from("studio_role_restrictions").upsert(
      { organization_id: studioId, disabled_roles: disabledRoles },
      { onConflict: "organization_id" }
    );
    setSavingRoles(false);
    if (error) { toast.error("Failed to save roles"); return; }
    toast.success("Role access updated");
    onUpdated();
  };

  const saveModules = async () => {
    setSavingModules(true);
    const { error } = await supabase.from("studio_module_restrictions").upsert(
      { organization_id: studioId, restricted_modules: restrictedModules },
      { onConflict: "organization_id" }
    );
    setSavingModules(false);
    if (error) { toast.error("Failed to save modules"); return; }
    toast.success("Module access updated");
    onUpdated();
  };

  const saveInfo = async () => {
    setSavingInfo(true);
    const { error } = await supabase.from("organizations").update({
      name: editForm.name, city: editForm.city || null, phone: editForm.phone || null,
      website: editForm.website || null, instagram: editForm.instagram || null,
      primary_color: editForm.primary_color,
    }).eq("id", studioId);
    setSavingInfo(false);
    if (error) { toast.error("Failed to update"); return; }
    toast.success("Studio info updated");
    onUpdated();
    fetchAll();
  };

  const handleLoginAs = () => {
    // Store impersonation org id and redirect to main dashboard
    localStorage.setItem("sa_impersonate_org", studioId);
    window.open("/", "_blank");
    toast.info(`Opening ${studioName} dashboard in new tab`);
  };

  const coreModules: AppModule[] = ["dashboard", "profile", "notifications"];
  const moduleGroups = ALL_MODULES.reduce((acc, mod) => {
    if (!acc[mod.group]) acc[mod.group] = [];
    acc[mod.group].push(mod);
    return acc;
  }, {} as Record<string, typeof ALL_MODULES>);

  const activeRolesCount = ALL_ROLES.filter(r => !disabledRoles.includes(r.value)).length;
  const activeModulesCount = ALL_MODULES.filter(m => !restrictedModules.includes(m.value)).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[580px] overflow-y-auto p-0">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Hero Header */}
            <div className="relative p-6 pb-4" style={{ background: `linear-gradient(135deg, ${editForm.primary_color}20, transparent)` }}>
              <SheetHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                      style={{ backgroundColor: editForm.primary_color || "hsl(var(--primary))" }}
                    >
                      {(editForm.name || studioName).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <SheetTitle className="text-xl">{editForm.name || studioName}</SheetTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">/{org?.slug}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleLoginAs} className="gap-1.5">
                    <LogIn className="h-3.5 w-3.5" /> Login as Studio
                  </Button>
                </div>
              </SheetHeader>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-3 mt-5">
                {[
                  { icon: Users, label: "Members", value: stats.members, color: "text-blue-400" },
                  { icon: FolderKanban, label: "Projects", value: stats.projects, color: "text-purple-400" },
                  { icon: Building2, label: "Clients", value: stats.clients, color: "text-emerald-400" },
                  { icon: IndianRupee, label: "Revenue", value: `₹${stats.revenue > 999 ? `${(stats.revenue/1000).toFixed(0)}K` : stats.revenue}`, color: "text-amber-400" },
                ].map(s => (
                  <Card key={s.label} className="bg-card/60 backdrop-blur-sm border-border/50">
                    <CardContent className="p-3 text-center">
                      <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                      <p className="text-lg font-bold text-foreground">{s.value}</p>
                      <p className="text-[10px] text-muted-foreground">{s.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="roles" className="px-6 pb-6">
              <TabsList className="w-full grid grid-cols-3 mb-4">
                <TabsTrigger value="roles" className="gap-1.5 text-xs">
                  <Shield className="h-3.5 w-3.5" /> Roles ({activeRolesCount}/{ALL_ROLES.length})
                </TabsTrigger>
                <TabsTrigger value="modules" className="gap-1.5 text-xs">
                  <Blocks className="h-3.5 w-3.5" /> Modules ({activeModulesCount}/{ALL_MODULES.length})
                </TabsTrigger>
                <TabsTrigger value="info" className="gap-1.5 text-xs">
                  <Building2 className="h-3.5 w-3.5" /> Company Info
                </TabsTrigger>
              </TabsList>

              {/* ROLES TAB */}
              <TabsContent value="roles" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Activate or deactivate roles for this studio</p>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setDisabledRoles([])}>All On</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setDisabledRoles(ALL_ROLES.filter(r => r.value !== "admin").map(r => r.value))}>All Off</Button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {ALL_ROLES.map(role => {
                    const isActive = !disabledRoles.includes(role.value);
                    const isAdmin = role.value === "admin";
                    return (
                      <div key={role.value}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isActive ? "border-emerald-500/20 bg-emerald-500/5" : "border-border bg-muted/30"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                            isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
                          }`}>
                            {isActive ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{role.label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {isAdmin ? "Always active — cannot be disabled" : isActive ? "Active" : "Disabled"}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isActive}
                          onCheckedChange={() => toggleRole(role.value)}
                          disabled={isAdmin}
                        />
                      </div>
                    );
                  })}
                </div>

                <Button className="w-full" onClick={saveRoles} disabled={savingRoles}>
                  {savingRoles ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Role Settings
                </Button>
              </TabsContent>

              {/* MODULES TAB */}
              <TabsContent value="modules" className="space-y-4 mt-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Enable or restrict modules</p>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setRestrictedModules([])}>All On</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setRestrictedModules(ALL_MODULES.map(m => m.value))}>All Off</Button>
                  </div>
                </div>

                {Object.entries(moduleGroups).map(([group, modules]) => (
                  <div key={group}>
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">{group}</h4>
                    <div className="space-y-0.5">
                      {modules.map(mod => {
                        const isCore = coreModules.includes(mod.value);
                        const isEnabled = !restrictedModules.includes(mod.value);
                        return (
                          <div key={mod.value} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                            <div className="flex items-center gap-2">
                              <div className={`h-1.5 w-1.5 rounded-full ${isEnabled ? "bg-emerald-400" : "bg-red-400"}`} />
                              <span className="text-sm">{mod.label}</span>
                              {isCore && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Core</Badge>}
                            </div>
                            <Switch checked={isEnabled} onCheckedChange={() => toggleModule(mod.value)} disabled={isCore} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                <Button className="w-full" onClick={saveModules} disabled={savingModules}>
                  {savingModules ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Module Settings
                </Button>
              </TabsContent>

              {/* COMPANY INFO TAB */}
              <TabsContent value="info" className="space-y-4 mt-0">
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Studio Name</Label>
                    <Input value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><MapPin className="h-3 w-3" /> City</Label>
                      <Input value={editForm.city} onChange={e => setEditForm({...editForm, city: e.target.value})} placeholder="Mumbai" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
                      <Input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} placeholder="+91 98765..." />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Globe className="h-3 w-3" /> Website</Label>
                      <Input value={editForm.website} onChange={e => setEditForm({...editForm, website: e.target.value})} placeholder="https://..." />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1"><Instagram className="h-3 w-3" /> Instagram</Label>
                      <Input value={editForm.instagram} onChange={e => setEditForm({...editForm, instagram: e.target.value})} placeholder="@handle" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1"><Palette className="h-3 w-3" /> Brand Color</Label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={editForm.primary_color} onChange={e => setEditForm({...editForm, primary_color: e.target.value})}
                        className="h-10 w-14 rounded-lg border border-border cursor-pointer" />
                      <Input value={editForm.primary_color} onChange={e => setEditForm({...editForm, primary_color: e.target.value})} className="flex-1 font-mono text-sm" />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Studio Details</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Slug</span>
                    <span className="font-mono text-foreground">/{org?.slug}</span>
                    <span className="text-muted-foreground">Team Size</span>
                    <span className="text-foreground capitalize">{org?.team_size || "N/A"}</span>
                    <span className="text-muted-foreground">Created</span>
                    <span className="text-foreground">{org?.created_at ? new Date(org.created_at).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>

                <Button className="w-full" onClick={saveInfo} disabled={savingInfo}>
                  {savingInfo ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  Update Company Info
                </Button>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
