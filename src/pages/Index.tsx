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
import { MiniPieCard } from "@/components/dashboards/MiniPieCard";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRole } from "@/contexts/RoleContext";
import { useOrg } from "@/contexts/OrgContext";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useLeads } from "@/hooks/useLeads";
import { useInvoices } from "@/hooks/useInvoices";
import { useEvents } from "@/hooks/useEvents";
import { PhotographerDashboard } from "@/components/dashboards/PhotographerDashboard";
import { VideographerDashboard } from "@/components/dashboards/VideographerDashboard";
import { EditorDashboard } from "@/components/dashboards/EditorDashboard";
import { TelecallerDashboard } from "@/components/dashboards/TelecallerDashboard";
import { VendorDashboard } from "@/components/dashboards/VendorDashboard";
import { HRDashboardRole } from "@/components/dashboards/HRDashboardRole";
import { AccountsDashboard } from "@/components/dashboards/AccountsDashboard";

const today = new Date();

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
  const { projects: dbProjects } = useProjects();
  const { events: dbEvents } = useEvents();
  const { leads: dbLeads } = useLeads();
  const { invoices: dbInvoices } = useInvoices();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // Computed stats from DB
  const totalRevenue = useMemo(() => dbInvoices.reduce((s, inv) => s + (inv.amount_paid || 0), 0), [dbInvoices]);
  const totalPending = useMemo(() => dbInvoices.reduce((s, inv) => s + ((inv.total_amount || 0) - (inv.amount_paid || 0)), 0), [dbInvoices]);
  const overdueInvoices = useMemo(() => dbInvoices.filter(inv => inv.status !== "paid" && inv.due_date && new Date(inv.due_date) < today), [dbInvoices]);
  const overdueAmount = useMemo(() => overdueInvoices.reduce((s, inv) => s + ((inv.total_amount || 0) - (inv.amount_paid || 0)), 0), [overdueInvoices]);

  const upcomingProjects = useMemo(() => dbProjects.filter(p => p.event_date && new Date(p.event_date) >= today && (p.status === "planning" || p.status === "booked")).sort((a, b) => new Date(a.event_date!).getTime() - new Date(b.event_date!).getTime()), [dbProjects]);

  const activeProjects = useMemo(() => dbProjects.filter(p => p.status === "in-progress" || p.status === "editing"), [dbProjects]);

  const convertedLeads = useMemo(() => dbLeads.filter(l => l.status === "converted"), [dbLeads]);
  const newLeads = useMemo(() => dbLeads.filter(l => l.status === "new"), [dbLeads]);

  const eventDates = useMemo(() => {
    const dates: Date[] = [];
    dbClients.forEach((c) => {
      if (c.event_date) dates.push(new Date(c.event_date));
    });
    dbProjects.forEach((p) => {
      if (p.event_date) dates.push(new Date(p.event_date));
    });
    dbEvents.forEach((e: any) => {
      if (e.event_date) dates.push(new Date(e.event_date));
    });
    return dates;
  }, [dbClients, dbProjects, dbEvents]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) return [];
    const sel = selectedDate.toISOString().slice(0, 10);
    const fromProjects = dbProjects.filter((p) => p.event_date === sel);
    const fromEvents = dbEvents
      .filter((e: any) => e.event_date === sel)
      .map((e: any) => ({
        id: e.id,
        project_name: e.name,
        event_type: e.event_type,
        event_date: e.event_date,
        venue: e.venue,
        status: e.status,
        client_id: e.client_id,
      }));
    return [...fromProjects, ...fromEvents];
  }, [selectedDate, dbProjects, dbEvents]);

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
              <span className="text-primary font-medium">{upcomingProjects.length} upcoming shoots</span> and{" "}
              <span className="text-primary font-medium">{activeProjects.length} active projects</span> await.
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
            trend: totalRevenue > 0 ? `₹${(totalPending / 1000).toFixed(0)}K pending` : "No invoices yet",
            trendUp: true,
          },
          {
            icon: Camera,
            label: "Upcoming Shoots",
            value: upcomingProjects.length,
            suffix: "",
            prefix: "",
            accent: "from-blue-500/20 to-blue-500/5",
            iconColor: "text-blue-500",
            ring: "ring-blue-500/15",
            trend: upcomingProjects[0] ? `Next: ${new Date(upcomingProjects[0].event_date!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : "None scheduled",
            trendUp: true,
          },
          {
            icon: Users,
            label: "Total Clients",
            value: dbClients.length,
            suffix: "",
            prefix: "",
            accent: "from-purple-500/20 to-purple-500/5",
            iconColor: "text-purple-500",
            ring: "ring-purple-500/15",
            trend: `${newLeads.length} new leads`,
            trendUp: true,
          },
          {
            icon: AlertTriangle,
            label: "Overdue",
            value: overdueInvoices.length,
            suffix: "",
            prefix: "",
            accent: overdueInvoices.length > 0 ? "from-red-500/20 to-red-500/5" : "from-emerald-500/20 to-emerald-500/5",
            iconColor: overdueInvoices.length > 0 ? "text-red-500" : "text-emerald-500",
            ring: overdueInvoices.length > 0 ? "ring-red-500/15" : "ring-emerald-500/15",
            trend: overdueInvoices.length > 0 ? `₹${(overdueAmount / 1000).toFixed(0)}K due` : "All clear",
            trendUp: overdueInvoices.length === 0,
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

        {/* ── Projects Overview ── */}
        <motion.div variants={cardVariants} className="lg:col-span-1 space-y-4">
          {/* Project Status */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-purple-500 via-blue-500 to-primary" />
            <div className="p-4">
              <div className="flex justify-between items-start mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500/15 to-blue-500/10 flex items-center justify-center ring-1 ring-purple-500/10">
                    <Briefcase className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] text-foreground">Projects</h4>
                    <p className="text-[10px] text-muted-foreground">Track all projects</p>
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
                    <AnimatedNumber value={dbProjects.length} delay={0.3} />
                  </span>
                </motion.div>
              </div>

              <div className="space-y-2.5 mb-3.5">
                {[
                  { label: "Completed", value: dbProjects.filter(p => p.status === "completed" || p.status === "delivered").length, dot: "bg-emerald-500", textColor: "text-emerald-500" },
                  { label: "In Progress", value: dbProjects.filter(p => p.status === "in-progress" || p.status === "editing").length, dot: "bg-blue-500", textColor: "text-blue-500" },
                  { label: "Planning", value: dbProjects.filter(p => p.status === "planning" || p.status === "booked").length, dot: "bg-amber-500", textColor: "text-amber-500" },
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

              {dbProjects.length > 0 && (
                <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                  {(() => {
                    const total = dbProjects.length || 1;
                    const completed = dbProjects.filter(p => p.status === "completed" || p.status === "delivered").length;
                    const inProgress = dbProjects.filter(p => p.status === "in-progress" || p.status === "editing").length;
                    const planning = dbProjects.filter(p => p.status === "planning" || p.status === "booked").length;
                    return (
                      <>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(completed / total) * 100}%` }} transition={{ delay: 0.5, duration: 1 }} className="bg-emerald-500 rounded-full" />
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(inProgress / total) * 100}%` }} transition={{ delay: 0.65, duration: 1 }} className="bg-blue-500 rounded-full" />
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(planning / total) * 100}%` }} transition={{ delay: 0.8, duration: 1 }} className="bg-amber-500 rounded-full" />
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Leads Pipeline */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-500 via-primary to-purple-500" />
            <div className="p-4">
              <div className="flex justify-between items-start mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-primary/10 flex items-center justify-center ring-1 ring-emerald-500/10">
                    <Target className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-[15px] text-foreground">Lead Pipeline</h4>
                    <p className="text-[10px] text-muted-foreground">Conversion tracker</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/leads")}>
                  View All <ChevronRight className="h-3 w-3" />
                </Button>
              </div>

              <PremiumBar label="New" value={newLeads.length} total={dbLeads.length || 1} colorClass="bg-blue-500" delay={0.5} labelColor="text-blue-500" />
              <PremiumBar label="Contacted" value={dbLeads.filter(l => l.status === "contacted").length} total={dbLeads.length || 1} colorClass="bg-amber-500" delay={0.6} labelColor="text-amber-500" />
              <PremiumBar label="Proposal Sent" value={dbLeads.filter(l => l.status === "proposal-sent").length} total={dbLeads.length || 1} colorClass="bg-purple-500" delay={0.7} labelColor="text-purple-500" />
              <PremiumBar label="Converted" value={convertedLeads.length} total={dbLeads.length || 1} colorClass="bg-emerald-500" delay={0.8} labelColor="text-emerald-500" />

              <div className="mt-3 flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/15">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Converted Value</span>
                  <p className="text-lg font-bold text-foreground">₹{(convertedLeads.reduce((s, l) => s + (l.budget || 0), 0) / 1000).toFixed(0)}K</p>
                </div>
                <div className="text-right">
                  <span className="text-emerald-500 text-sm font-bold">
                    {dbLeads.length > 0 ? Math.round((convertedLeads.length / dbLeads.length) * 100) : 0}%
                  </span>
                  <p className="text-[10px] text-muted-foreground">Rate</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Calendar + Upcoming ── */}
        <motion.div variants={cardVariants} className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calendar Widget */}
            <div className="bg-card rounded-2xl border border-border p-4 overflow-hidden">
              <div className="flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-primary" />
                <h4 className="font-bold text-sm text-foreground">Studio Calendar</h4>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="pointer-events-auto"
                modifiers={{ event: eventDates }}
                modifiersClassNames={{ event: "bg-primary/20 text-primary font-bold rounded-full" }}
              />
              {selectedDate && selectedDateEvents.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {selectedDateEvents.map((ev) => (
                    <div key={ev.id} className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/15 text-xs">
                      <div className="h-2 w-2 rounded-full bg-primary" />
                      <span className="font-medium text-foreground truncate">{ev.project_name}</span>
                      <span className="text-muted-foreground">{ev.event_type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Shoots */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-primary to-purple-500" />
              <div className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-blue-500" />
                    <h4 className="font-bold text-sm text-foreground">Upcoming Shoots</h4>
                  </div>
                  <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/projects")}>
                    View All <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {upcomingProjects.slice(0, 5).map((proj, i) => (
                    <motion.div
                      key={proj.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border transition-all cursor-pointer group"
                      onClick={() => navigate(`/projects/${proj.id}`)}
                    >
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-primary/5 flex items-center justify-center ring-1 ring-blue-500/10 shrink-0 text-xs font-bold text-blue-500">
                        {proj.event_date ? new Date(proj.event_date).getDate() : "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{proj.project_name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          {proj.event_type && <span>{proj.event_type}</span>}
                          {proj.venue && <><span>·</span><MapPin className="h-3 w-3" />{proj.venue}</>}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">
                          {proj.event_date ? new Date(proj.event_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "TBD"}
                        </p>
                        <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors ml-auto" />
                      </div>
                    </motion.div>
                  ))}
                  {upcomingProjects.length === 0 && (
                    <div className="text-center py-8">
                      <Camera className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">No upcoming shoots</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MiniPieCard
              title="Clients"
              subtitle={`${dbClients.length} total`}
              data={[
                { name: "Active", value: dbClients.filter(c => c.status === "active").length, color: "#22c55e" },
                { name: "VIP", value: dbClients.filter(c => c.status === "vip").length, color: "hsl(var(--primary))" },
                { name: "Past", value: dbClients.filter(c => c.status !== "active" && c.status !== "vip").length, color: "#94a3b8" },
              ]}
            />
            <MiniPieCard
              title="Leads"
              subtitle={`${dbLeads.length} total`}
              data={[
                { name: "New", value: newLeads.length, color: "#3b82f6" },
                { name: "Contacted", value: dbLeads.filter(l => l.status === "contacted").length, color: "#f59e0b" },
                { name: "Converted", value: convertedLeads.length, color: "#22c55e" },
              ]}
            />
            <MiniPieCard
              title="Projects"
              subtitle={`${dbProjects.length} total`}
              data={[
                { name: "Active", value: dbProjects.filter(p => p.status === "in-progress").length, color: "#3b82f6" },
                { name: "Planning", value: dbProjects.filter(p => p.status === "planning" || p.status === "booked").length, color: "#f59e0b" },
                { name: "Done", value: dbProjects.filter(p => p.status === "completed" || p.status === "delivered").length, color: "#22c55e" },
              ]}
            />
            <MiniPieCard
              title="Invoices"
              subtitle={`${dbInvoices.length} total`}
              data={[
                { name: "Paid", value: dbInvoices.filter(i => i.status === "paid").length, color: "#22c55e" },
                { name: "Pending", value: dbInvoices.filter(i => i.status === "pending" || i.status === "draft").length, color: "#f59e0b" },
                { name: "Overdue", value: overdueInvoices.length, color: "#ef4444" },
              ]}
            />
          </div>

          {/* Recent Clients */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/20" />
            <div className="p-4">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h4 className="font-bold text-sm text-foreground">Recent Clients</h4>
                </div>
                <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => navigate("/clients")}>
                  View All <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {dbClients.slice(0, 5).map((client, i) => (
                  <motion.div
                    key={client.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border transition-all cursor-pointer group"
                    onClick={() => navigate(`/clients/${client.id}`)}
                  >
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center ring-1 shrink-0 text-xs font-bold",
                      client.status === "vip" ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-primary/20" : "bg-muted text-foreground ring-border"
                    )}>
                      {client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {client.partner_name ? `${client.name} & ${client.partner_name}` : client.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        {client.event_type && <span>{client.event_type}</span>}
                        {client.city && <><span>·</span>{client.city}</>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <Badge variant="outline" className={cn("text-[9px] px-2 py-0.5 rounded-full",
                        client.status === "vip" ? "bg-primary/10 text-primary border-primary/30" :
                        client.status === "active" ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" :
                        "bg-muted text-muted-foreground border-border"
                      )}>
                        {client.status === "vip" && <Crown className="h-2.5 w-2.5 mr-0.5" />}
                        {client.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
                {dbClients.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No clients yet</p>
                    <Button variant="outline" size="sm" className="mt-2 gap-1.5 text-xs" onClick={() => navigate("/clients")}>
                      <UserPlus className="h-3 w-3" /> Add Client
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Index;
