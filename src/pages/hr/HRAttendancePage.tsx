import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, ChevronLeft, ChevronRight, CalendarDays, Loader2, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HRTabs } from "@/components/hr/HRTabs";
import { HRHero, RestrictedNotice } from "./HREmployeesPage";
import { useEmployees, useAttendance, type DbAttendance } from "@/hooks/useHR";
import { useRole } from "@/contexts/RoleContext";

const STATUS_CYCLE: Record<string, { next: string; label: string; bg: string }> = {
  "—":      { next: "present", label: "—", bg: "bg-muted text-muted-foreground" },
  present:  { next: "absent",  label: "P", bg: "bg-emerald-500 text-white" },
  absent:   { next: "half",    label: "A", bg: "bg-rose-500 text-white" },
  half:     { next: "leave",   label: "H", bg: "bg-amber-500 text-white" },
  leave:    { next: "—",       label: "L", bg: "bg-blue-500 text-white" },
};

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
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

  const { employees, isLoading: el } = useEmployees();
  const { records, isLoading: al, upsert } = useAttendance(fromIso, toIso);

  const lookup = useMemo(() => {
    const m = new Map<string, DbAttendance>();
    for (const r of records) m.set(r.employee_id + ":" + r.date, r);
    return m;
  }, [records]);

  const active = useMemo(() => employees.filter((e) => e.status !== "inactive"), [employees]);

  const cycleStatus = (employeeId: string, day: number, current: string) => {
    if (!canManage) return;
    const dateStr = isoDate(y, m, day);
    const nextStatus = STATUS_CYCLE[current]?.next ?? "present";
    // "—" means clear
    if (nextStatus === "—") {
      // delete by passing null status — we treat upsert with status = null; or just upsert with "absent" cycle around
      // Simpler: cycle through 4 states, never clear. Reset to present after leave.
      upsert.mutate({ employee_id: employeeId, date: dateStr, status: "present" });
    } else {
      upsert.mutate({ employee_id: employeeId, date: dateStr, status: nextStatus });
    }
  };

  if (!allowed) return <RestrictedNotice />;

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <HRHero />
      <HRTabs />

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="px-3 py-1.5 rounded-lg border border-border bg-card flex items-center gap-2 text-sm font-medium min-w-[180px] justify-center"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{monthName}</div>
          <Button variant="outline" size="icon" onClick={() => setDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Legend dot="bg-emerald-500" label="Present" />
          <Legend dot="bg-rose-500" label="Absent" />
          <Legend dot="bg-amber-500" label="Half day" />
          <Legend dot="bg-blue-500" label="On leave" />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-x-auto">
        {el || al ? (
          <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
        ) : active.length === 0 ? (
          <div className="py-12 text-center"><CalendarCheck className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No active employees</p></div>
        ) : (
          <table className="text-xs">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-3 font-medium sticky left-0 bg-muted/40 z-10">Employee</th>
                {Array.from({ length: dim }, (_, i) => i + 1).map((d) => (
                  <th key={d} className="px-1 py-3 font-medium text-center min-w-[28px]">{d}</th>
                ))}
                <th className="px-3 py-3 font-medium text-right">P</th>
                <th className="px-3 py-3 font-medium text-right">A</th>
              </tr>
            </thead>
            <tbody>
              {active.map((e) => {
                let presentCount = 0, absentCount = 0;
                for (let day = 1; day <= dim; day++) {
                  const r = lookup.get(e.id + ":" + isoDate(y, m, day));
                  if (r?.status === "present" || r?.status === "half") presentCount++;
                  if (r?.status === "absent") absentCount++;
                }
                return (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium text-foreground sticky left-0 bg-card z-10 whitespace-nowrap">{e.full_name}</td>
                    {Array.from({ length: dim }, (_, i) => i + 1).map((day) => {
                      const r = lookup.get(e.id + ":" + isoDate(y, m, day));
                      const status = r?.status || "—";
                      const meta = STATUS_CYCLE[status] || STATUS_CYCLE["—"];
                      return (
                        <td key={day} className="px-0.5 py-1 text-center">
                          <button
                            type="button"
                            disabled={!canManage}
                            onClick={() => cycleStatus(e.id, day, status)}
                            className={"h-6 w-6 rounded text-[10px] font-bold transition hover:scale-110 " + meta.bg + (!canManage ? " cursor-not-allowed opacity-70" : "")}
                            title={`Day ${day} — ${status}${canManage ? " (click to cycle)" : ""}`}
                          >
                            {meta.label}
                          </button>
                        </td>
                      );
                    })}
                    <td className="px-3 py-2 text-right tabular-nums text-emerald-600 font-medium">{presentCount}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-rose-600 font-medium">{absentCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {canManage && <p className="text-[11px] text-muted-foreground">Click any cell to cycle: Present → Absent → Half → Leave → back to Present</p>}
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return <span className="inline-flex items-center gap-1"><span className={"h-2 w-2 rounded-full " + dot} />{label}</span>;
}
