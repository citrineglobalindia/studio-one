import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sampleProjects, type Payment, type PaymentStatus, type PaymentType } from "@/data/wedding-types";
import { sampleClients } from "@/data/clients-data";
import { useRole } from "@/contexts/RoleContext";
import {
  Search, IndianRupee, FileText, CheckCircle2, Clock, AlertCircle,
  TrendingUp, Download, CreditCard, Receipt, ArrowUpRight,
  Plus, CalendarDays, Building2, Banknote, Smartphone, Eye,
  ThumbsUp, ThumbsDown, Wallet, BookOpen, Filter,
  BarChart3, PieChart, ArrowDownRight, ArrowUpDown, X, Check,
} from "lucide-react";

// ─── Types ───
interface Expense {
  id: string;
  client_name: string;
  event_name: string | null;
  project_name: string | null;
  category: string;
  description: string;
  amount: number;
  submitted_by: string;
  paid_to: string | null;
  expense_date: string;
  approval_status: string;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
}

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const expenseCategories = [
  "Equipment", "Travel", "Venue", "Catering", "Decoration",
  "Printing", "Software", "Rent", "Supplies", "Salary", "Marketing", "Other",
];

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  approved: "bg-green-500/10 text-green-600 border-green-200",
  rejected: "bg-red-500/10 text-red-600 border-red-200",
};

const paymentStatusConfig: Record<PaymentStatus, { label: string; class: string }> = {
  paid: { label: "Paid", class: "text-emerald-500 bg-emerald-500/15 border-emerald-500/30" },
  pending: { label: "Pending", class: "text-muted-foreground bg-muted border-border" },
  overdue: { label: "Overdue", class: "text-red-500 bg-red-500/15 border-red-500/30" },
  partial: { label: "Partial", class: "text-yellow-500 bg-yellow-500/15 border-yellow-500/30" },
};

const modeIcons: Record<string, typeof CreditCard> = {
  upi: Smartphone,
  "bank-transfer": Building2,
  cash: Banknote,
  cheque: FileText,
  card: CreditCard,
};

// ─── Component ───
const AccountsPage = () => {
  const navigate = useNavigate();
  const { currentRole, isAdmin } = useRole();
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Expenses from DB
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);

  // Add expense sheet
  const [addExpenseOpen, setAddExpenseOpen] = useState(false);
  const [expClient, setExpClient] = useState("");
  const [expEvent, setExpEvent] = useState("");
  const [expProject, setExpProject] = useState("");
  const [expCategory, setExpCategory] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expPaidTo, setExpPaidTo] = useState("");
  const [expNotes, setExpNotes] = useState("");
  const [expSubmittedBy, setExpSubmittedBy] = useState(currentRole || "Staff");

  // Approval dialog
  const [approvalExpense, setApprovalExpense] = useState<Expense | null>(null);

  // Fetch expenses
  const fetchExpenses = async () => {
    setLoadingExpenses(true);
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setExpenses(data as any);
    if (error) console.error(error);
    setLoadingExpenses(false);
  };

  useEffect(() => { fetchExpenses(); }, []);

  // Submit expense
  const handleSubmitExpense = async () => {
    if (!expClient || !expCategory || !expDescription || !expAmount) {
      toast.error("Fill all required fields");
      return;
    }
    const { error } = await supabase.from("expenses").insert({
      client_name: expClient,
      event_name: expEvent || null,
      project_name: expProject || null,
      category: expCategory,
      description: expDescription,
      amount: parseFloat(expAmount),
      submitted_by: expSubmittedBy,
      paid_to: expPaidTo || null,
      notes: expNotes || null,
    });
    if (error) { toast.error("Failed to submit expense"); return; }
    toast.success("Expense submitted for approval!");
    setAddExpenseOpen(false);
    resetExpenseForm();
    fetchExpenses();
  };

  const resetExpenseForm = () => {
    setExpClient(""); setExpEvent(""); setExpProject(""); setExpCategory("");
    setExpDescription(""); setExpAmount(""); setExpPaidTo(""); setExpNotes("");
  };

  // Approve / Reject
  const handleApproval = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("expenses").update({
      approval_status: status,
      approved_by: "Admin",
      approved_at: new Date().toISOString(),
    }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    toast.success(`Expense ${status}`);
    setApprovalExpense(null);
    fetchExpenses();
  };

  // ─── Computed data ───
  // Payments from mock data
  const allPayments = sampleProjects.flatMap((p) =>
    p.payments.map((pay) => ({ ...pay, clientName: `${p.clientName} & ${p.partnerName}`, projectId: p.id, projectName: p.package }))
  );

  const totalRevenue = allPayments.filter(p => p.status === "paid").reduce((s, p) => s + p.paidAmount, 0);
  const totalPending = allPayments.filter(p => p.status !== "paid").reduce((s, p) => s + (p.amount - p.paidAmount), 0);
  const approvedExpenses = expenses.filter(e => e.approval_status === "approved").reduce((s, e) => s + Number(e.amount), 0);
  const pendingExpenseCount = expenses.filter(e => e.approval_status === "pending").length;
  const netProfit = totalRevenue - approvedExpenses;

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (search && !`${e.description} ${e.client_name} ${e.category}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && e.approval_status !== statusFilter) return false;
      return true;
    });
  }, [expenses, search, statusFilter]);

  // Project-wise P&L
  const projectPL = useMemo(() => {
    return sampleProjects.filter(p => p.payments.length > 0).map(project => {
      const income = project.payments.reduce((s, p) => s + p.paidAmount, 0);
      const projectExpenses = expenses
        .filter(e => e.approval_status === "approved" && (e.client_name === project.clientName || e.project_name === project.package))
        .reduce((s, e) => s + Number(e.amount), 0);
      return {
        id: project.id,
        name: `${project.clientName} & ${project.partnerName}`,
        package: project.package,
        totalAmount: project.totalAmount,
        income,
        expenses: projectExpenses,
        profit: income - projectExpenses,
        paidPct: project.totalAmount > 0 ? Math.round((income / project.totalAmount) * 100) : 0,
      };
    });
  }, [expenses]);

  // Ledger entries — merge payments and approved expenses into chronological list
  const ledgerEntries = useMemo(() => {
    const entries: { date: string; type: "income" | "expense"; description: string; client: string; amount: number; balance?: number }[] = [];
    
    allPayments.filter(p => p.status === "paid" && p.paidDate).forEach(p => {
      entries.push({ date: p.paidDate!, type: "income", description: `${p.label} (${p.invoiceNumber || "N/A"})`, client: p.clientName, amount: p.paidAmount });
    });

    expenses.filter(e => e.approval_status === "approved").forEach(e => {
      entries.push({ date: e.expense_date, type: "expense", description: `${e.description} - ${e.category}`, client: e.client_name, amount: Number(e.amount) });
    });

    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let balance = 0;
    entries.forEach(e => {
      balance += e.type === "income" ? e.amount : -e.amount;
      e.balance = balance;
    });

    return entries;
  }, [expenses]);

  // Client list for expense form
  const clientNames = [...new Set([
    ...sampleClients.map(c => c.name),
    ...sampleProjects.map(p => p.clientName),
  ])];

  // Event names linked to selected client
  const clientEvents = useMemo(() => {
    const project = sampleProjects.find(p => p.clientName === expClient);
    return project ? project.subEvents.map(se => se.name) : [];
  }, [expClient]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded" />
          <div>
            <h1 className="text-foreground text-xl font-semibold">Accounts</h1>
            <p className="text-muted-foreground text-sm">Invoices, Expenses, Payments & Ledger</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddExpenseOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Add Expense
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.success("Report exported")}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Total Income", value: fmt(totalRevenue), icon: TrendingUp, color: "bg-green-500/10 text-green-600" },
          { label: "Pending Dues", value: fmt(totalPending), icon: Clock, color: "bg-amber-500/10 text-amber-600" },
          { label: "Total Expenses", value: fmt(approvedExpenses), icon: Receipt, color: "bg-blue-500/10 text-blue-600" },
          { label: "Net Profit", value: fmt(netProfit), icon: netProfit >= 0 ? ArrowUpRight : ArrowDownRight, color: netProfit >= 0 ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-500" },
          { label: "Pending Approvals", value: String(pendingExpenseCount), icon: AlertCircle, color: "bg-orange-500/10 text-orange-600" },
        ].map((k) => (
          <Card key={k.label}>
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <div className={`w-9 h-9 rounded-xl ${k.color} flex items-center justify-center shrink-0`}><k.icon className="h-4 w-4" /></div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground truncate">{k.value}</p>
                  <p className="text-[10px] text-muted-foreground">{k.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={(t) => { setActiveTab(t); setSearch(""); setStatusFilter("all"); }}>
        <TabsList className="bg-card border border-border flex-wrap h-auto">
          <TabsTrigger value="overview" className="gap-1 text-xs"><BarChart3 className="h-3.5 w-3.5" /> Overview</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-1 text-xs"><FileText className="h-3.5 w-3.5" /> Invoices</TabsTrigger>
          <TabsTrigger value="payments" className="gap-1 text-xs"><CreditCard className="h-3.5 w-3.5" /> Payments</TabsTrigger>
          <TabsTrigger value="expenses" className="gap-1 text-xs"><Receipt className="h-3.5 w-3.5" /> Expenses</TabsTrigger>
          <TabsTrigger value="project-pl" className="gap-1 text-xs"><PieChart className="h-3.5 w-3.5" /> Project P&L</TabsTrigger>
          <TabsTrigger value="ledger" className="gap-1 text-xs"><BookOpen className="h-3.5 w-3.5" /> Ledger</TabsTrigger>
        </TabsList>

        {/* ═══ OVERVIEW ═══ */}
        <TabsContent value="overview" className="space-y-6 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Recent Payments</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {allPayments.filter(p => p.status === "paid").slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{p.clientName}</p>
                      <p className="text-xs text-muted-foreground">{p.label} · {p.paidDate}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{fmt(p.paidAmount)}</p>
                      <Badge variant="outline" className={cn("text-[10px]", paymentStatusConfig[p.status].class)}>{paymentStatusConfig[p.status].label}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Recent Expenses</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {expenses.slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{e.client_name} · {e.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">{fmt(Number(e.amount))}</p>
                      <Badge variant="outline" className={cn("text-[10px]", statusColors[e.approval_status])}>{e.approval_status}</Badge>
                    </div>
                  </div>
                ))}
                {expenses.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No expenses yet</p>}
              </CardContent>
            </Card>
          </div>
          
          {/* Pending Approvals for Admin */}
          {isAdmin && expenses.filter(e => e.approval_status === "pending").length > 0 && (
            <Card className="border-amber-500/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                  Pending Expense Approvals ({expenses.filter(e => e.approval_status === "pending").length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {expenses.filter(e => e.approval_status === "pending").map((e) => (
                  <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div>
                      <p className="text-sm font-medium text-foreground">{e.description}</p>
                      <p className="text-xs text-muted-foreground">{e.client_name} · {e.category} · by {e.submitted_by}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground mr-2">{fmt(Number(e.amount))}</p>
                      <Button size="sm" variant="outline" className="h-7 text-green-600 border-green-300 hover:bg-green-50" onClick={() => handleApproval(e.id, "approved")}>
                        <Check className="h-3 w-3 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-red-600 border-red-300 hover:bg-red-50" onClick={() => handleApproval(e.id, "rejected")}>
                        <X className="h-3 w-3 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ═══ INVOICES ═══ */}
        <TabsContent value="invoices" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Revenue", value: fmt(allPayments.reduce((s, p) => s + p.amount, 0)), color: "text-foreground" },
              { label: "Collected", value: fmt(totalRevenue), color: "text-emerald-500" },
              { label: "Pending", value: fmt(totalPending), color: "text-amber-500" },
              { label: "Overdue", value: fmt(allPayments.filter(p => p.status !== "paid" && new Date(p.dueDate) < new Date()).reduce((s, p) => s + (p.amount - p.paidAmount), 0)), color: "text-red-500" },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-card border border-border p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <p className={cn("text-lg font-bold mt-1", s.color)}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            {sampleProjects.filter(p => p.payments.length > 0).map((project) => {
              const projectPaid = project.payments.reduce((s, p) => s + p.paidAmount, 0);
              const projectTotal = project.payments.reduce((s, p) => s + p.amount, 0);
              const pct = projectTotal > 0 ? Math.round((projectPaid / projectTotal) * 100) : 0;

              return (
                <Card key={project.id}>
                  <div className="flex items-center justify-between p-3 border-b border-border cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/projects/${project.id}`)}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{project.clientName} & {project.partnerName}</h3>
                      <Badge variant="outline" className="text-[10px]">{project.package}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-foreground">{fmt(projectPaid)} / {fmt(projectTotal)}</span>
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-500" : "bg-primary")} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-0 divide-y divide-border">
                    {project.payments.map((payment) => {
                      const isOverdue = payment.status !== "paid" && new Date(payment.dueDate) < new Date();
                      const ModeIcon = payment.mode ? modeIcons[payment.mode] || CreditCard : CreditCard;
                      return (
                        <div key={payment.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20">
                          <div className="flex items-center gap-2">
                            <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium text-foreground">{payment.label}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <CalendarDays className="h-3 w-3" />
                                Due {new Date(payment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                                {payment.paidDate && <><ModeIcon className="h-3 w-3 ml-2" /> Paid {new Date(payment.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</>}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-bold text-foreground">{fmt(payment.amount)}</p>
                            <Badge variant="outline" className={cn("text-[10px]", isOverdue ? paymentStatusConfig.overdue.class : paymentStatusConfig[payment.status].class)}>
                              {isOverdue ? "Overdue" : paymentStatusConfig[payment.status].label}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* ═══ PAYMENTS ═══ */}
        <TabsContent value="payments" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payment Verification & History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPayments.map((p) => {
                    const isOverdue = p.status !== "paid" && new Date(p.dueDate) < new Date();
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="text-sm font-medium text-foreground">{p.clientName}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{p.invoiceNumber || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]",
                            p.type === "advance" ? "bg-primary/15 text-primary border-primary/30" :
                            p.type === "milestone" ? "bg-blue-500/15 text-blue-400 border-blue-500/30" :
                            "bg-purple-500/15 text-purple-400 border-purple-500/30"
                          )}>{p.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-bold text-foreground">{fmt(p.amount)}</p>
                          {p.paidAmount > 0 && p.paidAmount < p.amount && <p className="text-[10px] text-emerald-500">{fmt(p.paidAmount)} paid</p>}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.mode || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.paidDate || p.dueDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cn("text-[10px]", isOverdue ? paymentStatusConfig.overdue.class : paymentStatusConfig[p.status].class)}>
                            {isOverdue ? "Overdue" : paymentStatusConfig[p.status].label}
                          </Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {p.status === "pending" && (
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-green-600" onClick={() => toast.success(`Payment verified for ${p.clientName}`)}>
                                <Check className="h-3 w-3 mr-1" /> Verify
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ EXPENSES ═══ */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={() => setAddExpenseOpen(true)}>
              <Plus className="h-4 w-4 mr-1" /> Add Expense
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Client / Event</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Submitted By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    {isAdmin && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.length === 0 && (
                    <TableRow><TableCell colSpan={isAdmin ? 8 : 7} className="text-center text-muted-foreground py-8">No expenses found</TableCell></TableRow>
                  )}
                  {filteredExpenses.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>
                        <p className="text-sm font-medium text-foreground">{e.description}</p>
                        {e.paid_to && <p className="text-xs text-muted-foreground">Paid to: {e.paid_to}</p>}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-foreground">{e.client_name}</p>
                        {e.event_name && <p className="text-xs text-muted-foreground">{e.event_name}</p>}
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px]">{e.category}</Badge></TableCell>
                      <TableCell className="text-sm font-bold">{fmt(Number(e.amount))}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.submitted_by}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.expense_date}</TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-[10px]", statusColors[e.approval_status])}>{e.approval_status}</Badge></TableCell>
                      {isAdmin && (
                        <TableCell>
                          {e.approval_status === "pending" ? (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-green-600" onClick={() => handleApproval(e.id, "approved")}><Check className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={() => handleApproval(e.id, "rejected")}><X className="h-3.5 w-3.5" /></Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">{e.approved_by && `by ${e.approved_by}`}</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ PROJECT P&L ═══ */}
        <TabsContent value="project-pl" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 gap-3">
            {projectPL.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.package} · Total: {fmt(p.totalAmount)}</p>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Income</p>
                      <p className="text-sm font-bold text-green-600">{fmt(p.income)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Expenses</p>
                      <p className="text-sm font-bold text-red-500">{fmt(p.expenses)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Profit</p>
                      <p className={cn("text-sm font-bold", p.profit >= 0 ? "text-emerald-600" : "text-red-500")}>
                        {p.profit >= 0 ? "+" : ""}{fmt(p.profit)}
                      </p>
                    </div>
                    <div className="w-20">
                      <p className="text-[10px] text-muted-foreground mb-1">Collected {p.paidPct}%</p>
                      <Progress value={p.paidPct} className="h-1.5" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Totals */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Total Summary</h3>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-muted-foreground">Total Income</p>
                      <p className="text-base font-bold text-green-600">{fmt(totalRevenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Expenses</p>
                      <p className="text-base font-bold text-red-500">{fmt(approvedExpenses)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Net Profit</p>
                      <p className={cn("text-base font-bold", netProfit >= 0 ? "text-emerald-600" : "text-red-500")}>
                        {netProfit >= 0 ? "+" : ""}{fmt(netProfit)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ LEDGER ═══ */}
        <TabsContent value="ledger" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> General Ledger
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Credit (Income)</TableHead>
                    <TableHead className="text-right">Debit (Expense)</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledgerEntries.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No entries yet</TableCell></TableRow>
                  )}
                  {ledgerEntries.map((entry, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-sm text-muted-foreground">{new Date(entry.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}</TableCell>
                      <TableCell className="text-sm font-medium text-foreground">{entry.description}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{entry.client}</TableCell>
                      <TableCell className="text-sm text-right font-medium text-green-600">
                        {entry.type === "income" ? fmt(entry.amount) : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-right font-medium text-red-500">
                        {entry.type === "expense" ? fmt(entry.amount) : "—"}
                      </TableCell>
                      <TableCell className={cn("text-sm text-right font-bold", (entry.balance ?? 0) >= 0 ? "text-foreground" : "text-red-500")}>
                        {fmt(entry.balance ?? 0)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ═══ ADD EXPENSE SHEET ═══ */}
      <Sheet open={addExpenseOpen} onOpenChange={setAddExpenseOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Add Expense</SheetTitle>
            <SheetDescription>Submit an expense for admin approval</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={expClient} onValueChange={(v) => { setExpClient(v); setExpEvent(""); }}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clientNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {clientEvents.length > 0 && (
              <div className="space-y-2">
                <Label>Event</Label>
                <Select value={expEvent} onValueChange={setExpEvent}>
                  <SelectTrigger><SelectValue placeholder="Select event (optional)" /></SelectTrigger>
                  <SelectContent>
                    {clientEvents.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Project Name</Label>
              <Input placeholder="e.g., Royal Wedding Package" value={expProject} onChange={(e) => setExpProject(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={expCategory} onValueChange={setExpCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Input placeholder="What was the expense for?" value={expDescription} onChange={(e) => setExpDescription(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input type="number" placeholder="0" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Paid To</Label>
                <Input placeholder="Vendor / Person" value={expPaidTo} onChange={(e) => setExpPaidTo(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Submitted By</Label>
              <Input value={expSubmittedBy} onChange={(e) => setExpSubmittedBy(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional details..." value={expNotes} onChange={(e) => setExpNotes(e.target.value)} />
            </div>

            {/* Summary */}
            {expAmount && (
              <Card className="bg-muted/30">
                <CardContent className="p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Expense Summary</p>
                  <div className="flex justify-between">
                    <span className="text-sm">{expDescription || "Expense"}</span>
                    <span className="text-sm font-bold">{fmt(parseFloat(expAmount) || 0)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Client: {expClient || "—"} · Category: {expCategory || "—"}</p>
                  <Badge variant="outline" className={statusColors.pending + " text-[10px] mt-1"}>Will be sent for approval</Badge>
                </CardContent>
              </Card>
            )}

            <Button className="w-full" onClick={handleSubmitExpense}>
              <Plus className="h-4 w-4 mr-1" /> Submit Expense
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AccountsPage;
