import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Plus, Receipt, IndianRupee, Calendar, Camera, Upload, X, Check,
  Plane, UtensilsCrossed, Package, Hotel, Sparkles, Clock, CheckCircle2, XCircle,
  Briefcase, Building2, Search, Filter, FileText, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type Scope = "event" | "office";
type Category = "travel" | "food" | "items" | "stay" | "other";
type ApprovalStatus = "pending" | "approved" | "rejected";

interface ExpenseRow {
  id: string;
  amount: number;
  description: string;
  category: string;
  client_name: string;
  event_name: string | null;
  project_name: string | null;
  paid_to: string | null;
  receipt_url: string | null;
  expense_date: string;
  approval_status: string;
  approved_by: string | null;
  submitted_by: string;
  notes: string | null;
  created_at: string;
}

const CATEGORIES: { id: Category; label: string; icon: typeof Plane; color: string; bg: string }[] = [
  { id: "travel", label: "Travel", icon: Plane, color: "text-sky-600 dark:text-sky-400", bg: "bg-sky-500/15" },
  { id: "food", label: "Food", icon: UtensilsCrossed, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/15" },
  { id: "items", label: "Items", icon: Package, color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/15" },
  { id: "stay", label: "Stay", icon: Hotel, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/15" },
  { id: "other", label: "Other", icon: Sparkles, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/15" },
];

const STATUS_CFG: Record<ApprovalStatus, { label: string; icon: typeof Clock; bg: string; text: string; ring: string }> = {
  pending: { label: "Pending", icon: Clock, bg: "bg-amber-500/15", text: "text-amber-600 dark:text-amber-400", ring: "ring-amber-500/30" },
  approved: { label: "Approved", icon: CheckCircle2, bg: "bg-emerald-500/15", text: "text-emerald-600 dark:text-emerald-400", ring: "ring-emerald-500/30" },
  rejected: { label: "Rejected", icon: XCircle, bg: "bg-destructive/15", text: "text-destructive", ring: "ring-destructive/30" },
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
const fmtCompact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : `${n}`);

export default function RoleExpensePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentRole } = useRole();
  const { data: events = [] } = useEvents();
  const { data: clients = [] } = useClients();

  const [tab, setTab] = useState<"history" | "new">("history");
  const [statusFilter, setStatusFilter] = useState<"all" | ApprovalStatus>("all");
  const [search, setSearch] = useState("");
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [scope, setScope] = useState<Scope>("event");
  const [category, setCategory] = useState<Category>("travel");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [eventId, setEventId] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submittedByName = useMemo(() => {
    return user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Staff";
  }, [user]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("submitted_by", submittedByName)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setExpenses((data as ExpenseRow[]) ?? []);
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); /* eslint-disable-next-line */ }, [submittedByName]);

  const stats = useMemo(() => {
    const total = expenses.reduce((s, e) => s + Number(e.amount), 0);
    const pending = expenses.filter((e) => e.approval_status === "pending");
    const approved = expenses.filter((e) => e.approval_status === "approved");
    return {
      total,
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, e) => s + Number(e.amount), 0),
      approvedAmount: approved.reduce((s, e) => s + Number(e.amount), 0),
    };
  }, [expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (statusFilter !== "all" && e.approval_status !== statusFilter) return false;
      if (search && !`${e.description} ${e.client_name} ${e.event_name ?? ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [expenses, statusFilter, search]);

  const handleFile = (f: File | null) => {
    if (!f) { setReceiptFile(null); setReceiptPreview(null); return; }
    if (f.size > 10 * 1024 * 1024) { toast.error("Max file size is 10MB"); return; }
    setReceiptFile(f);
    if (f.type.startsWith("image/")) {
      const r = new FileReader();
      r.onload = () => setReceiptPreview(r.result as string);
      r.readAsDataURL(f);
    } else {
      setReceiptPreview(null);
    }
  };

  const resetForm = () => {
    setScope("event"); setCategory("travel"); setAmount(""); setDescription("");
    setPaidTo(""); setEventId(""); setNotes(""); setReceiptFile(null); setReceiptPreview(null);
    setExpenseDate(new Date().toISOString().split("T")[0]);
  };

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (!description.trim()) { toast.error("Add a description"); return; }
    if (scope === "event" && !eventId) { toast.error("Select an event"); return; }

    setSubmitting(true);
    try {
      let receipt_url: string | null = null;
      if (receiptFile) {
        const ext = receiptFile.name.split(".").pop();
        const path = `${user?.id ?? "anon"}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("expense-receipts").upload(path, receiptFile);
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("expense-receipts").getPublicUrl(path);
        receipt_url = pub.publicUrl;
      }

      const ev = events.find((e) => e.id === eventId);
      const cl = ev ? clients.find((c) => c.id === ev.client_id) : null;

      const payload = {
        amount: amt,
        description: description.trim(),
        category,
        client_name: scope === "event" ? (cl?.name ?? "Studio") : "Office",
        event_name: scope === "event" ? (ev?.name ?? null) : "Office Expense",
        project_name: null,
        paid_to: paidTo.trim() || null,
        receipt_url,
        expense_date: expenseDate,
        approval_status: "pending",
        submitted_by: submittedByName,
        notes: notes.trim() || null,
      };

      const { error } = await supabase.from("expenses").insert(payload);
      if (error) throw error;
      toast.success("Expense submitted for approval");
      resetForm();
      setTab("history");
      fetchExpenses();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    toast.success("Expense deleted");
    fetchExpenses();
  };

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary/90 via-primary/75 to-primary/55 px-5 pt-5 pb-12 text-primary-foreground relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-44 w-44 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate("/m")} className="h-9 w-9 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center active:scale-90 transition-transform">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest opacity-80">Expense Center</p>
              <p className="text-base font-bold">Raise & Track</p>
            </div>
            <button
              onClick={() => setTab("new")}
              className="h-9 px-3 rounded-2xl bg-white text-primary font-semibold text-[11px] flex items-center gap-1 active:scale-95 transition-transform shadow-lg"
            >
              <Plus className="h-3.5 w-3.5" /> New
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: "Total", value: stats.total, color: "text-white" },
              { label: "Pending", value: stats.pendingAmount, color: "text-amber-200" },
              { label: "Approved", value: stats.approvedAmount, color: "text-emerald-200" },
            ].map((s) => (
              <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-2xl p-3 border border-white/15">
                <p className="text-[10px] uppercase tracking-wider opacity-80">{s.label}</p>
                <p className={`text-[15px] font-extrabold flex items-center mt-0.5 ${s.color}`}>
                  <IndianRupee className="h-3 w-3" />{fmtCompact(s.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-background -mt-5 rounded-t-3xl relative z-10 px-5 pt-4 pb-6">
        {/* Tabs */}
        <div className="bg-muted rounded-2xl p-1 grid grid-cols-2 mb-4">
          {(["history", "new"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative h-9 rounded-xl text-[12px] font-semibold transition-colors ${
                tab === t ? "text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              {tab === t && (
                <motion.div layoutId="exp-tab" className="absolute inset-0 bg-primary rounded-xl shadow" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
              )}
              <span className="relative z-10 flex items-center justify-center gap-1.5">
                {t === "history" ? <><Receipt className="h-3.5 w-3.5" /> History ({expenses.length})</> : <><Plus className="h-3.5 w-3.5" /> Raise New</>}
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {tab === "history" ? (
            <motion.div key="hist" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
              {/* Search + filter */}
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search expenses..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card ring-1 ring-border text-[13px] outline-none focus:ring-primary"
                  />
                </div>
              </div>

              {/* Status pills */}
              <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
                {(["all", "pending", "approved", "rejected"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(s)}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize ring-1 transition-colors ${
                      statusFilter === s ? "bg-primary text-primary-foreground ring-primary" : "bg-card text-muted-foreground ring-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              {loading ? (
                <div className="space-y-2.5">
                  {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-16">
                  <div className="h-16 w-16 mx-auto rounded-3xl bg-muted flex items-center justify-center mb-3">
                    <Receipt className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">No expenses yet</p>
                  <p className="text-xs text-muted-foreground mt-1 mb-4">Raise your first expense to get reimbursed.</p>
                  <Button onClick={() => setTab("new")} size="sm" className="rounded-xl">
                    <Plus className="h-4 w-4 mr-1" /> Raise expense
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filtered.map((e, i) => {
                    const cat = CATEGORIES.find((c) => c.id === e.category) ?? CATEGORIES[4];
                    const stCfg = STATUS_CFG[(e.approval_status as ApprovalStatus) ?? "pending"];
                    const StIcon = stCfg.icon;
                    const CIcon = cat.icon;
                    const isOffice = e.event_name === "Office Expense";
                    return (
                      <motion.div
                        key={e.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-card border border-border rounded-2xl p-3.5"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 ${cat.bg}`}>
                            <CIcon className={`h-5 w-5 ${cat.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <p className="text-[13px] font-semibold text-foreground truncate">{e.description}</p>
                              <p className="text-[14px] font-extrabold text-foreground shrink-0">₹{Number(e.amount).toLocaleString("en-IN")}</p>
                            </div>
                            <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground mb-1.5">
                              {isOffice ? <Building2 className="h-3 w-3" /> : <Briefcase className="h-3 w-3" />}
                              <span className="truncate">{isOffice ? "Office" : (e.event_name || e.client_name)}</span>
                              <span>·</span>
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(e.expense_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${stCfg.bg} ${stCfg.text} ring-1 ${stCfg.ring}`}>
                                <StIcon className="h-2.5 w-2.5" /> {stCfg.label}
                              </span>
                              <div className="flex items-center gap-2">
                                {e.receipt_url && (
                                  <a href={e.receipt_url} target="_blank" rel="noreferrer" className="text-[10px] text-primary font-semibold flex items-center gap-1">
                                    <FileText className="h-3 w-3" /> Receipt
                                  </a>
                                )}
                                {e.approval_status === "pending" && (
                                  <button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-destructive">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="new" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
              {/* Scope toggle */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Expense Type</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: "event" as const, label: "Event-wise", sub: "Bill to client event", Icon: Briefcase },
                    { id: "office" as const, label: "Office", sub: "Studio expenditure", Icon: Building2 },
                  ].map((s) => {
                    const SIcon = s.Icon;
                    const active = scope === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => setScope(s.id)}
                        className={`relative p-3.5 rounded-2xl text-left ring-1 transition-all ${
                          active ? "bg-primary/10 ring-primary shadow-sm" : "bg-card ring-border"
                        }`}
                      >
                        <div className={`h-9 w-9 rounded-xl flex items-center justify-center mb-2 ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <SIcon className="h-4 w-4" />
                        </div>
                        <p className={`text-[12.5px] font-bold ${active ? "text-primary" : "text-foreground"}`}>{s.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{s.sub}</p>
                        {active && (
                          <div className="absolute top-2.5 right-2.5 h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="h-2.5 w-2.5 text-primary-foreground" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Event picker */}
              {scope === "event" && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Select Event</p>
                  <select
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-card ring-1 ring-border text-[13px] outline-none focus:ring-primary"
                  >
                    <option value="">— Choose event —</option>
                    {events.map((ev) => {
                      const cl = clients.find((c) => c.id === ev.client_id);
                      return (
                        <option key={ev.id} value={ev.id}>
                          {ev.name} {cl ? `· ${cl.name}` : ""} · {new Date(ev.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                        </option>
                      );
                    })}
                  </select>
                  {events.length === 0 && (
                    <p className="text-[10.5px] text-muted-foreground mt-1.5">No events available. Switch to Office expense.</p>
                  )}
                </div>
              )}

              {/* Category */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Category</p>
                <div className="grid grid-cols-5 gap-2">
                  {CATEGORIES.map((c) => {
                    const active = category === c.id;
                    const CIcon = c.icon;
                    return (
                      <button
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`flex flex-col items-center gap-1 p-2 rounded-2xl ring-1 transition-all ${
                          active ? "ring-primary bg-primary/5" : "ring-border bg-card"
                        }`}
                      >
                        <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${c.bg}`}>
                          <CIcon className={`h-4 w-4 ${c.color}`} />
                        </div>
                        <span className={`text-[10px] font-semibold ${active ? "text-primary" : "text-foreground"}`}>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount + Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Amount</p>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <input
                      type="number"
                      inputMode="decimal"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0"
                      className="w-full h-11 pl-9 pr-3 rounded-xl bg-card ring-1 ring-border text-[15px] font-bold outline-none focus:ring-primary"
                    />
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Date</p>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl bg-card ring-1 ring-border text-[13px] outline-none focus:ring-primary"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Description</p>
                <input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Cab to Sharma wedding venue"
                  className="w-full h-11 px-3 rounded-xl bg-card ring-1 ring-border text-[13px] outline-none focus:ring-primary"
                />
              </div>

              {/* Paid to */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Paid to <span className="opacity-50 normal-case">(optional)</span></p>
                <input
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                  placeholder="Vendor / shop name"
                  className="w-full h-11 px-3 rounded-xl bg-card ring-1 ring-border text-[13px] outline-none focus:ring-primary"
                />
              </div>

              {/* Notes */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notes <span className="opacity-50 normal-case">(optional)</span></p>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any context for the approver..."
                  className="w-full px-3 py-2.5 rounded-xl bg-card ring-1 ring-border text-[13px] outline-none focus:ring-primary resize-none"
                />
              </div>

              {/* Receipt upload */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Receipt</p>
                <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} className="hidden" />
                {receiptFile ? (
                  <div className="relative bg-card ring-1 ring-border rounded-2xl p-3 flex items-center gap-3">
                    {receiptPreview ? (
                      <img src={receiptPreview} alt="receipt" className="h-12 w-12 rounded-xl object-cover" />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold truncate">{receiptFile.name}</p>
                      <p className="text-[10px] text-muted-foreground">{(receiptFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button onClick={() => handleFile(null)} className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="h-20 rounded-2xl bg-card ring-1 ring-dashed ring-border flex flex-col items-center justify-center gap-1 text-muted-foreground active:scale-95 transition-transform"
                    >
                      <Upload className="h-4 w-4" />
                      <span className="text-[11px] font-semibold">Upload</span>
                    </button>
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="h-20 rounded-2xl bg-card ring-1 ring-dashed ring-border flex flex-col items-center justify-center gap-1 text-muted-foreground active:scale-95 transition-transform"
                    >
                      <Camera className="h-4 w-4" />
                      <span className="text-[11px] font-semibold">Capture</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Approval flow preview */}
              <div className="bg-primary/5 ring-1 ring-primary/20 rounded-2xl p-3.5">
                <p className="text-[10px] uppercase tracking-wider font-bold text-primary mb-2">Approval Flow</p>
                <div className="flex items-center justify-between text-[10.5px]">
                  {["You", "Lead", "Admin", "Paid"].map((s, i) => (
                    <div key={s} className="flex items-center">
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] ${i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {i + 1}
                      </div>
                      <span className="ml-1.5 font-semibold text-foreground">{s}</span>
                      {i < 3 && <div className="w-4 h-px bg-border mx-1.5" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" onClick={() => { resetForm(); setTab("history"); }} className="rounded-xl h-11">
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} className="rounded-xl h-11 font-bold">
                  {submitting ? "Submitting..." : (<><Check className="h-4 w-4 mr-1" /> Submit</>)}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
