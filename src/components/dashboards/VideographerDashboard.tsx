import { useNavigate } from "react-router-dom";
import { sampleProjects } from "@/data/wedding-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Video, CalendarDays, MapPin, CheckCircle2, ChevronRight, Film, Upload
} from "lucide-react";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

export function VideographerDashboard() {
  const navigate = useNavigate();

  const myProjects = sampleProjects.filter((p) =>
    p.team.some((t) => t.role === "videographer") && (p.status === "in-progress" || p.status === "booked")
  );
  const myUpcomingShoots = myProjects.flatMap((p) =>
    p.subEvents.filter((se) => se.status === "upcoming")
      .map((se) => ({ ...se, projectClient: `${p.clientName} & ${p.partnerName}`, projectId: p.id }))
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const myFootage = myProjects.flatMap((p) => p.footage.filter((f) => f.handedOverByRole === "videographer"));
  const pendingHandover = myFootage.filter((f) => f.editStatus === "pending").length;
  const delivered = myFootage.filter((f) => f.editStatus === "approved" || f.editStatus === "delivered").length;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={cardVariants} className="relative rounded-2xl bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent border border-purple-500/20 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Video className="h-4 w-4 text-purple-500" />
            <span className="text-[10px] font-medium text-purple-500 uppercase tracking-[0.2em]">Videographer Dashboard</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome Back 🎬</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-purple-400 font-medium">{myUpcomingShoots.length} upcoming shoots</span> ·{" "}
            <span className="text-amber-400 font-medium">{pendingHandover} footage pending</span>
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Active Projects", value: myProjects.length, icon: Film, color: "text-purple-500", bg: "from-purple-500/15 to-purple-500/5" },
          { label: "Upcoming Shoots", value: myUpcomingShoots.length, icon: CalendarDays, color: "text-blue-500", bg: "from-blue-500/15 to-blue-500/5" },
          { label: "Footage Delivered", value: delivered, icon: CheckCircle2, color: "text-emerald-500", bg: "from-emerald-500/15 to-emerald-500/5" },
        ].map((s) => (
          <motion.div key={s.label} variants={cardVariants} className={`bg-gradient-to-b ${s.bg} rounded-2xl border border-border p-4`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-fuchsia-500" />
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-purple-500" /> My Shoots
          </h2>
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/calendar")}>
            Calendar <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-border">
          {myUpcomingShoots.slice(0, 6).map((shoot) => (
            <div key={shoot.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
              onClick={() => navigate(`/projects/${shoot.projectId}/event-day?event=${shoot.id}`)}>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{shoot.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">{shoot.projectClient} · <MapPin className="h-3 w-3" />{shoot.location}</p>
              </div>
              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/30">
                {new Date(shoot.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </Badge>
            </div>
          ))}
          {myUpcomingShoots.length === 0 && <div className="py-10 text-center text-sm text-muted-foreground">No shoots assigned</div>}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="grid grid-cols-2 gap-3">
        {[
          { label: "Check-in at Venue", icon: Upload, path: "/projects", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "View Tasks", icon: Film, path: "/tasks", color: "text-purple-500", bg: "bg-purple-500/10" },
        ].map((a) => (
          <Button key={a.label} variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate(a.path)}>
            <div className={`h-10 w-10 rounded-xl ${a.bg} flex items-center justify-center`}><a.icon className={`h-5 w-5 ${a.color}`} /></div>
            <span className="text-xs font-medium">{a.label}</span>
          </Button>
        ))}
      </motion.div>
    </motion.div>
  );
}
