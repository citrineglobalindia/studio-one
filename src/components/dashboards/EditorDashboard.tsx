import { useNavigate } from "react-router-dom";
import { sampleProjects } from "@/data/wedding-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Edit3, CheckCircle2, Clock, Eye, Film, ChevronRight, Zap, Send
} from "lucide-react";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

const statusColors: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Pending", color: "text-muted-foreground", bg: "bg-muted" },
  "in-progress": { label: "Editing", color: "text-blue-400", bg: "bg-blue-500/20" },
  review: { label: "Review", color: "text-amber-400", bg: "bg-amber-500/20" },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  delivered: { label: "Delivered", color: "text-primary", bg: "bg-primary/20" },
};

export function EditorDashboard() {
  const navigate = useNavigate();

  const allFootage = sampleProjects.flatMap((p) =>
    p.footage.map((f) => ({
      ...f,
      projectClient: `${p.clientName} & ${p.partnerName}`,
      projectId: p.id,
    }))
  );

  const myQueue = allFootage.filter((f) => f.editStatus === "pending" || f.editStatus === "in-progress");
  const inReview = allFootage.filter((f) => f.editStatus === "review");
  const completed = allFootage.filter((f) => f.editStatus === "approved" || f.editStatus === "delivered");
  const avgProgress = myQueue.length > 0 ? Math.round(myQueue.reduce((s, f) => s + f.editProgress, 0) / myQueue.length) : 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={cardVariants} className="relative rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/20 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Edit3 className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-[0.2em]">Editor Dashboard</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Editing Hub ✂️</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-emerald-400 font-medium">{myQueue.length} in queue</span> ·{" "}
            <span className="text-amber-400 font-medium">{inReview.length} in review</span> ·{" "}
            <span className="text-primary font-medium">{completed.length} completed</span>
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "In Queue", value: myQueue.length, icon: Clock, color: "text-blue-500", bg: "from-blue-500/15 to-blue-500/5" },
          { label: "In Review", value: inReview.length, icon: Eye, color: "text-amber-500", bg: "from-amber-500/15 to-amber-500/5" },
          { label: "Completed", value: completed.length, icon: CheckCircle2, color: "text-emerald-500", bg: "from-emerald-500/15 to-emerald-500/5" },
          { label: "Avg Progress", value: avgProgress, icon: Zap, color: "text-primary", bg: "from-primary/15 to-primary/5", suffix: "%" },
        ].map((s) => (
          <motion.div key={s.label} variants={cardVariants} className={`bg-gradient-to-b ${s.bg} rounded-2xl border border-border p-4`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}{"suffix" in s ? s.suffix : ""}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Editing Queue */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-primary" />
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Film className="h-4 w-4 text-emerald-500" /> My Editing Queue
          </h2>
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/tasks")}>
            Tasks <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-border">
          {allFootage
            .filter((f) => f.editStatus !== "delivered")
            .sort((a, b) => {
              const order = ["in-progress", "pending", "review", "approved"];
              return order.indexOf(a.editStatus) - order.indexOf(b.editStatus);
            })
            .slice(0, 8)
            .map((footage) => {
              const sc = statusColors[footage.editStatus];
              return (
                <div key={footage.id} className="px-4 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{footage.subEventName} — {footage.deliveryType}</p>
                      <p className="text-xs text-muted-foreground">{footage.projectClient} · {footage.fileCount} files · by {footage.handedOverBy}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] ${sc.bg} ${sc.color} border-transparent`}>
                      {sc.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={footage.editProgress} className="flex-1 h-1.5" />
                    <span className="text-[10px] font-medium text-muted-foreground w-8 text-right">{footage.editProgress}%</span>
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>
    </motion.div>
  );
}
