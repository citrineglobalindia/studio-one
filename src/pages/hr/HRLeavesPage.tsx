import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Palmtree, Plus, Check, X, Loader2, Search, Trash2, CalendarRange, BadgeCheck, Clock, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HRTabs } from "@/components/hr/HRTabs";
import { HRHero, RestrictedNotice } from "./HREmployeesPage";
import { useEmployees, useLeaves, type DbLeave } from "@/hooks/useHR";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";

const LEAVE_TYPES = ["Casual", "Sick", "Earned", "Compensatory", "Maternity", "Paternity", "Unpaid", "Other"];
const TYPE_TONE: Record<string, string> = {
  Casual: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  Sick: "bg-rose-500/10 text-rose-700 border-rose-500/30",
  Earned: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  Compensatory: "bg-violet-500/10 text-violet-700 border-violet-500/30",
  Maternity: "bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/30",
  Paternity: "bg-cyan-500/10 text-cyan-700 border-cyan-500/30",
  Unpaid: "bg-slate-500/10 text-slate-700 border-slate-500/30",
  Other: "bg-amber-500/10 text-amber-700 border-amber-500/30",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}

const STATUS_COLOR: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  Approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  Rejected: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  Cancelled: "bg-slate-500/10 text-slate-600 border-slate-500/30",
};

export default function HRLeavesPage() {
  const { currentRole } = useRole();
  const { user } = useAuth();
  const canApprove = currentRole === "admin" || currentRole === "administrator";
  // Anyone can view their own leaves now (incl. ops, vendors, sales)
  const allowed = true;
  const { employees } = useEmployees();
  const { leaves, isLoading, add, approve, reject, remove } = useLeaves();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "Pending" | "Approved" | "Rejected">("all");
  const [adding, setAdding] = useState(false);

  // Identify the current user's employee row by email
  const myEmployee = useMemo(() => {
    const e = (employees as any[]).find(e => e.email && user?.email && e.email.toLowerCase() === user.email!.toLowerCase());
    return e || null;
  }, [employees, user?.email]);

  // For non-managers we only show their own leaves
  const isManager = canApprove || currentRole === "accounts";
  const scopedLeaves = useMemo(() => {
    if (isManager) return leaves;
    if (!myEmployee) return [];
    return (leaves as DbLeave[]).filter(l => l.employee_id === myEmployee.id);
  }, [leaves, isManager, myEmployee]);

  const filtered = useMemo(() => {
    let list = scopedLeaves;
    if (filter !== "all") list = list.filter((l) => (l.status || "Pending") === filter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((l) => [l.employee_name, l.leave_type, l.reason].filter(Boolean).join(" ").toLowerCase().includes(q));
    return list;
  }, [scopedLeaves, filter, search]);

  // Leave balance (this year so far, approved only, by type)
  const balance = useMemo(() => {
    const year = new Date().getFullYear().toString();
    const usedByType: Record<string, number> = {};
    for (const l of scopedLeaves as DbLeave[]) {
      if (l.status === "Approved" && String(l.from_date || "").startsWith(year)) {
        const t = l.leave_type || "Other";
        usedByType[t] = (usedByType[t] || 0) + Number(l.days || 0);
      }
    }
    const totalUsed = Object.values(usedByType).reduce((s, n) => s + n, 0);
    return { usedByType, totalUsed };
  }, [scopedLeaves]);

  if (!allowed) return <RestrictedNotice />;

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <HRHero />
      <HRTabs />

      {/* Self-service summary for non-managers */}
      {!isManager && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <BalanceCard label="Used this year" value={String(balance.totalUsed)} subtitle="days approved" color="emerald" icon={BadgeCheck} />
          <BalanceCard label="Pending" value={String(scopedLeaves.filter(l => l.status === "Pending").length)} subtitle="awaiting decision" color="amber" icon={Clock} />
          <BalanceCard label="Approved" value={String(scopedLeaves.filter(l => l.status === "Approved").length)} subtitle="all-time" color="blue" icon={CalendarRange} />
          <BalanceCard label="Total requests" value={String(scopedLeaves.length)} subtitle="history" color="violet" icon={History} />
        </motion.div>
      )}

      {/* Filter + apply */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit">
          {(["all", "Pending", "Approved", "Rejected"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={"px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition " + (filter === k ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>{k}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search type, reason…" className="pl-9 h-9" />
          </div>
          {(isManager || myEmployee) && (
            <Button onClick={() => setAdding(true)} className="gap-2 h-9"><Plus className="h-4 w-4" /> Apply leave</Button>
          )}
        </div>
      </div>

      {/* Type balance chips for self-service */}
      {!isManager && Object.keys(balance.usedByType).length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">By type:</span>
          {Object.entries(balance.usedByType).map(([t, n]) => (
            <Badge key={t} variant="outline" className={"text-[10px] " + (TYPE_TONE[t] || "")}>{t}: {n}d</Badge>
          ))}
        </div>
      )}

      {/* List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center"><Palmtree className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No leave records</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr>
              {isManager && <th className="text-left px-4 py-3 font-medium">Employee</th>}
              <th className="text-left px-3 py-3 font-medium">Type</th>
              <th className="text-left px-3 py-3 font-medium">Period</th>
              <th className="text-center px-3 py-3 font-medium">Days</th>
              <th className="text-left px-3 py-3 font-medium">Reason</th>
              <th className="text-center px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/30 align-middle">
                  {isManager && <td className="px-4 py-3 font-medium text-foreground">{l.employee_name || (employees as any[]).find((e) => e.id === l.employee_id)?.full_name || "—"}</td>}
                  <td className="px-3 py-3"><Badge variant="outline" className={"text-[10px] " + (TYPE_TONE[l.leave_type || "Other"] || "")}>{l.leave_type || "—"}</Badge></td>
                  <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums">{fmtDate(l.from_date)} → {fmtDate(l.to_date)}</td>
                  <td className="px-3 py-3 text-center font-semibold tabular-nums">{l.days}</td>
                  <td className="px-3 py-3 text-xs max-w-[280px] truncate">{l.reason || "—"}</td>
                  <td className="px-3 py-3 text-center"><Badge variant="outline" className={"text-[10px] capitalize " + (STATUS_COLOR[String(l.status || "Pending")] || STATUS_COLOR.Pending)}>{l.status || "Pending"}</Badge></td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {canApprove && l.status === "Pending" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => approve.mutate({ id: l.id })}><Check className="h-3 w-3" /> Approve</Button>
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => { const notes = window.prompt("Reason for rejection (optional)") ?? undefined; reject.mutate({ id: l.id, notes }); }}><X className="h-3 w-3" /> Reject</Button>
                        </>
                      )}
                      {!isManager && l.status === "Pending" && l.employee_id === myEmployee?.id && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-rose-500" onClick={() => { if (window.confirm("Cancel this request?")) remove.mutate(l.id); }}>
                          <X className="h-3 w-3" /> Cancel
                        </Button>
                      )}
                      {canApprove && (
                        <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-500" onClick={() => { if (window.confirm("Delete this leave?")) remove.mutate(l.id); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>

      <ApplyLeaveDialog open={adding} onOpenChange={() => setAdding(false)}
        employees={employees}
        myEmployee={myEmployee}
        isManager={isManager}
        onSubmit={async (p) => await add.mutateAsync(p as any)}
      />
    </div>
  );
}

function BalanceCard({ label, value, subtitle, color, icon: Icon }: { label: string; value: string; subtitle: string; color: string; icon: any }) {
  const tone: Record<string, string> = {
    emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
    amber:   "bg-amber-500/10 text-amber-700 border-amber-500/30",
    blue:    "bg-blue-500/10 text-blue-700 border-blue-500/30",
    violet:  "bg-violet-500/10 text-violet-700 border-violet-500/30",
  };
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border " + (tone[color] || "")}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-2 text-xl font-bold text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function ApplyLeaveDialog({ open, onOpenChange, employees, myEmployee, isManager, onSubmit }: { open: boolean; onOpenChange: () => void; employees: any[]; myEmployee: any | null; isManager: boolean; onSubmit: (p: Partial<DbLeave>) => Promise<void>; }) {
  const [form, setForm] = useState({
    employee_id: !isManager && myEmployee ? myEmployee.id : "",
    leave_type: LEAVE_TYPES[0],
    from_date: "",
    to_date: "",
    reason: "",
  });
  const [saving, setSaving] = useState(false);
  const days = useMemo(() => {
    if (!form.from_date || !form.to_date) return 0;
    const a = new Date(form.from_date).getTime(), b = new Date(form.to_date).getTime();
    if (b < a) return 0;
    return Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1;
  }, [form.from_date, form.to_date]);

  const save = async () => {
    if (!form.employee_id || !form.from_date || !form.to_date) return;
    if (new Date(form.to_date) < new Date(form.from_date)) return;
    setSaving(true);
    try {
      const emp = (employees as any[]).find((e) => e.id === form.employee_id);
      await onSubmit({
        employee_id: form.employee_id,
        employee_name: emp?.full_name || null,
        leave_type: form.leave_type,
        from_date: form.from_date,
        to_date: form.to_date,
        days,
        reason: form.reason.trim() || null,
      } as any);
      onOpenChange();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Palmtree className="h-5 w-5 text-teal-500" /> Apply leave</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {isManager ? (
            <Field label="Employee">
              <Select value={form.employee_id} onValueChange={(v) => setForm((p) => ({ ...p, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Pick an employee" /></SelectTrigger>
                <SelectContent>{(employees as any[]).map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          ) : (
            <Field label="Employee">
              <div className="h-9 rounded-md border border-border bg-muted/40 flex items-center px-3 text-sm font-medium">{myEmployee?.full_name || "—"}</div>
            </Field>
          )}

          {/* Leave type chips */}
          <Field label="Leave type">
            <div className="flex flex-wrap gap-1.5">
              {LEAVE_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, leave_type: t }))}
                  className={"px-2.5 py-1 rounded-full text-[11px] font-medium border transition " + (form.leave_type === t ? (TYPE_TONE[t] || "") + " ring-2 ring-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40")}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="From"><Input type="date" value={form.from_date} onChange={(e) => setForm((p) => ({ ...p, from_date: e.target.value }))} /></Field>
            <Field label="To"><Input type="date" value={form.to_date} onChange={(e) => setForm((p) => ({ ...p, to_date: e.target.value }))} min={form.from_date} /></Field>
          </div>

          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Total days</span>
            <span className="text-base font-bold tabular-nums">{days || "—"}</span>
          </div>

          <Field label="Reason (optional)">
            <Textarea rows={2} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="A short note for your manager" />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onOpenChange} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.employee_id || !form.from_date || !form.to_date || days === 0} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
