import { useState, useMemo, useEffect, useRef } from "react";
import {
  Users, UserPlus, Camera, IndianRupee, TrendingUp, CalendarDays,
  AlertTriangle, Clock, CheckCircle, Film, ArrowUpRight, ArrowDownRight,
  Zap, Target, Eye, PhoneCall, BarChart3, Sparkles, ChevronRight, MapPin,
  Crown, Activity, ArrowRight, Briefcase, PieChart as PieChartIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import { sampleProjects } from "@/data/wedding-types";
import { sampleLeads } from "@/data/lead-types";
import { MiniPieCard } from "@/components/dashboards/MiniPieCard";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useOrg } from "@/contexts/OrgContext";
import { useClients } from "@/hooks/useClients";
import { PhotographerDashboard } from "@/components/dashboards/PhotographerDashboard";
import { VideographerDashboard } from "@/components/dashboards/VideographerDashboard";
import { EditorDashboard } from "@/components/dashboards/EditorDashboard";
import { TelecallerDashboard } from "@/components/dashboards/TelecallerDashboard";
import { VendorDashboard } from "@/components/dashboards/VendorDashboard";
import { HRDashboardRole } from "@/components/dashboards/HRDashboardRole";
import { AccountsDashboard } from "@/components/dashboards/AccountsDashboard";

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

const convertedLeads = sampleLeads.filter((l) => l.stage === "converted");
const convertedValue = convertedLeads.reduce((s, l) => s + (l.budget || 0), 0);

// --- Animations ---
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 220, damping: 22 },
  },
};

// Animated number counter
const AnimatedNumber = ({ value, delay = 0, prefix = "", suffix = "" }: { value: number; delay?: number; prefix?: string; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionVal, value, {
        duration: 1.2,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      });
      return controls.stop;
    }
  }, [isInView, motionVal, value, delay]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => {
      if (ref.current) ref.current.textContent = `${prefix}${v}${suffix}`;
    });
    return unsubscribe;
  }, [rounded, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
};

// Premium bar component
const PremiumBar = ({ label, value, total, colorClass, delay, labelColor }: {
  label: string; value: number; total: number; colorClass: string; delay: number; labelColor: string;
}) => (
  <div className="mb-3.5 last:mb-0">
    <div className="flex justify-between mb-1.5 text-[12px]">
      <span className={`font-semibold ${labelColor}`}>{label}</span>
      <span className="font-bold text-foreground">
        <AnimatedNumber value={value} delay={delay} />
        <span className="text-muted-foreground font-normal">/{total}</span>
      </span>
    </div>
    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${(value / total) * 100}%` }}
        transition={{ delay, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
        className={`h-full rounded-full ${colorClass}`}
      />
    </div>
  </div>
);

const Index = () => {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const { organization } = useOrg();
  const { clients: dbClients } = useClients();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const totalClientBudget = useMemo(() => dbClients.reduce((s, c) => s + (c.budget || 0), 0), [dbClients]);

  const eventDates = useMemo(() => {
    const dates: Date[] = [];
    allSubEvents.forEach((se) => {
      if (se.status === "upcoming" || se.status === "in-progress") {
        dates.push(new Date(se.date));
      }
    });
    // Also include client event dates from DB
    dbClients.forEach((c) => {
      if (c.event_date) dates.push(new Date(c.event_date));
    });
    return dates;
  }, [dbClients]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const sel = selectedDate.toISOString().slice(0, 10);
    return allSubEvents.filter((se) => se.date === sel);
  }, [selectedDate]);

  const upcomingList = upcomingShoots.slice(0, 5);

  // Role-specific dashboards
  if (currentRole === "photographer") return <PhotographerDashboard />;
  if (currentRole === "videographer") return <VideographerDashboard />;
  if (currentRole === "editor") return <EditorDashboard />;
  if (currentRole === "telecaller") return <TelecallerDashboard />;
  if (currentRole === "vendor") return <VendorDashboard />;
  if (currentRole === "hr") return <HRDashboardRole />;
  if (currentRole === "accounts") return <AccountsDashboard />;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-5"
    >
      {/* ═══ Premium Hero Header ═══ */}
      <motion.div
        variants={cardVariants}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/20 p-6 sm:p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-primary/5 rounded-full blur-3xl translate-y-1/2" />
        <div className="absolute top-20 right-16 w-2 h-2 bg-primary/40 rounded-full animate-pulse" />
        <div className="absolute bottom-12 left-20 w-1.5 h-1.5 bg-primary/25 rounded-full" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-medium text-primary uppercase tracking-[0.2em]">Dashboard Overview</span>
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
                Good Morning{organization?.name ? `, ${organization.name}` : ""}
              </h1>
              <motion.span
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                className="text-2xl"
              >
                👋
              </motion.span>
            </div>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-md">
               Here's your studio pulse.{" "}
              <span className="text-primary font-medium">{dbClients.length} clients</span>,{" "}
              <span className="text-primary font-medium">{upcomingShoots.length} upcoming shoots</span> and{" "}
              <span className="text-primary font-medium">{pendingEdits.length} pending edits</span> await.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-[10px] text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                <Crown className="h-3 w-3" />
                Premium Studio
              </span>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                <Activity className="h-3 w-3" />
                Live
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/80 backdrop-blur border border-border">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              {today.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* ═══ Hero Stat Cards ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: IndianRupee,
            label: "Revenue",
            value: Math.round(totalRevenue / 1000),
            suffix: "K",
            prefix: "₹",
            accent: "from-emerald-500/20 to-emerald-500/5",
            iconColor: "text-emerald-500",
            ring: "ring-emerald-500/15",
            trend: "+12.5%",
            trendUp: true,
          },
          {
            icon: Camera,
            label: "Upcoming Shoots",
            value: upcomingShoots.length,
            suffix: "",
            prefix: "",
            accent: "from-blue-500/20 to-blue-500/5",
            iconColor: "text-blue-500",
            ring: "ring-blue-500/15",
            trend: `Next: ${upcomingShoots[0] ? new Date(upcomingShoots[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "–"}`,
            trendUp: true,
          },
          {
            icon: Film,
            label: "Pending Edits",
            value: pendingEdits.length,
            suffix: "",
            prefix: "",
            accent: "from-purple-500/20 to-purple-500/5",
            iconColor: "text-purple-500",
            ring: "ring-purple-500/15",
            trend: `${reviewEdits.length} in review`,
            trendUp: false,
          },
          {
            icon: AlertTriangle,
            label: "Overdue",
            value: overduePayments.length,
            suffix: "",
            prefix: "",
            accent: overduePayments.length > 0 ? "from-red-500/20 to-red-500/5" : "from-emerald-500/20 to-emerald-500/5",
            iconColor: overduePayments.length > 0 ? "text-red-500" : "text-emerald-500",
            ring: overduePayments.length > 0 ? "ring-red-500/15" : "ring-emerald-500/15",
            trend: overduePayments.length > 0 ? `₹${(overdueAmount / 1000).toFixed(0)}K due` : "All clear",
            trendUp: overduePayments.length === 0,
          },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={cardVariants}
              className={`bg-gradient-to-b ${stat.accent} backdrop-blur-sm border border-border rounded-2xl p-4 ring-1 ${stat.ring} hover:ring-2 transition-all cursor-pointer group`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-card/80 flex items-center justify-center ring-1 ring-border">
                  <Icon className={`h-4.5 w-4.5 ${stat.iconColor}`} />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-medium ${stat.trendUp ? "text-emerald-500" : "text-red-400"}`}>
                  {stat.trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-display font-extrabold text-foreground leading-tight">
                <AnimatedNumber value={stat.value} delay={0.2 + i * 0.1} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mt-1">{stat.label}</p>
              <p className="text-[10px] text-muted-foreground/80 mt-0.5">{stat.trend}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ Main Content Grid ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Tasks / Projects Card ── */}
        <motion.div variants={cardVariants} className="lg:col-span-1 space-y-4">
          {/* Editing Queue - Premium */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-primary" />
            <div className="p-4">
              <div className="flex justify-between items-start mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/15 to-blue-500/10 flex items-center justify-center ring-1 ring-purple-500/10">
                    <Film className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] text-foreground">Editing Queue</h4>
                    <p className="text-[10px] text-muted-foreground">Track post-production</p>
                  </div>
                </div>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring" as const, stiffness: 200 }}
                  className="text-right"
                >
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Total</span>
                  <span className="text-purple-500 font-extrabold text-[24px] leading-tight">
                    <AnimatedNumber value={pendingEdits.length + reviewEdits.length} delay={0.3} />
                  </span>
                </motion.div>
              </div>

              <div className="space-y-2.5 mb-3.5">
                {[
                  { label: "Completed", value: allFootage.filter(f => f.editStatus === "approved" || f.editStatus === "delivered").length, dot: "bg-emerald-500", textColor: "text-emerald-500" },
                  { label: "In Progress", value: allFootage.filter(f => f.editStatus === "in-progress").length, dot: "bg-blue-500", textColor: "text-blue-500" },
                  { label: "Pending", value: allFootage.filter(f => f.editStatus === "pending").length, dot: "bg-destructive", textColor: "text-destructive" },
                ].map((item, i) => (
                  <div key={item.label} className="flex items-center gap-2.5 text-[12px]">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.1, type: "spring" as const }}
                      className={`h-2.5 w-2.5 rounded-full ${item.dot}`}
                    />
                    <span className="text-muted-foreground flex-1">{item.label}</span>
                    <span className={`font-bold ${item.textColor}`}>
                      <AnimatedNumber value={item.value} delay={0.4 + i * 0.1} />
                    </span>
                  </div>
                ))}
              </div>

              {/* Segmented progress bar */}
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {(() => {
                  const total = allFootage.length || 1;
                  const completed = allFootage.filter(f => f.editStatus === "approved" || f.editStatus === "delivered").length;
                  const inProgress = allFootage.filter(f => f.editStatus === "in-progress").length;
                  const pending = allFootage.filter(f => f.editStatus === "pending").length;
                  return (
                    <>
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(completed / total) * 100}%` }} transition={{ delay: 0.5, duration: 1, ease: [0.25, 0.1, 0.25, 1] }} className="bg-emerald-500 rounded-full" />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(inProgress / total) * 100}%` }} transition={{ delay: 0.65, duration: 1, ease: [0.25, 0.1, 0.25, 1] }} className="bg-blue-500 rounded-full" />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(pending / total) * 100}%` }} transition={{ delay: 0.8, duration: 1, ease: [0.25, 0.1, 0.25, 1] }} className="bg-destructive rounded-full" />
                    </>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* Project Status - Premium */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
            <div className="p-4">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center ring-1 ring-primary/10">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-foreground">Projects</h4>
                  <p className="text-[10px] text-muted-foreground">Completion tracking</p>
                </div>
              </div>
              <PremiumBar
                label="Active"
                value={sampleProjects.filter(p => p.status === "in-progress").length}
                total={sampleProjects.length}
                colorClass="bg-blue-500"
                delay={0.5}
                labelColor="text-blue-500"
              />
              <PremiumBar
                label="Completed"
                value={sampleProjects.filter(p => p.status === "completed").length}
                total={sampleProjects.length}
                colorClass="bg-emerald-500"
                delay={0.65}
                labelColor="text-emerald-500"
              />
              <PremiumBar
                label="Upcoming"
                value={sampleProjects.filter(p => p.status === "booked" || p.status === "inquiry").length}
                total={sampleProjects.length}
                colorClass="bg-primary"
                delay={0.8}
                labelColor="text-primary"
              />
            </div>
          </div>
        </motion.div>

        {/* ── Event Calendar ── */}
        <motion.div
          variants={cardVariants}
          className="lg:col-span-2 rounded-2xl bg-card border border-border overflow-hidden"
        >
          <div className="h-1 bg-gradient-to-r from-blue-500 via-primary to-emerald-500" />
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/15 to-blue-500/10 flex items-center justify-center">
                <CalendarDays className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-display font-semibold text-foreground">Event Calendar</h2>
              <Badge variant="secondary" className="text-[10px] h-5">{upcomingShoots.length} upcoming</Badge>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/calendar")}>
              Full Calendar <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-col lg:flex-row">
            <div className="p-4 border-b lg:border-b-0 lg:border-r border-border flex justify-center shrink-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className={cn("p-3 pointer-events-auto")}
                modifiers={{ event: eventDates }}
                modifiersClassNames={{
                  event: "bg-primary/20 text-primary font-bold rounded-full",
                }}
              />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              {selectedDateEvents.length > 0 ? (
                <>
                  <div className="px-5 pt-4 pb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {selectedDate?.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {selectedDateEvents.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors cursor-pointer group/row"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                            <Camera className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover/row:text-primary transition-colors">{event.name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{event.projectClient}</span>
                              <span>·</span>
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 shrink-0">
                          {event.assignedTeam.length} crew
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="px-5 pt-4 pb-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {selectedDate
                        ? `No events · ${selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                        : "Upcoming Shoots"}
                    </p>
                  </div>
                  <div className="divide-y divide-border">
                    {upcomingList.map((shoot, i) => (
                      <motion.div
                        key={shoot.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + i * 0.05 }}
                        className="flex items-center justify-between px-5 py-3.5 hover:bg-muted/20 transition-colors group/row cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                            <Camera className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate group-hover/row:text-primary transition-colors">{shoot.name}</p>
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
                    {upcomingList.length === 0 && (
                      <div className="py-12 text-center text-sm text-muted-foreground">No upcoming shoots</div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ Analytics Pie Charts ═══ */}
      <motion.div variants={cardVariants}>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-primary/40" />
          <h3 className="text-[14px] font-bold text-foreground">Analytics Overview</h3>
          <PieChartIcon className="h-3.5 w-3.5 text-primary ml-1" />
        </div>
      </motion.div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniPieCard
          title="Revenue Split"
          subtitle="Collection breakdown"
          centerLabel={`₹${Math.round(totalRevenue / 1000)}K`}
          data={[
            { name: "Collected", value: Math.round(totalRevenue / 1000), color: "#10b981" },
            { name: "Pending", value: Math.round(totalPending / 1000), color: "#f59e0b" },
            { name: "Overdue", value: Math.round(overdueAmount / 1000), color: "#ef4444" },
          ]}
        />
        <MiniPieCard
          title="Lead Sources"
          subtitle="Where leads come from"
          data={(() => {
            const sourceColors: Record<string, string> = { Instagram: "#e1306c", Website: "#3b82f6", Referral: "#10b981", Google: "#f59e0b", Facebook: "#1877f2", JustDial: "#f97316", Other: "#8b5cf6" };
            const counts: Record<string, number> = {};
            sampleLeads.forEach((l) => { counts[l.source] = (counts[l.source] || 0) + 1; });
            return Object.entries(counts).map(([name, value]) => ({ name, value, color: sourceColors[name] || "#8b5cf6" }));
          })()}
        />
        <MiniPieCard
          title="Deliverable Status"
          subtitle="Post-production progress"
          data={[
            { name: "Completed", value: allFootage.filter(f => f.editStatus === "approved" || f.editStatus === "delivered").length, color: "#10b981" },
            { name: "In Progress", value: allFootage.filter(f => f.editStatus === "in-progress").length, color: "#3b82f6" },
            { name: "In Review", value: reviewEdits.length, color: "#f59e0b" },
            { name: "Pending", value: allFootage.filter(f => f.editStatus === "pending").length, color: "#ef4444" },
          ]}
        />
        <MiniPieCard
          title="Event Types"
          subtitle="Sub-event category mix"
          data={(() => {
            const typeColors: Record<string, string> = { Wedding: "#c4973b", "Pre-Wedding Shoot": "#8b5cf6", Reception: "#3b82f6", Engagement: "#ec4899", "Haldi Ceremony": "#f59e0b", Sangeet: "#f97316", "Mehendi Night": "#10b981" };
            const counts: Record<string, number> = {};
            allSubEvents.forEach((se) => { const n = se.name.split(" - ")[0] || se.name; counts[n] = (counts[n] || 0) + 1; });
            return Object.entries(counts).map(([name, value]) => ({ name, value, color: typeColors[name] || "#8b5cf6" }));
          })()}
        />
      </div>

      {/* ═══ Bottom Grid: Payment + Lead Pipeline ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Payment Tracker - Premium */}
        <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-primary" />
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-emerald-500" />
              </div>
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

        {/* Lead Pipeline - Premium */}
        <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-500 via-primary to-emerald-500" />
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/15 to-blue-500/10 flex items-center justify-center">
                <Target className="h-4 w-4 text-primary" />
              </div>
              <h2 className="font-display font-semibold text-foreground">Lead Pipeline</h2>
            </div>
            <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/leads")}>
              View All <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-4 gap-3">
              {[
                { stage: "New", count: sampleLeads.filter((l) => l.stage === "new").length, color: "from-blue-500/20 to-blue-500/5", dot: "bg-blue-500" },
                { stage: "Contacted", count: sampleLeads.filter((l) => l.stage === "contacted").length, color: "from-amber-500/20 to-amber-500/5", dot: "bg-amber-500" },
                { stage: "Converted", count: sampleLeads.filter((l) => l.stage === "converted").length, color: "from-emerald-500/20 to-emerald-500/5", dot: "bg-emerald-500" },
                { stage: "Lost", count: sampleLeads.filter((l) => l.stage === "lost").length, color: "from-red-500/20 to-red-500/5", dot: "bg-red-500" },
              ].map((item) => (
                <div key={item.stage} className={`text-center p-3 rounded-xl bg-gradient-to-b ${item.color}`}>
                  <div className="text-xl font-display font-bold text-foreground">
                    <AnimatedNumber value={item.count} delay={0.6} />
                  </div>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <div className={`h-1.5 w-1.5 rounded-full ${item.dot}`} />
                    <span className="text-[10px] text-muted-foreground">{item.stage}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Segmented Pipeline Bar */}
            <div className="h-3 rounded-full bg-muted overflow-hidden flex gap-0.5">
              {(() => {
                const total = sampleLeads.length || 1;
                return [
                  { stage: "new", color: "bg-blue-500" },
                  { stage: "contacted", color: "bg-amber-500" },
                  { stage: "converted", color: "bg-emerald-500" },
                  { stage: "lost", color: "bg-red-500" },
                ].map((s) => (
                  <motion.div
                    key={s.stage}
                    initial={{ width: 0 }}
                    animate={{ width: `${(sampleLeads.filter((l) => l.stage === s.stage).length / total) * 100}%` }}
                    transition={{ delay: 0.7, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
                    className={`${s.color} h-full rounded-full`}
                  />
                ));
              })()}
            </div>

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

      {/* ═══ Quick Actions ═══ */}
      <motion.div variants={cardVariants}>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-primary/40" />
          <h3 className="text-[14px] font-bold text-foreground">Quick Actions</h3>
          <Zap className="h-3 w-3 text-primary ml-1" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: "Add Lead", icon: UserPlus, path: "/leads", accent: "from-blue-500/8 to-transparent", iconBg: "bg-blue-500/12", iconColor: "text-blue-500" },
            { label: "New Project", icon: Camera, path: "/projects", accent: "from-purple-500/8 to-transparent", iconBg: "bg-purple-500/12", iconColor: "text-purple-500" },
            { label: "Create Invoice", icon: IndianRupee, path: "/invoices", accent: "from-emerald-500/8 to-transparent", iconBg: "bg-emerald-500/12", iconColor: "text-emerald-500" },
            { label: "View Team", icon: Users, path: "/team", accent: "from-primary/8 to-transparent", iconBg: "bg-primary/12", iconColor: "text-primary" },
          ].map((action) => {
            const Icon = action.icon;
            return (
              <motion.button
                key={action.label}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.path)}
                className={`bg-gradient-to-br ${action.accent} bg-card rounded-2xl border border-border p-4 flex items-center gap-3 group active:bg-secondary transition-all`}
              >
                <div className={`h-10 w-10 rounded-xl ${action.iconBg} flex items-center justify-center ring-1 ring-border`}>
                  <Icon className={`h-4 w-4 ${action.iconColor}`} />
                </div>
                <span className="text-[13px] font-semibold text-foreground flex-1 text-left">{action.label}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Index;
