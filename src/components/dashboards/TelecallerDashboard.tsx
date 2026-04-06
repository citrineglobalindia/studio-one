import { useNavigate } from "react-router-dom";
import { sampleLeads } from "@/data/lead-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  PhoneCall, UserPlus, Users, MessageSquare, ChevronRight, Target,
  TrendingUp, Clock, CheckCircle2, AlertTriangle
} from "lucide-react";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

const stageColors: Record<string, string> = {
  new: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  contacted: "text-amber-400 bg-amber-500/20 border-amber-500/30",
  "proposal-sent": "text-purple-400 bg-purple-500/20 border-purple-500/30",
  converted: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
  lost: "text-red-400 bg-red-500/20 border-red-500/30",
};

export function TelecallerDashboard() {
  const navigate = useNavigate();

  const newLeads = sampleLeads.filter((l) => l.stage === "new");
  const contacted = sampleLeads.filter((l) => l.stage === "contacted");
  const converted = sampleLeads.filter((l) => l.stage === "converted");
  const todayFollowUps = sampleLeads.filter((l) => l.followUp && new Date(l.followUp) <= new Date("2026-04-01"));
  const totalPipelineValue = sampleLeads.reduce((s, l) => s + (l.budget || 0), 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={cardVariants} className="relative rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <PhoneCall className="h-4 w-4 text-amber-500" />
            <span className="text-[10px] font-medium text-amber-500 uppercase tracking-[0.2em]">Telecaller Dashboard</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Sales Hub 📞</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-blue-400 font-medium">{newLeads.length} new leads</span> ·{" "}
            <span className="text-amber-400 font-medium">{todayFollowUps.length} follow-ups today</span>
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "New Leads", value: newLeads.length, icon: UserPlus, color: "text-blue-500", bg: "from-blue-500/15 to-blue-500/5" },
          { label: "Contacted", value: contacted.length, icon: PhoneCall, color: "text-amber-500", bg: "from-amber-500/15 to-amber-500/5" },
          { label: "Converted", value: converted.length, icon: CheckCircle2, color: "text-emerald-500", bg: "from-emerald-500/15 to-emerald-500/5" },
          { label: "Follow-ups", value: todayFollowUps.length, icon: Clock, color: "text-red-500", bg: "from-red-500/15 to-red-500/5" },
        ].map((s) => (
          <motion.div key={s.label} variants={cardVariants} className={`bg-gradient-to-b ${s.bg} rounded-2xl border border-border p-4`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Follow-up Queue */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-amber-500 via-red-500 to-primary" />
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" /> Priority Follow-ups
          </h2>
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/leads")}>
            All Leads <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-border">
          {sampleLeads
            .filter((l) => l.stage !== "converted" && l.stage !== "lost")
            .sort((a, b) => {
              if (!a.followUp) return 1;
              if (!b.followUp) return -1;
              return new Date(a.followUp).getTime() - new Date(b.followUp).getTime();
            })
            .slice(0, 8)
            .map((lead) => (
              <div key={lead.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer"
                onClick={() => navigate("/leads")}>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{lead.name}</p>
                  <p className="text-xs text-muted-foreground">{lead.phone} · {lead.eventType} · ₹{((lead.budget || 0) / 1000).toFixed(0)}K</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {lead.followUp && (
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(lead.followUp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </span>
                  )}
                  <Badge variant="outline" className={`text-[10px] ${stageColors[lead.stage]}`}>
                    {lead.stage}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </motion.div>

      {/* Pipeline Value */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Pipeline Value</p>
            <p className="text-3xl font-display font-bold text-foreground mt-1">₹{(totalPipelineValue / 100000).toFixed(1)}L</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Conversion Rate</p>
            <p className="text-3xl font-display font-bold text-emerald-500 mt-1">
              {sampleLeads.length > 0 ? Math.round((converted.length / sampleLeads.length) * 100) : 0}%
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
