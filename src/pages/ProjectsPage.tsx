import { useState, useMemo, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { sampleProjects, sampleTeamMembers, type WeddingProject } from "@/data/wedding-types";
import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CalendarDays, MapPin, Users, IndianRupee, Plus, Search, Filter,
  LayoutGrid, List, SlidersHorizontal, X, ChevronRight, MoreVertical,
  TrendingUp, FolderKanban, Download, Upload, Trash2, Eye, Pencil,
  Package, Clock, CheckCircle2, AlertCircle, Sparkles,
} from "lucide-react";

const statusConfig: Record<string, { label: string; class: string; icon: typeof Clock; accent: string }> = {
  inquiry: { label: "Inquiry", class: "bg-muted text-muted-foreground border-border", icon: Sparkles, accent: "from-muted-foreground/20 to-muted/5" },
  booked: { label: "Booked", class: "bg-primary/20 text-primary border-primary/30", icon: CheckCircle2, accent: "from-primary/20 to-primary/5" },
  "in-progress": { label: "In Progress", class: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Clock, accent: "from-blue-500/20 to-blue-500/5" },
  editing: { label: "Editing", class: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Pencil, accent: "from-purple-500/20 to-purple-500/5" },
  delivered: { label: "Delivered", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Package, accent: "from-emerald-500/20 to-emerald-500/5" },
  completed: { label: "Completed", class: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2, accent: "from-emerald-500/20 to-emerald-500/5" },
};

const packages = ["Basic Package", "Standard Package", "Premium Package", "Royal Wedding Package", "Destination Wedding Package"];

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
} as const;

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 220, damping: 22 } },
};

const AnimatedNumber = ({ value, delay = 0, prefix = "", suffix = "" }: { value: number; delay?: number; prefix?: string; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const isInView = useInView(ref, { once: true });
  useEffect(() => { if (isInView) { const c = animate(motionVal, value, { duration: 1.2, delay, ease: [0.25, 0.1, 0.25, 1] }); return c.stop; } }, [isInView, motionVal, value, delay]);
  useEffect(() => { const unsub = rounded.on("change", (v) => { if (ref.current) ref.current.textContent = `${prefix}${v}${suffix}`; }); return unsub; }, [rounded, prefix, suffix]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
};

const ProjectsPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState(sampleProjects);
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "name">("date");
  const [viewMode, setViewMode] = useState<"grid" | "list" | "kanban">("grid");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [form, setForm] = useState({
    clientName: "", partnerName: "", clientPhone: "", weddingDate: "",
    city: "", venue: "", package: "Standard Package", totalAmount: "",
    status: "inquiry" as WeddingProject["status"],
    selectedTeam: [] as string[],
    notes: "",
  });

  const filtered = useMemo(() => {
    let result = projects.filter((p) => {
      const matchSearch = `${p.clientName} ${p.partnerName} ${p.city} ${p.venue}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === "all" || p.status === filterStatus;
      return matchSearch && matchStatus;
    });
    if (sortBy === "amount") result.sort((a, b) => b.totalAmount - a.totalAmount);
    else if (sortBy === "name") result.sort((a, b) => a.clientName.localeCompare(b.clientName));
    else result.sort((a, b) => new Date(b.weddingDate).getTime() - new Date(a.weddingDate).getTime());
    return result;
  }, [projects, search, filterStatus, sortBy]);

  const totalRevenue = projects.reduce((s, p) => s + p.totalAmount, 0);
  const totalCollected = projects.reduce((s, p) => s + p.paidAmount, 0);
  const activeCount = projects.filter((p) => ["booked", "in-progress", "editing"].includes(p.status)).length;
  const completedCount = projects.filter((p) => ["delivered", "completed"].includes(p.status)).length;

  const toggleTeam = (id: string) => setForm((p) => ({ ...p, selectedTeam: p.selectedTeam.includes(id) ? p.selectedTeam.filter((t) => t !== id) : [...p.selectedTeam, id] }));
  const toggleSelect = (id: string) => setSelectedProjects((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const toggleSelectAll = () => setSelectedProjects(selectedProjects.length === filtered.length ? [] : filtered.map((p) => p.id));

  const handleAdd = () => {
    if (!form.clientName || !form.partnerName || !form.weddingDate) { toast.error("Client name, partner name, and wedding date are required"); return; }
    const project: WeddingProject = {
      id: `p-${Date.now()}`, clientName: form.clientName, partnerName: form.partnerName,
      clientPhone: form.clientPhone, weddingDate: form.weddingDate, city: form.city, venue: form.venue,
      status: form.status, package: form.package, totalAmount: parseInt(form.totalAmount) || 0,
      paidAmount: 0, subEvents: [], footage: [], payments: [],
      team: sampleTeamMembers.filter((m) => form.selectedTeam.includes(m.id)),
      createdAt: new Date().toISOString().split("T")[0],
    };
    setProjects((prev) => [project, ...prev]);
    setAddOpen(false);
    setForm({ clientName: "", partnerName: "", clientPhone: "", weddingDate: "", city: "", venue: "", package: "Standard Package", totalAmount: "", status: "inquiry", selectedTeam: [], notes: "" });
    toast.success("Project created!");
  };

  const handleBulkDelete = () => {
    setProjects((prev) => prev.filter((p) => !selectedProjects.includes(p.id)));
    toast.success(`${selectedProjects.length} projects deleted`);
    setSelectedProjects([]);
  };

  const activeFilterCount = filterStatus !== "all" ? 1 : 0;

  const kanbanStatuses = ["inquiry", "booked", "in-progress", "editing", "delivered", "completed"];

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
            <FolderKanban className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Wedding Projects</h1>
            <p className="text-xs text-muted-foreground">{projects.length} projects · ₹{(totalRevenue / 100000).toFixed(1)}L total value</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <Button size="sm" className="gap-2 rounded-xl" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: IndianRupee, label: "Revenue", value: Math.round(totalRevenue / 1000), prefix: "₹", suffix: "K", accent: "from-emerald-500/20 to-emerald-500/5", iconColor: "text-emerald-500", ring: "ring-emerald-500/15" },
          { icon: TrendingUp, label: "Collected", value: Math.round(totalCollected / 1000), prefix: "₹", suffix: "K", accent: "from-blue-500/20 to-blue-500/5", iconColor: "text-blue-500", ring: "ring-blue-500/15" },
          { icon: Clock, label: "Active", value: activeCount, prefix: "", suffix: "", accent: "from-amber-500/20 to-amber-500/5", iconColor: "text-amber-500", ring: "ring-amber-500/15" },
          { icon: CheckCircle2, label: "Completed", value: completedCount, prefix: "", suffix: "", accent: "from-primary/20 to-primary/5", iconColor: "text-primary", ring: "ring-primary/15" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} variants={cardVariants} className={`bg-gradient-to-b ${stat.accent} backdrop-blur-sm border border-border rounded-2xl p-4 ring-1 ${stat.ring}`}>
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

      {/* Search + View Toggle + Filters */}
      <motion.div variants={cardVariants} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>

        {/* View Toggle */}
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0 hidden sm:flex">
          {([
            { value: "grid" as const, icon: LayoutGrid },
            { value: "list" as const, icon: List },
            { value: "kanban" as const, icon: FolderKanban },
          ]).map((v) => (
            <button key={v.value} onClick={() => setViewMode(v.value)}
              className={cn("flex items-center gap-1 px-2.5 py-2 text-xs transition-colors",
                viewMode === v.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted"
              )}>
              <v.icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="w-32 h-9 hidden sm:flex"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="date">By Date</SelectItem>
            <SelectItem value="amount">By Amount</SelectItem>
            <SelectItem value="name">By Name</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-9 hidden sm:flex"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(statusConfig).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Mobile Filter */}
        <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
          <Button variant="outline" size="icon" className="sm:hidden h-9 w-9 relative shrink-0" onClick={() => setFilterOpen(true)}>
            <SlidersHorizontal className="h-4 w-4" />
            {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">{activeFilterCount}</span>}
          </Button>
          <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[70vh]">
            <SheetHeader className="pb-4">
              <div className="text-base font-semibold flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary" /> Filters</div>
            </SheetHeader>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">Status</label>
                <div className="flex flex-wrap gap-2">
                  {[{ value: "all", label: "All" }, ...Object.entries(statusConfig).map(([k, v]) => ({ value: k, label: v.label }))].map((opt) => (
                    <button key={opt.value} onClick={() => setFilterStatus(opt.value)}
                      className={cn("px-3.5 py-2 rounded-full text-xs font-medium border transition-all",
                        filterStatus === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/40"
                      )}>{opt.label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">View</label>
                <div className="flex gap-2">
                  {([{ value: "grid" as const, label: "Grid" }, { value: "list" as const, label: "List" }, { value: "kanban" as const, label: "Kanban" }]).map((v) => (
                    <button key={v.value} onClick={() => setViewMode(v.value)}
                      className={cn("px-3.5 py-2 rounded-full text-xs font-medium border transition-all",
                        viewMode === v.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border"
                      )}>{v.label}</button>
                  ))}
                </div>
              </div>
              <Button className="w-full h-11 rounded-xl font-semibold gap-2" onClick={() => setFilterOpen(false)}>
                <Filter className="h-4 w-4" /> Show {filtered.length} Projects
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </motion.div>

      {/* Bulk Actions */}
      {selectedProjects.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-primary/5 border border-primary/20">
          <Checkbox checked={selectedProjects.length === filtered.length} onCheckedChange={toggleSelectAll} />
          <span className="text-sm font-medium text-foreground">{selectedProjects.length} selected</span>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="gap-1.5 text-xs"><Download className="h-3.5 w-3.5" /> Export</Button>
          <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={handleBulkDelete}><Trash2 className="h-3.5 w-3.5" /> Delete</Button>
        </motion.div>
      )}

      {/* ═══ KANBAN VIEW ═══ */}
      {viewMode === "kanban" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto">
          {kanbanStatuses.map((status) => {
            const cfg = statusConfig[status];
            const items = filtered.filter((p) => p.status === status);
            return (
              <div key={status} className="min-w-[220px]">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={cn("h-2 w-2 rounded-full", cfg.class.split(" ")[0])} />
                  <span className="text-xs font-semibold text-foreground">{cfg.label}</span>
                  <Badge variant="secondary" className="text-[10px] h-5 px-1.5 ml-auto">{items.length}</Badge>
                </div>
                <div className="space-y-2">
                  {items.map((project) => {
                    const payPct = project.totalAmount > 0 ? Math.round((project.paidAmount / project.totalAmount) * 100) : 0;
                    return (
                      <motion.div key={project.id} whileTap={{ scale: 0.98 }}
                        onClick={() => navigate(`/projects/${project.id}`)}
                        className="rounded-xl bg-card border border-border p-3 hover:border-primary/30 transition-all cursor-pointer group">
                        <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">{project.clientName} & {project.partnerName}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(project.weddingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                            <span>₹{(project.paidAmount / 1000).toFixed(0)}K</span>
                            <span>{payPct}%</span>
                          </div>
                          <Progress value={payPct} className="h-1" />
                        </div>
                        <div className="flex -space-x-1 mt-2">
                          {project.team.slice(0, 3).map((t) => (
                            <Avatar key={t.id} className="h-5 w-5 border border-background">
                              <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{t.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                          ))}
                          {project.team.length > 3 && <span className="text-[9px] text-muted-foreground ml-1">+{project.team.length - 3}</span>}
                        </div>
                      </motion.div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-[10px] text-muted-foreground">No projects</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ GRID VIEW ═══ */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const cfg = statusConfig[project.status];
            const payPct = project.totalAmount > 0 ? Math.round((project.paidAmount / project.totalAmount) * 100) : 0;
            const StatusIcon = cfg.icon;
            return (
              <motion.div key={project.id} variants={cardVariants} whileTap={{ scale: 0.98 }}
                className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/30 transition-all cursor-pointer group relative">
                <div className={cn("h-1", `bg-gradient-to-r ${cfg.accent}`)} />
                {/* Select checkbox */}
                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selectedProjects.includes(project.id)} onCheckedChange={() => toggleSelect(project.id)} />
                </div>
                {/* Menu */}
                <div className="absolute top-3 right-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(`/projects/${project.id}`)}><Eye className="h-3.5 w-3.5 mr-2" /> View</DropdownMenuItem>
                      <DropdownMenuItem><Pencil className="h-3.5 w-3.5 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="p-4 pt-3" onClick={() => navigate(`/projects/${project.id}`)}>
                  <div className="flex items-start gap-3 mb-3 ml-7">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{project.clientName} & {project.partnerName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={cn("text-[10px]", cfg.class)}><StatusIcon className="h-3 w-3 mr-1" />{cfg.label}</Badge>
                        <span className="text-[10px] text-muted-foreground">{project.package}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3 shrink-0" /><span>{new Date(project.weddingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{project.city}</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Users className="h-3 w-3 shrink-0" /><span>{project.team.length} crew</span></div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3 shrink-0" /><span>{project.subEvents.length} events</span></div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-muted-foreground">₹{(project.paidAmount / 1000).toFixed(0)}K / ₹{(project.totalAmount / 1000).toFixed(0)}K</span>
                      <span className="text-[10px] font-semibold text-foreground">{payPct}%</span>
                    </div>
                    <Progress value={payPct} className="h-1.5" />
                    <div className="flex items-center justify-between mt-2.5">
                      <div className="flex -space-x-1.5">
                        {project.team.slice(0, 4).map((t) => (
                          <Avatar key={t.id} className="h-6 w-6 border-2 border-background">
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-medium">{t.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                          </Avatar>
                        ))}
                        {project.team.length > 4 && <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] text-muted-foreground">+{project.team.length - 4}</div>}
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ LIST VIEW ═══ */}
      {viewMode === "list" && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/30">
            <Checkbox checked={selectedProjects.length === filtered.length && filtered.length > 0} onCheckedChange={toggleSelectAll} />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex-1">Project</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold w-20 hidden sm:block">Status</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold w-24 hidden md:block">Date</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold w-28 hidden lg:block text-right">Payment</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold w-20 hidden lg:block text-center">Team</span>
            <span className="w-8" />
          </div>
          {filtered.map((project) => {
            const cfg = statusConfig[project.status];
            const payPct = project.totalAmount > 0 ? Math.round((project.paidAmount / project.totalAmount) * 100) : 0;
            return (
              <div key={project.id} onClick={() => navigate(`/projects/${project.id}`)}
                className="flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors group">
                <div onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selectedProjects.includes(project.id)} onCheckedChange={() => toggleSelect(project.id)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">{project.clientName} & {project.partnerName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{project.venue}, {project.city}</p>
                </div>
                <div className="w-20 hidden sm:block"><Badge variant="outline" className={cn("text-[10px]", cfg.class)}>{cfg.label}</Badge></div>
                <div className="w-24 hidden md:block text-xs text-muted-foreground">{new Date(project.weddingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                <div className="w-28 hidden lg:block text-right">
                  <span className="text-xs font-medium text-foreground">₹{(project.paidAmount / 1000).toFixed(0)}K</span>
                  <span className="text-[10px] text-muted-foreground"> / ₹{(project.totalAmount / 1000).toFixed(0)}K</span>
                  <Progress value={payPct} className="h-1 mt-1" />
                </div>
                <div className="w-20 hidden lg:flex items-center justify-center">
                  <div className="flex -space-x-1">
                    {project.team.slice(0, 3).map((t) => (
                      <Avatar key={t.id} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-[8px] bg-primary/10 text-primary">{t.name.split(" ").map(n => n[0]).join("")}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <FolderKanban className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No projects found</p>
        </div>
      )}

      {/* ═══ ADD PROJECT SHEET ═══ */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> New Wedding Project</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Client Name *</Label><Input placeholder="Bride/Groom" value={form.clientName} onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Partner Name *</Label><Input placeholder="Partner" value={form.partnerName} onChange={(e) => setForm((p) => ({ ...p, partnerName: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Phone</Label><Input placeholder="+91 98765 43210" value={form.clientPhone} onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Wedding Date *</Label><Input type="date" value={form.weddingDate} onChange={(e) => setForm((p) => ({ ...p, weddingDate: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">City</Label><Input placeholder="City" value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Venue</Label><Input placeholder="Venue name" value={form.venue} onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as WeddingProject["status"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(statusConfig).map(([k, v]) => (<SelectItem key={k} value={k}>{v.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs font-medium">Package</Label><Select value={form.package} onValueChange={(v) => setForm((p) => ({ ...p, package: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{packages.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}</SelectContent></Select></div>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Total Amount (₹)</Label><Input type="number" placeholder="350000" value={form.totalAmount} onChange={(e) => setForm((p) => ({ ...p, totalAmount: e.target.value }))} /></div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Assign Team</Label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {sampleTeamMembers.map((m) => {
                  const selected = form.selectedTeam.includes(m.id);
                  return (
                    <div key={m.id} onClick={() => toggleTeam(m.id)} className={cn("flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all", selected ? "border-primary/30 bg-primary/5" : "border-border/50 hover:bg-muted/50")}>
                      <Checkbox checked={selected} className="pointer-events-none" />
                      <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">{m.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0"><p className="text-xs font-medium text-foreground">{m.name}</p><p className="text-[10px] text-muted-foreground capitalize">{m.role.replace("-", " ")} · {m.type}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <Button className="w-full" onClick={handleAdd}><Plus className="h-4 w-4 mr-1" /> Create Project</Button>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

export default ProjectsPage;
