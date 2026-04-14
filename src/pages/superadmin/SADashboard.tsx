import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Users,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  TrendingUp,
  FolderKanban,
  IndianRupee,
} from "lucide-react";
import { format } from "date-fns";

interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  created_at: string;
  primary_color: string | null;
}

export default function SADashboard() {
  const [stats, setStats] = useState({
    totalStudios: 0,
    activeStudios: 0,
    trialStudios: 0,
    inactiveStudios: 0,
    totalClients: 0,
    totalProjects: 0,
    totalRevenue: 0,
    totalMembers: 0,
  });
  const [recentStudios, setRecentStudios] = useState<OrgSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    const [orgsRes, subsRes, membersRes, clientsRes, projectsRes, invoicesRes] = await Promise.all([
      supabase.from("organizations").select("id, name, slug, city, created_at, primary_color").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("organization_id, status"),
      supabase.from("organization_members").select("id"),
      supabase.from("clients").select("id"),
      supabase.from("projects").select("id"),
      supabase.from("invoices").select("amount_paid"),
    ]);

    const orgs = orgsRes.data || [];
    const subs = subsRes.data || [];
    const revenue = (invoicesRes.data || []).reduce((sum, i: any) => sum + (Number(i.amount_paid) || 0), 0);

    const activeCount = subs.filter((s: any) => s.status === "active").length;
    const trialCount = subs.filter((s: any) => s.status === "trial").length;
    const subOrgIds = new Set(subs.map((s: any) => s.organization_id));
    const inactiveCount = orgs.filter((o) => !subOrgIds.has(o.id)).length + subs.filter((s: any) => !["active", "trial"].includes(s.status)).length;

    setStats({
      totalStudios: orgs.length,
      activeStudios: activeCount,
      trialStudios: trialCount,
      inactiveStudios: Math.max(0, orgs.length - activeCount - trialCount),
      totalClients: (clientsRes.data || []).length,
      totalProjects: (projectsRes.data || []).length,
      totalRevenue: revenue,
      totalMembers: (membersRes.data || []).length,
    });
    setRecentStudios(orgs.slice(0, 5) as OrgSummary[]);
    setLoading(false);
  };

  const cards = [
    { label: "Total Studios", value: stats.totalStudios, icon: Building2, color: "text-primary", bg: "bg-primary/10" },
    { label: "Active", value: stats.activeStudios, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "On Trial", value: stats.trialStudios, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Inactive", value: stats.inactiveStudios, icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  const metrics = [
    { label: "Total Clients", value: stats.totalClients.toLocaleString(), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Total Projects", value: stats.totalProjects.toLocaleString(), icon: FolderKanban, color: "text-violet-400", bg: "bg-violet-500/10" },
    { label: "Platform Revenue", value: `₹${stats.totalRevenue.toLocaleString("en-IN")}`, icon: IndianRupee, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Total Members", value: stats.totalMembers.toLocaleString(), icon: Users, color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-black text-sm">S</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of all studios and platform metrics</p>
      </div>

      {/* Studio Status */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="hover:border-primary/30 transition-colors">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl ${c.bg} flex items-center justify-center`}>
                <c.icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Platform Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Card key={m.label}>
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`h-11 w-11 rounded-xl ${m.bg} flex items-center justify-center`}>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{m.value}</p>
                <p className="text-xs text-muted-foreground">{m.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Studios */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Recently Added Studios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {recentStudios.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-6 py-3.5">
                <div
                  className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                  style={{ backgroundColor: s.primary_color || "hsl(var(--primary))" }}
                >
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.city || "—"}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {format(new Date(s.created_at), "MMM d, yyyy")}
                </span>
              </div>
            ))}
            {recentStudios.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No studios yet</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
