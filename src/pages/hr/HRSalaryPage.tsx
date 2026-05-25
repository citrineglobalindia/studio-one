import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet, ChevronLeft, ChevronRight, CalendarDays, Plus, Check,
  Loader2, Search, IndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { HRTabs } from "@/components/hr/HRTabs";
import { HRHero, RestrictedNotice } from "./HREmployeesPage";
import { useEmployees, useSalaries, monthKey, type DbSalary } from "@/hooks/useHR";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function monthLabel(d: Date) { return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }); }

export default function HRSalaryPage() {
  const { currentRole } = useRole();
  const canManage = currentRole === "admin" || currentRole === "accounts";
  const allowed = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts";

  const [date, setDate] = useState<Date>(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const month = monthKey(date);
  const monthName = monthLabel(date);
  const [search, setSearch] = useState("");

  const { employees, isLoading: empLoading } = useEmployees();
  const { salaries, isLoading: salLoading, upsert, update, markPaid } = useSalaries(month);

  const active = useMemo(() => employees.filter((e) => e.status !== "inactive"), [employees]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase(); if (!q) return active;
    return active.filter((e) => e.full_name.toLowerCase().includes(q));
  }, [active, search]);

  const totals = useMemo(() => {
    const gross = salaries.reduce((s, r) => s + Number(r.net_amount || 0), 0);
    const paid = salaries.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.net_amount || 0), 0);
    return { gross, paid, pending: gross - paid, count: salaries.length };
  }, [salaries]);

  const generateAll = async () => {
    if (!canManage) return;
    let created = 0;
    for (const e of active) {
      if (salaries.find((s) => s.employee_id === e.id)) continue;
      try {
        await upsert.mutateAsync({ employee_id: e.id, month, base_amount: Number(e.salary || 0), bonus_amount: 0, deductions: 0, status: "draft" });
        created++;
      } catch { /* toast handled */ }
    }
    if (created > 0) toast.success(`Generated ${created} salary record${created > 1 ? "s" : ""} for ${monthName}`);
    else toast.info("All salaries already generated for this month");
  };

  if (!allowed) return <RestrictedNotice />;

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <HRHero />
      <HRTabs />

      {/* Month picker + KPI */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate((p) => new Date(p.getFullYear(), p.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="px-3 py-1.5 rounded-lg border border-border bg-card flex items-center gap-2 text-sm font-medium min-w-[180px] justify-center"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />{monthName}</div>
          <Button variant="outline" size="icon" onClick={() => setDate((p) => new Date(p.getFullYear(), p.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        {canManage && <Button onClick={generateAll} className="gap-2" disabled={empLoading || salLoading}><Plus className="h-4 w-4" /> Generate for {monthName}</Button>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Records" value={String(totals.count)} icon={<CalendarDays className="h-4 w-4" />} color="text-primary bg-primary/10" />
        <Kpi label="Gross" value={inr(totals.gross)} icon={<IndianRupee className="h-4 w-4" />} color="text-foreground bg-muted" />
        <Kpi label="Paid" value={inr(totals.paid)} icon={<Check className="h-4 w-4" />} color="text-emerald-600 bg-emerald-500/10" />
        <Kpi label="Pending" value={inr(totals.pending)} icon={<Loader2 className="h-4 w-4" />} color="text-amber-600 bg-amber-500/10" />
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees…" className="pl-9 h-9" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Employee</th>
              <th className="text-right px-3 py-3 font-medium">Base</th>
              <th className="text-right px-3 py-3 font-medium">Bonus</th>
              <th className="text-right px-3 py-3 font-medium">Deductions</th>
              <th className="text-right px-3 py-3 font-medium">Net</th>
              <th className="text-center px-3 py-3 font-medium">Status</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {empLoading || salLoading ? (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No employees</td></tr>
            ) : filtered.map((e) => {
              const s = salaries.find((x) => x.employee_id === e.id);
              return (
                <SalaryRow key={e.id} employee={e} salary={s} month={month} canManage={canManage}
                  onUpsert={upsert.mutateAsync} onUpdate={update.mutateAsync} onMarkPaid={markPaid.mutate} />
              );
            })}
          </tbody>
        </table>
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

function SalaryRow({ employee, salary, month, canManage, onUpsert, onUpdate, onMarkPaid }: {
  employee: any; salary?: DbSalary; month: string; canManage: boolean;
  onUpsert: (p: any) => Promise<any>; onUpdate: (p: any) => Promise<any>; onMarkPaid: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [base, setBase] = useState(String(salary?.base_amount ?? employee.salary ?? 0));
  const [bonus, setBonus] = useState(String(salary?.bonus_amount ?? 0));
  const [ded, setDed] = useState(String(salary?.deductions ?? 0));
  const [saving, setSaving] = useState(false);
  const net = (Number(base) || 0) + (Number(bonus) || 0) - (Number(ded) || 0);
  const status = salary?.status ?? "—";
  const paid = status === "paid";

  const save = async () => {
    setSaving(true);
    try {
      if (salary) {
        await onUpdate({ id: salary.id, base_amount: Number(base) || 0, bonus_amount: Number(bonus) || 0, deductions: Number(ded) || 0 });
      } else {
        await onUpsert({ employee_id: employee.id, month, base_amount: Number(base) || 0, bonus_amount: Number(bonus) || 0, deductions: Number(ded) || 0, status: "draft" });
      }
      toast.success(`Saved ${employee.full_name}`);
      setEditing(false);
    } finally { setSaving(false); }
  };

  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="px-4 py-3"><div className="font-medium text-foreground">{employee.full_name}</div><div className="text-xs text-muted-foreground capitalize">{(employee.role || "—").replace(/_/g, " ")}</div></td>
      <td className="px-3 py-3 text-right tabular-nums">{editing ? <Input value={base} onChange={(e) => setBase(e.target.value)} className="h-8 text-right w-24 ml-auto" /> : inr(salary?.base_amount ?? Number(employee.salary || 0))}</td>
      <td className="px-3 py-3 text-right tabular-nums">{editing ? <Input value={bonus} onChange={(e) => setBonus(e.target.value)} className="h-8 text-right w-20 ml-auto" /> : inr(salary?.bonus_amount ?? 0)}</td>
      <td className="px-3 py-3 text-right tabular-nums text-rose-500">{editing ? <Input value={ded} onChange={(e) => setDed(e.target.value)} className="h-8 text-right w-20 ml-auto" /> : inr(salary?.deductions ?? 0)}</td>
      <td className="px-3 py-3 text-right tabular-nums font-semibold">{inr(editing ? net : (salary?.net_amount ?? 0))}</td>
      <td className="px-3 py-3 text-center"><Badge variant={paid ? "default" : "secondary"} className={paid ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : ""}>{status}</Badge></td>
      <td className="px-4 py-3 text-right">
        {!canManage ? <span className="text-[11px] text-muted-foreground">—</span> : editing ? (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving} className="gap-1">{saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
            {salary && !paid && <Button size="sm" variant="outline" className="gap-1" onClick={() => onMarkPaid(salary.id)}><Check className="h-3 w-3" /> Mark Paid</Button>}
          </div>
        )}
      </td>
    </tr>
  );
}
