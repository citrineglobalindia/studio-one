import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Heart, CalendarDays, Users, Package, Truck,
  Camera, Video, BookImage, Film, HardDrive, CheckCircle2, BellRing, User,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { clientStatusConfig, deliverableStatusConfig, type LiveClient } from "@/data/live-clients-data";
import { ProgressRing } from "./ProgressRing";

const deliverableIcon: Record<string, React.ElementType> = {
  Photos: Camera, Videos: Video, Albums: BookImage, Highlights: Film, "Footage Copy": HardDrive,
};

export function PresentView({ clients }: { clients: LiveClient[] }) {
  return (
    <div className="space-y-6">
      {clients.map((client, i) => {
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
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 24 }}
            className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/20 transition-all"
          >
            <div className={cn("h-1.5", client.status === "completed" ? "bg-gradient-to-r from-blue-500 via-blue-400 to-transparent" : client.status === "active" ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent" : "bg-gradient-to-r from-amber-500 via-amber-400 to-transparent")} />

            <div className="p-5 sm:p-6">
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-4">
                  <ProgressRing value={client.overallProgress} size={64} stroke={5} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-foreground">{client.name}</h3>
                      <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{client.partnerName}</span>
                      <Badge variant="outline" className={cn("text-[10px]", cfg.bg, cfg.color, cfg.border)}>{cfg.label}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{client.eventType} · {new Date(client.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>·</span>
                      <span>{client.city}</span>
                      <span>·</span>
                      <span className={cn(
                        "flex items-center gap-1 font-medium",
                        client.status === "completed" ? "text-emerald-500" : daysToDelivery <= 7 ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        <Truck className="h-3 w-3" />
                        {client.status === "completed" ? "All Delivered" : `Delivery: ${deliveryDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`}
                        {client.status !== "completed" && daysToDelivery > 0 && ` (${daysToDelivery}d)`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {[
                    { label: "Estimate", value: client.financials.estimatedAmount, color: "text-foreground" },
                    { label: "Paid", value: client.financials.paidAmount, color: "text-emerald-500" },
                    { label: "Profit", value: client.financials.profit, color: profitMargin >= 40 ? "text-emerald-500" : "text-red-400" },
                  ].map((f) => (
                    <div key={f.label} className="text-center px-3 py-1.5 rounded-xl bg-muted/30">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                      <p className={cn("text-sm font-bold", f.color)}>₹{(f.value / 1000).toFixed(0)}K</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
                <div className="lg:col-span-2">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Users className="h-3 w-3" /> Team ({client.team.length})
                  </h4>
                  <div className="space-y-2">
                    {client.team.map((m) => (
                      <div key={m.id} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                          {m.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{m.name}</p>
                          <p className="text-[10px] text-muted-foreground">{m.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Package className="h-3 w-3" /> Deliverables ({delivered}/{total} delivered)
                  </h4>
                  <div className="space-y-2">
                    {client.deliverables.map((d) => {
                      const dcfg = deliverableStatusConfig[d.status];
                      const Icon = deliverableIcon[d.type] || Package;
                      return (
                        <div key={d.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", dcfg.bg)}>
                            <Icon className={cn("h-4 w-4", dcfg.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground truncate">{d.label}</p>
                              <Badge variant="outline" className={cn("text-[10px] shrink-0", dcfg.bg, dcfg.color, dcfg.border)}>{dcfg.label}</Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Progress value={d.progress} className="h-1.5 flex-1" />
                              <span className="text-[10px] font-mono text-muted-foreground w-8 text-right">{d.progress}%</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span>Due: {new Date(d.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                              {d.assignedTo && (
                                <span className="flex items-center gap-0.5"><User className="h-3 w-3" />{d.assignedTo}</span>
                              )}
                              {d.reminderDate && (
                                <span className="flex items-center gap-0.5 text-primary"><BellRing className="h-3 w-3" />{new Date(d.reminderDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                              )}
                            </div>
                          </div>
                          {d.deliveredDate && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
