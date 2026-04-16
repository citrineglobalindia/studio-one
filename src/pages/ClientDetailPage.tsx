import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Phone, Mail, MapPin, IndianRupee, Crown,
  ArrowLeft, CalendarDays, Sparkles, Heart, FileText,
  PhoneCall, Send, Briefcase, Clock, PenLine,
  Receipt, CreditCard, PartyPopper, CheckCircle2, Plus,
  MoreHorizontal, Edit, Trash2, Copy, Share2, Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { useInvoices } from "@/hooks/useInvoices";
import { useProjects } from "@/hooks/useProjects";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } } as const;
const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  active: { label: "Active", color: "text-emerald-600", bgColor: "bg-emerald-50 dark:bg-emerald-500/10", borderColor: "border-emerald-200 dark:border-emerald-500/30" },
  vip: { label: "VIP", color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/30" },
  completed: { label: "Completed", color: "text-muted-foreground", bgColor: "bg-muted", borderColor: "border-border" },
  "on-hold": { label: "On Hold", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-500/10", borderColor: "border-amber-200 dark:border-amber-500/30" },
};

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clients, isLoading } = useClients();
  const { invoices } = useInvoices();
  const { projects } = useProjects();

  const client = clients.find((c) => c.id === id);

  const clientInvoices = invoices.filter((inv) => inv.client_id === id);
  const clientProjects = projects.filter((p) => p.client_id === id);

  const totalInvoiced = clientInvoices.reduce((s, inv) => s + (inv.total_amount || 0), 0);
  const totalPaid = clientInvoices.reduce((s, inv) => s + (inv.amount_paid || 0), 0);
  const totalDue = totalInvoiced - totalPaid;
  const paidPercent = totalInvoiced > 0 ? Math.round((totalPaid / totalInvoiced) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

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

  const cfg = statusConfig[client.status] || statusConfig.active;

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl" onClick={() => navigate("/clients")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">{client.name}</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              {client.partner_name && <><Heart className="h-3 w-3 text-rose-400" /> {client.partner_name}<span className="mx-1">·</span></>}
              {client.city && <><MapPin className="h-3 w-3" /> {client.city}</>}
              {client.event_date && (
                <><span className="mx-1">·</span><CalendarDays className="h-3 w-3" /> {new Date(client.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-xs shrink-0 px-3 py-1 rounded-full font-semibold", cfg.bgColor, cfg.color, cfg.borderColor)}>
            {client.status === "vip" && <Crown className="h-3 w-3 mr-1" />}
            {cfg.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9"><MoreHorizontal className="h-4 w-4" /></Button>
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

      {/* Profile + Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Profile Card */}
        <motion.div variants={cardVariants} className="lg:col-span-2 rounded-2xl bg-card border border-border overflow-hidden">
          <div className={cn(
            "h-1.5",
            client.status === "vip" ? "bg-gradient-to-r from-primary via-primary/70 to-primary/40"
              : client.status === "active" ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500/40"
              : "bg-gradient-to-r from-muted-foreground/30 to-muted/20"
          )} />
          <div className="p-5">
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-xl ring-2 shrink-0",
                  client.status === "vip" ? "bg-gradient-to-br from-primary/20 to-primary/5 text-primary ring-primary/25" : "bg-gradient-to-br from-muted to-muted/50 text-foreground ring-border"
                )}>
                  {client.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                {client.status === "vip" && (
                  <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <Crown className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap gap-2">
                  {client.source && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
                      <Sparkles className="h-3 w-3" /> {client.source}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
                    <Briefcase className="h-3 w-3" /> {clientProjects.length} project{clientProjects.length !== 1 ? "s" : ""}
                  </span>
                  {client.event_type && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full border border-border/50">
                      <PartyPopper className="h-3 w-3" /> {client.event_type}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5 flex-wrap">
              {client.phone && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl px-4">
                      <PhoneCall className="h-3.5 w-3.5" /> Call
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{client.phone}</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl px-4">
                    <Send className="h-3.5 w-3.5" /> WhatsApp
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Open WhatsApp</TooltipContent>
              </Tooltip>
              {client.email && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 rounded-xl px-4">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{client.email}</TooltipContent>
                </Tooltip>
              )}
              <Button size="sm" className="gap-2 rounded-xl px-4" onClick={() => navigate("/projects")}>
                <Briefcase className="h-3.5 w-3.5" /> New Project
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Financial Summary */}
        <motion.div variants={cardVariants} className="space-y-3">
          {[
            { label: "TOTAL PAID", value: `₹${(totalPaid / 1000).toFixed(0)}K`, color: "text-foreground", accent: "from-emerald-500/20 to-emerald-500/5", ring: "ring-emerald-500/15" },
            { label: "PENDING", value: `₹${(totalDue / 1000).toFixed(0)}K`, color: "text-amber-500", accent: "from-amber-500/20 to-amber-500/5", ring: "ring-amber-500/15" },
            { label: "BUDGET", value: `₹${((client.budget || 0) / 1000).toFixed(0)}K`, color: "text-foreground", accent: "from-primary/20 to-primary/5", ring: "ring-primary/15" },
          ].map((card) => (
            <div key={card.label} className={cn("bg-gradient-to-b rounded-2xl p-4 ring-1 border border-border", card.accent, card.ring)}>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">{card.label}</p>
              <p className={cn("text-xl font-display font-extrabold mt-1.5 tracking-tight", card.color)}>{card.value}</p>
            </div>
          ))}

          {totalInvoiced > 0 && (
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
          )}
        </motion.div>
      </div>

      {/* Tabs Section */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <Tabs defaultValue="invoices">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-1 h-auto p-0 px-5 overflow-x-auto">
            {[
              { value: "invoices", icon: Receipt, label: "Invoices", count: clientInvoices.length },
              { value: "projects", icon: Briefcase, label: "Projects", count: clientProjects.length },
              { value: "contact", icon: Phone, label: "Contact" },
            ].map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 gap-2 text-xs font-medium whitespace-nowrap transition-all"
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.count !== undefined && (
                  <Badge variant="secondary" className="text-[9px] h-4 min-w-[16px] px-1 ml-0.5 rounded-full">{tab.count}</Badge>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="p-5">
            {/* Invoices Tab */}
            <TabsContent value="invoices" className="mt-0 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "INVOICED", value: `₹${(totalInvoiced / 1000).toFixed(0)}K`, bg: "bg-muted/40", color: "text-foreground", border: "border-border" },
                  { label: "RECEIVED", value: `₹${(totalPaid / 1000).toFixed(0)}K`, bg: "bg-emerald-500/8", color: "text-emerald-500", border: "border-emerald-500/20" },
                  { label: "DUE", value: `₹${(totalDue / 1000).toFixed(0)}K`, bg: "bg-amber-500/8", color: "text-amber-500", border: "border-amber-500/20" },
                ].map((s) => (
                  <div key={s.label} className={cn("rounded-xl border p-4 text-center", s.bg, s.border)}>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">{s.label}</p>
                    <p className={cn("text-lg font-bold mt-1.5", s.color)}>{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5">
                {clientInvoices.map((inv, i) => (
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
                          <span className="text-xs font-mono text-muted-foreground font-medium">{inv.invoice_number}</span>
                          <Badge variant="outline" className="text-[9px] px-2 py-0.5 h-auto border rounded-full font-semibold">
                            {inv.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-foreground">{inv.project_name || inv.client_name}</p>
                        {inv.due_date && (
                          <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" /> Due: {new Date(inv.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-base font-bold text-foreground tabular-nums">₹{(inv.total_amount || 0).toLocaleString("en-IN")}</p>
                        {inv.amount_paid > 0 && inv.amount_paid < inv.total_amount && (
                          <p className="text-[10px] text-emerald-500 mt-0.5 font-medium">Paid: ₹{inv.amount_paid.toLocaleString("en-IN")}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {clientInvoices.length === 0 && (
                  <div className="py-16 text-center">
                    <Receipt className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No invoices created</p>
                    <Button variant="outline" size="sm" className="mt-3 gap-2 rounded-full" onClick={() => navigate("/invoices")}>
                      <Plus className="h-3.5 w-3.5" /> Create Invoice
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Projects Tab */}
            <TabsContent value="projects" className="mt-0 space-y-3">
              {clientProjects.map((proj, i) => (
                <motion.div
                  key={proj.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/projects/${proj.id}`)}
                  className="rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer bg-card"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{proj.project_name}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        {proj.event_type && <span>{proj.event_type}</span>}
                        {proj.event_date && <span>· {new Date(proj.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-[10px] capitalize">{proj.status}</Badge>
                  </div>
                  {(proj.total_amount || 0) > 0 && (
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">Total: <span className="font-bold text-foreground">₹{((proj.total_amount || 0) / 1000).toFixed(0)}K</span></span>
                      <span className="text-muted-foreground">Paid: <span className="font-bold text-emerald-500">₹{((proj.amount_paid || 0) / 1000).toFixed(0)}K</span></span>
                    </div>
                  )}
                </motion.div>
              ))}
              {clientProjects.length === 0 && (
                <div className="py-16 text-center">
                  <Briefcase className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No projects yet</p>
                  <Button variant="outline" size="sm" className="mt-3 gap-2 rounded-full" onClick={() => navigate("/projects")}>
                    <Plus className="h-3.5 w-3.5" /> Create Project
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact" className="mt-0 space-y-3">
              {[
                { icon: Phone, label: "Phone", value: client.phone || "–", action: client.phone ? "Call" : undefined },
                { icon: Mail, label: "Email", value: client.email || "–", action: client.email ? "Send" : undefined },
                { icon: MapPin, label: "City", value: client.city || "–" },
                { icon: Sparkles, label: "Source", value: client.source || "–" },
                { icon: CalendarDays, label: "Event Date", value: client.event_date ? new Date(client.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "–" },
                { icon: CalendarDays, label: "Delivery Date", value: client.delivery_date ? new Date(client.delivery_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "–" },
                { icon: CalendarDays, label: "Client Since", value: new Date(client.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) },
              ].filter(item => item.value !== "–").map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
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
                    {item.action && (
                      <Button variant="ghost" size="sm" className="text-xs text-primary shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.action}
                      </Button>
                    )}
                  </motion.div>
                );
              })}
              {client.notes && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <p className="text-[10px] text-primary uppercase tracking-[0.15em] font-bold mb-1.5">Notes</p>
                  <p className="text-sm text-foreground leading-relaxed">{client.notes}</p>
                </motion.div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
