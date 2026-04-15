import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreateStudioWizard } from "@/components/superadmin/CreateStudioWizard";
import { StudioDetailSheet } from "@/components/superadmin/StudioDetailSheet";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2, Users, Search, Eye, Settings2, CheckCircle2, XCircle, Clock,
  FolderKanban, IndianRupee, MapPin, Phone, Calendar, MoreVertical, LogIn,
  Shield, Blocks, Grid3X3, List, RotateCcw, Sparkles, Loader2,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { toast } from "sonner";

interface TenantOrg {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  city: string | null;
  phone: string | null;
  team_size: string | null;
  primary_color: string | null;
  created_at: string;
}

interface OrgAnalytics {
  clients: number;
  projects: number;
  revenue: number;
  members: number;
}

export default function SAStudios() {
  const [orgs, setOrgs] = useState<TenantOrg[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [analytics, setAnalytics] = useState<Record<string, OrgAnalytics>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "trial" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [selectedStudio, setSelectedStudio] = useState<{ id: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [resetTarget, setResetTarget] = useState<{ id: string; name: string } | null>(null);
  const [resetConfirmText, setResetConfirmText] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetStudio = async () => {
    if (!resetTarget || resetConfirmText !== "RESET") return;
    setResetting(true);
    const tables = ["deliverables", "attendance", "leaves", "invoices", "quotations", "albums", "projects", "clients", "leads", "employees", "team_members"] as const;
    for (const table of tables) {
      await supabase.from(table).delete().eq("organization_id", resetTarget.id);
    }
    setResetting(false);
    setResetConfirmText("");
    setResetSuccess(true);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    const [orgsRes, subsRes, membersRes, plansRes, clientsRes, projectsRes, invoicesRes] = await Promise.all([
      supabase.from("organizations").select("*").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("id, organization_id, status, trial_ends_at, plan_id"),
      supabase.from("organization_members").select("organization_id, user_id"),
      supabase.from("subscription_plans").select("id, name"),
      supabase.from("clients").select("id, organization_id"),
      supabase.from("projects").select("id, organization_id"),
      supabase.from("invoices").select("id, organization_id, amount_paid"),
    ]);

    const orgsData = (orgsRes.data as TenantOrg[]) || [];
    setOrgs(orgsData);
    setSubscriptions(subsRes.data || []);

    const planMap: Record<string, string> = {};
    (plansRes.data || []).forEach((p: any) => { planMap[p.id] = p.name; });
    setPlans(planMap);

    const members = membersRes.data || [];
    const clients = clientsRes.data || [];
    const projects = projectsRes.data || [];
    const invoices = invoicesRes.data || [];

    const analyticsMap: Record<string, OrgAnalytics> = {};
    orgsData.forEach((org) => {
      analyticsMap[org.id] = {
        clients: clients.filter((c: any) => c.organization_id === org.id).length,
        projects: projects.filter((p: any) => p.organization_id === org.id).length,
        revenue: invoices.filter((i: any) => i.organization_id === org.id).reduce((sum: number, i: any) => sum + (Number(i.amount_paid) || 0), 0),
        members: members.filter((m: any) => m.organization_id === org.id).length,
      };
    });
    setAnalytics(analyticsMap);
    setLoading(false);
  };

  const getStatus = (orgId: string): "active" | "trial" | "inactive" => {
    const sub = subscriptions.find((s) => s.organization_id === orgId);
    if (!sub) return "inactive";
    if (sub.status === "trial") return "trial";
    if (sub.status === "active") return "active";
    return "inactive";
  };

  const getSubForOrg = (orgId: string) => subscriptions.find((s) => s.organization_id === orgId);

  const filteredOrgs = orgs.filter((org) => {
    const matchesSearch = org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase()) ||
      (org.city || "").toLowerCase().includes(search.toLowerCase());
    const status = getStatus(org.id);
    return matchesSearch && (filter === "all" || status === filter);
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>;
      case "trial":
        return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30"><Clock className="h-3 w-3 mr-1" /> Trial</Badge>;
      default:
        return <Badge className="bg-red-500/15 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> Inactive</Badge>;
    }
  };

  const filterTabs = [
    { value: "all", label: "All", count: orgs.length },
    { value: "active", label: "Active", count: orgs.filter((o) => getStatus(o.id) === "active").length },
    { value: "trial", label: "Trial", count: orgs.filter((o) => getStatus(o.id) === "trial").length },
    { value: "inactive", label: "Inactive", count: orgs.filter((o) => getStatus(o.id) === "inactive").length },
  ];

  // Summary stats
  const totalRevenue = Object.values(analytics).reduce((s, a) => s + a.revenue, 0);
  const totalClients = Object.values(analytics).reduce((s, a) => s + a.clients, 0);
  const totalProjects = Object.values(analytics).reduce((s, a) => s + a.projects, 0);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Studios</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all registered studios • {orgs.length} total</p>
        </div>
        <CreateStudioWizard plans={Object.entries(plans).map(([id, name]) => ({ id, name }))} onCreated={fetchData} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Studios", value: orgs.length, icon: Building2, color: "from-blue-500/20 to-blue-600/5", iconColor: "text-blue-400" },
          { label: "Total Clients", value: totalClients, icon: Users, color: "from-emerald-500/20 to-emerald-600/5", iconColor: "text-emerald-400" },
          { label: "Total Projects", value: totalProjects, icon: FolderKanban, color: "from-purple-500/20 to-purple-600/5", iconColor: "text-purple-400" },
          { label: "Total Revenue", value: `₹${totalRevenue > 99999 ? `${(totalRevenue/100000).toFixed(1)}L` : totalRevenue > 999 ? `${(totalRevenue/1000).toFixed(0)}K` : totalRevenue}`, icon: IndianRupee, color: "from-amber-500/20 to-amber-600/5", iconColor: "text-amber-400" },
        ].map(s => (
          <Card key={s.label} className={`bg-gradient-to-br ${s.color} border-border/50`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-background/50 flex items-center justify-center ${s.iconColor}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters + Search + View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-center">
          <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
            {filterTabs.map((tab) => (
              <button key={tab.value} onClick={() => setFilter(tab.value as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  filter === tab.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {tab.label} <span className="ml-1 opacity-60">{tab.count}</span>
              </button>
            ))}
          </div>
          <div className="relative max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search studios..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
            <Grid3X3 className="h-4 w-4" />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-background shadow-sm" : "text-muted-foreground"}`}>
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Studio Cards */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading studios...</div>
      ) : filteredOrgs.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-base">No studios found</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrgs.map((org) => {
            const status = getStatus(org.id);
            const sub = getSubForOrg(org.id);
            const orgStats = analytics[org.id] || { clients: 0, projects: 0, revenue: 0, members: 0 };

            return (
              <Card key={org.id} className="group hover:border-primary/40 transition-all hover:shadow-lg cursor-pointer"
                onClick={() => setSelectedStudio({ id: org.id, name: org.name })}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md"
                        style={{ backgroundColor: org.primary_color || "hsl(var(--primary))" }}>
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{org.name}</h3>
                        <p className="text-xs text-muted-foreground">/{org.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {statusBadge(status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedStudio({ id: org.id, name: org.name }); }}>
                            <Settings2 className="h-4 w-4 mr-2" /> Manage Studio
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); localStorage.setItem("sa_impersonate_org", org.id); window.open("/", "_blank"); toast.info(`Opening ${org.name} in new tab`); }}>
                            <LogIn className="h-4 w-4 mr-2" /> Login as Studio
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); setResetTarget({ id: org.id, name: org.name }); }}>
                            <RotateCcw className="h-4 w-4 mr-2" /> Reset Studio
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {org.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{org.city}</span>}
                    {org.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{org.phone}</span>}
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(org.created_at), "MMM d, yyyy")}</span>
                  </div>

                  <div className="grid grid-cols-4 gap-3 pt-2 border-t border-border">
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{orgStats.clients}</p>
                      <p className="text-[10px] text-muted-foreground">Clients</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{orgStats.projects}</p>
                      <p className="text-[10px] text-muted-foreground">Projects</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">{orgStats.members}</p>
                      <p className="text-[10px] text-muted-foreground">Members</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-foreground">₹{orgStats.revenue > 999 ? `${(orgStats.revenue / 1000).toFixed(0)}K` : orgStats.revenue}</p>
                      <p className="text-[10px] text-muted-foreground">Revenue</p>
                    </div>
                  </div>

                  {sub && plans[sub.plan_id] && (
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <span className="text-xs text-muted-foreground">Plan</span>
                      <Badge variant="secondary" className="text-xs">{plans[sub.plan_id]}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-2.5 bg-muted/50 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Studio</span><span>Status</span><span>Plan</span><span>Clients</span><span>Projects</span><span>Revenue</span><span></span>
          </div>
          {filteredOrgs.map((org) => {
            const status = getStatus(org.id);
            const sub = getSubForOrg(org.id);
            const orgStats = analytics[org.id] || { clients: 0, projects: 0, revenue: 0, members: 0 };
            return (
              <div key={org.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 px-4 py-3 border-t border-border hover:bg-muted/30 cursor-pointer items-center transition-colors"
                onClick={() => setSelectedStudio({ id: org.id, name: org.name })}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: org.primary_color || "hsl(var(--primary))" }}>
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{org.name}</p>
                    <p className="text-[10px] text-muted-foreground">{org.city || org.slug}</p>
                  </div>
                </div>
                <div>{statusBadge(status)}</div>
                <div><Badge variant="secondary" className="text-[10px]">{sub ? plans[sub.plan_id] || "—" : "None"}</Badge></div>
                <div className="text-sm font-medium">{orgStats.clients}</div>
                <div className="text-sm font-medium">{orgStats.projects}</div>
                <div className="text-sm font-medium">₹{orgStats.revenue > 999 ? `${(orgStats.revenue/1000).toFixed(0)}K` : orgStats.revenue}</div>
                <div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setSelectedStudio({ id: org.id, name: org.name }); }}>
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Studio Detail Sheet */}
      {selectedStudio && (
        <StudioDetailSheet
          open={!!selectedStudio}
          onOpenChange={(open) => !open && setSelectedStudio(null)}
          studioId={selectedStudio.id}
          studioName={selectedStudio.name}
          onUpdated={fetchData}
        />
      )}

      {/* Reset Studio Confirmation Dialog */}
      <AlertDialog open={!!resetTarget && !resetSuccess} onOpenChange={(open) => { if (!open) { setResetTarget(null); setResetConfirmText(""); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <RotateCcw className="h-5 w-5" /> Reset Studio
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This will permanently erase <strong className="text-foreground">{resetTarget?.name}</strong>'s data including clients, projects, leads, invoices, quotations, albums, employees, team members, attendance, and leaves.</p>
              <p className="text-destructive font-medium">This action cannot be undone.</p>
              <div className="pt-2">
                <Label className="text-xs text-muted-foreground">Type <strong>RESET</strong> to confirm</Label>
                <Input value={resetConfirmText} onChange={(e) => setResetConfirmText(e.target.value.toUpperCase())} placeholder="RESET" className="mt-1.5" />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button variant="destructive" onClick={handleResetStudio} disabled={resetConfirmText !== "RESET" || resetting}>
              {resetting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              {resetting ? "Resetting..." : "Reset All Data"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Success Dialog */}
      <AlertDialog open={resetSuccess} onOpenChange={(open) => { if (!open) { setResetSuccess(false); setResetTarget(null); } }}>
        <AlertDialogContent className="text-center">
          <div className="flex flex-col items-center space-y-4 py-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/20 via-primary/20 to-emerald-500/20 blur-2xl animate-pulse" />
              <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-primary to-emerald-400 bg-clip-text text-transparent">
              Studio Reset Complete! ✨
            </h2>
            <p className="text-sm text-muted-foreground">
              All data for <span className="font-semibold text-foreground">{resetTarget?.name}</span> has been erased.
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground w-full max-w-xs">
              {["Clients", "Projects", "Leads", "Invoices", "Quotations", "Albums", "Employees", "Team", "Attendance"].map((item) => (
                <div key={item} className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" /> {item}
                </div>
              ))}
            </div>
            <Button onClick={() => { setResetSuccess(false); setResetTarget(null); }} className="bg-gradient-to-r from-emerald-500 to-primary text-white px-8 mt-2">
              Done
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
