import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart3, TrendingUp, TrendingDown, Wallet, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRole } from "@/contexts/RoleContext";
import { useLedger } from "@/hooks/useLedger";

function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function isoDateInputDefault(offsetMonths = 0) {
  const d = new Date(); d.setMonth(d.getMonth() + offsetMonths); d.setDate(1);
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function PnLPage() {
  const { currentRole } = useRole();
  const allowed = currentRole === "admin" || currentRole === "accounts";

  const [from, setFrom] = useState<string>(isoDateInputDefault(-3));
  const [to, setTo] = useState<string>(() => {
    const d = new Date(); const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const { data: entries = [], isLoading } = useLedger(from || null, to || null);

  const { income, expense, net, incomeByCategory, expenseByCategory, byMonth } = useMemo(() => {
    let income = 0, expense = 0;
    const ic = new Map<string, number>(), ec = new Map<string, number>();
    const months = new Map<string, { income: number; expense: number }>();
    for (const e of entries) {
      const monthKey = (e.date || "").slice(0, 7);
      if (!months.has(monthKey)) months.set(monthKey, { income: 0, expense: 0 });
      if (e.type === "income") {
        income += e.amount;
        ic.set(e.category, (ic.get(e.category) || 0) + e.amount);
        months.get(monthKey)!.income += e.amount;
      } else {
        expense += e.amount;
        ec.set(e.category, (ec.get(e.category) || 0) + e.amount);
        months.get(monthKey)!.expense += e.amount;
      }
    }
    const incomeByCategory = [...ic.entries()].sort((a, b) => b[1] - a[1]);
    const expenseByCategory = [...ec.entries()].sort((a, b) => b[1] - a[1]);
    const byMonth = [...months.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
    return { income, expense, net: income - expense, incomeByCategory, expenseByCategory, byMonth };
  }, [entries]);

  const maxMonth = Math.max(1, ...byMonth.map(([, v]) => Math.max(v.income, v.expense)));

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">P&amp;L is restricted</p>
        <p className="text-sm text-muted-foreground">Only Admin and Accountant roles can view this report.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-400/10 via-blue-400/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/25 to-violet-500/5 border border-violet-500/30 flex items-center justify-center shadow-sm">
              <BarChart3 className="h-6 w-6 text-violet-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Finance</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Profit &amp; Loss</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Income minus expense by period</p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryCard label="Total Income" value={inr(income)} icon={TrendingUp} color="text-emerald-600 bg-emerald-500/10 border-emerald-500/30" />
            <SummaryCard label="Total Expense" value={inr(expense)} icon={TrendingDown} color="text-rose-600 bg-rose-500/10 border-rose-500/30" />
            <SummaryCard label={net >= 0 ? "Net Profit" : "Net Loss"} value={inr(Math.abs(net))} icon={Wallet} color={net >= 0 ? "text-emerald-700 bg-emerald-500/15 border-emerald-500/40" : "text-rose-700 bg-rose-500/15 border-rose-500/40"} highlight />
          </div>

          {byMonth.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">Month-by-month</h3>
              <div className="space-y-3">
                {byMonth.map(([month, v]) => {
                  const incomeW = (v.income / maxMonth) * 100;
                  const expenseW = (v.expense / maxMonth) * 100;
                  const monthLabel = new Date(month + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" });
                  return (
                    <div key={month} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-foreground w-20">{monthLabel}</span>
                        <div className="flex gap-3 text-[11px] tabular-nums">
                          <span className="text-emerald-600">{inr(v.income)}</span>
                          <span className="text-rose-600">{inr(v.expense)}</span>
                          <span className={"font-semibold " + ((v.income - v.expense) >= 0 ? "text-emerald-700" : "text-rose-700")}>
                            {inr(v.income - v.expense)}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-muted/40 overflow-hidden flex">
                        <div className="bg-emerald-500" style={{ width: `${incomeW}%` }} />
                        <div className="bg-rose-500" style={{ width: `${expenseW}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <BreakdownCard title="Income by category" rows={incomeByCategory} total={income} color="emerald" />
            <BreakdownCard title="Expense by category" rows={expenseByCategory} total={expense} color="rose" />
          </div>
        </>
      )}
    </div>
  );
}

function SummaryCard({ label, value, icon: Icon, color, highlight }: { label: string; value: string; icon: any; color: string; highlight?: boolean }) {
  return (
    <div className={"rounded-xl border bg-card p-5 " + (highlight ? "shadow-lg" : "")}>
      <div className={"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium border " + color}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className={"mt-3 font-bold tabular-nums " + (highlight ? "text-2xl text-foreground" : "text-xl text-foreground")}>{value}</p>
    </div>
  );
}

function BreakdownCard({ title, rows, total, color }: { title: string; rows: [string, number][]; total: number; color: "emerald" | "rose" }) {
  const bar = color === "emerald" ? "bg-emerald-500" : "bg-rose-500";
  const text = color === "emerald" ? "text-emerald-600" : "text-rose-600";
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground tracking-tight mb-4">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No entries</p>
      ) : (
        <div className="space-y-2">
          {rows.map(([cat, amt]) => {
            const pct = total > 0 ? (amt / total) * 100 : 0;
            return (
              <div key={cat} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground font-medium">{cat}</span>
                  <span className={"tabular-nums font-semibold " + text}>{inr(amt)} <span className="text-muted-foreground font-normal">({pct.toFixed(0)}%)</span></span>
                </div>
                <div className="h-1.5 rounded-full bg-muted/40 overflow-hidden">
                  <div className={bar} style={{ width: `${pct}%`, height: "100%" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
