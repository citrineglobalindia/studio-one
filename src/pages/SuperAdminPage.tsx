import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CreateStudioDialog } from "@/components/superadmin/CreateStudioDialog";
import { ModuleControlDialog } from "@/components/superadmin/ModuleControlDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Building2,
  Users,
  Search,
  Eye,
  Shield,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  LogOut,
  BarChart3,
  Crown,
  Settings2,
} from "lucide-react";
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

interface TenantSubscription {
  id: string;
  organization_id: string;
  status: string;
  trial_ends_at: string | null;
  plan_id: string;
}

interface TenantMember {
  organization_id: string;
  user_id: string;
  role: string;
}

export default function SuperAdminPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);
  const [orgs, setOrgs] = useState<TenantOrg[]>([]);
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
  const [members, setMembers] = useState<TenantMember[]>([]);
  const [plans, setPlans] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "trial" | "inactive">("all");
  const [loading, setLoading] = useState(true);
  const [moduleControlStudio, setModuleControlStudio] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    checkSuperAdmin();
  }, [user]);

  const checkSuperAdmin = async () => {
    const { data } = await supabase
      .from("super_admins")
      .select("id")
      .eq("user_id", user!.id)
      .maybeSingle();

    if (!data) {
      setIsSuperAdmin(false);
      return;
    }
    setIsSuperAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);
    const [orgsRes, subsRes, membersRes, plansRes] = await Promise.all([
      supabase.from("organizations").select("*").order("created_at", { ascending: false }),
      supabase.from("subscriptions").select("id, organization_id, status, trial_ends_at, plan_id"),
      supabase.from("organization_members").select("organization_id, user_id, role"),
      supabase.from("subscription_plans").select("id, name"),
    ]);

    setOrgs((orgsRes.data as TenantOrg[]) || []);
    setSubscriptions((subsRes.data as TenantSubscription[]) || []);
    setMembers((membersRes.data as TenantMember[]) || []);

    const planMap: Record<string, string> = {};
    (plansRes.data || []).forEach((p: any) => {
      planMap[p.id] = p.name;
    });
    setPlans(planMap);
    setLoading(false);
  };

  if (isSuperAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-black text-sm">S</span>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Shield className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
            <p className="text-muted-foreground">You don't have super admin privileges.</p>
            <Button onClick={() => navigate("/")} variant="outline">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSubForOrg = (orgId: string) => subscriptions.find((s) => s.organization_id === orgId);
  const getMemberCount = (orgId: string) => members.filter((m) => m.organization_id === orgId).length;

  const getStatus = (orgId: string): "active" | "trial" | "inactive" => {
    const sub = getSubForOrg(orgId);
    if (!sub) return "inactive";
    if (sub.status === "trial") return "trial";
    if (sub.status === "active") return "active";
    return "inactive";
  };

  const filteredOrgs = orgs.filter((org) => {
    const matchesSearch =
      org.name.toLowerCase().includes(search.toLowerCase()) ||
      org.slug.toLowerCase().includes(search.toLowerCase()) ||
      (org.city || "").toLowerCase().includes(search.toLowerCase());
    const status = getStatus(org.id);
    const matchesFilter = filter === "all" || status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: orgs.length,
    active: orgs.filter((o) => getStatus(o.id) === "active").length,
    trial: orgs.filter((o) => getStatus(o.id) === "trial").length,
    inactive: orgs.filter((o) => getStatus(o.id) === "inactive").length,
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" /> Active
          </Badge>
        );
      case "trial":
        return (
          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/20">
            <Clock className="h-3 w-3 mr-1" /> Trial
          </Badge>
        );
      default:
        return (
          <Badge className="bg-red-500/15 text-red-400 border-red-500/30 hover:bg-red-500/20">
            <XCircle className="h-3 w-3 mr-1" /> Inactive
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <Crown className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground font-heading">Super Admin</h1>
              <p className="text-xs text-muted-foreground">Platform Management Console</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CreateStudioDialog
              plans={Object.entries(plans).map(([id, name]) => ({ id, name }))}
              onCreated={fetchData}
            />
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              <Building2 className="h-4 w-4 mr-2" /> My Dashboard
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                signOut();
                navigate("/landing");
              }}
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="cursor-pointer transition-all hover:border-primary/40"
            onClick={() => setFilter("all")}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Studios</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:border-emerald-500/40"
            onClick={() => setFilter("active")}
          >
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

          <Card
            className="cursor-pointer transition-all hover:border-amber-500/40"
            onClick={() => setFilter("trial")}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.trial}</p>
                <p className="text-xs text-muted-foreground">On Trial</p>
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:border-red-500/40"
            onClick={() => setFilter("inactive")}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-11 w-11 rounded-xl bg-red-500/10 flex items-center justify-center">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.inactive}</p>
                <p className="text-xs text-muted-foreground">Inactive</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Table */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Registered Studios
                {filter !== "all" && (
                  <Badge variant="secondary" className="ml-2 capitalize">
                    {filter}
                    <button
                      onClick={() => setFilter("all")}
                      className="ml-1 hover:text-foreground"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search studios..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-muted-foreground">Loading studios...</div>
            ) : filteredOrgs.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Building2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No studios found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Studio</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrgs.map((org) => {
                      const sub = getSubForOrg(org.id);
                      const status = getStatus(org.id);
                      const memberCount = getMemberCount(org.id);

                      return (
                        <TableRow key={org.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div
                                className="h-9 w-9 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                                style={{
                                  backgroundColor: org.primary_color || "hsl(var(--primary))",
                                }}
                              >
                                {org.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{org.name}</p>
                                <p className="text-xs text-muted-foreground">/{org.slug}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{statusBadge(status)}</TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {sub ? plans[sub.plan_id] || "—" : "No plan"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              {memberCount}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {org.city || "—"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(org.created_at), "MMM d, yyyy")}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setModuleControlStudio({ id: org.id, name: org.name })}
                              >
                                <Settings2 className="h-4 w-4 mr-1" /> Modules
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  toast.info(`Viewing ${org.name}'s platform`, {
                                    description: "Tenant impersonation coming soon.",
                                  });
                                }}
                              >
                                <Eye className="h-4 w-4 mr-1" /> View
                              </Button>
                            </div>
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
      </div>
    </div>
  );
}
