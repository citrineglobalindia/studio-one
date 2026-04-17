import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { clientStatusConfig, type LiveClient } from "@/data/live-clients-data";
import { exportEventTracking } from "@/lib/export-excel";

interface EditableCellProps {
  value: string;
  onSave: (val: string) => void;
  placeholder?: string;
}

function EditableCell({ value, onSave, placeholder = "—" }: EditableCellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = useCallback(() => {
    setEditing(false);
    if (draft !== value) onSave(draft);
  }, [draft, value, onSave]);

  if (editing) {
    return (
      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        className="h-6 text-xs px-1.5 py-0 min-w-[80px]"
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className="text-xs text-muted-foreground cursor-pointer hover:text-foreground hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors inline-block min-w-[40px]"
      title="Click to edit"
    >
      {value || placeholder}
    </span>
  );
}

interface EventTrackingViewProps {
  clients: LiveClient[];
  /** rowId is either project_id OR event_id; scope tells caller which table to write to. */
  onUpdateField?: (rowId: string, field: string, value: string, scope?: "project" | "event") => void;
}

function statusBadge(status?: string) {
  if (!status) return <span className="text-[10px] text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    "in-progress": "bg-blue-500/15 text-blue-400 border-blue-500/20",
    review: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    sent: "bg-blue-500/15 text-blue-400 border-blue-500/20",
    accepted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    rejected: "bg-destructive/15 text-destructive border-destructive/30",
    "on-hold": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    "in-progress": "In Progress",
    done: "Done",
    delivered: "Delivered",
    sent: "Sent",
    accepted: "Accepted",
    rejected: "Rejected",
    "on-hold": "On Hold",
    review: "Review",
  };
  return (
    <Badge variant="outline" className={cn("text-[9px] capitalize", colors[status] || "bg-muted text-muted-foreground")}>
      {labels[status] || status}
    </Badge>
  );
}

const EVENT_STAGE_KEYS = [
  "data_copy_status",
  "backup_status",
  "delivery_hdd_status",
  "video_editing_status",
  "album_design_status",
  "delivery_status",
] as const;

function eventProgress(ev: any): number {
  let done = 0;
  let total = 0;
  for (const k of EVENT_STAGE_KEYS) {
    total++;
    const v = ev[k];
    if (v === "done" || v === "delivered" || v === "completed") done++;
  }
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

export function EventTrackingView({ clients, onUpdateField }: EventTrackingViewProps) {
  // Flatten: ONE ROW PER EVENT. Clients with no events still get one fallback row.
  type FlatRow = { client: LiveClient; event: any | null };
  const rows: FlatRow[] = [];
  for (const client of clients) {
    const evs = ((client as any).events as any[]) || [];
    if (evs.length === 0) {
      rows.push({ client, event: null });
    } else {
      for (const event of evs) rows.push({ client, event });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => exportEventTracking(clients)}>
          <Download className="h-3.5 w-3.5" /> Export to Excel
        </Button>
      </div>
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <div className="min-w-[1800px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold w-12">Sl #</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Event Category</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Event Date</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Couple Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Quotation Services</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Actual Services</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Event Time</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Assigned Technician</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Type of Technician</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Event Venue</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Card Number</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Raw Data Size</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Data Copy</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Backup</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Delivery HDD</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Photo Filter &amp; Grade</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Video Editing</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Album Design</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Assigned Date</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Delivery %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ client, event }, idx) => {
                  const cfg = clientStatusConfig[client.status];
                  const progress = event ? eventProgress(event) : 0;
                  const rowId = event?.id || client.id;
                  const scope: "event" | "project" = event ? "event" : "project";
                  const members = event ? ((event.assignedTeam as any[]) || []) : (client.team as any[]);

                  return (
                    <TableRow key={`${client.id}-${event?.id ?? "noevent"}`} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                      <TableCell className="text-xs font-medium text-foreground capitalize">{event?.event_type || client.eventType || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {event?.event_date
                          ? new Date(event.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : client.eventDate
                            ? new Date(client.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                            : "—"}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-semibold text-foreground">
                          {event?.name || (client.partnerName ? `${client.name} & ${client.partnerName}` : client.name)}
                        </p>
                        {event && (
                          <p className="text-[10px] text-muted-foreground">{client.name}{client.partnerName ? ` & ${client.partnerName}` : ""}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{statusBadge(event?.quotation_services_status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <EditableCell
                          value={event?.actual_services ?? ""}
                          onSave={(v) => onUpdateField?.(rowId, "actual_services", v, scope)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {event?.start_time ? String(event.start_time).slice(0, 5) : "—"}
                        {event?.end_time && <> – {String(event.end_time).slice(0, 5)}</>}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">
                        {members.length > 0 ? members.map((t: any) => t.full_name || t.name).join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground capitalize">
                        {members.length > 0 ? members.map((t: any) => t.role).join(", ") : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{event?.venue || client.city || "—"}</TableCell>
                      <TableCell>
                        <EditableCell
                          value={event?.card_number ?? ""}
                          onSave={(v) => onUpdateField?.(rowId, "card_number", v, scope)}
                        />
                      </TableCell>
                      <TableCell>
                        <EditableCell
                          value={event?.raw_data_size ?? ""}
                          onSave={(v) => onUpdateField?.(rowId, "raw_data_size", v, scope)}
                          placeholder="0 MB"
                        />
                      </TableCell>
                      <TableCell className="text-center">{statusBadge(event?.data_copy_status)}</TableCell>
                      <TableCell className="text-center">{statusBadge(event?.backup_status)}</TableCell>
                      <TableCell className="text-center">{statusBadge(event?.delivery_hdd_status)}</TableCell>
                      <TableCell>
                        <EditableCell
                          value={event?.photo_filter_grade ?? ""}
                          onSave={(v) => onUpdateField?.(rowId, "photo_filter_grade", v, scope)}
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell className="text-center">{statusBadge(event?.video_editing_status)}</TableCell>
                      <TableCell className="text-center">{statusBadge(event?.album_design_status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {event?.assigned_date
                          ? new Date(event.assigned_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {event ? (
                          statusBadge(event.status)
                        ) : (
                          <Badge variant="outline" className={cn("text-[9px]", cfg.bg, cfg.color, cfg.border)}>{cfg.label}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <div className="w-12 h-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-emerald-500" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-[10px] font-semibold text-foreground tabular-nums">{progress}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={21} className="py-8 text-center text-sm text-muted-foreground">
                      No events yet. Add one from the Events page.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
