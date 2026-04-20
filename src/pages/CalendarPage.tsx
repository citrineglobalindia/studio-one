import { useState, useMemo, useCallback, useEffect } from "react";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, MapPin, Users, Camera,
  CalendarDays as CalIcon, Clock, Plus, Filter, Search,
  LayoutGrid, List, CalendarRange, Eye, Phone, X, Check,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  projectId: string;
  clientLabel: string;
  subEventName: string;
  date: string;
  time?: string;
  location: string;
  status: "upcoming" | "in-progress" | "completed";
  teamCount: number;
  team: { name: string; role: string }[];
  category: string;
  notes?: string;
}

const categoryColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Wedding": { bg: "bg-rose-500/10", text: "text-rose-500", border: "border-rose-500/30", dot: "bg-rose-500" },
  "Pre-Wedding": { bg: "bg-violet-500/10", text: "text-violet-500", border: "border-violet-500/30", dot: "bg-violet-500" },
  "Engagement": { bg: "bg-amber-500/10", text: "text-amber-500", border: "border-amber-500/30", dot: "bg-amber-500" },
  "Reception": { bg: "bg-cyan-500/10", text: "text-cyan-500", border: "border-cyan-500/30", dot: "bg-cyan-500" },
  "Mehendi": { bg: "bg-emerald-500/10", text: "text-emerald-500", border: "border-emerald-500/30", dot: "bg-emerald-500" },
  "Sangeet": { bg: "bg-pink-500/10", text: "text-pink-500", border: "border-pink-500/30", dot: "bg-pink-500" },
  "Haldi": { bg: "bg-yellow-500/10", text: "text-yellow-500", border: "border-yellow-500/30", dot: "bg-yellow-500" },
  default: { bg: "bg-primary/10", text: "text-primary", border: "border-primary/30", dot: "bg-primary" },
};

const eventTypeOptions = [
  { value: "Wedding Ceremony", category: "Wedding" },
  { value: "Mehendi", category: "Mehendi" },
  { value: "Sangeet", category: "Sangeet" },
  { value: "Haldi", category: "Haldi" },
  { value: "Reception", category: "Reception" },
  { value: "Engagement", category: "Engagement" },
  { value: "Pre-Wedding Shoot", category: "Pre-Wedding" },
  { value: "Ring Ceremony", category: "Engagement" },
  { value: "Cocktail Party", category: "Reception" },
];

const getCategory = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("wedding") && !lower.includes("pre")) return "Wedding";
  if (lower.includes("pre-wedding") || lower.includes("pre wedding")) return "Pre-Wedding";
  if (lower.includes("engagement") || lower.includes("ring")) return "Engagement";
  if (lower.includes("reception") || lower.includes("cocktail")) return "Reception";
  if (lower.includes("mehendi") || lower.includes("mehndi")) return "Mehendi";
  if (lower.includes("sangeet")) return "Sangeet";
  if (lower.includes("haldi")) return "Haldi";
  return "Wedding";
};

const getCatColor = (cat: string) => categoryColors[cat] || categoryColors.default;

const statusConfig: Record<string, { label: string; color: string }> = {
  upcoming: { label: "Upcoming", color: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  "in-progress": { label: "In Progress", color: "bg-amber-500/10 text-amber-500 border-amber-500/30" },
  completed: { label: "Completed", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type ViewMode = "month" | "week" | "day";

const CalendarPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clients: dbClients } = useClients();
  const { events: dbEvents, addEvent } = useEvents();
  const { projects: dbProjects } = useProjects();
  const { members: dbTeamMembers } = useTeamMembers();
  const today = new Date();
  // Initial month/year/selectedDate honors a ?date=YYYY-MM-DD query param
  // so the Events page can deep-link to a specific event's day.
  const initialDate = (() => {
    const q = searchParams.get("date");
    if (q) {
      const d = new Date(q + "T00:00:00");
      if (!isNaN(d.getTime())) return d;
    }
    return today;
  })();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(
    searchParams.get("date") || null
  );

  // If the query param changes after mount, update the view
  useEffect(() => {
    const q = searchParams.get("date");
    if (!q) return;
    const d = new Date(q + "T00:00:00");
    if (isNaN(d.getTime())) return;
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
    setSelectedDate(q);
  }, [searchParams]);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    return d;
  });

  // Schedule Event state
  const [scheduleSheet, setScheduleSheet] = useState(false);
  const [newEvent, setNewEvent] = useState({
    projectId: "",
    eventName: "",
    customName: "",
    date: "",
    time: "09:00",
    location: "",
    notes: "",
    selectedTeam: [] as string[],
  });

  const baseEvents: CalendarEvent[] = useMemo(() => {
    // Add DB client event dates
    const clientEvents: CalendarEvent[] = dbClients
      .filter((c) => c.event_date)
      .map((c) => ({
        id: `client-${c.id}`,
        projectId: "",
        clientLabel: c.partner_name ? `${c.name} & ${c.partner_name}` : c.name,
        subEventName: c.event_type || "Event",
        date: c.event_date!,
        location: c.city || "",
        status: "upcoming" as const,
        teamCount: 0,
        team: [],
        category: getCategory(c.event_type || "Wedding"),
      }));

    // Events created via the Events page (events table) — now flow into the calendar
    const savedEvents: CalendarEvent[] = dbEvents.map((e: any) => {
      const client = dbClients.find((c) => c.id === e.client_id);
      const clientLabel = client
        ? (client.partner_name ? `${client.name} & ${client.partner_name}` : client.name)
        : "Studio Event";
      const mappedStatus =
        e.status === "completed" ? "completed" :
        e.status === "cancelled" ? "upcoming" :
        e.status === "in-progress" ? "in-progress" :
        "upcoming";
      return {
        id: `event-${e.id}`,
        projectId: "",
        clientLabel,
        subEventName: e.name,
        date: e.event_date,
        location: e.venue || "",
        status: mappedStatus as any,
        teamCount: 0,
        team: [],
        category: getCategory(e.event_type || "Wedding"),
      };
    });

    return [...clientEvents, ...savedEvents];
  }, [dbClients, dbEvents]);

  const allEvents = useMemo(() => baseEvents, [baseEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      const matchStatus = statusFilter === "all" || ev.status === statusFilter;
      const matchSearch =
        searchQuery === "" ||
        ev.subEventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.clientLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ev.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchStatus && matchSearch;
    });
  }, [allEvents, statusFilter, searchQuery]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    filteredEvents.forEach((ev) => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Calendar grid computation
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarCells: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const m = currentMonth === 0 ? 11 : currentMonth - 1;
    const y = currentMonth === 0 ? currentYear - 1 : currentYear;
    calendarCells.push({ day: d, month: m, year: y, isCurrentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, month: currentMonth, year: currentYear, isCurrentMonth: true });
  }
  const remaining = 42 - calendarCells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = currentMonth === 11 ? 0 : currentMonth + 1;
    const y = currentMonth === 11 ? currentYear + 1 : currentYear;
    calendarCells.push({ day: d, month: m, year: y, isCurrentMonth: false });
  }

  // Week view days
  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const timeSlots = Array.from({ length: 14 }, (_, i) => i + 7);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };
  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    const d = new Date(today);
    d.setDate(d.getDate() - d.getDay());
    setWeekStart(d);
    setSelectedDate(formatDateStr(today.getFullYear(), today.getMonth(), today.getDate()));
  };

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };

  const formatDateStr = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const thisMonthEvents = filteredEvents.filter((ev) => {
    const d = new Date(ev.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const uniqueCategories = [...new Set(allEvents.map((e) => e.category))];

  const eventDatesForMini = useMemo(() => {
    return filteredEvents.map((e) => new Date(e.date));
  }, [filteredEvents]);

  // Open schedule sheet, optionally pre-fill date
  const openSchedule = (preDate?: string) => {
    setNewEvent({
      projectId: "",
      eventName: "",
      customName: "",
      date: preDate || "",
      time: "09:00",
      location: "",
      notes: "",
      selectedTeam: [],
    });
    setScheduleSheet(true);
  };

  const toggleTeamMember = (id: string) => {
    setNewEvent(prev => ({
      ...prev,
      selectedTeam: prev.selectedTeam.includes(id)
        ? prev.selectedTeam.filter(t => t !== id)
        : [...prev.selectedTeam, id],
    }));
  };

  const handleScheduleEvent = async () => {
    const eventName = newEvent.eventName === "custom" ? newEvent.customName : newEvent.eventName;
    if (!eventName) { toast.error("Please select or enter an event name"); return; }
    if (!newEvent.date) { toast.error("Please select a date"); return; }
    if (!newEvent.location) { toast.error("Please enter a location"); return; }

    try {
      await addEvent.mutateAsync({
        name: eventName,
        event_type: getCategory(eventName) || "Wedding",
        event_date: newEvent.date,
        start_time: newEvent.time ? `${newEvent.time}:00` : null,
        end_time: null,
        venue: newEvent.location,
        notes: newEvent.notes || null,
        client_id: null,
        project_id: newEvent.projectId || null,
        status: "upcoming",
      });
      setScheduleSheet(false);

      // Reset the form so it's clean for the next schedule
      setNewEvent({
        projectId: "",
        eventName: "",
        customName: "",
        date: "",
        time: "09:00",
        location: "",
        notes: "",
        selectedTeam: [],
      });

      // Navigate to the event date
      const d = new Date(newEvent.date);
      setCurrentMonth(d.getMonth());
      setCurrentYear(d.getFullYear());
      setSelectedDate(newEvent.date);
    } catch {
      // useEvents hook already toasts on error
    }
  };

  // Selected project info for the form
  const selectedProject = dbProjects.find((p: any) => p.id === newEvent.projectId);

  return (
    <div className="max-w-full mx-auto space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <CalIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Event Calendar</h1>
            <p className="text-sm text-muted-foreground">
              {thisMonthEvents.length} events in {MONTHS[currentMonth]} · {filteredEvents.filter((e) => e.status === "upcoming").length} upcoming
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {([
              { mode: "month" as ViewMode, icon: LayoutGrid, label: "Month" },
              { mode: "week" as ViewMode, icon: CalendarRange, label: "Week" },
              { mode: "day" as ViewMode, icon: List, label: "Day" },
            ]).map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  viewMode === mode ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          <Button size="sm" className="gap-2" onClick={() => openSchedule()}>
            <Plus className="h-4 w-4" /> Add Event
          </Button>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search events, clients, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Category Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {uniqueCategories.map((cat) => {
          const c = getCatColor(cat);
          return (
            <div key={cat} className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
              <span className="text-xs text-muted-foreground">{cat}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-5">
        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={viewMode === "week" ? prevWeek : prevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={goToday}>Today</Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={viewMode === "week" ? nextWeek : nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <h2 className="text-lg font-display font-semibold text-foreground">
              {viewMode === "week"
                ? `${weekDays[0].toLocaleDateString("en-IN", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`
                : viewMode === "day" && selectedDate
                ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                : `${MONTHS[currentMonth]} ${currentYear}`}
            </h2>
          </div>

          {/* ===== MONTH VIEW ===== */}
          {viewMode === "month" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-7">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-[10px] uppercase tracking-widest text-muted-foreground/60 py-3 border-b border-border font-medium">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {calendarCells.map((cell, idx) => {
                  const dateStr = formatDateStr(cell.year, cell.month, cell.day);
                  const dayEvents = eventsByDate[dateStr] || [];
                  const isToday = dateStr === todayStr;
                  const isSelected = dateStr === selectedDate;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(dateStr)}
                      onDoubleClick={() => { setSelectedDate(dateStr); setViewMode("day"); }}
                      className={cn(
                        "border-r border-b border-border min-h-[100px] p-1.5 cursor-pointer transition-all hover:bg-muted/20 relative group/cell",
                        !cell.isCurrentMonth && "opacity-25",
                        isSelected && "bg-primary/5 ring-1 ring-primary/30 ring-inset",
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className={cn(
                          "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                          isToday && "bg-primary text-primary-foreground",
                          isSelected && !isToday && "bg-primary/20 text-primary",
                          !isToday && !isSelected && "text-muted-foreground",
                        )}>
                          {cell.day}
                        </div>
                        {/* Quick add button on hover */}
                        <button
                          onClick={(e) => { e.stopPropagation(); openSchedule(dateStr); }}
                          className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center opacity-0 group-hover/cell:opacity-100 transition-opacity hover:bg-primary/20"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map((ev) => {
                          const catColor = getCatColor(ev.category);
                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                              className={cn(
                                "text-[10px] leading-tight px-1.5 py-0.5 rounded-md truncate border cursor-pointer transition-all hover:scale-[1.02]",
                                catColor.bg, catColor.text, catColor.border,
                              )}
                              title={`${ev.subEventName} - ${ev.clientLabel}`}
                            >
                              {ev.subEventName}
                            </div>
                          );
                        })}
                        {dayEvents.length > 3 && (
                          <div className="text-[9px] text-primary font-medium px-1.5 cursor-pointer hover:underline">
                            +{dayEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ===== WEEK VIEW ===== */}
          {viewMode === "week" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
                <div className="border-r border-border" />
                {weekDays.map((day) => {
                  const ds = formatDateStr(day.getFullYear(), day.getMonth(), day.getDate());
                  const isToday = ds === todayStr;
                  const dayEvts = eventsByDate[ds] || [];
                  return (
                    <div
                      key={ds}
                      className={cn(
                        "text-center py-3 border-r border-border last:border-r-0 cursor-pointer hover:bg-muted/20 transition-colors",
                        isToday && "bg-primary/5",
                      )}
                      onClick={() => { setSelectedDate(ds); setViewMode("day"); }}
                    >
                      <p className="text-[10px] text-muted-foreground uppercase">{DAYS[day.getDay()]}</p>
                      <p className={cn(
                        "text-lg font-display font-bold mt-0.5",
                        isToday ? "text-primary" : "text-foreground",
                      )}>
                        {day.getDate()}
                      </p>
                      {dayEvts.length > 0 && (
                        <div className="flex justify-center gap-0.5 mt-1">
                          {dayEvts.slice(0, 3).map((e) => (
                            <div key={e.id} className={`h-1.5 w-1.5 rounded-full ${getCatColor(e.category).dot}`} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="max-h-[500px] overflow-y-auto">
                {timeSlots.map((hour) => (
                  <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50 min-h-[60px]">
                    <div className="text-[10px] text-muted-foreground text-right pr-2 pt-1 border-r border-border">
                      {hour > 12 ? `${hour - 12} PM` : hour === 12 ? "12 PM" : `${hour} AM`}
                    </div>
                    {weekDays.map((day) => {
                      const ds = formatDateStr(day.getFullYear(), day.getMonth(), day.getDate());
                      const dayEvts = eventsByDate[ds] || [];
                      const slotEvents = hour === 9 ? dayEvts : [];
                      return (
                        <div key={ds + hour} className="border-r border-border/50 last:border-r-0 p-0.5 hover:bg-muted/10 transition-colors cursor-pointer"
                          onClick={() => openSchedule(ds)}>
                          {slotEvents.map((ev) => {
                            const catColor = getCatColor(ev.category);
                            return (
                              <div
                                key={ev.id}
                                onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                                className={cn(
                                  "text-[9px] px-1.5 py-1 rounded-md border mb-0.5 cursor-pointer truncate hover:scale-[1.02] transition-transform",
                                  catColor.bg, catColor.text, catColor.border,
                                )}
                              >
                                {ev.subEventName}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ===== DAY VIEW ===== */}
          {viewMode === "day" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                {selectedDate && selectedEvents.length > 0 ? (
                  <div className="divide-y divide-border">
                    {selectedEvents.map((ev, i) => {
                      const catColor = getCatColor(ev.category);
                      return (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setSelectedEvent(ev)}
                          className="p-5 hover:bg-muted/20 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-4">
                            <div className="text-center shrink-0 w-16">
                              <p className="text-xs text-muted-foreground">{ev.time || "9:00 AM"}</p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">All Day</p>
                            </div>
                            <div className={cn("w-1 self-stretch rounded-full shrink-0", catColor.dot)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-semibold text-foreground">{ev.subEventName}</h3>
                                <Badge variant="outline" className={cn("text-[10px]", catColor.bg, catColor.text, catColor.border)}>
                                  {ev.category}
                                </Badge>
                              </div>
                              <p className="text-xs text-primary mb-2">{ev.clientLabel}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ev.location}</span>
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {ev.teamCount} crew</span>
                                <Badge variant="outline" className={cn("text-[10px]", statusConfig[ev.status].color)}>
                                  {statusConfig[ev.status].label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 mt-3">
                                {ev.team.slice(0, 5).map((t, idx) => (
                                  <Avatar key={idx} className="h-7 w-7 border-2 border-card -ml-1 first:ml-0">
                                    <AvatarFallback className="text-[9px] bg-muted text-foreground">{t.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                                  </Avatar>
                                ))}
                                {ev.team.length > 5 && (
                                  <span className="text-[10px] text-muted-foreground ml-1">+{ev.team.length - 5}</span>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={(e) => { e.stopPropagation(); navigate(`/projects/${ev.projectId}`); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-20 text-center">
                    <CalIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {selectedDate ? "No events on this day" : "Select a date to view events"}
                    </p>
                    <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => openSchedule(selectedDate || undefined)}>
                      <Plus className="h-4 w-4" /> Schedule Event
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 shrink-0 hidden xl:flex flex-col gap-4">
          <div className="rounded-xl bg-card border border-border overflow-hidden">
            <Calendar
              mode="single"
              selected={selectedDate ? new Date(selectedDate + "T00:00:00") : undefined}
              onSelect={(d) => {
                if (d) {
                  const ds = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
                  setSelectedDate(ds);
                  setCurrentMonth(d.getMonth());
                  setCurrentYear(d.getFullYear());
                }
              }}
              className={cn("p-3 pointer-events-auto")}
              modifiers={{ event: eventDatesForMini }}
              modifiersClassNames={{ event: "bg-primary/20 text-primary font-bold rounded-full" }}
            />
          </div>

          <div className="rounded-xl bg-card border border-border overflow-hidden flex-1">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                {selectedDate
                  ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
                  : "Select a date"}
              </h3>
              {selectedDate && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary" onClick={() => openSchedule(selectedDate)}>
                  <Plus className="h-3 w-3" /> Add
                </Button>
              )}
            </div>
            {selectedEvents.length > 0 ? (
              <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
                {selectedEvents.map((ev) => {
                  const catColor = getCatColor(ev.category);
                  return (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvent(ev)}
                      className="p-3 hover:bg-muted/20 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", catColor.dot)} />
                        <p className="text-sm font-medium text-foreground truncate">{ev.subEventName}</p>
                      </div>
                      <p className="text-xs text-primary ml-4 mb-1.5">{ev.clientLabel}</p>
                      <div className="ml-4 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <MapPin className="h-3 w-3" />{ev.location}
                        <span>·</span>
                        <Users className="h-3 w-3" />{ev.teamCount}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted-foreground">
                {selectedDate ? "No events" : "Click a date"}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-card border border-border p-4 space-y-3">
            <h3 className="text-sm font-display font-semibold text-foreground">This Month</h3>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Total", value: thisMonthEvents.length, color: "text-foreground" },
                { label: "Upcoming", value: thisMonthEvents.filter((e) => e.status === "upcoming").length, color: "text-blue-500" },
                { label: "Done", value: thisMonthEvents.filter((e) => e.status === "completed").length, color: "text-emerald-500" },
              ].map((s) => (
                <div key={s.label} className="text-center p-2 rounded-lg bg-muted/30">
                  <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedEvent && (() => {
            const catColor = getCatColor(selectedEvent.category);
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <div className={cn("h-3 w-3 rounded-full", catColor.dot)} />
                    <DialogTitle>{selectedEvent.subEventName}</DialogTitle>
                  </div>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className={cn("text-xs", catColor.bg, catColor.text, catColor.border)}>
                      {selectedEvent.category}
                    </Badge>
                    <Badge variant="outline" className={cn("text-xs", statusConfig[selectedEvent.status].color)}>
                      {statusConfig[selectedEvent.status].label}
                    </Badge>
                  </div>

                  <div className="rounded-xl bg-muted/30 p-4 space-y-3">
                    <p className="text-sm font-medium text-primary">{selectedEvent.clientLabel}</p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalIcon className="h-4 w-4" />
                        {new Date(selectedEvent.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {selectedEvent.location}
                      </div>
                    </div>
                    {selectedEvent.time && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {selectedEvent.time}
                      </div>
                    )}
                    {selectedEvent.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">{selectedEvent.notes}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">Assigned Team ({selectedEvent.team.length})</p>
                    <div className="space-y-2">
                      {selectedEvent.team.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/20">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {t.name.split(" ").map(n => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-foreground">{t.name}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{t.role}</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Phone className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      {selectedEvent.team.length === 0 && (
                        <p className="text-xs text-muted-foreground p-3 text-center bg-muted/20 rounded-lg">No team assigned yet</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {selectedEvent.projectId && (
                      <Button className="flex-1 gap-2" onClick={() => navigate(`/projects/${selectedEvent.projectId}`)}>
                        <Eye className="h-4 w-4" /> View Project
                      </Button>
                    )}
                    <Button variant="outline" className="flex-1 gap-2">
                      <Camera className="h-4 w-4" /> Edit Event
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ===== SCHEDULE EVENT SHEET ===== */}
      <Sheet open={scheduleSheet} onOpenChange={setScheduleSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-left flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" /> Schedule Event
            </SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Link to Project (optional) */}
            <div>
              <label className="text-sm font-medium text-foreground">Link to Project</label>
              <Select value={newEvent.projectId} onValueChange={v => setNewEvent(p => ({ ...p, projectId: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select project (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No project (standalone)</SelectItem>
                  {(dbProjects as any[]).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.project_name || p.name || p.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProject && (
                <div className="mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-medium text-primary">{selectedProject.clientName} & {selectedProject.partnerName}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{selectedProject.venue} · {selectedProject.package}</p>
                </div>
              )}
            </div>

            {/* Event Type */}
            <div>
              <label className="text-sm font-medium text-foreground">Event Type *</label>
              <Select value={newEvent.eventName} onValueChange={v => setNewEvent(p => ({ ...p, eventName: v }))}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select event type" /></SelectTrigger>
                <SelectContent>
                  {eventTypeOptions.map(opt => {
                    const catColor = getCatColor(opt.category);
                    return (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${catColor.dot}`} />
                          {opt.value}
                        </span>
                      </SelectItem>
                    );
                  })}
                  <SelectItem value="custom">✏️ Custom Event Name</SelectItem>
                </SelectContent>
              </Select>
              {newEvent.eventName === "custom" && (
                <Input className="mt-2" placeholder="Enter custom event name" value={newEvent.customName}
                  onChange={e => setNewEvent(p => ({ ...p, customName: e.target.value }))} />
              )}
              {newEvent.eventName && newEvent.eventName !== "custom" && (
                <div className="mt-2 flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full ${getCatColor(getCategory(newEvent.eventName)).dot}`} />
                  <Badge variant="outline" className={cn("text-[10px]",
                    getCatColor(getCategory(newEvent.eventName)).bg,
                    getCatColor(getCategory(newEvent.eventName)).text,
                    getCatColor(getCategory(newEvent.eventName)).border,
                  )}>
                    {getCategory(newEvent.eventName)}
                  </Badge>
                </div>
              )}
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-foreground">Date *</label>
                <Input className="mt-1" type="date" value={newEvent.date}
                  onChange={e => setNewEvent(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Time</label>
                <Input className="mt-1" type="time" value={newEvent.time}
                  onChange={e => setNewEvent(p => ({ ...p, time: e.target.value }))} />
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="text-sm font-medium text-foreground">Location *</label>
              <Input className="mt-1" placeholder="Venue name, address..."
                value={newEvent.location}
                onChange={e => setNewEvent(p => ({ ...p, location: e.target.value }))} />
            </div>

            <Separator />

            {/* Team Assignment */}
            <div>
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" /> Assign Team
              </label>
              <p className="text-[10px] text-muted-foreground mt-0.5 mb-3">
                {newEvent.selectedTeam.length} member{newEvent.selectedTeam.length !== 1 ? "s" : ""} selected
              </p>

              {/* Group by role */}
              {(() => {
                const rolesPresent = Array.from(new Set((dbTeamMembers as any[]).map(m => m.role).filter(Boolean)));
                return rolesPresent.map(role => {
                const members = (dbTeamMembers as any[]).filter(m => m.role === role);
                if (members.length === 0) return null;
                return (
                  <div key={role} className="mb-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 capitalize">{String(role).replace("_", " ").replace("-", " ")}s</p>
                    <div className="space-y-1">
                      {members.map((m: any) => {
                        const isSelected = newEvent.selectedTeam.includes(m.id);
                        return (
                          <div key={m.id}
                            onClick={() => toggleTeamMember(m.id)}
                            className={cn(
                              "flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all",
                              isSelected ? "border-primary/50 bg-primary/5" : "border-border/50 hover:bg-muted/30",
                            )}>
                            <div className={cn(
                              "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                              isSelected ? "bg-primary border-primary" : "border-muted-foreground/30",
                            )}>
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
                                {(m.full_name || "").split(" ").map((n: string) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{m.full_name}</p>
                              <p className="text-[10px] text-muted-foreground capitalize">{String(m.role || "").replace("_", " ")}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
                });
              })()}
            </div>

            <Separator />

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-foreground">Notes</label>
              <Textarea className="mt-1 min-h-[80px]" placeholder="Special instructions, timings, equipment needs..."
                value={newEvent.notes}
                onChange={e => setNewEvent(p => ({ ...p, notes: e.target.value }))} />
            </div>

            {/* Summary */}
            {(newEvent.eventName || newEvent.customName) && newEvent.date && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event Summary</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${getCatColor(getCategory(newEvent.eventName === "custom" ? newEvent.customName : newEvent.eventName)).dot}`} />
                    <p className="text-sm font-semibold text-foreground">{newEvent.eventName === "custom" ? newEvent.customName : newEvent.eventName}</p>
                  </div>
                  {selectedProject && (
                    <p className="text-xs text-primary ml-5">{selectedProject.clientName} & {selectedProject.partnerName}</p>
                  )}
                  <p className="text-xs text-muted-foreground ml-5 flex items-center gap-1">
                    <CalIcon className="h-3 w-3" />
                    {new Date(newEvent.date + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                    {newEvent.time && ` at ${newEvent.time}`}
                  </p>
                  {newEvent.location && (
                    <p className="text-xs text-muted-foreground ml-5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {newEvent.location}
                    </p>
                  )}
                  {newEvent.selectedTeam.length > 0 && (
                    <p className="text-xs text-muted-foreground ml-5 flex items-center gap-1">
                      <Users className="h-3 w-3" /> {newEvent.selectedTeam.length} team members assigned
                    </p>
                  )}
                </div>
              </div>
            )}

            <Button className="w-full mt-2 gap-2" onClick={handleScheduleEvent}>
              <CalIcon className="h-4 w-4" /> Schedule Event
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default CalendarPage;
