import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CalendarDays, Clock, MapPin, Lock, CheckCircle2, UserPlus, Pencil,
  FileText, Briefcase, Receipt, Camera as CameraIcon, ChevronLeft, ChevronRight,
  ArrowLeft, Printer, Users, IndianRupee, Sparkles, Hourglass, CalendarClock,
  Download, Eye, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAllQuotations, useAllContracts, useAllInvoices } from "@/hooks/useFinancials";
import { useOrg } from "@/contexts/OrgContext";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { generateDocPdf } from "@/lib/generateDocPdf";
import { buildDocPdfPayload } from "@/lib/buildDocPdfPayload";
import { AssignTeamDialog } from "@/components/clients/AssignTeamDialog";
import { CheckInDialog } from "@/components/events/CheckInDialog";
import { EditorWorkLogPanel } from "@/components/calendar/EditorWorkLogPanel";

const TYPE_GRADIENT: Record<string, string> = {
  Wedding: "from-rose-500 to-pink-600", "Pre-Wedding": "from-purple-500 to-fuchsia-600",
  Engagement: "from-amber-500 to-orange-600", Reception: "from-blue-500 to-indigo-600",
  Haldi: "from-yellow-500 to-amber-600", Sangeet: "from-violet-500 to-purple-600",
  Other: "from-slate-500 to-slate-600",
};
function fmtTime(t?: string | null) {
  if (!t) return "";
  const [h, m] = String(t).split(":");
  const hh = parseInt(h); const ap = hh >= 12 ? "PM" : "AM"; const h12 = hh % 12 || 12;
  return `${h12}:${m} ${ap}`;
}
function inr0(n: number) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0)); }
function shiftDate(iso: string, days: number) {
  const d = new Date(iso); d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function DayDetailPage() {
  const { date = "" } = useParams();
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const { organization } = useOrg();
  const { user } = useAuth();
  const seesAll = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts";
  const canManageTeam = currentRole === "admin" || currentRole === "administrator";

  const { data: events = [], isLoading } = useCalendarEvents(date, date);
  const { members } = useTeamMembers();
  const memberById = new Map(members.map((m) => [m.id, m]));
  const myTeamMember = members.find((m: any) => m.user_id && user?.id && m.user_id === user.id) || null;

  const { rows: allQuotes = [] } = useAllQuotations();
  const { rows: allContracts = [] } = useAllContracts();
  const { rows: allInvoices = [] } = useAllInvoices();
  const docsByClient = useMemo(() => {
    const pick = (rows: any[]) => {
      const m = new Map<string, any>();
      for (const r of rows) {
        if (!r.client_id) continue;
        const prev = m.get(r.client_id);
        if (!prev || String(r.created_at) > String(prev.created_at)) m.set(r.client_id, r);
      }
      return m;
    };
    return { est: pick(allQuotes), prop: pick(allContracts), inv: pick(allInvoices) };
  }, [allQuotes, allContracts, allInvoices]);

  const [assignEvent, setAssignEvent] = useState<any | null>(null);
  const [checkInEvent, setCheckInEvent] = useState<any | null>(null);
  const [view, setView] = useState<"table" | "cards">("table");

  // KPIs
  const totalCrew = useMemo(() => {
    const s = new Set<string>();
    for (const e of events as any[]) for (const id of (e.assigned_member_ids || [])) s.add(id);
    return s.size;
  }, [events]);
  const finalizedCount = (events as any[]).filter((e) => e.is_finalized).length;
  const unassignedCount = (events as any[]).filter((e) => !e.assigned_member_ids?.length).length;
  const dayValue = useMemo(() => {
    let v = 0;
    const seen = new Set<string>();
    for (const e of events as any[]) {
      if (!e.client_id || seen.has(e.client_id)) continue;
      seen.add(e.client_id);
      const inv = docsByClient.inv.get(e.client_id);
      const est = docsByClient.est.get(e.client_id);
      v += Number(inv?.total_amount || est?.total_amount || 0);
    }
    return v;
  }, [events, docsByClient]);

  const niceDate = date ? new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "";
  const isToday = date === new Date().toISOString().slice(0, 10);

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5 max-w-6xl mx-auto print:max-w-none">
      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border print:border-none">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-violet-500/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/30 flex items-center justify-center shadow-sm">
              <CalendarDays className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Day overview {isToday && <span className="text-primary">· Today</span>}</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">{niceDate}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">{events.length} event{events.length === 1 ? "" : "s"} · {totalCrew} crew · {finalizedCount} finalized</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap print:hidden">
            <Button variant="outline" size="icon" className="h-9 w-9" title="Previous day" onClick={() => navigate(`/day/${shiftDate(date, -1)}`)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="h-9" onClick={() => navigate(`/day/${new Date().toISOString().slice(0,10)}`)}>Today</Button>
            <Button variant="outline" size="icon" className="h-9 w-9" title="Next day" onClick={() => navigate(`/day/${shiftDate(date, 1)}`)}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" className="h-9 gap-1.5" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
            <Button variant="ghost" size="sm" className="h-9 gap-1.5" onClick={() => navigate("/calendar")}><ArrowLeft className="h-4 w-4" /> Calendar</Button>
          </div>
        </div>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:hidden">
        <Kpi label="Events" value={String(events.length)} icon={CalendarClock} color="blue" />
        <Kpi label="Crew assigned" value={String(totalCrew)} hint={`${unassignedCount} unassigned`} icon={Users} color="violet" />
        {seesAll && <Kpi label="Day value" value={inr0(dayValue)} icon={IndianRupee} color="emerald" />}
        <Kpi label="Finalized" value={`${finalizedCount}/${events.length}`} icon={CheckCircle2} color="amber" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 print:hidden">
        <p className="text-sm font-semibold text-foreground">Events</p>
        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit">
          {(["table", "cards"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={"px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition " + (view === v ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>{v}</button>
          ))}
        </div>
      </div>

      {/* EVENTS */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <CalendarDays className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No events on this day</p>
        </div>
      ) : view === "table" ? (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold">Event</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Client</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Time</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Venue</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Team</th>
                  {seesAll && <th className="text-right px-3 py-2.5 font-semibold">Estimate</th>}
                  {seesAll && <th className="text-right px-3 py-2.5 font-semibold">Proposal</th>}
                  {seesAll && <th className="text-right px-3 py-2.5 font-semibold">Invoice</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {events.map((e: any) => (
                  <EventRow key={e.id} e={e} memberById={memberById} navigate={navigate} seesAll={seesAll}
                    canManageTeam={canManageTeam} myTeamMember={myTeamMember} docsByClient={docsByClient}
                    organization={organization} onAssign={() => setAssignEvent(e)} onCheckIn={() => setCheckInEvent(e)} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {events.map((e: any) => (
            <EventCard key={e.id} e={e} memberById={memberById} navigate={navigate} seesAll={seesAll}
              canManageTeam={canManageTeam} myTeamMember={myTeamMember} docsByClient={docsByClient}
              organization={organization} onAssign={() => setAssignEvent(e)} onCheckIn={() => setCheckInEvent(e)} />
          ))}
        </div>
      )}

      {/* Editor work log */}
      <EditorWorkLogPanel dateIso={date} canManage={canManageTeam} />

      {assignEvent && <AssignTeamDialog open onOpenChange={(v) => { if (!v) setAssignEvent(null); }} event={assignEvent} />}
      {checkInEvent && <CheckInDialog open onOpenChange={() => setCheckInEvent(null)} event={checkInEvent} teamMemberId={myTeamMember?.id ?? null} />}
    </div>
  );
}

const KPI_TONE: Record<string, string> = {
  blue: "bg-blue-500/10 text-blue-700 border-blue-500/30",
  violet: "bg-violet-500/10 text-violet-700 border-violet-500/30",
  emerald: "bg-emerald-500/10 text-emerald-700 border-emerald-500/30",
  amber: "bg-amber-500/10 text-amber-700 border-amber-500/30",
};
function Kpi({ label, value, hint, icon: Icon, color }: { label: string; value: string; hint?: string; icon: any; color: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className={"inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider border " + (KPI_TONE[color] || "")}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="mt-2 text-xl font-bold text-foreground tabular-nums">{value}</p>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

function TeamCell({ e, memberById, canManageTeam, myTeamMember, onAssign, onCheckIn }: any) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {e.assigned_member_ids.length > 0 ? (
        <div className="flex -space-x-1.5">
          {e.assigned_member_ids.slice(0, 4).map((mid: string) => {
            const m = memberById.get(mid);
            if (!m) return null;
            const init = (m.full_name || "?").split(" ").filter(Boolean).slice(0, 2).map((s: string) => s[0]?.toUpperCase()).join("");
            return <div key={mid} title={m.full_name} className="h-6 w-6 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-card flex items-center justify-center text-[9px] font-bold text-primary">{init}</div>;
          })}
          {e.assigned_member_ids.length > 4 && <div className="h-6 w-6 rounded-full bg-muted border-2 border-card flex items-center justify-center text-[9px] font-medium text-muted-foreground">+{e.assigned_member_ids.length - 4}</div>}
        </div>
      ) : <span className="text-[10px] text-muted-foreground italic inline-flex items-center gap-1"><Lock className="h-3 w-3" />None</span>}
      {canManageTeam && (
        <button onClick={onAssign} title={e.assigned_member_ids.length ? "Edit team" : "Assign team"} className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium border border-border hover:border-primary/40 hover:text-primary transition print:hidden">
          {e.assigned_member_ids.length ? <Pencil className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}{e.assigned_member_ids.length ? "Edit" : "Assign"}
        </button>
      )}
      {myTeamMember && e.assigned_member_ids?.includes(myTeamMember.id) && (
        <button onClick={onCheckIn} title="Check in" className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition print:hidden"><CameraIcon className="h-3 w-3" /> Check in</button>
      )}
    </div>
  );
}

function EventRow({ e, memberById, navigate, seesAll, canManageTeam, myTeamMember, docsByClient, organization, onAssign, onCheckIn }: any) {
  const grad = TYPE_GRADIENT[e.event_type || ""] || TYPE_GRADIENT.Other;
  const est = e.client_id ? docsByClient.est.get(e.client_id) : null;
  const prop = e.client_id ? docsByClient.prop.get(e.client_id) : null;
  const inv = e.client_id ? docsByClient.inv.get(e.client_id) : null;
  return (
    <tr className="hover:bg-muted/20 align-middle">
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-8 w-8 rounded-lg bg-gradient-to-br ${grad} text-white flex items-center justify-center font-bold text-[9px] shrink-0`}>{(e.event_type || "EVT").slice(0, 4)}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{e.name || e.event_type || "Event"}</p>
            {e.is_finalized && <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600"><CheckCircle2 className="h-2.5 w-2.5" />Finalized</span>}
          </div>
        </div>
      </td>
      <td className="px-3 py-2.5">{e.client_name ? <button onClick={() => e.client_id && navigate(`/clients/${e.client_id}`)} className="text-xs text-primary hover:underline truncate max-w-[140px] inline-block align-bottom">{e.client_name}</button> : <span className="text-xs text-muted-foreground">—</span>}</td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{(fmtTime(e.start_time) || fmtTime(e.end_time)) ? `${fmtTime(e.start_time) || "—"}${fmtTime(e.end_time) ? ` → ${fmtTime(e.end_time)}` : ""}` : "—"}</td>
      <td className="px-3 py-2.5 text-xs text-muted-foreground truncate max-w-[140px]">{e.venue || "—"}</td>
      <td className="px-3 py-2.5"><TeamCell e={e} memberById={memberById} canManageTeam={canManageTeam} myTeamMember={myTeamMember} onAssign={onAssign} onCheckIn={onCheckIn} /></td>
      {seesAll && <td className="px-3 py-2.5 text-right"><FinChip label="Estimate" doc={est} kind="estimation" studio={organization} tone="amber" navigate={navigate} clientId={e.client_id} /></td>}
      {seesAll && <td className="px-3 py-2.5 text-right"><FinChip label="Proposal" doc={prop} kind="proposal" studio={organization} tone="violet" navigate={navigate} clientId={e.client_id} /></td>}
      {seesAll && <td className="px-3 py-2.5 text-right"><FinChip label="Invoice" doc={inv} kind="invoice" studio={organization} tone="emerald" navigate={navigate} clientId={e.client_id} /></td>}
    </tr>
  );
}

function EventCard({ e, memberById, navigate, seesAll, canManageTeam, myTeamMember, docsByClient, organization, onAssign, onCheckIn }: any) {
  const grad = TYPE_GRADIENT[e.event_type || ""] || TYPE_GRADIENT.Other;
  const est = e.client_id ? docsByClient.est.get(e.client_id) : null;
  const prop = e.client_id ? docsByClient.prop.get(e.client_id) : null;
  const inv = e.client_id ? docsByClient.inv.get(e.client_id) : null;
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <span className={`h-11 w-11 rounded-xl bg-gradient-to-br ${grad} text-white flex items-center justify-center font-bold text-[10px] shrink-0`}>{(e.event_type || "EVT").slice(0, 4)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-foreground truncate">{e.name || e.event_type || "Event"}</p>
            {e.is_finalized && <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle2 className="h-3 w-3" />Finalized</Badge>}
          </div>
          {e.client_name && <button onClick={() => e.client_id && navigate(`/clients/${e.client_id}`)} className="text-xs text-primary hover:underline">{e.client_name}</button>}
          <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {(fmtTime(e.start_time) || fmtTime(e.end_time)) && <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />{fmtTime(e.start_time) || "—"}{fmtTime(e.end_time) ? ` → ${fmtTime(e.end_time)}` : ""}</span>}
            {e.venue && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.venue}</span>}
          </div>
        </div>
      </div>
      <div className="pt-2 border-t border-border"><TeamCell e={e} memberById={memberById} canManageTeam={canManageTeam} myTeamMember={myTeamMember} onAssign={onAssign} onCheckIn={onCheckIn} /></div>
      {seesAll && (
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <FinChip label="Estimate" doc={est} kind="estimation" studio={organization} tone="amber" navigate={navigate} clientId={e.client_id} />
          <FinChip label="Proposal" doc={prop} kind="proposal" studio={organization} tone="violet" navigate={navigate} clientId={e.client_id} />
          <FinChip label="Invoice" doc={inv} kind="invoice" studio={organization} tone="emerald" navigate={navigate} clientId={e.client_id} />
        </div>
      )}
    </div>
  );
}

function FinChip({ label, doc, kind, studio, tone, navigate, clientId }: any) {
  const Icon = kind === "estimation" ? FileText : kind === "proposal" ? Briefcase : Receipt;
  const toneCls = tone === "amber" ? "bg-amber-500/10 text-amber-700 border-amber-500/30"
    : tone === "violet" ? "bg-violet-500/10 text-violet-700 border-violet-500/30"
    : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
  const amount = doc ? Number(kind === "proposal" ? doc.contract_amount || doc.total_amount || 0 : doc.total_amount || 0) : 0;

  // No doc yet → create button
  if (!doc) {
    return (
      <button onClick={() => clientId && navigate(`/clients/${clientId}`)}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition"
        title={`No ${label.toLowerCase()} yet — create one`}>
        <Plus className="h-3 w-3" /> {label}
      </button>
    );
  }

  // Doc exists → label + amount, then View / Download / Edit
  return (
    <div className={"inline-flex items-center gap-0.5 rounded-md border pl-2 pr-0.5 py-0.5 " + toneCls}>
      <span className="inline-flex items-center gap-1 text-[10px] font-medium">
        <Icon className="h-3 w-3" /> <span className="hidden lg:inline">{label}</span> <span className="tabular-nums font-semibold">{inr0(amount)}</span>
      </span>
      <span className="inline-flex items-center">
        <button onClick={() => generateDocPdf(buildDocPdfPayload(kind, doc, studio), "open")} title={`View ${label}`} className="h-5 w-5 rounded hover:bg-black/10 inline-flex items-center justify-center"><Eye className="h-3 w-3" /></button>
        <button onClick={() => generateDocPdf(buildDocPdfPayload(kind, doc, studio), "download")} title={`Download ${label}`} className="h-5 w-5 rounded hover:bg-black/10 inline-flex items-center justify-center"><Download className="h-3 w-3" /></button>
        <button onClick={() => clientId && navigate(`/clients/${clientId}`)} title={`Edit ${label}`} className="h-5 w-5 rounded hover:bg-black/10 inline-flex items-center justify-center"><Pencil className="h-3 w-3" /></button>
      </span>
    </div>
  );
}
