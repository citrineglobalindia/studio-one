import { DashboardLayout } from "@/components/DashboardLayout";
import { BarChart3, TrendingUp, IndianRupee, Users, Camera, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Area, AreaChart } from "recharts";

const monthlyRevenue = [
  { month: "Nov", revenue: 280000, bookings: 3 },
  { month: "Dec", revenue: 420000, bookings: 5 },
  { month: "Jan", revenue: 350000, bookings: 4 },
  { month: "Feb", revenue: 180000, bookings: 2 },
  { month: "Mar", revenue: 480000, bookings: 6 },
  { month: "Apr", revenue: 320000, bookings: 4 },
];

const leadSources = [
  { name: "Instagram", value: 45, color: "hsl(var(--primary))" },
  { name: "WhatsApp", value: 25, color: "hsl(210, 70%, 55%)" },
  { name: "Referral", value: 18, color: "hsl(150, 60%, 45%)" },
  { name: "Website", value: 8, color: "hsl(270, 50%, 55%)" },
  { name: "Call", value: 4, color: "hsl(0, 60%, 50%)" },
];

const packagePopularity = [
  { name: "Classic", bookings: 12, revenue: 1800000 },
  { name: "Premium", bookings: 18, revenue: 4500000 },
  { name: "Royal", bookings: 8, revenue: 2800000 },
  { name: "Destination", bookings: 3, revenue: 1500000 },
];

const conversionTrend = [
  { month: "Nov", rate: 28 },
  { month: "Dec", rate: 32 },
  { month: "Jan", rate: 25 },
  { month: "Feb", rate: 35 },
  { month: "Mar", rate: 40 },
  { month: "Apr", rate: 38 },
];

const totalRevenue = monthlyRevenue.reduce((s, m) => s + m.revenue, 0);
const totalBookings = monthlyRevenue.reduce((s, m) => s + m.bookings, 0);
const avgDealSize = Math.round(totalRevenue / totalBookings);
const avgConversion = Math.round(conversionTrend.reduce((s, c) => s + c.rate, 0) / conversionTrend.length);

export default function AnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Business insights for Nov 2025 – Apr 2026</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, icon: IndianRupee, sub: "6 months" },
            { label: "Bookings", value: totalBookings.toString(), icon: Camera, sub: "6 months" },
            { label: "Avg Deal Size", value: `₹${(avgDealSize / 1000).toFixed(0)}K`, icon: TrendingUp, sub: "per booking" },
            { label: "Conversion Rate", value: `${avgConversion}%`, icon: Users, sub: "avg 6 months" },
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

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <div className="rounded-lg bg-card border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-4">Monthly Revenue</h2>
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
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `₹${v / 1000}K`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`} />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revenueGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Lead Sources */}
          <div className="rounded-lg bg-card border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-4">Lead Sources</h2>
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
              <div className="space-y-2">
                {leadSources.map((source) => (
                  <div key={source.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: source.color }} />
                    <span className="text-xs text-foreground">{source.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{source.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Package Popularity */}
          <div className="rounded-lg bg-card border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-4">Package Bookings</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={packagePopularity}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
                <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Conversion Trend */}
          <div className="rounded-lg bg-card border border-border p-5">
            <h2 className="font-display font-semibold text-foreground mb-4">Conversion Rate Trend</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={conversionTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} formatter={(v: number) => `${v}%`} />
                <Line type="monotone" dataKey="rate" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: "hsl(var(--primary))", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
