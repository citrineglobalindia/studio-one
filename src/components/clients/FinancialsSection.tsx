import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Receipt, FileText, Briefcase, Plus, Pencil, Trash2, Loader2,
  CalendarDays, Check, FileSignature, X, FileDown,
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
import { toast } from "sonner";
import { useClientEvents, type DbEvent } from "@/hooks/useEvents";
import { useOrg } from "@/contexts/OrgContext";
import { useClients } from "@/hooks/useClients";
import { generateDocPdf, type DocPdfKind } from "@/lib/generateDocPdf";
import {
  useClientQuotations, useClientContracts, useClientInvoices,
  type DbQuotation, type DbContract, type DbInvoice, type LineItem,
} from "@/hooks/useFinancials";

type Tab = "estimations" | "proposals" | "invoices";

const REQ_LABEL: Record<string, string> = {
  traditional_photographer: "Traditional Photographer",
  traditional_videographer: "Traditional Videographer",
  candid_photographer: "Candid Photographer",
  candid_videographer: "Candid Videographer",
  drone_shoot: "Drone Shoot",
  led_wall: "LED Wall",
};

const GST_RATES = [0, 5, 12, 18, 28];
const DEFAULT_GST = 18;
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

const DEFAULT_TERMS =
  "1. Quoted amount is exclusive of any additional services not listed.\n" +
  "2. 50% advance is required to confirm the booking.\n" +
  "3. Raw footage will be delivered within 30 working days.\n" +
  "4. Cancellation within 7 days of the event forfeits the advance.\n" +
  "5. All disputes are subject to local jurisdiction.";

function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function fmtDate(d?: string | null) {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}

// Build the payload sent to generateDocPdf from a stored doc
function buildPdfPayload(opts: {
  kind: DocPdfKind;
  doc: any;
  studio: any;
  client: any;
}) {
  const { kind, doc, studio, client } = opts;
  const items = Array.isArray(doc.items) ? doc.items : [];
  const subtotal = Number(doc.subtotal || (kind === "proposal" ? doc.contract_amount : 0) || 0);
  const taxPercent = Number(doc.tax_percent || (doc.gst_applicable ? 18 : 0));
  const discount = Number(doc.discount_value || 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = (taxable * taxPercent) / 100;
  const total = Number(
    kind === "proposal"
      ? doc.contract_amount || (taxable + tax)
      : doc.total_amount || (taxable + tax)
  );
  return {
    kind,
    studio: {
      name: studio?.name || "Studio",
      address: studio?.address || null,
      city: studio?.city || null,
      phone: studio?.phone || null,
      email: studio?.email || null,
      website: studio?.website || null,
      gst_number: studio?.gst_number || null,
      logo_url: studio?.logo_url || null,
    },
    client: {
      name: client?.name || "Client",
      partner_name: client?.partner_name || null,
      phone: client?.phone || null,
      email: client?.email || null,
      partner_phone: client?.partner_phone || null,
      partner_email: client?.partner_email || null,
      address: client?.address || null,
      city: client?.city || null,
    },
    number: doc.quotation_number || doc.contract_number || doc.invoice_number || null,
    status: doc.status || "draft",
    date: doc.valid_until || doc.due_date || null,
    dateLabel: kind === "invoice" ? "Due date" : "Valid until",
    items,
    subtotal,
    discount,
    taxLabel: doc.gst_applicable ? `GST @ ${taxPercent}%` : (taxPercent > 0 ? `Tax @ ${taxPercent}%` : undefined),
    tax,
    total,
    amountPaid: kind === "invoice" ? Number(doc.amount_paid || 0) : undefined,
    body: doc.body || undefined,
    terms: doc.terms || undefined,
    notes: doc.notes || undefined,
  };
}

export function FinancialsSection({ clientId, clientName }: { clientId: string; clientName: string }) {
  const { organization } = useOrg();
  const { clients } = useClients();
  const client = clients.find((c) => c.id === clientId);
  const studioName = organization?.name || "Studio";
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
                className={"inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition " + (active ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
              >
                <Icon className="h-3 w-3" /> {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-4 md:p-5 border-l-[3px] border-l-amber-500">
        {tab === "estimations" && <EstimationsPanel clientId={clientId} clientName={clientName} studio={organization} client={client} />}
        {tab === "proposals" && <ProposalsPanel clientId={clientId} clientName={clientName} studio={organization} client={client} />}
        {tab === "invoices" && <InvoicesPanel clientId={clientId} clientName={clientName} studio={organization} client={client} />}
      </div>
    </motion.div>
  );
}

// ============================================================================
// PANELS
// ============================================================================

function EstimationsPanel({ clientId, clientName, studio, client }: { clientId: string; clientName: string; studio: any; client: any }) {
  const { quotations, isLoading, add, update, remove } = useClientQuotations(clientId);
  const [editing, setEditing] = useState<DbQuotation | null | undefined>(undefined);
  return (
    <Panel
      icon={<FileText className="h-4 w-4 text-amber-500" />}
      label="Estimations"
      count={quotations.length}
      isLoading={isLoading}
      onAdd={() => setEditing(null)}
    >
      <div className="space-y-2">
        {quotations.map((q) => {
          const total = Number(q.total_amount || 0);
          return (
            <DocRow
              key={q.id}
              title={q.quotation_number || "Estimation"}
              subtitle={[fmtDate(q.created_at), q.valid_until ? `valid till ${fmtDate(q.valid_until)}` : null, q.gst_applicable ? "GST" : null].filter(Boolean).join(" • ")}
              amount={total}
              status={q.status || "draft"}
              onEdit={() => setEditing(q)}
              onDelete={() => { if (window.confirm("Delete this estimation?")) remove.mutate(q.id); }}
              onPdf={() => generateDocPdf(buildPdfPayload({ kind: "estimation", doc: q, studio, client }))}
            />
          );
        })}
      </div>
      {editing !== undefined && (
        <EventsDocDialog
          open onOpenChange={() => setEditing(undefined)}
          docKind="estimation"
          editing={editing}
          clientId={clientId}
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
    </Panel>
  );
}

function ProposalsPanel({ clientId, clientName, studio, client }: { clientId: string; clientName: string; studio: any; client: any }) {
  const { contracts, isLoading, add, update, remove } = useClientContracts(clientId);
  const [editing, setEditing] = useState<DbContract | null | undefined>(undefined);
  return (
    <Panel
      icon={<Briefcase className="h-4 w-4 text-violet-500" />}
      label="Proposals"
      count={contracts.length}
      isLoading={isLoading}
      onAdd={() => setEditing(null)}
    >
      <div className="space-y-2">
        {contracts.map((cn) => (
          <DocRow
            key={cn.id}
            title={cn.contract_number || cn.title || "Proposal"}
            subtitle={[fmtDate(cn.created_at), cn.valid_until ? `valid till ${fmtDate(cn.valid_until)}` : null, cn.gst_applicable ? "GST" : null].filter(Boolean).join(" • ")}
            amount={Number(cn.contract_amount || 0)}
            status={cn.status || "draft"}
            onEdit={() => setEditing(cn)}
            onDelete={() => { if (window.confirm("Delete this proposal?")) remove.mutate(cn.id); }}
            onPdf={() => generateDocPdf(buildPdfPayload({ kind: "proposal", doc: cn, studio, client }))}
          />
        ))}
      </div>
      {editing !== undefined && (
        <EventsDocDialog
          open onOpenChange={() => setEditing(undefined)}
          docKind="proposal"
          editing={editing}
          clientId={clientId}
          clientName={clientName}
          statuses={PROPOSAL_STATUSES}
          numberLabel="Proposal #"
          dateLabel="Valid until"
          dateField="valid_until"
          numberField="contract_number"
          onSubmit={async (payload) => {
            if (editing) await update.mutateAsync({ id: editing.id, ...(payload as any) });
            else await add.mutateAsync({ ...(payload as any), client_name: clientName });
          }}
        />
      )}
    </Panel>
  );
}

function InvoicesPanel({ clientId, clientName, studio, client }: { clientId: string; clientName: string; studio: any; client: any }) {
  const { invoices, isLoading, add, update, remove } = useClientInvoices(clientId);
  const [editing, setEditing] = useState<DbInvoice | null | undefined>(undefined);
  return (
    <Panel
      icon={<Receipt className="h-4 w-4 text-emerald-500" />}
      label="Invoices"
      count={invoices.length}
      isLoading={isLoading}
      onAdd={() => setEditing(null)}
    >
      <div className="space-y-2">
        {invoices.map((i) => {
          const total = Number(i.total_amount || 0);
          const paid = Number(i.amount_paid || 0);
          const due = total - paid;
          return (
            <DocRow
              key={i.id}
              title={i.invoice_number || "Invoice"}
              subtitle={[
                fmtDate(i.created_at),
                i.due_date ? `due ${fmtDate(i.due_date)}` : null,
                paid > 0 ? `${inr(paid)} paid` : null,
                due > 0 && paid > 0 ? `${inr(due)} due` : null,
                i.gst_applicable ? "GST" : null,
              ].filter(Boolean).join(" • ")}
              amount={total}
              status={i.status || "draft"}
              onEdit={() => setEditing(i)}
              onDelete={() => { if (window.confirm("Delete this invoice?")) remove.mutate(i.id); }}
              onPdf={() => generateDocPdf(buildPdfPayload({ kind: "invoice", doc: i, studio, client }))}
            />
          );
        })}
      </div>
      {editing !== undefined && (
        <EventsDocDialog
          open onOpenChange={() => setEditing(undefined)}
          docKind="invoice"
          editing={editing}
          clientId={clientId}
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
    </Panel>
  );
}

// ============================================================================
// UNIFIED DIALOG WITH EVENT GROUPS
// ============================================================================

type DocKind = "estimation" | "proposal" | "invoice";

interface EventsDocDialogProps {
  open: boolean;
  onOpenChange: () => void;
  docKind: DocKind;
  editing: any | null;
  clientId: string;
  clientName: string;
  statuses: string[];
  numberLabel: string;
  dateLabel: string;
  dateField: "valid_until" | "due_date";
  numberField: "quotation_number" | "invoice_number" | "contract_number";
  extraAmountField?: { key: "amount_paid"; label: string };
  onSubmit: (payload: any) => Promise<void>;
}

// Rate key = `${eventId}::${requirement}` ; value = number (₹)
function itemKey(eventId: string, req: string) { return `${eventId}::${req}`; }
function customKey(eventId: string, idx: number) { return `${eventId}::custom::${idx}`; }

function EventsDocDialog({
  open, onOpenChange, docKind, editing, clientId, clientName, statuses,
  numberLabel, dateLabel, dateField, numberField, extraAmountField, onSubmit,
}: EventsDocDialogProps) {
  const { events: clientEvents } = useClientEvents(clientId);

  // Reconstruct rates + custom items + manualAmount from saved items
  const reconstructState = (items: LineItem[] | null | undefined) => {
    const rates: Record<string, number> = {};
    const customs: Record<string, Array<{ description: string; quantity: number; rate: number }>> = {};
    let manual = 0;
    if (!Array.isArray(items)) return { rates, customs, manual };
    for (const it of items) {
      const reqMatch = /#evt:([0-9a-f-]+)#req:([a-z_]+)/.exec(it.description || "");
      if (reqMatch) {
        rates[itemKey(reqMatch[1], reqMatch[2])] = Number(it.rate || it.amount || 0);
        continue;
      }
      const customMatch = /#evt:([0-9a-f-]+)#custom/.exec(it.description || "");
      if (customMatch) {
        const eid = customMatch[1];
        const cleanDesc = (it.description || "").replace(/\s*#evt:[0-9a-f-]+#custom\s*$/, "").trim();
        if (!customs[eid]) customs[eid] = [];
        customs[eid].push({
          description: cleanDesc,
          quantity: Number(it.quantity || 1),
          rate: Number(it.rate || (Number(it.amount || 0) / Math.max(1, Number(it.quantity || 1)))),
        });
        continue;
      }
      if ((it.description || "").includes("#manual")) {
        manual += Number(it.rate || it.amount || 0);
      }
    }
    return { rates, customs, manual };
  };

  const reconstructed = reconstructState(editing?.items);
  // selectedKeys = Set of "<eventId>::<requirementKey>" for ticked requirements
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => {
    const set = new Set<string>();
    // Initialize from event.requirements (any saved item with #req)
    for (const key of Object.keys(reconstructed.rates)) set.add(key);
    return set;
  });
  const [manualAmount, setManualAmount] = useState<number>(
    reconstructed.manual || (editing && "contract_amount" in (editing as any) ? Number((editing as any).contract_amount || 0) : 0)
  );

  const [customByEvent, setCustomByEvent] = useState<Record<string, Array<{ description: string; quantity: number; rate: number }>>>(() => reconstructed.customs);
  const [docNumber, setDocNumber] = useState<string>(editing?.[numberField] || "");
  const [status, setStatus] = useState<string>(editing?.status || statuses[0]);
  const [gst, setGst] = useState<boolean>(Boolean(editing?.gst_applicable ?? false));
  const [gstPercent, setGstPercent] = useState<number>(Number(editing?.tax_percent || (editing?.gst_applicable ? DEFAULT_GST : 0)) || DEFAULT_GST);
  const [discount, setDiscount] = useState<number>(Number(editing?.discount_value || 0));
  const [date, setDate] = useState<string>(editing?.[dateField] || "");
  const [terms, setTerms] = useState<string>(editing?.terms || (editing ? "" : DEFAULT_TERMS));
  const [notes, setNotes] = useState<string>(editing?.notes || "");
  const [amountPaid, setAmountPaid] = useState<number>(extraAmountField ? Number(editing?.[extraAmountField.key] || 0) : 0);
  const [body, setBody] = useState<string>(editing?.body || "");
  const [title, setTitle] = useState<string>(editing?.title || "");
  const [saving, setSaving] = useState(false);

  // Toggle a requirement on/off for an event
  const toggleRequirement = (eventId: string, req: string) => {
    const k = itemKey(eventId, req);
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  };

  // In the new workflow, ALL itemized docs use a single final amount (manualAmount).
  // Line items are just markers showing what's included. So subtotal = manualAmount.
  const subtotal = useMemo(
    () => manualAmount || 0,
    [manualAmount]
  );
  const discountVal = Math.max(0, discount);
  const taxable = Math.max(0, subtotal - discountVal);
  const taxPercent = gst ? gstPercent : 0;
  const tax = (taxable * taxPercent) / 100;
  const total = taxable + tax;

  const buildItems = (): LineItem[] => {
    const items: LineItem[] = [];
    // Selected requirements as zero-rate line items (just for record/PDF display)
    for (const ev of clientEvents) {
      for (const key of Object.keys(REQ_LABEL)) {
        if (!selectedKeys.has(itemKey(ev.id, key))) continue;
        items.push({
          description: `${ev.event_type || "Event"} — ${REQ_LABEL[key]}  #evt:${ev.id}#req:${key}`,
          quantity: 1,
          rate: 0,
          amount: 0,
        });
      }
      const customs = customByEvent[ev.id] || [];
      customs.forEach((c) => {
        if (!c.description.trim()) return;
        const qty = c.quantity || 1;
        items.push({
          description: `${ev.event_type || "Event"} — ${c.description}  #evt:${ev.id}#custom`,
          quantity: qty,
          rate: 0,
          amount: 0,
        });
      });
    }
    // Final single amount as the #manual line
    if (manualAmount > 0) {
      items.push({
        description: "Package amount  #manual",
        quantity: 1,
        rate: manualAmount,
        amount: manualAmount,
      });
    }
    return items;
  };

  const save = async () => {
    setSaving(true);
    try {
      const builtItems = buildItems();
      const base: any = {
        gst_applicable: gst,
        status,
        [dateField]: date || null,
        notes: notes?.trim() || null,
        terms: terms?.trim() || null,
      };
      if (docKind === "proposal") {
        await onSubmit({
          ...base,
          [numberField]: docNumber || null,
          title: title || `Proposal — ${clientName}`,
          contract_amount: total,
          body: body?.trim() || null,
          items: builtItems,
          subtotal,
          discount_type: "amount",
          discount_value: discountVal,
          tax_percent: taxPercent,
        });
      } else {
        await onSubmit({
          ...base,
          [numberField]: docNumber || null,
          items: builtItems,
          subtotal,
          discount_type: "amount",
          discount_value: discountVal,
          tax_percent: taxPercent,
          total_amount: total,
          ...(extraAmountField ? { [extraAmountField.key]: amountPaid } : {}),
        });
      }
      onOpenChange();
    } finally {
      setSaving(false);
    }
  };

  const TitleIcon = docKind === "invoice" ? Receipt : docKind === "proposal" ? Briefcase : FileText;
  const titleColor = docKind === "invoice" ? "text-emerald-500" : docKind === "proposal" ? "text-violet-500" : "text-amber-500";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[88vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 capitalize">
            <TitleIcon className={"h-5 w-5 " + titleColor} />
            {editing ? `Edit ${docKind}` : `Add ${docKind}`}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* TOP META */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{numberLabel}</Label>
              <Input value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="optional / leave blank to auto-number later" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Proposal-only title */}
          {docKind === "proposal" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Proposal title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wedding photography & video package" />
            </div>
          )}

          {/* EVENTS + REQUIREMENT CHECKLIST — visible for all doc kinds */}
          <div className="space-y-2">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Events &amp; what's included</Label>
              {clientEvents.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-6 text-center">
                  <CalendarDays className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No events on this client yet</p>
                  <p className="text-[11px] text-muted-foreground/70 mt-1">Add events from the Events section above to bring their requirements here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {clientEvents.map((ev) => {
                    const eventReqs = Array.isArray(ev.requirements) ? ev.requirements : [];
                    // Show ALL 6 standard requirements as a checklist for this event
                    const allReqs = Object.keys(REQ_LABEL);
                    const eventSelectedCount = allReqs.filter((r) => selectedKeys.has(itemKey(ev.id, r))).length
                      + (customByEvent[ev.id] || []).filter((c) => c.description.trim()).length;
                    return (
                      <div key={ev.id} className="rounded-xl border border-border bg-background overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 bg-muted/40 border-b border-border">
                          <CalendarDays className="h-3.5 w-3.5 text-primary" />
                          <p className="text-sm font-semibold text-foreground">{ev.event_type || "Event"}</p>
                          {ev.event_date && (
                            <Badge variant="outline" className="text-[10px]">{fmtDate(ev.event_date)}</Badge>
                          )}
                          {eventSelectedCount > 0 && (
                            <Badge variant="default" className="text-[10px]">{eventSelectedCount} selected</Badge>
                          )}
                        </div>
                        <div className="p-3 space-y-2">
                          {/* Hint */}
                          {eventReqs.length === 0 && (
                            <p className="text-[10px] text-muted-foreground italic">
                              No requirements were ticked when this event was created. Pick what to include here.
                            </p>
                          )}

                          {/* All 6 standard requirements as checkbox chips */}
                          <div className="flex flex-wrap gap-1.5">
                            {(Object.entries(REQ_LABEL) as Array<[string, string]>).map(([key, label]) => {
                              const isSelected = selectedKeys.has(itemKey(ev.id, key));
                              const wasOnEvent = eventReqs.includes(key);
                              return (
                                <button
                                  key={key}
                                  type="button"
                                  onClick={() => toggleRequirement(ev.id, key)}
                                  className={
                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition " +
                                    (isSelected
                                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                      : "bg-muted/40 text-foreground border-border hover:bg-muted hover:border-border/80")
                                  }
                                  title={wasOnEvent ? "Was set on the event" : "Add to this estimate"}
                                >
                                  {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                                  {label}
                                  {wasOnEvent && !isSelected && <span className="opacity-50">·</span>}
                                </button>
                              );
                            })}
                          </div>

                          {/* Custom notes per event */}
                          {(customByEvent[ev.id] ?? []).map((ci, idx) => (
                            <div key={`custom-${idx}`} className="grid grid-cols-[1fr,60px,28px] gap-2 items-center">
                              <Input
                                value={ci.description}
                                onChange={(e) => setCustomByEvent((p) => {
                                  const list = [...(p[ev.id] || [])];
                                  list[idx] = { ...list[idx], description: e.target.value };
                                  return { ...p, [ev.id]: list };
                                })}
                                placeholder="Custom item (e.g. Coffee table book)"
                                className="h-8 text-sm"
                              />
                              <Input
                                type="number"
                                value={ci.quantity || ""}
                                onChange={(e) => setCustomByEvent((p) => {
                                  const list = [...(p[ev.id] || [])];
                                  list[idx] = { ...list[idx], quantity: Number(e.target.value || 0) };
                                  return { ...p, [ev.id]: list };
                                })}
                                placeholder="Qty"
                                className="text-center tabular-nums h-8"
                              />
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => setCustomByEvent((p) => {
                                const list = (p[ev.id] || []).filter((_, i) => i !== idx);
                                return { ...p, [ev.id]: list };
                              })}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <div>
                            <Button size="sm" variant="ghost" className="h-7 gap-1.5 text-xs"
                              onClick={() => setCustomByEvent((p) => ({
                                ...p, [ev.id]: [...(p[ev.id] || []), { description: "", quantity: 1, rate: 0 }]
                              }))}>
                              <Plus className="h-3 w-3" /> Add custom item
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          {/* FINAL AMOUNT — single input for the whole package (all doc kinds) */}
          <div className="rounded-xl border-2 border-primary/30 p-5 bg-primary/[0.04]">
            <Label className="text-[11px] uppercase tracking-wide text-primary font-semibold">Final amount (₹)</Label>
            <p className="text-[10px] text-muted-foreground mt-0.5 mb-2">One total price for everything ticked above</p>
            <Input
              type="number"
              value={manualAmount || ""}
              onChange={(e) => setManualAmount(Number(e.target.value || 0))}
              placeholder="0"
              className="text-right tabular-nums text-2xl font-bold h-14"
            />
          </div>

          {/* GST + DATE + DISCOUNT */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-border p-3 bg-muted/20 sm:col-span-1 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-foreground">GST</Label>
                <button type="button" onClick={() => setGst((v) => !v)}
                  className={"relative inline-flex h-5 w-9 items-center rounded-full transition " + (gst ? "bg-primary" : "bg-muted")}
                  aria-checked={gst} role="switch">
                  <span className={"inline-block h-4 w-4 transform rounded-full bg-white shadow transition " + (gst ? "translate-x-4" : "translate-x-0.5")} />
                </button>
              </div>
              {gst && (
                <Select value={String(gstPercent)} onValueChange={(v) => setGstPercent(Number(v))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GST_RATES.map((r) => <SelectItem key={r} value={String(r)}>{r}% GST</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              {!gst && <p className="text-[10px] text-muted-foreground">No tax applied</p>}
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Discount (₹)</Label>
              <Input type="number" value={discount || ""} onChange={(e) => setDiscount(Number(e.target.value || 0))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{dateLabel}</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          {extraAmountField && (
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{extraAmountField.label}</Label>
              <Input type="number" value={amountPaid || ""} onChange={(e) => setAmountPaid(Number(e.target.value || 0))} />
            </div>
          )}

          {/* TOTALS CARD */}
          <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="tabular-nums">{inr(subtotal)}</span></div>
            {discountVal > 0 && <div className="flex justify-between text-muted-foreground"><span>Discount</span><span className="tabular-nums">-{inr(discountVal)}</span></div>}
            {tax > 0 && <div className="flex justify-between text-muted-foreground"><span>GST @ {taxPercent}%</span><span className="tabular-nums">+{inr(tax)}</span></div>}
            <div className="flex justify-between font-semibold pt-1 border-t border-border"><span>Total</span><span className="tabular-nums text-base">{inr(total)}</span></div>
          </div>

          {/* PROPOSAL BODY */}
          {docKind === "proposal" && (
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Proposal body</Label>
              <Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Scope, deliverables, timeline…" />
            </div>
          )}

          {/* TERMS & CONDITIONS */}
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <FileSignature className="h-3 w-3" /> Terms &amp; Conditions
            </Label>
            <Textarea rows={6} value={terms} onChange={(e) => setTerms(e.target.value)} placeholder="Payment terms, cancellation policy, delivery timeline…" className="font-mono text-[12px]" />
          </div>

          {/* NOTES */}
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Internal notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Visible to your team only" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onOpenChange} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
            {editing ? "Save changes" : `Add ${docKind}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// SHARED UI
// ============================================================================

function Panel({
  icon, label, count, isLoading, onAdd, children,
}: {
  icon: React.ReactNode; label: string; count: number;
  isLoading: boolean; onAdd: () => void; children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {count > 0 && <Badge variant="secondary" className="text-[10px]">{count}</Badge>}
        </div>
        <Button size="sm" className="h-8 gap-1.5" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" /> Add {label.slice(0, -1).toLowerCase()}
        </Button>
      </div>
      {isLoading && (
        <div className="py-6 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      )}
      {!isLoading && count === 0 && (
        <div className="py-8 text-center">
          <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No {label.toLowerCase()} yet</p>
          <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={onAdd}>
            <Plus className="h-3.5 w-3.5" /> Add
          </Button>
        </div>
      )}
      {/* Always render children so dialogs work even when list is empty */}
      {children}
    </div>
  );
}

function DocRow({
  title, subtitle, amount, status, onEdit, onDelete, onPdf,
}: {
  title: string; subtitle: string; amount: number; status: string;
  onEdit: () => void; onDelete: () => void; onPdf?: () => void;
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
        {onPdf && <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onPdf} title="Download PDF"><FileDown className="h-3.5 w-3.5" /></Button>}
        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onEdit} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={onDelete} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </motion.div>
  );
}
