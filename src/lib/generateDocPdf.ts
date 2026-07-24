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
  docId?: string | null;
  issueDate?: string | null;
  payments?: Array<{ paid_on?: string | null; description?: string | null; method?: string | null; amount?: number }>;
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
  const title = titleMap[d.kind];
  const coupleName = d.client.partner_name ? `${d.client.name} & ${d.client.partner_name}` : d.client.name;
  const addressLines = [d.studio.address, d.studio.city].filter(Boolean).map(esc).join("<br/>");

  const TEAL = "#0d9488";
  const RED = "#dc2626";
  const BLACK = "#111827";

  // ── Group items ──
  type Line = { description: string; quantity: number; rate: number; amount: number };
  const groups = new Map<string, { info: EventInfo; lines: Line[]; amount: number }>();
  const serviceLines: Line[] = [];
  const manualLines: Line[] = [];
  let totalQty = 0;

  for (const raw of (d.items || [])) {
    const desc = cleanDesc(raw.description);
    if (!desc) continue;
    const qty = Number(raw.quantity || 1);
    const amt = Number(raw.amount ?? 0);
    const rate = Number(raw.rate ?? raw.amount ?? 0);
    totalQty += qty;
    const isSvc = /#svc\s*$/i.test(raw.description || "");
    const isManual = /#manual/i.test(raw.description || "");
    const evt = evtIdOf(raw.description);
    if (isSvc) { serviceLines.push({ description: desc, quantity: qty, rate, amount: amt }); continue; }
    if (isManual || !evt) { manualLines.push({ description: desc, quantity: qty, rate, amount: amt }); continue; }
    if (!groups.has(evt)) groups.set(evt, { info: eventsById[evt] || {}, lines: [], amount: 0 });
    const g = groups.get(evt)!;
    g.lines.push({ description: desc, quantity: qty, rate, amount: amt });
    g.amount += amt;
  }
  const manualAmount = manualLines.reduce((s2, l) => s2 + l.amount, 0);

  const cellTop = "padding:9px 8px;vertical-align:top;border-bottom:1px solid #e5e7eb";
  const cellQty = "padding:9px 6px;vertical-align:middle;text-align:center;border-bottom:1px solid #e5e7eb;font-weight:600";
  const cellAmt = "padding:9px 8px;vertical-align:top;text-align:right;border-bottom:1px solid #e5e7eb;white-space:nowrap";

  const groupRows = Array.from(groups.values()).map((g) => {
    const headLabel = g.info.name || g.info.event_type || "Event";
    const sub = [g.info.event_date ? fmtDate(g.info.event_date) : null, g.info.venue || null].filter(Boolean).map(esc).join(" · ");
    const reqs = g.lines.map((l) => `<div style="padding:1px 0;color:#374151;font-size:10.5px">${esc(l.description)}${l.quantity > 1 ? ` <span style="color:#9ca3af">×${l.quantity}</span>` : ""}</div>`).join("");
    return `
    <tr>
      <td style="${cellQty}">1</td>
      <td style="${cellTop}">
        <div style="color:${RED};font-weight:800;text-transform:uppercase;letter-spacing:.3px;font-size:12px">${esc(headLabel)}</div>
        ${sub ? `<div style="font-size:9.5px;color:#9ca3af;margin:1px 0 3px">${sub}</div>` : ""}
        <div style="margin-top:3px">${reqs || '<span style="font-size:10px;color:#9ca3af">—</span>'}</div>
      </td>
      <td style="${cellAmt}">${g.amount > 0 ? "₹ " + inr2(g.amount) : "₹ 0.00"}</td>
      <td style="${cellAmt}">${g.amount > 0 ? "₹ " + inr2(g.amount) : "₹ 0.00"}</td>
    </tr>`;
  }).join("");

  const serviceRows = serviceLines.map((l) => {
    const nl = l.description.indexOf("\n");
    const t = nl >= 0 ? l.description.slice(0, nl) : l.description;
    const dsc = nl >= 0 ? l.description.slice(nl + 1) : "";
    return `
    <tr>
      <td style="${cellQty}">${l.quantity || 1}</td>
      <td style="${cellTop}">
        <div style="font-weight:700;font-size:12px;color:#111827">${esc(t)}</div>
        ${dsc ? `<div style="margin-top:2px;color:#374151;font-size:10.5px;line-height:1.5">${esc(dsc)}</div>` : ""}
      </td>
      <td style="${cellAmt}">₹ ${inr2(l.rate)}</td>
      <td style="${cellAmt}">₹ ${inr2(l.amount)}</td>
    </tr>`;
  }).join("");

  const manualRow = manualAmount > 0 ? `
    <tr>
      <td style="${cellQty}">1</td>
      <td style="${cellTop}"><div style="font-weight:700;font-size:12px">Package Amount</div></td>
      <td style="${cellAmt}">₹ ${inr2(manualAmount)}</td>
      <td style="${cellAmt}">₹ ${inr2(manualAmount)}</td>
    </tr>` : "";

  const itemBody = groupRows + serviceRows + manualRow;
  const groupLabel = itemBody
    ? `<tr><td colspan="4" style="background:#f1f5f9;color:${RED};font-weight:800;font-size:12px;padding:6px 12px">All Events :-</td></tr>`
    : "";
  const rows = itemBody
    ? groupLabel + itemBody
    : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#9ca3af">No line items</td></tr>`;

  const advance = Number(d.amountPaid || 0);
  const balance = Math.max(0, d.total - advance);

  const paymentRows = (d.payments || []).filter((p) => Number(p.amount || 0) !== 0).map((p) => `
    <tr>
      <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;white-space:nowrap">${esc(fmtDate(p.paid_on))}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb">${esc(p.description || `Payment for ${coupleName}`)}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;text-transform:uppercase;font-size:10px;color:#4b5563">${esc(p.method || "—")}</td>
      <td style="padding:7px 8px;border-bottom:1px solid #e5e7eb;text-align:right;white-space:nowrap;font-weight:600;color:#16a34a">₹ ${inr2(p.amount)}</td>
    </tr>`).join("");

  const totalRow = (label: string, val: string, bg?: string) => `
    <tr${bg ? ` style="background:${bg};color:#fff"` : ""}>
      <td style="padding:${bg ? "9px" : "6px"} 12px;text-align:left;font-weight:${bg ? "800" : "500"};${bg ? "" : "color:#374151"}">${label}</td>
      <td style="padding:${bg ? "9px" : "6px"} 12px;text-align:right;font-weight:${bg ? "800" : "600"};white-space:nowrap">${val}</td>
    </tr>`;

  return `
  <div style="font-family:'Helvetica Neue',Arial,sans-serif;color:#1f2937;background:#fff;width:794px;padding:34px 36px;box-sizing:border-box;font-size:12px">

    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #111827;padding-bottom:16px">
      <div style="max-width:58%">
        <div style="font-size:17px;font-weight:800;letter-spacing:.3px;color:#111827">${esc(d.studio.name)}</div>
        ${addressLines ? `<div style="font-size:10.5px;color:#4b5563;line-height:1.55;margin-top:4px">${addressLines}</div>` : ""}
        ${d.studio.phone ? `<div style="font-size:11px;color:#4b5563;margin-top:3px;font-weight:600">${esc(d.studio.phone)}</div>` : ""}
        ${d.studio.gst_number ? `<div style="font-size:10px;color:#6b7280;margin-top:1px">GSTIN: ${esc(d.studio.gst_number)}</div>` : ""}
      </div>
      <div style="text-align:right;min-width:236px">
        ${d.studio.logo_url ? `<img src="${esc(d.studio.logo_url)}" crossorigin="anonymous" style="max-height:46px;display:inline-block;margin-bottom:8px" />` : ""}
        <div style="font-size:27px;font-weight:800;letter-spacing:3px;color:${RED}">${title}</div>
        <div style="margin-top:12px;font-size:11.5px;line-height:1.75">
          <div style="font-weight:700;color:#111827">${esc(coupleName)}</div>
          ${d.client.phone || d.client.partner_phone ? `<div style="color:#4b5563">${esc(d.client.phone || d.client.partner_phone)}</div>` : ""}
          <div style="margin-top:4px"><span style="color:#6b7280">Bill No:</span> <b>${esc(d.number || "—")}</b></div>
          <div><span style="color:#6b7280">Date:</span> ${esc(fmtDate(d.issueDate || new Date().toISOString()))}</div>
          ${d.date ? `<div><span style="color:#6b7280">Bill Due Date:</span> ${esc(fmtDate(d.date))}</div>` : ""}
        </div>
      </div>
    </div>

    <!-- ITEMS -->
    <table style="width:100%;border-collapse:collapse;margin-top:16px">
      <thead>
        <tr style="background:#111827;color:#fff;font-size:9.5px;text-transform:uppercase;letter-spacing:.6px">
          <th style="text-align:center;padding:10px 8px;width:66px">Quantity</th>
          <th style="text-align:left;padding:10px 12px">Description</th>
          <th style="text-align:right;padding:10px 8px;width:112px">Price</th>
          <th style="text-align:right;padding:10px 12px;width:112px">Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <!-- TOTALS -->
    <div style="display:flex;justify-content:flex-end;margin-top:6px">
      <table style="width:330px;border-collapse:collapse;font-size:12px">
        ${totalRow("SubTotal", "₹ " + inr2(d.subtotal || d.total))}
        ${totalRow("TOTAL", "₹ " + inr2(d.total), RED)}
        ${totalRow("Advance", "₹ " + inr2(advance))}
        ${totalRow("Balance", "₹ " + inr2(balance), BLACK)}
      </table>
    </div>

    ${d.terms ? `
    <div style="margin-top:22px">
      <div style="font-weight:800;font-size:12.5px;letter-spacing:.4px;color:#111827;text-decoration:underline;text-underline-offset:3px">TERMS &amp; CONDITIONS</div>
      <div style="white-space:pre-wrap;color:#374151;font-size:10.5px;line-height:1.6;margin-top:6px">${esc(d.terms)}</div>
    </div>` : ""}

    ${paymentRows ? `
    <div style="margin-top:24px">
      <div style="font-weight:800;font-size:13px;color:#111827;border-bottom:2px solid #111827;padding-bottom:4px">Payments</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:6px">
        <thead>
          <tr style="color:#6b7280;font-size:9.5px;text-transform:uppercase;letter-spacing:.5px">
            <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #d1d5db">Date</th>
            <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #d1d5db">Description</th>
            <th style="text-align:left;padding:6px 8px;border-bottom:1px solid #d1d5db">Method</th>
            <th style="text-align:right;padding:6px 8px;border-bottom:1px solid #d1d5db">Amount</th>
          </tr>
        </thead>
        <tbody>${paymentRows}</tbody>
      </table>
    </div>` : ""}

    <!-- FOOTER -->
    <div style="margin-top:26px;border-top:1px solid #e5e7eb;padding-top:12px">
      <div style="font-weight:800;color:#111827;font-size:12px">Follow Me on social media:</div>
      ${d.studio.phone ? `<div style="margin-top:3px;color:#16a34a;font-weight:700;font-size:11.5px">&#128241; ${esc(d.studio.phone)}</div>` : ""}
      <div style="margin-top:6px;font-size:9.5px;color:#9ca3af;font-style:italic">This is a computer-generated ${d.kind}.</div>
    </div>
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
    // Fetch recorded payments for invoices (Payments section)
    if (d.kind === "invoice" && d.docId) {
      setProgress(50, "Fetching payments…");
      try {
        const { data: pays } = await (supabase as any)
          .from("payments")
          .select("paid_on, amount, method, reference, notes")
          .eq("invoice_id", d.docId)
          .order("paid_on", { ascending: true });
        safeData = { ...safeData, payments: (pays ?? []).map((pp: any) => ({
          paid_on: pp.paid_on, amount: Number(pp.amount || 0), method: pp.method,
          description: pp.notes || pp.reference || `Payment for ${d.client.partner_name ? d.client.name + " & " + d.client.partner_name : d.client.name}`,
        })) };
      } catch (_e) { /* payments optional */ }
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
