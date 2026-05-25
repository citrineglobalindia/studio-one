import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Receipt, FileText, Briefcase, Plus, Pencil, Trash2, Loader2,
  IndianRupee, CalendarDays, X, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useRole } from "@/contexts/RoleContext";
import {
  useClientQuotations, useClientContracts, useClientInvoices,
  type DbQuotation, type DbContract, type DbInvoice, type LineItem,
} from "@/hooks/useFinancials";

type Tab = "estimations" | "proposals" | "invoices";

const QUOTE_STATUSES = ["draft", "sent", "viewed", "approved", "rejected"];
const PROPOSAL_STATUSES = ["draft", "sent", "signed", "cancelled"];
const INVOICE_STATUSES = ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"];

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  sent: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  viewed: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  signed: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  paid: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  partially_paid: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  rejected: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  cancelled: "bg-rose-500/10 text-rose-600 border-rose-500/30",
  overdue: "bg-rose-500/10 text-rose-600 border-rose-500/30",
};

function inr(n: number | null | undefined) {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(v);
}

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}

export function FinancialsSection({ clientId, clientName }: { clientId: string; clientName: string }) {
  const { currentRole } = useRole();
  const allowed = currentRole === "admin" || currentRole === "accounts";

  const [tab, setTab] = useState<Tab>("estimations");

  if (!allowed) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-muted/40 flex items-center justify-center">
            <Receipt className="h-4 w-4 text-amber-500" />
          </div>
          <h4 className="text-sm font-semibold text-foreground tracking-tight">Financials</h4>
        </div>

        {/* Tab pills */}
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border">
          {([
            { key: "estimations" as Tab, label: "Estimations", icon: FileText },
            { key: "proposals" as Tab, label: "Proposals", icon: Briefcase },
            { key: "invoices" as Tab, label: "Invoices", icon: Receipt },
          ]).map(({ key, label, icon: Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={
                  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition " +
                  (active ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")
                }
              >
                <Icon className="h-3 w-3" /> {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-4 md:p-5 border-l-[3px] border-l-amber-500">
        {tab === "estimations" && <EstimationsPanel clientId={clientId} clientName={clientName} />}
        {tab === "proposals" && <ProposalsPanel clientId={clientId} clientName={clientName} />}
        {tab === "invoices" && <InvoicesPanel clientId={clientId} clientName={clientName} />}
      </div>
    </motion.div>
  );
}

// ============================================================================
// ESTIMATIONS PANEL
// ============================================================================
function EstimationsPanel({ clientId, clientName }: { clientId: string; clientName: string }) {
  const { quotations, isLoading, add, update, remove } = useClientQuotations(clientId);
  const [editing, setEditing] = useState<DbQuotation | null | undefined>(undefined); // undefined=closed
  const open = (q?: DbQuotation) => setEditing(q ?? null);
  const close = () => setEditing(undefined);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-amber-500" />
          <p className="text-sm font-semibold text-foreground">Estimations</p>
          {quotations.length > 0 && <Badge variant="secondary" className="text-[10px]">{quotations.length}</Badge>}
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => open()}>
          <Plus className="h-3.5 w-3.5" /> Add estimation
        </Button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : quotations.length === 0 ? (
        <EmptyState label="No estimations yet" onAdd={() => open()} />
      ) : (
        <div className="space-y-2">
          {quotations.map((q) => (
            <DocRow
              key={q.id}
              title={q.quotation_number || "EST"}
              subtitle={[fmtDate(q.created_at), q.valid_until ? `valid till ${fmtDate(q.valid_until)}` : null].filter(Boolean).join(" • ")}
              amount={Number(q.total_amount || 0)}
              status={q.status || "draft"}
              onEdit={() => open(q)}
              onDelete={() => {
                if (window.confirm("Delete this estimation?")) remove.mutate(q.id);
              }}
            />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <ItemsDocDialog
          open
          onOpenChange={close}
          title={editing ? "Edit estimation" : "Add estimation"}
          editing={editing}
          clientName={clientName}
          statuses={QUOTE_STATUSES}
          numberLabel="Estimation #"
          dateLabel="Valid until"
          dateField="valid_until"
          numberField="quotation_number"
          onSubmit={async (payload) => {
            if (editing) await update.mutateAsync({ id: editing.id, ...(payload as any) });
            else await add.mutateAsync({ ...(payload as any), client_name: clientName });
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// PROPOSALS PANEL (simpler — no line items, just amount + body)
// ============================================================================
function ProposalsPanel({ clientId, clientName }: { clientId: string; clientName: string }) {
  const { contracts, isLoading, add, update, remove } = useClientContracts(clientId);
  const [editing, setEditing] = useState<DbContract | null | undefined>(undefined);
  const open = (c?: DbContract) => setEditing(c ?? null);
  const close = () => setEditing(undefined);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-violet-500" />
          <p className="text-sm font-semibold text-foreground">Proposals</p>
          {contracts.length > 0 && <Badge variant="secondary" className="text-[10px]">{contracts.length}</Badge>}
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => open()}>
          <Plus className="h-3.5 w-3.5" /> Add proposal
        </Button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : contracts.length === 0 ? (
        <EmptyState label="No proposals yet" onAdd={() => open()} />
      ) : (
        <div className="space-y-2">
          {contracts.map((c) => (
            <DocRow
              key={c.id}
              title={c.title || c.contract_number || "Proposal"}
              subtitle={[fmtDate(c.created_at), c.valid_until ? `valid till ${fmtDate(c.valid_until)}` : null].filter(Boolean).join(" • ")}
              amount={Number(c.contract_amount || 0)}
              status={c.status || "draft"}
              onEdit={() => open(c)}
              onDelete={() => {
                if (window.confirm("Delete this proposal?")) remove.mutate(c.id);
              }}
            />
          ))}
        </div>
      )}

      {editing !== undefined && (
        <ProposalDialog
          open onOpenChange={close}
          editing={editing}
          clientName={clientName}
          onSubmit={async (payload) => {
            if (editing) await update.mutateAsync({ id: editing.id, ...payload });
            else await add.mutateAsync({ ...payload, client_name: clientName });
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// INVOICES PANEL
// ============================================================================
function InvoicesPanel({ clientId, clientName }: { clientId: string; clientName: string }) {
  const { invoices, isLoading, add, update, remove } = useClientInvoices(clientId);
  const [editing, setEditing] = useState<DbInvoice | null | undefined>(undefined);
  const open = (i?: DbInvoice) => setEditing(i ?? null);
  const close = () => setEditing(undefined);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-emerald-500" />
          <p className="text-sm font-semibold text-foreground">Invoices</p>
          {invoices.length > 0 && <Badge variant="secondary" className="text-[10px]">{invoices.length}</Badge>}
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={() => open()}>
          <Plus className="h-3.5 w-3.5" /> Add invoice
        </Button>
      </div>

      {isLoading ? (
        <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : invoices.length === 0 ? (
        <EmptyState label="No invoices yet" onAdd={() => open()} />
      ) : (
        <div className="space-y-2">
          {invoices.map((i) => {
            const total = Number(i.total_amount || 0);
            const paid = Number(i.amount_paid || 0);
            const due = total - paid;
            return (
              <DocRow
                key={i.id}
                title={i.invoice_number || "Invoice"}
                subtitle={
                  [
                    fmtDate(i.created_at),
                    i.due_date ? `due ${fmtDate(i.due_date)}` : null,
                    paid > 0 ? `${inr(paid)} paid` : null,
                    due > 0 && paid > 0 ? `${inr(due)} due` : null,
                  ].filter(Boolean).join(" • ")
                }
                amount={total}
                status={i.status || "draft"}
                onEdit={() => open(i)}
                onDelete={() => {
                  if (window.confirm("Delete this invoice?")) remove.mutate(i.id);
                }}
              />
            );
          })}
        </div>
      )}

      {editing !== undefined && (
        <ItemsDocDialog
          open onOpenChange={close}
          title={editing ? "Edit invoice" : "Add invoice"}
          editing={editing}
          clientName={clientName}
          statuses={INVOICE_STATUSES}
          numberLabel="Invoice #"
          dateLabel="Due date"
          dateField="due_date"
          numberField="invoice_number"
          extraAmountField={{ key: "amount_paid", label: "Amount paid (₹)" }}
          onSubmit={async (payload) => {
            if (editing) await update.mutateAsync({ id: editing.id, ...(payload as any) });
            else await add.mutateAsync({ ...(payload as any), client_name: clientName });
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// REUSABLE: DocRow, EmptyState
// ============================================================================

function DocRow({
  title, subtitle, amount, status, onEdit, onDelete,
}: {
  title: string; subtitle: string; amount: number; status: string;
  onEdit: () => void; onDelete: () => void;
}) {
  const colorClass = STATUS_COLOR[status] || STATUS_COLOR.draft;
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-xl border border-border bg-background p-3"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-foreground truncate">{title}</p>
          <Badge variant="outline" className={"text-[10px] capitalize " + colorClass}>{status.replace("_", " ")}</Badge>
        </div>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-foreground tabular-nums">{inr(amount)}</p>
      </div>
      <div className="flex items-center gap-0.5 shrink-0">
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={onDelete} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </motion.div>
  );
}

function EmptyState({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="py-8 text-center">
      <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{label}</p>
      <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" /> Add
      </Button>
    </div>
  );
}

// ============================================================================
// ITEMS DOC DIALOG — for Estimations & Invoices (line items + totals)
// ============================================================================

function blankItem(): LineItem {
  return { description: "", quantity: 1, rate: 0, amount: 0 };
}

function ItemsDocDialog({
  open, onOpenChange, title, editing, clientName, statuses, numberLabel, dateLabel,
  dateField, numberField, extraAmountField, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  editing: (DbQuotation | DbInvoice) | null;
  clientName: string;
  statuses: string[];
  numberLabel: string;
  dateLabel: string;
  dateField: "valid_until" | "due_date";
  numberField: "quotation_number" | "invoice_number";
  extraAmountField?: { key: "amount_paid"; label: string };
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = useState<any>({
    [numberField]: (editing as any)?.[numberField] || "",
    items: Array.isArray((editing as any)?.items) && (editing as any).items.length
      ? (editing as any).items
      : [blankItem()],
    discount_value: Number((editing as any)?.discount_value || 0),
    tax_percent: Number((editing as any)?.tax_percent || 0),
    [dateField]: (editing as any)?.[dateField] || "",
    status: (editing as any)?.status || statuses[0],
    notes: (editing as any)?.notes || "",
    ...(extraAmountField ? { [extraAmountField.key]: Number((editing as any)?.[extraAmountField.key] || 0) } : {}),
  });
  const [saving, setSaving] = useState(false);

  const subtotal = useMemo(() => {
    return (form.items as LineItem[]).reduce((sum, it) => sum + (Number(it.quantity || 0) * Number(it.rate || 0)), 0);
  }, [form.items]);

  const discount = Math.max(0, Number(form.discount_value || 0));
  const taxable = Math.max(0, subtotal - discount);
  const tax = (taxable * (Number(form.tax_percent || 0))) / 100;
  const total = taxable + tax;

  const updateItem = (idx: number, patch: Partial<LineItem>) => {
    setForm((p: any) => {
      const items = [...p.items];
      const next = { ...items[idx], ...patch } as LineItem;
      next.amount = Number(next.quantity || 0) * Number(next.rate || 0);
      items[idx] = next;
      return { ...p, items };
    });
  };
  const addItem = () => setForm((p: any) => ({ ...p, items: [...p.items, blankItem()] }));
  const removeItem = (idx: number) =>
    setForm((p: any) => ({ ...p, items: p.items.length <= 1 ? [blankItem()] : p.items.filter((_: LineItem, i: number) => i !== idx) }));

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = {
        [numberField]: form[numberField] || null,
        items: form.items,
        subtotal,
        discount_type: "amount",
        discount_value: discount,
        tax_percent: Number(form.tax_percent || 0),
        total_amount: total,
        [dateField]: form[dateField] || null,
        status: form.status,
        notes: form.notes?.trim() || null,
      };
      if (extraAmountField) payload[extraAmountField.key] = Number(form[extraAmountField.key] || 0);
      await onSubmit(payload);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-amber-500" /> {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
          {/* Top row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{numberLabel}</Label>
              <Input value={form[numberField] || ""} onChange={(e) => setForm((p: any) => ({ ...p, [numberField]: e.target.value }))} placeholder="auto / type a number" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p: any) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Line items</Label>
              <Button size="sm" variant="outline" className="h-7 gap-1.5" onClick={addItem}>
                <Plus className="h-3 w-3" /> Add line
              </Button>
            </div>
            <div className="space-y-1.5">
              {(form.items as LineItem[]).map((it, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_60px_80px_90px_28px] gap-1.5 items-center">
                  <Input placeholder="Description" value={it.description} onChange={(e) => updateItem(idx, { description: e.target.value })} />
                  <Input type="number" placeholder="Qty" value={it.quantity || ""} onChange={(e) => updateItem(idx, { quantity: Number(e.target.value || 0) })} />
                  <Input type="number" placeholder="Rate" value={it.rate || ""} onChange={(e) => updateItem(idx, { rate: Number(e.target.value || 0) })} />
                  <Input value={inr(it.amount)} disabled className="text-right tabular-nums" />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500" onClick={() => removeItem(idx)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Discount (₹)</Label>
              <Input type="number" value={form.discount_value || ""} onChange={(e) => setForm((p: any) => ({ ...p, discount_value: Number(e.target.value || 0) }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Tax %</Label>
              <Input type="number" value={form.tax_percent || ""} onChange={(e) => setForm((p: any) => ({ ...p, tax_percent: Number(e.target.value || 0) }))} />
            </div>
          </div>

          {extraAmountField && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{extraAmountField.label}</Label>
                <Input type="number" value={form[extraAmountField.key] || ""} onChange={(e) => setForm((p: any) => ({ ...p, [extraAmountField.key]: Number(e.target.value || 0) }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{dateLabel}</Label>
                <Input type="date" value={form[dateField] || ""} onChange={(e) => setForm((p: any) => ({ ...p, [dateField]: e.target.value }))} />
              </div>
            </div>
          )}
          {!extraAmountField && (
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{dateLabel}</Label>
              <Input type="date" value={form[dateField] || ""} onChange={(e) => setForm((p: any) => ({ ...p, [dateField]: e.target.value }))} />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm((p: any) => ({ ...p, notes: e.target.value }))} />
          </div>

          {/* Totals card */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{inr(subtotal)}</span></div>
            {discount > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span className="tabular-nums">-{inr(discount)}</span></div>}
            {tax > 0 && <div className="flex justify-between text-muted-foreground"><span>Tax</span><span className="tabular-nums">+{inr(tax)}</span></div>}
            <div className="flex justify-between font-semibold pt-1 border-t border-border"><span>Total</span><span className="tabular-nums text-base">{inr(total)}</span></div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {editing ? "Save changes" : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// PROPOSAL DIALOG (single amount + body)
// ============================================================================

function ProposalDialog({
  open, onOpenChange, editing, clientName, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: DbContract | null;
  clientName: string;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    contract_number: editing?.contract_number || "",
    title: editing?.title || "",
    contract_amount: Number(editing?.contract_amount || 0),
    valid_until: editing?.valid_until || "",
    status: editing?.status || PROPOSAL_STATUSES[0],
    body: editing?.body || "",
    notes: editing?.notes || "",
  });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSubmit({
        contract_number: form.contract_number || null,
        title: form.title || null,
        contract_amount: form.contract_amount,
        valid_until: form.valid_until || null,
        status: form.status,
        body: form.body?.trim() || null,
        notes: form.notes?.trim() || null,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-violet-500" /> {editing ? "Edit proposal" : "Add proposal"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Proposal #</Label>
              <Input value={form.contract_number} onChange={(e) => setForm((p) => ({ ...p, contract_number: e.target.value }))} placeholder="optional" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROPOSAL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Title</Label>
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder={`Proposal for ${clientName}`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Amount (₹)</Label>
              <Input type="number" value={form.contract_amount || ""} onChange={(e) => setForm((p) => ({ ...p, contract_amount: Number(e.target.value || 0) }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Valid until</Label>
              <Input type="date" value={form.valid_until} onChange={(e) => setForm((p) => ({ ...p, valid_until: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Proposal body</Label>
            <Textarea rows={6} value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} placeholder="Scope, deliverables, timeline, terms…" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Notes</Label>
            <Textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {editing ? "Save changes" : "Add proposal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
