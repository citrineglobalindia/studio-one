import { useParams, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Phone, Mail, MapPin, IndianRupee, Star, Crown,
  ArrowLeft, CalendarDays, Sparkles, Heart, FileText,
  ChevronRight, PhoneCall, MessageSquare, Briefcase,
  Clock, Download, PenLine, Send, ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { sampleClients, statusConfig, type Client, type ClientActivity } from "@/data/clients-data";

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

export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const client = sampleClients.find((c) => c.id === id);

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-5"
    >
      {/* Back Button */}
      <motion.div variants={cardVariants}>
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground -ml-2" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-4 w-4" /> Clients
        </Button>
      </motion.div>

      {/* ═══ Profile Header ═══ */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className={cn("h-1.5", client.status === "vip" ? "bg-gradient-to-r from-primary via-primary/70 to-primary/40" : client.status === "active" ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500/40" : "bg-gradient-to-r from-muted-foreground/30 to-muted/20")} />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Avatar */}
            <div className={cn(
              "h-16 w-16 rounded-2xl flex items-center justify-center font-bold text-xl ring-2 shrink-0",
              client.status === "vip" ? "bg-primary/15 text-primary ring-primary/20" : "bg-muted text-foreground ring-border"
            )}>
              {client.name.split(" ").map(n => n[0]).join("")}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">{client.name}</h1>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <Heart className="h-3.5 w-3.5" /> {client.partnerName}
                  </p>
                </div>
                <Badge variant="outline" className={cn("text-xs shrink-0", cfg.bgColor, cfg.color, cfg.borderColor)}>
                  {client.status === "vip" && <Crown className="h-3 w-3 mr-1" />}
                  {cfg.label}
                </Badge>
              </div>

              {/* Info Pills */}
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                  <MapPin className="h-3 w-3" /> {client.city}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                  <Sparkles className="h-3 w-3" /> {client.source}
                </span>
                {client.weddingDate && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                    <CalendarDays className="h-3 w-3" /> {new Date(client.weddingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-lg">
                  <Briefcase className="h-3 w-3" /> {client.projects} project{client.projects !== 1 ? "s" : ""}
                </span>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mt-2.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={cn("h-4 w-4", j < client.rating ? "text-primary fill-primary" : "text-muted")} />
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-5 flex-wrap">
            <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1 sm:flex-none">
              <PhoneCall className="h-4 w-4" /> Call
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1 sm:flex-none">
              <Send className="h-4 w-4" /> WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="gap-2 rounded-xl flex-1 sm:flex-none">
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button size="sm" className="gap-2 rounded-xl flex-1 sm:flex-none">
              <Briefcase className="h-4 w-4" /> New Project
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ═══ Financial Summary ═══ */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div variants={cardVariants} className="bg-gradient-to-b from-emerald-500/15 to-emerald-500/5 border border-border rounded-2xl p-4 ring-1 ring-emerald-500/15">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Paid</p>
          <p className="text-lg sm:text-xl font-display font-extrabold text-foreground mt-1">₹{((client.totalSpend - client.pendingAmount) / 1000).toFixed(0)}K</p>
        </motion.div>
        <motion.div variants={cardVariants} className="bg-gradient-to-b from-amber-500/15 to-amber-500/5 border border-border rounded-2xl p-4 ring-1 ring-amber-500/15">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Pending</p>
          <p className="text-lg sm:text-xl font-display font-extrabold text-amber-500 mt-1">₹{(client.pendingAmount / 1000).toFixed(0)}K</p>
        </motion.div>
        <motion.div variants={cardVariants} className="bg-gradient-to-b from-primary/15 to-primary/5 border border-border rounded-2xl p-4 ring-1 ring-primary/15">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Total Value</p>
          <p className="text-lg sm:text-xl font-display font-extrabold text-foreground mt-1">₹{(client.totalSpend / 1000).toFixed(0)}K</p>
        </motion.div>
      </div>

      {/* Payment Progress */}
      <motion.div variants={cardVariants} className="rounded-2xl bg-card border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-muted-foreground">Payment Progress</span>
          <span className="text-xs font-bold text-foreground">{paidPercent}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${paidPercent}%` }}
            transition={{ delay: 0.3, duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          />
        </div>
      </motion.div>

      {/* ═══ Tabs: Activity / Contact / Documents ═══ */}
      <motion.div variants={cardVariants}>
        <Tabs defaultValue="activity">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
            <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2 text-xs">
              <Clock className="h-3.5 w-3.5" /> Activity
              <Badge variant="secondary" className="text-[9px] h-4 px-1">{client.activities.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="contact" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2 text-xs">
              <Phone className="h-3.5 w-3.5" /> Contact
            </TabsTrigger>
            <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2 text-xs">
              <FileText className="h-3.5 w-3.5" /> Documents
              <Badge variant="secondary" className="text-[9px] h-4 px-1">{client.documents.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* Activity Timeline */}
          <TabsContent value="activity" className="mt-4">
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
                    {/* Timeline Line */}
                    {i < client.activities.length - 1 && (
                      <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
                    )}
                    {/* Icon */}
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 ring-1 ring-border", colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground">{activity.title}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                          {new Date(activity.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                      {activity.by && (
                        <span className="text-[10px] text-primary mt-1 inline-block">by {activity.by}</span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
              {client.activities.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">No activity yet</div>
              )}
            </div>
          </TabsContent>

          {/* Contact Info */}
          <TabsContent value="contact" className="mt-4 space-y-3">
            {[
              { icon: Phone, label: "Phone", value: client.phone },
              { icon: Mail, label: "Email", value: client.email },
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
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border"
                >
                  <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{item.label}</p>
                    <p className="text-sm text-foreground">{item.value}</p>
                  </div>
                </motion.div>
              );
            })}
            {client.notes && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="p-3 rounded-xl bg-primary/5 border border-primary/20"
              >
                <p className="text-[10px] text-primary uppercase tracking-wider font-semibold mb-1">Notes</p>
                <p className="text-sm text-foreground">{client.notes}</p>
              </motion.div>
            )}
          </TabsContent>

          {/* Documents */}
          <TabsContent value="documents" className="mt-4 space-y-2">
            {client.documents.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer group"
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                  doc.type === "contract" ? "bg-blue-500/15 text-blue-500" :
                  doc.type === "invoice" ? "bg-emerald-500/15 text-emerald-500" :
                  "bg-muted text-muted-foreground"
                )}>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{doc.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(doc.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {doc.size}
                  </p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
              </motion.div>
            ))}
            {client.documents.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">No documents uploaded</div>
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
