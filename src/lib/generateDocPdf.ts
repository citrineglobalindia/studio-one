import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export type DocPdfKind = "estimation" | "proposal" | "invoice";

export interface DocPdfStudio {
  name: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  gst_number?: string | null;
  logo_url?: string | null;
}

export interface DocPdfClient {
  name: string;
  partner_name?: string | null;
  phone?: string | null;
  email?: string | null;
  partner_phone?: string | null;
  partner_email?: string | null;
  address?: string | null;
  city?: string | null;
}

export interface DocPdfData {
  kind: DocPdfKind;
  studio: DocPdfStudio;
  client: DocPdfClient;
  number?: string | null;
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
function inrWords(n: number | null | undefined) {
  // Quick "in words" using Indian numbering
  const v = Math.round(Number(n ?? 0));
  if (v === 0) return "Zero rupees only";
  const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const num = ("000000000" + v).slice(-9).match(/.{1,2}|.{1,3}/g);
  if (!num) return "";
  function w(n: string) {
    const x = parseInt(n);
    if (x === 0) return '';
    if (x < 20) return a[x];
    return b[Math.floor(x / 10)] + (x % 10 ? '-' + a[x % 10].trim() : '');
  }
  let str = '';
  if (Number(num[0]) !== 0) str += w(num[0]) + 'crore ';
  if (Number(num[1]) !== 0) str += w(num[1]) + 'lakh ';
  if (Number(num[2]) !== 0) str += w(num[2]) + 'thousand ';
  if (Number(num[3]) !== 0) str += w(num[3]) + 'hundred ';
  if (Number(num[4]) !== 0) str += (str ? 'and ' : '') + w(num[4]);
  return str.trim().replace(/\s+/g, ' ').replace(/^./, (m) => m.toUpperCase()) + " rupees only";
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
  const accentBg = d.kind === "invoice" ? "#ecfdf5" : d.kind === "proposal" ? "#f5f3ff" : "#fffbeb";
  const due = d.amountPaid != null ? d.total - d.amountPaid : null;

  const coupleName = d.client.partner_name ? `${d.client.name} & ${d.client.partner_name}` : d.client.name;

  // Strip markers; group items by event (parsed from description prefix)
  const cleanItems = d.items.map((it) => {
    let desc = (it.description || "").replace(/\s*#evt:[a-f0-9-]+#(req:[a-z_]+|custom)\s*$/i, "").replace(/\s*#manual\s*$/, "").trim();
    return { ...it, description: desc };
  }).filter((it) => !it.description.includes("Package amount") || (d.kind === "proposal"));

  // For estimate/invoice: requirements listed without prices (since the total is the single final amount)
  // For proposal: just show the included items
  const itemsList = cleanItems.length > 0
    ? `<ul style="margin:6px 0 0 0;padding:0;list-style:none">
        ${cleanItems.map((it) => {
          return `<li style="padding:5px 8px;font-size:11.5px;color:#374151;border-bottom:1px solid #f3f4f6;display:flex;justify-content:space-between">
            <span>${esc(it.description)}${it.quantity && it.quantity > 1 ? ` <span style="color:#9ca3af">× ${it.quantity}</span>` : ""}</span>
            ${(it.amount && it.amount > 0) ? `<span style="color:#111827;font-weight:500">${esc(inr(it.amount))}</span>` : ""}
          </li>`;
        }).join("")}
      </ul>`
    : "";

  return `
    <div style="padding:32px;font-family:'Helvetica Neue', Arial, sans-serif;color:#111827;background:white;width:760px;box-sizing:border-box">

      <!-- TOP BAND: STUDIO ↔ DOC LABEL -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:4px solid ${accent}">
        <div style="max-width:60%">
          ${d.studio.logo_url ? `<img src="${esc(d.studio.logo_url)}" style="max-height:48px;display:block;margin-bottom:8px" crossorigin="anonymous" />` : ""}
          <p style="font-size:18px;font-weight:800;color:#111827;margin:0;letter-spacing:0.3px">${esc(d.studio.name)}</p>
          <p style="font-size:10.5px;color:#6b7280;margin:2px 0 0 0;line-height:1.55">
            ${[d.studio.address, d.studio.city].filter(Boolean).map(esc).join(" · ") || ""}<br/>
            ${[d.studio.phone, d.studio.email, d.studio.website].filter(Boolean).map(esc).join(" · ") || ""}
            ${d.studio.gst_number ? `<br/><span style="color:#6b7280">GST: ${esc(d.studio.gst_number)}</span>` : ""}
          </p>
        </div>
        <div style="text-align:right">
          <div style="display:inline-block;padding:6px 14px;background:${accentBg};color:${accent};font-size:11px;font-weight:700;letter-spacing:2.5px;border-radius:4px;border:1px solid ${accent}33">${title}</div>
          ${d.number ? `<p style="font-size:13px;color:#111827;margin:8px 0 0 0;font-weight:600">${esc(d.number)}</p>` : ""}
          <p style="font-size:10.5px;color:#6b7280;margin:4px 0 0 0">
            Date: ${esc(fmtDate(new Date().toISOString().slice(0,10)))}
            ${d.date ? `<br/>${esc(d.dateLabel || "Date")}: <span style="color:#111827;font-weight:500">${esc(fmtDate(d.date))}</span>` : ""}
          </p>
          <div style="display:inline-block;margin-top:8px;padding:3px 10px;background:#f3f4f6;color:#374151;font-size:9.5px;font-weight:600;letter-spacing:1px;border-radius:3px;text-transform:uppercase">${esc(d.status)}</div>
        </div>
      </div>

      <!-- CLIENT / BILL TO -->
      <div style="display:flex;gap:16px;margin-top:18px">
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:6px;padding:12px 14px;background:#fafafa">
          <p style="font-size:9.5px;color:#6b7280;margin:0 0 6px 0;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">${d.kind === "invoice" ? "Bill to" : "Prepared for"}</p>
          <p style="font-size:14px;color:#111827;margin:0;font-weight:700">${esc(coupleName)}</p>
          ${d.client.phone || d.client.partner_phone ? `<p style="font-size:11px;color:#374151;margin:6px 0 0 0">📞 ${esc([d.client.phone, d.client.partner_phone].filter(Boolean).join(" / "))}</p>` : ""}
          ${d.client.email || d.client.partner_email ? `<p style="font-size:11px;color:#374151;margin:2px 0 0 0">✉ ${esc([d.client.email, d.client.partner_email].filter(Boolean).join(" / "))}</p>` : ""}
          ${d.client.address || d.client.city ? `<p style="font-size:11px;color:#374151;margin:2px 0 0 0">📍 ${esc([d.client.address, d.client.city].filter(Boolean).join(", "))}</p>` : ""}
        </div>
        <div style="flex:1;border:1px solid ${accent};border-radius:6px;padding:12px 14px;background:${accentBg}">
          <p style="font-size:9.5px;color:${accent};margin:0 0 6px 0;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">${d.kind === "invoice" ? "Amount due" : "Total amount"}</p>
          <p style="font-size:24px;color:${accent};margin:0;font-weight:800;letter-spacing:-0.5px">${esc(inr(d.kind === "invoice" && due != null ? due : d.total))}</p>
          ${d.tax && d.tax > 0 ? `<p style="font-size:10px;color:${accent};margin:2px 0 0 0;opacity:0.8">inclusive of ${esc(d.taxLabel || "tax")}</p>` : ""}
        </div>
      </div>

      <!-- WHAT'S INCLUDED -->
      ${itemsList ? `
        <div style="margin-top:18px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
          <div style="background:#f9fafb;padding:8px 14px;border-bottom:1px solid #e5e7eb">
            <p style="font-size:10px;color:#6b7280;margin:0;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">What's included</p>
          </div>
          <div style="padding:6px 14px">${itemsList}</div>
        </div>
      ` : ""}

      <!-- BODY (proposals) -->
      ${d.body ? `
        <div style="margin-top:18px;padding:14px 16px;background:#f9fafb;border-left:3px solid ${accent};font-size:11.5px;color:#374151;line-height:1.65;border-radius:0 4px 4px 0">
          <p style="font-size:9.5px;color:${accent};margin:0 0 6px 0;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">Scope &amp; deliverables</p>
          ${esc(d.body)}
        </div>
      ` : ""}

      <!-- TOTALS BREAKDOWN -->
      <div style="display:flex;justify-content:flex-end;margin-top:18px">
        <table style="width:280px;font-size:11.5px;border-collapse:collapse">
          <tr><td style="padding:5px 0;color:#6b7280">Subtotal</td><td style="padding:5px 0;text-align:right">${esc(inr(d.subtotal))}</td></tr>
          ${d.discount && d.discount > 0 ? `<tr><td style="padding:5px 0;color:#6b7280">Discount</td><td style="padding:5px 0;text-align:right;color:#dc2626">- ${esc(inr(d.discount))}</td></tr>` : ""}
          ${d.tax && d.tax > 0 ? `<tr><td style="padding:5px 0;color:#6b7280">${esc(d.taxLabel || "Tax")}</td><td style="padding:5px 0;text-align:right">+ ${esc(inr(d.tax))}</td></tr>` : ""}
          <tr style="border-top:2px solid #111827"><td style="padding:8px 0;font-weight:700;color:#111827">Total</td><td style="padding:8px 0;text-align:right;font-weight:700;font-size:14px">${esc(inr(d.total))}</td></tr>
          ${d.amountPaid && d.amountPaid > 0 ? `
            <tr><td style="padding:5px 0;color:#059669">Amount paid</td><td style="padding:5px 0;text-align:right;color:#059669">- ${esc(inr(d.amountPaid))}</td></tr>
            ${due != null && due > 0 ? `<tr style="border-top:1px solid #fca5a5;background:#fef2f2"><td style="padding:8px;font-weight:700;color:#dc2626">Balance due</td><td style="padding:8px;text-align:right;font-weight:700;color:#dc2626">${esc(inr(due))}</td></tr>` : ""}
          ` : ""}
        </table>
      </div>
      <p style="text-align:right;margin-top:4px;font-size:10px;color:#6b7280;font-style:italic">${esc(inrWords(d.total))}</p>

      <!-- TERMS -->
      ${d.terms ? `
        <div style="margin-top:22px;border:1px solid #e5e7eb;border-radius:6px;padding:14px 16px;background:#fafafa">
          <p style="font-size:9.5px;color:#6b7280;margin:0 0 8px 0;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">Terms &amp; conditions</p>
          <div style="font-size:10.5px;color:#374151;line-height:1.7;white-space:pre-wrap">${esc(d.terms)}</div>
        </div>
      ` : ""}

      ${d.notes ? `
        <div style="margin-top:14px;font-size:10.5px;color:#6b7280;font-style:italic;border-top:1px dashed #e5e7eb;padding-top:10px">
          <strong style="color:#374151;font-style:normal">Note:</strong> ${esc(d.notes)}
        </div>
      ` : ""}

      <!-- SIGNATURE FOOTER -->
      <div style="margin-top:30px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:flex-end">
        <div>
          <p style="font-size:9.5px;color:#9ca3af;margin:0">Thank you for choosing</p>
          <p style="font-size:13px;color:#111827;font-weight:700;margin:2px 0 0 0">${esc(d.studio.name)}</p>
        </div>
        <div style="text-align:right">
          <div style="height:36px;width:160px;border-bottom:1px solid #9ca3af;margin-bottom:4px"></div>
          <p style="font-size:9.5px;color:#6b7280;margin:0">Authorized signature</p>
        </div>
      </div>

      <p style="margin-top:18px;text-align:center;font-size:9px;color:#d1d5db">
        Generated ${esc(new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }))}
      </p>
    </div>
  `;
}

export async function generateDocPdf(d: DocPdfData) {
  const filename = `${d.kind}-${(d.number || "doc").replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
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
      scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
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
