import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays, Plus, Pencil, Trash2, ArrowUp, ArrowDown,
  Clock, MapPin, Loader2, CalendarX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useClientEvents, type DbEvent } from "@/hooks/useEvents";
import { useRole } from "@/contexts/RoleContext";
import { EventDialog } from "./EventDialog";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  "in-progress": "bg-amber-500/15 text-amber-600 border-amber-500/30",
  completed: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  cancelled: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

const REQ_LABEL: Record<string, { short: string; full: string; color: string }> = {
  traditional_photographer: { short: "Trad Photo", full: "Traditional Photographer", color: "bg-blue-500/10 text-blue-600 border-blue-500/30" },
  traditional_videographer: { short: "Trad Video", full: "Traditional Videographer", color: "bg-purple-500/10 text-purple-600 border-purple-500/30" },
  candid_photographer:     { short: "Candid Photo", full: "Candid Photographer",     color: "bg-rose-500/10 text-rose-600 border-rose-500/30" },
  candid_videographer:     { short: "Candid Video", full: "Candid Videographer",     color: "bg-amber-500/10 text-amber-700 border-amber-500/30" },
  drone_shoot:             { short: "Drone",        full: "Drone Shoot",             color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
  led_wall:                { short: "LED Wall",     full: "LED Wall",                color: "bg-indigo-500/10 text-indigo-600 border-indigo-500/30" },
};

const TYPE_COLORS: Record<string, string> = {
  Wedding: "from-rose-500 to-pink-500",
  "Pre-Wedding": "from-purple-500 to-fuchsia-500",
  Engagement: "from-amber-500 to-orange-500",
  Reception: "from-blue-500 to-cyan-500",
  Sangeet: "from-fuchsia-500 to-rose-500",
  Haldi: "from-yellow-500 to-amber-500",
  Mehendi: "from-green-500 to-emerald-500",
  Roka: "from-violet-500 to-purple-500",
  Birthday: "from-pink-500 to-rose-500",
  Anniversary: "from-rose-500 to-red-500",
  Corporate: "from-slate-500 to-gray-500",
  Other: "from-indigo-500 to-violet-500",
};

function fmtDate(d: string | null) {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
  } catch { return d; }
}

function fmtTime(t: string | null) {
  if (!t) return null;
  return String(t).slice(0, 5);
}

export function EventsTimeline({ clientId, defaultVenue }: { clientId: string; defaultVenue: string | null }) {
  const { currentRole } = useRole();
  const canManage = currentRole === "admin" || currentRole === "administrator";

  const { events, isLoading, addEvent, updateEvent, deleteEvent, swapOrder } = useClientEvents(clientId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DbEvent | null>(null);

  const openAdd = () => { setEditing(null); setDialogOpen(true); };
  const openEdit = (e: DbEvent) => { setEditing(e); setDialogOpen(true); };

  const onSubmit = async (payload: Partial<DbEvent>) => {
    if (editing) await updateEvent.mutateAsync({ id: editing.id, ...payload });
    else await addEvent.mutateAsync(payload);
  };

  const move = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= events.length) return;
    swapOrder.mutate({ a: events[idx], b: events[next] });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">
            <CalendarDays className="h-4 w-4 text-primary" />
          </div>
          <h4 className="text-sm font-semibold text-foreground tracking-tight">Events</h4>
          {events.length > 0 && (
            <Badge variant="secondary" className="text-[10px]">{events.length}</Badge>
          )}
        </div>
        {canManage && (
          <Button size="sm" className="gap-1.5 h-8" onClick={openAdd}>
            <Plus className="h-3.5 w-3.5" /> Add event
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-4 md:p-5">
        {isLoading ? (
          <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
        ) : events.length === 0 ? (
          <div className="py-10 text-center">
            <CalendarX className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No events yet for this client</p>
            {canManage && (
              <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={openAdd}>
                <Plus className="h-3.5 w-3.5" /> Add first event
              </Button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-[27px] top-2 bottom-2 w-px bg-border" aria-hidden />

            <AnimatePresence initial={false}>
              {events.map((e, idx) => {
                const dateLabel = fmtDate(e.event_date);
                const start = fmtTime(e.start_time);
                const end = fmtTime(e.end_time);
                const gradient = TYPE_COLORS[e.event_type || ""] || TYPE_COLORS.Other;
                const statusClass = STATUS_COLORS[String(e.status || "upcoming")] || STATUS_COLORS.upcoming;

                return (
                  <motion.div
                    key={e.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="relative flex gap-3 pb-4 last:pb-0"
                  >
                    {/* Dot + Order number */}
                    <div className="shrink-0 w-14 flex flex-col items-center pt-1.5">
                      <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${gradient} text-white flex flex-col items-center justify-center font-bold shadow-sm`}>
                        <span className="text-[9px] leading-none opacity-80">#{idx + 1}</span>
                        <span className="text-[10px] leading-none mt-0.5">{e.event_type?.slice(0, 4) || "EVT"}</span>
                      </div>
                    </div>

                    {/* Card */}
                    <div className="flex-1 min-w-0 rounded-xl border border-border bg-background p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-foreground">{e.event_type || "Event"}</p>
                            <Badge variant="outline" className={`text-[10px] capitalize ${statusClass}`}>
                              {String(e.status || "upcoming")}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {dateLabel && (
                              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{dateLabel}</span>
                            )}
                            {(start || end) && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {start || "—"}{end ? ` → ${end}` : ""}
                              </span>
                            )}
                            {e.venue && (
                              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.venue}</span>
                            )}
                          </div>
                          {Array.isArray(e.requirements) && e.requirements.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {e.requirements.map((r) => {
                                const meta = REQ_LABEL[r];
                                return (
                                  <span
                                    key={r}
                                    title={meta?.full || r}
                                    className={"inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-full border " + (meta?.color || "bg-muted text-foreground border-border")}
                                  >
                                    {meta?.short || r}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                          {e.notes && (
                            <p className="text-xs text-foreground/80 mt-2 whitespace-pre-wrap">{e.notes}</p>
                          )}
                        </div>

                        {canManage && (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              size="icon" variant="ghost"
                              className="h-7 w-7"
                              onClick={() => move(idx, -1)}
                              disabled={idx === 0 || swapOrder.isPending}
                              title="Move up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon" variant="ghost"
                              className="h-7 w-7"
                              onClick={() => move(idx, 1)}
                              disabled={idx === events.length - 1 || swapOrder.isPending}
                              title="Move down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon" variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEdit(e)}
                              title="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon" variant="ghost"
                              className="h-7 w-7 text-rose-500"
                              onClick={() => {
                                if (window.confirm(`Delete "${e.event_type || "this event"}"? This cannot be undone.`)) {
                                  deleteEvent.mutate(e.id);
                                }
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editing}
        defaultVenue={defaultVenue}
        onSubmit={onSubmit}
      />
    </motion.div>
  );
}
