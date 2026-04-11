import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Activity, Search, TrendingUp, CheckCircle2, Package,
  LayoutList, LayoutGrid, Presentation,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { sampleLiveClients } from "@/data/live-clients-data";

import { ListView } from "@/components/live-clients/ListView";
import { CardView } from "@/components/live-clients/CardView";
import { TableView } from "@/components/live-clients/TableView";
import { PresentView } from "@/components/live-clients/PresentView";

type ViewMode = "list" | "card" | "table" | "present";

const viewOptions: { value: ViewMode; label: string; icon: React.ElementType }[] = [
  { value: "list", label: "List", icon: LayoutList },
  { value: "card", label: "Cards", icon: LayoutGrid },
  { value: "table", label: "Table", icon: Activity },
  { value: "present", label: "Present", icon: Presentation },
];

export default function LiveClientsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto space-y-5">
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

        {/* View Switcher */}
        <div className="flex items-center rounded-xl bg-muted/50 p-1 ring-1 ring-border">
          {viewOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = viewMode === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => setViewMode(opt.value)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isActive
                    ? "bg-card text-primary shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{opt.label}</span>
              </button>
            );
          })}
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

      {/* View Content */}
      {viewMode === "list" && <ListView clients={filtered} />}
      {viewMode === "card" && <CardView clients={filtered} />}
      {viewMode === "table" && <TableView clients={filtered} />}
      {viewMode === "present" && <PresentView clients={filtered} />}

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
