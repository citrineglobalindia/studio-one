import { DashboardLayout } from "@/components/DashboardLayout";
import { sampleProjects, type Payment, type PaymentStatus, type PaymentType } from "@/data/wedding-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import {
  IndianRupee, Plus, FileText, CheckCircle2, Clock, AlertCircle,
  ArrowUpRight, CalendarDays, CreditCard, Banknote, Smartphone, Building2,
} from "lucide-react";

const statusConfig: Record<PaymentStatus, { label: string; icon: typeof Clock; class: string }> = {
  paid: { label: "Paid", icon: CheckCircle2, class: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
  pending: { label: "Pending", icon: Clock, class: "text-muted-foreground bg-muted border-border" },
  overdue: { label: "Overdue", icon: AlertCircle, class: "text-red-400 bg-red-500/20 border-red-500/30" },
  partial: { label: "Partial", icon: IndianRupee, class: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30" },
};

const typeConfig: Record<PaymentType, { label: string; class: string }> = {
  advance: { label: "Advance", class: "bg-primary/15 text-primary border-primary/30" },
  milestone: { label: "Milestone", class: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  final: { label: "Final", class: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

const modeIcons: Record<string, typeof CreditCard> = {
  upi: Smartphone,
  "bank-transfer": Building2,
  cash: Banknote,
  cheque: FileText,
  card: CreditCard,
};

const InvoicesPage = () => {
  const navigate = useNavigate();

  // Flatten all payments with project info
  const allPayments = sampleProjects.flatMap((project) =>
    project.payments.map((payment) => ({ ...payment, clientName: `${project.clientName} & ${project.partnerName}`, projectId: project.id }))
  );

  const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = allPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPending = totalRevenue - totalCollected;
  const overduePayments = allPayments.filter(
    (p) => p.status !== "paid" && new Date(p.dueDate) < new Date()
  );
  const overdueAmount = overduePayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Invoices & Payments</h1>
            <p className="text-sm text-muted-foreground mt-1">Track advance, milestone and final payments across all projects.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Invoice
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Revenue</p>
            <p className="text-xl font-display font-bold text-foreground mt-1 flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />₹{(totalRevenue / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Collected</p>
            <p className="text-xl font-display font-bold text-emerald-400 mt-1 flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />₹{(totalCollected / 1000).toFixed(0)}K
            </p>
            <Progress value={(totalCollected / totalRevenue) * 100} className="h-1.5 mt-2" />
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
            <p className="text-xl font-display font-bold text-yellow-400 mt-1 flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />₹{(totalPending / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Overdue</p>
            <p className="text-xl font-display font-bold text-red-400 mt-1 flex items-center gap-1">
              <IndianRupee className="h-4 w-4" />₹{(overdueAmount / 1000).toFixed(0)}K
            </p>
            <p className="text-xs text-muted-foreground mt-1">{overduePayments.length} invoice{overduePayments.length !== 1 ? "s" : ""}</p>
          </div>
        </div>

        {/* Per-project payment breakdown */}
        <div className="space-y-4">
          {sampleProjects.filter((p) => p.payments.length > 0).map((project) => {
            const projectPaid = project.payments.reduce((s, p) => s + p.paidAmount, 0);
            const projectTotal = project.payments.reduce((s, p) => s + p.amount, 0);
            const pct = projectTotal > 0 ? Math.round((projectPaid / projectTotal) * 100) : 0;

            return (
              <div key={project.id} className="rounded-lg bg-card border border-border overflow-hidden">
                {/* Project header */}
                <div
                  className="flex items-center justify-between p-4 border-b border-border cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-display font-semibold text-foreground">
                      {project.clientName} & {project.partnerName}
                    </h3>
                    <Badge variant="outline" className="text-[10px]">{project.package}</Badge>
                    <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">₹{(projectPaid / 1000).toFixed(0)}K / ₹{(projectTotal / 1000).toFixed(0)}K</span>
                    <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : "bg-primary")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Payment rows */}
                <div className="divide-y divide-border">
                  {project.payments.map((payment) => {
                    const sCfg = statusConfig[payment.status];
                    const tCfg = typeConfig[payment.type];
                    const StatusIcon = sCfg.icon;
                    const ModeIcon = payment.mode ? modeIcons[payment.mode] || CreditCard : CreditCard;
                    const isOverdue = payment.status !== "paid" && new Date(payment.dueDate) < new Date();

                    return (
                      <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-3 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", tCfg.class)}>
                            <IndianRupee className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{payment.label}</p>
                              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", tCfg.class)}>{tCfg.label}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {payment.invoiceNumber && (
                                <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{payment.invoiceNumber}</span>
                              )}
                              <span className="flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                Due {new Date(payment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </span>
                              {payment.paidDate && (
                                <span className="flex items-center gap-1">
                                  <ModeIcon className="h-3 w-3" />
                                  Paid {new Date(payment.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <div className="text-right">
                            <p className="text-sm font-medium text-foreground">₹{payment.amount.toLocaleString("en-IN")}</p>
                            {payment.paidAmount > 0 && payment.paidAmount < payment.amount && (
                              <p className="text-xs text-muted-foreground">₹{payment.paidAmount.toLocaleString("en-IN")} paid</p>
                            )}
                          </div>
                          <Badge variant="outline" className={cn("text-[10px] gap-1", isOverdue ? statusConfig.overdue.class : sCfg.class)}>
                            <StatusIcon className="h-3 w-3" />
                            {isOverdue ? "Overdue" : sCfg.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default InvoicesPage;
