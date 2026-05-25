import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FinanceTabs } from "@/components/accounts/FinanceTabs";
import { useNavigate } from "react-router-dom";
import {
  BookOpen, ArrowDownCircle, ArrowUpCircle, Loader2,
  Calendar, Filter, TrendingUp, TrendingDown, Wallet, ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/contexts/RoleContext";
import { useLedger, type LedgerEntry } from "@/hooks/useLedger";

function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}

function isoDateInputDefault(offsetDays = 0) {
  const d = new Date(); d.setDate(d.getDate() + offsetDays);
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function LedgerPage() {
  const { currentRole } = useRole();
  const allowed = currentRole === "admin" || currentRole === "accounts";

  const [from, setFrom] = useState<string>(isoDateInputDefault(-90));
  const [to, setTo] = useState<string>(isoDateInputDefault(0));
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense">("all");

  const { data: entries = [], isLoading } = useLedger(from || null, to || null);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    if (typeFilter === "all") return entries;
    return entries.filter((e) => e.type === typeFilter);
  }, [entries, typeFilter]);

  const totals = useMemo(() => {
    const income = entries.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const expense = entries.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return { income, expense, net: income - expense };
  }, [entries]);

  // Running balance — newest first display, but running balance from chronological asc → reduce in reverse
  const withRunningBalance = useMemo(() => {
    const asc = [...filtered].sort((a, b) => (a.date < b.date ? -1 : 1));
    let bal = 0;
    const acc: Array<LedgerEntry & { balance: number }> = [];
    for (const e of asc) {
      bal += e.type === "income" ? e.amount : -e.amount;
      acc.push({ ...e, balance: bal });
    }
    return acc.reverse();
  }, [filtered]);

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Ledger is restricted</p>
        <p className="text-sm text-muted-foreground">Only Admin and Accountant roles can view this page.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-blue-400/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        <div className="relative p-5 md:p-6 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center shadow-sm">
            <BookOpen className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Finance</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Ledger</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Every rupee in and out — invoices &amp; approved expenses</p>
          </div>
        </div>
      </motion.div>

      <FinanceTabs />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <KpiCard label="Income" value={inr(totals.income)} icon={TrendingUp} color="text-emerald-600 bg-emerald-500/10" />
        <KpiCard label="Expense" value={inr(totals.expense)} icon={TrendingDown} color="text-rose-600 bg-rose-500/10" />
        <KpiCard label="Net" value={inr(totals.net)} icon={Wallet} color={totals.net >= 0 ? "text-emerald-600 bg-emerald-500/10" : "text-rose-600 bg-rose-500/10"} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">From</label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">To</label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
        </div>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit sm:ml-auto">
          {(["all", "income", "expense"] as const).map((k) => (
            <button key={k} onClick={() => setTypeFilter(k)}
              className={"px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition " + (typeFilter === k ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
              {k}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
        ) : withRunningBalance.length === 0 ? (
          <div className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No ledger entries in this period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-3 py-3 font-medium">Type</th>
                  <th className="text-left px-3 py-3 font-medium">Category</th>
                  <th className="text-left px-3 py-3 font-medium">Description / Client</th>
                  <th className="text-right px-3 py-3 font-medium">Income</th>
                  <th className="text-right px-3 py-3 font-medium">Expense</th>
                  <th className="text-right px-3 py-3 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {withRunningBalance.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/30 transition">
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td className="px-3 py-3">
                      <Badge variant="outline" className={"text-[10px] gap-1 " + (e.type === "income" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-rose-500/10 text-rose-600 border-rose-500/30")}>
                        {e.type === "income" ? <ArrowDownCircle className="h-3 w-3" /> : <ArrowUpCircle className="h-3 w-3" />}
                        {e.type}
                      </Badge>
                    </td>
                    <td className="px-3 py-3"><Badge variant="secondary" className="text-[10px]">{e.category}</Badge></td>
                    <td className="px-3 py-3">
                      <p className="text-foreground">{e.description}</p>
                      {e.client_name && (
                        <button onClick={() => e.client_id && navigate(`/clients/${e.client_id}`)} className="text-[10px] text-primary hover:underline inline-flex items-center gap-1">
                          {e.client_name} <ExternalLink className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-600">{e.type === "income" ? inr(e.amount) : ""}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-rose-600">{e.type === "expense" ? inr(e.amount) : ""}</td>
                    <td className={"px-3 py-3 text-right tabular-nums font-semibold " + (e.balance >= 0 ? "text-foreground" : "text-rose-600")}>{inr(e.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium " + color}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-2 text-xl font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}
