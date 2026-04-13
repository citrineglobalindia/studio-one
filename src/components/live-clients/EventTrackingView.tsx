import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { clientStatusConfig, type LiveClient } from "@/data/live-clients-data";

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
  onUpdateField?: (projectId: string, field: string, value: string) => void;
}

export function EventTrackingView({ clients, onUpdateField }: EventTrackingViewProps) {
  return (
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
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Quotation Services</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Actual Services</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Event Time</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Assigned Technician</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Type of Technician</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Event Venue</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Card Number</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Raw Data Size</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Data Copy</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Backup Number</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Delivery HDD</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Photo Filter & Grade</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Video Editing</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Album Design</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Assigned Date</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Status</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Delivery Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client, idx) => {
                const cfg = clientStatusConfig[client.status];
                const photosDel = client.deliverables.find(d => d.type === "Photos");
                const videoDel = client.deliverables.find(d => d.type === "Videos");
                const albumDel = client.deliverables.find(d => d.type === "Albums");
                const deliveredCount = client.deliverables.filter(d => d.status === "delivered").length;
                const totalDel = client.deliverables.length;

                const getStatusBadge = (del?: typeof photosDel) => {
                  if (!del) return <span className="text-[10px] text-muted-foreground">—</span>;
                  const colors: Record<string, string> = {
                    pending: "bg-muted text-muted-foreground",
                    "in-progress": "bg-blue-500/15 text-blue-400 border-blue-500/20",
                    review: "bg-amber-500/15 text-amber-400 border-amber-500/20",
                    delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
                  };
                  return <Badge variant="outline" className={cn("text-[9px]", colors[del.status])}>{del.status === "in-progress" ? "In Progress" : del.status === "delivered" ? "Done" : del.status === "review" ? "Review" : "Pending"}</Badge>;
                };

                return (
                  <TableRow key={client.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                    <TableCell className="text-xs font-medium text-foreground">{client.eventType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {client.eventDate ? new Date(client.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-semibold text-foreground">{client.name}{client.partnerName ? ` & ${client.partnerName}` : ""}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{client.deliverables.map(d => d.type).join(", ") || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{client.deliverables.filter(d => d.status !== "pending").map(d => d.type).join(", ") || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-xs text-foreground">
                      {client.team.length > 0 ? client.team.map(t => t.name).join(", ") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {client.team.length > 0 ? client.team.map(t => t.role).join(", ") : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{client.city || "—"}</TableCell>
                    <TableCell>
                      <EditableCell
                        value={client.cardNumber || ""}
                        onSave={(v) => onUpdateField?.(client.id, "card_number", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={client.rawDataSize || ""}
                        onSave={(v) => onUpdateField?.(client.id, "raw_data_size", v)}
                      />
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">—</TableCell>
                    <TableCell>
                      <EditableCell
                        value={client.backupNumber || ""}
                        onSave={(v) => onUpdateField?.(client.id, "backup_number", v)}
                      />
                    </TableCell>
                    <TableCell>
                      <EditableCell
                        value={client.deliveryHdd || ""}
                        onSave={(v) => onUpdateField?.(client.id, "delivery_hdd", v)}
                      />
                    </TableCell>
                    <TableCell className="text-center">{getStatusBadge(photosDel)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(videoDel)}</TableCell>
                    <TableCell className="text-center">{getStatusBadge(albumDel)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(client.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-[9px]", cfg.bg, cfg.color, cfg.border)}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("text-[10px] font-semibold", deliveredCount === totalDel && totalDel > 0 ? "text-emerald-500" : "text-amber-400")}>
                        {deliveredCount}/{totalDel}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
