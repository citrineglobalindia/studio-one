import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Users, Search, Camera, Video, Edit3, Briefcase, UserCheck,
  CheckCircle2, AlertCircle, Loader2, X, Plus, MessageCircle, MapPin,
} from "lucide-react";
import { useTeamMembers, type DbTeamMember } from "@/hooks/useTeamMembers";
import { useEventAssignments } from "@/hooks/useEventAssignments";
import type { DbEvent } from "@/hooks/useEvents";
import { toast } from "sonner";

const ROLE_META: Record<string, { label: string; icon: typeof Camera; color: string }> = {
  photographer: { label: "Photographers (Office)", icon: Camera, color: "text-blue-500" },
  videographer: { label: "Videographers (Office)", icon: Video, color: "text-purple-500" },
  editor: { label: "Editors", icon: Edit3, color: "text-emerald-500" },
  photographer_vendor: { label: "Photographers (Vendor)", icon: Camera, color: "text-blue-400" },
  videographer_vendor: { label: "Videographers (Vendor)", icon: Video, color: "text-purple-400" },
};

function initials(name: string) {
  return (name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
}

const REQ_LABELS: Record<string, string> = {
  traditional_photographer: "Traditional Photographer",
  traditional_videographer: "Traditional Videographer",
  candid_photographer: "Candid Photographer",
  candid_videographer: "Candid Videographer",
  semi_candid_photographer: "Semi-Candid Photographer",
  semi_candid_videographer: "Semi-Candid Videographer",
  drone_shoot: "Drone Shoot",
  led_wall: "LED Wall",
  live_streaming: "Live Streaming",
};

function fmtTime(t?: string | null) { return t ? String(t).slice(0, 5) : ""; }

function buildAssignmentMessage(member: DbTeamMember, event: DbEvent): string {
  const dateStr = event.event_date
    ? new Date(event.event_date).toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })
    : "";
  const time = fmtTime(event.start_time) ? `${fmtTime(event.start_time)}${fmtTime(event.end_time) ? " - " + fmtTime(event.end_time) : ""}` : "";
  const reqs = Array.isArray(event.requirements) ? event.requirements.map((r) => REQ_LABELS[r] || r).join(", ") : "";
  const lines = [
    `Hi ${member.full_name},`,
    ``,
    `You have been assigned to an event:`,
    `*${event.event_type || event.name || "Event"}*`,
    dateStr ? `Date: ${dateStr}` : "",
    time ? `Time: ${time}` : "",
    event.venue ? `Venue: ${event.venue}` : "",
    (event as any).venue_map_url ? `Location: ${(event as any).venue_map_url}` : "",
    reqs ? `Requirements: ${reqs}` : "",
    event.notes ? `Notes: ${event.notes}` : "",
    ``,
    `Please confirm your availability. Thank you!`,
  ].filter(Boolean);
  return lines.join("\n");
}

function sendAssignmentWhatsApp(member: DbTeamMember, event: DbEvent) {
  const digits = (member.phone || "").replace(/\D/g, "");
  const wa = digits.length >= 10 ? `91${digits.slice(-10)}` : "";
  const text = encodeURIComponent(buildAssignmentMessage(member, event));
  window.open(`https://wa.me/${wa}?text=${text}`, "_blank", "noopener,noreferrer");
}

export function AssignTeamDialog({
  open, onOpenChange, event,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: DbEvent | null;
}) {
  const { members, isLoading: membersLoading } = useTeamMembers();
  const {
    assignedIds, conflicts, isLoading: assignLoading,
    assignMember, unassignMember,
  } = useEventAssignments(event?.id, event?.event_date);

  const [search, setSearch] = useState("");

  // Only operational team members (skip admin/accounts/sales)
  const operationalMembers = useMemo(
    () => members.filter((m) => {
      const r = (m.role || "").toLowerCase();
      return r in ROLE_META;
    }),
    [members]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return operationalMembers;
    return operationalMembers.filter((m) =>
      [m.full_name, m.role, m.phone, m.email].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [operationalMembers, search]);

  // Group by role
  const grouped = useMemo(() => {
    const g: Record<string, DbTeamMember[]> = {};
    for (const m of filtered) {
      const k = (m.role || "other").toLowerCase();
      (g[k] ||= []).push(m);
    }
    return g;
  }, [filtered]);

  const toggle = async (m: DbTeamMember) => {
    if (assignedIds.has(m.id)) {
      unassignMember.mutate(m.id);
      return;
    }
    if (conflicts.has(m.id)) {
      toast.error(`${m.full_name} is already booked on "${conflicts.get(m.id)}" the same day`);
      return;
    }
    try {
      await assignMember.mutateAsync(m.id);
    } catch (e) {
      // toast already handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" /> Assign team
          </DialogTitle>
          {event && (
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2 mt-1">
              <span className="font-medium text-foreground">{event.event_type || event.name}</span>
              {event.event_date && (
                <Badge variant="outline" className="text-[10px]">
                  {new Date(event.event_date).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                </Badge>
              )}
              {event.venue && <span>• {event.venue}</span>}
              <span className="ml-auto inline-flex items-center gap-1 text-[11px]">
                <UserCheck className="h-3 w-3" /> {assignedIds.size} assigned
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search team members…" className="pl-9" />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
          {membersLoading || assignLoading ? (
            <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
          ) : operationalMembers.length === 0 ? (
            <div className="py-10 text-center">
              <Briefcase className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No operational team members yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">Add photographers / videographers / editors via Users page</p>
            </div>
          ) : (
            Object.entries(ROLE_META).map(([roleKey, meta]) => {
              const list = grouped[roleKey] ?? [];
              if (list.length === 0) return null;
              const Icon = meta.icon;
              return (
                <div key={roleKey} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                      {meta.label}
                    </p>
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{list.length}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {list.map((m) => {
                      const isAssigned = assignedIds.has(m.id);
                      const conflictEvent = conflicts.get(m.id);
                      const blocked = !isAssigned && !!conflictEvent;
                      return (
                        <div
                          key={m.id}
                          role="button"
                          tabIndex={blocked ? -1 : 0}
                          onClick={() => { if (!blocked) toggle(m); }}
                          onKeyDown={(e) => { if (!blocked && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggle(m); } }}
                          className={
                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition cursor-pointer " +
                            (isAssigned
                              ? "border-primary bg-primary/[0.07] ring-1 ring-primary/30"
                              : blocked
                                ? "border-rose-300/40 bg-rose-500/[0.04] opacity-75 cursor-not-allowed"
                                : "border-border bg-card hover:border-border/80 hover:bg-muted/30")
                          }
                          title={blocked ? `Already booked on "${conflictEvent}"` : undefined}
                        >
                          <div className={
                            "h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-semibold shrink-0 " +
                            (isAssigned ? "bg-primary text-primary-foreground" : "bg-muted text-foreground")
                          }>
                            {initials(m.full_name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{m.full_name}</p>
                            <div className="text-[11px] text-muted-foreground flex flex-wrap gap-x-2">
                              {m.role && <span className="capitalize">{m.role.replace(/_/g, " ")}</span>}
                              {m.phone && <span>• {m.phone}</span>}
                              {m.daily_rate ? <span>• ₹{Number(m.daily_rate).toLocaleString("en-IN")}/day</span> : null}
                            </div>
                            {blocked && conflictEvent && (
                              <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-rose-600">
                                <AlertCircle className="h-3 w-3" />
                                Already booked on "{conflictEvent}" the same day
                              </div>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            {isAssigned && event && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); if (!m.phone) { toast.error(`No phone number saved for ${m.full_name}`); return; } sendAssignmentWhatsApp(m, event); }}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 px-2 py-1 text-[11px] font-medium hover:bg-emerald-500/20 transition"
                                title={m.phone ? "Send event details on WhatsApp" : "No phone number saved"}
                              >
                                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                              </button>
                            )}
                            {isAssigned ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-primary font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Assigned
                              </span>
                            ) : blocked ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-600 font-medium">
                                <X className="h-3.5 w-3.5" /> Blocked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Plus className="h-3.5 w-3.5" /> Assign
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
