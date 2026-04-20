import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Camera, CalendarDays, MapPin, CheckCircle2, Upload, ChevronRight, Loader2 } from "lucide-react";
import { useMyAssignedEvents } from "@/hooks/useMyAssignedEvents";
import { useDeliverables } from "@/hooks/useDeliverables";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={cardVariants} className="relative rounded-2xl bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border border-blue-500/20 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Camera className="h-4 w-4 text-blue-500" />
            <span className="text-[10px] font-medium text-blue-500 uppercase tracking-[0.2em]">Photographer Dashboard</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome Back 📸</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-blue-400 font-medium">{upcomingEvents.length} upcoming shoots</span> ·{" "}
            <span className="text-amber-400 font-medium">{pending} pending deliverables</span>
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Upcoming Shoots", value: upcomingEvents.length, icon: CalendarDays, color: "text-blue-500", bg: "from-blue-500/15 to-blue-500/5" },
          { label: "Pending Delivery", value: pending, icon: Upload, color: "text-amber-500", bg: "from-amber-500/15 to-amber-500/5" },
          { label: "Photos Delivered", value: delivered, icon: CheckCircle2, color: "text-emerald-500", bg: "from-emerald-500/15 to-emerald-500/5" },
        ].map((s) => (
          <motion.div key={s.label} variants={cardVariants} className={`bg-gradient-to-b ${s.bg} rounded-2xl border border-border p-4`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-primary" />
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-blue-500" /> My Shoots
          </h2>
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/m/calendar")}>
            Calendar <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : upcomingEvents.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No upcoming shoots assigned</div>
          ) : (
            upcomingEvents.slice(0, 6).map((evt) => (
              <div
                key={evt.id}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => navigate(`/m/projects/${evt.project_id}/event-day?event=${evt.id}`)}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{evt.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
                    {evt.client_name ? `${evt.client_name}${evt.partner_name ? ` & ${evt.partner_name}` : ""} · ` : ""}
                    {evt.venue && <><MapPin className="h-3 w-3" />{evt.venue}</>}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/30">
                    {new Date(evt.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </Badge>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="grid grid-cols-2 gap-3">
        {[
          { label: "My Projects", icon: Upload, path: "/m/projects", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "View Calendar", icon: CalendarDays, path: "/m/calendar", color: "text-blue-500", bg: "bg-blue-500/10" },
        ].map((a) => (
          <Button key={a.label} variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate(a.path)}>
            <div className={`h-10 w-10 rounded-xl ${a.bg} flex items-center justify-center`}>
              <a.icon className={`h-5 w-5 ${a.color}`} />
            </div>
            <span className="text-xs font-medium">{a.label}</span>
          </Button>
        ))}
      </motion.div>
    </motion.div>
  );
}
