import { useNavigate } from "react-router-dom";
import { sampleProjects } from "@/data/wedding-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import {
  Wallet, IndianRupee, CreditCard, ChevronRight, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, BarChart3, Briefcase
} from "lucide-react";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

const today = new Date("2026-04-01");

export function AccountsDashboard() {
  const navigate = useNavigate();

  const allPayments = sampleProjects.flatMap((p) => p.payments);
  const totalRevenue = allPayments.reduce((s, p) => s + p.paidAmount, 0);
  const totalPending = allPayments.filter((p) => p.status !== "paid").reduce((s, p) => s + (p.amount - p.paidAmount), 0);
  const overduePayments = allPayments.filter((p) => p.status !== "paid" && new Date(p.dueDate) < today);
  const overdueAmount = overduePayments.reduce((s, p) => s + (p.amount - p.paidAmount), 0);
  const totalInvoiced = allPayments.reduce((s, p) => s + p.amount, 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalRevenue / totalInvoiced) * 100) : 0;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-5">
      <motion.div variants={cardVariants} className="relative rounded-2xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/20 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="h-4 w-4 text-emerald-500" />
            <span className="text-[10px] font-medium text-emerald-500 uppercase tracking-[0.2em]">Accounts Dashboard</span>
          </div>
          <h1 className="text-2xl font-display font-bold text-foreground">Finance Hub 💰</h1>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="text-emerald-400 font-medium">₹{(totalRevenue / 100000).toFixed(1)}L collected</span> ·{" "}
            <span className="text-amber-400 font-medium">₹{(totalPending / 100000).toFixed(1)}L pending</span>
            {overduePayments.length > 0 && (
              <> · <span className="text-red-400 font-medium">{overduePayments.length} overdue</span></>
            )}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Collected", value: `₹${(totalRevenue / 1000).toFixed(0)}K`, icon: CheckCircle2, color: "text-emerald-500", bg: "from-emerald-500/15 to-emerald-500/5" },
          { label: "Pending", value: `₹${(totalPending / 1000).toFixed(0)}K`, icon: Clock, color: "text-amber-500", bg: "from-amber-500/15 to-amber-500/5" },
          { label: "Overdue", value: `₹${(overdueAmount / 1000).toFixed(0)}K`, icon: AlertTriangle, color: "text-red-500", bg: "from-red-500/15 to-red-500/5" },
          { label: "Collection Rate", value: `${collectionRate}%`, icon: TrendingUp, color: "text-primary", bg: "from-primary/15 to-primary/5" },
        ].map((s) => (
          <motion.div key={s.label} variants={cardVariants} className={`bg-gradient-to-b ${s.bg} rounded-2xl border border-border p-4`}>
            <s.icon className={`h-5 w-5 ${s.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Collection Progress */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Collection Progress</h3>
        <div className="space-y-1 mb-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">₹{(totalRevenue / 1000).toFixed(0)}K of ₹{(totalInvoiced / 1000).toFixed(0)}K</span>
            <span className="font-bold text-foreground">{collectionRate}%</span>
          </div>
          <Progress value={collectionRate} className="h-3" />
        </div>
      </motion.div>

      {/* Payment Tracker */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500" />
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="font-display font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-emerald-500" /> Pending Payments
          </h2>
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={() => navigate("/invoices")}>
            Invoices <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="divide-y divide-border">
          {allPayments
            .filter((p) => p.status !== "paid")
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .slice(0, 8)
            .map((payment) => {
              const project = sampleProjects.find((p) => p.id === payment.projectId);
              const isOverdue = new Date(payment.dueDate) < today;
              return (
                <div key={payment.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors cursor-pointer">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{payment.label}</p>
                    <p className="text-xs text-muted-foreground">{project?.clientName} · {payment.invoiceNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-mono font-semibold text-foreground">₹{(payment.amount / 1000).toFixed(0)}K</span>
                    <Badge variant="outline" className={`text-[10px] ${isOverdue ? "bg-red-500/10 text-red-400 border-red-500/30" : "bg-primary/10 text-primary border-primary/30"}`}>
                      {isOverdue ? "Overdue" : new Date(payment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </Badge>
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>

      <motion.div variants={cardVariants} className="grid grid-cols-3 gap-3">
        {[
          { label: "Invoices", icon: CreditCard, path: "/invoices", color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Contracts", icon: Briefcase, path: "/contracts", color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Analytics", icon: BarChart3, path: "/analytics", color: "text-primary", bg: "bg-primary/10" },
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
