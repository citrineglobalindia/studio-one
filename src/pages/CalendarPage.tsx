import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, CalendarDays, Loader2, Clock,
  MapPin, Users, X, Lock, CheckCircle2, Filter, Search, FilterX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCalendarEvents, type CalendarEventRow } from "@/hooks/useCalendarEvents";
import { useRole } from "@/contexts/RoleContext";
import { useTeamMembers } from "@/hooks/useTeamMembers";

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
  const { members } = useTeamMembers();
  const memberById = new Map(members.map((m) => [m.id, m]));

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
  }, [events]);

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

      {/* FILTER BAR — admin / administrator only */}
      {seesAll && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setShowFilters((v) => !v)}>
                <Filter className="h-3.5 w-3.5" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="ml-1 h-4 px-1 text-[10px]">{activeFilterCount}</Badge>
                )}
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="gap-1 h-8 text-xs" onClick={clearFilters}>
                  <FilterX className="h-3.5 w-3.5" /> Clear all
                </Button>
              )}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search event, client, venue…" className="pl-9 h-8" />
            </div>
          </div>

          {showFilters && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-border bg-card p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <FilterField label="Event type">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {EVENT_TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Status">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Finalize state">
                <Select value={filterFinalize} onValueChange={setFilterFinalize}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FINALIZE_OPTIONS.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Assigned user">
                <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All members</SelectItem>
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name}{m.role ? ` (${m.role.replace(/_/g, " ")})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FilterField>
              <FilterField label="Requirement">
                <Select value={filterRequirement} onValueChange={setFilterRequirement}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any requirement</SelectItem>
                    {[
                      ["traditional_photographer", "Traditional Photographer"],
                      ["traditional_videographer", "Traditional Videographer"],
                      ["candid_photographer",     "Candid Photographer"],
                      ["candid_videographer",     "Candid Videographer"],
                      ["drone_shoot",             "Drone Shoot"],
                      ["led_wall",                "LED Wall"],
                    ].map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FilterField>
            </motion.div>
          )}
          {activeFilterCount > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Showing <span className="text-foreground font-medium">{filteredEvents.length}</span> of {events.length} events
            </p>
          )}
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
                onClick={() => setSelectedDay(iso)}
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
                        title={`${e.event_type || "Event"} — ${e.client_name || ""}`}>
                        {fmtTime(e.start_time) && <span className="opacity-90 mr-1">{fmtTime(e.start_time)}</span>}
                        {e.event_type || "Event"}
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

      {/* Side panel for selected day */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl border border-border bg-card p-4 md:p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Selected day</p>
                <h2 className="text-base font-semibold text-foreground tracking-tight">
                  {new Date(selectedDay).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                </h2>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setSelectedDay(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {dayEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No events on this day</p>
            ) : (
              <div className="space-y-2">
                {dayEvents.map((e) => {
                  const grad = TYPE_GRADIENT[e.event_type || ""] || TYPE_GRADIENT.Other;
                  return (
                    <div key={e.id} className="rounded-xl border border-border p-3 flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${grad} text-white flex items-center justify-center font-bold text-[11px] shrink-0`}>
                        {(e.event_type || "EVT").slice(0, 4)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{e.event_type || "Event"}</p>
                          {e.client_name && (
                            <button onClick={() => e.client_id && navigate(`/clients/${e.client_id}`)} className="text-xs text-primary hover:underline">
                              {e.client_name}
                            </button>
                          )}
                          {e.is_finalized && (
                            <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              <CheckCircle2 className="h-3 w-3" /> Finalized
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                          {(fmtTime(e.start_time) || fmtTime(e.end_time)) && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {fmtTime(e.start_time) || "—"}{fmtTime(e.end_time) ? ` → ${fmtTime(e.end_time)}` : ""}
                            </span>
                          )}
                          {e.venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.venue}</span>}
                        </div>
                      </div>

                      <div className="shrink-0 hidden md:block">
                        {e.assigned_member_ids.length > 0 ? (
                          <div className="flex -space-x-1.5">
                            {e.assigned_member_ids.slice(0, 5).map((mid) => {
                              const m = memberById.get(mid);
                              if (!m) return null;
                              const init = (m.full_name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
                              return (
                                <div key={mid} title={m.full_name} className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-card flex items-center justify-center text-[10px] font-bold text-primary">
                                  {init}
                                </div>
                              );
                            })}
                            {e.assigned_member_ids.length > 5 && (
                              <div className="h-7 w-7 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[10px] font-medium text-muted-foreground">
                                +{e.assigned_member_ids.length - 5}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                            <Lock className="h-3 w-3" /> Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
    </div>
  );
}
