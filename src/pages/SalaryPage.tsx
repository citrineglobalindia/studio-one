import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet, CalendarDays, ChevronLeft, ChevronRight, Plus, Check,
  Loader2, IndianRupee, Search, Sparkles, FileDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useEmployees } from "@/hooks/useEmployees";
import { useSalaries, monthKey, type DbSalary } from "@/hooks/useSalaries";
import { toast } from "sonner";

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);
}

function monthLabel(monthIso: string) {
  const d = new Date(monthIso);
  return d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

export default function SalaryPage() {
  const [monthDate, setMonthDate] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const month = monthKey(monthDate);
  const [search, setSearch] = useState("");

  const { employees, isLoading: empLoading } = useEmployees();
  const { salaries, isLoading: salLoading, upsertSalary, updateSalary, markPaid, deleteSalary } = useSalaries(month);

  const activeEmployees = useMemo(
    () => employees.filter((e: any) => e.status !== "inactive"),
    [employees]
  );

  // Merge employees with their salary row for this month
  const rows = useMemo(() => {
    return activeEmployees
      .filter((e: any) => !search || e.full_name?.toLowerCase().includes(search.toLowerCase()))
      .map((e: any) => {
        const s = salaries.find((s) => s.employee_id === e.id);
        return {
          employee: e,
          salary: s,
        };
      });
  }, [activeEmployees, salaries, search]);

  const totals = useMemo(() => {
    const t = { count: 0, gross: 0, paid: 0, pending: 0 };
    salaries.forEach((s) => {
      t.count++;
      t.gross += Number(s.net_amount || 0);
      if (s.status === "paid") t.paid += Number(s.net_amount || 0);
      else t.pending += Number(s.net_amount || 0);
    });
    return t;
  }, [salaries]);

  const generateAll = async () => {
    let created = 0, skipped = 0;
    for (const e of activeEmployees) {
      if (salaries.find((s) => s.employee_id === e.id)) {
        skipped++;
        continue;
      }
      try {
        await upsertSalary.mutateAsync({
          employee_id: e.id,
          month,
          base_amount: Number(e.salary || 0),
          bonus_amount: 0,
          deductions: 0,
          status: "draft",
        });
        created++;
      } catch (err) {
        console.error(err);
      }
    }
    if (created > 0) toast.success(`Created ${created} salary record(s)${skipped ? `, ${skipped} already existed` : ""}`);
    else toast.info("All salaries already created for this month");
  };

  const shiftMonth = (n: number) =>
    setMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + n, 1));

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      {/* ── HEADER ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <Wallet className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Salary</h1>
            <p className="text-xs text-muted-foreground">Generate, approve and pay monthly salaries</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-3 py-1.5 rounded-lg border border-border bg-card flex items-center gap-2 text-sm font-medium">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" /> {monthLabel(month)}
          </div>
          <Button variant="outline" size="icon" onClick={() => shiftMonth(1)} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* ── SUMMARY CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryCard label="Records" value={String(totals.count)} icon={<Sparkles className="h-4 w-4" />} color="text-primary" />
        <SummaryCard label="Gross" value={inr(totals.gross)} icon={<IndianRupee className="h-4 w-4" />} color="text-foreground" />
        <SummaryCard label="Paid" value={inr(totals.paid)} icon={<Check className="h-4 w-4" />} color="text-emerald-500" />
        <SummaryCard label="Pending" value={inr(totals.pending)} icon={<Loader2 className="h-4 w-4" />} color="text-amber-500" />
      </div>

      {/* ── ACTIONS ── */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employees…" className="pl-9" />
        </div>
        <Button onClick={generateAll} className="gap-2" disabled={empLoading || salLoading}>
          <Plus className="h-4 w-4" /> Generate for {monthLabel(month)}
        </Button>
      </div>

      {/* ── TABLE ── */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
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
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">No employees</td></tr>
              ) : rows.map(({ employee, salary }) => (
                <SalaryRow
                  key={employee.id}
                  employee={employee}
                  salary={salary}
                  month={month}
                  onUpsert={upsertSalary.mutateAsync}
                  onUpdate={updateSalary.mutateAsync}
                  onMarkPaid={markPaid.mutate}
                  onDelete={deleteSalary.mutate}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className={`flex items-center gap-2 text-xs font-medium ${color}`}>{icon}{label}</div>
      <p className="text-lg font-bold text-foreground mt-1 tabular-nums">{value}</p>
    </div>
  );
}

function SalaryRow({
  employee, salary, month, onUpsert, onUpdate, onMarkPaid, onDelete,
}: {
  employee: any;
  salary?: DbSalary;
  month: string;
  onUpsert: (p: any) => Promise<any>;
  onUpdate: (p: any) => Promise<any>;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [base, setBase] = useState<string>(String(salary?.base_amount ?? employee.salary ?? 0));
  const [bonus, setBonus] = useState<string>(String(salary?.bonus_amount ?? 0));
  const [ded, setDed] = useState<string>(String(salary?.deductions ?? 0));
  const [saving, setSaving] = useState(false);

  const net = (Number(base) || 0) + (Number(bonus) || 0) - (Number(ded) || 0);
  const status = salary?.status ?? "—";
  const paid = status === "paid";

  const save = async () => {
    setSaving(true);
    try {
      if (salary) {
        await onUpdate({
          id: salary.id,
          base_amount: Number(base) || 0,
          bonus_amount: Number(bonus) || 0,
          deductions: Number(ded) || 0,
        });
      } else {
        await onUpsert({
          employee_id: employee.id,
          month,
          base_amount: Number(base) || 0,
          bonus_amount: Number(bonus) || 0,
          deductions: Number(ded) || 0,
          status: "draft",
        });
      }
      toast.success(`Saved ${employee.full_name}`);
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <tr className="border-t border-border hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{employee.full_name}</div>
        <div className="text-xs text-muted-foreground">{employee.role || "—"}</div>
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        {editing ? <Input value={base} onChange={(e) => setBase(e.target.value)} className="h-8 text-right w-24 ml-auto" /> : inr(salary?.base_amount ?? Number(employee.salary || 0))}
      </td>
      <td className="px-3 py-3 text-right tabular-nums">
        {editing ? <Input value={bonus} onChange={(e) => setBonus(e.target.value)} className="h-8 text-right w-20 ml-auto" /> : inr(salary?.bonus_amount ?? 0)}
      </td>
      <td className="px-3 py-3 text-right tabular-nums text-rose-500">
        {editing ? <Input value={ded} onChange={(e) => setDed(e.target.value)} className="h-8 text-right w-20 ml-auto" /> : inr(salary?.deductions ?? 0)}
      </td>
      <td className="px-3 py-3 text-right tabular-nums font-semibold">{inr(editing ? net : (salary?.net_amount ?? 0))}</td>
      <td className="px-3 py-3 text-center">
        <Badge
          variant={paid ? "default" : "secondary"}
          className={paid ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" : ""}
        >
          {status}
        </Badge>
      </td>
      <td className="px-4 py-3 text-right">
        {editing ? (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={save} disabled={saving} className="gap-1">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
              Save
            </Button>
          </div>
        ) : (
          <div className="flex justify-end gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
            {salary && !paid && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => onMarkPaid(salary.id)}>
                <Check className="h-3 w-3" /> Mark Paid
              </Button>
            )}
            {salary && (
              <Button size="sm" variant="ghost" className="text-rose-500" onClick={() => {
                if (confirm("Delete this salary record?")) onDelete(salary.id);
              }}>Del</Button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
}
