import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { clientStatusConfig, type LiveClient } from "@/data/live-clients-data";

export function ClientManagementView({ clients }: { clients: LiveClient[] }) {
  return (
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
              {clients.map((client, idx) => {
                const cfg = clientStatusConfig[client.status];
                const videosDel = client.deliverables.find(d => d.type === "Videos");
                const albumDel = client.deliverables.find(d => d.type === "Albums");
                const photosDel = client.deliverables.find(d => d.type === "Photos");
                const deliveredCount = client.deliverables.filter(d => d.status === "delivered").length;
                const totalDel = client.deliverables.length;
                const allDelivered = deliveredCount === totalDel && totalDel > 0;
                const paymentPct = client.financials.estimatedAmount > 0 
                  ? Math.round((client.financials.paidAmount / client.financials.estimatedAmount) * 100) 
                  : 0;

                const statusBadge = (status?: string) => {
                  if (!status) return <span className="text-[10px] text-muted-foreground">—</span>;
                  const colors: Record<string, string> = {
                    pending: "bg-muted text-muted-foreground",
                    "in-progress": "bg-blue-500/15 text-blue-400 border-blue-500/20",
                    review: "bg-amber-500/15 text-amber-400 border-amber-500/20",
                    delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
                  };
                  const labels: Record<string, string> = {
                    pending: "Pending", "in-progress": "In Progress", review: "Review", delivered: "Done",
                  };
                  return <Badge variant="outline" className={cn("text-[9px]", colors[status])}>{labels[status] || status}</Badge>;
                };

                return (
                  <TableRow key={client.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="text-xs text-muted-foreground font-mono">{idx + 1}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {client.eventDate ? new Date(client.eventDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">{client.name}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground whitespace-nowrap">{client.name} & {client.partnerName}</TableCell>
                    <TableCell className="text-xs text-foreground">{client.eventType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{client.phone || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{client.city || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{client.deliverables.map(d => d.type).join(", ") || "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{client.deliverables.map(d => d.label).join(", ") || "—"}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{client.city || "—"}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {client.deliveryDate ? new Date(client.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-[9px]", paymentPct >= 100 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : paymentPct > 0 ? "bg-amber-500/15 text-amber-400 border-amber-500/20" : "bg-muted text-muted-foreground")}>
                        {paymentPct >= 100 ? "Paid" : paymentPct > 0 ? `${paymentPct}%` : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn("text-[10px] font-semibold", allDelivered ? "text-emerald-500" : "text-amber-400")}>
                        {deliveredCount}/{totalDel}
                      </span>
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-center">{statusBadge(videosDel?.status)}</TableCell>
                    <TableCell className="text-center">{statusBadge(albumDel?.status)}</TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {client.deliveryDate ? new Date(client.deliveryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-[9px]", cfg.bg, cfg.color, cfg.border)}>{cfg.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn("text-[9px]", paymentPct >= 100 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground")}>
                        {paymentPct >= 100 ? "Cleared" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">{statusBadge(photosDel?.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">—</TableCell>
                    <TableCell className="text-xs text-muted-foreground">—</TableCell>
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
