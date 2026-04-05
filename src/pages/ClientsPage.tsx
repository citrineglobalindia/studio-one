import { useState, useMemo, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Users, Search, Plus, Phone, Mail, MapPin, IndianRupee, Star, Filter,
  Crown, TrendingUp, UserCheck, SlidersHorizontal, X, CalendarDays,
  ChevronRight, ArrowUpRight, Sparkles, Heart, ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { cn } from "@/lib/utils";
import { sampleClients, statusConfig, type Client } from "@/data/clients-data";
import { AddClientSheet } from "@/components/AddClientSheet";

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

const AnimatedNumber = ({ value, delay = 0, prefix = "", suffix = "" }: { value: number; delay?: number; prefix?: string; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      const controls = animate(motionVal, value, { duration: 1.2, delay, ease: [0.25, 0.1, 0.25, 1] });
      return controls.stop;
    }
  }, [isInView, motionVal, value, delay]);

  useEffect(() => {
    const unsub = rounded.on("change", (v) => { if (ref.current) ref.current.textContent = `${prefix}${v}${suffix}`; });
    return unsub;
  }, [rounded, prefix, suffix]);

  return <span ref={ref}>{prefix}0{suffix}</span>;
};

export default function ClientsPage() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>(sampleClients);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [sortBy, setSortBy] = useState<"name" | "spend" | "recent">("recent");

  const filtered = useMemo(() => {
    let result = clients.filter((c) => {
      const matchSearch = `${c.name} ${c.partnerName} ${c.city} ${c.email}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
    if (sortBy === "spend") result.sort((a, b) => b.totalSpend - a.totalSpend);
    else if (sortBy === "name") result.sort((a, b) => a.name.localeCompare(b.name));
    else result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return result;
  }, [search, filterStatus, sortBy]);

  const totalLifetimeValue = clients.reduce((s, c) => s + c.totalSpend, 0);
  const totalPending = clients.reduce((s, c) => s + c.pendingAmount, 0);
  const activeCount = clients.filter((c) => c.status === "active").length;
  const vipCount = clients.filter((c) => c.status === "vip").length;

  const activeFilterCount = filterStatus !== "all" ? 1 : 0;

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
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Clients</h1>
            <p className="text-xs text-muted-foreground">{clients.length} clients · ₹{(totalLifetimeValue / 100000).toFixed(1)}L lifetime value</p>
          </div>
        </div>
        <Button size="sm" className="gap-2 rounded-xl" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </motion.div>

      {/* ═══ Stat Cards ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: IndianRupee, label: "Revenue", value: Math.round(totalLifetimeValue / 1000), prefix: "₹", suffix: "K", accent: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500", ring: "ring-emerald-500/15" },
          { icon: TrendingUp, label: "Pending", value: Math.round(totalPending / 1000), prefix: "₹", suffix: "K", accent: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500", ring: "ring-amber-500/15" },
          { icon: UserCheck, label: "Active", value: activeCount, prefix: "", suffix: "", accent: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-500", ring: "ring-blue-500/15" },
          { icon: Crown, label: "VIP", value: vipCount, prefix: "", suffix: "", accent: "from-primary/20 to-primary/5", iconColor: "text-primary", ring: "ring-primary/15" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              variants={cardVariants}
              className={`bg-gradient-to-b ${stat.accent} backdrop-blur-sm border border-border rounded-2xl p-4 ring-1 ${stat.ring}`}
            >
              <div className="h-9 w-9 rounded-xl bg-card/80 flex items-center justify-center ring-1 ring-border mb-2.5">
                <Icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
              <p className="text-xl sm:text-2xl font-display font-extrabold text-foreground leading-tight">
                <AnimatedNumber value={stat.value} delay={0.2 + i * 0.1} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* ═══ Search + Filters ═══ */}
      <motion.div variants={cardVariants} className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Sort - Desktop */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-32 h-9 hidden sm:flex">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Recent</SelectItem>
            <SelectItem value="spend">Highest Spend</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter - Desktop */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-9 hidden sm:flex">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="vip">VIP</SelectItem>
            <SelectItem value="past">Completed</SelectItem>
          </SelectContent>
        </Select>

        {/* Mobile Filter Button */}
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="sm:hidden h-9 w-9 relative shrink-0">
              <SlidersHorizontal className="h-4 w-4" />
              {activeFilterCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[70vh]">
            <SheetHeader className="pb-4">
              <SheetTitle className="flex items-center gap-2 text-base">
                <SlidersHorizontal className="h-4 w-4 text-primary" /> Filters
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-5">
              {/* Status Chips */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "active", label: "Active" },
                    { value: "vip", label: "VIP" },
                    { value: "past", label: "Completed" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterStatus(opt.value)}
                      className={cn(
                        "px-3.5 py-2 rounded-full text-xs font-medium border transition-all",
                        filterStatus === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">Sort By</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "recent", label: "Recent" },
                    { value: "spend", label: "Highest Spend" },
                    { value: "name", label: "Name A-Z" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSortBy(opt.value as typeof sortBy)}
                      className={cn(
                        "px-3.5 py-2 rounded-full text-xs font-medium border transition-all",
                        sortBy === opt.value
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:border-primary/40"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full h-11 rounded-xl font-semibold gap-2" onClick={() => setFilterOpen(false)}>
                <Filter className="h-4 w-4" /> Show {filtered.length} Clients
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Active Filters (mobile) */}
      {activeFilterCount > 0 && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 sm:hidden">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Active:</span>
          <button
            onClick={() => setFilterStatus("all")}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20"
          >
            {statusConfig[filterStatus as keyof typeof statusConfig]?.label || filterStatus}
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}

      {/* ═══ Client Cards Grid ═══ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client, i) => {
          const cfg = statusConfig[client.status];
          return (
            <motion.div
              key={client.id}
              variants={cardVariants}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/clients/${client.id}`)}
              className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all cursor-pointer group"
            >
              {/* Accent Bar */}
              <div className={cn("h-1", client.status === "vip" ? "bg-gradient-to-r from-primary via-primary/70 to-primary/40" : client.status === "active" ? "bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500/40" : "bg-gradient-to-r from-muted-foreground/30 to-muted/20")} />

              <div className="p-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-11 w-11 rounded-xl flex items-center justify-center font-bold text-sm ring-1",
                      client.status === "vip" ? "bg-primary/15 text-primary ring-primary/20" : "bg-muted text-foreground ring-border"
                    )}>
                      {client.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{client.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Heart className="h-3 w-3" /> {client.partnerName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={cn("text-[10px] shrink-0", cfg.bgColor, cfg.color, cfg.borderColor)}>
                    {client.status === "vip" && <Crown className="h-3 w-3 mr-1" />}
                    {cfg.label}
                  </Badge>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{client.city}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span className="truncate">{client.phone}</span>
                  </div>
                  {client.weddingDate && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      <span>{new Date(client.weddingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Sparkles className="h-3 w-3 shrink-0" />
                    <span>{client.source}</span>
                  </div>
                </div>

                {/* Tags */}
                {client.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {client.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                        {tag}
                      </span>
                    ))}
                    {client.tags.length > 3 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                        +{client.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Spent</p>
                      <p className="text-sm font-bold text-foreground">₹{(client.totalSpend / 1000).toFixed(0)}K</p>
                    </div>
                    {client.pendingAmount > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Pending</p>
                        <p className="text-sm font-bold text-amber-500">₹{(client.pendingAmount / 1000).toFixed(0)}K</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <Star key={j} className={cn("h-3 w-3", j < client.rating ? "text-primary fill-primary" : "text-muted")} />
                      ))}
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-foreground font-medium">No clients found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Add Client Sheet */}
      <AddClientSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={(client) => setClients((prev) => [client, ...prev])}
      />
    </motion.div>
  );
}
