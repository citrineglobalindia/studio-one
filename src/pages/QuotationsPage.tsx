import { useState, useMemo } from "react";
import { useQuotations } from "@/hooks/useQuotations";
import { useOrg } from "@/contexts/OrgContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Plus, Search, Send, Check, X, Clock, IndianRupee, Copy, FileText,
  ChevronRight, Eye, Star, Crown, Sparkles, Camera, Video, Plane,
  Edit, Trash2, CalendarDays, Users, Package, Filter,
  TrendingUp, ArrowUpRight, CheckCircle2, AlertCircle, Zap,
  ImageIcon, Film, Aperture, Mic2, Music, Heart, Gift,
} from "lucide-react";

// ─── Types ───
interface PackageAddon {
  id: string;
  name: string;
  price: number;
  icon: React.ElementType;
  description: string;
}

interface StudioPackage {
  id: string;
  name: string;
  tagline: string;
  price: number;
  tier: "basic" | "popular" | "premium" | "luxury";
  includes: string[];
  addons: string[];
  photographers: number;
  videographers: number;
  deliveryDays: number;
  editedPhotos: number;
  popular?: boolean;
}

interface QuotationItem {
  type: "package" | "addon" | "custom";
  name: string;
  amount: number;
}

interface Quotation {
  id: string;
  quotationNumber: string;
  client: string;
  clientPhone?: string;
  items: QuotationItem[];
  totalAmount: number;
  discount: number;
  finalAmount: number;
  status: "draft" | "sent" | "viewed" | "approved" | "rejected" | "expired";
  sentDate?: string;
  viewedDate?: string;
  validUntil: string;
  createdAt: string;
  notes?: string;
  customTerms?: string;
}

// ─── Data ───
const addons: PackageAddon[] = [
  { id: "a1", name: "Drone Coverage", price: 25000, icon: Plane, description: "Aerial shots & cinematic flyovers" },
  { id: "a2", name: "Pre-Wedding Shoot", price: 35000, icon: Heart, description: "1-day shoot at chosen location" },
  { id: "a3", name: "Same-Day Edit", price: 20000, icon: Zap, description: "3-min highlight reel delivered same day" },
  { id: "a4", name: "Premium Album", price: 18000, icon: ImageIcon, description: "40-page flush mount album" },
  { id: "a5", name: "LED Wall Projection", price: 15000, icon: Film, description: "Live photo/video display at venue" },
  { id: "a6", name: "Candid Specialist", price: 30000, icon: Aperture, description: "Dedicated candid photographer" },
  { id: "a7", name: "DJ & Music", price: 40000, icon: Music, description: "Professional DJ for all events" },
  { id: "a8", name: "Extra Day Coverage", price: 20000, icon: CalendarDays, description: "Additional event day coverage" },
];

const studioPackages: StudioPackage[] = [
  {
    id: "pkg1", name: "Classic", tagline: "Essential coverage for intimate weddings",
    price: 150000, tier: "basic", photographers: 1, videographers: 1, deliveryDays: 45, editedPhotos: 200,
    includes: ["1 Photographer", "1 Videographer", "Photo Editing", "Highlight Reel (3 min)", "200 Edited Photos", "Online Gallery"],
    addons: ["a1", "a4"],
  },
  {
    id: "pkg2", name: "Premium", tagline: "Complete coverage with cinematic storytelling",
    price: 250000, tier: "popular", popular: true, photographers: 2, videographers: 1, deliveryDays: 30, editedPhotos: 400,
    includes: ["2 Photographers", "1 Videographer", "Drone Coverage", "Photo + Video Editing", "400 Edited Photos", "Cinematic Film (15 min)", "Online Gallery", "Instagram Reels (3)"],
    addons: ["a2", "a3", "a4", "a6"],
  },
  {
    id: "pkg3", name: "Royal", tagline: "Premium luxury with full event coverage",
    price: 350000, tier: "premium", photographers: 2, videographers: 2, deliveryDays: 21, editedPhotos: 600,
    includes: ["2 Photographers", "2 Videographers", "Drone + Crane", "Same-Day Edit", "600+ Photos", "Full Film + Teaser", "Premium Album", "Online Gallery", "Instagram Reels (5)", "Photo Booth"],
    addons: ["a2", "a5", "a6", "a7", "a8"],
  },
  {
    id: "pkg4", name: "Destination", tagline: "All-inclusive destination wedding experience",
    price: 500000, tier: "luxury", photographers: 3, videographers: 2, deliveryDays: 14, editedPhotos: 1000,
    includes: ["3 Photographers", "2 Videographers", "Drone Coverage", "Pre-Wedding Shoot", "All Events (3–5 days)", "Premium Album (2)", "Cinematic Film + Teaser", "Same-Day Edit", "Travel & Stay Included", "Dedicated Editor"],
    addons: ["a5", "a6", "a7"],
  },
];

const sampleQuotations: Quotation[] = [];

const statusConfig: Record<string, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  draft: { label: "Draft", color: "text-muted-foreground", bgColor: "bg-muted/50", borderColor: "border-border", icon: FileText },
  sent: { label: "Sent", color: "text-blue-500", bgColor: "bg-blue-500/15", borderColor: "border-blue-500/30", icon: Send },
  viewed: { label: "Viewed", color: "text-primary", bgColor: "bg-primary/15", borderColor: "border-primary/30", icon: Eye },
  approved: { label: "Approved", color: "text-emerald-500", bgColor: "bg-emerald-500/15", borderColor: "border-emerald-500/30", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "text-red-500", bgColor: "bg-red-500/15", borderColor: "border-red-500/30", icon: X },
  expired: { label: "Expired", color: "text-muted-foreground", bgColor: "bg-muted/30", borderColor: "border-border", icon: Clock },
};

const tierConfig: Record<string, { gradient: string; icon: React.ElementType; accent: string }> = {
  basic: { gradient: "from-muted to-muted/50", icon: Camera, accent: "text-muted-foreground" },
  popular: { gradient: "from-primary/20 to-primary/5", icon: Star, accent: "text-primary" },
  premium: { gradient: "from-purple-500/20 to-purple-500/5", icon: Crown, accent: "text-purple-500" },
  luxury: { gradient: "from-emerald-500/20 to-emerald-500/5", icon: Sparkles, accent: "text-emerald-500" },
};

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 240, damping: 24 } },
};

// ─── Component ───
export default function QuotationsPage() {
  const { organization } = useOrg();
  const { quotations: dbQuotations, isLoading, createQuotation, updateQuotation } = useQuotations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPkg, setSelectedPkg] = useState<StudioPackage | null>(null);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  // Create quotation state
  const [newClient, setNewClient] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");
  const [newSelectedPkg, setNewSelectedPkg] = useState<string>("");
  const [newSelectedAddons, setNewSelectedAddons] = useState<string[]>([]);
  const [newCustomItems, setNewCustomItems] = useState<{ name: string; amount: string }[]>([]);
  const [newDiscount, setNewDiscount] = useState("");
  const [newDiscountPercent, setNewDiscountPercent] = useState(false);
  const [newNotes, setNewNotes] = useState("");
  const [newValidDate, setNewValidDate] = useState<Date>();

  // Map DB quotations to the local Quotation interface
  const quotations: Quotation[] = useMemo(() => {
    if (dbQuotations.length === 0) return sampleQuotations;
    return dbQuotations.map(q => ({
      id: q.id,
      quotationNumber: q.quotation_number,
      client: q.client_name,
      items: (q.items as any[]) || [],
      totalAmount: q.subtotal,
      discount: q.discount_value || 0,
      finalAmount: q.total_amount,
      status: q.status as Quotation["status"],
      validUntil: q.valid_until || "",
      createdAt: q.created_at.split("T")[0],
      notes: q.notes || undefined,
    }));
  }, [dbQuotations]);

  const filtered = useMemo(() => {
    return quotations.filter((q) => {
      const matchSearch = `${q.client} ${q.quotationNumber} ${q.items.map((i: any) => i.name).join(" ")}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || q.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [quotations, search, statusFilter]);

  // Stats
  const approvedValue = quotations.filter(q => q.status === "approved").reduce((s, q) => s + q.finalAmount, 0);
  const pipelineValue = quotations.filter(q => ["sent", "viewed"].includes(q.status)).reduce((s, q) => s + q.finalAmount, 0);
  const totalSent = quotations.filter(q => q.status !== "draft").length;
  const conversionRate = totalSent > 0 ? Math.round((quotations.filter(q => q.status === "approved").length / totalSent) * 100) : 0;

  // New quotation amount calculation
  const selectedPackage = studioPackages.find(p => p.id === newSelectedPkg);
  const addonTotal = newSelectedAddons.reduce((s, aId) => {
    const a = addons.find(x => x.id === aId);
    return s + (a?.price || 0);
  }, 0);
  const customTotal = newCustomItems.reduce((s, ci) => s + (Number(ci.amount) || 0), 0);
  const subtotal = (selectedPackage?.price || 0) + addonTotal + customTotal;
  const discountAmt = newDiscountPercent ? Math.round(subtotal * (Number(newDiscount) || 0) / 100) : (Number(newDiscount) || 0);
  const grandTotal = Math.max(0, subtotal - discountAmt);

  const resetCreate = () => {
    setNewClient(""); setNewClientPhone(""); setNewSelectedPkg(""); setNewSelectedAddons([]);
    setNewCustomItems([]); setNewDiscount(""); setNewDiscountPercent(false); setNewNotes(""); setNewValidDate(undefined);
  };

  const handleCreateQuotation = () => {
    if (!newClient.trim()) { toast.error("Client name is required"); return; }
    if (!newSelectedPkg) { toast.error("Select a package"); return; }
    if (!newValidDate) { toast.error("Set a validity date"); return; }
    if (!organization) { toast.error("No organization found"); return; }

    const items: QuotationItem[] = [];
    if (selectedPackage) items.push({ type: "package", name: selectedPackage.name + " Package", amount: selectedPackage.price });
    newSelectedAddons.forEach(aId => {
      const a = addons.find(x => x.id === aId);
      if (a) items.push({ type: "addon", name: a.name, amount: a.price });
    });
    newCustomItems.filter(ci => ci.name.trim() && Number(ci.amount) > 0).forEach(ci => {
      items.push({ type: "custom", name: ci.name, amount: Number(ci.amount) });
    });

    createQuotation.mutate({
      organization_id: organization.id,
      client_id: null,
      project_id: null,
      quotation_number: `QT-2026-${String(quotations.length + 1).padStart(3, "0")}`,
      client_name: newClient.trim(),
      project_name: null,
      items: items as any,
      subtotal,
      discount_type: newDiscountPercent ? "percentage" : "fixed",
      discount_value: discountAmt,
      tax_percent: 0,
      total_amount: grandTotal,
      status: "draft",
      valid_until: format(newValidDate, "yyyy-MM-dd"),
      terms: null,
      notes: newNotes.trim() || null,
    });
    resetCreate();
    setCreateOpen(false);
  };

  const handleStatusChange = (qId: string, newStatus: Quotation["status"]) => {
    updateQuotation.mutate({ id: qId, status: newStatus });
    const label = statusConfig[newStatus].label;
    toast.success(`Quotation marked as ${label}`);
    setSelectedQuotation(null);
  };

  const activeFilterCount = (statusFilter !== "all" ? 1 : 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto space-y-5">
      {/* ═══ Header ═══ */}
      <motion.div variants={cardVariants} className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">Quotations</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Packages, pricing & proposals</p>
        </div>
        <Button size="sm" className="gap-2 rounded-xl" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> New Quote
        </Button>
      </motion.div>

      {/* ═══ Stats Pipeline ═══ */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Pipeline", value: pipelineValue, color: "from-blue-500/15 to-blue-500/5", ring: "ring-blue-500/15", textColor: "text-blue-500" },
          { label: "Approved", value: approvedValue, color: "from-emerald-500/15 to-emerald-500/5", ring: "ring-emerald-500/15", textColor: "text-emerald-500" },
          { label: "Quotes", value: quotations.length, isCount: true, color: "from-primary/15 to-primary/5", ring: "ring-primary/15", textColor: "text-primary" },
          { label: "Convert", value: conversionRate, isPercent: true, color: "from-purple-500/15 to-purple-500/5", ring: "ring-purple-500/15", textColor: "text-purple-500" },
        ].map((stat, i) => (
          <motion.div key={stat.label} variants={cardVariants} className={cn("rounded-2xl border border-border p-3 bg-gradient-to-b ring-1", stat.color, stat.ring)}>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">{stat.label}</p>
            <p className={cn("text-sm sm:text-base font-display font-extrabold mt-1", stat.textColor)}>
              {stat.isCount ? stat.value : stat.isPercent ? `${stat.value}%` : `₹${((stat.value as number) / 100000).toFixed(1)}L`}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ═══ Tabs: Packages | Quotations ═══ */}
      <motion.div variants={cardVariants}>
        <Tabs defaultValue="quotations">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
            <TabsTrigger value="quotations" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" /> Quotations
              <Badge variant="secondary" className="text-[9px] h-4 px-1 ml-0.5">{quotations.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="packages" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-1.5 text-xs">
              <Package className="h-3.5 w-3.5" /> Packages
            </TabsTrigger>
            <TabsTrigger value="addons" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 gap-1.5 text-xs">
              <Gift className="h-3.5 w-3.5" /> Add-ons
            </TabsTrigger>
          </TabsList>

          {/* ═══ QUOTATIONS TAB ═══ */}
          <TabsContent value="quotations" className="mt-4 space-y-3">
            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search quotes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 rounded-xl h-9 text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className={cn("rounded-xl h-9 w-9 shrink-0", activeFilterCount > 0 && "border-primary text-primary")}
                onClick={() => setFilterOpen(true)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex gap-2 flex-wrap">
                {statusFilter !== "all" && (
                  <Badge variant="outline" className="text-xs gap-1 rounded-lg border-primary/30 text-primary cursor-pointer" onClick={() => setStatusFilter("all")}>
                    {statusConfig[statusFilter].label} <X className="h-3 w-3" />
                  </Badge>
                )}
              </div>
            )}

            {/* Status Quick Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["all", "draft", "sent", "viewed", "approved", "rejected", "expired"].map(s => {
                const count = s === "all" ? quotations.length : quotations.filter(q => q.status === s).length;
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-all border",
                      statusFilter === s
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-card text-muted-foreground border-border hover:border-primary/20"
                    )}
                  >
                    {s === "all" ? "All" : statusConfig[s].label}
                    <span className="text-[9px] opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* Quotation Cards */}
            <AnimatePresence mode="popLayout">
              {filtered.map((q, i) => {
                const cfg = statusConfig[q.status];
                const StatusIcon = cfg.icon;
                const daysLeft = Math.ceil((new Date(q.validUntil).getTime() - Date.now()) / 86400000);
                return (
                  <motion.div
                    key={q.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setSelectedQuotation(q)}
                    className="rounded-2xl border border-border bg-card p-4 cursor-pointer hover:border-primary/30 transition-all group active:scale-[0.98]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", cfg.bgColor)}>
                          <StatusIcon className={cn("h-4 w-4", cfg.color)} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{q.client}</p>
                            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0 h-4 border shrink-0", cfg.bgColor, cfg.color, cfg.borderColor)}>
                              {cfg.label}
                            </Badge>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">{q.quotationNumber}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            {q.items.slice(0, 2).map((item, idx) => (
                              <span key={idx} className="text-[10px] bg-muted/50 text-muted-foreground px-1.5 py-0.5 rounded-md">{item.name}</span>
                            ))}
                            {q.items.length > 2 && <span className="text-[10px] text-primary">+{q.items.length - 2}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-foreground">₹{(q.finalAmount / 1000).toFixed(0)}K</p>
                        {q.discount > 0 && (
                          <p className="text-[9px] text-muted-foreground line-through">₹{(q.totalAmount / 1000).toFixed(0)}K</p>
                        )}
                        <p className={cn("text-[10px] mt-1", daysLeft > 7 ? "text-muted-foreground" : daysLeft > 0 ? "text-amber-500" : "text-red-500")}>
                          {daysLeft > 0 ? `${daysLeft}d left` : "Expired"}
                        </p>
                      </div>
                    </div>
                    {q.notes && (
                      <p className="text-[10px] text-muted-foreground mt-2 pl-[52px] truncate">{q.notes}</p>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="py-16 text-center">
                <FileText className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No quotations found</p>
              </div>
            )}
          </TabsContent>

          {/* ═══ PACKAGES TAB ═══ */}
          <TabsContent value="packages" className="mt-4 space-y-3">
            {studioPackages.map((pkg, i) => {
              const tier = tierConfig[pkg.tier];
              const TierIcon = tier.icon;
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedPkg(pkg)}
                  className={cn(
                    "rounded-2xl border overflow-hidden cursor-pointer transition-all hover:border-primary/30 active:scale-[0.98]",
                    pkg.popular ? "border-primary/30" : "border-border"
                  )}
                >
                  {/* Tier accent bar */}
                  <div className={cn("h-1 bg-gradient-to-r", tier.gradient)} />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center bg-gradient-to-br", tier.gradient)}>
                          <TierIcon className={cn("h-5 w-5", tier.accent)} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-display font-bold text-foreground">{pkg.name}</h3>
                            {pkg.popular && <Badge className="bg-primary text-primary-foreground text-[9px] h-4 px-1.5">Popular</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{pkg.tagline}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-lg font-display font-extrabold text-foreground">₹{(pkg.price / 1000).toFixed(0)}K</p>
                      </div>
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                        <Camera className="h-3 w-3" /> {pkg.photographers} Photo
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                        <Video className="h-3 w-3" /> {pkg.videographers} Video
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                        <ImageIcon className="h-3 w-3" /> {pkg.editedPhotos}+ Photos
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/50 px-2 py-1 rounded-lg">
                        <Clock className="h-3 w-3" /> {pkg.deliveryDays}d delivery
                      </span>
                    </div>

                    {/* Top 3 includes */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3">
                      {pkg.includes.slice(0, 4).map(item => (
                        <span key={item} className="text-[10px] text-foreground/70 flex items-center gap-1">
                          <Check className="h-2.5 w-2.5 text-primary" /> {item}
                        </span>
                      ))}
                      {pkg.includes.length > 4 && (
                        <span className="text-[10px] text-primary font-medium">+{pkg.includes.length - 4} more</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </TabsContent>

          {/* ═══ ADD-ONS TAB ═══ */}
          <TabsContent value="addons" className="mt-4">
            <div className="grid grid-cols-2 gap-2">
              {addons.map((addon, i) => {
                const AddonIcon = addon.icon;
                return (
                  <motion.div
                    key={addon.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-xl border border-border p-3 hover:border-primary/20 transition-all"
                  >
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <AddonIcon className="h-4 w-4 text-primary" />
                    </div>
                    <p className="text-xs font-semibold text-foreground">{addon.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{addon.description}</p>
                    <p className="text-sm font-bold text-primary mt-2">₹{(addon.price / 1000).toFixed(0)}K</p>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      {/* ═══ Package Detail Dialog ═══ */}
      <Dialog open={!!selectedPkg} onOpenChange={() => setSelectedPkg(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          {selectedPkg && (() => {
            const tier = tierConfig[selectedPkg.tier];
            const TierIcon = tier.icon;
            return (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br", tier.gradient)}>
                      <TierIcon className={cn("h-6 w-6", tier.accent)} />
                    </div>
                    <div>
                      <DialogTitle className="font-display text-lg">{selectedPkg.name} Package</DialogTitle>
                      <p className="text-xs text-muted-foreground">{selectedPkg.tagline}</p>
                    </div>
                  </div>
                </DialogHeader>

                <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-xl p-4 text-center">
                  <p className="text-3xl font-display font-extrabold text-foreground">₹{selectedPkg.price.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground mt-1">Starting price · Customizable</p>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Photos", value: `${selectedPkg.photographers}`, icon: Camera },
                    { label: "Videos", value: `${selectedPkg.videographers}`, icon: Video },
                    { label: "Photos", value: `${selectedPkg.editedPhotos}+`, icon: ImageIcon },
                    { label: "Delivery", value: `${selectedPkg.deliveryDays}d`, icon: Clock },
                  ].map(s => (
                    <div key={s.label + s.value} className="text-center p-2 rounded-lg bg-muted/30 border border-border">
                      <s.icon className="h-4 w-4 text-primary mx-auto mb-1" />
                      <p className="text-xs font-bold text-foreground">{s.value}</p>
                      <p className="text-[9px] text-muted-foreground">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Full includes */}
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Everything Included</p>
                  <div className="space-y-1.5">
                    {selectedPkg.includes.map(item => (
                      <div key={item} className="flex items-center gap-2 text-sm text-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0" /> {item}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Available add-ons */}
                {selectedPkg.addons.length > 0 && (
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">Available Add-ons</p>
                    <div className="space-y-1.5">
                      {selectedPkg.addons.map(aId => {
                        const a = addons.find(x => x.id === aId);
                        if (!a) return null;
                        return (
                          <div key={a.id} className="flex items-center justify-between gap-2 text-sm">
                            <div className="flex items-center gap-2 text-foreground/80">
                              <Plus className="h-3.5 w-3.5 text-muted-foreground" /> {a.name}
                            </div>
                            <span className="text-xs font-mono text-primary">+₹{(a.price / 1000).toFixed(0)}K</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-2 rounded-xl"><Copy className="h-4 w-4" /> Duplicate</Button>
                  <Button className="flex-1 gap-2 rounded-xl" onClick={() => { setSelectedPkg(null); setNewSelectedPkg(selectedPkg.id); setCreateOpen(true); }}>
                    <Send className="h-4 w-4" /> Create Quote
                  </Button>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ═══ Quotation Detail Sheet ═══ */}
      <Sheet open={!!selectedQuotation} onOpenChange={() => setSelectedQuotation(null)}>
        <SheetContent side="right" className="w-full sm:max-w-lg max-h-screen overflow-y-auto">
          {selectedQuotation && (() => {
            const q = selectedQuotation;
            const cfg = statusConfig[q.status];
            const StatusIcon = cfg.icon;
            return (
              <>
                <SheetHeader className="text-left mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <SheetTitle className="text-lg font-display font-bold">{q.client}</SheetTitle>
                      <SheetDescription className="font-mono text-xs">{q.quotationNumber}</SheetDescription>
                    </div>
                    <Badge variant="outline" className={cn("text-xs px-2 py-0.5 border", cfg.bgColor, cfg.color, cfg.borderColor)}>
                      <StatusIcon className="h-3 w-3 mr-1" /> {cfg.label}
                    </Badge>
                  </div>
                </SheetHeader>

                {/* Line items */}
                <div className="rounded-xl border border-border overflow-hidden mb-4">
                  <div className="bg-muted/30 px-4 py-2 border-b border-border">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Line Items</p>
                  </div>
                  <div className="divide-y divide-border">
                    {q.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-6 w-6 rounded-md flex items-center justify-center text-[10px]",
                            item.type === "package" ? "bg-primary/15 text-primary" : item.type === "addon" ? "bg-blue-500/15 text-blue-500" : "bg-muted text-muted-foreground"
                          )}>
                            {item.type === "package" ? <Package className="h-3 w-3" /> : item.type === "addon" ? <Plus className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
                          </div>
                          <div>
                            <p className="text-sm text-foreground">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground capitalize">{item.type}</p>
                          </div>
                        </div>
                        <p className="text-sm font-mono text-foreground">₹{item.amount.toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-muted/20 px-4 py-3 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Subtotal</span>
                      <span>₹{q.totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                    {q.discount > 0 && (
                      <div className="flex items-center justify-between text-xs text-emerald-500">
                        <span>Discount</span>
                        <span>−₹{q.discount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm font-bold text-foreground pt-1 border-t border-border">
                      <span>Total</span>
                      <span>₹{q.finalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="rounded-xl bg-muted/30 border border-border p-3 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Created</p>
                    <p className="text-xs font-medium text-foreground mt-1">{new Date(q.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border p-3 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Sent</p>
                    <p className="text-xs font-medium text-foreground mt-1">{q.sentDate ? new Date(q.sentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}</p>
                  </div>
                  <div className="rounded-xl bg-muted/30 border border-border p-3 text-center">
                    <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold">Valid Until</p>
                    <p className="text-xs font-medium text-foreground mt-1">{new Date(q.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                  </div>
                </div>

                {q.notes && (
                  <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 mb-4">
                    <p className="text-[10px] text-primary uppercase tracking-wider font-semibold mb-1">Notes</p>
                    <p className="text-sm text-foreground">{q.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  {q.status === "draft" && (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-xl gap-2" onClick={() => handleStatusChange(q.id, "sent")}>
                        <Send className="h-4 w-4" /> Mark Sent
                      </Button>
                      <Button variant="outline" className="rounded-xl" size="icon"><Edit className="h-4 w-4" /></Button>
                    </div>
                  )}
                  {q.status === "sent" && (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-xl gap-2" onClick={() => handleStatusChange(q.id, "viewed")}>
                        <Eye className="h-4 w-4" /> Mark Viewed
                      </Button>
                      <Button className="flex-1 rounded-xl gap-2" onClick={() => handleStatusChange(q.id, "approved")}>
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                    </div>
                  )}
                  {q.status === "viewed" && (
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 rounded-xl gap-2 text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => handleStatusChange(q.id, "rejected")}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                      <Button className="flex-1 rounded-xl gap-2" onClick={() => handleStatusChange(q.id, "approved")}>
                        <CheckCircle2 className="h-4 w-4" /> Approve
                      </Button>
                    </div>
                  )}
                  {(q.status === "rejected" || q.status === "expired") && (
                    <Button variant="outline" className="w-full rounded-xl gap-2" onClick={() => {
                      setSelectedQuotation(null);
                      setNewClient(q.client);
                      setCreateOpen(true);
                    }}>
                      <Copy className="h-4 w-4" /> Create New Quote
                    </Button>
                  )}
                  <Button variant="ghost" className="w-full rounded-xl gap-2 text-muted-foreground">
                    <Copy className="h-4 w-4" /> Share via WhatsApp
                  </Button>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ═══ Create Quotation Sheet ═══ */}
      <Sheet open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetCreate(); }}>
        <SheetContent side="right" className="w-full sm:max-w-lg max-h-screen overflow-y-auto">
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="text-lg font-display font-bold">Create Quotation</SheetTitle>
            <SheetDescription>Build a custom quote for your client</SheetDescription>
          </SheetHeader>

          <div className="space-y-5">
            {/* Client Info */}
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Client Details</p>
              <Input value={newClient} onChange={(e) => setNewClient(e.target.value)} placeholder="Couple name (e.g. Priya & Rahul)" className="rounded-xl" />
              <Input value={newClientPhone} onChange={(e) => setNewClientPhone(e.target.value)} placeholder="Phone (optional)" className="rounded-xl" />
            </div>

            {/* Select Package */}
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Select Package</p>
              <div className="grid grid-cols-2 gap-2">
                {studioPackages.map(pkg => {
                  const tier = tierConfig[pkg.tier];
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setNewSelectedPkg(pkg.id)}
                      className={cn(
                        "p-3 rounded-xl border text-left transition-all",
                        newSelectedPkg === pkg.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/20"
                      )}
                    >
                      <p className="text-xs font-semibold text-foreground">{pkg.name}</p>
                      <p className="text-sm font-bold text-primary mt-1">₹{(pkg.price / 1000).toFixed(0)}K</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Add-ons */}
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Add-ons</p>
              <div className="grid grid-cols-2 gap-2">
                {addons.map(addon => {
                  const AddonIcon = addon.icon;
                  const selected = newSelectedAddons.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => {
                        setNewSelectedAddons(prev =>
                          selected ? prev.filter(id => id !== addon.id) : [...prev, addon.id]
                        );
                      }}
                      className={cn(
                        "p-2.5 rounded-xl border text-left transition-all flex items-start gap-2",
                        selected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/20"
                      )}
                    >
                      <div className={cn("h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", selected ? "bg-primary/20" : "bg-muted")}>
                        <AddonIcon className={cn("h-3.5 w-3.5", selected ? "text-primary" : "text-muted-foreground")} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium text-foreground truncate">{addon.name}</p>
                        <p className="text-[10px] font-bold text-primary">₹{(addon.price / 1000).toFixed(0)}K</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Custom Items</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs gap-1 text-primary h-6 px-2"
                  onClick={() => setNewCustomItems(prev => [...prev, { name: "", amount: "" }])}
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
              {newCustomItems.map((ci, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    value={ci.name}
                    onChange={(e) => {
                      const updated = [...newCustomItems];
                      updated[idx].name = e.target.value;
                      setNewCustomItems(updated);
                    }}
                    placeholder="Item name"
                    className="rounded-xl flex-1 h-9 text-sm"
                  />
                  <Input
                    value={ci.amount}
                    onChange={(e) => {
                      const updated = [...newCustomItems];
                      updated[idx].amount = e.target.value;
                      setNewCustomItems(updated);
                    }}
                    placeholder="₹ Amount"
                    type="number"
                    className="rounded-xl w-24 h-9 text-sm"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground" onClick={() => setNewCustomItems(prev => prev.filter((_, i) => i !== idx))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Discount */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Discount</p>
              <div className="flex gap-2 items-center">
                <Input
                  value={newDiscount}
                  onChange={(e) => setNewDiscount(e.target.value)}
                  placeholder={newDiscountPercent ? "%" : "₹ Amount"}
                  type="number"
                  className="rounded-xl flex-1 h-9 text-sm"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-muted-foreground">%</span>
                  <Switch checked={newDiscountPercent} onCheckedChange={setNewDiscountPercent} />
                </div>
              </div>
            </div>

            {/* Valid Until */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Valid Until</p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal rounded-xl", !newValidDate && "text-muted-foreground")}>
                    <CalendarDays className="h-4 w-4 mr-2" />
                    {newValidDate ? format(newValidDate, "PPP") : "Select validity date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={newValidDate} onSelect={setNewValidDate} initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Notes (optional)</p>
              <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Special requirements, venue details..." className="rounded-xl resize-none" rows={2} />
            </div>

            {/* Price Summary */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2">
              <p className="text-[10px] text-primary uppercase tracking-wider font-semibold">Price Summary</p>
              {selectedPackage && (
                <div className="flex justify-between text-sm">
                  <span className="text-foreground">{selectedPackage.name} Package</span>
                  <span className="font-mono text-foreground">₹{selectedPackage.price.toLocaleString("en-IN")}</span>
                </div>
              )}
              {newSelectedAddons.map(aId => {
                const a = addons.find(x => x.id === aId);
                if (!a) return null;
                return (
                  <div key={a.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{a.name}</span>
                    <span className="font-mono text-foreground">₹{a.price.toLocaleString("en-IN")}</span>
                  </div>
                );
              })}
              {newCustomItems.filter(ci => ci.name && Number(ci.amount) > 0).map((ci, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{ci.name}</span>
                  <span className="font-mono text-foreground">₹{Number(ci.amount).toLocaleString("en-IN")}</span>
                </div>
              ))}
              {subtotal > 0 && (
                <>
                  <div className="border-t border-border pt-2 flex justify-between text-xs text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {discountAmt > 0 && (
                    <div className="flex justify-between text-xs text-emerald-500">
                      <span>Discount</span>
                      <span>−₹{discountAmt.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-foreground border-t border-border pt-2">
                    <span>Total</span>
                    <span>₹{grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </>
              )}
            </div>

            {/* Submit */}
            <Button onClick={handleCreateQuotation} className="w-full rounded-xl h-12 text-sm font-semibold gap-2">
              <FileText className="h-4 w-4" /> Create Quotation
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ Filter Sheet ═══ */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg">
          <SheetHeader className="text-left mb-4">
            <SheetTitle className="text-lg font-bold">Filters</SheetTitle>
            <SheetDescription>Filter quotations by status</SheetDescription>
          </SheetHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Status</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setFilterOpen(false); }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(statusConfig).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full rounded-xl" onClick={() => { setStatusFilter("all"); setFilterOpen(false); }}>
              Clear Filters
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
