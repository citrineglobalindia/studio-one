import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Activity, Camera, MessageSquare, Package, Wallet, Radio, ChevronRight } from "lucide-react";
import { useLiveOps, type LiveOpsItem } from "@/hooks/useLiveOps";
import { formatDistanceToNow } from "date-fns";

const toneClass: Record<LiveOpsItem["tone"], string> = {
  primary: "bg-primary/12 text-primary",
  blue: "bg-blue-500/12 text-blue-500",
  emerald: "bg-emerald-500/12 text-emerald-500",
  amber: "bg-amber-500/15 text-amber-500",
  rose: "bg-rose-500/12 text-rose-500",
};

const iconFor = (k: LiveOpsItem["kind"]) => {
  if (k === "deliverable") return Package;
  if (k === "expense") return Wallet;
  return Camera;
};

export function LiveOpsCard({ compact = false, limit = 8 }: { compact?: boolean; limit?: number }) {
  const navigate = useNavigate();
  const { items, isLoading } = useLiveOps(limit);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-card border border-border overflow-hidden"
    >
      <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-primary" />
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <h3 className="font-display font-semibold text-foreground text-sm flex items-center gap-1.5">
            <Radio className="h-3.5 w-3.5 text-emerald-500" /> Live Operations
          </h3>
        </div>
        <button
          onClick={() => navigate("/live-clients")}
          className="text-[11px] text-primary font-medium flex items-center gap-1 hover:underline"
        >
          Open <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      <div className={compact ? "max-h-[320px] overflow-y-auto" : "max-h-[480px] overflow-y-auto"}>
        {isLoading ? (
          <div className="p-6 text-center text-xs text-muted-foreground">Connecting realtime feed…</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            <Activity className="h-6 w-6 mx-auto mb-2 opacity-40" />
            No crew activity yet. Updates from photographers, editors, and expenses appear here instantly.
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            <AnimatePresence initial={false}>
              {items.map((it) => {
                const Icon = iconFor(it.kind);
                return (
                  <motion.li
                    key={it.id}
                    layout
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${toneClass[it.tone]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-foreground font-medium truncate">{it.title}</p>
                      {it.subtitle && <p className="text-[11px] text-muted-foreground truncate">{it.subtitle}</p>}
                      <div className="flex items-center gap-2 mt-0.5">
                        {it.meta && (
                          <span className="text-[9px] uppercase tracking-wider text-muted-foreground/80 font-semibold">
                            {it.meta}
                          </span>
                        )}
                        <span className="text-[10px] text-muted-foreground/70">
                          {formatDistanceToNow(new Date(it.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </motion.div>
  );
}
