import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, TrendingUp, TrendingDown, Wallet, Receipt, Search, BarChart3, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FinanceTabs } from "@/components/accounts/FinanceTabs";
import { useClientPnl, type ClientPnlRow } from "@/hooks/useClientPnl";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}

export default function ClientPnlPage() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const allowed = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts";
  const { rows, totals, isLoading } = useClientPnl();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<keyof ClientPnlRow>("net");

  const filtered = useMemo(() => {
    let list = rows;
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((r) => r.client_name.toLowerCase().includes(q));
    return [...list].sort((a, b) => Number(b[sort] ?? 0) - Number(a[sort] ?? 0));
  }, [rows, search, sort]);

  const exportCSV = () => {
    if (filtered.length === 0) { toast.info("Nothing to export"); return; }
    const headers = ["Client", "Invoices", "Billed", "Collected", "Outstanding", "Expenses", "Net P&L", "Margin %"];
    const csv = [headers.join(",")];
    for (const r of filtered) {
      csv.push([`"${r.client_name.replace(/"/g, '""')}"`, r.invoices, r.billed, r.collected, r.outstanding, r.expenses, r.net, r.margin].join(","));
    }
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `client-pnl-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <BarChart3 className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Client P&L is restricted</p>
        <p className="text-sm text-muted-foreground">Only Admin, Administrator and Accounts can view client profit & loss.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/10 via-violet-400/5 to-transparent" />
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500/25 to-indigo-500/5 border border-indigo-500/30 flex items-center justify-center shadow-sm">
              <Users className="h-6 w-6 text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Finance</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Client-wise P&L</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Revenue collected minus costs, per client</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-2 h-9" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Button>
        </div>
      </motion.div>

      <FinanceTabs />

      {/* Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Summary label="Collected" value={inr(totals.collected)} icon={Wallet} color="text-emerald-600 bg-emerald-500/10 border-emerald-500/30" />
        <Summary label="Outstanding" value={inr(totals.outstanding)} icon={TrendingDown} color="text-amber-600 bg-amber-500/10 border-amber-500/30" />
        <Summary label="Expenses" value={inr(totals.expenses)} icon={Receipt} color="text-rose-600 bg-rose-500/10 border-rose-500/30" />
        <Summary label="Net P&L" value={inr(totals.net)} icon={TrendingUp} color={totals.net >= 0 ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/30" : "text-rose-600 bg-rose-500/10 border-rose-500/30"} />
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client…" className="pl-9 h-9" />
        </div>
        <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit text-xs">
          {([["net", "Net P&L"], ["collected", "Collected"], ["billed", "Billed"], ["expenses", "Expenses"]] as [keyof ClientPnlRow, string][]).map(([k, l]) => (
            <button key={k} onClick={() => setSort(k)} className={"px-2.5 py-1.5 rounded-md font-medium transition " + (sort === k ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>{l}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <BarChart3 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No client financials yet. Create invoices to see P&L here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[920px]">
              <colgroup>
                <col className="w-[24%]" /><col className="w-[8%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[14%]" /><col className="w-[12%]" />
              </colgroup>
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Client</th>
                  <th className="text-center px-3 py-3 font-semibold">Inv</th>
                  <th className="text-right px-3 py-3 font-semibold">Billed</th>
                  <th className="text-right px-3 py-3 font-semibold">Collected</th>
                  <th className="text-right px-3 py-3 font-semibold">Outstanding</th>
                  <th className="text-right px-3 py-3 font-semibold">Expenses</th>
                  <th className="text-right px-4 py-3 font-semibold">Net P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) => (
                  <tr key={r.client_id} className="hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => navigate(`/clients/${r.client_id}`)}>
                    <td className="px-4 py-3 font-semibold text-foreground truncate" title={r.client_name}>{r.client_name}</td>
                    <td className="px-3 py-3 text-center text-xs text-muted-foreground tabular-nums">{r.invoices}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-foreground">{inr(r.billed)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-emerald-600">{inr(r.collected)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-amber-600">{r.outstanding > 0 ? inr(r.outstanding) : "—"}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-rose-600">{r.expenses > 0 ? inr(r.expenses) : "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      <span className={r.net >= 0 ? "text-emerald-600" : "text-rose-600"}>{inr(r.net)}</span>
                      <span className="block text-[10px] text-muted-foreground font-normal">{r.margin}% margin</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/30 text-xs font-semibold">
                <tr>
                  <td className="px-4 py-3">Total</td>
                  <td />
                  <td className="px-3 py-3 text-right tabular-nums">{inr(totals.billed)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-emerald-600">{inr(totals.collected)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-amber-600">{inr(totals.outstanding)}</td>
                  <td className="px-3 py-3 text-right tabular-nums text-rose-600">{inr(totals.expenses)}</td>
                  <td className="px-4 py-3 text-right tabular-nums"><span className={totals.net >= 0 ? "text-emerald-600" : "text-rose-600"}>{inr(totals.net)}</span></td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">
            Net P&L = Collected − client-attributed expenses. Expenses are linked to a client through their events.
          </div>
        </div>
      )}
    </div>
  );
}

function Summary({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
        <span className={"h-7 w-7 rounded-lg flex items-center justify-center border " + color}><Icon className="h-3.5 w-3.5" /></span>
      </div>
      <p className="text-xl font-bold text-foreground tabular-nums mt-2">{value}</p>
    </div>
  );
}
