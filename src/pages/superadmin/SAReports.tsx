import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  FileText, Building2, Users, FolderKanban, IndianRupee,
  TrendingUp, BarChart3, Percent,
} from "lucide-react";

interface StudioReport {
  id: string;
  name: string;
  primary_color: string | null;
  clients: number;
  projects: number;
  invoices: number;
  revenue: number;
  members: number;
  pendingInvoices: number;
}

export default function SAReports() {
  const [studios, setStudios] = useState<StudioReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const [orgsRes, clientsRes, projectsRes, invoicesRes, membersRes] = await Promise.all([
      supabase.from("organizations").select("id, name, primary_color").order("name"),
      supabase.from("clients").select("id, organization_id"),
      supabase.from("projects").select("id, organization_id"),
      supabase.from("invoices").select("id, organization_id, amount_paid, total_amount, status"),
      supabase.from("organization_members").select("organization_id"),
    ]);

    const orgs = orgsRes.data || [];
    const clients = clientsRes.data || [];
    const projects = projectsRes.data || [];
    const invoices = invoicesRes.data || [];
    const members = membersRes.data || [];

    const reports: StudioReport[] = orgs.map((org: any) => {
      const orgInvoices = invoices.filter((i: any) => i.organization_id === org.id);
      return {
        id: org.id,
        name: org.name,
        primary_color: org.primary_color,
        clients: clients.filter((c: any) => c.organization_id === org.id).length,
        projects: projects.filter((p: any) => p.organization_id === org.id).length,
        invoices: orgInvoices.length,
        revenue: orgInvoices.reduce((sum: number, i: any) => sum + (Number(i.amount_paid) || 0), 0),
        members: members.filter((m: any) => m.organization_id === org.id).length,
        pendingInvoices: orgInvoices.filter((i: any) => i.status === "sent" || i.status === "draft").length,
      };
    });

    setStudios(reports.sort((a, b) => b.revenue - a.revenue));
    setLoading(false);
  };

  const totalRevenue = studios.reduce((s, r) => s + r.revenue, 0);
  const totalClients = studios.reduce((s, r) => s + r.clients, 0);
  const totalProjects = studios.reduce((s, r) => s + r.projects, 0);
  const avgRevenue = studios.length ? totalRevenue / studios.length : 0;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform-wide performance overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center"><IndianRupee className="h-5 w-5 text-emerald-400" /></div>
            <div><p className="text-xl font-bold text-foreground">₹{totalRevenue.toLocaleString("en-IN")}</p><p className="text-xs text-muted-foreground">Total Revenue</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 flex items-center justify-center"><BarChart3 className="h-5 w-5 text-blue-400" /></div>
            <div><p className="text-xl font-bold text-foreground">₹{Math.round(avgRevenue).toLocaleString("en-IN")}</p><p className="text-xs text-muted-foreground">Avg Revenue/Studio</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-violet-500/10 flex items-center justify-center"><Users className="h-5 w-5 text-violet-400" /></div>
            <div><p className="text-xl font-bold text-foreground">{totalClients}</p><p className="text-xs text-muted-foreground">Total Clients</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center"><FolderKanban className="h-5 w-5 text-primary" /></div>
            <div><p className="text-xl font-bold text-foreground">{totalProjects}</p><p className="text-xs text-muted-foreground">Total Projects</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Studio Performance Ranking</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center text-muted-foreground">Loading reports...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Studio</TableHead>
                    <TableHead className="text-center">Clients</TableHead>
                    <TableHead className="text-center">Projects</TableHead>
                    <TableHead className="text-center">Invoices</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                    <TableHead className="text-center">Members</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">% Share</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studios.map((studio, idx) => (
                    <TableRow key={studio.id}>
                      <TableCell>
                        <span className={`text-sm font-bold ${idx < 3 ? "text-primary" : "text-muted-foreground"}`}>
                          {idx + 1}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                            style={{ backgroundColor: studio.primary_color || "hsl(var(--primary))" }}
                          >
                            {studio.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm text-foreground">{studio.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm">{studio.clients}</TableCell>
                      <TableCell className="text-center text-sm">{studio.projects}</TableCell>
                      <TableCell className="text-center text-sm">{studio.invoices}</TableCell>
                      <TableCell className="text-center">
                        {studio.pendingInvoices > 0 ? (
                          <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-xs">{studio.pendingInvoices}</Badge>
                        ) : (
                          <span className="text-sm text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center text-sm">{studio.members}</TableCell>
                      <TableCell className="text-right font-medium text-sm">₹{studio.revenue.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {totalRevenue > 0 ? `${((studio.revenue / totalRevenue) * 100).toFixed(1)}%` : "0%"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
