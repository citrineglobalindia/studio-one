import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Activity, Search, ChevronDown, ChevronUp, Heart, MapPin, Phone, CalendarDays,
  IndianRupee, Users, Package, TrendingUp, CheckCircle2, Clock, AlertCircle,
  Camera, Video, BookImage, Film, HardDrive, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  sampleLiveClients, deliverableStatusConfig, clientStatusConfig,
  type LiveClient, type Deliverable,
} from "@/data/live-clients-data";

const deliverableIcon: Record<string, React.ElementType> = {
  Photos: Camera,
  Videos: Video,
  Albums: BookImage,
  Highlights: Film,
  "Footage Copy": HardDrive,
};

function ProgressRing({ value, size = 48, stroke = 4 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const color = value === 100 ? "text-emerald-500" : value >= 60 ? "text-blue-500" : value >= 30 ? "text-amber-500" : "text-muted-foreground";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} className="text-muted/40" />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className={cn("transition-all duration-700", color)} />
      </svg>
      <span className={cn("absolute inset-0 flex items-center justify-center text-xs font-bold", color)}>
        {value}%
      </span>
    </div>
  );
}

function DeliverableRow({ d }: { d: Deliverable }) {
  const cfg = deliverableStatusConfig[d.status];
  const Icon = deliverableIcon[d.type] || Package;
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", cfg.bg)}>
        <Icon className={cn("h-4 w-4", cfg.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{d.label}</p>
          <Badge variant="outline" className={cn("text-[10px] shrink-0", cfg.bg, cfg.color, cfg.border)}>
            {cfg.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-1">
          <Progress value={d.progress} className="h-1.5 flex-1" />
          <span className="text-[10px] text-muted-foreground font-mono w-8 text-right">{d.progress}%</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
          <span>Due: {new Date(d.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
          {d.deliveredDate && (
            <span className="text-emerald-500 flex items-center gap-0.5">
              <CheckCircle2 className="h-3 w-3" /> Delivered {new Date(d.deliveredDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ClientExpandedCard({ client }: { client: LiveClient }) {
  const delivered = client.deliverables.filter((d) => d.status === "delivered").length;
  const total = client.deliverables.length;
  const profitMargin = client.financials.paidAmount > 0
    ? Math.round((client.financials.profit / client.financials.estimatedAmount) * 100)
    : 0;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="overflow-hidden"
    >
      <div className="px-4 pb-4 pt-1 space-y-4 border-t border-border">
        {/* Financial Summary */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <IndianRupee className="h-3 w-3" /> Financials
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { label: "Estimate", value: client.financials.estimatedAmount, color: "text-foreground" },
              { label: "Invoiced", value: client.financials.invoicedAmount, color: "text-blue-500" },
              { label: "Paid", value: client.financials.paidAmount, color: "text-emerald-500" },
              { label: "Pending", value: client.financials.pendingAmount, color: "text-amber-500" },
              { label: "Expenses", value: client.financials.expenses, color: "text-red-400" },
              { label: "Profit", value: client.financials.profit, color: "text-emerald-500" },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-muted/30 p-2.5 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
                <p className={cn("text-sm font-bold mt-0.5", f.color)}>₹{(f.value / 1000).toFixed(0)}K</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-muted-foreground">Profit Margin:</span>
            <span className={cn("font-bold", profitMargin >= 50 ? "text-emerald-500" : profitMargin >= 30 ? "text-amber-500" : "text-red-400")}>
              {profitMargin >= 50 ? <ArrowUpRight className="inline h-3 w-3" /> : <ArrowDownRight className="inline h-3 w-3" />}
              {profitMargin}%
            </span>
          </div>
        </div>

        {/* Team */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Users className="h-3 w-3" /> Team ({client.team.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {client.team.map((m) => (
              <div key={m.id} className="flex items-center gap-2 rounded-xl bg-muted/30 px-3 py-1.5">
                <div className="h-6 w-6 rounded-full bg-primary/15 text-primary flex items-center justify-center text-[10px] font-bold">
                  {m.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground leading-tight">{m.name}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{m.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables */}
        <div>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Package className="h-3 w-3" /> Deliverables ({delivered}/{total} delivered)
          </h4>
          <div className="space-y-1.5">
            {client.deliverables.map((d) => (
              <DeliverableRow key={d.id} d={d} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LiveClientsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return sampleLiveClients.filter((c) => {
      const matchSearch = `${c.name} ${c.partnerName} ${c.city}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [search, filterStatus]);

  const totalActive = sampleLiveClients.filter((c) => c.status === "active").length;
  const totalCompleted = sampleLiveClients.filter((c) => c.status === "completed").length;
  const avgProgress = Math.round(sampleLiveClients.reduce((s, c) => s + c.overallProgress, 0) / sampleLiveClients.length);
  const totalDelivered = sampleLiveClients.reduce((s, c) => s + c.deliverables.filter((d) => d.status === "delivered").length, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
            <Activity className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Live Clients</h1>
            <p className="text-xs text-muted-foreground">{sampleLiveClients.length} clients · Real-time project tracking</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: TrendingUp, label: "Active", value: totalActive, accent: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500", ring: "ring-emerald-500/15" },
          { icon: CheckCircle2, label: "Completed", value: totalCompleted, accent: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-500", ring: "ring-blue-500/15" },
          { icon: Activity, label: "Avg Progress", value: avgProgress, suffix: "%", accent: "from-primary/20 to-primary/5", iconColor: "text-primary", ring: "ring-primary/15" },
          { icon: Package, label: "Delivered", value: totalDelivered, accent: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500", ring: "ring-amber-500/15" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className={`bg-gradient-to-b ${stat.accent} backdrop-blur-sm border border-border rounded-2xl p-4 ring-1 ${stat.ring}`}>
              <div className="h-9 w-9 rounded-xl bg-card/80 flex items-center justify-center ring-1 ring-border mb-2.5">
                <Icon className={cn("h-4 w-4", stat.iconColor)} />
              </div>
              <p className="text-xl sm:text-2xl font-display font-extrabold text-foreground leading-tight">
                {stat.value}{stat.suffix || ""}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search live clients..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36 h-9">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="on-hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Client List */}
      <div className="space-y-3">
        {filtered.map((client) => {
          const cfg = clientStatusConfig[client.status];
          const isExpanded = expandedId === client.id;
          const delivered = client.deliverables.filter((d) => d.status === "delivered").length;
          const total = client.deliverables.length;

          return (
            <motion.div
              key={client.id}
              layout
              className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all"
            >
              {/* Summary Row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : client.id)}
                className="w-full text-left px-4 py-3.5 flex items-center gap-4 cursor-pointer group"
              >
                {/* Progress Ring */}
                <ProgressRing value={client.overallProgress} />

                {/* Client Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{client.name}</p>
                    <Heart className="h-3 w-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{client.partnerName}</p>
                    <Badge variant="outline" className={cn("text-[10px]", cfg.bg, cfg.color, cfg.border)}>
                      {cfg.label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{client.city}</span>
                    <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />{new Date(client.eventDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{client.team.length} members</span>
                    <span className="flex items-center gap-1"><Package className="h-3 w-3" />{delivered}/{total} delivered</span>
                  </div>
                </div>

                {/* Financials Quick View (desktop) */}
                <div className="hidden lg:flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Paid / Estimate</p>
                    <p className="text-sm font-bold text-foreground">
                      ₹{(client.financials.paidAmount / 1000).toFixed(0)}K
                      <span className="text-muted-foreground font-normal"> / ₹{(client.financials.estimatedAmount / 1000).toFixed(0)}K</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground">Profit</p>
                    <p className={cn("text-sm font-bold", client.financials.profit > 0 ? "text-emerald-500" : "text-red-400")}>
                      ₹{(client.financials.profit / 1000).toFixed(0)}K
                    </p>
                  </div>
                </div>

                {/* Expand Icon */}
                <div className="shrink-0">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {/* Expanded Detail */}
              <AnimatePresence>
                {isExpanded && <ClientExpandedCard client={client} />}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Activity className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No live clients found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      )}
    </motion.div>
  );
}
