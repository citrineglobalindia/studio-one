import * as XLSX from "xlsx";
import type { LiveClient } from "@/data/live-clients-data";

const fmtDate = (d?: string) =>
  d ? new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";

const delStatus = (s: string) =>
  s === "in-progress" ? "In Progress" : s === "delivered" ? "Done" : s === "review" ? "Review" : "Pending";

export function exportEventTracking(clients: LiveClient[]) {
  const rows = clients.map((c, i) => ({
    "Sl #": i + 1,
    "Event Category": c.eventType,
    "Event Date": fmtDate(c.eventDate),
    "Couple Name": c.partnerName ? `${c.name} & ${c.partnerName}` : c.name,
    "Quotation Services": c.deliverables.map((d) => d.type).join(", "),
    "Actual Services": c.deliverables.filter((d) => d.status !== "pending").map((d) => d.type).join(", "),
    "Event Time": "",
    "Assigned Technician": c.team.map((t) => t.name).join(", "),
    "Type of Technician": c.team.map((t) => t.role).join(", "),
    "Event Venue": c.city,
    "Card Number": c.cardNumber || "",
    "Raw Data Size": c.rawDataSize || "",
    "Data Copy": "",
    "Backup Number": c.backupNumber || "",
    "Delivery HDD": c.deliveryHdd || "",
    "Photo Filter & Grade": delStatus(c.deliverables.find((d) => d.type === "Photos")?.status || "pending"),
    "Video Editing": delStatus(c.deliverables.find((d) => d.type === "Videos")?.status || "pending"),
    "Album Design": delStatus(c.deliverables.find((d) => d.type === "Albums")?.status || "pending"),
    "Assigned Date": fmtDate(c.createdAt),
    "Status": c.status === "active" ? "Active" : c.status === "completed" ? "Completed" : "On Hold",
    "Delivery Status": `${c.deliverables.filter((d) => d.status === "delivered").length}/${c.deliverables.length}`,
  }));

  downloadXlsx(rows, "Event_Tracking");
}

export function exportClientManagement(clients: LiveClient[]) {
  const rows = clients.map((c, i) => {
    const payPct = c.financials.estimatedAmount > 0 ? Math.round((c.financials.paidAmount / c.financials.estimatedAmount) * 100) : 0;
    const delivered = c.deliverables.filter((d) => d.status === "delivered").length;
    const total = c.deliverables.length;
    return {
      "Sl #": i + 1,
      "Event Date": fmtDate(c.eventDate),
      "Customer Name": c.name,
      "Couple Name": c.partnerName ? `${c.name} & ${c.partnerName}` : c.name,
      "Event Name": c.eventType,
      "Phone No": c.phone,
      "Mail ID": "",
      "Venue Details": c.city,
      "Service Taken": c.deliverables.map((d) => d.type).join(", "),
      "Deliverables": c.deliverables.map((d) => d.label).join(", "),
      "Album Sheets": "",
      "Source": "",
      "Social Media": "",
      "Birthdate": "",
      "Address": c.city,
      "Good Will Call": "",
      "Data Backup": "",
      "1st Delivery Date": fmtDate(c.deliveryDate),
      "Payment Status": payPct >= 100 ? "Paid" : payPct > 0 ? `${payPct}%` : "Pending",
      "Delivery Status": `${delivered}/${total}`,
      "Follow Up Call": "",
      "Video Progress": delStatus(c.deliverables.find((d) => d.type === "Videos")?.status || "pending"),
      "Album Design": delStatus(c.deliverables.find((d) => d.type === "Albums")?.status || "pending"),
      "Album Print": "",
      "Final Delivery": fmtDate(c.deliveryDate),
      "Final Delivery Status": c.status === "completed" ? "Completed" : c.status === "active" ? "Active" : "On Hold",
      "Final Payment": payPct >= 100 ? "Cleared" : "Pending",
      "Data Filtration": delStatus(c.deliverables.find((d) => d.type === "Photos")?.status || "pending"),
      "Review": "",
      "Action": "",
    };
  });

  downloadXlsx(rows, "Client_Management");
}

function downloadXlsx(rows: Record<string, unknown>[], name: string) {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, name);

  // Auto-size columns
  const colWidths = Object.keys(rows[0] || {}).map((key) => {
    const maxLen = Math.max(key.length, ...rows.map((r) => String(r[key] ?? "").length));
    return { wch: Math.min(maxLen + 2, 30) };
  });
  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, `${name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
