import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Heart, MapPin, CalendarDays, Users, Package, Truck,
  Camera, Video, BookImage, Film, HardDrive,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { clientStatusConfig, deliverableStatusConfig, type LiveClient } from "@/data/live-clients-data";
import { ProgressRing } from "./ProgressRing";

const deliverableIcon: Record<string, React.ElementType> = {
  Photos: Camera, Videos: Video, Albums: BookImage, Highlights: Film, "Footage Copy": HardDrive,
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

export function CardView({ clients }: { clients: LiveClient[] }) {
  return (
    <motion.div
      variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
    >
      {clients.map((client) => {
        const cfg = clientStatusConfig[client.status];
        const delivered = client.deliverables.filter((d) => d.status === "delivered").length;
        const total = client.deliverables.length;
        const profitMargin = client.financials.estimatedAmount > 0
          ? Math.round((client.financials.profit / client.financials.estimatedAmount) * 100) : 0;
        const deliveryDate = new Date(client.deliveryDate);
        const now = new Date();
        const daysToDelivery = Math.ceil((deliveryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return (
          <motion.div
            key={client.id}
            variants={cardVariants}
            whileHover={{ y: -2 }}
            className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all group"
          >
            <div className={cn("h-1", client.status === "completed" ? "bg-gradient-to-r from-blue-500 to-blue-400/40" : client.status === "active" ? "bg-gradient-to-r from-emerald-500 to-emerald-400/40" : "bg-gradient-to-r from-amber-500 to-amber-400/40")} />

            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <ProgressRing value={client.overallProgress} size={44} stroke={3.5} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{client.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Heart className="h-3 w-3" />{client.partnerName}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn("text-[10px] shrink-0", cfg.bg, cfg.color, cfg.border)}>{cfg.label}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{client.city}</span>
                <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3 shrink-0" />{new Date(client.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3 shrink-0" />{client.team.length} members</span>
                <span className="flex items-center gap-1"><Package className="h-3 w-3 shrink-0" />{delivered}/{total} delivered</span>
              </div>

              {/* Delivery Date */}
              <div className={cn(
                "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium",
                client.status === "completed" ? "bg-emerald-500/10 text-emerald-500" :
                daysToDelivery <= 7 ? "bg-amber-500/10 text-amber-500" : "bg-muted/50 text-muted-foreground"
              )}>
                <Truck className="h-3.5 w-3.5" />
                {client.status === "completed" ? "All Delivered" : (
                  <>Delivery: {deliveryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  {daysToDelivery > 0 && <span className="ml-auto text-[10px]">{daysToDelivery}d left</span>}</>
                )}
              </div>

              {/* Team avatars */}
              <div className="flex items-center gap-1">
                {client.team.slice(0, 4).map((m) => (
                  <div key={m.id} className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold ring-2 ring-card -ml-1 first:ml-0" title={`${m.name} · ${m.role}`}>
                    {m.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                ))}
                {client.team.length > 4 && (
                  <div className="h-7 w-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-[9px] font-bold ring-2 ring-card -ml-1">+{client.team.length - 4}</div>
                )}
              </div>

              {/* Deliverables mini */}
              <div className="flex flex-wrap gap-1.5">
                {client.deliverables.map((d) => {
                  const dcfg = deliverableStatusConfig[d.status];
                  const Icon = deliverableIcon[d.type] || Package;
                  return (
                    <div key={d.id} className={cn("flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border", dcfg.bg, dcfg.color, dcfg.border)} title={`${d.label} — ${d.progress}%`}>
                      <Icon className="h-3 w-3" />
                      <span>{d.progress}%</span>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-border grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] text-muted-foreground">Paid</p>
                  <p className="text-xs font-bold text-emerald-500">₹{(client.financials.paidAmount / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Pending</p>
                  <p className="text-xs font-bold text-amber-500">₹{(client.financials.pendingAmount / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Profit</p>
                  <p className={cn("text-xs font-bold", profitMargin >= 40 ? "text-emerald-500" : "text-red-400")}>₹{(client.financials.profit / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
