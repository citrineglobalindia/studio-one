import { useState, useMemo } from "react";
import { sampleProjects, type Payment, type PaymentStatus, type PaymentType, type PaymentMode } from "@/data/wedding-types";
import { sampleClients } from "@/data/clients-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  IndianRupee, Plus, FileText, CheckCircle2, Clock, AlertCircle,
  ArrowUpRight, CalendarDays, CreditCard, Banknote, Smartphone, Building2,
  Download, Send, Search, Eye, Printer, Copy, Receipt,
} from "lucide-react";

// ─── Config ───
const statusConfig: Record<PaymentStatus, { label: string; icon: typeof Clock; class: string }> = {
  paid: { label: "Paid", icon: CheckCircle2, class: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30" },
  pending: { label: "Pending", icon: Clock, class: "text-muted-foreground bg-muted border-border" },
  overdue: { label: "Overdue", icon: AlertCircle, class: "text-red-400 bg-red-500/20 border-red-500/30" },
  partial: { label: "Partial", icon: IndianRupee, class: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30" },
};

const typeConfig: Record<PaymentType, { label: string; class: string }> = {
  advance: { label: "Advance", class: "bg-primary/15 text-primary border-primary/30" },
  milestone: { label: "Milestone", class: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  final: { label: "Final", class: "bg-purple-500/15 text-purple-400 border-purple-500/30" },
};

const modeIcons: Record<string, typeof CreditCard> = {
  upi: Smartphone, "bank-transfer": Building2, cash: Banknote, cheque: FileText, card: CreditCard,
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  client: string;
  project: string;
  items: { description: string; amount: number }[];
  totalAmount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "partial";
  issueDate: string;
  dueDate: string;
  paidAmount: number;
  paymentMode?: string;
  notes?: string;
}

// Generate invoice records from project payments
const generateInvoices = (): InvoiceRecord[] => {
  return sampleProjects.flatMap(project =>
    project.payments.filter(p => p.invoiceNumber).map(p => ({
      id: p.id,
      invoiceNumber: p.invoiceNumber!,
      client: `${project.clientName} & ${project.partnerName}`,
      project: project.package,
      items: [{ description: p.label, amount: p.amount }],
      totalAmount: p.amount,
      status: (p.status === "paid" ? "paid" : new Date(p.dueDate) < new Date() ? "overdue" : p.paidAmount > 0 ? "partial" : "draft") as InvoiceRecord["status"],
      issueDate: project.createdAt,
      dueDate: p.dueDate,
      paidAmount: p.paidAmount,
      paymentMode: p.mode,
    }))
  );
};

const InvoicesPage = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(generateInvoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [viewInvoice, setViewInvoice] = useState<InvoiceRecord | null>(null);

  // Create invoice form
  const [newClient, setNewClient] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newType, setNewType] = useState<PaymentType>("milestone");
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Record payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("");
  const [payReference, setPayReference] = useState("");

  const allPayments = sampleProjects.flatMap(project =>
    project.payments.map(payment => ({ ...payment, clientName: `${project.clientName} & ${project.partnerName}`, projectId: project.id }))
  );

  const totalRevenue = allPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalCollected = allPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const totalPending = totalRevenue - totalCollected;
  const overduePayments = allPayments.filter(p => p.status !== "paid" && new Date(p.dueDate) < new Date());
  const overdueAmount = overduePayments.reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (search && !`${inv.client} ${inv.invoiceNumber} ${inv.project}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeTab === "pending") return ["draft", "partial"].includes(inv.status);
      if (activeTab === "overdue") return inv.status === "overdue";
      if (activeTab === "paid") return inv.status === "paid";
      return true;
    });
  }, [invoices, search, activeTab]);

  const clientNames = [...new Set([...sampleClients.map(c => c.name), ...sampleProjects.map(p => p.clientName)])];

  const handleCreateInvoice = () => {
    if (!newClient || !newDescription || !newAmount || !newDueDate) {
      toast.error("Fill all required fields"); return;
    }
    const inv: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${String(invoices.length + 1).padStart(3, "0")}`,
      client: newClient,
      project: newProject,
      items: [{ description: newDescription, amount: parseFloat(newAmount) }],
      totalAmount: parseFloat(newAmount),
      status: "draft",
      issueDate: new Date().toISOString().split("T")[0],
      dueDate: newDueDate,
      paidAmount: 0,
      notes: newNotes || undefined,
    };
    setInvoices(prev => [inv, ...prev]);
    toast.success("Invoice created!", { description: inv.invoiceNumber });
    setCreateOpen(false);
    setNewClient(""); setNewProject(""); setNewDescription(""); setNewAmount(""); setNewDueDate(""); setNewNotes("");
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice || !payAmount || !payMode) {
      toast.error("Fill all required fields"); return;
    }
    const amt = parseFloat(payAmount);
    setInvoices(prev => prev.map(inv => {
      if (inv.id !== selectedInvoice.id) return inv;
      const newPaid = inv.paidAmount + amt;
      return {
        ...inv,
        paidAmount: newPaid,
        status: newPaid >= inv.totalAmount ? "paid" : "partial",
        paymentMode: payMode,
      };
    }));
    toast.success("Payment recorded!", { description: `${fmt(amt)} via ${payMode}` });
    setRecordPaymentOpen(false);
    setSelectedInvoice(null);
    setPayAmount(""); setPayMode(""); setPayReference("");
  };

  const handleSendInvoice = (inv: InvoiceRecord) => {
    setInvoices(prev => prev.map(i => i.id === inv.id ? { ...i, status: i.status === "draft" ? "sent" as any : i.status } : i));
    toast.success("Invoice sent to client!", { description: `${inv.invoiceNumber} → ${inv.client}` });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Invoices & Payments</h1>
            <p className="text-sm text-muted-foreground">Create invoices, record payments, track milestones</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success("All invoices exported")}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> New Invoice
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Revenue", value: fmt(totalRevenue), color: "text-foreground", sub: `${allPayments.length} invoices` },
          { label: "Collected", value: fmt(totalCollected), color: "text-emerald-500", pct: totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0 },
          { label: "Pending", value: fmt(totalPending), color: "text-amber-500", sub: `${allPayments.filter(p => p.status === "pending").length} pending` },
          { label: "Overdue", value: fmt(overdueAmount), color: "text-red-500", sub: `${overduePayments.length} overdue` },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
              <p className={cn("text-xl font-bold mt-1", s.color)}>{s.value}</p>
              {s.pct !== undefined && <Progress value={s.pct} className="h-1.5 mt-2" />}
              {s.sub && <p className="text-[10px] text-muted-foreground mt-1">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Filter Tabs + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {[
            { key: "all", label: "All", count: invoices.length },
            { key: "pending", label: "Pending", count: invoices.filter(i => ["draft", "partial"].includes(i.status)).length },
            { key: "overdue", label: "Overdue", count: invoices.filter(i => i.status === "overdue").length },
            { key: "paid", label: "Paid", count: invoices.filter(i => i.status === "paid").length },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                "flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all",
                activeTab === t.key ? "bg-primary/15 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:border-primary/20"
              )}
            >
              {t.label} <span className="text-[9px] opacity-60">{t.count}</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
      </div>

      {/* Invoice Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No invoices found</TableCell></TableRow>
              )}
              {filteredInvoices.map((inv) => {
                const isOverdue = inv.status !== "paid" && new Date(inv.dueDate) < new Date();
                return (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setViewInvoice(inv)}>
                    <TableCell>
                      <span className="text-sm font-mono font-medium text-primary">{inv.invoiceNumber}</span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{inv.client}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.project}</TableCell>
                    <TableCell className="text-sm font-bold text-foreground">{fmt(inv.totalAmount)}</TableCell>
                    <TableCell className="text-sm font-medium text-emerald-500">{fmt(inv.paidAmount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(inv.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]",
                        inv.status === "paid" ? statusConfig.paid.class :
                        isOverdue ? statusConfig.overdue.class :
                        inv.status === "partial" ? statusConfig.partial.class :
                        statusConfig.pending.class
                      )}>
                        {isOverdue ? "Overdue" : inv.status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {inv.status !== "paid" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setSelectedInvoice(inv); setRecordPaymentOpen(true); }}>
                            <IndianRupee className="h-3 w-3 mr-1" /> Pay
                          </Button>
                        )}
                        {inv.status === "draft" && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleSendInvoice(inv)}>
                            <Send className="h-3 w-3 mr-1" /> Send
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per-Project Breakdown */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Project-wise Breakdown</h2>
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
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
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
                  const tCfg = typeConfig[payment.type];
                  const ModeIcon = payment.mode ? modeIcons[payment.mode] || CreditCard : CreditCard;
                  return (
                    <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 gap-2 hover:bg-muted/20">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", tCfg.class)}>
                          <IndianRupee className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{payment.label}</p>
                            <Badge variant="outline" className={cn("text-[9px] px-1.5 py-0", tCfg.class)}>{tCfg.label}</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                            {payment.invoiceNumber && <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{payment.invoiceNumber}</span>}
                            <span className="flex items-center gap-1">
                              <CalendarDays className="h-3 w-3" />
                              Due {new Date(payment.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </span>
                            {payment.paidDate && (
                              <span className="flex items-center gap-1"><ModeIcon className="h-3 w-3" /> Paid {new Date(payment.paidDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-medium text-foreground">{fmt(payment.amount)}</p>
                          {payment.paidAmount > 0 && payment.paidAmount < payment.amount && (
                            <p className="text-xs text-muted-foreground">{fmt(payment.paidAmount)} paid</p>
                          )}
                        </div>
                        <Badge variant="outline" className={cn("text-[10px] gap-1", isOverdue ? statusConfig.overdue.class : statusConfig[payment.status].class)}>
                          {isOverdue ? "Overdue" : statusConfig[payment.status].label}
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

      {/* ═══ CREATE INVOICE SHEET ═══ */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Invoice</SheetTitle>
            <SheetDescription>Generate a new invoice for a client</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Client *</Label>
              <Select value={newClient} onValueChange={setNewClient}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>{clientNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project / Package</Label>
              <Select value={newProject} onValueChange={setNewProject}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {sampleProjects.map(p => <SelectItem key={p.id} value={p.package}>{p.package} - {p.clientName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Payment Type</Label>
              <Select value={newType} onValueChange={(v) => setNewType(v as PaymentType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Input placeholder="e.g., Booking Advance Payment" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input type="number" placeholder="0" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Due Date *</Label>
                <Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea placeholder="Additional notes..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} />
            </div>
            {newAmount && (
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">Invoice Preview</p>
                  <div className="flex justify-between mt-1">
                    <span className="text-sm font-medium">{newDescription || "Invoice"}</span>
                    <span className="text-sm font-bold">{fmt(parseFloat(newAmount) || 0)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Client: {newClient || "—"} · Due: {newDueDate || "—"}</p>
                </CardContent>
              </Card>
            )}
            <Button className="w-full" onClick={handleCreateInvoice}>
              <Plus className="h-4 w-4 mr-1" /> Create Invoice
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ═══ RECORD PAYMENT SHEET ═══ */}
      <Sheet open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Payment</SheetTitle>
            <SheetDescription>
              {selectedInvoice && `${selectedInvoice.invoiceNumber} - ${selectedInvoice.client}`}
            </SheetDescription>
          </SheetHeader>
          {selectedInvoice && (
            <div className="space-y-4 mt-4">
              <Card className="bg-muted/30">
                <CardContent className="p-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Invoice Total</span>
                    <span className="text-sm font-bold">{fmt(selectedInvoice.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Already Paid</span>
                    <span className="text-sm font-medium text-emerald-500">{fmt(selectedInvoice.paidAmount)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <span className="text-xs font-medium">Balance Due</span>
                    <span className="text-sm font-bold text-amber-500">{fmt(selectedInvoice.totalAmount - selectedInvoice.paidAmount)}</span>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input type="number" placeholder={String(selectedInvoice.totalAmount - selectedInvoice.paidAmount)} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Payment Mode *</Label>
                <Select value={payMode} onValueChange={setPayMode}>
                  <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference / Transaction ID</Label>
                <Input placeholder="TXN-XXXXXXX" value={payReference} onChange={(e) => setPayReference(e.target.value)} />
              </div>
              <Button className="w-full" onClick={handleRecordPayment}>
                <CheckCircle2 className="h-4 w-4 mr-1" /> Record Payment
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══ VIEW INVOICE DIALOG ═══ */}
      <Dialog open={!!viewInvoice} onOpenChange={(o) => !o && setViewInvoice(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {viewInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium text-foreground">{viewInvoice.client}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Project</p>
                  <p className="font-medium text-foreground">{viewInvoice.project}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Issue Date</p>
                  <p className="font-medium text-foreground">{viewInvoice.issueDate}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="font-medium text-foreground">{viewInvoice.dueDate}</p>
                </div>
              </div>
              <div className="border border-border rounded-lg p-3 space-y-2">
                {viewInvoice.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.description}</span>
                    <span className="font-bold">{fmt(item.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span>{fmt(viewInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-emerald-500 font-medium">{fmt(viewInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Balance</span>
                  <span className="text-amber-500">{fmt(viewInvoice.totalAmount - viewInvoice.paidAmount)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {viewInvoice.status !== "paid" && (
                  <Button size="sm" className="flex-1" onClick={() => { setSelectedInvoice(viewInvoice); setRecordPaymentOpen(true); setViewInvoice(null); }}>
                    <IndianRupee className="h-3.5 w-3.5 mr-1" /> Record Payment
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { toast.success("Invoice PDF downloaded"); }}>
                  <Download className="h-3.5 w-3.5 mr-1" /> Download
                </Button>
                <Button size="sm" variant="outline" onClick={() => { toast.success("Copied invoice link"); }}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoicesPage;
