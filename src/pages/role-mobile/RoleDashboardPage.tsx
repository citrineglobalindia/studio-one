import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import {
  ArrowRight, Sparkles, TrendingUp, Target, BarChart3,
  CalendarCheck, Clock, CheckCircle2, Zap, AlertCircle,
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

const ProgressBar = ({ label, value, total, color, delay }: { label: string; value: number; total: number; color: string; delay: number }) => {
  const pct = Math.min(100, (value / Math.max(total, 1)) * 100);
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-medium text-slate-500">{label}</span>
        <span className="text-[12px] font-bold text-slate-900">
          <AnimatedNumber value={value} delay={delay} />
          <span className="text-slate-400 font-normal"> / {total}</span>
        </span>
      </div>
      <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-5 pt-5 space-y-4">
      {/* Hero card */}
      <motion.div
        variants={cardVariants}
        className="relative overflow-hidden rounded-3xl p-5 text-white"
        style={{
          background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #4f46e5 100%)",
          boxShadow: "0 24px 60px -16px rgba(37,99,235,0.5)",
        }}
      >
        <div className="absolute -top-16 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-indigo-400/40 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-90 font-semibold">Welcome back</span>
            <motion.span
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
              className="text-sm"
            >👋</motion.span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight capitalize">{displayName}</h1>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-white/20 border border-white/20 px-2.5 py-1 rounded-lg">
              <Icon className="h-3 w-3" />
              {roleLoading ? "Loading…" : cfg.label}
            </span>
            <span className="text-[10px] opacity-90 font-medium">{cfg.tagline}</span>
          </div>

          {/* Hero stats */}
          <div className="grid grid-cols-3 gap-2 mt-5">
            {cfg.stats.map((s, i) => (
              <motion.div
                key={s.label}
                variants={cardVariants}
                className="bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-3 text-center"
              >
                <p className="text-2xl font-extrabold leading-tight">
                  <AnimatedNumber value={s.value} delay={0.2 + i * 0.1} />
                </p>
                <p className="text-[9px] uppercase tracking-[0.15em] font-semibold opacity-90 mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Primary KPI */}
      <motion.div
        variants={cardVariants}
        className="rounded-3xl p-5 border border-blue-100 bg-white"
        style={{ boxShadow: "0 10px 30px -12px rgba(59,130,246,0.18)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{cfg.primaryMetric.label}</p>
            <p className="text-3xl font-extrabold text-slate-900 mt-1">{cfg.primaryMetric.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{cfg.primaryMetric.sub}</p>
          </div>
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30"
            style={{ background: "linear-gradient(135deg, #38bdf8, #2563eb)" }}
          >
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
        </div>
      </motion.div>

      {/* Today's quote */}
      <motion.div
        variants={cardVariants}
        className="rounded-3xl p-4 border border-blue-100 bg-white flex items-center gap-3"
      >
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center shrink-0">
          <Sparkles className="h-5 w-5 text-blue-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{cfg.greeting}</p>
          <p className="text-[11px] text-slate-500">{cfg.tagline}</p>
        </div>
      </motion.div>

      {/* Attendance Card */}
      <motion.button
        variants={cardVariants}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/m/attendance")}
        className="w-full text-left rounded-3xl border border-blue-100 bg-white overflow-hidden"
        style={{ boxShadow: "0 10px 30px -12px rgba(59,130,246,0.18)" }}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30"
                style={{ background: "linear-gradient(135deg, #10b981, #047857)" }}
              >
                <CalendarCheck className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-[15px] text-slate-900">Attendance</h4>
                <p className="text-[10px] text-slate-500">This month at a glance</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: "Present", value: 18, icon: CheckCircle2, color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-100" },
              { label: "Leave", value: 2, icon: Clock, color: "text-amber-700", bg: "bg-amber-50 border-amber-100" },
              { label: "Absent", value: 1, icon: AlertCircle, color: "text-rose-700", bg: "bg-rose-50 border-rose-100" },
            ].map((s, i) => {
              const SIcon = s.icon;
              return (
                <div key={s.label} className={`${s.bg} border rounded-2xl p-3 text-center`}>
                  <SIcon className={`h-4 w-4 mx-auto mb-1.5 ${s.color}`} />
                  <p className={`text-xl font-extrabold ${s.color} leading-none`}>
                    <AnimatedNumber value={s.value} delay={0.3 + i * 0.08} />
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-slate-500 mt-1.5 font-semibold">{s.label}</p>
                </div>
              );
            })}
          </div>

          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            <motion.div initial={{ width: 0 }} animate={{ width: "85%" }} transition={{ delay: 0.5, duration: 1 }} className="bg-emerald-500 rounded-full" />
            <motion.div initial={{ width: 0 }} animate={{ width: "10%" }} transition={{ delay: 0.65, duration: 1 }} className="bg-amber-500 rounded-full" />
            <motion.div initial={{ width: 0 }} animate={{ width: "5%" }} transition={{ delay: 0.8, duration: 1 }} className="bg-rose-500 rounded-full" />
          </div>
          <p className="text-[10px] text-slate-500 mt-2">85% attendance rate</p>
        </div>
      </motion.button>

      {/* Workload */}
      <motion.div
        variants={cardVariants}
        className="rounded-3xl border border-blue-100 bg-white overflow-hidden"
        style={{ boxShadow: "0 10px 30px -12px rgba(59,130,246,0.18)" }}
      >
        <div className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div
                className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30"
                style={{ background: "linear-gradient(135deg, #38bdf8, #2563eb)" }}
              >
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-[15px] text-slate-900">My Workload</h4>
                <p className="text-[10px] text-slate-500">Tasks across your projects</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Total</span>
              <span className="text-blue-600 font-extrabold text-2xl leading-tight">
                <AnimatedNumber value={totalTasks} delay={0.3} />
              </span>
            </div>
          </div>

          <div className="space-y-2.5 mb-3.5">
            {cfg.stats.map((s, i) => {
              const palette = [
                { dot: "bg-emerald-500", text: "text-emerald-700" },
                { dot: "bg-amber-500", text: "text-amber-700" },
                { dot: "bg-blue-500", text: "text-blue-700" },
              ][i] ?? { dot: "bg-slate-400", text: "text-slate-600" };
              return (
                <div key={s.label} className="flex items-center gap-2.5 text-[12px]">
                  <span className={`size-2.5 rounded-full ${palette.dot}`} />
                  <span className="text-slate-700 flex-1">{s.label}</span>
                  <span className={`font-bold ${palette.text}`}>
                    <AnimatedNumber value={s.value} delay={0.4 + i * 0.1} />
                  </span>
                </div>
              );
            })}
          </div>

          {totalTasks > 0 && (
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-blue-50">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(stat0 / totalTasks) * 100}%` }} transition={{ delay: 0.5, duration: 1 }} className="bg-emerald-500 rounded-full" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${(stat1 / totalTasks) * 100}%` }} transition={{ delay: 0.65, duration: 1 }} className="bg-amber-500 rounded-full" />
              <motion.div initial={{ width: 0 }} animate={{ width: `${(stat2 / totalTasks) * 100}%` }} transition={{ delay: 0.8, duration: 1 }} className="bg-blue-500 rounded-full" />
            </div>
          )}
        </div>
      </motion.div>

      {/* Performance */}
      <motion.div
        variants={cardVariants}
        className="rounded-3xl border border-blue-100 bg-white overflow-hidden"
        style={{ boxShadow: "0 10px 30px -12px rgba(59,130,246,0.18)" }}
      >
        <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30"
              style={{ background: "linear-gradient(135deg, #fbbf24, #f59e0b)" }}
            >
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-[15px] text-slate-900">Monthly Performance</h4>
              <p className="text-[10px] text-slate-500">Tracking your progress</p>
            </div>
          </div>
          <ProgressBar label="Targets Met" value={42} total={50} color="linear-gradient(90deg,#34d399,#10b981)" delay={0.5} />
          <ProgressBar label="In Progress" value={18} total={50} color="linear-gradient(90deg,#fbbf24,#f59e0b)" delay={0.65} />
          <ProgressBar label="Pending" value={8} total={50} color="linear-gradient(90deg,#f87171,#ef4444)" delay={0.8} />
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        variants={cardVariants}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate("/m/projects")}
        className="w-full rounded-3xl border border-blue-100 bg-white p-4 flex items-center gap-3.5 active:bg-blue-50 transition-colors"
        style={{ boxShadow: "0 10px 30px -12px rgba(59,130,246,0.18)" }}
      >
        <div
          className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30"
          style={{ background: "linear-gradient(135deg, #38bdf8, #2563eb)" }}
        >
          <Zap className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 text-left">
          <h4 className="text-sm font-bold text-slate-900">Jump to Projects</h4>
          <p className="text-[11px] text-slate-500">Manage and update assignments</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-400" />
      </motion.button>
    </motion.div>
  );
}
