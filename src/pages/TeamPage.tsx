import { useState, useMemo, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { sampleTeamMembers, type TeamMember } from "@/data/wedding-types";
import {
  Camera, Video, Edit3, Users, Phone, Plus, UserPlus, Mail, MapPin, CreditCard,
  IndianRupee, Heart, Calendar, ChevronDown, ChevronUp, Search, Filter,
  LayoutGrid, List, Star, TrendingUp, Clock, CheckCircle2, SlidersHorizontal, X,
  BarChart3, Zap, Award, Eye,
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, useMotionValue, useTransform, animate, useInView } from "framer-motion";

const roleIcons: Record<string, typeof Camera> = {
  photographer: Camera, videographer: Video, editor: Edit3, "drone-operator": Camera, assistant: Users,
};
const roleColors: Record<string, string> = {
  photographer: "bg-blue-500/20 text-blue-400", videographer: "bg-purple-500/20 text-purple-400",
  editor: "bg-emerald-500/20 text-emerald-400", "drone-operator": "bg-orange-500/20 text-orange-400",
  assistant: "bg-muted text-muted-foreground",
};
const allRoles: { value: TeamMember["role"]; label: string }[] = [
  { value: "photographer", label: "Photographer" }, { value: "videographer", label: "Videographer" },
  { value: "editor", label: "Editor" }, { value: "drone-operator", label: "Drone Operator" },
  { value: "assistant", label: "Assistant" },
];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } } as const;
const cardVariants = { hidden: { opacity: 0, y: 20, scale: 0.97 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 220, damping: 22 } } };

const AnimatedNumber = ({ value, delay = 0 }: { value: number; delay?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const isInView = useInView(ref, { once: true });
  useEffect(() => { if (isInView) { const c = animate(motionVal, value, { duration: 1.2, delay, ease: [0.25, 0.1, 0.25, 1] }); return c.stop; } }, [isInView, motionVal, value, delay]);
  useEffect(() => { const unsub = rounded.on("change", (v) => { if (ref.current) ref.current.textContent = `${v}`; }); return unsub; }, [rounded]);
  return <span ref={ref}>0</span>;
};

const initialForm = {
  name: "", phone: "", email: "", gender: "" as string, dateOfBirth: "",
  role: "photographer" as TeamMember["role"], type: "in-office" as TeamMember["type"],
  address: "", city: "", state: "", aadhaarNumber: "", panNumber: "",
  bankAccountName: "", bankAccountNumber: "", bankIfsc: "",
  experience: "", specialization: "", dailyRate: "",
  emergencyContactName: "", emergencyContactPhone: "", joiningDate: "", notes: "",
};

function FormSection({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: typeof Camera; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-border/50 rounded-xl overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="w-full flex items-center gap-2 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors">
        <Icon className="h-4 w-4 text-primary" />
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider flex-1 text-left">{title}</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>
      {open && <div className="p-4 space-y-4">{children}</div>}
    </div>
  );
}

const TeamPage = () => {
  const [members, setMembers] = useState<TeamMember[]>(sampleTeamMembers);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState("all");
  const [detailMember, setDetailMember] = useState<TeamMember | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchSearch = `${m.name} ${m.phone || ""} ${m.email || ""} ${m.city || ""}`.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === "all" || m.role === filterRole;
      const matchType = filterType === "all" || m.type === filterType;
      const matchTab = activeTab === "all" || (activeTab === "in-office" && m.type === "in-office") || (activeTab === "vendor" && m.type === "vendor");
      return matchSearch && matchRole && matchType && matchTab;
    });
  }, [members, search, filterRole, filterType, activeTab]);

  const inOfficeCount = members.filter((m) => m.type === "in-office").length;
  const vendorCount = members.filter((m) => m.type === "vendor").length;
  const totalMembers = members.length;

  // Simulated workload data
  const getWorkload = (id: string) => {
    const hash = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return { assigned: hash % 5 + 1, completed: hash % 3 + 1, rating: (3.5 + (hash % 15) / 10).toFixed(1), availability: hash % 3 === 0 ? "busy" : hash % 3 === 1 ? "available" : "partial" };
  };

  const updateForm = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const handleAdd = () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.phone.trim()) { toast.error("Phone number is required"); return; }
    const member: TeamMember = {
      id: `t-${Date.now()}`, name: form.name.trim(), phone: form.phone || undefined,
      email: form.email || undefined, gender: form.gender as TeamMember["gender"] || undefined,
      dateOfBirth: form.dateOfBirth || undefined, role: form.role, type: form.type,
      address: form.address || undefined, city: form.city || undefined, state: form.state || undefined,
      aadhaarNumber: form.aadhaarNumber || undefined, panNumber: form.panNumber || undefined,
      bankAccountName: form.bankAccountName || undefined, bankAccountNumber: form.bankAccountNumber || undefined,
      bankIfsc: form.bankIfsc || undefined, experience: form.experience || undefined,
      specialization: form.specialization || undefined, dailyRate: form.dailyRate ? Number(form.dailyRate) : undefined,
      emergencyContactName: form.emergencyContactName || undefined, emergencyContactPhone: form.emergencyContactPhone || undefined,
      joiningDate: form.joiningDate || undefined, notes: form.notes || undefined,
    };
    setMembers((prev) => [...prev, member]);
    setAddOpen(false); setForm(initialForm);
    toast.success(`${member.name} added as ${form.type === "vendor" ? "Vendor" : "In-Office"} ${form.role}`);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <motion.div variants={cardVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center ring-1 ring-primary/20">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Team Management</h1>
            <p className="text-xs text-muted-foreground">{totalMembers} members · {inOfficeCount} in-office · {vendorCount} vendors</p>
          </div>
        </div>
        <Button size="sm" className="gap-2 rounded-xl" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add Member</Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {allRoles.map(({ value: role, label }, i) => {
          const Icon = roleIcons[role] || Users;
          const count = members.filter((m) => m.role === role).length;
          const colors = roleColors[role] || "bg-muted text-muted-foreground";
          return (
            <motion.div key={role} variants={cardVariants}
              className="bg-gradient-to-b from-card to-muted/20 border border-border rounded-2xl p-4 ring-1 ring-border/50 cursor-pointer hover:border-primary/30 transition-all"
              onClick={() => setFilterRole(filterRole === role ? "all" : role)}>
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center ring-1 ring-border mb-2.5", colors)}>
                <Icon className="h-4 w-4" />
              </div>
              <p className="text-xl font-display font-extrabold text-foreground leading-tight"><AnimatedNumber value={count} delay={0.2 + i * 0.1} /></p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-semibold mt-0.5">{label}s</p>
            </motion.div>
          );
        })}
      </div>

      {/* Search + Filters */}
      <motion.div variants={cardVariants} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search team members..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9 text-sm" />
        </div>
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0 hidden sm:flex">
          <button onClick={() => setViewMode("grid")} className={cn("px-2.5 py-2 text-xs transition-colors", viewMode === "grid" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted")}><LayoutGrid className="h-3.5 w-3.5" /></button>
          <button onClick={() => setViewMode("list")} className={cn("px-2.5 py-2 text-xs transition-colors", viewMode === "list" ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-muted")}><List className="h-3.5 w-3.5" /></button>
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-36 h-9 hidden sm:flex"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {allRoles.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="icon" className="sm:hidden h-9 w-9 shrink-0" onClick={() => setFilterOpen(true)}>
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
          {[
            { value: "all", label: "All Team", count: totalMembers },
            { value: "in-office", label: "In-Office", count: inOfficeCount },
            { value: "vendor", label: "Vendors", count: vendorCount },
          ].map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-2">
              {tab.label}
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{tab.count}</Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {/* ═══ GRID VIEW ═══ */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((m) => {
                const Icon = roleIcons[m.role] || Users;
                const workload = getWorkload(m.id);
                const availColors = { available: "bg-emerald-500", busy: "bg-red-500", partial: "bg-amber-500" };
                return (
                  <motion.div key={m.id} variants={cardVariants} whileTap={{ scale: 0.98 }}
                    onClick={() => setDetailMember(m)}
                    className={cn("rounded-2xl bg-card border overflow-hidden hover:border-primary/30 transition-all cursor-pointer group", m.type === "vendor" ? "border-primary/20" : "border-border")}>
                    <div className={cn("h-1", m.type === "vendor" ? "bg-gradient-to-r from-primary via-primary/70 to-primary/40" : "bg-gradient-to-r from-blue-500/50 to-blue-500/20")} />
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-bold text-primary">{m.name.split(" ").map(n => n[0]).join("")}</span>
                          </div>
                          <div className={cn("absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background", availColors[workload.availability as keyof typeof availColors])} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">{m.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={cn("inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 font-medium capitalize", roleColors[m.role])}><Icon className="h-2.5 w-2.5" />{m.role.replace("-", " ")}</span>
                            {m.type === "vendor" && <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-primary/10 text-primary border-primary/30">Vendor</Badge>}
                          </div>
                        </div>
                      </div>
                      {/* Workload Stats */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
                        <div className="text-center">
                          <p className="text-sm font-bold text-foreground">{workload.assigned}</p>
                          <p className="text-[9px] text-muted-foreground">Assigned</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-emerald-500">{workload.completed}</p>
                          <p className="text-[9px] text-muted-foreground">Done</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-0.5">
                            <Star className="h-3 w-3 text-primary fill-primary" />
                            <p className="text-sm font-bold text-foreground">{workload.rating}</p>
                          </div>
                          <p className="text-[9px] text-muted-foreground">Rating</p>
                        </div>
                      </div>
                      {m.phone && <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1"><Phone className="h-3 w-3" />{m.phone}</p>}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* ═══ LIST VIEW ═══ */
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/30">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold flex-1">Member</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold w-24 hidden sm:block">Role</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold w-20 hidden md:block">Status</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold w-20 hidden lg:block text-center">Assigned</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold w-16 hidden lg:block text-center">Rating</span>
              </div>
              {filtered.map((m) => {
                const Icon = roleIcons[m.role] || Users;
                const workload = getWorkload(m.id);
                const availColors = { available: "bg-emerald-500", busy: "bg-red-500", partial: "bg-amber-500" };
                const availLabels = { available: "Available", busy: "Busy", partial: "Partial" };
                return (
                  <div key={m.id} onClick={() => setDetailMember(m)}
                    className="flex items-center gap-3 px-4 py-3 border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors">
                    <div className="relative">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><span className="text-xs font-bold text-primary">{m.name.split(" ").map(n => n[0]).join("")}</span></div>
                      <div className={cn("absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background", availColors[workload.availability as keyof typeof availColors])} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">{m.phone || m.email || ""}</p>
                    </div>
                    <div className="w-24 hidden sm:block">
                      <span className={cn("inline-flex items-center gap-1 text-[10px] rounded-full px-2 py-0.5 font-medium capitalize", roleColors[m.role])}><Icon className="h-2.5 w-2.5" />{m.role.replace("-", " ")}</span>
                    </div>
                    <div className="w-20 hidden md:block">
                      <Badge variant="outline" className={cn("text-[10px]", workload.availability === "available" ? "text-emerald-500 border-emerald-500/20" : workload.availability === "busy" ? "text-red-500 border-red-500/20" : "text-amber-500 border-amber-500/20")}>
                        {availLabels[workload.availability as keyof typeof availLabels]}
                      </Badge>
                    </div>
                    <div className="w-20 hidden lg:block text-center text-sm font-medium text-foreground">{workload.assigned}</div>
                    <div className="w-16 hidden lg:flex items-center justify-center gap-0.5">
                      <Star className="h-3 w-3 text-primary fill-primary" /><span className="text-xs font-medium">{workload.rating}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {filtered.length === 0 && (
        <div className="py-16 text-center"><Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-3" /><p className="text-sm text-muted-foreground">No team members found</p></div>
      )}

      {/* Member Detail Sheet */}
      <Sheet open={!!detailMember} onOpenChange={(open) => !open && setDetailMember(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          {detailMember && (() => {
            const Icon = roleIcons[detailMember.role] || Users;
            const workload = getWorkload(detailMember.id);
            return (
              <>
                <SheetHeader><SheetTitle className="text-left">Member Profile</SheetTitle></SheetHeader>
                <div className="mt-6 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center"><span className="text-xl font-bold text-primary">{detailMember.name.split(" ").map(n => n[0]).join("")}</span></div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{detailMember.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={cn("inline-flex items-center gap-1 text-xs rounded-full px-2.5 py-0.5 font-medium capitalize", roleColors[detailMember.role])}><Icon className="h-3 w-3" />{detailMember.role.replace("-", " ")}</span>
                        {detailMember.type === "vendor" && <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">Vendor</Badge>}
                      </div>
                    </div>
                  </div>
                  {/* Performance Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-muted/30 border border-border p-3 text-center"><Zap className="h-4 w-4 text-amber-500 mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{workload.assigned}</p><p className="text-[10px] text-muted-foreground">Active Jobs</p></div>
                    <div className="rounded-xl bg-muted/30 border border-border p-3 text-center"><CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{workload.completed}</p><p className="text-[10px] text-muted-foreground">Completed</p></div>
                    <div className="rounded-xl bg-muted/30 border border-border p-3 text-center"><Star className="h-4 w-4 text-primary mx-auto mb-1" /><p className="text-lg font-bold text-foreground">{workload.rating}</p><p className="text-[10px] text-muted-foreground">Rating</p></div>
                  </div>
                  {/* Contact Info */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</p>
                    {detailMember.phone && <div className="flex items-center gap-2 text-sm text-foreground"><Phone className="h-4 w-4 text-muted-foreground" />{detailMember.phone}</div>}
                    {detailMember.email && <div className="flex items-center gap-2 text-sm text-foreground"><Mail className="h-4 w-4 text-muted-foreground" />{detailMember.email}</div>}
                    {detailMember.city && <div className="flex items-center gap-2 text-sm text-foreground"><MapPin className="h-4 w-4 text-muted-foreground" />{detailMember.city}{detailMember.state ? `, ${detailMember.state}` : ""}</div>}
                  </div>
                  {/* Professional */}
                  {(detailMember.experience || detailMember.specialization || detailMember.dailyRate) && (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Professional</p>
                      {detailMember.experience && <div className="flex items-center gap-2 text-sm"><Award className="h-4 w-4 text-muted-foreground" />{detailMember.experience} experience</div>}
                      {detailMember.specialization && <div className="flex items-center gap-2 text-sm"><Zap className="h-4 w-4 text-muted-foreground" />{detailMember.specialization}</div>}
                      {detailMember.dailyRate && <div className="flex items-center gap-2 text-sm"><IndianRupee className="h-4 w-4 text-muted-foreground" />₹{detailMember.dailyRate}/day</div>}
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ═══ ADD MEMBER SHEET ═══ */}
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <SheetTitle className="flex items-center gap-2"><UserPlus className="h-4 w-4 text-primary" /> Add Team Member</SheetTitle>
          </SheetHeader>
          <ScrollArea className="h-[calc(100vh-140px)]">
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-2"><Label className="text-xs font-medium">Member Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {([{ value: "in-office" as const, label: "In-Office", desc: "Full-time team" }, { value: "vendor" as const, label: "Vendor", desc: "External freelancer" }]).map((opt) => (
                    <button key={opt.value} onClick={() => updateForm("type", opt.value)} className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border transition-all", form.type === opt.value ? "border-primary/40 bg-primary/10 shadow-sm" : "border-border bg-card hover:border-primary/20")}>
                      <span className={cn("text-sm font-semibold", form.type === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2"><Label className="text-xs font-medium">Role *</Label>
                <div className="grid grid-cols-2 gap-2">
                  {allRoles.map(({ value, label }) => { const Icon = roleIcons[value] || Users; return (
                    <button key={value} onClick={() => updateForm("role", value)} className={cn("flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all", form.role === value ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:border-primary/20")}>
                      <div className={cn("h-7 w-7 rounded-md flex items-center justify-center", form.role === value ? "bg-primary/20" : "bg-muted")}><Icon className="h-3.5 w-3.5" /></div>{label}
                    </button>
                  ); })}
                </div>
              </div>
              <FormSection title="Personal Information" icon={UserPlus} defaultOpen={true}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Full Name *</Label><Input placeholder="e.g. Arjun Mehta" value={form.name} onChange={(e) => updateForm("name", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Phone *</Label><Input placeholder="+91 98765 43210" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Email</Label><Input type="email" placeholder="arjun@example.com" value={form.email} onChange={(e) => updateForm("email", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Gender</Label><Select value={form.gender} onValueChange={(v) => updateForm("gender", v)}><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger><SelectContent><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
                  <div className="space-y-1.5"><Label className="text-xs">Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => updateForm("dateOfBirth", e.target.value)} /></div>
                </div>
              </FormSection>
              <FormSection title="Address Details" icon={MapPin} defaultOpen={false}>
                <div className="space-y-3"><div className="space-y-1.5"><Label className="text-xs">Full Address</Label><Textarea placeholder="Street address, locality..." className="min-h-[60px]" value={form.address} onChange={(e) => updateForm("address", e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-3"><div className="space-y-1.5"><Label className="text-xs">City</Label><Input placeholder="Mumbai" value={form.city} onChange={(e) => updateForm("city", e.target.value)} /></div><div className="space-y-1.5"><Label className="text-xs">State</Label><Input placeholder="Maharashtra" value={form.state} onChange={(e) => updateForm("state", e.target.value)} /></div></div>
                </div>
              </FormSection>
              <FormSection title="Identity & Bank Details" icon={CreditCard} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Aadhaar Number</Label><Input placeholder="XXXX XXXX XXXX" maxLength={14} value={form.aadhaarNumber} onChange={(e) => updateForm("aadhaarNumber", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">PAN Number</Label><Input placeholder="ABCDE1234F" maxLength={10} value={form.panNumber} onChange={(e) => updateForm("panNumber", e.target.value)} /></div>
                  <div className="space-y-1.5 sm:col-span-2"><Label className="text-xs">Bank Account Holder Name</Label><Input placeholder="Account holder name" value={form.bankAccountName} onChange={(e) => updateForm("bankAccountName", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Account Number</Label><Input placeholder="Account number" value={form.bankAccountNumber} onChange={(e) => updateForm("bankAccountNumber", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">IFSC Code</Label><Input placeholder="SBIN0001234" value={form.bankIfsc} onChange={(e) => updateForm("bankIfsc", e.target.value)} /></div>
                </div>
              </FormSection>
              <FormSection title="Professional Details" icon={IndianRupee} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Experience</Label><Input placeholder="e.g. 5 years" value={form.experience} onChange={(e) => updateForm("experience", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Specialization</Label><Input placeholder="e.g. Candid, Traditional" value={form.specialization} onChange={(e) => updateForm("specialization", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Daily Rate (₹)</Label><Input type="number" placeholder="5000" value={form.dailyRate} onChange={(e) => updateForm("dailyRate", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Joining Date</Label><Input type="date" value={form.joiningDate} onChange={(e) => updateForm("joiningDate", e.target.value)} /></div>
                </div>
              </FormSection>
              <FormSection title="Emergency Contact" icon={Heart} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-xs">Contact Name</Label><Input placeholder="Emergency contact name" value={form.emergencyContactName} onChange={(e) => updateForm("emergencyContactName", e.target.value)} /></div>
                  <div className="space-y-1.5"><Label className="text-xs">Contact Phone</Label><Input placeholder="+91 98765 43210" value={form.emergencyContactPhone} onChange={(e) => updateForm("emergencyContactPhone", e.target.value)} /></div>
                </div>
              </FormSection>
              <div className="space-y-1.5"><Label className="text-xs font-medium">Additional Notes</Label><Textarea placeholder="Any additional notes..." className="min-h-[60px]" value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} /></div>
              <Button className="w-full" onClick={handleAdd}><Plus className="h-4 w-4 mr-1" /> Add Member</Button>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Mobile Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8 max-h-[70vh]">
          <SheetHeader className="pb-4"><div className="text-base font-semibold flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-primary" /> Filters</div></SheetHeader>
          <div className="space-y-5">
            <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">Role</label>
              <div className="flex flex-wrap gap-2">
                {[{ value: "all", label: "All" }, ...allRoles].map((opt) => (
                  <button key={opt.value} onClick={() => setFilterRole(opt.value)} className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-all", filterRole === opt.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border")}>{opt.label}</button>
                ))}
              </div>
            </div>
            <div><label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2.5 block">View</label>
              <div className="flex gap-2">
                {([{ value: "grid" as const, label: "Grid" }, { value: "list" as const, label: "List" }]).map((v) => (
                  <button key={v.value} onClick={() => setViewMode(v.value)} className={cn("px-3.5 py-2 rounded-full text-xs font-medium border transition-all", viewMode === v.value ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border")}>{v.label}</button>
                ))}
              </div>
            </div>
            <Button className="w-full h-11 rounded-xl" onClick={() => setFilterOpen(false)}><Filter className="h-4 w-4 mr-2" /> Show {filtered.length} Members</Button>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
};

export default TeamPage;
