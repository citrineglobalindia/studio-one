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

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

const statusBadge: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "bg-slate-100 text-slate-600 border-slate-200" },
  in_progress: { label: "Editing", tone: "bg-sky-100 text-sky-700 border-sky-200" },
  review: { label: "Review", tone: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Approved", tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  delivered: { label: "Delivered", tone: "bg-indigo-100 text-indigo-700 border-indigo-200" },
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

  const stats = [
    { label: "In Queue", value: myQueue.length, icon: Clock, gradient: "linear-gradient(135deg,#38bdf8,#2563eb)", glow: "shadow-sky-500/30" },
    { label: "In Review", value: inReview.length, icon: Eye, gradient: "linear-gradient(135deg,#fbbf24,#f59e0b)", glow: "shadow-amber-500/30" },
    { label: "Completed", value: completed.length, icon: CheckCircle2, gradient: "linear-gradient(135deg,#34d399,#10b981)", glow: "shadow-emerald-500/30" },
    { label: "Overdue", value: overdue.length, icon: AlertTriangle, gradient: "linear-gradient(135deg,#f87171,#ef4444)", glow: "shadow-rose-500/30" },
  ];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-5 pt-5 space-y-4">
      {/* Hero */}
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
            <Edit3 className="h-3.5 w-3.5" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-90">Editor Hub</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Editing Hub <span>✂️</span></h1>
          <p className="text-xs opacity-90 mt-2">
            <span className="font-bold">{myQueue.length}</span> in queue ·{" "}
            <span className="font-bold">{inReview.length}</span> review ·{" "}
            <span className="font-bold">{completed.length}</span> done
            {overdue.length > 0 && <> · <span className="font-bold">{overdue.length} overdue</span></>}
          </p>
        </div>
      </motion.div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <motion.div
            key={s.label}
            variants={cardVariants}
            className="relative rounded-3xl p-4 border border-blue-100 bg-white overflow-hidden"
            style={{ boxShadow: "0 10px 30px -12px rgba(59,130,246,0.18)" }}
          >
            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shadow-lg ${s.glow} mb-3`} style={{ background: s.gradient }}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <p className="text-3xl font-extrabold text-slate-900 leading-none">{s.value}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1.5 font-semibold">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Queue list */}
      <motion.div
        variants={cardVariants}
        className="rounded-3xl border border-blue-100 bg-white overflow-hidden"
        style={{ boxShadow: "0 10px 30px -12px rgba(59,130,246,0.18)" }}
      >
        <div className="flex items-center justify-between p-4 border-b border-blue-50">
          <h2 className="font-bold text-slate-900 flex items-center gap-2 text-sm">
            <Film className="h-4 w-4 text-blue-600" /> My Editing Queue
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 h-7 px-2"
            onClick={() => navigate("/m/deliverables")}
          >
            All <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-blue-50">
          {isLoading ? (
            <div className="py-10 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">
              Nothing in your queue right now.
            </div>
          ) : (
            sorted.slice(0, 8).map((d) => {
              const sb = statusBadge[d.status] || statusBadge.pending;
              const ctx = labelFor(d);
              const dd = d.due_date ? new Date(d.due_date) : null;
              const isOverdueRow = dd && isPast(dd) && !isToday(dd) && d.status !== "delivered" && d.status !== "approved";
              const isDueToday = dd && isToday(dd);
              return (
                <button
                  key={d.id}
                  onClick={() => setOpenDeliverable(d)}
                  className="w-full px-4 py-3.5 hover:bg-blue-50/50 active:bg-blue-50 transition-colors text-left"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {d.title || d.deliverable_type}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {[ctx.clientName, ctx.eventName].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${sb.tone} shrink-0`}>
                      {sb.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={d.progress || 0} className="flex-1 h-1.5" />
                    <span className="text-[10px] font-bold text-blue-600 w-9 text-right">
                      {d.progress || 0}%
                    </span>
                  </div>
                  {dd && (
                    <div
                      className={`mt-2 flex items-center gap-1 text-[10px] font-medium ${
                        isOverdueRow ? "text-rose-600" : isDueToday ? "text-amber-600" : "text-slate-500"
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
