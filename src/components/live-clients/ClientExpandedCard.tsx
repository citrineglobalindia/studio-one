import { motion } from "framer-motion";
import { IndianRupee, Users, Package, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { type LiveClient } from "@/data/live-clients-data";
import { DeliverableRow } from "./DeliverableRow";

export function ClientExpandedCard({ client }: { client: LiveClient }) {
  const delivered = client.deliverables.filter((d) => d.status === "delivered").length;
  const total = client.deliverables.length;
  const profitMargin = client.financials.estimatedAmount > 0
    ? Math.round((client.financials.profit / client.financials.estimatedAmount) * 100) : 0;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <IndianRupee className="h-3 w-3" /> Financials
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: "Estimate", value: client.financials.estimatedAmount, color: "text-foreground" },
              { label: "Invoiced", value: client.financials.invoicedAmount, color: "text-blue-500" },
              { label: "Paid", value: client.financials.paidAmount, color: "text-emerald-500" },
              { label: "Pending", value: client.financials.pendingAmount, color: "text-amber-500" },
              { label: "Expenses", value: client.financials.expenses, color: "text-red-400" },
              { label: "Profit", value: client.financials.profit, color: "text-emerald-500" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-muted/30 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                <p className={cn("text-sm font-bold mt-0.5", f.color)}>₹{(f.value / 1000).toFixed(0)}K</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-muted-foreground">Profit Margin:</span>
            <span className={cn("font-bold", profitMargin >= 50 ? "text-emerald-500" : profitMargin >= 30 ? "text-amber-500" : "text-red-400")}>
              {profitMargin >= 50 ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
              {profitMargin}%
            </span>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="h-3 w-3" /> Team ({client.team.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {client.team.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground leading-tight">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Package className="h-3 w-3" /> Deliverables ({delivered}/{total} delivered)
          </h4>
          <div className="space-y-1.5">
            {client.deliverables.map((d) => (
              <DeliverableRow key={d.id} d={d} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
