import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users, Phone, Mail, MapPin, IndianRupee, Star, Crown,
  ArrowLeft, CalendarDays, Sparkles, Heart, FileText,
  ChevronRight, PhoneCall, MessageSquare, Briefcase,
  Clock, Download, PenLine, Send, ExternalLink,
  Receipt, CreditCard, PartyPopper, CheckCircle2, AlertCircle, Clock3, Plus,
  MoreHorizontal, Edit, Trash2, Eye, Copy, Share2,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { sampleClients, statusConfig, type Client, type ClientActivity, type ClientInvoice, type ClientEvent } from "@/data/clients-data";
import { AddEventSheet } from "@/components/AddEventSheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 220, damping: 22 },
  },
};

const activityIconMap: Record<string, React.ElementType> = {
  call: PhoneCall,
  email: Mail,
  meeting: Users,
  note: FileText,
  payment: IndianRupee,
  project: Briefcase,
};

const activityColorMap: Record<string, string> = {
  call: "bg-blue-500/15 text-blue-500",
  email: "bg-purple-500/15 text-purple-500",
  meeting: "bg-emerald-500/15 text-emerald-500",
  note: "bg-muted text-muted-foreground",
  payment: "bg-emerald-500/15 text-emerald-500",
  project: "bg-primary/15 text-primary",
};

const invoiceStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  paid: { label: "Paid", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30", icon: CheckCircle2 },
  due: { label: "Due", color: "bg-amber-500/15 text-amber-500 border-amber-500/30", icon: Clock3 },
  overdue: { label: "Overdue", color: "bg-red-500/15 text-red-500 border-red-500/30", icon: AlertCircle },
  partial: { label: "Partial", color: "bg-blue-500/15 text-blue-500 border-blue-500/30", icon: Clock3 },
};

const eventTypeConfig: Record<string, { color: string; emoji: string }> = {
  mehendi: { color: "bg-green-500/15 text-green-600", emoji: "🌿" },
  haldi: { color: "bg-yellow-500/15 text-yellow-600", emoji: "✨" },
  sangeet: { color: "bg-purple-500/15 text-purple-500", emoji: "🎶" },
  wedding: { color: "bg-red-500/15 text-red-500", emoji: "💍" },
  reception: { color: "bg-blue-500/15 text-blue-500", emoji: "🎉" },
  engagement: { color: "bg-pink-500/15 text-pink-500", emoji: "💑" },
  "pre-wedding": { color: "bg-primary/15 text-primary", emoji: "📸" },
  other: { color: "bg-muted text-muted-foreground", emoji: "📅" },
};

const eventStatusConfig: Record<string, { label: string; dot: string }> = {
  upcoming: { label: "Upcoming", dot: "bg-amber-500" },
  completed: { label: "Done", dot: "bg-emerald-500" },
  "in-progress": { label: "Today", dot: "bg-primary animate-pulse" },
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [addEventOpen, setAddEventOpen] = useState(false);
  const clientData = sampleClients.find((c) => c.id === id);
  const [events, setEvents] = useState<ClientEvent[]>(clientData?.events || []);
  const client = clientData ? { ...clientData, events } : undefined;

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Users className="h-12 w-12 text-muted-foreground/30 mb-3" />
        <p className="text-foreground font-medium">Client not found</p>
        <Button variant="outline" className="mt-4 gap-2" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-4 w-4" /> Back to Clients
        </Button>
      </div>
    );
  }

  const cfg = statusConfig[client.status];
  const paidPercent = client.totalSpend > 0
    ? Math.round(((client.totalSpend - client.pendingAmount) / client.totalSpend) * 100)
    : 100;

  const totalInvoiced = client.invoices.reduce((s, inv) => s + inv.amount, 0);
  const totalPaidInv = client.invoices.reduce((s, inv) => s + inv.paidAmount, 0);
  const totalDue = totalInvoiced - totalPaidInv;
  const dueInvoices = client.invoices.filter(inv => inv.status === "due" || inv.status === "overdue" || inv.status === "partial");
  const upcomingEvents = client.events.filter(e => e.status === "upcoming").sort((a, b) => a.date.localeCompare(b.date));
  const completedEvents = client.events.filter(e => e.status === "completed").sort((a, b) => b.date.localeCompare(a.date));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto space-y-5"
    >
      {/* ═══ Header ═══ */}
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">{client.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Heart className="h-3 w-3 text-rose-400" /> {client.partnerName}
              <span className="mx-1">·</span>
              <MapPin className="h-3 w-3" /> {client.city}
              {client.weddingDate && (
                <>
                  <span className="mx-1">·</span>
                  <CalendarDays className="h-3 w-3" /> {new Date(client.weddingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(
            "text-xs shrink-0 px-3 py-1 rounded-full font-semibold",
            cfg.bgColor, cfg.color, cfg.borderColor
          )}>
            {client.status === "vip" && <Crown className="h-3 w-3 mr-1" />}
            {cfg.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem><Edit className="h-3.5 w-3.5 mr-2" /> Edit Client</DropdownMenuItem>
              <DropdownMenuItem><Copy className="h-3.5 w-3.5 mr-2" /> Copy Details</DropdownMenuItem>
              <DropdownMenuItem><Share2 className="h-3.5 w-3.5 mr-2" /> Share Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete Client</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* ═══ Profile + Financial Summary — 2 Column ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <motion.div variants={cardVariants} className="lg:col-span-2 rounded-2xl bg-card border border-border overflow-hidden">
          <div className={cn(
            "h-1.5",
            client.status === "vip"
              ? "bg-gradient-to-r from-primary via-primary/70 to-primary/40"
              : client.status === "active"
              ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500/40"
              : "bg-gradient-to-r from-muted-foreground/30 to-muted/20"
          )} />
          <div className="p-5">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                <div className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-xl ring-2 shrink-0",
                  client.status === "vip"
                    ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-primary/25"
                    : "bg-gradient-to-br from-muted to-muted/50 text-foreground ring-border"
                )}>
                  {client.name.split(" ").map(n => n[0]).join("")}
                </div>
                {client.status === "vip" && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Crown className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                {/* Info chips */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { icon: Sparkles, text: client.source },
                    { icon: Briefcase, text: `${client.projects} project${client.projects !== 1 ? "s" : ""}` },
                  ].map((chip, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
                      <chip.icon className="h-3 w-3" /> {chip.text}
                    </span>
                  ))}
                </div>

                {/* Star rating */}
                <div className="flex items-center gap-1 mt-3">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={cn(
                      "h-4 w-4",
                      j < client.rating ? "text-primary fill-primary" : "text-muted-foreground/20"
                    )} />
                  ))}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mt-5 flex-wrap">
              {[
                { icon: PhoneCall, label: "Call", tooltip: client.phone },
                { icon: Send, label: "WhatsApp", tooltip: "Open WhatsApp" },
                { icon: Mail, label: "Email", tooltip: client.email },
              ].map((action) => (
                <Tooltip key={action.label}>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl px-4">
                      <action.icon className="h-3.5 w-3.5" /> {action.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{action.tooltip}</TooltipContent>
                </Tooltip>
              ))}
              <Button size="sm" className="gap-2 rounded-xl px-4">
                <Briefcase className="h-3.5 w-3.5" /> New Project
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Financial Summary Column */}
        <motion.div variants={cardVariants} className="space-y-3">
          {[
            {
              label: "TOTAL PAID",
              value: `₹${((client.totalSpend - client.pendingAmount) / 1000).toFixed(0)}K`,
              color: "text-foreground",
              accent: "from-emerald-500/20 to-emerald-500/5",
              ring: "ring-emerald-500/15",
            },
            {
              label: "PENDING",
              value: `₹${(client.pendingAmount / 1000).toFixed(0)}K`,
              color: "text-amber-500",
              accent: "from-amber-500/20 to-amber-500/5",
              ring: "ring-amber-500/15",
            },
            {
              label: "TOTAL VALUE",
              value: `₹${(client.totalSpend / 1000).toFixed(0)}K`,
              color: "text-foreground",
              accent: "from-primary/20 to-primary/5",
              ring: "ring-primary/15",
            },
          ].map((card) => (
            <div
              key={card.label}
              className={cn(
                "bg-gradient-to-b rounded-2xl p-4 ring-1 border border-border",
                card.accent, card.ring
              )}
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">{card.label}</p>
              <p className={cn("text-xl font-display font-extrabold mt-1.5 tracking-tight", card.color)}>{card.value}</p>
            </div>
          ))}

          {/* Payment Progress */}
          <div className="rounded-2xl bg-card border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">Payment Progress</span>
              <span className="text-xs font-bold text-foreground tabular-nums">{paidPercent}%</span>
            </div>
            <div className="h-2.5 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${paidPercent}%` }}
                transition={{ delay: 0.3, duration: 1.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ Tabs Section ═══ */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <Tabs defaultValue="invoices">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-1 h-auto p-0 px-5 overflow-x-auto">
            {[
              { value: "invoices", icon: Receipt, label: "Invoices", count: client.invoices.length, alert: dueInvoices.length },
              { value: "payments", icon: CreditCard, label: "Payments", count: client.payments.length },
              { value: "events", icon: PartyPopper, label: "Events", count: client.events.length },
              { value: "activity", icon: Clock, label: "Activity" },
              { value: "contact", icon: Phone, label: "Contact" },
              { value: "documents", icon: FileText, label: "Docs" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 gap-2 text-xs font-medium whitespace-nowrap transition-all"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.alert && tab.alert > 0 ? (
                  <Badge variant="destructive" className="text-[9px] h-4 min-w-[16px] px-1 ml-0.5 rounded-full">{tab.alert}</Badge>
                ) : tab.count !== undefined ? (
                  <Badge variant="secondary" className="text-[9px] h-4 min-w-[16px] px-1 ml-0.5 rounded-full">{tab.count}</Badge>
                ) : null}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* ═══ Invoices Tab ═══ */}
          <div className="p-5">
          <TabsContent value="invoices" className="mt-0 space-y-4">
            {/* Invoice Summary */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "INVOICED", value: `₹${(totalInvoiced / 1000).toFixed(0)}K`, bg: "bg-muted/40", color: "text-foreground", border: "border-border" },
                { label: "RECEIVED", value: `₹${(totalPaidInv / 1000).toFixed(0)}K`, bg: "bg-emerald-500/8", color: "text-emerald-500", border: "border-emerald-500/20" },
                { label: "DUE", value: `₹${(totalDue / 1000).toFixed(0)}K`, bg: "bg-amber-500/8", color: "text-amber-500", border: "border-amber-500/20" },
              ].map((s) => (
                <div key={s.label} className={cn("rounded-xl border p-4 text-center", s.bg, s.border)}>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">{s.label}</p>
                  <p className={cn("text-lg font-bold mt-1.5", s.color)}>{s.value}</p>
                </div>
              ))}
            </div>

            {/* Invoice List */}
            <div className="space-y-2.5">
              {client.invoices.map((inv, i) => {
                const invCfg = invoiceStatusConfig[inv.status];
                const StatusIcon = invCfg.icon;
                return (
                  <motion.div
                    key={inv.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group bg-card"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="text-xs font-mono text-muted-foreground font-medium">{inv.invoiceNumber}</span>
                          <Badge variant="outline" className={cn("text-[9px] px-2 py-0.5 h-auto border rounded-full font-semibold", invCfg.color)}>
                            <StatusIcon className="h-2.5 w-2.5 mr-1" />
                            {invCfg.label}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{inv.description}</p>
                        <div className="flex items-center gap-4 mt-2.5 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            Issued: {new Date(inv.issueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            Due: {new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-foreground tabular-nums">₹{inv.amount.toLocaleString("en-IN")}</p>
                        {inv.status === "partial" && (
                          <p className="text-[10px] text-emerald-500 mt-0.5 font-medium">Paid: ₹{inv.paidAmount.toLocaleString("en-IN")}</p>
                        )}
                      </div>
                    </div>
                    {inv.status === "partial" && (
                      <div className="h-1.5 rounded-full bg-muted mt-3 overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400" style={{ width: `${(inv.paidAmount / inv.amount) * 100}%` }} />
                      </div>
                    )}
                  </motion.div>
                );
              })}
              {client.invoices.length === 0 && (
                <div className="py-16 text-center">
                  <Receipt className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No invoices created</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-2 rounded-full">
                    <Plus className="h-3.5 w-3.5" /> Create Invoice
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══ Payments Tab ═══ */}
          <TabsContent value="payments" className="mt-0 space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">Total Received</p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1.5">₹{client.payments.reduce((s, p) => s + p.amount, 0).toLocaleString("en-IN")}</p>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center shadow-inner">
                  <IndianRupee className="h-7 w-7 text-emerald-500" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{client.payments.length} payment{client.payments.length !== 1 ? "s" : ""} received</p>
            </div>

            <div className="space-y-0">
              {client.payments.sort((a, b) => b.date.localeCompare(a.date)).map((payment, i) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 pb-4 relative"
                >
                  {i < client.payments.length - 1 && (
                    <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
                  )}
                  <div className="h-9 w-9 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15 text-emerald-500 ring-1 ring-emerald-500/20">
                    <IndianRupee className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-foreground">₹{payment.amount.toLocaleString("en-IN")}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">via {payment.method}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                        {new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {payment.reference && (
                      <span className="text-[10px] text-muted-foreground mt-1 inline-block font-mono bg-muted/50 px-1.5 py-0.5 rounded">Ref: {payment.reference}</span>
                    )}
                    {payment.note && (
                      <p className="text-[10px] text-primary mt-0.5">{payment.note}</p>
                    )}
                  </div>
                </motion.div>
              ))}
              {client.payments.length === 0 && (
                <div className="py-16 text-center">
                  <CreditCard className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No payments recorded</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══ Events Tab ═══ */}
          <TabsContent value="events" className="mt-0 space-y-4">
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl gap-2 border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-all"
              onClick={() => setAddEventOpen(true)}
            >
              <Plus className="h-4 w-4" /> Add Event
            </Button>

            {upcomingEvents.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Upcoming Events</h3>
                <div className="space-y-2.5">
                  {upcomingEvents.map((event, i) => {
                    const evtCfg = eventTypeConfig[event.type] || eventTypeConfig.other;
                    const evtStatus = eventStatusConfig[event.status];
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-xl border border-border p-4 hover:border-primary/20 hover:shadow-md transition-all bg-card"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0 text-lg shadow-inner", evtCfg.color)}>
                            {evtCfg.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-foreground">{event.name}</p>
                                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                                  <CalendarDays className="h-3 w-3" />
                                  {new Date(event.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 bg-muted/50 px-2 py-1 rounded-full">
                                <div className={cn("h-1.5 w-1.5 rounded-full", evtStatus.dot)} />
                                <span className="text-[10px] text-muted-foreground font-medium">{evtStatus.label}</span>
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                              <MapPin className="h-3 w-3 shrink-0" /> {event.venue}
                            </p>
                            {event.notes && (
                              <p className="text-[10px] text-primary mt-2 bg-primary/5 rounded-lg px-2.5 py-1.5 border border-primary/10">{event.notes}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {completedEvents.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Completed</h3>
                <div className="space-y-2">
                  {completedEvents.map((event, i) => {
                    const evtCfg = eventTypeConfig[event.type] || eventTypeConfig.other;
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-xl border border-border p-3.5 opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn("h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-sm", evtCfg.color)}>
                            {evtCfg.emoji}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground">{event.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {new Date(event.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {event.venue}
                            </p>
                          </div>
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {client.events.length === 0 && (
              <div className="py-16 text-center">
                <PartyPopper className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No events scheduled</p>
              </div>
            )}
          </TabsContent>

          {/* ═══ Activity Timeline ═══ */}
          <TabsContent value="activity" className="mt-0">
            <div className="space-y-0">
              {client.activities.map((activity, i) => {
                const Icon = activityIconMap[activity.type] || FileText;
                const colorClass = activityColorMap[activity.type] || "bg-muted text-muted-foreground";
                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex gap-3 pb-5 relative"
                  >
                    {i < client.activities.length - 1 && (
                      <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
                    )}
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-border", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                          {new Date(activity.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                      {activity.by && (
                        <span className="text-[10px] text-primary mt-1 inline-block font-medium">by {activity.by}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {client.activities.length === 0 && (
                <div className="py-16 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No activity yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ═══ Contact Info ═══ */}
          <TabsContent value="contact" className="mt-0 space-y-3">
            {[
              { icon: Phone, label: "Phone", value: client.phone, action: "Call" },
              { icon: Mail, label: "Email", value: client.email, action: "Send" },
              { icon: MapPin, label: "City", value: client.city },
              ...(client.address ? [{ icon: MapPin, label: "Address", value: client.address }] : []),
              { icon: Sparkles, label: "Source", value: client.source },
              { icon: CalendarDays, label: "Client Since", value: new Date(client.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.label + i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-center gap-3.5 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/20 transition-all group"
                >
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">{item.label}</p>
                    <p className="text-sm text-foreground mt-0.5">{item.value}</p>
                  </div>
                  {'action' in item && item.action && (
                    <Button variant="ghost" size="sm" className="text-xs text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {item.action}
                    </Button>
                  )}
                </motion.div>
              );
            })}
            {client.notes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-4 rounded-xl bg-primary/5 border border-primary/20"
              >
                <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-1.5">Notes</p>
                <p className="text-sm text-foreground leading-relaxed">{client.notes}</p>
              </motion.div>
            )}
          </TabsContent>

          {/* ═══ Documents ═══ */}
          <TabsContent value="documents" className="mt-0 space-y-2.5">
            {client.documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3.5 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group bg-card"
              >
                <div className={cn(
                  "h-11 w-11 rounded-xl flex items-center justify-center shrink-0",
                  doc.type === "contract" ? "bg-blue-500/15 text-blue-500" :
                  doc.type === "invoice" ? "bg-emerald-500/15 text-emerald-500" :
                  "bg-muted text-muted-foreground"
                )}>
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(doc.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {doc.size}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </Button>
              </motion.div>
            ))}
            {client.documents.length === 0 && (
              <div className="py-16 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No documents uploaded</p>
                <Button variant="outline" size="sm" className="mt-3 gap-2 rounded-full">
                  <Plus className="h-3.5 w-3.5" /> Upload Document
                </Button>
              </div>
            )}
          </TabsContent>
          </div>
        </Tabs>
      </motion.div>

      <AddEventSheet
        open={addEventOpen}
        onOpenChange={setAddEventOpen}
        onAdd={(event) => setEvents((prev) => [...prev, event])}
      />
    </motion.div>
  );
}
