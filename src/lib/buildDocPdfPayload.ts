import type { DocPdfKind } from "@/lib/generateDocPdf";

/** Build a generateDocPdf payload from a stored quotation/contract/invoice row + studio org. */
export function buildDocPdfPayload(kind: DocPdfKind, doc: any, studio: any) {
  const client = doc.client || {};
  const items = Array.isArray(doc.items) ? doc.items : [];
  const subtotal = Number(doc.subtotal || (kind === "proposal" ? doc.contract_amount : 0) || 0);
  const taxPercent = Number(doc.tax_percent || (doc.gst_applicable ? 18 : 0));
  const discount = Number(doc.discount_value || 0);
  const taxable = Math.max(0, subtotal - discount);
  const tax = (taxable * taxPercent) / 100;
  const total = Number(kind === "proposal" ? doc.contract_amount || (taxable + tax) : doc.total_amount || (taxable + tax));
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
      bank_name: studio?.bank_name || null,
      bank_branch: studio?.bank_branch || null,
      bank_account_no: studio?.bank_account_no || null,
      bank_ifsc: studio?.bank_ifsc || null,
    },
    client: {
      name: client?.name || doc.client_name || "Client",
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
