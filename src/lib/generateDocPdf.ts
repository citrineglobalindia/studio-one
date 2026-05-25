import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export type DocPdfKind = "estimation" | "proposal" | "invoice";

export interface DocPdfData {
  kind: DocPdfKind;
  studioName: string;
  studioContact?: string;
  number?: string | null;
  clientName: string;
  status: string;
  date?: string | null;       // valid_until / due_date
  dateLabel?: string;
  items: Array<{ description: string; quantity?: number; rate?: number; amount?: number }>;
  subtotal: number;
  discount?: number;
  taxLabel?: string;          // 'GST @ 18%' or 'Tax @ X%'
  tax?: number;
  total: number;
  amountPaid?: number;
  body?: string | null;       // proposal body
  terms?: string | null;
  notes?: string | null;
}

function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}
function esc(s: string | null | undefined) {
  if (!s) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/\n/g, "<br/>");
}

function buildHtml(d: DocPdfData): string {
  const title = d.kind === "invoice" ? "INVOICE" : d.kind === "proposal" ? "PROPOSAL" : "ESTIMATION";
  const accent = d.kind === "invoice" ? "#059669" : d.kind === "proposal" ? "#7c3aed" : "#d97706";
  const due = d.amountPaid != null ? d.total - d.amountPaid : null;

  const itemsRows = d.items.map((it, i) => {
    const desc = esc(it.description).replace(/\s*#evt:[a-f0-9-]+#(req:[a-z_]+|custom)\s*$/i, "").trim();
    const qty = it.quantity ?? 1;
    const rate = Number(it.rate ?? it.amount ?? 0);
    const amount = Number(it.amount ?? rate * qty);
    return `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151">${i + 1}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#111827">${esc(desc)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;text-align:right">${qty}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#374151;text-align:right">${esc(inr(rate))}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;color:#111827;text-align:right;font-weight:600">${esc(inr(amount))}</td>
    </tr>`;
  }).join("");

  const itemsTable = d.kind === "proposal"
    ? ""
    : `<table style="width:100%;border-collapse:collapse;margin-top:24px;border-top:2px solid ${accent}">
        <thead>
          <tr style="background:#f9fafb">
            <th style="padding:10px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600">#</th>
            <th style="padding:10px 8px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600">Description</th>
            <th style="padding:10px 8px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600">Qty</th>
            <th style="padding:10px 8px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600">Rate</th>
            <th style="padding:10px 8px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#6b7280;font-weight:600">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsRows || `<tr><td colspan="5" style="padding:24px;text-align:center;color:#9ca3af;font-size:12px">No items</td></tr>`}</tbody>
      </table>`;

  const totals = `
    <table style="margin-left:auto;margin-top:16px;width:300px;font-size:12px">
      <tr><td style="padding:4px 8px;color:#6b7280">Subtotal</td><td style="padding:4px 8px;text-align:right">${esc(inr(d.subtotal))}</td></tr>
      ${d.discount && d.discount > 0 ? `<tr><td style="padding:4px 8px;color:#6b7280">Discount</td><td style="padding:4px 8px;text-align:right;color:#6b7280">- ${esc(inr(d.discount))}</td></tr>` : ""}
      ${d.tax && d.tax > 0 ? `<tr><td style="padding:4px 8px;color:#6b7280">${esc(d.taxLabel || "Tax")}</td><td style="padding:4px 8px;text-align:right;color:#6b7280">+ ${esc(inr(d.tax))}</td></tr>` : ""}
      <tr style="border-top:2px solid #111827"><td style="padding:8px;font-weight:700;color:#111827">Total</td><td style="padding:8px;text-align:right;font-weight:700;font-size:14px;color:#111827">${esc(inr(d.total))}</td></tr>
      ${d.amountPaid && d.amountPaid > 0 ? `<tr><td style="padding:4px 8px;color:#059669">Paid</td><td style="padding:4px 8px;text-align:right;color:#059669">- ${esc(inr(d.amountPaid))}</td></tr>` : ""}
      ${due != null && due > 0 ? `<tr><td style="padding:4px 8px;color:#dc2626;font-weight:600">Balance Due</td><td style="padding:4px 8px;text-align:right;color:#dc2626;font-weight:600">${esc(inr(due))}</td></tr>` : ""}
    </table>`;

  const bodyBlock = d.body ? `
    <div style="margin-top:24px;padding:16px;background:#f9fafb;border-left:3px solid ${accent};font-size:12px;color:#374151;line-height:1.6">
      ${esc(d.body)}
    </div>` : "";

  const termsBlock = d.terms ? `
    <div style="margin-top:24px">
      <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#6b7280;font-weight:600;margin:0 0 8px 0">Terms &amp; Conditions</p>
      <div style="font-size:11px;color:#374151;line-height:1.6;white-space:pre-wrap">${esc(d.terms)}</div>
    </div>` : "";

  return `
    <div style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:#111827;background:white;width:760px;box-sizing:border-box">
      <!-- Header band -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${accent};padding-bottom:16px">
        <div>
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#6b7280;margin:0 0 4px 0;font-weight:600">${esc(d.studioName)}</p>
          ${d.studioContact ? `<p style="font-size:11px;color:#6b7280;margin:0">${esc(d.studioContact)}</p>` : ""}
        </div>
        <div style="text-align:right">
          <p style="font-size:24px;font-weight:800;color:${accent};margin:0;letter-spacing:1px">${title}</p>
          ${d.number ? `<p style="font-size:12px;color:#374151;margin:4px 0 0 0">${esc(d.number)}</p>` : ""}
        </div>
      </div>

      <!-- Meta -->
      <table style="width:100%;margin-top:20px;font-size:12px">
        <tr>
          <td style="padding:4px 0;color:#6b7280;width:80px">Bill to:</td>
          <td style="padding:4px 0;color:#111827;font-weight:600">${esc(d.clientName)}</td>
          <td style="padding:4px 0;color:#6b7280;width:80px;text-align:right">Status:</td>
          <td style="padding:4px 0;color:#111827;text-transform:uppercase;font-weight:600">${esc(d.status)}</td>
        </tr>
        ${d.date ? `<tr>
          <td style="padding:4px 0;color:#6b7280">${esc(d.dateLabel || "Date")}:</td>
          <td style="padding:4px 0;color:#111827">${esc(fmtDate(d.date))}</td>
          <td></td><td></td>
        </tr>` : ""}
      </table>

      ${itemsTable}
      ${d.kind !== "proposal" ? totals : ""}
      ${d.kind === "proposal" ? `<div style="margin-top:24px;padding:16px;background:#f9fafb;border-radius:8px">
        <p style="font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#6b7280;font-weight:600;margin:0 0 8px 0">Total amount</p>
        <p style="font-size:28px;font-weight:800;color:${accent};margin:0">${esc(inr(d.total))}</p>
      </div>` : ""}
      ${bodyBlock}
      ${termsBlock}

      ${d.notes ? `<div style="margin-top:24px;font-size:11px;color:#6b7280;font-style:italic;border-top:1px dashed #e5e7eb;padding-top:12px">Internal note: ${esc(d.notes)}</div>` : ""}

      <p style="margin-top:32px;text-align:center;font-size:10px;color:#9ca3af">
        Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} · ${esc(d.studioName)}
      </p>
    </div>
  `;
}

export async function generateDocPdf(d: DocPdfData) {
  const filename = `${d.kind}-${(d.number || "doc").replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;

  // Create off-screen container
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.top = "-10000px";
  wrapper.style.left = "0";
  wrapper.style.width = "760px";
  wrapper.style.background = "white";
  wrapper.innerHTML = buildHtml(d);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      backgroundColor: "#ffffff",
      logging: false,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");

    // A4 portrait — 210x297 mm; image scaled by width
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;
    while (heightLeft > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }
    pdf.save(filename);
  } finally {
    document.body.removeChild(wrapper);
  }
}
