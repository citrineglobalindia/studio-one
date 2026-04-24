import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
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

const statusColors: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-muted-foreground", bg: "bg-muted" },
  in_progress: { label: "Editing", color: "text-blue-400", bg: "bg-blue-500/15" },
  review: { label: "Review", color: "text-amber-400", bg: "bg-amber-500/15" },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/15" },
  delivered: { label: "Delivered", color: "text-primary", bg: "bg-primary/15" },
};

type TabKey = "all" | "todo" | "in_progress" | "review" | "done";

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

  // Group by event (or project if no event)
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
    <div className="max-w-3xl mx-auto p-4 space-y-4 pb-20">
      <div>
        <h1 className="text-xl font-display font-bold flex items-center gap-2">
          <Film className="h-5 w-5 text-emerald-500" />
          My Deliverables
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          {teamMember?.full_name ? `Assigned to ${teamMember.full_name}` : "Tap any deliverable to update its status, progress, or notes"}
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or type…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList className="w-full grid grid-cols-5 h-auto">
          <TabsTrigger value="all" className="text-[10px] flex-col gap-0.5 py-2">
            All <span className="text-muted-foreground">{counts.all}</span>
          </TabsTrigger>
          <TabsTrigger value="todo" className="text-[10px] flex-col gap-0.5 py-2">
            To Do <span className="text-muted-foreground">{counts.todo}</span>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="text-[10px] flex-col gap-0.5 py-2">
            Editing <span className="text-muted-foreground">{counts.in_progress}</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="text-[10px] flex-col gap-0.5 py-2">
            Review <span className="text-muted-foreground">{counts.review}</span>
          </TabsTrigger>
          <TabsTrigger value="done" className="text-[10px] flex-col gap-0.5 py-2">
            Done <span className="text-muted-foreground">{counts.done}</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="py-12 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : grouped.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            <Film className="h-10 w-10 mx-auto mb-2 opacity-30" />
            No deliverables {tab !== "all" ? `in "${tab.replace("_", " ")}"` : "assigned to you yet"}.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {grouped.map((g, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-2 px-1">
                <div>
                  <h2 className="text-sm font-semibold">{g.label}</h2>
                  {g.clientLabel && (
                    <p className="text-[10px] text-muted-foreground">{g.clientLabel}</p>
                  )}
                </div>
                {g.eventDate && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {format(new Date(g.eventDate), "d MMM")}
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {g.items.map(d => {
                  const sc = statusColors[d.status] || statusColors.pending;
                  const dd = d.due_date ? new Date(d.due_date) : null;
                  const isOverdueRow = dd && isPast(dd) && !isToday(dd) && d.status !== "delivered" && d.status !== "approved";
                  return (
                    <Card
                      key={d.id}
                      className="cursor-pointer hover:border-primary/40 transition-colors"
                      onClick={() => setOpenDeliverable(d)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{d.title || d.deliverable_type}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{d.deliverable_type}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] ${sc.bg} ${sc.color} border-transparent shrink-0`}>
                            {sc.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={d.progress || 0} className="flex-1 h-1.5" />
                          <span className="text-[10px] text-muted-foreground w-8 text-right">{d.progress || 0}%</span>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          {dd ? (
                            <span
                              className={`text-[10px] flex items-center gap-1 ${
                                isOverdueRow ? "text-red-400 font-medium" : "text-muted-foreground"
                              }`}
                            >
                              {isOverdueRow ? <AlertTriangle className="h-2.5 w-2.5" /> : <CalendarDays className="h-2.5 w-2.5" />}
                              {isOverdueRow ? "Overdue" : `Due ${format(dd, "d MMM")}`}
                            </span>
                          ) : <span />}
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                        {d.notes && (
                          <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 italic">"{d.notes}"</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <DeliverableDetailModal
        open={!!openDeliverable}
        onOpenChange={(o) => !o && setOpenDeliverable(null)}
        deliverable={openDeliverable}
      />
    </div>
  );
}
