import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Users, ArrowLeft, Loader2, FileText, Briefcase, Receipt,
  Phone, Mail, MapPin, CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useClients } from "@/hooks/useClients";
import { useClientEvents } from "@/hooks/useEvents";
import {
  useClientQuotations, useClientContracts, useClientInvoices,
} from "@/hooks/useFinancials";
import { EventsDocDialog } from "@/components/clients/FinancialsSection";

type Kind = "estimation" | "proposal" | "invoice";

const KIND_META: Record<Kind, { label: string; icon: any; color: string; statuses: string[]; numberLabel: string; dateLabel: string; numberField: any; dateField: any; extra?: any }> = {
  estimation: {
    label: "Estimation", icon: FileText,
    color: "from-amber-500/15 to-amber-500/5 border-amber-500/30 text-amber-700",
    statuses: ["draft", "sent", "viewed", "approved", "rejected"],
    numberLabel: "Estimation #", dateLabel: "Valid until",
    numberField: "quotation_number", dateField: "valid_until",
  },
  proposal: {
    label: "Proposal", icon: Briefcase,
    color: "from-violet-500/15 to-violet-500/5 border-violet-500/30 text-violet-700",
    statuses: ["draft", "sent", "signed", "cancelled"],
    numberLabel: "Proposal #", dateLabel: "Valid until",
    numberField: "contract_number", dateField: "valid_until",
  },
  invoice: {
    label: "Invoice", icon: Receipt,
    color: "from-emerald-500/15 to-emerald-500/5 border-emerald-500/30 text-emerald-700",
    statuses: ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"],
    numberLabel: "Invoice #", dateLabel: "Due date",
    numberField: "invoice_number", dateField: "due_date",
    extra: { key: "amount_paid", label: "Amount paid (₹)" },
  },
};

/**
 * NEW DOC FROM ACCOUNTS
 *
 * Renders a button that opens a 2-step wizard:
 *  Step 1 — search + pick a client (shows event count + couple name)
 *  Step 2 — opens the existing EventsDocDialog scoped to that client,
 *           with all events + requirements available for selection
 */
export function NewDocFromAccounts({ kind, organization, className = "" }: { kind: Kind; organization: any; className?: string }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);

  const meta = KIND_META[kind];
  const Icon = meta.icon;

  return (
    <>
      <Button onClick={() => { setClientId(null); setPickerOpen(true); }} className={"gap-2 " + className}>
        <Icon className="h-4 w-4" /> New {meta.label}
      </Button>

      {pickerOpen && clientId == null && (
        <ClientPickerDialog
          kind={kind}
          onClose={() => setPickerOpen(false)}
          onPick={(id) => setClientId(id)}
        />
      )}

      {clientId && (
        <ScopedDocDialog
          kind={kind}
          clientId={clientId}
          organization={organization}
          onClose={() => { setClientId(null); setPickerOpen(false); }}
        />
      )}
    </>
  );
}

// ───────────────────────────────────── STEP 1: client picker

function ClientPickerDialog({ kind, onClose, onPick }: { kind: Kind; onClose: () => void; onPick: (id: string) => void }) {
  const { clients, isLoading } = useClients();
  const [q, setQ] = useState("");
  const meta = KIND_META[kind];
  const Icon = meta.icon;

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clients;
    return clients.filter((c: any) =>
      [c.name, c.partner_name, c.email, c.phone, c.city, c.venue_city, c.venue_name].filter(Boolean).join(" ").toLowerCase().includes(s)
    );
  }, [clients, q]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2.5">
            <div className={"h-9 w-9 rounded-xl bg-gradient-to-br border flex items-center justify-center " + meta.color}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">New {meta.label}</p>
              <p className="text-xs text-muted-foreground font-normal">Step 1 of 2 — pick a client to bill</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        <div className="px-5 py-3 border-b border-border bg-muted/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by couple name, phone, city, venue…" className="pl-9 h-10" />
          </div>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-3 space-y-1.5">
          {isLoading ? (
            <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
              No clients match "{q}"
            </div>
          ) : (
            filtered.map((c: any) => (
              <ClientPickerRow key={c.id} client={c} onPick={() => onPick(c.id)} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClientPickerRow({ client, onPick }: { client: any; onPick: () => void }) {
  // Get event count per client to show a hint
  const { events } = useClientEvents(client.id);
  const couple = client.partner_name ? `${client.name} & ${client.partner_name}` : client.name;
  const hasReqs = events.some((e: any) => Array.isArray(e.requirements) && e.requirements.length > 0);
  return (
    <button
      onClick={onPick}
      className="w-full text-left rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-muted/30 transition px-3 py-2.5 flex items-center gap-3"
    >
      <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500/15 to-amber-500/5 border border-amber-500/30 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-amber-700">{(client.name || "?").slice(0,1).toUpperCase()}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{couple}</p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
          {client.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>}
          {client.email && <span className="inline-flex items-center gap-1 truncate max-w-[200px]"><Mail className="h-3 w-3" />{client.email}</span>}
          {(client.venue_city || client.city) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{client.venue_city || client.city}</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <Badge variant="outline" className="text-[10px] gap-1">
          <CalendarDays className="h-2.5 w-2.5" />
          {events.length} event{events.length === 1 ? "" : "s"}
        </Badge>
        {hasReqs && (
          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
            requirements set
          </Badge>
        )}
      </div>
    </button>
  );
}

// ───────────────────────────────────── STEP 2: scoped doc dialog
// Reuses the existing EventsDocDialog, scoped to the picked client

function ScopedDocDialog({ kind, clientId, organization, onClose }: { kind: Kind; clientId: string; organization: any; onClose: () => void }) {
  const { clients } = useClients();
  const client = clients.find((c: any) => c.id === clientId);
  const clientName = client?.name || "Client";

  // Hook into the right table's create mutation
  const quoteMut    = useClientQuotations(kind === "estimation" ? clientId : undefined);
  const contractMut = useClientContracts(kind === "proposal" ? clientId : undefined);
  const invoiceMut  = useClientInvoices(kind === "invoice" ? clientId : undefined);

  const meta = KIND_META[kind];

  const onSubmit = async (payload: any) => {
    const base = { ...payload, client_name: clientName };
    if (kind === "estimation") await quoteMut.add.mutateAsync(base as any);
    else if (kind === "proposal") await contractMut.add.mutateAsync(base as any);
    else await invoiceMut.add.mutateAsync(base as any);
  };

  return (
    <EventsDocDialog
      open
      onOpenChange={onClose}
      docKind={kind}
      editing={null}
      clientId={clientId}
      clientName={clientName}
      statuses={meta.statuses}
      numberLabel={meta.numberLabel}
      dateLabel={meta.dateLabel}
      dateField={meta.dateField}
      numberField={meta.numberField}
      extraAmountField={meta.extra}
      onSubmit={onSubmit}
    />
  );
}
