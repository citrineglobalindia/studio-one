import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CreditCard, Search, CheckCircle2, Clock, XCircle, Building2,
  Users, FolderKanban, IndianRupee, AlertTriangle,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface SubRow {
  id: string;
  organization_id: string;
  status: string;
  trial_ends_at: string | null;
  plan_id: string;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
}

interface PlanInfo {
  id: string;
  name: string;
  slug: string;
  price: number;
  billing_period: string;
  max_clients: number | null;
  max_projects: number | null;
  max_team_members: number | null;
}

export default function SASubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubRow[]>([]);
  const [plans, setPlans] = useState<Record<string, PlanInfo>>({});
  const [orgs, setOrgs] = useState<Record<string, { name: string; primary_color: string | null }>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "trial" | "expired">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [subsRes, plansRes, orgsRes] = await Promise.all([
      supabase.from("subscriptions").select("*").order("created_at", { ascending: false }),
      supabase.from("subscription_plans").select("*"),
      supabase.from("organizations").select("id, name, primary_color"),
    ]);

    setSubscriptions((subsRes.data || []) as SubRow[]);

    const planMap: Record<string, PlanInfo> = {};
    (plansRes.data || []).forEach((p: any) => { planMap[p.id] = p; });
    setPlans(planMap);

    const orgMap: Record<string, { name: string; primary_color: string | null }> = {};
    (orgsRes.data || []).forEach((o: any) => { orgMap[o.id] = { name: o.name, primary_color: o.primary_color }; });
    setOrgs(orgMap);
    setLoading(false);
  };

  const filtered = subscriptions.filter((sub) => {
    const orgName = orgs[sub.organization_id]?.name || "";
    const matchesSearch = orgName.toLowerCase().includes(search.toLowerCase());
    if (filter === "all") return matchesSearch;
    if (filter === "expired") return matchesSearch && !["active", "trial"].includes(sub.status);
    return matchesSearch && sub.status === filter;
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "active").length,
    trial: subscriptions.filter((s) => s.status === "trial").length,
    expired: subscriptions.filter((s) => !["active", "trial"].includes(s.status)).length,
    mrr: subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + (plans[s.plan_id]?.price || 0), 0),
  };

  const statusBadge = (status: string, trialEndsAt: string | null) => {
    if (status === "active") return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" /> Active</Badge>;
    if (status === "trial") {
      const daysLeft = trialEndsAt ? differenceInDays(new Date(trialEndsAt), new Date()) : 0;
      return (
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30">
          <Clock className="h-3 w-3 mr-1" /> Trial {daysLeft > 0 ? `(${daysLeft}d left)` : "(expired)"}
        </Badge>
      );
    }
    return <Badge className="bg-red-500/15 text-red-400 border-red-500/30"><XCircle className="h-3 w-3 mr-1" /> {status}</Badge>;
  };

  const filterTabs = [
    { value: "all", label: "All", count: stats.total },
    { value: "active", label: "Active", count: stats.active },
    { value: "trial", label: "Trial", count: stats.trial },
    { value: "expired", label: "Expired", count: stats.expired },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage studio subscriptions and plans</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total Subscriptions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.active}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.trial}</p>
              <p className="text-xs text-muted-foreground">On Trial</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <IndianRupee className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">₹{stats.mrr.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground">Monthly MRR</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                filter === tab.value ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label} <span className="ml-1 opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by studio..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading subscriptions...</div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No subscriptions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Studio</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((sub) => {
                    const org = orgs[sub.organization_id];
                    const plan = plans[sub.plan_id];
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ backgroundColor: org?.primary_color || "hsl(var(--primary))" }}
                            >
                              {(org?.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm text-foreground">{org?.name || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{plan?.name || "—"}</Badge>
                        </TableCell>
                        <TableCell>{statusBadge(sub.status, sub.trial_ends_at)}</TableCell>
                        <TableCell>
                          <span className="text-sm font-medium text-foreground">
                            {plan ? `₹${plan.price.toLocaleString("en-IN")}` : "—"}
                          </span>
                          {plan && <span className="text-xs text-muted-foreground ml-1">/{plan.billing_period}</span>}
                        </TableCell>
                        <TableCell>
                          {plan ? (
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <div className="flex items-center gap-1"><Users className="h-3 w-3" /> {plan.max_team_members === -1 ? "∞" : plan.max_team_members} members</div>
                              <div className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> {plan.max_projects === -1 ? "∞" : plan.max_projects} projects</div>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(sub.created_at), "MMM d, yyyy")}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plans Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Available Plans</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.values(plans).sort((a, b) => a.price - b.price).map((plan) => (
              <div key={plan.id} className="border border-border rounded-xl p-4 space-y-3 hover:border-primary/30 transition-colors">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground">{plan.name}</h4>
                  <Badge variant="outline" className="text-xs capitalize">{plan.billing_period}</Badge>
                </div>
                <p className="text-2xl font-bold text-foreground">₹{plan.price.toLocaleString("en-IN")}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p>{plan.max_clients === -1 ? "Unlimited" : plan.max_clients} clients</p>
                  <p>{plan.max_projects === -1 ? "Unlimited" : plan.max_projects} projects</p>
                  <p>{plan.max_team_members === -1 ? "Unlimited" : plan.max_team_members} team members</p>
                </div>
                <div className="text-xs text-muted-foreground pt-1 border-t border-border">
                  {subscriptions.filter((s) => s.plan_id === plan.id && s.status === "active").length} active studios
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
