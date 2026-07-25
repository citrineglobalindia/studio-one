import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FinanceTabs } from "@/components/accounts/FinanceTabs";
import {
  Wallet, Plus, Check, X, Loader2, Search, Receipt,
  CheckCircle2, XCircle, Clock, BadgeIndianRupee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useExpenses, EXPENSE_CATEGORIES, type DbExpense } from "@/hooks/useExpenses";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  approved: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}

export default function ExpensesPage() {
  const { currentRole } = useRole();
  const isFinance = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts";
  const { user } = useAuth();
  const { expenses, isLoading, canApprove, canProcessPayment, add, update, remove, approve, reject, markPaid } = useExpenses();

  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "paid" | "rejected" | "mine">("all");
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DbExpense | null>(null);

  const filtered = useMemo(() => {
    let list = expenses;
    if (filter === "mine") list = list.filter((e) => e.requested_by === user?.id);
    else if (filter !== "all") list = list.filter((e) => e.status === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((e) =>
        [e.description, e.category, e.payment_method, e.payment_account, e.admin_notes]
          .filter(Boolean).join(" ").toLowerCase().includes(q)
      );
    }
    return list;
  }, [expenses, filter, search, user]);

  const kpis = useMemo(() => {
    const sum = (s: string) => expenses.filter((e) => e.status === s).reduce((a, e) => a + Number(e.amount || 0), 0);
    return {
      pending: { n: expenses.filter((e) => e.status === "pending").length, total: sum("pending") },
      approved: { n: expenses.filter((e) => e.status === "approved").length, total: sum("approved") },
      paid: { n: expenses.filter((e) => e.status === "paid").length, total: sum("paid") },
      rejected: { n: expenses.filter((e) => e.status === "rejected").length, total: sum("rejected") },
    };
  }, [expenses]);

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-rose-400/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-500/5 border border-amber-500/30 flex items-center justify-center shadow-sm">
              <Wallet className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Finance</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Expenses</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Raise, approve and track studio expenses</p>
            </div>
          </div>
          <Button onClick={() => setAdding(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Raise expense
          </Button>
        </div>
      </motion.div>

      {isFinance && <FinanceTabs />}

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard label="Pending" value={inr(kpis.pending.total)} count={kpis.pending.n} icon={Clock} color="text-amber-600 bg-amber-500/10" />
        <KpiCard label="Approved" value={inr(kpis.approved.total)} count={kpis.approved.n} icon={CheckCircle2} color="text-blue-600 bg-blue-500/10" />
        <KpiCard label="Paid" value={inr(kpis.paid.total)} count={kpis.paid.n} icon={BadgeIndianRupee} color="text-emerald-600 bg-emerald-500/10" />
        <KpiCard label="Rejected" value={inr(kpis.rejected.total)} count={kpis.rejected.n} icon={XCircle} color="text-rose-600 bg-rose-500/10" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit overflow-x-auto">
          {(["all", "pending", "approved", "paid", "rejected", "mine"] as const).map((k) => (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className={"px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition " + (filter === k ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
            >
              {k}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description, category…" className="pl-9" />
        </div>
      </div>

      {/* List */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No expenses match this filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-3 py-3 font-medium">Category</th>
                  <th className="text-left px-3 py-3 font-medium">Description</th>
                  <th className="text-left px-3 py-3 font-medium">Method</th>
                  <th className="text-right px-3 py-3 font-medium">Amount</th>
                  <th className="text-center px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-t border-border hover:bg-muted/30 transition">
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(e.created_at)}</td>
                    <td className="px-3 py-3"><Badge variant="secondary" className="text-[10px]">{e.category || "—"}</Badge></td>
                    <td className="px-3 py-3 max-w-[300px]">
                      <p className="text-foreground truncate">{e.description || "—"}</p>
                      {e.admin_notes && <p className="text-[10px] text-muted-foreground truncate">Note: {e.admin_notes}</p>}
                    </td>
                    <td className="px-3 py-3 text-muted-foreground text-xs">
                      <p>{e.payment_method || "—"}</p>
                      {e.payment_account && <p className="text-[10px]">{e.payment_account}</p>}
                    </td>
                    <td className="px-3 py-3 text-right font-semibold tabular-nums">{inr(e.amount)}</td>
                    <td className="px-3 py-3 text-center">
                      <Badge variant="outline" className={"text-[10px] capitalize " + (STATUS_COLOR[String(e.status || "pending")] || STATUS_COLOR.pending)}>
                        {String(e.status || "pending")}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {canApprove && e.status === "pending" && (
                          <>
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10" onClick={() => approve.mutate({ id: e.id })}>
                              <Check className="h-3 w-3" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-rose-600 border-rose-500/30 hover:bg-rose-500/10" onClick={() => {
                              const notes = window.prompt("Reason for rejection (optional)") ?? undefined;
                              reject.mutate({ id: e.id, notes });
                            }}>
                              <X className="h-3 w-3" /> Reject
                            </Button>
                          </>
                        )}
                        {canProcessPayment && e.status === "approved" && (
                          <Button size="sm" className="h-7 gap-1 text-xs" onClick={() => {
                            const ref = window.prompt("Payment reference (UTR / cheque #) — optional") ?? undefined;
                            markPaid.mutate({ id: e.id, reference: ref });
                          }}>
                            <BadgeIndianRupee className="h-3 w-3" /> Mark paid
                          </Button>
                        )}
                        {(canProcessPayment || e.requested_by === user?.id) && e.status === "pending" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditing(e)}>Edit</Button>
                        )}
                        {canProcessPayment && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-rose-500" onClick={() => {
                            if (window.confirm("Delete this expense entry?")) remove.mutate(e.id);
                          }}>Delete</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseDialog
        open={adding || editing !== null}
        onOpenChange={() => { setAdding(false); setEditing(null); }}
        editing={editing}
        onSubmit={async (payload) => {
          if (editing) await update.mutateAsync({ id: editing.id, ...payload });
          else await add.mutateAsync(payload);
        }}
      />
    </div>
  );
}

function KpiCard({ label, value, count, icon: Icon, color }: { label: string; value: string; count: number; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className={"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium " + color}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-2 text-base font-semibold text-foreground tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{count} entr{count === 1 ? "y" : "ies"}</p>
    </div>
  );
}

function ExpenseDialog({
  open, onOpenChange, editing, onSubmit,
}: {
  open: boolean;
  onOpenChange: () => void;
  editing: DbExpense | null;
  onSubmit: (payload: Partial<DbExpense>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    category: editing?.category || EXPENSE_CATEGORIES[0],
    amount: Number(editing?.amount || 0),
    description: editing?.description || "",
    payment_method: editing?.payment_method || "Cash",
    payment_account: editing?.payment_account || "",
    receipt_url: editing?.receipt_url || "",
  });
  const [saving, setSaving] = useState(false);

  // Reset form when opening with different editing
  useMemo(() => {
    if (open) {
      setForm({
        category: editing?.category || EXPENSE_CATEGORIES[0],
        amount: Number(editing?.amount || 0),
        description: editing?.description || "",
        payment_method: editing?.payment_method || "Cash",
        payment_account: editing?.payment_account || "",
        receipt_url: editing?.receipt_url || "",
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing?.id]);

  const save = async () => {
    if (!form.amount || form.amount <= 0) return;
    setSaving(true);
    try {
      await onSubmit({
        category: form.category || null,
        amount: form.amount,
        description: form.description.trim() || null,
        payment_method: form.payment_method || null,
        payment_account: form.payment_account.trim() || null,
        receipt_url: form.receipt_url.trim() || null,
      } as any);
      onOpenChange();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-amber-500" /> {editing ? "Edit expense" : "Raise expense"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Amount (₹)</Label>
              <Input type="number" value={form.amount || ""} onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value || 0) }))} placeholder="0" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="What was this for?" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Payment method</Label>
              <Select value={form.payment_method} onValueChange={(v) => setForm((p) => ({ ...p, payment_method: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Cash", "UPI", "Bank transfer", "Card", "Cheque"].map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Account / paid to</Label>
              <Input value={form.payment_account} onChange={(e) => setForm((p) => ({ ...p, payment_account: e.target.value }))} placeholder="Vendor name / account #" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Receipt URL (optional)</Label>
            <Input value={form.receipt_url} onChange={(e) => setForm((p) => ({ ...p, receipt_url: e.target.value }))} placeholder="https://…" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onOpenChange} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.amount} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {editing ? "Save changes" : "Submit expense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
