import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FinanceTabs } from "@/components/accounts/FinanceTabs";
import { useNavigate } from "react-router-dom";
import {
  Receipt, FileText, Briefcase, Search, Loader2, IndianRupee,
  TrendingUp, AlertCircle, CheckCircle2, Wallet, ExternalLink, Eye, FileDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRole } from "@/contexts/RoleContext";
import { useAllQuotations, useAllContracts, useAllInvoices } from "@/hooks/useFinancials";
import { generateDocPdf, type DocPdfKind } from "@/lib/generateDocPdf";
import { NewDocFromAccounts } from "@/components/accounts/NewDocFromAccounts";
import { useOrg } from "@/contexts/OrgContext";
// (FileDown + Eye imported above)
import { DonutCard, StatusBarChart } from "@/components/accounts/FinanceCharts";

type Tab = "estimations" | "proposals" | "invoices";

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

function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}
function coupleName(c: any) {
  if (!c) return "—";
  return c.partner_name ? `${c.name} & ${c.partner_name}` : c.name;
}

export default function AccountsPage() {
  const { currentRole } = useRole();
  const allowed = currentRole === "admin" || currentRole === "accounts";

  const navigate = useNavigate();
  const { organization } = useOrg();
  const [tab, setTab] = useState<Tab>("invoices");
  const [search, setSearch] = useState("");

  const { rows: quotations, isLoading: lq } = useAllQuotations();
  const { rows: contracts, isLoading: lc } = useAllContracts();
  const { rows: invoices, isLoading: li } = useAllInvoices();

  // KPIs
  const kpis = useMemo(() => {
    const estTotal = quotations.reduce((s, r) => s + Number(r.total_amount || 0), 0);
    const propTotal = contracts.reduce((s, r) => s + Number(r.contract_amount || 0), 0);
    const invTotal = invoices.reduce((s, r) => s + Number(r.total_amount || 0), 0);
    const invPaid = invoices.reduce((s, r) => s + Number(r.amount_paid || 0), 0);
    const invDue = invTotal - invPaid;
    return { estTotal, propTotal, invTotal, invPaid, invDue };
  }, [quotations, contracts, invoices]);

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <Wallet className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Accounts module is restricted</p>
        <p className="text-sm text-muted-foreground">Only Admin and Accountant roles can view this page.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-emerald-400/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        <div className="relative p-5 md:p-6 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-500/5 border border-amber-500/30 flex items-center justify-center shadow-sm">
            <Wallet className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Finance</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Accounts</h1>
            <p className="text-xs text-muted-foreground mt-0.5">All invoices in one place</p>
          </div>
        </div>
      </motion.div>

      <FinanceTabs />

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard label="Invoiced" value={inr(kpis.invTotal)} count={invoices.length} icon={Receipt} color="text-emerald-500 bg-emerald-500/10" />
        <KpiCard label="Collected" value={inr(kpis.invPaid)} icon={CheckCircle2} color="text-emerald-500 bg-emerald-500/10" />
        <KpiCard label="Outstanding" value={inr(kpis.invDue)} icon={AlertCircle} color="text-rose-500 bg-rose-500/10" />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 gap-4">
        <DonutCard
          title="Invoices by status"
          subtitle={`${invoices.length} invoices`}
          total={invoices.reduce((s, r) => s + Number(r.total_amount || 0), 0)}
          data={["draft","sent","partially_paid","paid","overdue","cancelled"].map((st) => ({
            name: st.replace("_", " "),
            value: invoices.filter((r) => (r.status || "draft") === st).reduce((s, r) => s + Number(r.total_amount || 0), 0),
          }))}
        />
      </div>

      {/* Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit">
          {([
            { key: "invoices" as Tab, label: "Invoices", icon: Receipt, n: invoices.length },
          ]).map(({ key, label, icon: Icon, n }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={"inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition " + (active ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}
              >
                <Icon className="h-3 w-3" /> {label} <span className="opacity-60">({n})</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by client / number…" className="pl-9" />
          </div>
          {(currentRole === "admin" || currentRole === "accounts") && (
            <NewDocFromAccounts
              kind="invoice"
              organization={organization}
              className="h-9 shrink-0"
            />
          )}
        </div>
      </div>

      {/* Table */}
      <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border bg-card overflow-hidden">
        {li ? (
          <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
        ) : (
          <DocTable
            rows={invoices.filter((r) => matchFilter(r, search))}
            kind="invoice"
            navigate={navigate}
            onPdf={(row) => generateDocPdf(buildAccountsPdfPayload("invoice", row, organization), "download")}
            onOpenPdf={(row) => generateDocPdf(buildAccountsPdfPayload("invoice", row, organization), "open")}
            extraCols={[
              { key: "due_date", label: "Due date" },
              { key: "amount_paid", label: "Paid" },
            ]}
          />
        )}
      </motion.div>
    </div>
  );
}

function matchFilter(r: any, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const hay = [
    r.client_name,
    r.client && (r.client.name + " " + (r.client.partner_name || "")),
    r.quotation_number, r.contract_number, r.invoice_number, r.title,
    r.status,
  ].filter(Boolean).join(" ").toLowerCase();
  return hay.includes(s);
}

function KpiCard({ label, value, count, icon: Icon, color }: { label: string; value: string; count?: number; icon: any; color: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className={"inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-medium " + color}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-2 text-base font-semibold text-foreground tabular-nums">{value}</p>
      {typeof count === "number" && (
        <p className="text-[10px] text-muted-foreground mt-0.5">{count} record{count === 1 ? "" : "s"}</p>
      )}
    </div>
  );
}

function DocTable({
  rows, kind, navigate, extraCols, onPdf, onOpenPdf,
}: {
  rows: any[];
  kind: "estimation" | "proposal" | "invoice";
  navigate: (p: string) => void;
  extraCols: { key: string; label: string }[];
  onPdf: (row: any) => void | Promise<void>;
  onOpenPdf: (row: any) => void | Promise<void>;
}) {
  if (rows.length === 0) {
    return (
      <div className="py-12 text-center">
        <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No {kind}s found</p>
      </div>
    );
  }
  const amountKey = kind === "proposal" ? "contract_amount" : "total_amount";
  const numberKey = kind === "proposal" ? "contract_number" : kind === "estimation" ? "quotation_number" : "invoice_number";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="text-left px-4 py-3 font-medium">#</th>
            <th className="text-left px-3 py-3 font-medium">Client</th>
            <th className="text-left px-3 py-3 font-medium">Created</th>
            {extraCols.map((c) => <th key={c.key} className="text-left px-3 py-3 font-medium">{c.label}</th>)}
            <th className="text-right px-3 py-3 font-medium">Amount</th>
            <th className="text-center px-3 py-3 font-medium">Status</th>
            <th className="text-center px-3 py-3 font-medium">GST</th>
            <th className="px-3 py-3 text-right">PDF</th>
            <th className="px-3 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const status = r.status || "draft";
            const colorClass = STATUS_COLOR[status] || STATUS_COLOR.draft;
            const docNumber = r[numberKey] || "—";
            const couple = coupleName(r.client);
            return (
              <tr key={r.id} className="border-t border-border hover:bg-muted/30 transition">
                <td className="px-4 py-3 font-medium text-foreground">{docNumber}</td>
                <td className="px-3 py-3">
                  {r.client_id ? (
                    <button onClick={() => navigate(`/clients/${r.client_id}`)} className="text-primary hover:underline inline-flex items-center gap-1">
                      {couple} <ExternalLink className="h-3 w-3" />
                    </button>
                  ) : couple}
                </td>
                <td className="px-3 py-3 text-muted-foreground">{fmtDate(r.created_at)}</td>
                {extraCols.map((col) => (
                  <td key={col.key} className="px-3 py-3 text-muted-foreground">
                    {col.key === "amount_paid"
                      ? <span className="tabular-nums">{inr(Number(r[col.key] || 0))}</span>
                      : fmtDate(r[col.key])}
                  </td>
                ))}
                <td className="px-3 py-3 text-right font-semibold tabular-nums">{inr(Number(r[amountKey] || 0))}</td>
                <td className="px-3 py-3 text-center">
                  <Badge variant="outline" className={"text-[10px] capitalize " + colorClass}>{String(status).replace("_", " ")}</Badge>
                </td>
                <td className="px-3 py-3 text-center">
                  {r.gst_applicable
                    ? <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30">GST</Badge>
                    : <span className="text-muted-foreground/50 text-[10px]">—</span>}
                </td>
                <td className="px-3 py-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => onPdf(r)} title="Download PDF" className="h-7 w-7">
                    <FileDown className="h-3.5 w-3.5" />
                  </Button>
                </td>
                <td className="px-3 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button size="sm" variant="ghost" onClick={() => onOpenPdf(r)} title="Open PDF in new tab" className="h-7 gap-1 text-xs">
                      <Eye className="h-3.5 w-3.5" /> Open
                    </Button>
                    {r.client_id && (
                      <Button size="icon" variant="ghost" onClick={() => navigate(`/clients/${r.client_id}`)} title="Go to client" className="h-7 w-7 text-muted-foreground">
                        →
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


function buildAccountsPdfPayload(kind: DocPdfKind, doc: any, studio: any) {
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
    docId: doc?.id ?? null,
    issueDate: doc?.created_at ?? null,
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
