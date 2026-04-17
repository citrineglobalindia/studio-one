import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { CalendarDays, MapPin, Users, Clock, Filter, Search, UserPlus, X, Check, Plus, Download, LayoutGrid, List, ChevronRight, MoreVertical, Trash2, Eye, SlidersHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useEvents } from "@/hooks/useEvents";
import { cn } from "@/lib/utils";

interface ClientEvent {
  id: string;
  name: string;
  date: string;
  venue: string;
  type: string;
  status: "upcoming" | "completed" | "in-progress";
  notes?: string;
}

interface EventWithClient extends ClientEvent {
  clientName: string;
  clientId: string;
  assignedTeam: TeamMember[];
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

// (Team members come from Supabase via useTeamMembers() — derivation lives inside the component.)

const initialsOf = (fullName: string) =>
  fullName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("") || "?";

const eventEmojis: Record<string, string> = {
  wedding: "💒", mehendi: "🌿", haldi: "💛", sangeet: "💃",
  reception: "🥂", engagement: "💍", "pre-wedding": "📸", other: "🎉",
};

const statusConfig: Record<string, { color: string; label: string }> = {
  upcoming: { color: "bg-blue-500/10 text-blue-600 border-blue-500/20", label: "Upcoming" },
  "in-progress": { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", label: "In Progress" },
  completed: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", label: "Completed" },
};

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } } as const;
const cardVariants = { hidden: { opacity: 0, y: 20, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 220, damping: 22 } } };

const AnimatedNumber = ({ value, delay = 0 }: { value: number; delay?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const isInView = useInView(ref, { once: true });
  useEffect(() => { if (isInView) { const c = animate(motionVal, value, { duration: 1.2, delay, ease: [0.25, 0.1, 0.25, 1] }); return c.stop; } }, [isInView, motionVal, value, delay]);
  useEffect(() => { const unsub = rounded.on("change", (v) => { if (ref.current) ref.current.textContent = `${v}`; }); return unsub; }, [rounded]);
  return <span ref={ref}>0</span>;
};

export default function EventsPage() {
  const { clients: dbClients } = useClients();
  const { projects: dbProjects } = useProjects();
  const { members: dbTeamMembers, isLoading: teamLoading } = useTeamMembers();
  const { events: dbEvents, addEvent, deleteEvent } = useEvents();

  // Derive the UI-shaped team list from real Supabase rows
  const teamMembers: TeamMember[] = useMemo(
    () =>
      dbTeamMembers.map((m) => ({
        id: m.id,
        name: m.full_name,
        role: m.role,
        avatar: initialsOf(m.full_name),
      })),
    [dbTeamMembers]
  );

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"list" | "timeline">("list");
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventWithClient | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ clientId: "", name: "", type: "wedding" as ClientEvent["type"], date: "", venue: "", notes: "" });
  const [extraEvents, setExtraEvents] = useState<EventWithClient[]>([]);

  const allEvents: EventWithClient[] = useMemo(() => {
    // 1) Events built from DB "projects" that have event_dates (legacy)
    const fromProjects: EventWithClient[] = dbProjects
      .filter((p) => p.event_date)
      .map((p) => {
        const client = dbClients.find((c) => c.id === p.client_id);
        const eventDate = new Date(p.event_date!);
        const isUpcoming = eventDate >= new Date();
        return {
          id: p.id,
          name: p.project_name,
          date: p.event_date!,
          venue: p.venue || "TBD",
          type: (p.event_type || "wedding").toLowerCase(),
          status: (p.status === "completed" || p.status === "delivered" ? "completed" : isUpcoming ? "upcoming" : "in-progress") as "upcoming" | "completed" | "in-progress",
          clientName: client ? (client.partner_name ? `${client.name} & ${client.partner_name}` : client.name) : p.project_name,
          clientId: p.client_id || "",
          assignedTeam: (assignments[p.id] || []).map((tid) => teamMembers.find((t) => t.id === tid)!).filter(Boolean),
        };
      });

    // 2) Events created from the "Add Event" form — now properly persisted in the events table
    const fromDb: EventWithClient[] = dbEvents.map((e) => {
      const client = dbClients.find((c) => c.id === e.client_id);
      const eventDate = new Date(e.event_date);
      const isUpcoming = eventDate >= new Date();
      const computedStatus =
        e.status === "completed" ? "completed" :
        e.status === "in-progress" ? "in-progress" :
        isUpcoming ? "upcoming" : "in-progress";
      return {
        id: e.id,
        name: e.name,
        date: e.event_date,
        venue: e.venue || "TBD",
        type: (e.event_type || "wedding").toLowerCase(),
        status: computedStatus,
        notes: e.notes ?? undefined,
        clientName: client ? (client.partner_name ? `${client.name} & ${client.partner_name}` : client.name) : "Studio Event",
        clientId: e.client_id || "",
        assignedTeam: (assignments[e.id] || []).map((tid) => teamMembers.find((t) => t.id === tid)!).filter(Boolean),
      };
    });

    return [...fromProjects, ...fromDb, ...extraEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [dbProjects, dbClients, dbEvents, assignments, extraEvents, teamMembers]);

  // Members who are already booked on the selected event's date for a DIFFERENT
  // event — they get hidden from the Assign Team list to prevent double-booking.
  // Members already assigned to THIS event stay visible so the admin can uncheck them.
  const availableTeamMembers = useMemo(() => {
    if (!selectedEvent) return teamMembers;
    const currentAssigned = new Set(assignments[selectedEvent.id] || []);
    const busyIds = new Set<string>();
    for (const [otherEventId, memberIds] of Object.entries(assignments)) {
      if (otherEventId === selectedEvent.id) continue;
      const other = allEvents.find((e) => e.id === otherEventId);
      if (other && other.date === selectedEvent.date) {
        memberIds.forEach((id) => busyIds.add(id));
      }
    }
    return teamMembers.filter((m) => currentAssigned.has(m.id) || !busyIds.has(m.id));
  }, [teamMembers, selectedEvent, assignments, allEvents]);

  const busyTeamCount = selectedEvent ? teamMembers.length - availableTeamMembers.length : 0;

  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const matchSearch = event.name.toLowerCase().includes(search.toLowerCase()) || event.clientName.toLowerCase().includes(search.toLowerCase()) || event.venue.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === "all" || event.type === filterType;
      const matchTab = activeTab === "all" || (activeTab === "upcoming" && event.status === "upcoming") || (activeTab === "in-progress" && event.status === "in-progress") || (activeTab === "completed" && event.status === "completed") || (activeTab === "unassigned" && (!assignments[event.id] || assignments[event.id].length === 0));
      return matchSearch && matchType && matchTab;
    });
  }, [allEvents, search, filterType, activeTab, assignments]);

  const stats = useMemo(() => ({
    total: allEvents.length,
    upcoming: allEvents.filter(e => e.status === "upcoming").length,
    inProgress: allEvents.filter(e => e.status === "in-progress").length,
    unassigned: allEvents.filter(e => !assignments[e.id] || assignments[e.id].length === 0).length,
  }), [allEvents, assignments]);

  const openAssignSheet = (event: EventWithClient) => { setSelectedEvent(event); setAssignSheetOpen(true); };
  const toggleMember = (eventId: string, memberId: string) => {
    setAssignments(prev => { const current = prev[eventId] || []; const updated = current.includes(memberId) ? current.filter(id => id !== memberId) : [...current, memberId]; return { ...prev, [eventId]: updated }; });
  };
  const saveAssignment = () => { if (selectedEvent) { toast.success(`${assignments[selectedEvent.id]?.length || 0} members assigned to ${selectedEvent.name}`); } setAssignSheetOpen(false); };
  const toggleSelectEvent = (id: string) => setSelectedEvents(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleBulkAssign = () => {
    selectedEvents.forEach(id => { if (!assignments[id] || assignments[id].length === 0) setAssignments(prev => ({ ...prev, [id]: ["t1", "t2"] })); });
    toast.success(`Assigned default team to ${selectedEvents.length} events`);
    setSelectedEvents([]);
  };

  const handleAddEvent = () => {
    if (!newEvent.name || !newEvent.date || !newEvent.venue) {
      toast.error("Name, date and venue are required");
      return;
    }
    // Persist to Supabase so it survives reload and multiple events per client/date work
    addEvent.mutate(
      {
        client_id: newEvent.clientId || null,
        project_id: null,
        name: newEvent.name,
        event_type: newEvent.type,
        event_date: newEvent.date,
        start_time: null,
        end_time: null,
        venue: newEvent.venue,
        notes: newEvent.notes || null,
        status: "upcoming",
      },
      {
        onSuccess: () => {
          setAddEventOpen(false);
          setNewEvent({ clientId: "", name: "", type: "wedding", date: "", venue: "", notes: "" });
        },
      }
    );
  };

  // Group events by month for timeline view
  const groupedByMonth = useMemo(() => {
    const groups: Record<string, EventWithClient[]> = {};
    filteredEvents.forEach(event => {
      const key = new Date(event.date).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return groups;
  }, [filteredEvents]);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Events</h1>
            <p className="text-xs text-muted-foreground">{allEvents.length} events · Manage shoots & assign teams</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex"><Download className="h-3.5 w-3.5" /> Export</Button>
          <Button size="sm" className="gap-2 rounded-xl" onClick={() => setAddEventOpen(true)}><Plus className="h-4 w-4" /> Add Event</Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: stats.total, icon: CalendarDays, accent: "from-primary/20 to-primary/5", iconColor: "text-primary", ring: "ring-primary/15" },
          { label: "Upcoming", value: stats.upcoming, icon: Clock, accent: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-500", ring: "ring-blue-500/15" },
          { label: "In Progress", value: stats.inProgress, icon: MapPin, accent: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500", ring: "ring-amber-500/15" },
          { label: "Unassigned", value: stats.unassigned, icon: Users, accent: "from-red-500/20 to-red-500/5", iconColor: "text-red-500", ring: "ring-red-500/15" },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={cardVariants} className={`bg-gradient-to-b ${stat.accent} backdrop-blur-sm border border-border rounded-2xl p-4 ring-1 ${stat.ring}`}>
            <div className="h-9 w-9 rounded-xl bg-card/80 flex items-center justify-center ring-1 ring-border mb-2.5">
              <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
            </div>
            <p className="text-xl sm:text-2xl font-display font-extrabold text-foreground leading-tight"><AnimatedNumber value={stat.value} delay={0.2 + i * 0.1} /></p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mt-0.5">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Search & Filter */}
      <motion.div variants={cardVariants} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search events, clients, venues..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        {/* View Toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0 hidden sm:flex">
          <button onClick={() => setViewMode("list")} className={cn("px-2.5 py-2 text-xs transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted")}><List className="h-3.5 w-3.5" /></button>
          <button onClick={() => setViewMode("timeline")} className={cn("px-2.5 py-2 text-xs transition-colors", viewMode === "timeline" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted")}><CalendarDays className="h-3.5 w-3.5" /></button>
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] h-9 hidden sm:flex"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Event Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(eventEmojis).map(([type, emoji]) => (<SelectItem key={type} value={type}>{emoji} {type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>))}
          </SelectContent>
        </Select>
        {/* Mobile filter */}
        <Button variant="outline" size="icon" className="sm:hidden h-9 w-9 shrink-0" onClick={() => setFilterOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Bulk Actions */}
      {selectedEvents.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
          <span className="text-sm font-medium text-foreground">{selectedEvents.length} selected</span>
          <div className="flex-1" />
          <Button size="sm" variant="default" className="gap-1.5 text-xs" onClick={handleBulkAssign}><UserPlus className="h-3.5 w-3.5" /> Bulk Assign</Button>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button>
          <Button size="sm" variant="ghost" className="text-xs" onClick={() => setSelectedEvents([])}><X className="h-3.5 w-3.5" /></Button>
        </motion.div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
          {[
            { value: "all", label: "All", count: allEvents.length },
            { value: "upcoming", label: "Upcoming", count: stats.upcoming },
            { value: "in-progress", label: "Active", count: stats.inProgress },
            { value: "unassigned", label: "Unassigned", count: stats.unassigned },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2">
              {tab.label}
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{tab.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* ═══ TIMELINE VIEW ═══ */}
          {viewMode === "timeline" ? (
            <div className="space-y-6">
              {Object.entries(groupedByMonth).map(([month, events]) => (
                <div key={month}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><CalendarDays className="h-4 w-4 text-primary" /></div>
                    <h3 className="text-sm font-semibold text-foreground">{month}</h3>
                    <Badge variant="secondary" className="text-[10px]">{events.length}</Badge>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                  <div className="ml-4 border-l-2 border-border pl-6 space-y-3">
                    {events.map(event => (
                      <motion.div key={event.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        className="relative rounded-xl bg-card border border-border p-4 hover:border-primary/20 transition-colors group">
                        <div className="absolute -left-[31px] top-4 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                        <div className="flex flex-col md:flex-row md:items-center gap-3">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="text-2xl mt-0.5">{eventEmojis[event.type] || "🎉"}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-foreground truncate">{event.name}</h3>
                                <Badge variant="outline" className={statusConfig[event.status]?.color}>{statusConfig[event.status]?.label}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">Client: <span className="font-medium text-foreground">{event.clientName}</span></p>
                              <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {event.assignedTeam.length > 0 ? (
                              <div className="flex -space-x-2">
                                {event.assignedTeam.slice(0, 4).map(member => (
                                  <Avatar key={member.id} className="h-8 w-8 border-2 border-background"><AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">{member.avatar}</AvatarFallback></Avatar>
                                ))}
                                {event.assignedTeam.length > 4 && <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">+{event.assignedTeam.length - 4}</div>}
                              </div>
                            ) : <span className="text-xs text-muted-foreground italic">No team</span>}
                            <Button size="sm" variant={event.assignedTeam.length > 0 ? "outline" : "default"} className="shrink-0" onClick={() => openAssignSheet(event)}>
                              <UserPlus className="h-3.5 w-3.5 mr-1" />{event.assignedTeam.length > 0 ? "Edit" : "Assign"}
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ═══ LIST VIEW ═══ */
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {filteredEvents.length === 0 ? (
                  <div className="py-16 text-center"><CalendarDays className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">No events found</p></div>
                ) : filteredEvents.map((event, i) => (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ delay: i * 0.03 }}>
                    <div className="rounded-xl bg-card border border-border hover:border-primary/20 transition-colors p-4">
                      <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={selectedEvents.includes(event.id)} onCheckedChange={() => toggleSelectEvent(event.id)} />
                        </div>
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className="text-2xl mt-0.5">{eventEmojis[event.type] || "🎉"}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground truncate">{event.name}</h3>
                              <Badge variant="outline" className={statusConfig[event.status]?.color}>{statusConfig[event.status]?.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">Client: <span className="font-medium text-foreground">{event.clientName}</span></p>
                            <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.venue}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {event.assignedTeam.length > 0 ? (
                            <div className="flex -space-x-2">
                              {event.assignedTeam.slice(0, 4).map(member => (
                                <Avatar key={member.id} className="h-8 w-8 border-2 border-background"><AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">{member.avatar}</AvatarFallback></Avatar>
                              ))}
                              {event.assignedTeam.length > 4 && <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium text-muted-foreground">+{event.assignedTeam.length - 4}</div>}
                            </div>
                          ) : <span className="text-xs text-muted-foreground italic">No team</span>}
                          <Button size="sm" variant={event.assignedTeam.length > 0 ? "outline" : "default"} className="shrink-0" onClick={() => openAssignSheet(event)}>
                            <UserPlus className="h-3.5 w-3.5 mr-1" />{event.assignedTeam.length > 0 ? "Edit" : "Assign"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>

      {/* Assign Team Sheet */}
      <Sheet open={assignSheetOpen} onOpenChange={setAssignSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-left">Assign Team{selectedEvent && <span className="block text-sm font-normal text-muted-foreground mt-1">{eventEmojis[selectedEvent.type]} {selectedEvent.name} — {selectedEvent.clientName}</span>}</SheetTitle>
          </SheetHeader>
          {selectedEvent && (
            <div className="mt-6 space-y-4">
              <Card className="border-border/50 bg-muted/30">
                <CardContent className="p-3 flex items-center gap-3 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span>{new Date(selectedEvent.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="truncate">{selectedEvent.venue}</span>
                </CardContent>
              </Card>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">Select Team Members</p>
                  {busyTeamCount > 0 && (
                    <span className="text-[10px] text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                      {busyTeamCount} busy on this date — hidden
                    </span>
                  )}
                </div>
                {availableTeamMembers.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground border border-dashed border-border rounded-lg">
                    {teamMembers.length === 0
                      ? "No team members yet. Add them in the Team page first."
                      : "Everyone is already booked on this date."}
                  </div>
                ) : availableTeamMembers.map(member => {
                  const isAssigned = (assignments[selectedEvent.id] || []).includes(member.id);
                  return (
                    <div key={member.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isAssigned ? "border-primary/30 bg-primary/5" : "border-border/50 hover:bg-muted/50"}`} onClick={() => toggleMember(selectedEvent.id, member.id)}>
                      <Checkbox checked={isAssigned} className="pointer-events-none" />
                      <Avatar className="h-9 w-9"><AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">{member.avatar}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{member.name}</p><p className="text-xs text-muted-foreground">{member.role}</p></div>
                      {isAssigned && <Check className="h-4 w-4 text-primary shrink-0" />}
                    </div>
                  );
                })}
              </div>
              <Button className="w-full mt-4" onClick={saveAssignment}><Check className="h-4 w-4 mr-2" /> Save Assignment ({(assignments[selectedEvent.id] || []).length} selected)</Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Add Event Sheet */}
      <Sheet open={addEventOpen} onOpenChange={setAddEventOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader><SheetTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> Add New Event</SheetTitle></SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-1.5"><Label className="text-xs font-medium">Client</Label><Select value={newEvent.clientId} onValueChange={(v) => setNewEvent(p => ({ ...p, clientId: v }))}><SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{dbClients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.partner_name ? `${c.name} & ${c.partner_name}` : c.name}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Event Type</Label>
              <div className="grid grid-cols-4 gap-2">
                {Object.entries(eventEmojis).map(([type, emoji]) => (
                  <button key={type} onClick={() => setNewEvent(p => ({ ...p, type: type as ClientEvent["type"], name: p.name || type.charAt(0).toUpperCase() + type.slice(1) }))}
                    className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border text-xs transition-all", newEvent.type === type ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground")}>
                    <span className="text-lg">{emoji}</span><span className="capitalize text-[10px]">{type}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Event Name *</Label><Input placeholder="e.g. Sangeet Night" value={newEvent.name} onChange={(e) => setNewEvent(p => ({ ...p, name: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Date *</Label><Input type="date" value={newEvent.date} onChange={(e) => setNewEvent(p => ({ ...p, date: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Venue *</Label><Input placeholder="Venue name" value={newEvent.venue} onChange={(e) => setNewEvent(p => ({ ...p, venue: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs font-medium">Notes</Label><Textarea placeholder="Special requirements..." value={newEvent.notes} onChange={(e) => setNewEvent(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
            <Button className="w-full" onClick={handleAddEvent}><Plus className="h-4 w-4 mr-1" /> Add Event</Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Mobile Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[70vh]">
          <SheetHeader className="pb-4"><div className="text-base font-semibold flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary" /> Filters</div></SheetHeader>
          <div className="space-y-5">
            <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">Event Type</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: "all", label: "All" }, ...Object.entries(eventEmojis).map(([k, v]) => ({ value: k, label: `${v} ${k}` }))].map((opt) => (
                  <button key={opt.value} onClick={() => setFilterType(opt.value)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all capitalize", filterType === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border")}>{opt.label}</button>
                ))}
              </div>
            </div>
            <Button className="w-full h-11 rounded-xl" onClick={() => setFilterOpen(false)}><Filter className="h-4 w-4 mr-2" /> Show {filteredEvents.length} Events</Button>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
