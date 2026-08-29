import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, ChevronLeft, ChevronRight, CalendarDays, Clock, Layers, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EditorWorkLogPanel } from "@/components/calendar/EditorWorkLogPanel";
import { useWorkLogSummary } from "@/hooks/useEditorWorkLogs";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";

function todayIso() { return new Date().toISOString().slice(0, 10); }
function shift(iso: string, days: number) { const d = new Date(iso); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); }

export default function EditorLogsPage() {
  const { currentRole } = useRole();
  const { user } = useAuth();
  const canManage = currentRole === "admin" || currentRole === "administrator";
  const canSeeSummary = canManage || currentRole === "accounts";
  const allowed = canManage || currentRole === "accounts" || currentRole === "editor";
  const [date, setDate] = useState<string>(todayIso());

  const nice = new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Editor Logs is restricted</p>
        <p className="text-sm text-muted-foreground">Only Admin, Administrator, Accounts and Editors can view editor logs.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-violet-500/5 to-transparent" />
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-fuchsia-500/25 to-fuchsia-500/5 border border-fuchsia-500/30 flex items-center justify-center">
              <ClipboardList className="h-6 w-6 text-fuchsia-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Production</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Editor Logs</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{nice}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-9 w-9" title="Previous day" onClick={() => setDate(d => shift(d, -1))}><ChevronLeft className="h-4 w-4" /></Button>
            <div className="relative">
              <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value || todayIso())} className="h-9 pl-8 w-[150px] text-xs" />
            </div>
            <Button variant="outline" size="icon" className="h-9 w-9" title="Next day" onClick={() => setDate(d => shift(d, 1))}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => setDate(todayIso())}>Today</Button>
          </div>
        </div>
      </motion.div>

      {canSeeSummary && <HoursSummary date={date} />}

      <EditorWorkLogPanel dateIso={date} canManage={canManage} role={currentRole} userId={user?.id ?? null} />
    </div>
  );
}


// ---- Weekly / Monthly / Quarterly hours summary (Admin + HR) ----
function isoOf(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function rangeFor(period: "week" | "month" | "quarter", iso: string): [string, string] {
  const d = new Date(iso + "T00:00:00");
  if (period === "week") {
    const day = (d.getDay() + 6) % 7; // Monday = 0
    const mon = new Date(d); mon.setDate(d.getDate() - day);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return [isoOf(mon), isoOf(sun)];
  }
  if (period === "month") {
    return [isoOf(new Date(d.getFullYear(), d.getMonth(), 1)), isoOf(new Date(d.getFullYear(), d.getMonth() + 1, 0))];
  }
  const q = Math.floor(d.getMonth() / 3);
  return [isoOf(new Date(d.getFullYear(), q * 3, 1)), isoOf(new Date(d.getFullYear(), q * 3 + 3, 0))];
}

function HoursSummary({ date }: { date: string }) {
  const [period, setPeriod] = useState<"week" | "month" | "quarter">("month");
  const [from, to] = rangeFor(period, date);
  const { data: rows = [], isLoading } = useWorkLogSummary(from, to);
  const totalHours = rows.reduce((s, r) => s + r.hours, 0);
  const totalCount = rows.reduce((s, r) => s + r.work_count, 0);
  const totalEntries = rows.reduce((s, r) => s + r.entries, 0);
  const niceRange = `${new Date(from + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} – ${new Date(to + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 border-b border-border bg-muted/20">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-fuchsia-500/10 flex items-center justify-center"><Clock className="h-4 w-4 text-fuchsia-600" /></div>
          <div>
            <p className="text-sm font-semibold text-foreground tracking-tight">Editor hours summary</p>
            <p className="text-[10px] text-muted-foreground">{niceRange}</p>
          </div>
        </div>
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-muted/40 border border-border w-fit">
          {(["week", "month", "quarter"] as const).map((pr) => (
            <button key={pr} onClick={() => setPeriod(pr)} className={"px-2.5 py-1 rounded-md text-xs font-medium capitalize transition " + (period === pr ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
              {pr === "week" ? "Weekly" : pr === "month" ? "Monthly" : "Quarterly"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 p-3">
        <div className="rounded-xl border border-border bg-muted/10 px-3 py-2"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total hours</p><p className="text-lg font-bold text-foreground tabular-nums flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-fuchsia-500" />{totalHours}</p></div>
        <div className="rounded-xl border border-border bg-muted/10 px-3 py-2"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Work count</p><p className="text-lg font-bold text-foreground tabular-nums flex items-center gap-1"><Layers className="h-3.5 w-3.5 text-blue-500" />{totalCount}</p></div>
        <div className="rounded-xl border border-border bg-muted/10 px-3 py-2"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Entries</p><p className="text-lg font-bold text-foreground tabular-nums flex items-center gap-1"><Hash className="h-3.5 w-3.5 text-emerald-500" />{totalEntries}</p></div>
      </div>

      {isLoading ? (
        <div className="py-8 text-center text-xs text-muted-foreground">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="py-8 text-center text-xs text-muted-foreground">No editor logs in this period</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 font-semibold">Editor</th>
                <th className="text-right px-3 py-2 font-semibold">Hours</th>
                <th className="text-right px-3 py-2 font-semibold">Work count</th>
                <th className="text-right px-3 py-2 font-semibold">Entries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.editor_code} className="hover:bg-muted/20">
                  <td className="px-3 py-2 font-medium text-foreground">{r.editor_code}{r.editor_name ? <span className="text-[10px] text-muted-foreground font-normal"> · {r.editor_name}</span> : null}</td>
                  <td className="px-3 py-2 text-right tabular-nums font-semibold">{r.hours}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.work_count}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.entries}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
