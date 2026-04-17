import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { clientStatusConfig, type LiveClient } from "@/data/live-clients-data";
import { exportClientManagement } from "@/lib/export-excel";

function statusBadge(status?: string) {
  if (!status) return <span className="text-[10px] text-muted-foreground">—</span>;
  const colors: Record<string, string> = {
    pending: "bg-muted text-muted-foreground",
    "in-progress": "bg-blue-500/15 text-blue-400 border-blue-500/20",
    review: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    done: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    partial: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    "on-hold": "bg-amber-500/15 text-amber-400 border-amber-500/20",
  };
  const labels: Record<string, string> = {
    pending: "Pending",
    "in-progress": "In Progress",
    done: "Done",
    delivered: "Delivered",
    partial: "Partial",
    paid: "Paid",
    "on-hold": "On Hold",
    review: "Review",
  };
  return (
    <Badge variant="outline" className={cn("text-[9px] capitalize", colors[status] || "bg-muted text-muted-foreground")}>
      {labels[status] || status}
    </Badge>
  );
}

export function ClientManagementView({ clients }: { clients: LiveClient[] }) {
  // ONE ROW PER EVENT (fallback: one row per client when client has no events yet)
  type FlatRow = { client: LiveClient; event: any | null; project: any | null };
  const rows: FlatRow[] = [];
  for (const client of clients) {
    const evs = ((client as any).events as any[]) || [];
    const proj = (client as any).project ?? null; // not always present; we read project fields from client
    if (evs.length === 0) {
      rows.push({ client, event: null, project: proj });
    } else {
      for (const event of evs) rows.push({ client, event, project: proj });
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-2 text-xs" onClick={() => exportClientManagement(clients)}>
          <Download className="h-3.5 w-3.5" /> Export to Excel
        </Button>
      </div>
      <div className="rounded-2xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <div className="min-w-[2400px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold w-10">Sl</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Event Date</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Customer Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Couple Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Event Name</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Phone No</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Mail ID</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Venue Details</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Service Taken</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Deliverables</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Album Sheets</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Source</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Social Media</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Birthdate</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Address</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Good Will Call</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Data Backup</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">1st Delivery Date</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Payment Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Delivery Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Follow Up Call</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Video Progress</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Album Design</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Album Print</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Final Delivery</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Final Delivery Status</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Final Payment</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Data Filtration</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Review</TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider font-semibold">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ client, event }, idx) => {
                  const cfg = clientStatusConfig[client.status];
                  const paymentPct = client.financials.estimatedAmount > 0
                    ? Math.round((client.financials.paidAmount / client.financials.estimatedAmount) * 100)
                    : 0;
                  // Project-level fields are surfaced onto the client object when present
                  const c: any = client;

                  const eventDate = event?.event_date || client.eventDate;
                  const eventName = event?.name || client.eventType || "—";

                  return (
                    <TableRow key={`${client.id}-${event?.id ?? "noevent"}`} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {eventDate ? new Date(eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                      <TableCell className="text-xs font-medium text-foreground">{client.name}</TableCell>
                      <TableCell className="text-xs font-semibold text-foreground whitespace-nowrap">
                        {client.partnerName ? `${client.name} & ${client.partnerName}` : client.name}
                      </TableCell>
                      <TableCell className="text-xs text-foreground">{eventName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{client.phone || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.email || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{event?.venue || client.city || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.service_taken || client.deliverables.map((d: any) => d.type).join(", ") || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{client.deliverables.map((d: any) => d.label).join(", ") || "—"}</TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">{c.album_sheets ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.source || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.social_media || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.date_of_birth ? new Date(c.date_of_birth).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.address || client.city || "—"}</TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">{c.good_will_call || "—"}</TableCell>
                      <TableCell className="text-center">{statusBadge(c.data_backup_status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {c.first_delivery_date ? new Date(c.first_delivery_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : client.deliveryDate ? new Date(client.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {statusBadge(c.payment_status) !== undefined ? statusBadge(c.payment_status) : (
                          <Badge variant="outline" className={cn("text-[9px]", paymentPct >= 100 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : paymentPct > 0 ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-muted text-muted-foreground")}>
                            {paymentPct >= 100 ? "Paid" : paymentPct > 0 ? `${paymentPct}%` : "Pending"}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{statusBadge(event?.delivery_status || c.delivery_status)}</TableCell>
                      <TableCell className="text-center text-xs text-muted-foreground">{c.follow_up_call || "—"}</TableCell>
                      <TableCell className="text-center">{statusBadge(event?.video_editing_status || c.video_progress)}</TableCell>
                      <TableCell className="text-center">{statusBadge(event?.album_design_status || c.album_design_status)}</TableCell>
                      <TableCell className="text-center">{statusBadge(c.album_print_status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {c.final_delivery_date ? new Date(c.final_delivery_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                      </TableCell>
                      <TableCell className="text-center">{statusBadge(c.final_delivery_status)}</TableCell>
                      <TableCell className="text-center">{statusBadge(c.final_payment_status)}</TableCell>
                      <TableCell className="text-center">{statusBadge(c.data_filtration_status)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{c.review_text || "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <Badge variant="outline" className={cn("text-[9px]", cfg.bg, cfg.color, cfg.border)}>{cfg.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={30} className="py-8 text-center text-sm text-muted-foreground">
                      No clients yet.
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
