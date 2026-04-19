import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Clock } from "lucide-react";

const EVENTS = [
  { date: 12, month: 4, title: "Sharma Wedding", time: "10:00 AM", venue: "Taj Banquet" },
  { date: 12, month: 4, title: "Team Standup", time: "06:00 PM", venue: "Studio" },
  { date: 18, month: 4, title: "Iyer Pre-Wedding", time: "08:00 AM", venue: "Munnar" },
  { date: 20, month: 4, title: "Verma Engagement", time: "07:00 PM", venue: "Leela Palace" },
  { date: 25, month: 4, title: "Edit Review", time: "11:00 AM", venue: "Studio" },
  { date: 2, month: 5, title: "Mehta Sangeet", time: "06:30 PM", venue: "Hyatt Regency" },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export default function RoleCalendarPage() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year] = useState(today.getFullYear());
  const [selected, setSelected] = useState<number | null>(today.getDate());

  const grid = useMemo(() => {
    const first = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    return cells;
  }, [month, year]);

  const dayEvents = EVENTS.filter((e) => e.month === month && (selected === null || e.date === selected));

  return (
    <div className="px-5 pt-5 pb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-extrabold text-foreground">Calendar</h1>
        <p className="text-[12px] text-muted-foreground">Your shoots and assignments</p>
      </div>

      {/* Month switcher */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => setMonth((m) => Math.max(0, m - 1))}
            className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center"
          >
            <ChevronLeft className="h-4 w-4 text-foreground" />
          </button>
          <p className="text-[15px] font-bold text-foreground">{MONTHS[month]} {year}</p>
          <button
            onClick={() => setMonth((m) => Math.min(11, m + 1))}
            className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center"
          >
            <ChevronRight className="h-4 w-4 text-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAYS.map((d, i) => (
            <p key={i} className="text-center text-[10px] font-semibold text-muted-foreground uppercase">{d}</p>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((d, i) => {
            const has = d != null && EVENTS.some((e) => e.month === month && e.date === d);
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isSel = d != null && d === selected;
            return (
              <button
                key={i}
                disabled={d == null}
                onClick={() => setSelected(d)}
                className={`relative h-9 rounded-lg text-[12px] font-semibold transition-colors ${
                  d == null
                    ? ""
                    : isSel
                    ? "bg-primary text-primary-foreground"
                    : isToday
                    ? "bg-primary/15 text-primary"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                {d ?? ""}
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
          {selected ? `Events on ${selected} ${MONTHS[month]}` : `All events in ${MONTHS[month]}`}
        </h3>
      </div>
      <div className="space-y-2.5">
        {dayEvents.map((e, i) => (
          <motion.div
            key={`${e.date}-${e.title}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-3.5 flex items-center gap-3"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/12 flex flex-col items-center justify-center shrink-0">
              <p className="text-[10px] font-semibold text-primary leading-none">{MONTHS[e.month].slice(0, 3).toUpperCase()}</p>
              <p className="text-[16px] font-extrabold text-primary leading-none mt-0.5">{e.date}</p>
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-bold text-foreground">{e.title}</p>
              <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {e.time}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.venue}</span>
              </div>
            </div>
          </motion.div>
        ))}
        {dayEvents.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">No events scheduled.</div>
        )}
      </div>
    </div>
  );
}
