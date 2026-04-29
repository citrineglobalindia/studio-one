import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Tabs, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Film, Search, Loader2, CalendarDays, AlertTriangle, ChevronRight,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { useMyDeliverables, type DeliverableDB } from "@/hooks/useDeliverables";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { DeliverableDetailModal } from "@/components/deliverables/DeliverableDetailModal";

const statusBadge: Record<string, { label: string; tone: string }> = {
  pending: { label: "Pending", tone: "bg-slate-100 text-slate-600 border-slate-200" },
  in_progress: { label: "Editing", tone: "bg-sky-100 text-sky-700 border-sky-200" },
  review: { label: "Review", tone: "bg-amber-100 text-amber-700 border-amber-200" },
  approved: { label: "Approved", tone: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  delivered: { label: "Delivered", tone: "bg-indigo-100 text-indigo-700 border-indigo-200" },
};

type TabKey = "all" | "todo" | "in_progress" | "review" | "done";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

export default function RoleDeliverablesPage() {
  const { deliverables, isLoading, teamMember } = useMyDeliverables();
  const { events: dbEvents } = useEvents();
  const { clients = [] } = useClients();
  const { projects = [] } = useProjects();
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabKey>("all");
  const [openDeliverable, setOpenDeliverable] = useState<DeliverableDB | null>(null);

  const filtered = useMemo(() => {
    let list = deliverables;
    if (tab !== "all") {
      if (tab === "todo") list = list.filter(d => d.status === "pending");
      else if (tab === "in_progress") list = list.filter(d => d.status === "in_progress");
      else if (tab === "review") list = list.filter(d => d.status === "review");
      else if (tab === "done") list = list.filter(d => d.status === "delivered" || d.status === "approved");
    }
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(d =>
        (d.title || "").toLowerCase().includes(q) ||
        d.deliverable_type.toLowerCase().includes(q)
      );
    }
    return list;
  }, [deliverables, tab, search]);

  const grouped = useMemo(() => {
    const groups = new Map<string, { label: string; clientLabel?: string; eventDate?: string | null; items: DeliverableDB[] }>();
    for (const d of filtered) {
      let key: string;
      let label: string;
      let clientLabel: string | undefined;
      let eventDate: string | null | undefined;
      if (d.event_id) {
        const ev = dbEvents.find(e => e.id === d.event_id);
        key = `event-${d.event_id}`;
        label = ev?.name || "Event";
        eventDate = ev?.event_date;
      } else if (d.project_id) {
        const p = (projects as any[]).find(x => x.id === d.project_id);
        key = `proj-${d.project_id}`;
        label = p?.project_name || "Project";
      } else {
        key = "unassigned";
        label = "Unassigned";
      }
      const c = d.client_id ? (clients as any[]).find(x => x.id === d.client_id) : null;
      if (c) clientLabel = `${c.name}${c.partner_name ? ` & ${c.partner_name}` : ""}`;
      if (!groups.has(key)) groups.set(key, { label, clientLabel, eventDate, items: [] });
      groups.get(key)!.items.push(d);
    }
    return Array.from(groups.values()).sort((a, b) => {
      if (a.eventDate && b.eventDate) return new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime();
      return a.label.localeCompare(b.label);
    });
  }, [filtered, dbEvents, clients, projects]);

  const counts = {
    all: deliverables.length,
    todo: deliverables.filter(d => d.status === "pending").length,
    in_progress: deliverables.filter(d => d.status === "in_progress").length,
    review: deliverables.filter(d => d.status === "review").length,
    done: deliverables.filter(d => d.status === "delivered" || d.status === "approved").length,
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="px-5 pt-5 space-y-4">
      {/* Hero */}
      <motion.div
        variants={cardVariants}
        className="relative overflow-hidden rounded-3xl p-5 text-white"
        style={{
          background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 50%, #4f46e5 100%)",
          boxShadow: "0 24px 60px -16px rgba(37,99,235,0.5)",
        }}
      >
        <div className="absolute -top-16 -right-12 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <Film className="h-5 w-5" /> My Deliverables
          </h1>
          <p className="text-[11px] opacity-90 mt-1.5">
            {teamMember?.full_name ? `Assigned to ${teamMember.full_name}` : "Tap any deliverable to update status, progress, or notes"}
          </p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={cardVariants} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
        <Input
          placeholder="Search by title or type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-10 h-11 bg-white border-blue-100 text-slate-900 placeholder:text-slate-400 rounded-2xl shadow-sm"
        />
      </motion.div>

      {/* Tabs */}
      <motion.div variants={cardVariants}>
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList
            className="w-full grid grid-cols-5 h-auto p-1 rounded-2xl border border-blue-100 bg-white shadow-sm"
          >
            {[
              { key: "all", label: "All", count: counts.all },
              { key: "todo", label: "To Do", count: counts.todo },
              { key: "in_progress", label: "Editing", count: counts.in_progress },
              { key: "review", label: "Review", count: counts.review },
              { key: "done", label: "Done", count: counts.done },
            ].map(t => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className="text-[10px] flex-col gap-0 py-2 rounded-xl data-[state=active]:bg-gradient-to-br data-[state=active]:from-sky-500 data-[state=active]:to-blue-600 data-[state=active]:text-white text-slate-600"
              >
                <span className="font-semibold">{t.label}</span>
                <span className="text-[9px] opacity-80">{t.count}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </motion.div>

      {/* List */}
      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        </div>
      ) : grouped.length === 0 ? (
        <motion.div
          variants={cardVariants}
          className="rounded-3xl p-10 text-center border border-blue-100 bg-white"
        >
          <Film className="h-10 w-10 mx-auto mb-3 text-slate-300" />
          <p className="text-sm text-slate-500">
            No deliverables {tab !== "all" ? `in "${tab.replace("_", " ")}"` : "assigned to you yet"}.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-5">
          {grouped.map((g, i) => (
            <motion.div key={i} variants={cardVariants}>
              <div className="flex items-center justify-between mb-2.5 px-1">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">{g.label}</h2>
                  {g.clientLabel && (
                    <p className="text-[10px] text-slate-500">{g.clientLabel}</p>
                  )}
                </div>
                {g.eventDate && (
                  <span className="text-[10px] text-blue-600 flex items-center gap-1 font-semibold">
                    <CalendarDays className="h-3 w-3" /> {format(new Date(g.eventDate), "d MMM")}
                  </span>
                )}
              </div>
              <div className="space-y-2.5">
                {g.items.map(d => {
                  const sb = statusBadge[d.status] || statusBadge.pending;
                  const dd = d.due_date ? new Date(d.due_date) : null;
                  const isOverdueRow = dd && isPast(dd) && !isToday(dd) && d.status !== "delivered" && d.status !== "approved";
                  return (
                    <button
                      key={d.id}
                      onClick={() => setOpenDeliverable(d)}
                      className="w-full rounded-3xl border border-blue-100 bg-white p-4 text-left active:bg-blue-50 transition-colors"
                      style={{ boxShadow: "0 10px 30px -16px rgba(59,130,246,0.2)" }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{d.title || d.deliverable_type}</p>
                          <p className="text-[10px] text-slate-500 capitalize mt-0.5">{d.deliverable_type}</p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${sb.tone} shrink-0`}>
                          {sb.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress value={d.progress || 0} className="flex-1 h-1.5" />
                        <span className="text-[10px] font-bold text-blue-600 w-8 text-right">{d.progress || 0}%</span>
                      </div>
                      <div className="mt-2.5 flex items-center justify-between">
                        {dd ? (
                          <span
                            className={`text-[10px] flex items-center gap-1 font-medium ${
                              isOverdueRow ? "text-rose-600" : "text-slate-500"
                            }`}
                          >
                            {isOverdueRow ? <AlertTriangle className="h-2.5 w-2.5" /> : <CalendarDays className="h-2.5 w-2.5" />}
                            {isOverdueRow ? "Overdue" : `Due ${format(dd, "d MMM")}`}
                          </span>
                        ) : <span />}
                        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                      </div>
                      {d.notes && (
                        <p className="text-[10px] text-slate-500 mt-2 line-clamp-2 italic">"{d.notes}"</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <DeliverableDetailModal
        open={!!openDeliverable}
        onOpenChange={(o) => !o && setOpenDeliverable(null)}
        deliverable={openDeliverable}
      />
    </motion.div>
  );
}
