import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Camera, CalendarDays, MapPin, CheckCircle2, Upload, ChevronRight, Loader2 } from "lucide-react";
import { useMyAssignedEvents } from "@/hooks/useMyAssignedEvents";
import { useDeliverables } from "@/hooks/useDeliverables";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

export function PhotographerDashboard() {
  const navigate = useNavigate();
  const { events, isLoading } = useMyAssignedEvents();
  const { data: allDeliverables = [] } = useDeliverables();

  const now = new Date();
  const upcomingEvents = events
    .filter(e => new Date(e.event_date) >= new Date(now.toDateString()))
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  const photoDeliverables = allDeliverables.filter(d =>
    (d.deliverable_type || "").toLowerCase().includes("photo")
  );
  const delivered = photoDeliverables.filter(d => d.status === "delivered" || d.status === "approved").length;
  const pending = photoDeliverables.filter(d => d.status === "pending" || d.status === "in_progress").length;

  const stats = [
    { label: "Upcoming Shoots", value: upcomingEvents.length, icon: CalendarDays, gradient: "linear-gradient(135deg,#38bdf8,#2563eb)", glow: "shadow-sky-500/30" },
    { label: "Pending Delivery", value: pending, icon: Upload, gradient: "linear-gradient(135deg,#fbbf24,#f59e0b)", glow: "shadow-amber-500/30" },
    { label: "Photos Delivered", value: delivered, icon: CheckCircle2, gradient: "linear-gradient(135deg,#34d399,#10b981)", glow: "shadow-emerald-500/30" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-5 pt-5 space-y-4">
      <motion.div
        variants={cardVariants}
        className="relative overflow-hidden rounded-3xl p-6 border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, rgba(56,189,248,0.18) 0%, rgba(37,99,235,0.22) 50%, rgba(79,70,229,0.18) 100%)",
          boxShadow: "0 24px 60px -20px rgba(56,189,248,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        <div className="absolute -top-16 -right-12 w-48 h-48 bg-sky-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-blue-600/30 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="h-3.5 w-3.5 text-sky-300" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">Photographer</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome back 📸</h1>
          <p className="text-xs text-sky-100/80 mt-2">
            <span className="text-sky-300 font-semibold">{upcomingEvents.length}</span> upcoming shoots ·{" "}
            <span className="text-amber-300 font-semibold">{pending}</span> pending deliverables
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={cardVariants}
            className="rounded-3xl p-4 border border-white/10 bg-white/[0.04] backdrop-blur-xl"
            style={{ boxShadow: "0 16px 40px -16px rgba(0,0,0,0.6)" }}
          >
            <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg ${s.glow} mb-3`} style={{ background: s.gradient }}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-white leading-none">{s.value}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-1.5 font-semibold">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={cardVariants}
        className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl overflow-hidden"
        style={{ boxShadow: "0 16px 40px -16px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <h2 className="font-bold text-white flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-sky-300" /> My Shoots
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-sky-300 hover:text-sky-200 hover:bg-white/10 gap-1 h-7 px-2"
            onClick={() => navigate("/m/calendar")}
          >
            Calendar <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-white/5">
          {isLoading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-sky-300" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-400">No upcoming shoots assigned</div>
          ) : (
            upcomingEvents.slice(0, 6).map((evt) => (
              <button
                key={evt.id}
                className="w-full px-4 py-3.5 hover:bg-white/[0.03] active:bg-white/[0.06] transition-colors text-left flex items-center justify-between gap-2"
                onClick={() => navigate(`/m/projects/${evt.project_id}/event-day?event=${evt.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{evt.name}</p>
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 truncate mt-0.5">
                    {evt.client_name && (
                      <>{evt.client_name}{evt.partner_name ? ` & ${evt.partner_name}` : ""} · </>
                    )}
                    {evt.venue && <><MapPin className="h-3 w-3 inline" />{evt.venue}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] bg-sky-500/15 text-sky-300 border-sky-500/30">
                    {new Date(evt.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </Badge>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
                </div>
              </button>
            ))
          )}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="grid grid-cols-2 gap-3">
        {[
          { label: "My Projects", icon: Upload, path: "/m/projects" },
          { label: "View Calendar", icon: CalendarDays, path: "/m/calendar" },
        ].map((a) => (
          <button
            key={a.label}
            onClick={() => navigate(a.path)}
            className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl py-4 flex flex-col items-center gap-2 active:bg-white/[0.08] transition-colors"
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30"
              style={{ background: "linear-gradient(135deg,#38bdf8,#2563eb)" }}
            >
              <a.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-white">{a.label}</span>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
