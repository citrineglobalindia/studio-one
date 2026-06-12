import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Wallet, IndianRupee, AlertCircle, TrendingUp, Search, Loader2, Plus, Trash2,
  Check, MessageCircle, Phone, X, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FinanceTabs } from "@/components/accounts/FinanceTabs";
import { usePaymentTracking, useInvoicePayments, PAYMENT_METHODS, type InvoiceWithBalance, type PaymentMethod } from "@/hooks/usePayments";
import { useOrg } from "@/contexts/OrgContext";
import { useRole } from "@/contexts/RoleContext";

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}
function todayIso() { return new Date().toISOString().slice(0, 10); }

export default function PaymentsPage() {
  const { currentRole } = useRole();
  const { organization } = useOrg();
  const allowed = currentRole === "admin" || currentRole === "accounts" || currentRole === "administrator";
  const { invoices, totalBilled, totalReceived, totalBalance, isLoading } = usePaymentTracking();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "due" | "paid">("all");
  const [payInvoice, setPayInvoice] = useState<InvoiceWithBalance | null>(null);

  const filtered = useMemo(() => {
    let list = invoices;
    if (filter === "due") list = list.filter(i => i.balance > 0);
    if (filter === "paid") list = list.filter(i => i.balance <= 0 && i.total_amount > 0);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter(i => [i.invoice_number, i.client_name, i.client?.name].filter(Boolean).join(" ").toLowerCase().includes(q));
    return list;
  }, [invoices, filter, search]);

  const collectedPct = totalBilled > 0 ? Math.round((totalReceived / totalBilled) * 100) : 0;
  const overdueCount = invoices.filter(i => i.balance > 0 && i.due_date && new Date(i.due_date) < new Date()).length;

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Payments is restricted</p>
        <p className="text-sm text-muted-foreground">Only Admin, Administrator and Accounts can view payment tracking.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-teal-400/5 to-transparent" />
        <div className="relative p-5 md:p-6 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center">
            <IndianRupee className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Finance</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Payment Tracking</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Bill, received & balance — automated from invoices</p>
          </div>
        </div>
      </motion.div>

      <FinanceTabs />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total Bill Amount" value={inr(totalBilled)} hint={`${invoices.length} invoices`} icon={TrendingUp} tone="blue" />
        <Kpi label="Amount Received" value={inr(totalReceived)} hint={`${collectedPct}% collected`} icon={CheckCircle2} tone="emerald" />
        <Kpi label="Balance Due" value={inr(totalBalance)} hint={`${invoices.filter(i=>i.balance>0).length} pending`} icon={AlertCircle} tone="rose" />
        <Kpi label="Overdue" value={String(overdueCount)} hint="past due date" icon={Clock} tone="amber" />
      </div>

      {/* collection progress bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="font-medium text-foreground">Collection progress</span>
          <span className="text-muted-foreground tabular-nums">{inr(totalReceived)} of {inr(totalBilled)} · {collectedPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" style={{ width: `${collectedPct}%` }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit">
          {(["all", "due", "paid"] as const).map(k => (
            <button key={k} onClick={() => setFilter(k)} className={"px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition " + (filter === k ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
              {k === "due" ? "Balance due" : k}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoice / client…" className="pl-9 h-9" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {isLoading ? (
          <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center"><Wallet className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No invoices found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Invoice</th>
                  <th className="text-left px-3 py-3 font-semibold">Client</th>
                  <th className="text-right px-3 py-3 font-semibold">Bill</th>
                  <th className="text-right px-3 py-3 font-semibold">Received</th>
                  <th className="text-right px-3 py-3 font-semibold">Balance</th>
                  <th className="text-left px-3 py-3 font-semibold">Due</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(i => {
                  const overdue = i.balance > 0 && i.due_date && new Date(i.due_date) < new Date();
                  const clientName = i.client?.name ? `${i.client.name}${i.client.partner_name ? ` & ${i.client.partner_name}` : ""}` : (i.client_name || "—");
                  const phone = i.client?.phone || null;
                  return (
                    <tr key={i.id} className="hover:bg-muted/20 align-middle">
                      <td className="px-4 py-3 font-medium text-foreground">{i.invoice_number || "—"}</td>
                      <td className="px-3 py-3 text-xs">{clientName}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{inr(i.total_amount)}</td>
                      <td className="px-3 py-3 text-right tabular-nums text-emerald-600">{inr(i.amount_paid)}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-semibold">
                        {i.balance > 0 ? <span className="text-rose-600">{inr(i.balance)}</span> : <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">Paid</Badge>}
                      </td>
                      <td className="px-3 py-3 text-xs">{i.due_date ? <span className={overdue ? "text-rose-600 font-medium" : "text-muted-foreground"}>{fmtDate(i.due_date)}</span> : "—"}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {i.balance > 0 && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px]" onClick={() => setPayInvoice(i)}>
                                <Plus className="h-3 w-3" /> Record
                              </Button>
                              <WhatsAppReminder invoice={i} clientName={clientName} phone={phone} studio={organization} />
                            </>
                          )}
                          <Button size="sm" variant="ghost" className="h-7 gap-1 text-[11px]" onClick={() => setPayInvoice(i)}>
                            History
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {payInvoice && <PaymentDialog invoice={payInvoice} onClose={() => setPayInvoice(null)} />}
    </div>
  );
}

// ── WhatsApp click-to-send reminder
function WhatsAppReminder({ invoice, clientName, phone, studio }: { invoice: InvoiceWithBalance; clientName: string; phone: string | null; studio: any }) {
  const send = () => {
    const studioName = studio?.name || "our studio";
    const lines = [
      `Hello ${clientName},`,
      ``,
      `This is a gentle payment reminder from ${studioName}.`,
      `Invoice: ${invoice.invoice_number || "-"}`,
      `Total: ${inr(invoice.total_amount)}`,
      `Received: ${inr(invoice.amount_paid)}`,
      `*Balance due: ${inr(invoice.balance)}*`,
      invoice.due_date ? `Due by: ${fmtDate(invoice.due_date)}` : ``,
      ``,
      `Kindly clear the balance at your convenience. Thank you!`,
    ].filter(Boolean).join("\n");
    const digits = (phone || "").replace(/\D/g, "");
    const wa = digits.length >= 10 ? `91${digits.slice(-10)}` : "";
    const url = `https://wa.me/${wa}?text=${encodeURIComponent(lines)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };
  return (
    <Button size="sm" variant="outline" className="h-7 gap-1 text-[11px] text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/10" onClick={send} title={phone ? "Send WhatsApp reminder" : "No client phone — opens WhatsApp to pick"}>
      <MessageCircle className="h-3 w-3" /> Remind
    </Button>
  );
}

// ── Record payment + history
function PaymentDialog({ invoice, onClose }: { invoice: InvoiceWithBalance; onClose: () => void }) {
  const { payments, isLoading, record, remove } = useInvoicePayments(invoice.id);
  const [form, setForm] = useState({ amount: String(invoice.balance || ""), paid_on: todayIso(), method: "upi" as PaymentMethod, reference: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return;
    setSaving(true);
    try {
      await record.mutateAsync({ amount: amt, paid_on: form.paid_on, method: form.method, reference: form.reference, notes: form.notes, client_id: invoice.client_id });
      setForm(f => ({ ...f, amount: "", reference: "", notes: "" }));
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><IndianRupee className="h-5 w-5 text-emerald-500" /> Payments — {invoice.invoice_number || "Invoice"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg border border-border bg-muted/30 p-2"><p className="text-[10px] uppercase text-muted-foreground">Bill</p><p className="text-sm font-bold tabular-nums">{inr(invoice.total_amount)}</p></div>
          <div className="rounded-lg border border-border bg-emerald-500/5 p-2"><p className="text-[10px] uppercase text-muted-foreground">Received</p><p className="text-sm font-bold tabular-nums text-emerald-600">{inr(invoice.amount_paid)}</p></div>
          <div className="rounded-lg border border-border bg-rose-500/5 p-2"><p className="text-[10px] uppercase text-muted-foreground">Balance</p><p className="text-sm font-bold tabular-nums text-rose-600">{inr(invoice.balance)}</p></div>
        </div>

        {invoice.balance > 0 && (
          <div className="rounded-xl border border-border p-3 space-y-2.5">
            <p className="text-xs font-semibold text-foreground">Record a payment</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Amount (₹)</Label><Input type="number" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
              <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Date</Label><Input type="date" value={form.paid_on} onChange={(e) => setForm(f => ({ ...f, paid_on: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm(f => ({ ...f, method: v as PaymentMethod }))}>
                  <SelectTrigger className="h-9 capitalize"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_METHODS.map(m => <SelectItem key={m} value={m} className="capitalize">{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label className="text-[10px] uppercase text-muted-foreground">Reference</Label><Input value={form.reference} onChange={(e) => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="UTR / txn id" /></div>
            </div>
            <Button onClick={save} disabled={saving || !Number(form.amount)} className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Record {form.amount ? inr(Number(form.amount)) : "payment"}
            </Button>
          </div>
        )}

        <div>
          <p className="text-xs font-semibold text-foreground mb-1.5">Payment history</p>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mx-auto my-3" /> :
            payments.length === 0 ? <p className="text-xs text-muted-foreground italic py-2">No payments yet</p> : (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {payments.map(pmt => (
                <div key={pmt.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
                  <div className="h-7 w-7 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0"><Check className="h-3.5 w-3.5 text-emerald-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground tabular-nums">{inr(pmt.amount)}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{fmtDate(pmt.paid_on)} · {pmt.method}{pmt.reference ? ` · ${pmt.reference}` : ""}</p>
                  </div>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500" onClick={() => { if (confirm("Remove this payment?")) remove.mutate(pmt.id); }}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter><Button variant="ghost" onClick={onClose}>Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TONE: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  rose: "bg-rose-500/10 text-rose-700 border-rose-500/30",
  amber: "bg-amber-500/10 text-amber-700 border-amber-500/30",
};
function Kpi({ label, value, hint, icon: Icon, tone }: { label: string; value: string; hint?: string; icon: any; tone: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider border " + (TONE[tone] || "")}><Icon className="h-3 w-3" /> {label}</div>
      <p className="mt-2 text-xl font-bold text-foreground tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}
