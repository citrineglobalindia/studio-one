import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, MapPin, Clock, ChevronRight as ChevronR,
  CalendarDays, Sparkles, Briefcase,
} from "lucide-react";
import { useMyAssignedEvents } from "@/hooks/useMyAssignedEvents";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS = ["S","M","T","W","T","F","S"];

function fmtTime(t?: string | null) {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = Number(h);
  const ap = hh >= 12 ? "PM" : "AM";
  const h12 = ((hh + 11) % 12) + 1;
  return `${h12}:${m} ${ap}`;
}

export default function RoleCalendarPage() {
  const navigate = useNavigate();
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selected, setSelected] = useState<string>(today.toISOString().slice(0, 10));

  const { events, teamMember, isLoading } = useMyAssignedEvents();

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    for (const e of events) (map[e.event_date] ??= []).push(e);
    return map;
  }, [events]);

  const grid = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells: { day: number | null; iso: string | null }[] = [];
    for (let i = 0; i < first; i++) cells.push({ day: null, iso: null });
    for (let d = 1; d <= days; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, iso });
    }
    return cells;
  }, [month, year]);

  const monthEvents = useMemo(
    () => events.filter((e) => {
      const d = new Date(e.event_date);
      return d.getMonth() === month && d.getFullYear() === year;
    }),
    [events, month, year]
  );

  const upcomingThisMonth = useMemo(
    () => monthEvents
      .filter((e) => new Date(e.event_date) >= new Date(today.toISOString().slice(0, 10)))
      .slice(0, 3),
    [monthEvents]
  );

  const dayEvents = selected ? (eventsByDate[selected] ?? []) : [];

  const stepMonth = (dir: -1 | 1) => {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  };

  const jumpToday = () => {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
    setSelected(today.toISOString().slice(0, 10));
  };

  return (
    <div>
      {/* Hero */}
      <div className="relative px-5 pt-5 pb-12 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-primary/55" />
        <div className="absolute -top-24 -right-12 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] opacity-75 font-semibold flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" /> My Schedule
              </p>
              <p className="text-2xl font-black tracking-tight mt-1">{MONTHS[month]} <span className="opacity-70">{year}</span></p>
              <p className="text-[12px] opacity-85 mt-0.5">
                {teamMember
                  ? `${monthEvents.length} event${monthEvents.length === 1 ? "" : "s"} assigned`
                  : "Your assigned shoots"}
              </p>
            </div>
            <button
              onClick={jumpToday}
              className="px-3 h-9 rounded-2xl bg-white/15 backdrop-blur-xl ring-1 ring-white/20 text-[11px] font-semibold flex items-center gap-1 active:scale-95 transition"
            >
              <Sparkles className="h-3 w-3" /> Today
            </button>
          </div>

          {/* Quick mini-strip of next 3 events */}
          {upcomingThisMonth.length > 0 && (
            <div className="flex gap-2 -mx-1 px-1 overflow-x-auto pb-1">
              {upcomingThisMonth.map((e) => {
                const d = new Date(e.event_date);
                return (
                  <button
                    key={e.id}
                    onClick={() => setSelected(e.event_date)}
                    className="shrink-0 min-w-[140px] text-left bg-white/15 backdrop-blur-xl ring-1 ring-white/20 rounded-2xl p-2.5 active:scale-[0.97] transition"
                  >
                    <p className="text-[9px] uppercase tracking-wider opacity-75 font-semibold">
                      {MONTHS[d.getMonth()].slice(0, 3)} · {d.getDate()}
                    </p>
                    <p className="text-[12px] font-bold truncate mt-0.5">{e.name}</p>
                    {e.start_time && <p className="text-[10px] opacity-80 mt-0.5">{fmtTime(e.start_time)}</p>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sheet with calendar */}
      <div className="bg-background -mt-6 rounded-t-[28px] relative z-10 px-5 pt-5 pb-6 ring-1 ring-border/40">
        {!teamMember && !isLoading && (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3 mb-4 text-[12px] text-amber-700 dark:text-amber-300">
            No staff profile linked. Ask your admin to link your account to see assignments.
          </div>
        )}

        {/* Month switcher */}
        <div className="bg-card border border-border rounded-3xl p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => stepMonth(-1)} className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center active:scale-90 transition">
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <p className="text-[15px] font-extrabold text-foreground tracking-tight">
              {MONTHS[month]} {year}
            </p>
            <button onClick={() => stepMonth(1)} className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center active:scale-90 transition">
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {DAYS.map((d, i) => (
              <p key={i} className="text-center text-[10px] font-bold text-muted-foreground/70 uppercase tracking-wider">{d}</p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {grid.map((cell, i) => {
              const count = cell.iso ? (eventsByDate[cell.iso]?.length ?? 0) : 0;
              const isToday = cell.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const isSel = cell.iso != null && cell.iso === selected;
              return (
                <button
                  key={i}
                  disabled={cell.day == null}
                  onClick={() => cell.iso && setSelected(cell.iso)}
                  className={`relative aspect-square rounded-xl text-[12.5px] font-bold transition-all ${
                    cell.day == null
                      ? ""
                      : isSel
                      ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/30 scale-[1.04]"
                      : isToday
                      ? "bg-primary/12 text-primary ring-1 ring-primary/30"
                      : count > 0
                      ? "text-foreground bg-secondary/60 hover:bg-secondary"
                      : "text-foreground/80 hover:bg-secondary/60"
                  }`}
                >
                  {cell.day ?? ""}
                  {count > 0 && !isSel && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {Array.from({ length: Math.min(count, 3) }).map((_, k) => (
                        <span key={k} className="h-1 w-1 rounded-full bg-primary" />
                      ))}
                    </span>
                  )}
                  {count > 0 && isSel && (
                    <span className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full bg-white/25 text-[8.5px] font-black flex items-center justify-center">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-primary" />
            <h3 className="text-[14px] font-extrabold text-foreground tracking-tight">
              {selected
                ? `${new Date(selected).getDate()} ${MONTHS[new Date(selected).getMonth()]} ${new Date(selected).getFullYear()}`
                : "Pick a date"}
            </h3>
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">
            {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="space-y-2.5">
          {isLoading && (
            <>
              {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
            </>
          )}
          <AnimatePresence>
            {!isLoading && dayEvents.map((e, i) => (
              <motion.button
                key={e.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => navigate(`/m/projects/${e.project_id ?? e.id}/event-day?event=${e.id}`)}
                className="group relative w-full text-left bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 active:opacity-90 hover:border-primary/40 hover:shadow-md transition-all overflow-hidden"
              >
                <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-primary/70" />
                <div className="ml-1 h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20 flex flex-col items-center justify-center shrink-0">
                  <p className="text-[9px] font-bold text-primary leading-none uppercase tracking-wider">
                    {MONTHS[new Date(e.event_date).getMonth()].slice(0, 3)}
                  </p>
                  <p className="text-[17px] font-black text-primary leading-none mt-0.5">
                    {new Date(e.event_date).getDate()}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-foreground truncate">{e.name}</p>
                  {e.client_name && (
                    <p className="text-[11px] text-muted-foreground truncate">
                      {e.client_name}{e.partner_name ? ` & ${e.partner_name}` : ""}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-1 text-[10.5px] text-muted-foreground">
                    {e.start_time && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {fmtTime(e.start_time)}
                      </span>
                    )}
                    {e.venue && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" /> {e.venue}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronR className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 shrink-0 transition" />
              </motion.button>
            ))}
          </AnimatePresence>

          {!isLoading && dayEvents.length === 0 && (
            <div className="text-center py-10 rounded-2xl bg-card border border-dashed border-border">
              <Briefcase className="h-7 w-7 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-semibold text-foreground">Nothing scheduled</p>
              <p className="text-[11px] text-muted-foreground mt-1">Pick another date with a dot to see events.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
