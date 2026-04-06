import { useNavigate } from "react-router-dom";
import { sampleTeamMembers } from "@/data/wedding-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  UserCog, Users, ClipboardList, CalendarOff, ChevronRight,
  TrendingUp, CheckCircle2, Clock, AlertTriangle
} from "lucide-react";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

export function HRDashboardRole() {
  const navigate = useNavigate();

  const totalEmployees = sampleTeamMembers.filter((m) => m.type === "in-office").length;
  const totalVendors = sampleTeamMembers.filter((m) => m.type === "vendor").length;

  // Mock attendance data
  const presentToday = Math.round(totalEmployees * 0.85);
  const onLeave = totalEmployees - presentToday;
  const pendingLeaveRequests = 3;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={cardVariants} className="relative rounded-2xl bg-gradient-to-br from-teal-500/15 via-teal-500/5 to-transparent border border-teal-500/20 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="h-4 w-4 text-teal-500" />
            <span className="text-[10px] font-medium text-teal-500 uppercase tracking-[0.2em]">HR Dashboard</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">People Hub 👥</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-teal-400 font-medium">{totalEmployees} employees</span> ·{" "}
            <span className="text-emerald-400 font-medium">{presentToday} present today</span> ·{" "}
            <span className="text-amber-400 font-medium">{pendingLeaveRequests} pending leaves</span>
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Staff", value: totalEmployees, icon: Users, color: "text-teal-500", bg: "from-teal-500/15 to-teal-500/5" },
          { label: "Present", value: presentToday, icon: CheckCircle2, color: "text-emerald-500", bg: "from-emerald-500/15 to-emerald-500/5" },
          { label: "On Leave", value: onLeave, icon: CalendarOff, color: "text-amber-500", bg: "from-amber-500/15 to-amber-500/5" },
          { label: "Pending Leaves", value: pendingLeaveRequests, icon: AlertTriangle, color: "text-red-500", bg: "from-red-500/15 to-red-500/5" },
        ].map((s) => (
          <motion.div key={s.label} variants={cardVariants} className={`bg-gradient-to-b ${s.bg} rounded-2xl border border-border p-4`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Team Breakdown */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-teal-500 to-emerald-500" />
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-teal-500" /> Team Overview
          </h2>
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/hr/employees")}>
            All Employees <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="p-4 space-y-3">
          {["photographer", "videographer", "editor", "drone-operator", "assistant"].map((role) => {
            const count = sampleTeamMembers.filter((m) => m.role === role).length;
            const inOffice = sampleTeamMembers.filter((m) => m.role === role && m.type === "in-office").length;
            return (
              <div key={role} className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground capitalize">{role.replace("-", " ")}s</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">{inOffice} in-office</Badge>
                  <Badge variant="secondary" className="text-[10px]">{count - inOffice} vendor</Badge>
                  <span className="text-sm font-bold text-foreground w-6 text-right">{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="grid grid-cols-3 gap-3">
        {[
          { label: "Attendance", icon: ClipboardList, path: "/hr/attendance", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Leave Requests", icon: CalendarOff, path: "/hr/leaves", color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Employees", icon: Users, path: "/hr/employees", color: "text-teal-500", bg: "bg-teal-500/10" },
        ].map((a) => (
          <Button key={a.label} variant="outline" className="h-auto py-4 flex-col gap-2" onClick={() => navigate(a.path)}>
            <div className={`h-10 w-10 rounded-xl ${a.bg} flex items-center justify-center`}><a.icon className={`h-5 w-5 ${a.color}`} /></div>
            <span className="text-xs font-medium">{a.label}</span>
          </Button>
        ))}
      </motion.div>
    </motion.div>
  );
}
