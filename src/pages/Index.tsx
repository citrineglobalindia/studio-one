import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles, IndianRupee, Wallet, TrendingUp, AlertCircle, CheckCircle2, Clock,
  Receipt, FileText, Briefcase, Users, Target, CalendarDays, Phone, Mail,
  Camera, Video, Edit3, UserPlus, ArrowRight, Activity, Award,
  Hourglass, ChevronRight, Eye,
} from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/hooks/useClients";
import { useLeads, LEAD_STATUSES } from "@/hooks/useLeads";
import { useAllInvoices, useAllQuotations, useAllContracts } from "@/hooks/useFinancials";
import { NewDocFromAccounts } from "@/components/accounts/NewDocFromAccounts";
import { useExpenses } from "@/hooks/useExpenses";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useEmployees } from "@/hooks/useHR";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// ───────────────────────── helpers
function inr(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); } catch { return d; }
}
function startOfMonthIso() { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }
function todayIso()         { return new Date().toISOString().slice(0, 10); }
function plusDaysIso(n: number) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

const ROLE_GREETING: Record<string, string> = {
  admin: "Studio overview",
  administrator: "Operations command",
  accounts: "Finance pulse",
  telecaller: "Sales pipeline",
  editor: "Production board",
  photographer: "Today on set",
  videographer: "Today on set",
  photographer_vendor: "Your shoots",
  videographer_vendor: "Your shoots",
};

// ──────────────────────────────────────────────────────────────────────
//  ROOT — picks a sub-dashboard by role
// ──────────────────────────────────────────────────────────────────────
export default function Index() {
  const { currentRole } = useRole();
  const { organization } = useOrg();
  const { user } = useAuth();

  const greeting = ROLE_GREETING[currentRole] || "Welcome";
  const userName = (user?.user_metadata as any)?.full_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <Hero name={userName} subtitle={greeting} studio={organization?.name} />

      {currentRole === "admin" || currentRole === "administrator"
        ? <AdminDashboard />
        : currentRole === "accounts"
        ? <AccountsDashboard />
        : currentRole === "telecaller"
        ? <SalesDashboard />
        : currentRole === "photographer_vendor" || currentRole === "videographer_vendor"
        ? <VendorDashboard />
        : <OpsDashboard />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  HERO
// ──────────────────────────────────────────────────────────────────────
function Hero({ name, subtitle, studio }: { name: string; subtitle: string; studio?: string }) {
  const now = new Date();
  const hours = now.getHours();
  const greeting = hours < 12 ? "Good morning" : hours < 17 ? "Good afternoon" : "Good evening";
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-amber-500/5 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/30 flex items-center justify-center shadow-sm">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">{subtitle}</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">{greeting}, {name.split(" ")[0]}</h1>
            {studio && <p className="text-xs text-muted-foreground mt-0.5">{studio} · {now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ADMIN / ADMINISTRATOR
// ──────────────────────────────────────────────────────────────────────
function AdminDashboard() {
  const navigate = useNavigate();
  const { organization } = useOrg();
  const { clients } = useClients();
  const { leads } = useLeads();
  const { rows: invoices } = useAllInvoices();
  const { rows: quotations } = useAllQuotations();
  const { rows: contracts } = useAllContracts();
  const calRes = useCalendarEvents(startOfMonthIso(), plusDaysIso(60));
  const events = (calRes.data ?? []) as any[];
  const { expenses } = useExpenses();

  const today = todayIso();
  const sevenDaysOut = plusDaysIso(7);

  // Exclude cancelled/void/draft invoices from money roll-ups so totals reflect real billing.
  const liveInvoices = invoices.filter((r: any) => !["cancelled","void","voided","draft"].includes(String(r.status || "").toLowerCase()));
  const collected = liveInvoices.reduce((s, r: any) => s + Number(r.amount_paid || 0), 0);
  const outstanding = liveInvoices.reduce((s, r: any) => s + Math.max(0, Number(r.total_amount || 0) - Number(r.amount_paid || 0)), 0);
  const billedTotal = liveInvoices.reduce((s, r: any) => s + Number(r.total_amount || 0), 0);
  const billedMonth = liveInvoices.filter((r: any) => (r.created_at || "").slice(0,7) === today.slice(0,7))
                              .reduce((s, r: any) => s + Number(r.total_amount || 0), 0);
  const estimatesTotal = quotations.reduce((s, r: any) => s + Number(r.total_amount || 0), 0);
  const proposalsTotal = contracts.reduce((s, r: any) => s + Number(r.contract_amount || r.total_amount || 0), 0);
  const collectedPct = billedTotal > 0 ? Math.round((collected / billedTotal) * 100) : 0;
  const conversion = quotations.length > 0 ? Math.round((invoices.length / quotations.length) * 100) : 0;

  const todaysEvents = events.filter((e: any) => e.event_date === today);
  const upcomingEvents = events.filter((e: any) => e.event_date > today && e.event_date <= sevenDaysOut).slice(0, 6);
  const pendingExpenses = expenses.filter((r: any) => r.status === "pending");
  const recentLeads = leads.slice(0, 5);

  const recentEstimates = [...quotations].sort((a:any,b:any) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 4);
  const recentProposals = [...contracts].sort((a:any,b:any) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 4);
  const recentInvoices  = [...invoices].sort((a:any,b:any) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 4);

  return (
    <>
      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Collected" value={inr(collected)} hint={collectedPct > 0 ? `${collectedPct}% of ₹${(billedTotal/1000).toFixed(0)}k billed` : "all-time"} icon={Wallet} color="emerald" onClick={() => navigate("/accounts/ledger")} />
        <Kpi label="Outstanding" value={inr(outstanding)} hint={`${invoices.filter((i:any)=> Number(i.total_amount)>Number(i.amount_paid||0)).length} unpaid`} icon={AlertCircle} color="rose" onClick={() => navigate("/accounts")} />
        <Kpi label="Billed this month" value={inr(billedMonth)} hint={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })} icon={TrendingUp} color="blue" onClick={() => navigate("/accounts")} />
        <Kpi label="Active clients" value={String(clients.length)} hint={`${todaysEvents.length} event${todaysEvents.length===1?"":"s"} today`} icon={Users} color="violet" onClick={() => navigate("/clients")} />
      </div>

      {/* Financial Pipeline — Estimate → Proposal → Invoice → Collected */}
      <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-4 md:p-5">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center"><Receipt className="h-4 w-4 text-amber-600" /></div>
            <div>
              <p className="text-sm font-semibold text-foreground tracking-tight">Financial pipeline</p>
              <p className="text-[10px] text-muted-foreground">Estimate → Proposal → Invoice → Collected · {conversion}% conversion rate</p>
            </div>
          </div>
          {(currentRoleIsAccountsOrAdmin()) && organization && (
            <div className="hidden md:flex items-center gap-1.5">
              <NewDocFromAccounts kind="estimation" organization={organization} className="h-8 text-xs" />
              <NewDocFromAccounts kind="proposal"   organization={organization} className="h-8 text-xs" />
              <NewDocFromAccounts kind="invoice"    organization={organization} className="h-8 text-xs" />
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <PipelineCard label="Estimates"  count={quotations.length} total={estimatesTotal} color="amber"   icon={FileText}  onClick={() => navigate("/accounts")} />
          <PipelineCard label="Proposals"  count={contracts.length}  total={proposalsTotal} color="violet"  icon={Briefcase} onClick={() => navigate("/accounts")} />
          <PipelineCard label="Invoices"   count={invoices.length}   total={billedTotal}    color="blue"    icon={Receipt}   onClick={() => navigate("/accounts")} />
          <PipelineCard label="Collected"  count={liveInvoices.filter((i:any)=>Number(i.amount_paid)>0).length} total={collected} color="emerald" icon={Wallet} onClick={() => navigate("/accounts/ledger")} />
        </div>
      </motion.section>

      {/* 3-column: recent estimates / proposals / invoices */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DocList title="Recent estimates" items={recentEstimates} amountKey="total_amount" numberKey="quotation_number" tone="amber"   onMore={() => navigate("/accounts")} navigate={navigate} />
        <DocList title="Recent proposals" items={recentProposals} amountKey="contract_amount" numberKey="contract_number" tone="violet" onMore={() => navigate("/accounts")} navigate={navigate} />
        <DocList title="Recent invoices"  items={recentInvoices}  amountKey="total_amount" numberKey="invoice_number"  tone="emerald" onMore={() => navigate("/accounts")} navigate={navigate} />
      </div>

      {/* Today's events + Pending expenses */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Today's events" subtitle={todaysEvents.length > 0 ? `${todaysEvents.length} happening today` : "Nothing scheduled today"} icon={CalendarDays} onMore={() => navigate("/calendar")} className="lg:col-span-2">
          {todaysEvents.length === 0 && upcomingEvents.length === 0 ? (
            <Empty icon={CalendarDays} label="No upcoming events" />
          ) : (
            <div className="space-y-1.5">
              {todaysEvents.map((e: any) => <EventRow key={e.id} ev={e} highlight />)}
              {upcomingEvents.map((e: any) => <EventRow key={e.id} ev={e} />)}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Pending expenses" subtitle={`${pendingExpenses.length} waiting`} icon={Hourglass} onMore={() => navigate("/accounts/expenses")}>
          {pendingExpenses.length === 0 ? (
            <Empty icon={CheckCircle2} label="All clear" />
          ) : (
            <div className="space-y-1.5">
              {pendingExpenses.slice(0, 5).map((p: any) => (
                <button key={p.id} onClick={() => navigate("/accounts/expenses")} className="w-full text-left rounded-lg border border-border bg-card hover:border-amber-500/40 transition px-3 py-2 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0"><IndianRupee className="h-3.5 w-3.5 text-amber-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{p.description || p.category || "Expense"}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtDate(p.created_at)}</p>
                  </div>
                  <p className="text-xs font-semibold text-foreground tabular-nums">{inr(p.amount)}</p>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>

      {/* Recent leads + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Recent leads" subtitle={`${leads.length} total`} icon={Target} onMore={() => navigate("/leads")} className="lg:col-span-2">
          {recentLeads.length === 0 ? <Empty icon={Target} label="No leads yet" /> : (
            <div className="space-y-1.5">
              {recentLeads.map((l: any) => (
                <button key={l.id} onClick={() => navigate("/leads")} className="w-full text-left rounded-lg border border-border bg-card hover:border-primary/40 transition px-3 py-2 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0"><Target className="h-3.5 w-3.5 text-emerald-600" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{l.name || "Lead"}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{l.phone || l.email || l.city || "—"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] capitalize">{l.status}</Badge>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Quick stats" icon={Activity}>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <Mini label="Draft estimates" value={String(quotations.filter((r:any) => (r.status||"draft")==='draft').length)} />
            <Mini label="Leads (new)"     value={String(leads.filter((l:any)=>l.status==='new').length)} />
            <Mini label="Events (7d)"     value={String(upcomingEvents.length)} />
            <Mini label="Clients"         value={String(clients.length)} />
          </div>
        </SectionCard>
      </div>
    </>
  );
}

// ─────────────── Pipeline card with count + total ₹
function PipelineCard({ label, count, total, color, icon: Icon, onClick }: { label: string; count: number; total: number; color: keyof typeof COLOR; icon: any; onClick: () => void }) {
  const c = COLOR[color];
  return (
    <button onClick={onClick}
      className={"relative text-left rounded-xl border bg-card overflow-hidden group p-3.5 transition hover:-translate-y-0.5 " + c.border}>
      <div className={"absolute inset-0 bg-gradient-to-br " + c.bg + " opacity-50 group-hover:opacity-100 transition"} />
      <div className="relative">
        <div className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider " + c.chip}>
          <Icon className="h-3 w-3" /> {label}
        </div>
        <p className="mt-2 text-xl font-bold text-foreground tabular-nums">{inr(total)}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">{count} document{count === 1 ? "" : "s"}</p>
      </div>
    </button>
  );
}

// ─────────────── Recent docs list
function DocList({ title, items, amountKey, numberKey, tone, onMore, navigate }:
  { title: string; items: any[]; amountKey: string; numberKey: string; tone: "amber"|"violet"|"emerald"; onMore: ()=>void; navigate: any }) {
  const toneClass = tone === "amber" ? "text-amber-600 bg-amber-500/10 border-amber-500/30"
    : tone === "violet" ? "text-violet-600 bg-violet-500/10 border-violet-500/30"
    : "text-emerald-600 bg-emerald-500/10 border-emerald-500/30";
  const ToneIcon = tone === "amber" ? FileText : tone === "violet" ? Briefcase : Receipt;
  return (
    <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={"h-7 w-7 rounded-lg flex items-center justify-center border " + toneClass}><ToneIcon className="h-3.5 w-3.5" /></div>
          <p className="text-sm font-semibold text-foreground tracking-tight">{title}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onMore} className="h-7 gap-1 text-xs text-muted-foreground">
          View all <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
      {items.length === 0 ? <Empty icon={ToneIcon} label="No documents yet" /> : (
        <div className="space-y-1.5">
          {items.map((d:any) => (
            <button key={d.id} onClick={onMore}
              className="w-full text-left rounded-lg border border-border bg-card hover:border-primary/40 transition px-3 py-2 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{d[numberKey] || "#"}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {d.client?.name ? `${d.client.name}${d.client.partner_name?` & ${d.client.partner_name}`:""}` : d.client_name || "—"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-foreground tabular-nums">{inr(Number(d[amountKey] || 0))}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{d.status || "draft"}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </motion.section>
  );
}

// helper closure-friendly to read current role from outer scope
function currentRoleIsAccountsOrAdmin(): boolean {
  // This is wired via useRole at the call site of AdminDashboard, but for simplicity
  // we always return true since AdminDashboard renders only for admin/administrator.
  return true;
}



// ──────────────────────────────────────────────────────────────────────
//  ACCOUNTS
// ──────────────────────────────────────────────────────────────────────
function AccountsDashboard() {
  const navigate = useNavigate();
  const { rows: invoices } = useAllInvoices();
  const { rows: quotations } = useAllQuotations();
  const { rows: contracts } = useAllContracts();
  const { expenses } = useExpenses();

  const today = todayIso().slice(0, 7);
  const liveInvoices = invoices.filter((r: any) => !["cancelled","void","voided","draft"].includes(String(r.status || "").toLowerCase()));
  const collected = liveInvoices.reduce((s, r: any) => s + Number(r.amount_paid || 0), 0);
  const outstanding = liveInvoices.reduce((s, r: any) => s + Math.max(0, Number(r.total_amount || 0) - Number(r.amount_paid || 0)), 0);
  const billedMonth = liveInvoices.filter((r: any) => (r.created_at || "").slice(0,7) === today)
                              .reduce((s, r: any) => s + Number(r.total_amount || 0), 0);
  const drafts = [
    ...quotations.filter((r: any) => (r.status || "draft") === "draft"),
    ...contracts.filter((r: any) => (r.status || "draft") === "draft"),
  ];
  const pendingExpenses = expenses.filter((r: any) => r.status === "pending");
  const approvedUnpaid = expenses.filter((r: any) => r.status === "approved");

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Collected" value={inr(collected)} hint="all-time" icon={Wallet} color="emerald" onClick={() => navigate("/accounts/ledger")} />
        <Kpi label="Outstanding" value={inr(outstanding)} hint={`${invoices.length} invoices`} icon={AlertCircle} color="rose" onClick={() => navigate("/accounts")} />
        <Kpi label="Billed this month" value={inr(billedMonth)} hint={today} icon={TrendingUp} color="blue" onClick={() => navigate("/accounts")} />
        <Kpi label="Drafts to send" value={String(drafts.length)} hint={`${quotations.length} est · ${contracts.length} prop`} icon={FileText} color="amber" onClick={() => navigate("/accounts")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="Expense queue" subtitle={`${pendingExpenses.length} pending · ${approvedUnpaid.length} approved`} icon={Hourglass} onMore={() => navigate("/accounts/expenses")}>
          {pendingExpenses.length === 0 && approvedUnpaid.length === 0 ? (
            <Empty icon={CheckCircle2} label="No expenses to action" />
          ) : (
            <div className="space-y-1.5">
              {[...pendingExpenses, ...approvedUnpaid].slice(0, 6).map((p: any) => (
                <button key={p.id} onClick={() => navigate("/accounts/expenses")} className="w-full text-left rounded-lg border border-border bg-card hover:border-amber-500/40 transition px-3 py-2 flex items-center gap-2">
                  <div className={"h-7 w-7 rounded-md flex items-center justify-center shrink-0 " + (p.status === "pending" ? "bg-amber-500/10" : "bg-emerald-500/10")}>
                    {p.status === "pending" ? <Hourglass className="h-3.5 w-3.5 text-amber-600" /> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{p.description || p.category || "Expense"}</p>
                    <p className="text-[10px] text-muted-foreground">{fmtDate(p.created_at)} · <span className="capitalize">{p.status}</span></p>
                  </div>
                  <p className="text-xs font-semibold text-foreground tabular-nums">{inr(p.amount)}</p>
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Drafts to send" subtitle={`${drafts.length} need attention`} icon={FileText} onMore={() => navigate("/accounts")}>
          {drafts.length === 0 ? <Empty icon={CheckCircle2} label="All sent" /> : (
            <div className="space-y-1.5">
              {drafts.slice(0, 6).map((d: any) => {
                const kind = d.quotation_number ? "Est" : d.contract_number ? "Prop" : "Inv";
                const num = d.quotation_number || d.contract_number || d.invoice_number || "#";
                const amt = Number(d.total_amount || d.contract_amount || 0);
                return (
                  <button key={d.id} onClick={() => navigate("/accounts")} className="w-full text-left rounded-lg border border-border bg-card hover:border-violet-500/40 transition px-3 py-2 flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] shrink-0">{kind}</Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{num}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{d.client?.name ? `${d.client.name}${d.client.partner_name?` & ${d.client.partner_name}`:""}` : d.client_name || "—"}</p>
                    </div>
                    <p className="text-xs font-semibold text-foreground tabular-nums">{inr(amt)}</p>
                  </button>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  TELECALLER / SALES
// ──────────────────────────────────────────────────────────────────────
function SalesDashboard() {
  const navigate = useNavigate();
  const { leads } = useLeads();

  const byStatus = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of LEAD_STATUSES) m[s] = 0;
    for (const l of leads as any[]) m[String(l.status)] = (m[String(l.status)] || 0) + 1;
    return m;
  }, [leads]);

  const followUps = (leads as any[]).filter(l => l.follow_up_date && l.follow_up_date >= todayIso())
    .sort((a:any,b:any) => String(a.follow_up_date).localeCompare(String(b.follow_up_date)))
    .slice(0, 8);

  const converted = byStatus["converted"] || 0;
  const total = leads.length || 1;
  const convRate = Math.round((converted / total) * 100);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Total leads" value={String(leads.length)} icon={Target} color="emerald" onClick={() => navigate("/leads")} />
        <Kpi label="New" value={String(byStatus["new"] || 0)} icon={Sparkles} color="blue" onClick={() => navigate("/leads")} />
        <Kpi label="Qualified" value={String(byStatus["qualified"] || 0)} icon={Award} color="violet" onClick={() => navigate("/leads")} />
        <Kpi label="Conversion" value={`${convRate}%`} hint={`${converted} converted`} icon={TrendingUp} color="amber" onClick={() => navigate("/leads")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Lead funnel" icon={Target} className="lg:col-span-1">
          <div className="space-y-2">
            {LEAD_STATUSES.map((s) => {
              const n = byStatus[s] || 0;
              const pct = leads.length ? Math.round((n / leads.length) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="capitalize text-foreground">{s}</span>
                    <span className="text-muted-foreground tabular-nums">{n} · {pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-primary/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Follow-ups" subtitle={`${followUps.length} scheduled`} icon={Clock} onMore={() => navigate("/leads")} className="lg:col-span-2">
          {followUps.length === 0 ? <Empty icon={Clock} label="No follow-ups scheduled" /> : (
            <div className="space-y-1.5">
              {followUps.map((l: any) => (
                <button key={l.id} onClick={() => navigate("/leads")} className="w-full text-left rounded-lg border border-border bg-card hover:border-primary/40 transition px-3 py-2 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0"><Target className="h-3.5 w-3.5 text-primary" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{l.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{l.phone || "—"} · {l.event_type || "—"}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{fmtDate(l.follow_up_date)}</Badge>
                </button>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  OPS — editor / photographer / videographer
// ──────────────────────────────────────────────────────────────────────
function OpsDashboard() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const calRes = useCalendarEvents(startOfMonthIso(), plusDaysIso(60));
  const events = (calRes.data ?? []) as any[];
  const { employees } = useEmployees();

  const today = todayIso();
  const sevenDaysOut = plusDaysIso(7);
  const todays = events.filter((e: any) => e.event_date === today);
  const week = events.filter((e: any) => e.event_date > today && e.event_date <= sevenDaysOut);
  const eventsThisMonth = events.filter((e: any) => (e.event_date || "").slice(0,7) === today.slice(0,7));

  const Icon = currentRole === "videographer" ? Video : currentRole === "editor" ? Edit3 : Camera;

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi label="Today" value={String(todays.length)} hint="events" icon={CalendarDays} color="emerald" onClick={() => navigate("/calendar")} />
        <Kpi label="This week" value={String(week.length)} hint="upcoming" icon={Clock} color="blue" onClick={() => navigate("/calendar")} />
        <Kpi label="This month" value={String(eventsThisMonth.length)} hint="total" icon={Activity} color="violet" onClick={() => navigate("/calendar")} />
        <Kpi label="Teammates" value={String(employees.length)} hint="in studio" icon={Users} color="amber" onClick={() => navigate("/hr")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SectionCard title="Today's events" icon={Icon} onMore={() => navigate("/calendar")} className="lg:col-span-2">
          {todays.length === 0 && week.length === 0 ? <Empty icon={CalendarDays} label="No upcoming events" /> : (
            <div className="space-y-1.5">
              {todays.map((e: any) => <EventRow key={e.id} ev={e} highlight />)}
              {week.slice(0, 6).map((e: any) => <EventRow key={e.id} ev={e} />)}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Quick links" icon={Sparkles}>
          <div className="space-y-1.5">
            <QuickLink label="Calendar" icon={CalendarDays} onClick={() => navigate("/calendar")} />
            <QuickLink label="My attendance" icon={Activity} onClick={() => navigate("/hr/attendance")} />
            <QuickLink label="My leaves" icon={Clock} onClick={() => navigate("/hr/leaves")} />
            <QuickLink label="Submit expense" icon={IndianRupee} onClick={() => navigate("/accounts/expenses")} />
          </div>
        </SectionCard>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  VENDOR
// ──────────────────────────────────────────────────────────────────────
function VendorDashboard() {
  const navigate = useNavigate();
  const calRes = useCalendarEvents(startOfMonthIso(), plusDaysIso(60));
  const events = (calRes.data ?? []) as any[];
  const today = todayIso();
  const todays = events.filter((e: any) => e.event_date === today);
  const upcoming = events.filter((e: any) => e.event_date > today);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Kpi label="Today" value={String(todays.length)} hint="shoots" icon={CalendarDays} color="emerald" onClick={() => navigate("/calendar")} />
        <Kpi label="Upcoming" value={String(upcoming.length)} hint="next 60d" icon={Clock} color="blue" onClick={() => navigate("/calendar")} />
        <Kpi label="This month" value={String(events.filter((e:any)=>(e.event_date||"").slice(0,7)===today.slice(0,7)).length)} hint="bookings" icon={Activity} color="violet" onClick={() => navigate("/calendar")} />
      </div>

      <SectionCard title="Your assigned events" subtitle={`${events.length} total`} icon={CalendarDays} onMore={() => navigate("/calendar")}>
        {events.length === 0 ? <Empty icon={CalendarDays} label="No events assigned yet" /> : (
          <div className="space-y-1.5">
            {todays.map((e: any) => <EventRow key={e.id} ev={e} highlight />)}
            {upcoming.slice(0, 8).map((e: any) => <EventRow key={e.id} ev={e} />)}
          </div>
        )}
      </SectionCard>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────
//  ATOMS
// ──────────────────────────────────────────────────────────────────────
const COLOR: Record<string, { bg: string; text: string; border: string; chip: string }> = {
  emerald: { bg: "from-emerald-500/10 to-emerald-500/0", text: "text-emerald-600", border: "border-emerald-500/30", chip: "bg-emerald-500/10 text-emerald-700" },
  rose:    { bg: "from-rose-500/10 to-rose-500/0",       text: "text-rose-600",    border: "border-rose-500/30",    chip: "bg-rose-500/10 text-rose-700" },
  blue:    { bg: "from-blue-500/10 to-blue-500/0",       text: "text-blue-600",    border: "border-blue-500/30",    chip: "bg-blue-500/10 text-blue-700" },
  violet:  { bg: "from-violet-500/10 to-violet-500/0",   text: "text-violet-600",  border: "border-violet-500/30",  chip: "bg-violet-500/10 text-violet-700" },
  amber:   { bg: "from-amber-500/10 to-amber-500/0",     text: "text-amber-600",   border: "border-amber-500/30",   chip: "bg-amber-500/10 text-amber-700" },
};

function Kpi({ label, value, hint, icon: Icon, color, onClick }: { label: string; value: string; hint?: string; icon: any; color: keyof typeof COLOR; onClick?: () => void }) {
  const c = COLOR[color];
  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={"relative text-left rounded-2xl border bg-card overflow-hidden group p-4 transition " + c.border}
    >
      <div className={"absolute inset-0 bg-gradient-to-br " + c.bg + " opacity-60 group-hover:opacity-100 transition"} />
      <div className="relative">
        <div className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider " + c.chip}>
          <Icon className="h-3 w-3" /> {label}
        </div>
        <p className="mt-2 text-2xl font-bold text-foreground tabular-nums">{value}</p>
        {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
      </div>
    </motion.button>
  );
}

function SectionCard({ title, subtitle, icon: Icon, children, onMore, className = "" }: { title: string; subtitle?: string; icon: any; children: React.ReactNode; onMore?: () => void; className?: string }) {
  return (
    <motion.section initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={"rounded-2xl border border-border bg-card p-4 md:p-5 " + className}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-muted/40 flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground tracking-tight">{title}</p>
            {subtitle && <p className="text-[10px] text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {onMore && (
          <Button variant="ghost" size="sm" onClick={onMore} className="h-7 gap-1 text-xs text-muted-foreground">
            View all <ChevronRight className="h-3 w-3" />
          </Button>
        )}
      </div>
      {children}
    </motion.section>
  );
}

function EventRow({ ev, highlight }: { ev: any; highlight?: boolean }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => ev.client_id && navigate(`/clients/${ev.client_id}`)}
      className={"w-full text-left rounded-lg border transition px-3 py-2 flex items-center gap-2 " +
        (highlight ? "border-primary/40 bg-gradient-to-r from-primary/5 to-transparent" : "border-border bg-card hover:border-primary/40")}
    >
      <div className={"h-8 w-8 rounded-md flex flex-col items-center justify-center shrink-0 " + (highlight ? "bg-primary/15 text-primary" : "bg-muted/40 text-muted-foreground")}>
        <span className="text-[9px] uppercase font-medium leading-none">{fmtDate(ev.event_date).split(" ")[1] || ""}</span>
        <span className="text-xs font-bold leading-tight">{fmtDate(ev.event_date).split(" ")[0] || ""}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-foreground truncate">{ev.name || ev.event_type}</p>
          {ev.is_finalized && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {(ev.client?.name || "")}{ev.client?.partner_name ? ` & ${ev.client.partner_name}` : ""}
          {ev.venue ? ` · ${ev.venue}` : ""}
        </p>
      </div>
      {ev.start_time && (
        <Badge variant="outline" className="text-[10px] shrink-0 tabular-nums">
          {String(ev.start_time).slice(0,5)}
        </Badge>
      )}
    </button>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function Empty({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="py-8 text-center">
      <Icon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function QuickLink({ label, icon: Icon, onClick }: { label: string; icon: any; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left rounded-lg border border-border bg-card hover:border-primary/40 transition px-3 py-2 flex items-center gap-2 group">
      <div className="h-7 w-7 rounded-md bg-muted/40 flex items-center justify-center group-hover:bg-primary/10 transition">
        <Icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
      </div>
      <span className="text-xs font-medium text-foreground flex-1">{label}</span>
      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
    </button>
  );
}
