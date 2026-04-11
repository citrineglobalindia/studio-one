import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Heart, ChevronDown, ChevronUp, Truck } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { clientStatusConfig, type LiveClient } from "@/data/live-clients-data";
import { ClientExpandedCard } from "./ClientExpandedCard";

export function TableView({ clients }: { clients: LiveClient[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold w-[200px]">Client</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Progress</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center">Status</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold hidden md:table-cell">Event</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold hidden md:table-cell">Delivery</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold hidden md:table-cell">City</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center hidden lg:table-cell">Team</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-center hidden lg:table-cell">Deliverables</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right hidden lg:table-cell">Estimate</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right hidden lg:table-cell">Paid</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-semibold text-right hidden xl:table-cell">Profit</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const cfg = clientStatusConfig[client.status];
            const isExpanded = expandedId === client.id;
            const delivered = client.deliverables.filter((d) => d.status === "delivered").length;
            const total = client.deliverables.length;
            const profitColor = client.financials.profit > 0 ? "text-emerald-500" : "text-red-400";
            const deliveryDate = new Date(client.deliveryDate);
            const now = new Date();
            const daysToDelivery = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            return (
              <>
                <TableRow
                  key={client.id}
                  className="cursor-pointer hover:bg-muted/20 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : client.id)}
                >
                  <TableCell>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{client.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3" />{client.partnerName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      <Progress value={client.overallProgress} className="h-2 w-16" />
                      <span className="text-[10px] font-mono font-bold text-muted-foreground">{client.overallProgress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={cn("text-[10px]", cfg.bg, cfg.color, cfg.border)}>{cfg.label}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {new Date(client.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className={cn(
                      "flex items-center gap-1 text-xs",
                      client.status === "completed" ? "text-emerald-500" : daysToDelivery <= 7 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      <Truck className="h-3 w-3" />
                      {client.status === "completed" ? "Done" : deliveryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{client.city}</TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    <div className="flex justify-center -space-x-1">
                      {client.team.slice(0, 3).map((m) => (
                        <div key={m.id} className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[8px] font-bold ring-2 ring-card" title={m.name}>
                          {m.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                      ))}
                      {client.team.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[8px] font-bold ring-2 ring-card">+{client.team.length - 3}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    <span className="text-xs font-medium text-foreground">{delivered}<span className="text-muted-foreground">/{total}</span></span>
                  </TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-xs font-semibold text-foreground">₹{(client.financials.estimatedAmount / 1000).toFixed(0)}K</TableCell>
                  <TableCell className="text-right hidden lg:table-cell text-xs font-semibold text-emerald-500">₹{(client.financials.paidAmount / 1000).toFixed(0)}K</TableCell>
                  <TableCell className={cn("text-right hidden xl:table-cell text-xs font-bold", profitColor)}>₹{(client.financials.profit / 1000).toFixed(0)}K</TableCell>
                  <TableCell>{isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</TableCell>
                </TableRow>
                {isExpanded && (
                  <TableRow key={`${client.id}-expanded`}>
                    <TableCell colSpan={12} className="p-0">
                      <AnimatePresence><ClientExpandedCard client={client} /></AnimatePresence>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
