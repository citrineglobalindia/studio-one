import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CalendarDays, Clock, MapPin, Lock, CheckCircle2, UserPlus, Pencil,
  FileText, Briefcase, Receipt, Camera as CameraIcon, ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
function inrShort(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));
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

  const niceDate = date ? new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }) : "";

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Day overview</p>
            <h1 className="text-xl font-bold text-foreground tracking-tight">{niceDate}</h1>
            <p className="text-xs text-muted-foreground">{events.length} event{events.length === 1 ? "" : "s"} scheduled</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => window.close()}>
          Close
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Loading…</p>
      ) : events.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10 rounded-xl border border-dashed border-border">No events on this day</p>
      ) : (
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
                {events.map((e: any) => {
                  const grad = TYPE_GRADIENT[e.event_type || ""] || TYPE_GRADIENT.Other;
                  const est = e.client_id ? docsByClient.est.get(e.client_id) : null;
                  const prop = e.client_id ? docsByClient.prop.get(e.client_id) : null;
                  const inv = e.client_id ? docsByClient.inv.get(e.client_id) : null;
                  return (
                    <tr key={e.id} className="hover:bg-muted/20 align-middle">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`h-8 w-8 rounded-lg bg-gradient-to-br ${grad} text-white flex items-center justify-center font-bold text-[9px] shrink-0`}>{(e.event_type || "EVT").slice(0, 4)}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{e.name || e.event_type || "Event"}</p>
                            {e.is_finalized && <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600"><CheckCircle2 className="h-2.5 w-2.5" />Finalized</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        {e.client_name ? <button onClick={() => e.client_id && navigate(`/clients/${e.client_id}`)} className="text-xs text-primary hover:underline truncate max-w-[140px] inline-block align-bottom">{e.client_name}</button> : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{(fmtTime(e.start_time) || fmtTime(e.end_time)) ? `${fmtTime(e.start_time) || "—"}${fmtTime(e.end_time) ? ` → ${fmtTime(e.end_time)}` : ""}` : "—"}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground truncate max-w-[140px]">{e.venue || "—"}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
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
                            <button onClick={() => setAssignEvent(e)} title={e.assigned_member_ids.length ? "Edit team" : "Assign team"} className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium border border-border hover:border-primary/40 hover:text-primary transition">
                              {e.assigned_member_ids.length ? <Pencil className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}{e.assigned_member_ids.length ? "Edit" : "Assign"}
                            </button>
                          )}
                          {myTeamMember && e.assigned_member_ids?.includes(myTeamMember.id) && (
                            <button onClick={() => setCheckInEvent(e)} title="Check in" className="inline-flex items-center gap-1 px-1.5 py-1 rounded-md text-[10px] font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition"><CameraIcon className="h-3 w-3" /> Check in</button>
                          )}
                        </div>
                      </td>
                      {seesAll && <td className="px-3 py-2.5 text-right"><FinChip label="Estimate" doc={est} kind="estimation" studio={organization} tone="amber" navigate={navigate} clientId={e.client_id} /></td>}
                      {seesAll && <td className="px-3 py-2.5 text-right"><FinChip label="Proposal" doc={prop} kind="proposal" studio={organization} tone="violet" navigate={navigate} clientId={e.client_id} /></td>}
                      {seesAll && <td className="px-3 py-2.5 text-right"><FinChip label="Invoice" doc={inv} kind="invoice" studio={organization} tone="emerald" navigate={navigate} clientId={e.client_id} /></td>}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EditorWorkLogPanel dateIso={date} canManage={canManageTeam} />

      {assignEvent && <AssignTeamDialog open onOpenChange={(v) => { if (!v) setAssignEvent(null); }} event={assignEvent} />}
      {checkInEvent && <CheckInDialog open onOpenChange={() => setCheckInEvent(null)} event={checkInEvent} teamMemberId={myTeamMember?.id ?? null} />}
    </div>
  );
}

function FinChip({ label, doc, kind, studio, tone, navigate, clientId }: {
  label: string; doc: any; kind: "estimation" | "proposal" | "invoice"; studio: any;
  tone: "amber" | "violet" | "emerald"; navigate: (p: string) => void; clientId: string | null;
}) {
  const Icon = kind === "estimation" ? FileText : kind === "proposal" ? Briefcase : Receipt;
  const toneCls = tone === "amber" ? "bg-amber-500/10 text-amber-700 border-amber-500/30 hover:bg-amber-500/20"
    : tone === "violet" ? "bg-violet-500/10 text-violet-700 border-violet-500/30 hover:bg-violet-500/20"
    : "bg-emerald-500/10 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/20";
  const amount = doc ? Number(kind === "proposal" ? doc.contract_amount || doc.total_amount || 0 : doc.total_amount || 0) : 0;
  if (!doc) {
    return <button onClick={() => clientId && navigate(`/clients/${clientId}`)} className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border border-dashed border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition" title={`No ${label.toLowerCase()} yet — create one`}><Icon className="h-3 w-3" /> {label} <span className="opacity-60">+</span></button>;
  }
  return <button onClick={() => generateDocPdf(buildDocPdfPayload(kind, doc, studio), "open")} className={"inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium border transition " + toneCls} title={`Open ${label} PDF`}><Icon className="h-3 w-3" /> {label} <span className="tabular-nums font-semibold">{inrShort(amount)}</span></button>;
}
