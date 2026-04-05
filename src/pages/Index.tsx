import {
  Users, UserPlus, Camera, IndianRupee, TrendingUp, CalendarDays,
  AlertTriangle, Clock, CheckCircle, Film, ArrowUpRight, ArrowDownRight,
  Zap, Target, Eye, PhoneCall, BarChart3, Sparkles, ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { sampleProjects } from "@/data/wedding-types";
import { sampleLeads } from "@/data/lead-types";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

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

const convertedValue = sampleLeads.filter((l) => l.stage === "converted").reduce((s, l) => s + (l.budget || 0), 0);

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

const Index = () => {
  const navigate = useNavigate();

  const stats = [
    {
      title: "Revenue Collected",
      value: `₹${(totalRevenue / 100000).toFixed(1)}L`,
      sub: `₹${(totalPending / 100000).toFixed(1)}L pending`,
      icon: IndianRupee,
      trend: "+12.5%",
      trendUp: true,
      gradient: "from-emerald-500/20 to-emerald-500/5",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
    },
    {
      title: "Upcoming Shoots",
      value: String(upcomingShoots.length),
      sub: upcomingShoots[0] ? `Next: ${new Date(upcomingShoots[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "None scheduled",
      icon: Camera,
      trend: `${upcomingShoots.length} this week`,
      trendUp: true,
      gradient: "from-blue-500/20 to-blue-500/5",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
    },
    {
      title: "Pending Edits",
      value: String(pendingEdits.length),
      sub: `${reviewEdits.length} in review`,
      icon: Film,
      trend: "-3 from last week",
      trendUp: false,
      gradient: "from-purple-500/20 to-purple-500/5",
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-500",
    },
    {
      title: "Overdue Payments",
      value: overduePayments.length > 0 ? `₹${(overdueAmount / 1000).toFixed(0)}K` : "₹0",
      sub: `${overduePayments.length} invoice(s)`,
      icon: AlertTriangle,
      trend: overduePayments.length > 0 ? "Needs attention" : "All clear",
      trendUp: overduePayments.length === 0,
      gradient: overduePayments.length > 0 ? "from-red-500/20 to-red-500/5" : "from-emerald-500/20 to-emerald-500/5",
      iconBg: overduePayments.length > 0 ? "bg-red-500/15" : "bg-emerald-500/15",
      iconColor: overduePayments.length > 0 ? "text-red-500" : "text-emerald-500",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Dashboard Overview</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Good Morning, Amit 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              Here's your studio's pulse for today. You have{" "}
              <span className="text-primary font-medium">{upcomingShoots.length} upcoming shoots</span> and{" "}
              <span className="text-primary font-medium">{pendingEdits.length} pending edits</span>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/80 backdrop-blur border border-border">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {today.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.title}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${stat.gradient} border border-border p-5 group hover:border-primary/30 transition-all cursor-pointer`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`h-11 w-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? "text-emerald-500" : "text-red-400"}`}>
                {stat.trendUp ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {stat.trend}
              </div>
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
            <p className="text-[11px] text-muted-foreground/80 mt-0.5">{stat.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Main Content: 2-column */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upcoming Shoots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 rounded-xl bg-card border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold text-foreground">Upcoming Shoots</h2>
              <Badge variant="secondary" className="text-[10px] h-5">{upcomingShoots.length}</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/calendar")}>
              View Calendar <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {upcomingShoots.slice(0, 5).map((shoot, i) => (
              <motion.div
                key={shoot.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors group/row cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                    <Camera className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate group-hover/row:text-primary transition-colors">
                      {shoot.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{shoot.projectClient} · {shoot.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-medium text-foreground">
                      {new Date(shoot.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{shoot.assignedTeam.length} crew</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover/row:text-primary transition-colors" />
                </div>
              </motion.div>
            ))}
            {upcomingShoots.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No upcoming shoots</div>
            )}
          </div>
        </motion.div>

        {/* Editing Queue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-xl bg-card border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4 text-purple-500" />
              <h2 className="font-display font-semibold text-foreground">Editing Queue</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/projects")}>
              All <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="p-4 space-y-3">
            {pendingEdits.slice(0, 4).map((item, i) => {
              const statusColors: Record<string, string> = {
                pending: "text-muted-foreground bg-muted/50",
                "in-progress": "text-blue-500 bg-blue-500/10",
                review: "text-primary bg-primary/10",
              };
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.06 }}
                  className="rounded-xl border border-border p-3.5 hover:border-primary/30 transition-all bg-gradient-to-br from-muted/20 to-transparent cursor-pointer group/edit"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground truncate group-hover/edit:text-primary transition-colors">
                      {item.subEventName}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColors[item.editStatus] || ""}`}>
                      {item.editStatus}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2.5">{item.projectClient} · {item.assignedEditor}</p>
                  <div className="flex items-center gap-2">
                    <Progress value={item.editProgress} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">{item.editProgress}%</span>
                  </div>
                </motion.div>
              );
            })}
            {pendingEdits.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">All edits complete! 🎉</div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bottom: Payment + Lead Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Payment Tracker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-xl bg-card border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <IndianRupee className="h-4 w-4 text-emerald-500" />
              <h2 className="font-display font-semibold text-foreground">Payment Tracker</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/invoices")}>
              Invoices <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="divide-y divide-border">
            {allPayments
              .filter((p) => p.status !== "paid")
              .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
              .slice(0, 5)
              .map((payment, i) => {
                const project = sampleProjects.find((p) => p.id === payment.projectId);
                const isOverdue = new Date(payment.dueDate) < today;
                return (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{payment.label}</p>
                      <p className="text-xs text-muted-foreground">{project?.clientName} · {payment.invoiceNumber}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-mono font-semibold text-foreground">₹{(payment.amount / 1000).toFixed(0)}K</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          isOverdue
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : "bg-primary/10 text-primary border-primary/30"
                        }`}
                      >
                        {isOverdue ? "Overdue" : new Date(payment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </Badge>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </motion.div>

        {/* Lead Pipeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-xl bg-card border border-border overflow-hidden"
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h2 className="font-display font-semibold text-foreground">Lead Pipeline</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/leads")}>
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="p-5 space-y-5">
            {/* Pipeline Stats */}
            <div className="grid grid-cols-4 gap-3">
              {[
                { stage: "New", count: sampleLeads.filter((l) => l.stage === "new").length, color: "from-blue-500/20 to-blue-500/5", dot: "bg-blue-500" },
                { stage: "Contacted", count: sampleLeads.filter((l) => l.stage === "contacted").length, color: "from-amber-500/20 to-amber-500/5", dot: "bg-amber-500" },
                { stage: "Converted", count: sampleLeads.filter((l) => l.stage === "converted").length, color: "from-emerald-500/20 to-emerald-500/5", dot: "bg-emerald-500" },
                { stage: "Lost", count: sampleLeads.filter((l) => l.stage === "lost").length, color: "from-red-500/20 to-red-500/5", dot: "bg-red-500" },
              ].map((item) => (
                <div key={item.stage} className={`text-center p-3 rounded-xl bg-gradient-to-b ${item.color}`}>
                  <div className="text-xl font-display font-bold text-foreground">{item.count}</div>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
                    <span className="text-[10px] text-muted-foreground">{item.stage}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pipeline Bar */}
            <div className="h-3 rounded-full bg-muted overflow-hidden flex gap-0.5">
              {(() => {
                const total = sampleLeads.length || 1;
                const pipeline = [
                  { stage: "new", color: "bg-blue-500" },
                  { stage: "contacted", color: "bg-amber-500" },
                  { stage: "converted", color: "bg-emerald-500" },
                  { stage: "lost", color: "bg-red-500" },
                ];
                return pipeline.map((s) => (
                  <div
                    key={s.stage}
                    className={`${s.color} h-full rounded-full transition-all`}
                    style={{ width: `${(sampleLeads.filter((l) => l.stage === s.stage).length / total) * 100}%` }}
                  />
                ));
              })()}
            </div>

            {/* Summary Row */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Pipeline Value</p>
                <p className="text-lg font-display font-bold text-foreground">
                  ₹{(sampleLeads.reduce((s, l) => s + (l.budget || 0), 0) / 100000).toFixed(1)}L
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Converted</p>
                <p className="text-lg font-display font-bold text-emerald-500">
                  ₹{(convertedValue / 100000).toFixed(1)}L
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {[
          { label: "Add Lead", icon: UserPlus, path: "/leads", gradient: "from-blue-500/10 to-transparent" },
          { label: "New Project", icon: Camera, path: "/projects", gradient: "from-purple-500/10 to-transparent" },
          { label: "Create Invoice", icon: IndianRupee, path: "/invoices", gradient: "from-emerald-500/10 to-transparent" },
          { label: "View Team", icon: Users, path: "/team", gradient: "from-primary/10 to-transparent" },
        ].map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className={`flex items-center justify-center gap-2.5 rounded-xl border border-border bg-gradient-to-br ${action.gradient} hover:border-primary/40 transition-all p-4 text-sm font-medium text-foreground group/action`}
          >
            <action.icon className="h-4.5 w-4.5 text-primary group-hover/action:scale-110 transition-transform" />
            {action.label}
          </button>
        ))}
      </motion.div>
    </div>
  );
};

export default Index;
