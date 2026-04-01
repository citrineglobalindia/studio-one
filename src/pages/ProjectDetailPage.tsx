import { DashboardLayout } from "@/components/DashboardLayout";
import { useParams, useNavigate } from "react-router-dom";
import { sampleProjects, type PaymentStatus, type PaymentType } from "@/data/wedding-types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, CalendarDays, MapPin, Phone, IndianRupee,
  Camera, Video, Edit3, Users, CheckCircle2, Clock, AlertCircle,
  Upload, Eye, Send, FileText, CreditCard, Banknote, Smartphone, Building2, Plus,
} from "lucide-react";

const paymentStatusConfig: Record<PaymentStatus, { label: string; icon: typeof Clock; class: string }> = {
  paid: { label: "Paid", icon: CheckCircle2, class: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
  pending: { label: "Pending", icon: Clock, class: "text-muted-foreground bg-muted border-border" },
  overdue: { label: "Overdue", icon: AlertCircle, class: "text-red-400 bg-red-500/20 border-red-500/30" },
  partial: { label: "Partial", icon: IndianRupee, class: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30" },
};

const paymentTypeConfig: Record<PaymentType, { label: string; class: string }> = {
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

const editStatusConfig: Record<string, { label: string; icon: typeof Clock; class: string }> = {
  pending: { label: "Pending", icon: Clock, class: "text-muted-foreground bg-muted" },
  "in-progress": { label: "Editing", icon: Edit3, class: "text-blue-400 bg-blue-500/20" },
  review: { label: "Review", icon: Eye, class: "text-yellow-400 bg-yellow-500/20" },
  approved: { label: "Approved", icon: CheckCircle2, class: "text-emerald-400 bg-emerald-500/20" },
  delivered: { label: "Delivered", icon: Send, class: "text-primary bg-primary/20" },
};

const subEventStatusColors: Record<string, string> = {
  upcoming: "border-muted-foreground/30 bg-muted/30",
  "in-progress": "border-blue-500/40 bg-blue-500/10",
  completed: "border-emerald-500/40 bg-emerald-500/10",
};

const roleIcons: Record<string, typeof Camera> = {
  photographer: Camera,
  videographer: Video,
  editor: Edit3,
  "drone-operator": Camera,
  assistant: Users,
};

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = sampleProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">Project not found.</p>
        </div>
      </DashboardLayout>
    );
  }

  const completedEvents = project.subEvents.filter((se) => se.status === "completed").length;
  const totalFootage = project.footage.length;
  const completedFootage = project.footage.filter((f) => f.editStatus === "approved" || f.editStatus === "delivered").length;
  const overallEditProgress = totalFootage > 0 ? Math.round(project.footage.reduce((a, f) => a + f.editProgress, 0) / totalFootage) : 0;

  const inOfficeTeam = project.team.filter((m) => m.type === "in-office");
  const vendorTeam = project.team.filter((m) => m.type === "vendor");

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/projects")} className="mt-1 shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-display font-bold text-foreground">
                {project.clientName} & {project.partnerName}
              </h1>
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 capitalize">
                {project.status.replace("-", " ")}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(project.weddingDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{project.venue}, {project.city}</span>
              <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{project.clientPhone}</span>
              <span className="flex items-center gap-1"><IndianRupee className="h-3.5 w-3.5" />₹{(project.totalAmount / 1000).toFixed(0)}K ({project.package})</span>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Sub-Events</p>
            <p className="text-xl font-display font-bold text-foreground mt-1">{completedEvents}/{project.subEvents.length}</p>
            <p className="text-xs text-muted-foreground">completed</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Team Size</p>
            <p className="text-xl font-display font-bold text-foreground mt-1">{project.team.length}</p>
            <p className="text-xs text-muted-foreground">{inOfficeTeam.length} office · {vendorTeam.length} vendor</p>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Edit Progress</p>
            <p className="text-xl font-display font-bold text-foreground mt-1">{overallEditProgress}%</p>
            <Progress value={overallEditProgress} className="h-1.5 mt-1" />
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Payment</p>
            <p className="text-xl font-display font-bold text-foreground mt-1">₹{(project.paidAmount / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground">of ₹{(project.totalAmount / 1000).toFixed(0)}K</p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="events" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="events">Sub-Events</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="footage">Footage & Editing</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>

          {/* SUB-EVENTS TAB */}
          <TabsContent value="events" className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground">Event Schedule</h2>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <CalendarDays className="h-3 w-3" /> Add Event
              </Button>
            </div>
            {project.subEvents.length === 0 ? (
              <div className="rounded-lg bg-card border border-border p-8 text-center text-muted-foreground">
                No sub-events added yet. Add events like Mehendi, Haldi, Wedding, Reception.
              </div>
            ) : (
              <div className="space-y-3">
                {project.subEvents.map((se) => (
                  <div key={se.id} className={cn("rounded-lg border p-4 transition-colors", subEventStatusColors[se.status])}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-3 w-3 rounded-full shrink-0",
                          se.status === "completed" && "bg-emerald-500",
                          se.status === "in-progress" && "bg-blue-500",
                          se.status === "upcoming" && "bg-muted-foreground/40",
                        )} />
                        <h3 className="font-display font-semibold text-foreground">{se.name}</h3>
                        <Badge variant="outline" className="text-[10px] capitalize">{se.status}</Badge>
                      </div>
                      <span className="text-sm font-mono text-primary">{new Date(se.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{se.location}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{se.assignedTeam.length} assigned</span>
                    </div>
                    {se.assignedTeam.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3 ml-6">
                        {se.assignedTeam.map((m) => {
                          const Icon = roleIcons[m.role] || Users;
                          return (
                            <span key={m.id} className="inline-flex items-center gap-1 text-[10px] bg-muted rounded-full px-2 py-0.5 text-muted-foreground">
                              <Icon className="h-2.5 w-2.5" />
                              {m.name}
                              {m.type === "vendor" && <span className="text-primary">· V</span>}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* TEAM TAB */}
          <TabsContent value="team" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground">Assigned Team</h2>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Users className="h-3 w-3" /> Assign Member
              </Button>
            </div>

            {/* In-office */}
            <div>
              <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2">In-Office Team</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {inOfficeTeam.map((m) => {
                  const Icon = roleIcons[m.role] || Users;
                  return (
                    <div key={m.id} className="rounded-lg bg-card border border-border p-3 flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{m.role.replace("-", " ")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {vendorTeam.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2">Vendors / Freelancers</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {vendorTeam.map((m) => {
                    const Icon = roleIcons[m.role] || Users;
                    return (
                      <div key={m.id} className="rounded-lg bg-card border border-primary/20 p-3 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                          <div className="flex items-center gap-1">
                            <p className="text-xs text-muted-foreground capitalize">{m.role.replace("-", " ")}</p>
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/30">Vendor</Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          {/* FOOTAGE & EDITING TAB */}
          <TabsContent value="footage" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground">Footage Handover & Edit Tracking</h2>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Upload className="h-3 w-3" /> Log Handover
              </Button>
            </div>

            {project.footage.length === 0 ? (
              <div className="rounded-lg bg-card border border-border p-8 text-center text-muted-foreground">
                No footage handed over yet. Once shoots are done, log the handover here.
              </div>
            ) : (
              <div className="space-y-3">
                {project.footage.map((f) => {
                  const statusCfg = editStatusConfig[f.editStatus];
                  const StatusIcon = statusCfg.icon;
                  return (
                    <div key={f.id} className="rounded-lg bg-card border border-border p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground">{f.subEventName}</h3>
                            <span className="text-xs text-muted-foreground">·</span>
                            <Badge variant="outline" className="text-[10px] capitalize">
                              {f.deliveryType === "highlights" ? "Highlights Reel" : f.deliveryType}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {f.handedOverByRole === "photographer" ? <Camera className="inline h-3 w-3 mr-1" /> : <Video className="inline h-3 w-3 mr-1" />}
                            Handed over by <span className="text-foreground">{f.handedOverBy}</span> on {new Date(f.handedOverDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            {f.fileCount && <span> · {f.fileCount} files</span>}
                          </p>
                        </div>
                        <div className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium", statusCfg.class)}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                          <Edit3 className="h-3 w-3" />
                          <span>Editor: <span className="text-foreground">{f.assignedEditor}</span></span>
                        </div>
                        <div className="flex-1 flex items-center gap-2">
                          <Progress value={f.editProgress} className="h-1.5 flex-1" />
                          <span className="text-xs font-mono text-muted-foreground w-8 text-right">{f.editProgress}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* PAYMENTS TAB */}
          <TabsContent value="payments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-foreground">Payment Schedule</h2>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <Plus className="h-3 w-3" /> Add Payment
              </Button>
            </div>

            {project.payments.length === 0 ? (
              <div className="rounded-lg bg-card border border-border p-8 text-center text-muted-foreground">
                No payments scheduled yet. Add advance, milestone, or final payment entries.
              </div>
            ) : (
              <>
                {/* Payment summary bar */}
                {(() => {
                  const totalPaid = project.payments.reduce((s, p) => s + p.paidAmount, 0);
                  const totalDue = project.payments.reduce((s, p) => s + p.amount, 0);
                  const pct = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0;
                  return (
                    <div className="rounded-lg bg-card border border-border p-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">₹{totalPaid.toLocaleString("en-IN")} collected</span>
                          <span className="font-medium text-foreground">₹{totalDue.toLocaleString("en-IN")} total</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      <span className="text-lg font-display font-bold text-primary">{pct}%</span>
                    </div>
                  );
                })()}

                <div className="space-y-3">
                  {project.payments.map((payment) => {
                    const sCfg = paymentStatusConfig[payment.status];
                    const tCfg = paymentTypeConfig[payment.type];
                    const StatusIcon = sCfg.icon;
                    const ModeIcon = payment.mode ? modeIcons[payment.mode] || CreditCard : CreditCard;
                    const isOverdue = payment.status !== "paid" && new Date(payment.dueDate) < new Date();

                    return (
                      <div key={payment.id} className="rounded-lg bg-card border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", tCfg.class)}>
                            <IndianRupee className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{payment.label}</p>
                              <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", tCfg.class)}>{tCfg.label}</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {payment.invoiceNumber && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{payment.invoiceNumber}</span>}
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
                          <p className="text-sm font-medium text-foreground">₹{payment.amount.toLocaleString("en-IN")}</p>
                          <Badge variant="outline" className={cn("text-[10px] gap-1", isOverdue ? paymentStatusConfig.overdue.class : sCfg.class)}>
                            <StatusIcon className="h-3 w-3" />
                            {isOverdue ? "Overdue" : sCfg.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>

          {/* DELIVERY TAB */}
          <TabsContent value="delivery" className="space-y-4">
            <h2 className="font-display font-semibold text-foreground">Client Delivery Status</h2>
            <div className="rounded-lg bg-card border border-border p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Overall Progress</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Editing Completion</span>
                      <span>{overallEditProgress}%</span>
                    </div>
                    <Progress value={overallEditProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">{completedFootage} of {totalFootage} deliverables ready</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-foreground mb-3">Delivery Breakdown</h3>
                  <div className="space-y-2">
                    {Object.entries(editStatusConfig).map(([key, cfg]) => {
                      const count = project.footage.filter((f) => f.editStatus === key).length;
                      if (count === 0) return null;
                      const StatusIcon = cfg.icon;
                      return (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <StatusIcon className="h-3 w-3" />{cfg.label}
                          </span>
                          <span className="font-medium text-foreground">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
