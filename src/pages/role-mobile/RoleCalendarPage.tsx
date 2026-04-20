import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Clock, ChevronRight as ChevronR } from "lucide-react";
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

  // Index events by YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    for (const e of events) {
      (map[e.event_date] ??= []).push(e);
    }
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

  const monthCount = useMemo(
    () => events.filter((e) => {
      const d = new Date(e.event_date);
      return d.getMonth() === month && d.getFullYear() === year;
    }).length,
    [events, month, year]
  );

  const dayEvents = selected ? (eventsByDate[selected] ?? []) : [];

  const stepMonth = (dir: -1 | 1) => {
    let m = month + dir;
    let y = year;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setMonth(m); setYear(y);
  };

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-foreground">Calendar</h1>
        <p className="text-[12px] text-muted-foreground">
          {teamMember
            ? `${monthCount} event${monthCount === 1 ? "" : "s"} this month · ${teamMember.full_name}`
            : "Your assigned shoots"}
        </p>
      </div>

      {!teamMember && !isLoading && (
        <div className="rounded-2xl bg-card border border-border p-4 mb-4 text-[12px] text-muted-foreground">
          No staff profile linked. Ask admin to link your account.
        </div>
      )}

      {/* Month switcher */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => stepMonth(-1)} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <p className="text-[15px] font-bold text-foreground">{MONTHS[month]} {year}</p>
          <button onClick={() => stepMonth(1)} className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d, i) => (
            <p key={i} className="text-center text-[10px] font-semibold text-muted-foreground uppercase">{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((cell, i) => {
            const has = cell.iso ? (eventsByDate[cell.iso]?.length ?? 0) > 0 : false;
            const isToday = cell.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSel = cell.iso != null && cell.iso === selected;
            return (
              <button
                key={i}
                disabled={cell.day == null}
                onClick={() => cell.iso && setSelected(cell.iso)}
                className={`relative h-9 rounded-lg text-[12px] font-semibold transition-colors ${
                  cell.day == null
                    ? ""
                    : isSel
                    ? "bg-primary text-primary-foreground"
                    : isToday
                    ? "bg-primary/15 text-primary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {cell.day ?? ""}
                {has && !isSel && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h3 className="text-[14px] font-bold text-foreground">
          {selected ? `Events on ${new Date(selected).getDate()} ${MONTHS[new Date(selected).getMonth()]}` : "Pick a date"}
        </h3>
      </div>

      <div className="space-y-2.5">
        {isLoading && (
          <div className="text-center py-6 text-muted-foreground text-sm">Loading…</div>
        )}
        {!isLoading && dayEvents.map((e, i) => (
          <motion.button
            key={e.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/m/projects/${e.project_id ?? e.id}/event-day?event=${e.id}`)}
            className="w-full text-left bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3 active:opacity-80"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/12 flex flex-col items-center justify-center shrink-0">
              <p className="text-[10px] font-semibold text-primary leading-none">
                {MONTHS[new Date(e.event_date).getMonth()].slice(0, 3).toUpperCase()}
              </p>
              <p className="text-[16px] font-extrabold text-primary leading-none mt-0.5">
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
              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                {e.start_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {fmtTime(e.start_time)}</span>}
                {e.venue && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {e.venue}</span>}
              </div>
            </div>
            <ChevronR className="h-4 w-4 text-muted-foreground/50 shrink-0" />
          </motion.button>
        ))}
        {!isLoading && dayEvents.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No events on this date.</div>
        )}
      </div>
    </div>
  );
}
