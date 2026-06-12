import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, CalendarDays, Loader2, Clock,
  MapPin, Users, X, Lock, CheckCircle2, Filter, Search, FilterX,
  SlidersHorizontal, Tag, UserCheck, Sparkles, Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCalendarEvents, type CalendarEventRow } from "@/hooks/useCalendarEvents";
import { useRole } from "@/contexts/RoleContext";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { CheckInDialog } from "@/components/events/CheckInDialog";
import { EditorWorkLogPanel } from "@/components/calendar/EditorWorkLogPanel";
import { AssignTeamDialog } from "@/components/clients/AssignTeamDialog";
import { UserPlus, Pencil as PencilIcon } from "lucide-react";
import { useWorkLogCountsByDate } from "@/hooks/useEditorWorkLogs";
import { useAllQuotations, useAllContracts, useAllInvoices } from "@/hooks/useFinancials";
import { generateDocPdf } from "@/lib/generateDocPdf";
import { buildDocPdfPayload } from "@/lib/buildDocPdfPayload";
import { useOrg } from "@/contexts/OrgContext";
import { FileText, Briefcase, Receipt, IndianRupee } from "lucide-react";

import { Camera as CameraIcon } from "lucide-react";

const TYPE_DOT: Record<string, string> = {
  Wedding:       "bg-rose-500",
  "Pre-Wedding": "bg-purple-500",
  Engagement:    "bg-amber-500",
  Reception:     "bg-blue-500",
  Sangeet:       "bg-fuchsia-500",
  Haldi:         "bg-yellow-500",
  Mehendi:       "bg-green-500",
  Roka:          "bg-violet-500",
  Birthday:      "bg-pink-500",
  Anniversary:   "bg-red-500",
  Corporate:     "bg-slate-500",
  Other:         "bg-indigo-500",
};

const TYPE_GRADIENT: Record<string, string> = {
  Wedding: "from-rose-500 to-pink-500",
  "Pre-Wedding": "from-purple-500 to-fuchsia-500",
  Engagement: "from-amber-500 to-orange-500",
  Reception: "from-blue-500 to-cyan-500",
  Sangeet: "from-fuchsia-500 to-rose-500",
  Haldi: "from-yellow-500 to-amber-500",
  Mehendi: "from-green-500 to-emerald-500",
  Roka: "from-violet-500 to-purple-500",
  Birthday: "from-pink-500 to-rose-500",
  Anniversary: "from-rose-500 to-red-500",
  Corporate: "from-slate-500 to-gray-500",
  Other: "from-indigo-500 to-violet-500",
};

function gridDates(month: Date) {
  // Returns 6x7 = 42 cells starting Sunday before-or-on the 1st.
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startDow = first.getDay();
  const start = new Date(first); start.setDate(first.getDate() - startDow);
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i);
    cells.push(d);
  }
  return cells;
}

function isoDate(d: Date) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtTime(t: string | null | undefined) {
  if (!t) return null;
  return String(t).slice(0, 5);
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const EVENT_TYPE_OPTIONS = [
  "Wedding", "Pre-Wedding", "Engagement", "Reception",
  "Sangeet", "Haldi", "Mehendi", "Roka",
  "Birthday", "Anniversary", "Corporate", "Other",
];

const STATUS_OPTIONS = ["upcoming", "in-progress", "completed", "cancelled"];

const FINALIZE_OPTIONS = [
  { v: "all", label: "All events" },
  { v: "finalized", label: "Finalized only" },
  { v: "draft", label: "Draft only" },
];

export default function CalendarPage() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const seesAll = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts";

  // Filters (admin/administrator only)
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");        // event_type
  const [filterStatus, setFilterStatus] = useState<string>("all");    // status
  const [filterFinalize, setFilterFinalize] = useState<string>("all"); // is_finalized
  const [filterAssignee, setFilterAssignee] = useState<string>("all"); // team_member_id
  const [filterRequirement, setFilterRequirement] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const activeFilterCount = [
    search.trim() && "search",
    filterType !== "all" && "type",
    filterStatus !== "all" && "status",
    filterFinalize !== "all" && "finalize",
    filterAssignee !== "all" && "assignee",
    filterRequirement !== "all" && "requirement",
  ].filter(Boolean).length;
  const clearFilters = () => {
    setSearch(""); setFilterType("all"); setFilterStatus("all");
    setFilterFinalize("all"); setFilterAssignee("all"); setFilterRequirement("all");
  };

  const [month, setMonth] = useState<Date>(() => {
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1);
  });

  const cells = useMemo(() => gridDates(month), [month]);
  const fromIso = isoDate(cells[0]);
  const toIso = isoDate(cells[cells.length - 1]);

  const { data: events = [], isLoading } = useCalendarEvents(fromIso, toIso);
  const { data: workLogCounts = {} } = useWorkLogCountsByDate(fromIso, toIso);
  const { organization } = useOrg();
  const { rows: allQuotes = [] } = useAllQuotations();
  const { rows: allContracts = [] } = useAllContracts();
  const { rows: allInvoices = [] } = useAllInvoices();
  // Latest doc of each type per client_id
  const docsByClient = useMemo(() => {
    const pick = (rows: any[]) => {
      const m = new Map<string, any>();
      for (const r of rows) {
        if (!r.client_id) continue;
        const prev = m.get(r.client_id);
        if (!prev || String(r.created_at) > String(prev.created_at)) m.set(r.client_id, r);
      }
      return m;
    };
    return { est: pick(allQuotes), prop: pick(allContracts), inv: pick(allInvoices) };
  }, [allQuotes, allContracts, allInvoices]);
  const { members } = useTeamMembers();
  const memberById = new Map(members.map((m) => [m.id, m]));
  const { user } = useAuth();
  const myTeamMember = members.find((m: any) => m.user_id && user?.id && m.user_id === user.id) || null;
  const [checkInEvent, setCheckInEvent] = useState<any | null>(null);
  const canManageWorkLog = currentRole === "admin" || currentRole === "administrator";
  const canManageTeam = currentRole === "admin" || currentRole === "administrator";
  const [assignEvent, setAssignEvent] = useState<any | null>(null);

  // Apply filters first (admin/administrator only see filter UI)
  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (q) {
        const hay = [
          e.event_type, e.name, e.client_name, e.venue, e.notes,
          ...(Array.isArray(e.requirements) ? e.requirements : []),
        ].filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (filterType !== "all" && e.event_type !== filterType) return false;
      if (filterStatus !== "all" && String(e.status || "") !== filterStatus) return false;
      if (filterFinalize === "finalized" && !e.is_finalized) return false;
      if (filterFinalize === "draft" && e.is_finalized) return false;
      if (filterAssignee !== "all" && !(e.assigned_member_ids ?? []).includes(filterAssignee)) return false;
      if (filterRequirement !== "all" && !(Array.isArray(e.requirements) && e.requirements.includes(filterRequirement))) return false;
      return true;
    });
  }, [events, search, filterType, filterStatus, filterFinalize, filterAssignee, filterRequirement]);

  // Index events by ISO date
  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalendarEventRow[]>();
    for (const e of filteredEvents) {
      if (!e.event_date) continue;
      if (!m.has(e.event_date)) m.set(e.event_date, []);
      m.get(e.event_date)!.push(e);
    }
    return m;
  }, [filteredEvents]);

  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const dayEvents = selectedDay ? (eventsByDay.get(selectedDay) ?? []) : [];

  const todayIso = isoDate(new Date());
  const monthLabel = month.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const totalThisMonth = useMemo(
    () => filteredEvents.filter((e) => e.event_date && e.event_date.startsWith(isoDate(month).slice(0, 7))).length,
    [filteredEvents, month]
  );

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Calendar</h1>
            <p className="text-xs text-muted-foreground">
              {seesAll ? "All studio events" : "Your assigned events"} · {totalThisMonth} this month
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setMonth((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))} title="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm font-medium min-w-[160px] text-center">
            {monthLabel}
          </div>
          <Button variant="outline" size="icon" onClick={() => setMonth((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))} title="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-xs" onClick={() => { const n = new Date(); setMonth(new Date(n.getFullYear(), n.getMonth(), 1)); }}>
            Today
          </Button>
        </div>
      </motion.div>

      {/* ADVANCED FILTER BAR — admin / administrator only */}
      {seesAll && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Top row: search + toggle + counter */}
          <div className="flex items-center gap-2 p-3 border-b border-border/60">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search event, client, venue, notes…" className="pl-9 h-9" />
            </div>
            <Button variant={showFilters ? "default" : "outline"} size="sm" className="gap-1.5 h-9" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] bg-background/40">{activeFilterCount}</Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" className="gap-1 h-9 text-xs text-muted-foreground" onClick={clearFilters}>
                <FilterX className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="px-3 py-2 border-b border-border/60 bg-muted/20 flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mr-1">Active:</span>
              {search.trim() && (
                <ActiveChip label={`"${search.trim()}"`} onClear={() => setSearch("")} icon={<Search className="h-3 w-3" />} />
              )}
              {filterType !== "all" && (
                <ActiveChip label={filterType} onClear={() => setFilterType("all")} dotColor={TYPE_DOT[filterType]} />
              )}
              {filterStatus !== "all" && (
                <ActiveChip label={filterStatus} onClear={() => setFilterStatus("all")} icon={<Tag className="h-3 w-3" />} />
              )}
              {filterFinalize !== "all" && (
                <ActiveChip label={filterFinalize === "finalized" ? "Finalized" : "Draft"} onClear={() => setFilterFinalize("all")} icon={filterFinalize === "finalized" ? <Lock className="h-3 w-3" /> : <Pencil className="h-3 w-3" />} />
              )}
              {filterAssignee !== "all" && (
                <ActiveChip
                  label={members.find((m) => m.id === filterAssignee)?.full_name || "Member"}
                  onClear={() => setFilterAssignee("all")}
                  icon={<UserCheck className="h-3 w-3" />}
                />
              )}
              {filterRequirement !== "all" && (
                <ActiveChip label={filterRequirement.replace(/_/g, " ")} onClear={() => setFilterRequirement("all")} icon={<Sparkles className="h-3 w-3" />} />
              )}
              <span className="ml-auto text-[11px] text-muted-foreground">
                <span className="text-foreground font-medium tabular-nums">{filteredEvents.length}</span> / {events.length} events
              </span>
            </div>
          )}

          {/* Expanded filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">

                  {/* QUICK TOGGLES */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Quick filters</p>
                    <div className="flex flex-wrap gap-1.5">
                      <ToggleChip
                        active={filterFinalize === "finalized"}
                        onClick={() => setFilterFinalize(filterFinalize === "finalized" ? "all" : "finalized")}
                        icon={<Lock className="h-3 w-3" />}
                      >Finalized</ToggleChip>
                      <ToggleChip
                        active={filterFinalize === "draft"}
                        onClick={() => setFilterFinalize(filterFinalize === "draft" ? "all" : "draft")}
                        icon={<Pencil className="h-3 w-3" />}
                      >Draft</ToggleChip>
                      {STATUS_OPTIONS.map((s) => (
                        <ToggleChip key={s} active={filterStatus === s} onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}>
                          {s}
                        </ToggleChip>
                      ))}
                    </div>
                  </div>

                  {/* EVENT TYPE — color-dot chips */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Event type</p>
                    <div className="flex flex-wrap gap-1.5">
                      <ToggleChip active={filterType === "all"} onClick={() => setFilterType("all")}>All</ToggleChip>
                      {EVENT_TYPE_OPTIONS.map((t) => (
                        <ToggleChip key={t} active={filterType === t} onClick={() => setFilterType(filterType === t ? "all" : t)} dotColor={TYPE_DOT[t]}>
                          {t}
                        </ToggleChip>
                      ))}
                    </div>
                  </div>

                  {/* REQUIREMENT */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Requirement</p>
                    <div className="flex flex-wrap gap-1.5">
                      <ToggleChip active={filterRequirement === "all"} onClick={() => setFilterRequirement("all")}>Any</ToggleChip>
                      {[
                        ["traditional_photographer", "Trad Photo"],
                        ["traditional_videographer", "Trad Video"],
                        ["candid_photographer",     "Candid Photo"],
                        ["candid_videographer",     "Candid Video"],
                        ["drone_shoot",             "Drone"],
                        ["led_wall",                "LED Wall"],
                        ["live_streaming",          "Live Stream"],
                      ].map(([v, l]) => (
                        <ToggleChip key={v} active={filterRequirement === v} onClick={() => setFilterRequirement(filterRequirement === v ? "all" : v)}>
                          {l}
                        </ToggleChip>
                      ))}
                    </div>
                  </div>

                  {/* ASSIGNED USER — avatar grid */}
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-2">Assigned user</p>
                    <div className="flex flex-wrap gap-2">
                      <ToggleChip active={filterAssignee === "all"} onClick={() => setFilterAssignee("all")}>All members</ToggleChip>
                      {members.map((m) => {
                        const init = (m.full_name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
                        const active = filterAssignee === m.id;
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setFilterAssignee(active ? "all" : m.id)}
                            className={
                              "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium border transition " +
                              (active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/40 text-foreground border-border hover:bg-muted")
                            }
                            title={`${m.full_name}${m.role ? " — " + m.role.replace(/_/g, " ") : ""}`}
                          >
                            <span className={
                              "h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold " +
                              (active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-primary/15 text-primary")
                            }>{init}</span>
                            <span className="max-w-[80px] truncate">{m.full_name.split(" ")[0]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {WEEKDAYS.map((d) => (
            <div key={d} className="px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium text-center">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const iso = isoDate(d);
            const inMonth = d.getMonth() === month.getMonth();
            const isToday = iso === todayIso;
            const list = eventsByDay.get(iso) ?? [];
            return (
              <button
                key={iso + i}
                onClick={() => navigate(`/day/${iso}`)}
                className={
                  "min-h-[96px] border-b border-r border-border p-1.5 text-left transition relative overflow-hidden " +
                  (inMonth ? "bg-card hover:bg-muted/30" : "bg-muted/10 text-muted-foreground/60") +
                  ((i + 1) % 7 === 0 ? " border-r-0" : "") +
                  (i >= 35 ? " border-b-0" : "") +
                  (isToday ? " ring-1 ring-primary/40 ring-inset" : "")
                }
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={
                    "text-xs font-medium inline-flex items-center justify-center " +
                    (isToday ? "h-5 w-5 rounded-full bg-primary text-primary-foreground" : "")
                  }>{d.getDate()}</span>
                  {list.length > 0 && inMonth && (
                    <span className="text-[9px] text-muted-foreground">{list.length}</span>
                  )}
                </div>
                <div className="space-y-0.5">
                  {list.slice(0, 3).map((e) => {
                    const grad = TYPE_GRADIENT[e.event_type || ""] || TYPE_GRADIENT.Other;
                    return (
                      <div key={e.id} className={`text-[10px] truncate rounded px-1.5 py-0.5 text-white bg-gradient-to-r ${grad}`}
                        title={`${e.client_name ? e.client_name + " - " : ""}${e.name || e.event_type || "Event"}`}>
                        {e.client_name ? `${(e.client_name.split(" & ")[0])} - ` : ""}{e.name || e.event_type || "Event"}
                      </div>
                    );
                  })}
                  {list.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1.5">+{list.length - 3} more</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day detail — opens as a modal window on date click */}
      <Dialog open={!!selectedDay} onOpenChange={(o) => { if (!o) setSelectedDay(null); }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-5 md:p-6">
          {selectedDay && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Day overview</p>
                <h2 className="text-lg font-semibold text-foreground tracking-tight">
                  {new Date(selectedDay).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{dayEvents.length} event{dayEvents.length===1?"":"s"} scheduled</p>
              </div>
            </div>

            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No events on this day</p>
            ) : (
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[820px]">
                    <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="text-left px-3 py-2.5 font-semibold">Event</th>
                        <th className="text-left px-3 py-2.5 font-semibold">Client</th>
                        <th className="text-left px-3 py-2.5 font-semibold">Time</th>
                        <th className="text-left px-3 py-2.5 font-semibold">Venue</th>
                        <th className="text-left px-3 py-2.5 font-semibold">Team</th>
                        {seesAll && <th className="text-right px-3 py-2.5 font-semibold">Estimate</th>}
                        {seesAll && <th className="text-right px-3 py-2.5 font-semibold">Proposal</th>}
                        {seesAll && <th className="text-right px-3 py-2.5 font-semibold">Invoice</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {dayEvents.map((e) => {
                        const grad = TYPE_GRADIENT[e.event_type || ""] || TYPE_GRADIENT.Other;
                        const est = e.client_id ? docsByClient.est.get(e.client_id) : null;
                        const prop = e.client_id ? docsByClient.prop.get(e.client_id) : null;
                        const inv = e.client_id ? docsByClient.inv.get(e.client_id) : null;
                        return (
                          <tr key={e.id} className="hover:bg-muted/20 align-middle">
                            {/* Event */}
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                <span className={`h-8 w-8 rounded-lg bg-gradient-to-br ${grad} text-white flex items-center justify-center font-bold text-[9px] shrink-0`}>
                                  {(e.event_type || "EVT").slice(0, 4)}
                                </span>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-foreground truncate">{e.name || e.event_type || "Event"}</p>
                                  {e.is_finalized && <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600"><CheckCircle2 className="h-2.5 w-2.5" />Finalized</span>}
                                </div>
                              </div>
                            </td>
                            {/* Client */}
                            <td className="px-3 py-2.5">
                              {e.client_name ? (
                                <button onClick={() => e.client_id && navigate(`/clients/${e.client_id}`)} className="text-xs text-primary hover:underline truncate max-w-[140px] inline-block align-bottom">{e.client_name}</button>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            {/* Time */}
                            <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                              {(fmtTime(e.start_time) || fmtTime(e.end_time)) ? `${fmtTime(e.start_time) || "—"}${fmtTime(e.end_time) ? ` → ${fmtTime(e.end_time)}` : ""}` : "—"}
                            </td>
                            {/* Venue */}
                            <td className="px-3 py-2.5 text-xs text-muted-foreground truncate max-w-[160px]">
                              {e.venue ? (
                                <span className="inline-flex items-center gap-1">
                                  <span className="truncate">{e.venue}</span>
                                  {e.venue_map_url && (
                                    <a href={e.venue_map_url} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()} title="Open location" className="text-primary hover:text-primary/80 shrink-0">
                                      <MapPin className="h-3.5 w-3.5" />
                                    </a>
                                  )}
                                </span>
                              ) : "—"}
                            </td>
                            {/* Team */}
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5">
                                {e.assigned_member_ids.length > 0 ? (
                                  <div className="flex -space-x-1.5">
                                    {e.assigned_member_ids.slice(0, 4).map((mid) => {
                                      const m = memberById.get(mid);
                                      if (!m) return null;
                                      const init = (m.full_name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
                                      return (<div key={mid} title={m.full_name} className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-card flex items-center justify-center text-[9px] font-bold text-primary">{init}</div>);
                                    })}
                                    {e.assigned_member_ids.length > 4 && <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-medium text-muted-foreground">+{e.assigned_member_ids.length - 4}</div>}
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground italic inline-flex items-center gap-1"><Lock className="h-3 w-3" />None</span>
                                )}
                                {canManageTeam && (
                                  <button onClick={() => setAssignEvent(e)} title={e.assigned_member_ids.length ? "Edit team" : "Assign team"}
                                    className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium border border-border hover:border-primary/40 hover:text-primary transition">
                                    {e.assigned_member_ids.length ? <PencilIcon className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
                                    {e.assigned_member_ids.length ? "Edit" : "Assign"}
                                  </button>
                                )}
                                {myTeamMember && e.assigned_member_ids?.includes(myTeamMember.id) && (
                                  <button onClick={() => setCheckInEvent(e)} title="Check in" className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition">
                                    <CameraIcon className="h-3 w-3" /> Check in
                                  </button>
                                )}
                              </div>
                            </td>
                            {/* Financials */}
                            {seesAll && <td className="px-3 py-2.5 text-right"><FinChip label="Estimate" doc={est} kind="estimation" studio={organization} tone="amber" navigate={navigate} clientId={e.client_id} /></td>}
                            {seesAll && <td className="px-3 py-2.5 text-right"><FinChip label="Proposal" doc={prop} kind="proposal" studio={organization} tone="violet" navigate={navigate} clientId={e.client_id} /></td>}
                            {seesAll && <td className="px-3 py-2.5 text-right"><FinChip label="Invoice" doc={inv} kind="invoice" studio={organization} tone="emerald" navigate={navigate} clientId={e.client_id} /></td>}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Editor work log for this day */}
            <div className="mt-4">
              <EditorWorkLogPanel dateIso={selectedDay} canManage={canManageWorkLog} />
            </div>
          </>
          )}
        </DialogContent>
      </Dialog>

      {isLoading && (
        <div className="text-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" />
        </div>
      )}
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</label>
      {children}
      {assignEvent && (
        <AssignTeamDialog
          open
          onOpenChange={(v) => { if (!v) setAssignEvent(null); }}
          event={assignEvent}
        />
      )}
      {checkInEvent && (
        <CheckInDialog
          open
          onOpenChange={() => setCheckInEvent(null)}
          event={checkInEvent}
          teamMemberId={myTeamMember?.id ?? null}
        />
      )}
    </div>
  );
}

function ActiveChip({ label, onClear, icon, dotColor }: { label: string; onClear: () => void; icon?: React.ReactNode; dotColor?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-2 pr-1 py-0.5 rounded-full bg-card border border-border text-[11px] font-medium text-foreground">
      {dotColor && <span className={"h-2 w-2 rounded-full " + dotColor} />}
      {icon}
      <span className="capitalize">{label}</span>
      <button type="button" onClick={onClear} className="h-4 w-4 rounded-full hover:bg-muted flex items-center justify-center">
        <X className="h-2.5 w-2.5" />
      </button>
    </span>
  );
}

function ToggleChip({ active, onClick, children, icon, dotColor }: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
  dotColor?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition capitalize " +
        (active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-muted/40 text-foreground border-border hover:bg-muted hover:border-border/80")
      }
    >
      {dotColor && <span className={"h-2 w-2 rounded-full " + dotColor} />}
      {icon}
      {children}
    </button>
  );
}

// ─────────── Financial quick-view chip (admin/accounts only)
function inrShort(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));
}
function FinChip({ label, doc, kind, studio, tone, navigate, clientId }: {
  label: string; doc: any; kind: "estimation" | "proposal" | "invoice"; studio: any;
  tone: "amber" | "violet" | "emerald"; navigate: (p: string) => void; clientId: string | null;
}) {
  const Icon = kind === "estimation" ? FileText : kind === "proposal" ? Briefcase : Receipt;
  const toneCls = tone === "amber" ? "bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20"
    : tone === "violet" ? "bg-violet-500/10 text-violet-700 border-violet-500/30 hover:bg-violet-500/20"
    : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20";
  const amount = doc ? Number(kind === "proposal" ? doc.contract_amount || doc.total_amount || 0 : doc.total_amount || 0) : 0;

  if (!doc) {
    // No doc yet → muted button to create it on the client page
    return (
      <button
        onClick={() => clientId && navigate(`/clients/${clientId}`)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition"
        title={`No ${label.toLowerCase()} yet — create one`}
      >
        <Icon className="h-3 w-3" /> {label} <span className="opacity-60">+</span>
      </button>
    );
  }
  return (
    <button
      onClick={() => generateDocPdf(buildDocPdfPayload(kind, doc, studio), "open")}
      className={"inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition " + toneCls}
      title={`Open ${label} PDF`}
    >
      <Icon className="h-3 w-3" /> {label}
      <span className="tabular-nums font-semibold">{inrShort(amount)}</span>
    </button>
  );
}
