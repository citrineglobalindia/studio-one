import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  sampleLeads, stageConfig, sourceConfig, eventTypeLabels, type Lead, type LeadStage, type LeadSource, type EventType,
} from "@/data/lead-types";
import {
  Plus, Search, RefreshCw, Upload, Download, Filter,
  Eye, PhoneCall, Pencil, Trash2, Bell, UserPlus,
  Sparkles, Users, TrendingUp, Target, ChevronDown,
  LayoutGrid, BarChart3, Clock, FileText, ExternalLink,
  X, SlidersHorizontal, CalendarDays, IndianRupee,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const stages: LeadStage[] = ["new", "contacted", "proposal-sent", "converted", "lost"];
const teamMembers = ["Raj Patel", "Vikram Singh", "Neha Sharma", "Amit Verma"];
const sources: LeadSource[] = ["instagram", "whatsapp", "call", "website", "referral", "facebook"];
const eventTypes: EventType[] = ["wedding", "pre-wedding", "engagement", "reception", "corporate", "birthday"];

const LeadsPage = () => {
  const [leads, setLeads] = useState<Lead[]>(sampleLeads);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"all" | "my">("all");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("table");
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Add Lead Sheet
  const [addLeadOpen, setAddLeadOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: "", phone: "", email: "", company: "", city: "",
    source: "instagram" as LeadSource,
    eventType: "wedding" as EventType,
    eventDate: "", budget: "", notes: "", assignedTo: "",
  });

  const activeFilterCount = [
    statusFilter !== "all" ? 1 : 0,
    userFilter !== "all" ? 1 : 0,
    dateFrom ? 1 : 0,
    dateTo ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearFilters = () => {
    setStatusFilter("all");
    setUserFilter("all");
    setDateFrom("");
    setDateTo("");
  };

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      const matchSearch =
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.phone.includes(search) ||
        (l.company?.toLowerCase().includes(search.toLowerCase()) ?? false);
      const matchStatus = statusFilter === "all" || l.stage === statusFilter;
      const matchUser = userFilter === "all" || l.assignedTo === userFilter;
      const matchView = viewMode === "all" || l.assignedTo !== undefined;
      return matchSearch && matchStatus && matchUser && matchView;
    });
  }, [leads, search, statusFilter, userFilter, viewMode]);

  const newLeads = leads.filter((l) => l.stage === "new").length;
  const followUps = leads.filter((l) => l.stage === "contacted").length;
  const converted = leads.filter((l) => l.stage === "converted").length;
  const totalLeads = leads.length;

  const toggleSelectAll = () => {
    if (selectedLeads.length === filtered.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filtered.map((l) => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLeads((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAssign = (leadId: string, assignee: string) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, assignedTo: assignee } : l))
    );
    toast.success(`Lead assigned to ${assignee}`);
  };

  const handleStatusChange = (leadId: string, stage: LeadStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, stage } : l))
    );
    toast.success("Status updated");
  };

  const handleDelete = (leadId: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    toast.success("Lead deleted");
  };

  return (
    <div className="max-w-full mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Lead Management</h1>
            <p className="text-sm text-muted-foreground">Track and convert your business opportunities</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card border border-border">
            <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Auto Refresh</span>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} className="scale-90" />
            <span className="text-[10px] text-muted-foreground">(5 min)</span>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-3.5 w-3.5" /> Import/Export
          </Button>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> New Lead
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox icon={<Sparkles className="h-5 w-5 text-blue-500" />} iconBg="bg-blue-500/10" value={newLeads} label="New Leads" />
        <StatBox icon={<Users className="h-5 w-5 text-amber-500" />} iconBg="bg-amber-500/10" value={followUps} label="Follow-ups" />
        <StatBox icon={<TrendingUp className="h-5 w-5 text-emerald-500" />} iconBg="bg-emerald-500/10" value={converted} label="Converted" />
        <StatBox icon={<Target className="h-5 w-5 text-primary" />} iconBg="bg-primary/10" value={totalLeads} label="Total Leads" />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
          <TabsTrigger value="table" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2">
            <LayoutGrid className="h-4 w-4" /> Leads Table
            <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1.5">{totalLeads}</Badge>
          </TabsTrigger>
          <TabsTrigger value="imported" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2">
            <Upload className="h-4 w-4" /> Imported Leads
          </TabsTrigger>
          <TabsTrigger value="assignment" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2">
            <Users className="h-4 w-4" /> Assignment Report
          </TabsTrigger>
          <TabsTrigger value="analytics" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2">
            <BarChart3 className="h-4 w-4" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2">
            <Clock className="h-4 w-4" /> Import History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="table" className="mt-4 space-y-4">
          {/* Search + Filter Bar */}
          <div className="flex items-center gap-2">
            {/* View Toggle - Compact pills */}
            <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
              <button
                onClick={() => setViewMode("all")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                  viewMode === "all" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
                )}
              >
                <Users className="h-3.5 w-3.5" /> All
              </button>
              <button
                onClick={() => setViewMode("my")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors",
                  viewMode === "my" ? "bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted"
                )}
              >
                <UserPlus className="h-3.5 w-3.5" /> Mine
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Filter Button - Mobile: Sheet, Desktop: inline */}
            {/* Desktop Filters */}
            <div className="hidden sm:flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {stages.map((s) => (
                    <SelectItem key={s} value={s}>{stageConfig[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[85vh]">
                <SheetHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="flex items-center gap-2 text-base">
                      <SlidersHorizontal className="h-4 w-4 text-primary" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge variant="default" className="text-[10px] h-5 px-1.5">{activeFilterCount} active</Badge>
                      )}
                    </SheetTitle>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-destructive hover:text-destructive gap-1">
                        <X className="h-3 w-3" /> Clear all
                      </Button>
                    )}
                  </div>
                </SheetHeader>

                <div className="space-y-5">
                  {/* Status Filter - Chips */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">Status</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setStatusFilter("all")}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          statusFilter === "all"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-primary/40"
                        )}
                      >
                        All
                      </button>
                      {stages.map((s) => {
                        const cfg = stageConfig[s];
                        return (
                          <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                              statusFilter === s
                                ? "bg-primary text-primary-foreground border-primary"
                                : `${cfg.bgColor} ${cfg.color} ${cfg.borderColor} hover:opacity-80`
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", statusFilter === s ? "bg-primary-foreground" : cfg.bgColor)} />
                            {cfg.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assigned To */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">Assigned To</label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setUserFilter("all")}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          userFilter === "all"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card text-foreground border-border hover:border-primary/40"
                        )}
                      >
                        Everyone
                      </button>
                      {teamMembers.map((m) => (
                        <button
                          key={m}
                          onClick={() => setUserFilter(m)}
                          className={cn(
                            "px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1.5",
                            userFilter === m
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:border-primary/40"
                          )}
                        >
                          <span className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                            {m.split(" ").map(n => n[0]).join("")}
                          </span>
                          {m.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block flex items-center gap-1.5">
                      <CalendarDays className="h-3 w-3" /> Date Range
                    </label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="h-10 flex-1 text-sm rounded-xl"
                      />
                      <span className="text-xs text-muted-foreground font-medium">to</span>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="h-10 flex-1 text-sm rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Apply Button */}
                  <Button className="w-full h-11 rounded-xl font-semibold gap-2" onClick={() => setFilterOpen(false)}>
                    <Filter className="h-4 w-4" />
                    Show {filtered.length} Results
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Active Filter Chips (mobile) */}
          {activeFilterCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 flex-wrap sm:hidden"
            >
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Active:</span>
              {statusFilter !== "all" && (
                <button
                  onClick={() => setStatusFilter("all")}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20"
                >
                  {stageConfig[statusFilter as LeadStage]?.label}
                  <X className="h-3 w-3" />
                </button>
              )}
              {userFilter !== "all" && (
                <button
                  onClick={() => setUserFilter("all")}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium border border-primary/20"
                >
                  {userFilter.split(" ")[0]}
                  <X className="h-3 w-3" />
                </button>
              )}
            </motion.div>
          )}

          {/* Table */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedLeads.length === filtered.length && filtered.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="text-xs font-semibold">Serial No.</TableHead>
                    <TableHead className="text-xs font-semibold">Company</TableHead>
                    <TableHead className="text-xs font-semibold">Contact</TableHead>
                    <TableHead className="text-xs font-semibold">Email</TableHead>
                    <TableHead className="text-xs font-semibold">City</TableHead>
                    <TableHead className="text-xs font-semibold">Sectors</TableHead>
                    <TableHead className="text-xs font-semibold">Assigned To</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Deal Value</TableHead>
                    <TableHead className="text-xs font-semibold">Follow-up</TableHead>
                    <TableHead className="text-xs font-semibold">Created</TableHead>
                    <TableHead className="text-xs font-semibold text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => {
                    const stageCfg = stageConfig[lead.stage];
                    return (
                      <TableRow key={lead.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <Checkbox
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={() => toggleSelect(lead.id)}
                          />
                        </TableCell>
                        <TableCell className="text-sm font-medium text-foreground">{lead.serialNo}</TableCell>
                        <TableCell>
                          <div>
                            <span className="text-sm font-medium text-foreground">{lead.company || lead.name}</span>
                            {lead.website && (
                              <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline mt-0.5">
                                <ExternalLink className="h-3 w-3" /> Website
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="text-sm text-foreground">{lead.phone}</span>
                            {lead.company && (
                              <p className="text-xs text-muted-foreground truncate max-w-[140px]">{lead.notes?.slice(0, 30)}...</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{lead.email || "–"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{lead.city || "–"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{lead.sectors || "–"}</TableCell>
                        <TableCell>
                          {lead.assignedTo ? (
                            <span className="text-sm text-foreground">{lead.assignedTo}</span>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs">
                                  <UserPlus className="h-3.5 w-3.5" /> Assign
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                {teamMembers.map((m) => (
                                  <DropdownMenuItem key={m} onClick={() => handleAssign(lead.id, m)}>
                                    {m}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${stageCfg.bgColor} ${stageCfg.color} ${stageCfg.borderColor} hover:opacity-80 transition-opacity`}>
                                <Sparkles className="h-3 w-3" />
                                {stageCfg.label}
                                <ChevronDown className="h-3 w-3" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {stages.map((s) => (
                                <DropdownMenuItem key={s} onClick={() => handleStatusChange(lead.id, s)}>
                                  <span className={`h-2 w-2 rounded-full mr-2 ${stageConfig[s].bgColor}`} />
                                  {stageConfig[s].label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.dealValue ? `₹${(lead.dealValue / 1000).toFixed(0)}K` : "–"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{lead.followUp || "–"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 justify-end">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <PhoneCall className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                              <Bell className="h-4 w-4" />
                            </Button>
                            <span className="text-xs text-muted-foreground mr-1">Reminder</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(lead.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={13} className="text-center py-12 text-muted-foreground">
                        No leads found matching your filters
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="imported" className="mt-4">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Upload className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-lg font-medium text-foreground">No imported leads yet</p>
            <p className="text-sm text-muted-foreground mt-1">Import leads from CSV or Excel files</p>
            <Button className="mt-4 gap-2"><Upload className="h-4 w-4" /> Import Leads</Button>
          </div>
        </TabsContent>

        <TabsContent value="assignment" className="mt-4">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-lg font-medium text-foreground">Assignment Report</p>
            <p className="text-sm text-muted-foreground mt-1">View how leads are distributed across your team</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-lg font-medium text-foreground">Lead Analytics</p>
            <p className="text-sm text-muted-foreground mt-1">Conversion rates, source performance, and trends</p>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Clock className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-lg font-medium text-foreground">Import History</p>
            <p className="text-sm text-muted-foreground mt-1">Track all your lead imports and their status</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

function StatBox({ icon, iconBg, value, label }: { icon: React.ReactNode; iconBg: string; value: number; label: string }) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border">
      <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default LeadsPage;
