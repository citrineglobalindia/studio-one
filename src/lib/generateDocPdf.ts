import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  bank_name?: string | null;
  bank_branch?: string | null;
  bank_account_no?: string | null;
  bank_ifsc?: string | null;
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
  date?: string | null;
  dateLabel?: string;
  items: Array<{ description: string; quantity?: number; rate?: number; amount?: number }>;
  subtotal: number;
  discount?: number;
  taxLabel?: string;
  tax?: number;
  total: number;
  amountPaid?: number;
  body?: string | null;
  terms?: string | null;
  notes?: string | null;
}

const MAROON = "#5e0b21";
const MAROON_DARK = "#430716";
const GOLD = "#c9952b";

function inr2(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n ?? 0));
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try {
    const dt = new Date(d);
    const day = String(dt.getDate()).padStart(2, "0");
    const mon = dt.toLocaleString("en-IN", { month: "short" });
    return `${day}-${mon}-${dt.getFullYear()}`;
  } catch { return d; }
}
function esc(s: string | null | undefined) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#039;").replace(/\n/g, "<br/>");
}
function inrWords(n: number | null | undefined) {
  const v = Math.round(Number(n ?? 0));
  if (v === 0) return "Zero Rupees Only";
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const num = ("000000000" + v).slice(-9).match(/.{1,2}|.{1,3}/g);
  if (!num) return "";
  function w(x: string) {
    const z = parseInt(x);
    if (z === 0) return '';
    return z < 20 ? a[z] : b[Math.floor(z / 10)] + ' ' + a[z % 10];
  }
  let str = '';
  if (Number(num[0]) !== 0) str += w(num[0]) + 'Crore ';
  if (Number(num[1]) !== 0) str += w(num[1]) + 'Lakh ';
  if (Number(num[2]) !== 0) str += w(num[2]) + 'Thousand ';
  if (Number(num[3]) !== 0) str += w(num[3]) + 'Hundred ';
  if (Number(num[4]) !== 0) str += (str ? 'and ' : '') + w(num[4]);
  return str.trim().replace(/\s+/g, ' ') + " Rupees Only";
}
function cleanDesc(desc: string) {
  return (desc || "")
    .replace(/\s*#evt:[0-9a-f-]+#(req:[a-z_]+|custom)\s*$/i, "")
    .replace(/\s*#manual\s*$/i, "")
    .replace(/\s*#svc\s*$/i, "")
    .trim();
}

interface EventInfo { name?: string | null; event_type?: string | null; event_date?: string | null; venue?: string | null; }

function evtIdOf(desc: string): string | null {
  const m = /#evt:([0-9a-f-]+)#/i.exec(desc || "");
  return m ? m[1] : null;
}

function buildHtml(d: DocPdfData, eventsById: Record<string, EventInfo> = {}): string {
  const titleMap: Record<DocPdfKind, string> = { estimation: "ESTIMATION", proposal: "PROPOSAL", invoice: "INVOICE" };
  const noLabelMap: Record<DocPdfKind, string> = { estimation: "Estimation No.", proposal: "Proposal No.", invoice: "Invoice No." };
  const title = titleMap[d.kind];
  const numLabel = noLabelMap[d.kind];

  const coupleName = d.client.partner_name ? `${d.client.name} & ${d.client.partner_name}` : d.client.name;
  const studioAddress = [d.studio.address, d.studio.city].filter(Boolean).map(esc).join(", ");

  // Group items by their event marker so requirements show under each event
  type Line = { description: string; quantity: number; rate: number; amount: number; isReq: boolean };
  const groups = new Map<string, { info: EventInfo; lines: Line[]; amount: number }>();
  const manualLines: Line[] = [];
  const serviceLines: Line[] = [];
  let totalQty = 0;

  for (const raw of (d.items || [])) {
    const desc = cleanDesc(raw.description);
    if (!desc) continue;
    const qty = Number(raw.quantity || 1);
    const amt = Number(raw.amount ?? 0);
    const rate = Number(raw.rate ?? raw.amount ?? 0);
    const isReq = /#req:/i.test(raw.description || "");
    totalQty += qty;
    const evt = evtIdOf(raw.description);
    const isManual = /#manual/i.test(raw.description || "");
    const isSvc = /#svc\s*$/i.test(raw.description || "");
    if (isSvc) {
      serviceLines.push({ description: desc, quantity: qty, rate, amount: amt, isReq: false });
      continue;
    }
    if (isManual || !evt) {
      manualLines.push({ description: desc, quantity: qty, rate, amount: amt, isReq: false });
      continue;
    }
    if (!groups.has(evt)) groups.set(evt, { info: eventsById[evt] || {}, lines: [], amount: 0 });
    const g = groups.get(evt)!;
    g.lines.push({ description: desc, quantity: qty, rate, amount: amt, isReq });
    g.amount += amt;
  }

  // The single "final amount" (manual) is the package price — attribute to the doc, shown as its own row.
  const manualAmount = manualLines.reduce((s, l) => s + l.amount, 0);

  let rowNo = 0;
  const groupRows = Array.from(groups.values()).map((g) => {
    rowNo += 1;
    const headLabel = g.info.name || g.info.event_type || "Event";
    const sub = [g.info.event_type && g.info.event_type !== headLabel ? g.info.event_type : null,
                 g.info.event_date ? fmtDate(g.info.event_date) : null,
                 g.info.venue || null].filter(Boolean).map(esc).join(" · ");
    const reqLines = g.lines.map((l) => `
      <div style="display:flex;justify-content:space-between;padding:1px 0;font-size:10.5px;color:#333">
        <span>• ${esc(l.description)}${l.quantity > 1 ? ` <span style="color:#888">×${l.quantity}</span>` : ""}</span>
        ${l.amount > 0 ? `<span style="color:#111;font-weight:500">${inr2(l.amount)}</span>` : ""}
      </div>`).join("");
    return `
    <tr>
      <td style="border:1px solid #111;padding:6px;text-align:center;vertical-align:top;font-style:italic">${rowNo}</td>
      <td style="border:1px solid #111;padding:6px 8px;vertical-align:top">
        <p style="margin:0;font-weight:bold;font-style:italic;font-size:12px">${esc(headLabel)}</p>
        ${sub ? `<p style="margin:1px 0 4px 0;font-size:10px;color:#666">${sub}</p>` : ""}
        <div style="margin-top:3px">${reqLines || '<span style="font-size:10px;color:#999">No requirements listed</span>'}</div>
      </td>
      <td style="border:1px solid #111;padding:6px;text-align:center;vertical-align:top">1</td>
      <td style="border:1px solid #111;padding:6px;text-align:center;vertical-align:top">no.s</td>
      <td style="border:1px solid #111;padding:6px 8px;text-align:right;vertical-align:top">${g.amount > 0 ? inr2(g.amount) : "0.00"}</td>
      <td style="border:1px solid #111;padding:6px 8px;text-align:right;vertical-align:top">${g.amount > 0 ? inr2(g.amount) : "0.00"}</td>
    </tr>`;
  }).join("");

  const serviceRowsHtml = serviceLines.map((l) => {
    rowNo += 1;
    const nl = l.description.indexOf("\n");
    const svcTitle = nl >= 0 ? l.description.slice(0, nl) : l.description;
    const svcDesc = nl >= 0 ? l.description.slice(nl + 1) : "";
    return `
    <tr>
      <td style="border:1px solid #111;padding:6px;text-align:center;vertical-align:top;font-style:italic">${rowNo}</td>
      <td style="border:1px solid #111;padding:6px 8px;vertical-align:top">
        <p style="margin:0;font-weight:bold;font-style:italic;font-size:12px">${esc(svcTitle)}</p>
        ${svcDesc ? `<div style="margin-top:2px;font-size:10.5px;color:#333;line-height:1.45">${esc(svcDesc)}</div>` : ""}
      </td>
      <td style="border:1px solid #111;padding:6px;text-align:center;vertical-align:top">${l.quantity || 1}</td>
      <td style="border:1px solid #111;padding:6px;text-align:center;vertical-align:top">no.s</td>
      <td style="border:1px solid #111;padding:6px 8px;text-align:right;vertical-align:top">${inr2(l.rate)}</td>
      <td style="border:1px solid #111;padding:6px 8px;text-align:right;vertical-align:top">${inr2(l.amount)}</td>
    </tr>`;
  }).join("");

  const manualRow = manualAmount > 0 ? `
    <tr>
      <td style="border:1px solid #111;padding:6px;text-align:center;vertical-align:top;font-style:italic">${rowNo + 1}</td>
      <td style="border:1px solid #111;padding:6px 8px;vertical-align:top"><span style="font-weight:bold;font-style:italic">Package Amount</span></td>
      <td style="border:1px solid #111;padding:6px;text-align:center">1</td>
      <td style="border:1px solid #111;padding:6px;text-align:center">no.s</td>
      <td style="border:1px solid #111;padding:6px 8px;text-align:right">${inr2(manualAmount)}</td>
      <td style="border:1px solid #111;padding:6px 8px;text-align:right">${inr2(manualAmount)}</td>
    </tr>` : "";

  const itemRows = groupRows + serviceRowsHtml + manualRow;

  const hasBank = !!(d.studio.bank_name || d.studio.bank_branch || d.studio.bank_account_no || d.studio.bank_ifsc);
  const totalRows = (d.kind === "invoice" && d.amountPaid != null) ? 3 : 1;
  const balanceDue = Math.max(0, d.total - (d.amountPaid || 0));
  const dueLine = (d.kind === "invoice" && d.amountPaid != null)
    ? `<tr><td style="border:1px solid #111;padding:3px 10px;text-align:right;color:#444">Amount Paid</td><td style="border:1px solid #111;padding:3px 10px;text-align:right">${inr2(d.amountPaid)}</td></tr>
       <tr><td style="border:1px solid #111;padding:3px 10px;text-align:right;font-weight:bold;color:${MAROON}">Balance Due</td><td style="border:1px solid #111;padding:3px 10px;text-align:right;font-weight:bold;color:${MAROON}">${inr2(Math.max(0, d.total - (d.amountPaid || 0)))}</td></tr>`
    : "";

  return `
  <div style="font-family:Georgia, 'Times New Roman', serif;color:#1a1a1a;background:#fff;width:794px;box-sizing:border-box">

    <div style="position:relative;background:linear-gradient(135deg, ${MAROON} 0%, ${MAROON_DARK} 100%);padding:18px 20px;min-height:70px;text-align:center;border:2px solid #111;border-bottom:none">
      <div style="position:absolute;right:18px;top:14px;color:#fff;font-size:11px;font-weight:bold;letter-spacing:0.5px">
        ${d.studio.phone ? `PHONE - ${esc(d.studio.phone)}` : ""}
      </div>
      ${d.studio.logo_url
        ? `<img src="${esc(d.studio.logo_url)}" crossorigin="anonymous" style="max-height:56px;display:inline-block" />`
        : `<div style="color:${GOLD};font-size:34px;font-weight:bold;letter-spacing:3px;font-family:Georgia,serif">${esc(d.studio.name)}</div>`}
    </div>
    <div style="background:${MAROON};color:#fff;text-align:center;padding:7px 10px;font-size:10.5px;font-weight:bold;letter-spacing:0.4px;border:2px solid #111;border-top:none">
      ${studioAddress || ""}${d.studio.gst_number ? ` &nbsp;|&nbsp; GSTIN: ${esc(d.studio.gst_number)}` : ""}
    </div>

    <h1 style="text-align:center;font-style:italic;font-weight:bold;font-size:26px;margin:22px 0 6px;letter-spacing:1px">${title}</h1>

    <div style="text-align:right;padding:0 6px 12px 0;font-size:12px;line-height:1.7">
      <p style="margin:0"><b style="font-style:italic">${numLabel} :</b> <span style="font-weight:bold;font-size:15px">${esc(d.number || "—")} ${esc(coupleName)}</span></p>
      <p style="margin:0"><b style="font-style:italic">Date :</b> ${esc(fmtDate(d.date || new Date().toISOString()))}</p>
      ${d.notes ? `<p style="margin:0"><b style="font-style:italic">Ref. :</b> ${esc(d.notes)}</p>` : ""}
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-bottom:0">
      <tr>
        <td style="border:1px solid #111;padding:7px 10px;width:50%;vertical-align:top">
          <p style="margin:0 0 4px 0;font-weight:bold;font-style:italic">Billing Address</p>
          <p style="margin:0;font-weight:bold">Mr. ${esc(coupleName)}</p>
          <p style="margin:0">${esc(d.client.address || ".")}</p>
          <p style="margin:0">${esc(d.client.city || "")}</p>
          <p style="margin:5px 0 0 0"><b style="font-style:italic">Phone :</b> ${esc(d.client.phone || d.client.partner_phone || "")}</p>
        </td>
        <td style="border:1px solid #111;padding:7px 10px;width:50%;vertical-align:top">
          <p style="margin:0 0 4px 0;font-weight:bold;font-style:italic">Shipping Address</p>
          <p style="margin:0;font-weight:bold">Mr. ${esc(coupleName)}</p>
          <p style="margin:0">${esc(d.client.address || ".")}</p>
          <p style="margin:0">${esc(d.client.city || "")}</p>
          <p style="margin:5px 0 0 0"><b style="font-style:italic">Phone :</b> ${esc(d.client.phone || d.client.partner_phone || "")}</p>
        </td>
      </tr>
    </table>

    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:-1px">
      <thead>
        <tr style="background:#f3f3f3">
          <th style="border:1px solid #111;padding:6px;width:34px;font-style:italic">No.</th>
          <th style="border:1px solid #111;padding:6px;text-align:left;font-style:italic">Item &amp; Description</th>
          <th style="border:1px solid #111;padding:6px;width:42px;font-style:italic">Qty</th>
          <th style="border:1px solid #111;padding:6px;width:50px;font-style:italic">Unit</th>
          <th style="border:1px solid #111;padding:6px;width:100px;font-style:italic">Rate (₹)</th>
          <th style="border:1px solid #111;padding:6px;width:110px;font-style:italic">Amount (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows || `<tr><td colspan="6" style="border:1px solid #111;padding:14px;text-align:center;color:#888">No line items</td></tr>`}
      </tbody>
    </table>

    <table style="width:100%;border-collapse:collapse;font-size:11.5px;margin-top:-1px">
      <tr>
        ${hasBank ? `<td style="border:1px solid #111;padding:6px 10px;text-align:left;vertical-align:top;width:33%" rowspan="${totalRows}">
          <p style="margin:0 0 3px 0;font-weight:bold;font-style:italic">Bank Details :</p>
          ${d.studio.bank_name ? `<p style="margin:0">Bank Name : ${esc(d.studio.bank_name)}</p>` : ""}
          ${d.studio.bank_branch ? `<p style="margin:0">Branch : ${esc(d.studio.bank_branch)}</p>` : ""}
          ${d.studio.bank_account_no ? `<p style="margin:0">Account No. : ${esc(d.studio.bank_account_no)}</p>` : ""}
          ${d.studio.bank_ifsc ? `<p style="margin:0">IFSC : ${esc(d.studio.bank_ifsc)}</p>` : ""}
        </td>` : ""}
        <td style="border:1px solid #111;padding:6px 10px;text-align:left;vertical-align:top" rowspan="${totalRows}">
          <span style="font-style:italic;color:#444">Total Invoice Amount in Words :</span><br/><b>${esc(inrWords(d.total))}</b>
        </td>
        <td style="border:1px solid #111;padding:6px 10px;text-align:right;font-weight:bold;font-style:italic;width:140px">Grand Total (₹)</td>
        <td style="border:1px solid #111;padding:6px 10px;text-align:right;font-weight:bold;width:110px;font-size:13px">${inr2(d.total)}</td>
      </tr>
      ${dueLine}
    </table>

    ${d.terms ? `
    <div style="border:1px solid #111;border-top:none;padding:8px 10px;font-size:10.5px;line-height:1.55">
      <p style="margin:0 0 5px 0;font-weight:bold;font-style:italic;font-size:11.5px">Terms &amp; Conditions :</p>
      <div style="white-space:pre-wrap;color:#222">${esc(d.terms)}</div>
    </div>` : ""}

    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:-1px">
      <tr>
        <td style="border:1px solid #111;padding:8px 10px;width:45%;vertical-align:top">
          <p style="margin:0"><b style="font-style:italic">Total Qty :</b> ${totalQty}</p>
          <p style="margin:3px 0"><b style="font-style:italic">Status :</b> ${d.kind === "invoice" ? (balanceDue > 0 ? `<b>₹ ${inr2(balanceDue)} Pending</b>` : `<b style="color:#0a7d2c">Paid</b>`) : `₹ ${esc(d.status)}`}</p>
          <p style="margin:8px 0 0 0;font-style:italic;color:#555">This is a computer-generated ${d.kind}. E. &amp; O. E.</p>
        </td>
        <td style="border:1px solid #111;padding:8px 10px;width:20%;text-align:center;vertical-align:middle;color:#999;font-style:italic">QR Code</td>
        <td style="border:1px solid #111;padding:8px 10px;width:35%;text-align:right;vertical-align:bottom">
          <p style="margin:0 0 34px 0">For, <b>${esc(d.studio.name)}</b></p>
          <p style="margin:0;font-weight:bold;font-style:italic;border-top:1px solid #111;display:inline-block;padding-top:3px">Authorised Signatory</p>
        </td>
      </tr>
    </table>

  </div>`;
}

async function imageToDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function generateDocPdf(d: DocPdfData, mode: "download" | "open" = "download") {
  const filename = `${d.kind}-${(d.number || "doc").replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
  let loadingId: string | number | undefined;
  let wrapper: HTMLDivElement | null = null;
  // Open the preview tab synchronously NOW (inside the click gesture) so it isn't popup-blocked.
  const previewWin = mode === "open" ? window.open("about:blank", "_blank") : null;
  const setProgress = (pct: number, msg?: string) => {
    if (!previewWin || previewWin.closed) return;
    try {
      const pctEl = previewWin.document.getElementById("pdf-pct");
      const barEl = previewWin.document.getElementById("pdf-bar");
      const msgEl = previewWin.document.getElementById("pdf-msg");
      if (pctEl) pctEl.textContent = Math.round(pct) + "%";
      if (barEl) (barEl as HTMLElement).style.width = pct + "%";
      if (msg && msgEl) msgEl.textContent = msg;
    } catch (_e) { /* ignore */ }
  };
  if (previewWin) {
    try {
      previewWin.document.open();
      previewWin.document.write(`<!doctype html><html><head><title>Preparing PDF…</title><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background:#f6f7f9;font-family:system-ui,-apple-system,sans-serif">
  <div style="width:280px;text-align:center">
    <div style="width:54px;height:54px;margin:0 auto 18px;border-radius:14px;background:linear-gradient(135deg,#5e0b21,#430716);display:flex;align-items:center;justify-content:center;color:#c9952b;font-weight:bold;font-size:20px;font-family:Georgia,serif">PDF</div>
    <div style="font-weight:600;font-size:14px;color:#333;margin-bottom:4px">Preparing your document</div>
    <div id="pdf-msg" style="font-size:11px;color:#888;margin-bottom:12px">Starting…</div>
    <div style="height:8px;background:#e6e7ea;border-radius:99px;overflow:hidden">
      <div id="pdf-bar" style="height:100%;width:5%;background:linear-gradient(90deg,#5e0b21,#9c1740);border-radius:99px;transition:width .35s ease"></div>
    </div>
    <div id="pdf-pct" style="margin-top:8px;font-size:12px;font-weight:600;color:#5e0b21;font-variant-numeric:tabular-nums">5%</div>
  </div>
</body></html>`);
      previewWin.document.close();
    } catch (_e) { /* ignore */ }
  }
  try {
    loadingId = toast.loading(`Preparing ${d.kind} PDF…`);

    setProgress(15, "Loading studio details…");
    let safeData = d;
    if (d.studio.logo_url) {
      const dataUrl = await imageToDataUrl(d.studio.logo_url);
      safeData = { ...d, studio: { ...d.studio, logo_url: dataUrl } };
    }

    wrapper = document.createElement("div");
    wrapper.style.position = "fixed";
    wrapper.style.top = "-10000px";
    wrapper.style.left = "0";
    wrapper.style.width = "794px";
    wrapper.style.background = "white";
    // Fetch event names for grouping requirements under each event
    const evtIds = Array.from(new Set((d.items || [])
      .map((it) => { const m = /#evt:([0-9a-f-]+)#/i.exec(it.description || ""); return m ? m[1] : null; })
      .filter(Boolean) as string[]));
    setProgress(35, "Fetching event details…");
    let eventsById: Record<string, any> = {};
    if (evtIds.length) {
      try {
        const { data: evs } = await (supabase as any).from("events").select("id,name,event_type,event_date,venue").in("id", evtIds);
        for (const ev of (evs ?? [])) eventsById[ev.id] = ev;
      } catch (_e) { /* names optional */ }
    }
    setProgress(55, "Laying out document…");
    wrapper.innerHTML = buildHtml(safeData, eventsById);
    document.body.appendChild(wrapper);

    await new Promise((r) => setTimeout(r, 60));
    setProgress(70, "Rendering…");
    const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: "#ffffff", logging: false, useCORS: true, allowTaint: false });
    setProgress(90, "Building PDF…");
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

    if (mode === "open") {
      setProgress(100, "Opening…");
      const blob = pdf.output("blob") as Blob;
      const blobUrl = URL.createObjectURL(blob);
      if (previewWin && !previewWin.closed) {
        // Replace the placeholder document with the PDF
        try { previewWin.location.replace(blobUrl); }
        catch (_e) { previewWin.location.href = blobUrl; }
        if (loadingId !== undefined) toast.dismiss(loadingId);
        toast.success(`Opened ${filename}`);
      } else {
        const win = window.open(blobUrl, "_blank");
        if (!win) { pdf.save(filename); if (loadingId !== undefined) toast.dismiss(loadingId); toast.success(`Popup blocked — downloaded ${filename}`); }
        else { if (loadingId !== undefined) toast.dismiss(loadingId); toast.success(`Opened ${filename}`); }
      }
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } else {
      pdf.save(filename);
      if (loadingId !== undefined) toast.dismiss(loadingId);
      toast.success(`Downloaded ${filename}`);
    }
  } catch (err: any) {
    console.error("PDF generation failed:", err);
    if (previewWin && !previewWin.closed) { try { previewWin.close(); } catch (_e) { /* ignore */ } }
    if (loadingId !== undefined) toast.dismiss(loadingId);
    toast.error(`Couldn't generate PDF: ${err?.message || "unknown error"}`);
  } finally {
    if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  }
}
