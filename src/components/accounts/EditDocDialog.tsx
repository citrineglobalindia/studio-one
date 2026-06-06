import { EventsDocDialog } from "@/components/clients/FinancialsSection";
import { useClientQuotations, useClientContracts, useClientInvoices } from "@/hooks/useFinancials";

type Kind = "estimation" | "proposal" | "invoice";

const META: Record<Kind, { statuses: string[]; numberLabel: string; dateLabel: string; numberField: any; dateField: any; extra?: any }> = {
  estimation: { statuses: ["draft", "sent", "viewed", "approved", "rejected"], numberLabel: "Estimation #", dateLabel: "Valid until", numberField: "quotation_number", dateField: "valid_until" },
  proposal:   { statuses: ["draft", "sent", "signed", "cancelled"], numberLabel: "Proposal #", dateLabel: "Valid until", numberField: "contract_number", dateField: "valid_until" },
  invoice:    { statuses: ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"], numberLabel: "Invoice #", dateLabel: "Due date", numberField: "invoice_number", dateField: "due_date", extra: { key: "amount_paid", label: "Amount paid (₹)" } },
};

/**
 * Opens the EXACT financial-doc editor (requirement checklist + final amount + GST + terms)
 * pre-loaded with an existing estimate/proposal/invoice, and saves via the matching update mutation.
 */
export function EditDocDialog({ kind, doc, clientId, clientName, onClose }: {
  kind: Kind; doc: any; clientId: string; clientName: string; onClose: () => void;
}) {
  const quoteMut    = useClientQuotations(kind === "estimation" ? clientId : undefined);
  const contractMut = useClientContracts(kind === "proposal" ? clientId : undefined);
  const invoiceMut  = useClientInvoices(kind === "invoice" ? clientId : undefined);
  const meta = META[kind];

  const onSubmit = async (payload: any) => {
    const patch = { id: doc.id, ...payload };
    if (kind === "estimation") await quoteMut.update.mutateAsync(patch as any);
    else if (kind === "proposal") await contractMut.update.mutateAsync(patch as any);
    else await invoiceMut.update.mutateAsync(patch as any);
  };

  return (
    <EventsDocDialog
      open
      onOpenChange={onClose}
      docKind={kind}
      editing={doc}
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
