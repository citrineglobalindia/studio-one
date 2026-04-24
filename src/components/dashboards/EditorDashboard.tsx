import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Edit3, CheckCircle2, Clock, Eye, Film, ChevronRight, AlertTriangle, Loader2, CalendarDays,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { useMyDeliverables, type DeliverableDB } from "@/hooks/useDeliverables";
import { useProjects } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { DeliverableDetailModal } from "@/components/deliverables/DeliverableDetailModal";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

const statusColors: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-muted-foreground", bg: "bg-muted" },
  in_progress: { label: "Editing", color: "text-blue-400", bg: "bg-blue-500/20" },
  review: { label: "Review", color: "text-amber-400", bg: "bg-amber-500/20" },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  delivered: { label: "Delivered", color: "text-primary", bg: "bg-primary/20" },
};

export function EditorDashboard() {
  const navigate = useNavigate();
  const { deliverables, isLoading } = useMyDeliverables();
  const { projects = [] } = useProjects();
  const { clients = [] } = useClients();
  const { events: dbEvents } = useEvents();
  const [openDeliverable, setOpenDeliverable] = useState<DeliverableDB | null>(null);

  const myQueue = deliverables.filter((d) => d.status === "pending" || d.status === "in_progress");
  const inReview = deliverables.filter((d) => d.status === "review");
  const completed = deliverables.filter((d) => d.status === "approved" || d.status === "delivered");
  const overdue = deliverables.filter((d) => {
    if (!d.due_date || d.status === "delivered" || d.status === "approved") return false;
    const dd = new Date(d.due_date);
    return isPast(dd) && !isToday(dd);
  });

  // Sort: overdue first, then by status priority, then by due date
  const sorted = [...deliverables]
    .filter(d => d.status !== "delivered")
    .sort((a, b) => {
      const aOverdue = a.due_date && isPast(new Date(a.due_date)) && !isToday(new Date(a.due_date));
      const bOverdue = b.due_date && isPast(new Date(b.due_date)) && !isToday(new Date(b.due_date));
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;
      const order = ["in_progress", "pending", "review", "approved"];
      const orderDiff = order.indexOf(a.status) - order.indexOf(b.status);
      if (orderDiff !== 0) return orderDiff;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  const labelFor = (d: DeliverableDB) => {
    const event = d.event_id ? dbEvents.find(e => e.id === d.event_id) : null;
    const client = d.client_id ? (clients as any[]).find(c => c.id === d.client_id) : null;
    const project = d.project_id ? (projects as any[]).find(p => p.id === d.project_id) : null;
    return {
      eventName: event?.name,
      clientName: client ? `${client.name}${client.partner_name ? ` & ${client.partner_name}` : ""}` : null,
      projectName: project?.project_name,
    };
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={cardVariants} className="relative rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/20 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-[0.2em]">Editor Dashboard</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Editing Hub ✂️</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-emerald-400 font-medium">{myQueue.length} in queue</span> ·{" "}
            <span className="text-amber-400 font-medium">{inReview.length} in review</span> ·{" "}
            <span className="text-primary font-medium">{completed.length} completed</span>
            {overdue.length > 0 && (
              <> · <span className="text-red-400 font-medium">{overdue.length} overdue</span></>
            )}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "In Queue", value: myQueue.length, icon: Clock, color: "text-blue-500", bg: "from-blue-500/15 to-blue-500/5" },
          { label: "In Review", value: inReview.length, icon: Eye, color: "text-amber-500", bg: "from-amber-500/15 to-amber-500/5" },
          { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-emerald-500", bg: "from-emerald-500/15 to-emerald-500/5" },
          { label: "Overdue", value: overdue.length, icon: AlertTriangle, color: "text-red-500", bg: "from-red-500/15 to-red-500/5" },
        ].map((s) => (
          <motion.div key={s.label} variants={cardVariants} className={`bg-gradient-to-b ${s.bg} rounded-2xl border border-border p-4`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-primary" />
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Film className="h-4 w-4 text-emerald-500" /> My Editing Queue
          </h2>
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/m/deliverables")}>
            All deliverables <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Nothing in your queue right now.
            </div>
          ) : (
            sorted.slice(0, 8).map((d) => {
              const sc = statusColors[d.status] || statusColors.pending;
              const ctx = labelFor(d);
              const dd = d.due_date ? new Date(d.due_date) : null;
              const isOverdueRow = dd && isPast(dd) && !isToday(dd) && d.status !== "delivered" && d.status !== "approved";
              const isDueToday = dd && isToday(dd);
              return (
                <button
                  key={d.id}
                  onClick={() => setOpenDeliverable(d)}
                  className="w-full px-4 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {d.title || d.deliverable_type}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {[ctx.clientName, ctx.eventName, d.deliverable_type].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${sc.bg} ${sc.color} border-transparent shrink-0`}>
                      {sc.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={d.progress || 0} className="flex-1 h-1.5" />
                    <span className="text-[10px] font-medium text-muted-foreground w-9 text-right">
                      {d.progress || 0}%
                    </span>
                  </div>
                  {dd && (
                    <div
                      className={`mt-1.5 flex items-center gap-1 text-[10px] ${
                        isOverdueRow ? "text-red-400 font-medium" : isDueToday ? "text-amber-400" : "text-muted-foreground"
                      }`}
                    >
                      <CalendarDays className="h-2.5 w-2.5" />
                      {isOverdueRow ? "Overdue" : isDueToday ? "Due today" : `Due ${format(dd, "d MMM")}`}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </motion.div>

      <DeliverableDetailModal
        open={!!openDeliverable}
        onOpenChange={(o) => !o && setOpenDeliverable(null)}
        deliverable={openDeliverable}
      />
    </motion.div>
  );
}
