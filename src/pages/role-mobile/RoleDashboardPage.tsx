import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import {
  ArrowRight, Activity, Sparkles, TrendingUp, Target, BarChart3, Crown,
  CalendarCheck, Clock, CheckCircle2, UserCircle2, Zap,
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleConfig } from "@/components/role-mobile/role-content";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 220, damping: 22 },
  },
};

const AnimatedNumber = ({ value, delay = 0 }: { value: number; delay?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) => Math.round(v));
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (inView) {
      const c = animate(mv, value, { duration: 1.1, delay, ease: [0.25, 0.1, 0.25, 1] });
      return c.stop;
    }
  }, [inView, mv, value, delay]);
  useEffect(() => rounded.on("change", (v) => { if (ref.current) ref.current.textContent = String(v); }), [rounded]);
  return <span ref={ref}>0</span>;
};

const PremiumBar = ({
  label, value, total, colorClass, delay, labelColor,
}: { label: string; value: number; total: number; colorClass: string; delay: number; labelColor: string }) => {
  const pct = Math.min(100, (value / total) * 100);
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
        <span className={`text-[12px] font-bold ${labelColor}`}>
          <AnimatedNumber value={value} delay={delay} />
          <span className="text-muted-foreground/60 font-normal"> / {total}</span>
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className={`h-full ${colorClass} rounded-full`}
        />
      </div>
    </div>
  );
};

export default function RoleDashboardPage() {
  const navigate = useNavigate();
  const { currentRole, roleLoading } = useRole();
  const { user } = useAuth();
  const cfg = getRoleConfig(currentRole);
  const Icon = cfg.icon;
  const displayName =
    (user?.user_metadata?.full_name as string) ||
    user?.email?.split("@")[0] ||
    "Friend";

  const stat0 = cfg.stats[0]?.value ?? 0;
  const stat1 = cfg.stats[1]?.value ?? 0;
  const stat2 = cfg.stats[2]?.value ?? 0;
  const totalTasks = stat0 + stat1 + stat2;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {/* Premium Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 px-5 pt-5 pb-14 text-primary-foreground">
        <div className="absolute -top-24 -right-16 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -left-12 w-40 h-40 bg-black/15 rounded-full blur-2xl" />
        <div className="absolute top-20 right-10 w-2 h-2 bg-white/40 rounded-full animate-pulse" />
        <div className="absolute top-32 right-28 w-1 h-1 bg-white/30 rounded-full" />

        <div className="relative z-10">
          <motion.div variants={cardVariants} className="flex items-center justify-between mb-6">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <p className="text-[11px] uppercase tracking-[0.2em] opacity-70 font-medium">Welcome back</p>
                <motion.span
                  animate={{ rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                  className="text-[14px] inline-block"
                >👋</motion.span>
              </div>
              <h1 className="text-[26px] font-extrabold tracking-tight capitalize truncate">{displayName}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/15 border border-white/15 px-2 py-0.5 rounded-md">
                  <Icon className="h-3 w-3" />
                  {roleLoading ? "Loading…" : cfg.label}
                </span>
                <span className="flex items-center gap-1 text-[10px] opacity-80">
                  <Crown className="h-3 w-3" /> Premium
                </span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => navigate("/m/profile")}
              className="size-14 rounded-2xl border-2 border-white/30 bg-white/15 backdrop-blur-sm shadow-xl ring-2 ring-white/10 flex items-center justify-center"
              aria-label="Profile"
            >
              <UserCircle2 className="h-7 w-7" />
            </motion.button>
          </motion.div>

          {/* Hero stats */}
          <div className="grid grid-cols-3 gap-2.5">
            {cfg.stats.map((s, i) => (
              <motion.div
                key={s.label}
                variants={cardVariants}
                className="bg-white/12 backdrop-blur-sm border border-white/15 rounded-2xl p-3.5 text-center ring-1 ring-white/10"
              >
                <p className="text-[22px] font-extrabold leading-tight">
                  <AnimatedNumber value={s.value} delay={0.2 + i * 0.1} />
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] font-semibold opacity-75 mt-0.5">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-background -mt-6 rounded-t-3xl relative z-10 px-5 pt-6 pb-6">
        {/* Primary KPI strip */}
        <motion.div variants={cardVariants} className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/70 to-primary/40" />
          <div className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{cfg.primaryMetric.label}</p>
              <p className="text-3xl font-extrabold text-foreground mt-1">{cfg.primaryMetric.value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{cfg.primaryMetric.sub}</p>
            </div>
            <div className="h-14 w-14 rounded-2xl bg-primary/15 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </motion.div>

        {/* Today's quote */}
        <motion.div
          variants={cardVariants}
          className="bg-gradient-to-br from-secondary to-muted rounded-2xl p-4 mb-5 flex items-center gap-3"
        >
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-foreground">{cfg.greeting}</p>
            <p className="text-[11px] text-muted-foreground">{cfg.tagline}</p>
          </div>
        </motion.div>

        {/* Attendance Card */}
        <motion.button
          variants={cardVariants}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/m/attendance")}
          className="w-full text-left bg-card rounded-2xl border border-border overflow-hidden mb-3"
        >
          <div className="h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400" />
          <div className="p-4">
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/20 flex items-center justify-center">
                  <CalendarCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-foreground">Attendance</h4>
                  <p className="text-[10px] text-muted-foreground">This month at a glance</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3.5">
              {[
                { label: "Present", value: 18, icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10" },
                { label: "Leave", value: 2, icon: Clock, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10" },
                { label: "Absent", value: 1, icon: Activity, color: "text-destructive", bg: "bg-destructive/10" },
              ].map((s, i) => {
                const SIcon = s.icon;
                return (
                  <div key={s.label} className={`${s.bg} rounded-xl p-2.5 text-center`}>
                    <SIcon className={`h-4 w-4 mx-auto mb-1 ${s.color}`} />
                    <p className={`text-lg font-extrabold ${s.color} leading-none`}>
                      <AnimatedNumber value={s.value} delay={0.3 + i * 0.08} />
                    </p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground mt-1 font-semibold">{s.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
              <motion.div initial={{ width: 0 }} animate={{ width: "85%" }} transition={{ delay: 0.5, duration: 1 }} className="bg-emerald-500 rounded-full" />
              <motion.div initial={{ width: 0 }} animate={{ width: "10%" }} transition={{ delay: 0.65, duration: 1 }} className="bg-amber-500 rounded-full" />
              <motion.div initial={{ width: 0 }} animate={{ width: "5%" }} transition={{ delay: 0.8, duration: 1 }} className="bg-destructive rounded-full" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">85% attendance rate</p>
          </div>
        </motion.button>

        {/* Tasks Card */}
        <motion.div variants={cardVariants} className="bg-card rounded-2xl border border-border overflow-hidden mb-3">
          <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary/30" />
          <div className="p-4">
            <div className="flex justify-between items-start mb-3.5">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-xl bg-primary/15 ring-1 ring-primary/20 flex items-center justify-center">
                  <Target className="size-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-[15px] text-foreground">My Workload</h4>
                  <p className="text-[10px] text-muted-foreground">Tasks across your projects</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Total</span>
                <span className="text-primary font-extrabold text-[24px] leading-tight">
                  <AnimatedNumber value={totalTasks} delay={0.3} />
                </span>
              </div>
            </div>

            <div className="space-y-2.5 mb-3.5">
              {cfg.stats.map((s, i) => {
                const palette = [
                  { dot: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
                  { dot: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
                  { dot: "bg-primary", text: "text-primary" },
                ][i] ?? { dot: "bg-muted-foreground", text: "text-muted-foreground" };
                return (
                  <div key={s.label} className="flex items-center gap-2.5 text-[12px]">
                    <span className={`size-2.5 rounded-full ${palette.dot}`} />
                    <span className="text-muted-foreground flex-1">{s.label}</span>
                    <span className={`font-bold ${palette.text}`}>
                      <AnimatedNumber value={s.value} delay={0.4 + i * 0.1} />
                    </span>
                  </div>
                );
              })}
            </div>

            {totalTasks > 0 && (
              <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(stat0 / totalTasks) * 100}%` }} transition={{ delay: 0.5, duration: 1 }} className="bg-emerald-500 rounded-full" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${(stat1 / totalTasks) * 100}%` }} transition={{ delay: 0.65, duration: 1 }} className="bg-amber-500 rounded-full" />
                <motion.div initial={{ width: 0 }} animate={{ width: `${(stat2 / totalTasks) * 100}%` }} transition={{ delay: 0.8, duration: 1 }} className="bg-primary rounded-full" />
              </div>
            )}
          </div>
        </motion.div>

        {/* Performance Card */}
        <motion.div variants={cardVariants} className="bg-card rounded-2xl border border-border overflow-hidden mb-3">
          <div className="h-1 bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400" />
          <div className="p-4">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="size-10 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/20 flex items-center justify-center">
                <BarChart3 className="size-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-bold text-[15px] text-foreground">Monthly Performance</h4>
                <p className="text-[10px] text-muted-foreground">Tracking your progress</p>
              </div>
            </div>
            <PremiumBar label="Targets Met" value={42} total={50} colorClass="bg-emerald-500" delay={0.5} labelColor="text-emerald-600 dark:text-emerald-400" />
            <PremiumBar label="In Progress" value={18} total={50} colorClass="bg-amber-500" delay={0.65} labelColor="text-amber-600 dark:text-amber-400" />
            <PremiumBar label="Pending" value={8} total={50} colorClass="bg-destructive" delay={0.8} labelColor="text-destructive" />
          </div>
        </motion.div>

        {/* CTA */}
        <motion.button
          variants={cardVariants}
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate("/m/projects")}
          className="w-full bg-card rounded-2xl border border-border p-4 flex items-center gap-3.5 active:bg-secondary/50 transition-colors"
        >
          <div className="size-12 rounded-xl bg-primary/12 flex items-center justify-center">
            <Zap className="size-5 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <h4 className="text-[14px] font-bold text-foreground">Jump to Projects</h4>
            <p className="text-[11px] text-muted-foreground">Manage and update assignments</p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
        </motion.button>
      </div>
    </motion.div>
  );
}
