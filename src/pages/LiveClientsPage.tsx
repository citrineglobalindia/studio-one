import { useState, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Activity, Search, TrendingUp, CheckCircle2, Package,
  LayoutList, LayoutGrid, Presentation, ClipboardList, FileSpreadsheet,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useProjects } from "@/hooks/useProjects";
import { useDeliverables } from "@/hooks/useDeliverables";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useEventTeamAssignments } from "@/hooks/useEventTeamAssignments";
import { useEvents } from "@/hooks/useEvents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { LiveClient, Deliverable } from "@/data/live-clients-data";

import { ListView } from "@/components/live-clients/ListView";
import { CardView } from "@/components/live-clients/CardView";
import { TableView } from "@/components/live-clients/TableView";
import { PresentView } from "@/components/live-clients/PresentView";
import { EventTrackingView } from "@/components/live-clients/EventTrackingView";
import { ClientManagementView } from "@/components/live-clients/ClientManagementView";

type ViewMode = "list" | "card" | "table" | "present" | "event-tracking" | "client-mgmt";

const viewOptions: { value: ViewMode; label: string; icon: React.ElementType }[] = [
  { value: "list", label: "List", icon: LayoutList },
  { value: "card", label: "Cards", icon: LayoutGrid },
  { value: "table", label: "Table", icon: Activity },
  { value: "event-tracking", label: "Event Track", icon: ClipboardList },
  { value: "client-mgmt", label: "Client Mgmt", icon: FileSpreadsheet },
  { value: "present", label: "Present", icon: Presentation },
];

const deliverableStatusMap: Record<string, Deliverable["status"]> = {
  pending: "pending",
  in_progress: "in-progress",
  review: "review",
  completed: "delivered",
  delivered: "delivered",
};

export default function LiveClientsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const { projects, isLoading: projectsLoading } = useProjects();
  const { deliverables, isLoading: deliverablesLoading } = useDeliverables();
  const { members: teamMembersDb } = useTeamMembers();
  const { byEvent: assignmentsByEvent } = useEventTeamAssignments();
  const { events: dbEvents } = useEvents();

  // Map DB projects + deliverables to LiveClient format for existing view components
  const liveClients: LiveClient[] = useMemo(() => {
    return projects.map((p) => {
      const projectDeliverables = deliverables.filter((d) => d.project_id === p.id);
      const mappedDeliverables: Deliverable[] = projectDeliverables.map((d) => ({
        id: d.id,
        type: (d.deliverable_type === "photos" ? "Photos" : d.deliverable_type === "videos" ? "Videos" : d.deliverable_type === "album" ? "Albums" : d.deliverable_type === "highlights" ? "Highlights" : "Footage Copy") as Deliverable["type"],
        label: d.title || d.deliverable_type,
        status: deliverableStatusMap[d.status] || "pending",
        progress: d.status === "delivered" || d.status === "completed" ? 100 : d.status === "review" ? 80 : d.status === "in_progress" ? 50 : 0,
        dueDate: d.due_date || "",
        deliveredDate: d.delivered_date || undefined,
        assignedTo: d.assigned_to || undefined,
      }));

      const deliveredCount = mappedDeliverables.filter((d) => d.status === "delivered").length;
      const totalDel = mappedDeliverables.length || 1;
      const overallProgress = Math.round((deliveredCount / totalDel) * 100);

      const projectStatus: LiveClient["status"] = 
        p.status === "completed" || p.status === "delivered" ? "completed" :
        p.status === "planning" ? "on-hold" : "active";

      return {
        id: p.id,
        name: p.client?.name || p.project_name,
        partnerName: p.client?.partner_name || "",
        eventType: p.event_type || "Wedding",
        eventDate: p.event_date || "",
        deliveryDate: "",
        city: p.client?.city || "",
        phone: p.client?.phone || "",
        overallProgress,
        status: projectStatus,
        // Merge legacy assigned_team (names) with event_team_assignments for
        // (a) this project's id AND (b) every event belonging to this client —
        // so if you assigned team via the Events page for a Mehendi event, it
        // still counts towards this client's live-client team.
        team: (() => {
          const byEventMap = assignmentsByEvent();
          const clientEventIds: string[] = [p.id];
          if (p.client_id) {
            for (const e of dbEvents as any[]) {
              if (e.client_id === p.client_id) clientEventIds.push(e.id);
            }
          }

          const byId = new Map<string, { id: string; name: string; role: string; avatar: undefined }>();
          (p.assigned_team || []).forEach((name: string, i: number) => {
            const match = teamMembersDb.find((m: any) => m.full_name === name);
            const id = match ? match.id : `name-${i}`;
            byId.set(id, { id, name: match ? match.full_name : name, role: match ? match.role : "Crew", avatar: undefined });
          });
          for (const eid of clientEventIds) {
            const ids = byEventMap[eid] || [];
            for (const mid of ids) {
              const m = teamMembersDb.find((x: any) => x.id === mid);
              if (m && !byId.has(m.id)) byId.set(m.id, { id: m.id, name: m.full_name, role: m.role, avatar: undefined });
            }
          }
          return Array.from(byId.values());
        })(),
        // Events belonging to this client — so EventTrackingView / CardView can
        // show all shoot days (Mehendi, Haldi, Sangeet, etc.) under one client.
        events: ((): any[] => {
          if (!p.client_id) return [];
          return (dbEvents as any[])
            .filter((e) => e.client_id === p.client_id)
            .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
            .map((e) => ({
              id: e.id,
              name: e.name,
              event_type: e.event_type,
              event_date: e.event_date,
              start_time: e.start_time,
              end_time: e.end_time,
              venue: e.venue,
              status: e.status,
              assignedTeam: ((byMap: any) => {
                const ids = byMap[e.id] || [];
                return ids
                  .map((mid: string) => teamMembersDb.find((m: any) => m.id === mid))
                  .filter(Boolean)
                  .map((m: any) => ({ id: m.id, name: m.full_name, role: m.role }));
              })(assignmentsByEvent()),
            }));
        })() as any,
        deliverables: mappedDeliverables,
        financials: {
          estimatedAmount: p.total_amount || 0,
          invoicedAmount: p.total_amount || 0,
          paidAmount: p.amount_paid || 0,
          pendingAmount: (p.total_amount || 0) - (p.amount_paid || 0),
          expenses: 0,
          profit: p.amount_paid || 0,
        },
        createdAt: p.created_at,
        cardNumber: (p as any).card_number || "",
        rawDataSize: (p as any).raw_data_size || "",
        backupNumber: (p as any).backup_number || "",
        deliveryHdd: (p as any).delivery_hdd || "",
      } as LiveClient;
    });
  }, [projects, deliverables]);

  const filtered = useMemo(() => {
    return liveClients.filter((c) => {
      const matchSearch = `${c.name} ${c.partnerName} ${c.city}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [liveClients, search, filterStatus]);

  const totalActive = liveClients.filter((c) => c.status === "active").length;
  const totalCompleted = liveClients.filter((c) => c.status === "completed").length;
  const avgProgress = liveClients.length > 0 ? Math.round(liveClients.reduce((s, c) => s + c.overallProgress, 0) / liveClients.length) : 0;
  const totalDelivered = liveClients.reduce((s, c) => s + c.deliverables.filter((d) => d.status === "delivered").length, 0);

  const handleUpdateProjectField = useCallback(async (projectId: string, field: string, value: string) => {
    const { error } = await supabase.from("projects").update({ [field]: value } as any).eq("id", projectId);
    if (error) {
      toast.error("Failed to save");
    }
  }, []);

  const isLoading = projectsLoading || deliverablesLoading;

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Live Clients</h1>
            <p className="text-xs text-muted-foreground">{liveClients.length} clients · Real-time project tracking</p>
          </div>
        </div>

        {/* View Switcher */}
        <div className="flex items-center rounded-xl bg-muted/50 p-1 ring-1 ring-border">
          {viewOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = viewMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setViewMode(opt.value)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isActive
                    ? "bg-card text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: "Active", value: totalActive, accent: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500", ring: "ring-emerald-500/15" },
          { icon: CheckCircle2, label: "Completed", value: totalCompleted, accent: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-500", ring: "ring-blue-500/15" },
          { icon: Activity, label: "Avg Progress", value: avgProgress, suffix: "%", accent: "from-primary/20 to-primary/5", iconColor: "text-primary", ring: "ring-primary/15" },
          { icon: Package, label: "Delivered", value: totalDelivered, accent: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500", ring: "ring-amber-500/15" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`bg-gradient-to-b ${stat.accent} backdrop-blur-sm border border-border rounded-2xl p-4 ring-1 ${stat.ring}`}>
              <div className="h-9 w-9 rounded-xl bg-card/80 flex items-center justify-center ring-1 ring-border mb-2.5">
                <Icon className={cn("h-4 w-4", stat.iconColor)} />
              </div>
              <p className="text-xl sm:text-2xl font-display font-extrabold text-foreground leading-tight">
                {stat.value}{stat.suffix || ""}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search live clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* View Content */}
      {viewMode === "list" && <ListView clients={filtered} />}
      {viewMode === "card" && <CardView clients={filtered} />}
      {viewMode === "table" && <TableView clients={filtered} />}
      {viewMode === "event-tracking" && <EventTrackingView clients={filtered} onUpdateField={handleUpdateProjectField} />}
      {viewMode === "client-mgmt" && <ClientManagementView clients={filtered} />}
      {viewMode === "present" && <PresentView clients={filtered} />}

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No live clients found</p>
          <p className="text-sm text-muted-foreground mt-1">Create projects to see them here</p>
        </div>
      )}
    </motion.div>
  );
}
