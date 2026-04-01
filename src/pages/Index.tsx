import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, UserPlus, Camera, IndianRupee, TrendingUp, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const stats = [
  { title: "Total Leads", value: "148", change: "+12 this week", changeType: "positive" as const, icon: UserPlus },
  { title: "Active Clients", value: "64", change: "+3 new", changeType: "positive" as const, icon: Users },
  { title: "Upcoming Shoots", value: "12", change: "Next: Tomorrow", changeType: "neutral" as const, icon: Camera },
  { title: "Revenue (MTD)", value: "₹4.8L", change: "+18% vs last month", changeType: "positive" as const, icon: IndianRupee },
];

const recentLeads = [
  { name: "Priya & Rahul", type: "Wedding", source: "Instagram", status: "New", date: "2 hours ago" },
  { name: "Arjun Mehta", type: "Corporate", source: "Website", status: "Contacted", date: "5 hours ago" },
  { name: "Sneha Kapoor", type: "Maternity", source: "WhatsApp", status: "New", date: "1 day ago" },
  { name: "TechVision Inc.", type: "Product", source: "Call", status: "Converted", date: "2 days ago" },
  { name: "Ananya & Vikram", type: "Pre-Wedding", source: "Instagram", status: "Contacted", date: "3 days ago" },
];

const upcomingShoots = [
  { client: "Meera & Aditya", type: "Wedding", date: "Apr 2", location: "Taj Palace, Delhi", team: "3 photographers" },
  { client: "Bloom Studio", type: "Product", date: "Apr 4", location: "Studio A", team: "1 photographer" },
  { client: "Riya Sharma", type: "Portrait", date: "Apr 6", location: "Lodhi Garden", team: "1 photographer" },
];

const statusColors: Record<string, string> = {
  New: "bg-primary/20 text-primary border-primary/30",
  Contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Converted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Lost: "bg-red-500/20 text-red-400 border-red-500/30",
};

const Index = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Good Morning, Amit 👋</h1>
            <p className="text-sm text-muted-foreground mt-1">Here's what's happening with your studio today.</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>April 1, 2026</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <StatCard key={stat.title} {...stat} index={i} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Leads */}
          <div className="lg:col-span-2 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">Recent Leads</h2>
              <span className="text-xs text-primary cursor-pointer hover:underline">View all →</span>
            </div>
            <div className="divide-y divide-border">
              {recentLeads.map((lead) => (
                <div key={lead.name} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-primary">{lead.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{lead.name}</p>
                      <p className="text-xs text-muted-foreground">{lead.type} · {lead.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className={statusColors[lead.status]}>
                      {lead.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden sm:block">{lead.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Shoots */}
          <div className="rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">Upcoming Shoots</h2>
              <span className="text-xs text-primary cursor-pointer hover:underline">Calendar →</span>
            </div>
            <div className="p-4 space-y-3">
              {upcomingShoots.map((shoot) => (
                <div key={shoot.client} className="rounded-md border border-border p-3 hover:border-gold-subtle transition-colors bg-muted/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{shoot.client}</span>
                    <span className="text-xs font-mono text-primary">{shoot.date}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{shoot.type} · {shoot.location}</p>
                  <p className="text-xs text-muted-foreground mt-1">{shoot.team}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pipeline Summary */}
        <div className="rounded-lg bg-card border border-border p-5">
          <h2 className="font-display font-semibold text-foreground mb-4">Lead Pipeline</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { stage: "New", count: 24, color: "bg-primary" },
              { stage: "Contacted", count: 18, color: "bg-blue-500" },
              { stage: "Converted", count: 12, color: "bg-emerald-500" },
              { stage: "Lost", count: 6, color: "bg-red-500" },
            ].map((item) => (
              <div key={item.stage} className="text-center">
                <div className="text-2xl font-display font-bold text-foreground">{item.count}</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className={`h-2 w-2 rounded-full ${item.color}`} />
                  <span className="text-xs text-muted-foreground">{item.stage}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 h-2 rounded-full bg-muted overflow-hidden flex">
            <div className="bg-primary h-full" style={{ width: "40%" }} />
            <div className="bg-blue-500 h-full" style={{ width: "30%" }} />
            <div className="bg-emerald-500 h-full" style={{ width: "20%" }} />
            <div className="bg-red-500 h-full" style={{ width: "10%" }} />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Lead", icon: UserPlus },
            { label: "New Project", icon: Camera },
            { label: "Create Invoice", icon: IndianRupee },
            { label: "View Reports", icon: TrendingUp },
          ].map((action) => (
            <button
              key={action.label}
              className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all p-3 text-sm text-foreground"
            >
              <action.icon className="h-4 w-4 text-primary" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;
