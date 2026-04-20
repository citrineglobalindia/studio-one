import { useMemo } from "react";
import { BarChart3, TrendingUp, IndianRupee, Users, Camera, Loader2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
} from "recharts";
import { useLeads } from "@/hooks/useLeads";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useInvoices } from "@/hooks/useInvoices";
import { format, parseISO, subMonths, startOfMonth } from "date-fns";

const SOURCE_COLORS = [
  "#a855f7", "#3b82f6", "#06b6d4", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316",
];

export default function AnalyticsPage() {
  const { leads, isLoading: leadsLoading } = useLeads();
  const { clients = [], isLoading: clientsLoading } = useClients();
  const { projects = [], isLoading: projectsLoading } = useProjects();
  const { invoices = [], isLoading: invoicesLoading } = useInvoices();

  const isLoading = leadsLoading || clientsLoading || projectsLoading || invoicesLoading;

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, i) => {
      const d = startOfMonth(subMonths(now, 5 - i));
      return { date: d, label: format(d, "MMM") };
    });
  }, []);

  const monthlyRevenue = useMemo(() => {
    return months.map(({ date, label }) => {
      const month = date.getMonth();
      const year = date.getFullYear();
      const revenue = invoices
        .filter(inv => {
          const d = parseISO(inv.created_at);
          return d.getMonth() === month && d.getFullYear() === year;
        })
        .reduce((s, inv) => s + Number(inv.amount_paid || 0), 0);
      const bookings = (projects as any[]).filter(p => {
        const d = p.created_at ? parseISO(p.created_at) : null;
        return d && d.getMonth() === month && d.getFullYear() === year;
      }).length;
      return { month: label, revenue, bookings };
    });
  }, [invoices, projects, months]);

  const leadSources = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach(l => {
      const src = l.source || "Other";
      counts[src] = (counts[src] || 0) + 1;
    });
    const total = leads.length || 1;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count], i) => ({
        name,
        value: Math.round((count / total) * 100),
        count,
        color: SOURCE_COLORS[i % SOURCE_COLORS.length],
      }));
  }, [leads]);

  const eventTypeBookings = useMemo(() => {
    const counts: Record<string, { bookings: number; revenue: number }> = {};
    (projects as any[]).forEach(p => {
      const t = p.event_type || "Other";
      counts[t] = counts[t] || { bookings: 0, revenue: 0 };
      counts[t].bookings += 1;
    });
    invoices.forEach(inv => {
      const project = (projects as any[]).find(p => p.id === inv.project_id);
      if (project) {
        const t = project.event_type || "Other";
        counts[t] = counts[t] || { bookings: 0, revenue: 0 };
        counts[t].revenue += Number(inv.total_amount || 0);
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].bookings - a[1].bookings)
      .slice(0, 6)
      .map(([name, v]) => ({ name, ...v }));
  }, [projects, invoices]);

  const conversionTrend = useMemo(() => {
    return months.map(({ date, label }) => {
      const m = date.getMonth();
      const y = date.getFullYear();
      const monthLeads = leads.filter(l => {
        const d = parseISO(l.created_at);
        return d.getMonth() === m && d.getFullYear() === y;
      });
      const converted = monthLeads.filter(l => l.status === "converted").length;
      const rate = monthLeads.length ? Math.round((converted / monthLeads.length) * 100) : 0;
      return { month: label, rate };
    });
  }, [leads, months]);

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
  const totalBookings = (projects as any[]).length;
  const avgDealSize = totalBookings ? totalRevenue / totalBookings : 0;
  const convertedLeads = leads.filter(l => l.status === "converted").length;
  const avgConversion = leads.length ? Math.round((convertedLeads / leads.length) * 100) : 0;

  if (isLoading) {
    return (
      <div className="p-12 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Analytics &amp; Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Business insights — last 6 months
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Revenue Collected", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: IndianRupee, sub: "from paid invoices" },
          { label: "Bookings", value: totalBookings.toString(), icon: Camera, sub: "total projects" },
          { label: "Avg Deal Size", value: `₹${(avgDealSize / 1000).toFixed(0)}K`, icon: TrendingUp, sub: "per booking" },
          { label: "Conversion Rate", value: `${avgConversion}%`, icon: Users, sub: "leads → clients" },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              <kpi.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg bg-card border border-border p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Monthly Revenue</h2>
          {monthlyRevenue.every(m => m.revenue === 0) ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No paid invoices yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyRevenue}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                  formatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg bg-card border border-border p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Lead Sources</h2>
          {leadSources.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
              No leads yet.
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={leadSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={50} paddingAngle={2}>
                    {leadSources.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {leadSources.map((source) => (
                  <div key={source.name} className="flex items-center gap-2 text-xs">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                    <span className="text-foreground truncate">{source.name}</span>
                    <span className="text-muted-foreground ml-auto shrink-0">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg bg-card border border-border p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Event Type Bookings</h2>
          {eventTypeBookings.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
              No projects yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={eventTypeBookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-lg bg-card border border-border p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Conversion Rate Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={conversionTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                formatter={(v: number) => `${v}%`}
              />
              <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
