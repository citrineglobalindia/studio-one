import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreateStudioDialog } from "@/components/superadmin/CreateStudioDialog";
import { ModuleControlDialog } from "@/components/superadmin/ModuleControlDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Building2,
  Users,
  Search,
  Eye,
  Settings2,
  CheckCircle2,
  XCircle,
  Clock,
  FolderKanban,
  IndianRupee,
  MapPin,
  Phone,
  Calendar,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [moduleControlStudio, setModuleControlStudio] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
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

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Studios</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all registered studios</p>
        </div>
        <CreateStudioDialog
          plans={Object.entries(plans).map(([id, name]) => ({ id, name }))}
          onCreated={fetchData}
        />
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === tab.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} <span className="ml-1 opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search studios..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-muted-foreground">Loading studios...</div>
      ) : filteredOrgs.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-base">No studios found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredOrgs.map((org) => {
            const status = getStatus(org.id);
            const sub = getSubForOrg(org.id);
            const orgStats = analytics[org.id] || { clients: 0, projects: 0, revenue: 0, members: 0 };

            return (
              <Card key={org.id} className="group hover:border-primary/40 transition-all hover:shadow-lg">
                <CardContent className="p-5 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md"
                        style={{ backgroundColor: org.primary_color || "hsl(var(--primary))" }}
                      >
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
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setModuleControlStudio({ id: org.id, name: org.name })}>
                            <Settings2 className="h-4 w-4 mr-2" /> Module Control
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Tenant impersonation coming soon.")}>
                            <Eye className="h-4 w-4 mr-2" /> View as Studio
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Info Row */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {org.city && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{org.city}</span>
                    )}
                    {org.phone && (
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{org.phone}</span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(org.created_at), "MMM d, yyyy")}
                    </span>
                  </div>

                  {/* Stats Grid */}
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

                  {/* Plan */}
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
      )}

      {moduleControlStudio && (
        <ModuleControlDialog
          open={!!moduleControlStudio}
          onOpenChange={(open) => !open && setModuleControlStudio(null)}
          studioId={moduleControlStudio.id}
          studioName={moduleControlStudio.name}
        />
      )}
    </div>
  );
}
