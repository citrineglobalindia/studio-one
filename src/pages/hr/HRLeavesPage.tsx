import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Palmtree, Plus, Check, X, Loader2, Search, Trash2, Calendar } from "lucide-react";
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

const LEAVE_TYPES = ["Casual", "Sick", "Earned", "Compensatory", "Maternity", "Paternity", "Unpaid", "Other"];

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

export default function HRLeavesPage() {
  const { currentRole } = useRole();
  const canApprove = currentRole === "admin" || currentRole === "administrator";
  const allowed = canApprove || currentRole === "accounts";
  const { employees } = useEmployees();
  const { leaves, isLoading, add, approve, reject, remove } = useLeaves();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [adding, setAdding] = useState(false);

  const filtered = useMemo(() => {
    let list = leaves;
    if (filter !== "all") list = list.filter((l) => l.status === filter);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((l) => [l.employee_name, l.leave_type, l.reason].filter(Boolean).join(" ").toLowerCase().includes(q));
    return list;
  }, [leaves, filter, search]);

  if (!allowed) return <RestrictedNotice />;

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <HRHero />
      <HRTabs />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit">
          {(["all", "pending", "approved", "rejected"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)} className={"px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition " + (filter === k ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>{k}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…" className="pl-9 h-9" />
          </div>
          <Button onClick={() => setAdding(true)} className="gap-2 h-9"><Plus className="h-4 w-4" /> Apply leave</Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center"><Palmtree className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No leaves found</p></div>
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr>
              <th className="text-left px-4 py-3 font-medium">Employee</th>
              <th className="text-left px-3 py-3 font-medium">Type</th>
              <th className="text-left px-3 py-3 font-medium">Period</th>
              <th className="text-center px-3 py-3 font-medium">Days</th>
              <th className="text-left px-3 py-3 font-medium">Reason</th>
              <th className="text-center px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3"></th>
            </tr></thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{l.employee_name || employees.find((e) => e.id === l.employee_id)?.full_name || "—"}</td>
                  <td className="px-3 py-3"><Badge variant="secondary" className="text-[10px]">{l.leave_type || "—"}</Badge></td>
                  <td className="px-3 py-3 text-muted-foreground">{fmtDate(l.from_date)} → {fmtDate(l.to_date)}</td>
                  <td className="px-3 py-3 text-center font-semibold tabular-nums">{l.days}</td>
                  <td className="px-3 py-3 max-w-[280px] truncate">{l.reason || "—"}</td>
                  <td className="px-3 py-3 text-center"><Badge variant="outline" className={"text-[10px] capitalize " + (STATUS_COLOR[String(l.status || "pending")] || STATUS_COLOR.pending)}>{l.status || "pending"}</Badge></td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex gap-1">
                      {canApprove && l.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => approve.mutate({ id: l.id })}><Check className="h-3 w-3" /> Approve</Button>
                          <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => { const notes = window.prompt("Reason for rejection (optional)") ?? undefined; reject.mutate({ id: l.id, notes }); }}><X className="h-3 w-3" /> Reject</Button>
                        </>
                      )}
                      {canApprove && <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-500" onClick={() => { if (window.confirm("Delete this leave?")) remove.mutate(l.id); }}><Trash2 className="h-3 w-3" /></Button>}
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
        onSubmit={async (p) => await add.mutateAsync(p)}
      />
    </div>
  );
}

function ApplyLeaveDialog({ open, onOpenChange, employees, onSubmit }: { open: boolean; onOpenChange: () => void; employees: any[]; onSubmit: (p: Partial<DbLeave>) => Promise<void>; }) {
  const [form, setForm] = useState({ employee_id: "", leave_type: LEAVE_TYPES[0], from_date: "", to_date: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const days = useMemo(() => {
    if (!form.from_date || !form.to_date) return 0;
    const a = new Date(form.from_date).getTime(), b = new Date(form.to_date).getTime();
    if (b < a) return 0;
    return Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1;
  }, [form.from_date, form.to_date]);

  const save = async () => {
    if (!form.employee_id || !form.from_date || !form.to_date) return;
    setSaving(true);
    try {
      const emp = employees.find((e) => e.id === form.employee_id);
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
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Palmtree className="h-5 w-5 text-teal-500" /> Apply leave</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Employee</Label>
            <Select value={form.employee_id} onValueChange={(v) => setForm((p) => ({ ...p, employee_id: v }))}>
              <SelectTrigger><SelectValue placeholder="Pick an employee" /></SelectTrigger>
              <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Type</Label>
              <Select value={form.leave_type} onValueChange={(v) => setForm((p) => ({ ...p, leave_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAVE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Days</Label>
              <div className="h-9 rounded-md border border-border bg-muted/40 flex items-center px-3 text-sm font-semibold tabular-nums">{days || "—"}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">From</Label><Input type="date" value={form.from_date} onChange={(e) => setForm((p) => ({ ...p, from_date: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">To</Label><Input type="date" value={form.to_date} onChange={(e) => setForm((p) => ({ ...p, to_date: e.target.value }))} /></div>
          </div>
          <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Reason</Label><Textarea rows={2} value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Why are you taking this leave?" /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onOpenChange} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.employee_id || !form.from_date || !form.to_date} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
