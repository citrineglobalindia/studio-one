import { DashboardLayout } from "@/components/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Users, UserPlus, Camera, IndianRupee, TrendingUp, CalendarDays, AlertTriangle, Clock, CheckCircle, Film } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { sampleProjects } from "@/data/wedding-types";
import { sampleLeads } from "@/data/lead-types";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

// Derive real metrics from data
const today = new Date("2026-04-01");

const allPayments = sampleProjects.flatMap((p) => p.payments);
const totalRevenue = allPayments.reduce((s, p) => s + p.paidAmount, 0);
const totalPending = allPayments.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount - p.paidAmount), 0);
const overduePayments = allPayments.filter(
  (p) => p.status !== "paid" && new Date(p.dueDate) < today
);
const overdueAmount = overduePayments.reduce((s, p) => s + (p.amount - p.paidAmount), 0);

const allSubEvents = sampleProjects.flatMap((p) =>
  p.subEvents.map((se) => ({ ...se, projectClient: `${p.clientName} & ${p.partnerName}` }))
);
const upcomingShoots = allSubEvents
  .filter((se) => se.status === "upcoming" && new Date(se.date) >= today)
  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

const allFootage = sampleProjects.flatMap((p) =>
  p.footage.map((f) => ({ ...f, projectClient: `${p.clientName} & ${p.partnerName}` }))
);
const pendingEdits = allFootage.filter((f) => f.editStatus === "pending" || f.editStatus === "in-progress");
const reviewEdits = allFootage.filter((f) => f.editStatus === "review");

const newLeadsCount = sampleLeads.filter((l) => l.stage === "new").length;
const convertedValue = sampleLeads.filter((l) => l.stage === "converted").reduce((s, l) => s + (l.budget || 0), 0);

const stats: Array<{ title: string; value: string; change: string; changeType: "positive" | "negative" | "neutral"; icon: typeof IndianRupee }> = [
  { title: "Revenue Collected", value: `₹${(totalRevenue / 100000).toFixed(1)}L`, change: `₹${(totalPending / 100000).toFixed(1)}L pending`, changeType: "neutral", icon: IndianRupee },
  { title: "Upcoming Shoots", value: String(upcomingShoots.length), change: upcomingShoots[0] ? `Next: ${upcomingShoots[0].date.slice(5)}` : "None scheduled", changeType: "neutral", icon: Camera },
  { title: "Pending Edits", value: String(pendingEdits.length), change: `${reviewEdits.length} in review`, changeType: reviewEdits.length > 0 ? "positive" : "neutral", icon: Film },
  { title: "Overdue Payments", value: overduePayments.length > 0 ? `₹${(overdueAmount / 1000).toFixed(0)}K` : "₹0", change: `${overduePayments.length} invoice(s)`, changeType: overduePayments.length > 0 ? "negative" : "positive", icon: AlertTriangle },
];

const statusColors: Record<string, string> = {
  New: "bg-primary/20 text-primary border-primary/30",
  Contacted: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Converted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  Lost: "bg-red-500/20 text-red-400 border-red-500/30",
};

const editStatusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  "in-progress": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  review: "bg-primary/20 text-primary border-primary/30",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

const Index = () => {
  const navigate = useNavigate();

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
          {/* Upcoming Shoots */}
          <div className="lg:col-span-2 rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">Upcoming Shoots</h2>
              <span onClick={() => navigate("/calendar")} className="text-xs text-primary cursor-pointer hover:underline">Calendar →</span>
            </div>
            <div className="divide-y divide-border">
              {upcomingShoots.slice(0, 6).map((shoot) => (
                <div key={shoot.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Camera className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{shoot.name}</p>
                      <p className="text-xs text-muted-foreground">{shoot.projectClient} · {shoot.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-primary">{shoot.date.slice(5)}</span>
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[10px]">
                      {shoot.assignedTeam.length} crew
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Edits */}
          <div className="rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">Editing Queue</h2>
              <span onClick={() => navigate("/projects")} className="text-xs text-primary cursor-pointer hover:underline">Projects →</span>
            </div>
            <div className="p-4 space-y-3">
              {pendingEdits.slice(0, 5).map((item) => (
                <div key={item.id} className="rounded-md border border-border p-3 hover:border-primary/30 transition-colors bg-muted/20">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-foreground truncate">{item.subEventName}</span>
                    <Badge variant="outline" className={editStatusColors[item.editStatus] + " text-[10px]"}>
                      {item.editStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{item.projectClient} · {item.deliveryType} · {item.assignedEditor}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={item.editProgress} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground font-mono">{item.editProgress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Grid: Overdue Payments + Lead Pipeline + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overdue & Pending Payments */}
          <div className="rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">Payment Tracker</h2>
              <span onClick={() => navigate("/invoices")} className="text-xs text-primary cursor-pointer hover:underline">Invoices →</span>
            </div>
            <div className="divide-y divide-border">
              {allPayments
                .filter((p) => p.status !== "paid")
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 5)
                .map((payment) => {
                  const project = sampleProjects.find((p) => p.id === payment.projectId);
                  const isOverdue = new Date(payment.dueDate) < today;
                  return (
                    <div key={payment.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{payment.label}</p>
                        <p className="text-xs text-muted-foreground">{project?.clientName} · {payment.invoiceNumber}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-mono text-foreground">₹{(payment.amount / 1000).toFixed(0)}K</span>
                        <Badge variant="outline" className={isOverdue ? "bg-destructive/20 text-red-400 border-red-500/30 text-[10px]" : "bg-primary/10 text-primary border-primary/30 text-[10px]"}>
                          {isOverdue ? "Overdue" : payment.dueDate.slice(5)}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Lead Pipeline Summary */}
          <div className="rounded-lg bg-card border border-border">
            <div className="flex items-center justify-between p-5 border-b border-border">
              <h2 className="font-display font-semibold text-foreground">Lead Pipeline</h2>
              <span onClick={() => navigate("/leads")} className="text-xs text-primary cursor-pointer hover:underline">View all →</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {[
                  { stage: "New", count: sampleLeads.filter((l) => l.stage === "new").length, color: "bg-primary" },
                  { stage: "Contacted", count: sampleLeads.filter((l) => l.stage === "contacted").length, color: "bg-blue-500" },
                  { stage: "Converted", count: sampleLeads.filter((l) => l.stage === "converted").length, color: "bg-emerald-500" },
                  { stage: "Lost", count: sampleLeads.filter((l) => l.stage === "lost").length, color: "bg-red-500" },
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
              <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                {(() => {
                  const total = sampleLeads.length || 1;
                  const stages = ["new", "contacted", "converted", "lost"];
                  const colors = ["bg-primary", "bg-blue-500", "bg-emerald-500", "bg-red-500"];
                  return stages.map((s, i) => (
                    <div key={s} className={`${colors[i]} h-full`} style={{ width: `${(sampleLeads.filter((l) => l.stage === s).length / total) * 100}%` }} />
                  ));
                })()}
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Pipeline value: ₹{(sampleLeads.reduce((s, l) => s + (l.budget || 0), 0) / 100000).toFixed(1)}L</span>
                <span>Converted: ₹{(convertedValue / 100000).toFixed(1)}L</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Add Lead", icon: UserPlus, path: "/leads" },
            { label: "New Project", icon: Camera, path: "/projects" },
            { label: "Create Invoice", icon: IndianRupee, path: "/invoices" },
            { label: "View Reports", icon: TrendingUp, path: "/analytics" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
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
