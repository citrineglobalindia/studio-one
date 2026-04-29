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
    { label: "Delivered", value: delivered, icon: CheckCircle2, gradient: "linear-gradient(135deg,#34d399,#10b981)", glow: "shadow-emerald-500/30" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-5 pt-5 space-y-4">
      <motion.div
        variants={cardVariants}
        className="relative overflow-hidden rounded-3xl p-6 text-white"
        style={{
          background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #4f46e5 100%)",
          boxShadow: "0 24px 60px -16px rgba(37,99,235,0.5)",
        }}
      >
        <div className="absolute -top-16 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-indigo-400/40 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <Camera className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-90">Photographer</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Welcome back 📸</h1>
          <p className="text-xs opacity-90 mt-2">
            <span className="font-bold">{upcomingEvents.length}</span> upcoming shoots ·{" "}
            <span className="font-bold">{pending}</span> pending deliverables
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={cardVariants}
            className="rounded-3xl p-4 border border-blue-100 bg-white"
            style={{ boxShadow: "0 10px 30px -12px rgba(59,130,246,0.18)" }}
          >
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg ${s.glow} mb-3`} style={{ background: s.gradient }}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 leading-none">{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1.5 font-semibold">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        variants={cardVariants}
        className="rounded-3xl border border-blue-100 bg-white overflow-hidden"
        style={{ boxShadow: "0 10px 30px -12px rgba(59,130,246,0.18)" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-50">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-blue-600" /> My Shoots
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 h-7 px-2"
            onClick={() => navigate("/m/calendar")}
          >
            Calendar <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-blue-50">
          {isLoading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">No upcoming shoots assigned</div>
          ) : (
            upcomingEvents.slice(0, 6).map((evt) => (
              <button
                key={evt.id}
                className="w-full px-4 py-3.5 hover:bg-blue-50/50 active:bg-blue-50 transition-colors text-left flex items-center justify-between gap-2"
                onClick={() => navigate(`/m/projects/${evt.project_id}/event-day?event=${evt.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">{evt.name}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate mt-0.5">
                    {evt.client_name && (
                      <>{evt.client_name}{evt.partner_name ? ` & ${evt.partner_name}` : ""} · </>
                    )}
                    {evt.venue && <><MapPin className="h-3 w-3 inline" />{evt.venue}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] bg-sky-100 text-sky-700 border-sky-200">
                    {new Date(evt.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </Badge>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
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
            className="rounded-2xl border border-blue-100 bg-white py-4 flex flex-col items-center gap-2 active:bg-blue-50 transition-colors"
          >
            <div
              className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/30"
              style={{ background: "linear-gradient(135deg,#38bdf8,#2563eb)" }}
            >
              <a.icon className="h-5 w-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-slate-900">{a.label}</span>
          </button>
        ))}
      </motion.div>
    </motion.div>
  );
}
