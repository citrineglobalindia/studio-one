import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, Heart, MapPin, CalendarDays, Users, Package, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { clientStatusConfig, type LiveClient } from "@/data/live-clients-data";
import { ProgressRing } from "./ProgressRing";
import { ClientExpandedCard } from "./ClientExpandedCard";

function DeliveryDateBadge({ deliveryDate, status }: { deliveryDate: string; status: string }) {
  const date = new Date(deliveryDate);
  const now = new Date();
  const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isCompleted = status === "completed";

  return (
    <span className={cn(
      "flex items-center gap-1 text-xs",
      isCompleted ? "text-emerald-500" : daysLeft <= 7 ? "text-amber-500" : "text-muted-foreground"
    )}>
      <Truck className="h-3 w-3" />
      {isCompleted ? "Delivered" : `Delivery: ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
      {!isCompleted && daysLeft <= 7 && daysLeft > 0 && <span className="text-[10px] font-medium">({daysLeft}d)</span>}
    </span>
  );
}

export function ListView({ clients }: { clients: LiveClient[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className="space-y-3">
      {clients.map((client) => {
        const cfg = clientStatusConfig[client.status];
        const isExpanded = expandedId === client.id;
        const delivered = client.deliverables.filter((d) => d.status === "delivered").length;
        const total = client.deliverables.length;

        return (
          <motion.div key={client.id} layout className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all">
            <button onClick={() => setExpandedId(isExpanded ? null : client.id)} className="w-full text-left px-4 py-3.5 flex items-center gap-4 cursor-pointer group">
              <ProgressRing value={client.overallProgress} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{client.name}</p>
                  <Heart className="h-3 w-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{client.partnerName}</p>
                  <Badge variant="outline" className={cn("text-[10px]", cfg.bg, cfg.color, cfg.border)}>{cfg.label}</Badge>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{client.city}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(client.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  <DeliveryDateBadge deliveryDate={client.deliveryDate} status={client.status} />
                  <span className="flex items-center gap-1"><Users className="h-3 w-3" />{client.team.length} members</span>
                  <span className="flex items-center gap-1"><Package className="h-3 w-3" />{delivered}/{total} delivered</span>
                </div>
              </div>
              <div className="hidden lg:flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Paid / Estimate</p>
                  <p className="text-sm font-bold text-foreground">₹{(client.financials.paidAmount / 1000).toFixed(0)}K<span className="text-muted-foreground font-normal"> / ₹{(client.financials.estimatedAmount / 1000).toFixed(0)}K</span></p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Profit</p>
                  <p className={cn("text-sm font-bold", client.financials.profit > 0 ? "text-emerald-500" : "text-red-400")}>₹{(client.financials.profit / 1000).toFixed(0)}K</p>
                </div>
              </div>
              <div className="shrink-0">{isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</div>
            </button>
            <AnimatePresence>{isExpanded && <ClientExpandedCard client={client} />}</AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
