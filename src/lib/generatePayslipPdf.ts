import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export interface PayslipData {
  studioName: string;
  studioContact?: string;
  employee: {
    name: string;
    role?: string | null;
    department?: string | null;
    employee_id?: string | null;
    bank_name?: string | null;
    bank_account?: string | null;
    bank_ifsc?: string | null;
    pan?: string | null;
    aadhaar?: string | null;
  };
  period: string; // "October 2026"
  base: number;
  bonus: number;
  deductions: number;
  net: number;
  status: string;
  paidAt?: string | null;
  workingDays?: number;
  presentDays?: number;
  notes?: string | null;
}

function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}
function esc(s: string | null | undefined) {
  if (!s) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildHtml(d: PayslipData): string {
  const accent = "#0f766e";
  const totalEarnings = d.base + d.bonus;
  return `
    <div style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:#111827;background:white;width:760px;box-sizing:border-box">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid ${accent};padding-bottom:16px">
        <div>
          <p style="font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#6b7280;margin:0 0 4px 0;font-weight:600">${esc(d.studioName)}</p>
          ${d.studioContact ? `<p style="font-size:11px;color:#6b7280;margin:0">${esc(d.studioContact)}</p>` : ""}
        </div>
        <div style="text-align:right">
          <p style="font-size:22px;font-weight:800;color:${accent};margin:0;letter-spacing:1px">PAYSLIP</p>
          <p style="font-size:12px;color:#374151;margin:4px 0 0 0">${esc(d.period)}</p>
        </div>
      </div>

      <table style="width:100%;margin-top:20px;font-size:12px">
        <tr>
          <td style="padding:4px 0;color:#6b7280;width:120px">Employee:</td>
          <td style="padding:4px 0;color:#111827;font-weight:600">${esc(d.employee.name)}</td>
          <td style="padding:4px 0;color:#6b7280;width:120px;text-align:right">Status:</td>
          <td style="padding:4px 0;color:#111827;text-transform:uppercase;font-weight:600">${esc(d.status)}</td>
        </tr>
        ${d.employee.role ? `<tr>
          <td style="padding:4px 0;color:#6b7280">Role:</td>
          <td style="padding:4px 0;color:#111827">${esc(d.employee.role)}</td>
          ${d.employee.department ? `<td style="padding:4px 0;color:#6b7280;text-align:right">Department:</td><td style="padding:4px 0;color:#111827">${esc(d.employee.department)}</td>` : "<td></td><td></td>"}
        </tr>` : ""}
        ${d.paidAt ? `<tr>
          <td style="padding:4px 0;color:#6b7280">Paid on:</td>
          <td style="padding:4px 0;color:#111827">${esc(fmtDate(d.paidAt))}</td>
          <td></td><td></td>
        </tr>` : ""}
      </table>

      <div style="display:flex;gap:16px;margin-top:24px">
        <!-- EARNINGS -->
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <div style="background:#ecfdf5;padding:8px 12px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#047857;font-weight:600">Earnings</div>
          <table style="width:100%;font-size:12px">
            <tr><td style="padding:8px 12px;color:#374151">Base salary</td><td style="padding:8px 12px;text-align:right;color:#111827;tabular-nums">${esc(inr(d.base))}</td></tr>
            <tr><td style="padding:8px 12px;color:#374151;border-top:1px solid #e5e7eb">Bonus</td><td style="padding:8px 12px;text-align:right;color:#111827;border-top:1px solid #e5e7eb">${esc(inr(d.bonus))}</td></tr>
            <tr><td style="padding:8px 12px;font-weight:700;border-top:2px solid #0f766e">Total Earnings</td><td style="padding:8px 12px;text-align:right;font-weight:700;border-top:2px solid #0f766e">${esc(inr(totalEarnings))}</td></tr>
          </table>
        </div>
        <!-- DEDUCTIONS -->
        <div style="flex:1;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
          <div style="background:#fef2f2;padding:8px 12px;font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#b91c1c;font-weight:600">Deductions</div>
          <table style="width:100%;font-size:12px">
            <tr><td style="padding:8px 12px;color:#374151">Total deductions</td><td style="padding:8px 12px;text-align:right;color:#111827">${esc(inr(d.deductions))}</td></tr>
            <tr><td style="padding:8px 12px;color:#9ca3af;font-style:italic;border-top:1px solid #e5e7eb">PF / ESI / TDS combined</td><td style="padding:8px 12px;border-top:1px solid #e5e7eb"></td></tr>
            <tr><td style="padding:8px 12px;font-weight:700;border-top:2px solid #b91c1c">Total Deductions</td><td style="padding:8px 12px;text-align:right;font-weight:700;border-top:2px solid #b91c1c">${esc(inr(d.deductions))}</td></tr>
          </table>
        </div>
      </div>

      <div style="margin-top:16px;padding:16px;background:#0f766e;color:white;border-radius:8px;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:1px">Net Pay</span>
        <span style="font-size:24px;font-weight:800;tabular-nums">${esc(inr(d.net))}</span>
      </div>

      ${(d.workingDays != null || d.presentDays != null) ? `
        <div style="margin-top:16px;padding:12px;border:1px dashed #e5e7eb;border-radius:8px;font-size:11px;color:#6b7280">
          <strong style="color:#111827">Attendance:</strong>
          ${d.presentDays ?? 0} present / ${d.workingDays ?? 0} working days
        </div>
      ` : ""}

      ${d.employee.bank_account ? `
        <div style="margin-top:16px;font-size:11px;color:#374151">
          <p style="margin:0 0 4px 0;color:#6b7280;text-transform:uppercase;font-size:10px;letter-spacing:1.5px;font-weight:600">Bank details</p>
          <p style="margin:0">${esc(d.employee.bank_name || "")} · A/C ${esc(d.employee.bank_account || "")}${d.employee.bank_ifsc ? ` · IFSC ${esc(d.employee.bank_ifsc)}` : ""}</p>
          ${d.employee.pan || d.employee.aadhaar ? `<p style="margin:4px 0 0 0;color:#6b7280">${d.employee.pan ? `PAN ${esc(d.employee.pan)}` : ""}${d.employee.aadhaar ? ` · Aadhaar ${esc(d.employee.aadhaar)}` : ""}</p>` : ""}
        </div>
      ` : ""}

      ${d.notes ? `<div style="margin-top:16px;font-size:11px;color:#6b7280;font-style:italic;border-top:1px dashed #e5e7eb;padding-top:12px">Note: ${esc(d.notes)}</div>` : ""}

      <p style="margin-top:32px;text-align:center;font-size:10px;color:#9ca3af">
        Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} · This is a computer-generated payslip
      </p>
    </div>
  `;
}

export async function generatePayslipPdf(d: PayslipData) {
  const filename = `payslip-${d.employee.name.replace(/\s+/g, "-")}-${d.period.replace(/\s+/g, "-")}.pdf`;
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.top = "-10000px";
  wrapper.style.left = "0";
  wrapper.style.width = "760px";
  wrapper.style.background = "white";
  wrapper.innerHTML = buildHtml(d);
  document.body.appendChild(wrapper);
  try {
    const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: "#ffffff", logging: false });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(filename);
  } finally {
    document.body.removeChild(wrapper);
  }
}
