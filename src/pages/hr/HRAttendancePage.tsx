import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck, ChevronLeft, ChevronRight, CalendarDays, Loader2,
  TrendingUp, Search, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HRTabs } from "@/components/hr/HRTabs";
import { HRHero, RestrictedNotice } from "./HREmployeesPage";
import { useEmployees, useAttendance, type DbAttendance } from "@/hooks/useHR";
import { useRole } from "@/contexts/RoleContext";

const STATUS_CYCLE: Record<string, { next: string; label: string; bg: string }> = {
  "—":     { next: "present", label: "—", bg: "bg-muted text-muted-foreground" },
  present: { next: "absent",  label: "P", bg: "bg-emerald-500 text-white" },
  absent:  { next: "half",    label: "A", bg: "bg-rose-500 text-white" },
  half:    { next: "leave",   label: "H", bg: "bg-amber-500 text-white" },
  leave:   { next: "present", label: "L", bg: "bg-blue-500 text-white" },
};

const WEEKDAY_SHORT = ["S", "M", "T", "W", "T", "F", "S"];

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function isWeekend(date: Date) { const d = date.getDay(); return d === 0 || d === 6; }

function initials(n: string) {
  return (n || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

export default function HRAttendancePage() {
  const { currentRole } = useRole();
  const canManage = currentRole === "admin" || currentRole === "administrator";
  const allowed = canManage || currentRole === "accounts";

  const [date, setDate] = useState<Date>(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const y = date.getFullYear(), m = date.getMonth();
  const dim = daysInMonth(y, m);
  const fromIso = isoDate(y, m, 1);
  const toIso = isoDate(y, m, dim);
  const monthName = date.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const todayIso = isoDate(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const [search, setSearch] = useState("");

  const { employees, isLoading: el } = useEmployees();
  const { records, isLoading: al, upsert } = useAttendance(fromIso, toIso);

  const lookup = useMemo(() => {
    const m = new Map<string, DbAttendance>();
    for (const r of records) m.set(r.employee_id + ":" + r.date, r);
    return m;
  }, [records]);

  const active = useMemo(() => employees.filter((e) => e.status !== "inactive"), [employees]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return active;
    return active.filter((e) => [e.full_name, e.role, e.department].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [active, search]);

  // Per-employee counters
  const stats = useMemo(() => {
    const map = new Map<string, { present: number; absent: number; half: number; leave: number; workingDays: number; pct: number }>();
    for (const e of active) {
      let present = 0, absent = 0, half = 0, leave = 0, workingDays = 0;
      for (let day = 1; day <= dim; day++) {
        const dStr = isoDate(y, m, day);
        const dObj = new Date(y, m, day);
        if (!isWeekend(dObj)) workingDays++;
        const r = lookup.get(e.id + ":" + dStr);
        if (r?.status === "present") present++;
        else if (r?.status === "half") { half++; present += 0.5; absent += 0.5; }
        else if (r?.status === "absent") absent++;
        else if (r?.status === "leave") leave++;
      }
      const pct = workingDays > 0 ? Math.round((present / workingDays) * 100) : 0;
      map.set(e.id, { present, absent, half, leave, workingDays, pct });
    }
    return map;
  }, [active, lookup, dim, y, m]);

  // Overall org totals
  const overall = useMemo(() => {
    let p = 0, a = 0, l = 0, h = 0, total = 0;
    for (const s of stats.values()) { p += s.present; a += s.absent; l += s.leave; h += s.half; total += s.workingDays; }
    const totalWorking = total * 1; // total = sum of working days across active employees
    const pct = totalWorking > 0 ? Math.round((p / totalWorking) * 100) : 0;
    return { present: p, absent: a, leave: l, half: h, totalWorking, pct };
  }, [stats]);

  const cycleStatus = (employeeId: string, day: number, current: string) => {
    if (!canManage) return;
    const dateStr = isoDate(y, m, day);
    const nextStatus = STATUS_CYCLE[current]?.next ?? "present";
    upsert.mutate({ employee_id: employeeId, date: dateStr, status: nextStatus });
  };

  if (!allowed) return <RestrictedNotice />;

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <HRHero />
      <HRTabs />

      {/* Month picker */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="px-3 py-1.5 rounded-lg border border-border bg-card flex items-center gap-2 text-sm font-medium min-w-[180px] justify-center"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{monthName}</div>
          <Button variant="outline" size="icon" onClick={() => setDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" onClick={() => { const n = new Date(); setDate(new Date(n.getFullYear(), n.getMonth(), 1)); }} className="text-xs">Today</Button>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee…" className="pl-9 h-9" />
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Employees" value={String(active.length)} icon={<Users className="h-3.5 w-3.5" />} color="text-primary bg-primary/10" />
        <Kpi label="Present-days" value={String(overall.present)} icon={<div className="h-2 w-2 rounded-full bg-emerald-500" />} color="text-emerald-700 bg-emerald-500/10" />
        <Kpi label="Absent-days" value={String(overall.absent)} icon={<div className="h-2 w-2 rounded-full bg-rose-500" />} color="text-rose-700 bg-rose-500/10" />
        <Kpi label="On-leave days" value={String(overall.leave)} icon={<div className="h-2 w-2 rounded-full bg-blue-500" />} color="text-blue-700 bg-blue-500/10" />
        <Kpi label="Overall %" value={overall.pct + "%"} icon={<TrendingUp className="h-3.5 w-3.5" />} color={overall.pct >= 80 ? "text-emerald-700 bg-emerald-500/10" : overall.pct >= 50 ? "text-amber-700 bg-amber-500/10" : "text-rose-700 bg-rose-500/10"} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
        <Legend dot="bg-emerald-500" label="Present (P)" />
        <Legend dot="bg-rose-500" label="Absent (A)" />
        <Legend dot="bg-amber-500" label="Half day (H)" />
        <Legend dot="bg-blue-500" label="On leave (L)" />
        <Legend dot="bg-muted-foreground/30" label="Not marked (—)" />
        {canManage && <span className="ml-auto italic">Click any cell to cycle states</span>}
      </div>

      {/* Grid */}
      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        {el || al ? (
          <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center"><CalendarCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No employees match</p></div>
        ) : (
          <table className="text-xs min-w-full">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-medium sticky left-0 bg-muted/40 z-10 min-w-[200px]">Employee</th>
                {Array.from({ length: dim }, (_, i) => i + 1).map((d) => {
                  const dObj = new Date(y, m, d);
                  const dStr = isoDate(y, m, d);
                  const weekend = isWeekend(dObj);
                  const isToday = dStr === todayIso;
                  return (
                    <th key={d} className={"px-1 py-1.5 font-medium text-center min-w-[28px] " + (weekend ? "bg-muted/60" : "") + (isToday ? " ring-1 ring-primary/40 ring-inset" : "")}>
                      <div className="flex flex-col items-center leading-tight">
                        <span className={"text-[9px] " + (weekend ? "text-rose-500" : "opacity-60")}>{WEEKDAY_SHORT[dObj.getDay()]}</span>
                        <span className={"text-[11px] font-semibold " + (isToday ? "text-primary" : "text-foreground")}>{d}</span>
                      </div>
                    </th>
                  );
                })}
                <th className="px-3 py-2 font-medium text-center bg-emerald-500/10 text-emerald-700">P</th>
                <th className="px-3 py-2 font-medium text-center bg-rose-500/10 text-rose-700">A</th>
                <th className="px-3 py-2 font-medium text-center bg-amber-500/10 text-amber-700">H</th>
                <th className="px-3 py-2 font-medium text-center bg-blue-500/10 text-blue-700">L</th>
                <th className="px-3 py-2 font-medium text-center bg-card">%</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, idx) => {
                const s = stats.get(e.id) || { present: 0, absent: 0, half: 0, leave: 0, workingDays: 0, pct: 0 };
                return (
                  <motion.tr key={e.id}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}
                    className="border-t border-border hover:bg-muted/30">
                    {/* Employee name + avatar (sticky) */}
                    <td className="px-3 py-2 sticky left-0 bg-card z-10 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{initials(e.full_name)}</div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">{e.full_name}</p>
                          <p className="text-[10px] text-muted-foreground capitalize truncate">{(e.role || "—").replace(/_/g, " ")}</p>
                        </div>
                      </div>
                    </td>

                    {/* Per-day cells */}
                    {Array.from({ length: dim }, (_, i) => i + 1).map((day) => {
                      const dObj = new Date(y, m, day);
                      const dStr = isoDate(y, m, day);
                      const weekend = isWeekend(dObj);
                      const isToday = dStr === todayIso;
                      const r = lookup.get(e.id + ":" + dStr);
                      const status = r?.status || "—";
                      const meta = STATUS_CYCLE[status] || STATUS_CYCLE["—"];
                      return (
                        <td key={day} className={"px-0.5 py-1 text-center " + (weekend ? "bg-muted/30" : "") + (isToday ? " ring-1 ring-primary/30 ring-inset" : "")}>
                          <button
                            type="button"
                            disabled={!canManage}
                            onClick={() => cycleStatus(e.id, day, status)}
                            className={"h-6 w-6 rounded text-[10px] font-bold transition hover:scale-110 " + meta.bg + (!canManage ? " cursor-not-allowed opacity-70" : "")}
                            title={`${e.full_name} — ${dObj.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })} — ${status}`}
                          >
                            {meta.label}
                          </button>
                        </td>
                      );
                    })}

                    {/* Totals */}
                    <td className="px-3 py-2 text-center tabular-nums font-semibold text-emerald-600">{s.present}</td>
                    <td className="px-3 py-2 text-center tabular-nums font-semibold text-rose-600">{s.absent}</td>
                    <td className="px-3 py-2 text-center tabular-nums font-semibold text-amber-600">{s.half}</td>
                    <td className="px-3 py-2 text-center tabular-nums font-semibold text-blue-600">{s.leave}</td>
                    <td className="px-3 py-2 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className={"text-[11px] font-semibold tabular-nums " + (s.pct >= 80 ? "text-emerald-600" : s.pct >= 50 ? "text-amber-600" : "text-rose-600")}>{s.pct}%</span>
                        <div className="h-1 w-12 rounded-full bg-muted overflow-hidden">
                          <div className={"h-full rounded-full " + (s.pct >= 80 ? "bg-emerald-500" : s.pct >= 50 ? "bg-amber-500" : "bg-rose-500")} style={{ width: `${s.pct}%` }} />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className={"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium " + color}>{icon}{label}</div>
      <p className="mt-2 text-base font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
function Legend({ dot, label }: { dot: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={"h-2 w-2 rounded-full " + dot} />{label}</span>;
}
