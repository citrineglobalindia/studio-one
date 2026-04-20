import { useState, useMemo } from "react";
import { useInvoices, type InvoiceRow } from "@/hooks/useInvoices";
import { DocumentBuilder } from "@/components/documents/DocumentBuilder";
import type { DocumentLineItem } from "@/components/documents/DocumentTemplate";
import { supabase } from "@/integrations/supabase/client";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useOrg } from "@/contexts/OrgContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  IndianRupee, Plus, FileText, CheckCircle2, Clock, AlertCircle,
  Download, Send, Search, Printer, Copy, Receipt,
} from "lucide-react";

const statusStyles: Record<string, string> = {
  paid: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
  pending: "text-muted-foreground bg-muted border-border",
  draft: "text-muted-foreground bg-muted border-border",
  sent: "text-blue-400 bg-blue-500/20 border-blue-500/30",
  overdue: "text-red-400 bg-red-500/20 border-red-500/30",
  partial: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const InvoicesPage = () => {
  const { organization } = useOrg();
  const { invoices, isLoading, createInvoice, updateInvoice } = useInvoices();
  const { clients } = useClients();
  const { projects } = useProjects();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [recordPaymentOpen, setRecordPaymentOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [viewInvoice, setViewInvoice] = useState<InvoiceRow | null>(null);
  const [pdfInvoice, setPdfInvoice] = useState<InvoiceRow | null>(null);

  // Create form
  const [newClient, setNewClient] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("");
  const [payReference, setPayReference] = useState("");

  const getEffectiveStatus = (inv: InvoiceRow) => {
    if (inv.status === "paid") return "paid";
    if (inv.amount_paid > 0 && inv.amount_paid < inv.total_amount) return "partial";
    if (inv.due_date && new Date(inv.due_date) < new Date() && inv.status !== "paid") return "overdue";
    return inv.status;
  };

  const totalRevenue = invoices.reduce((s, i) => s + i.total_amount, 0);
  const totalCollected = invoices.reduce((s, i) => s + i.amount_paid, 0);
  const totalPending = totalRevenue - totalCollected;
  const overdueInvoices = invoices.filter(i => getEffectiveStatus(i) === "overdue");
  const overdueAmount = overdueInvoices.reduce((s, i) => s + (i.total_amount - i.amount_paid), 0);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (search && !`${inv.client_name} ${inv.invoice_number} ${inv.project_name || ""}`.toLowerCase().includes(search.toLowerCase())) return false;
      const status = getEffectiveStatus(inv);
      if (activeTab === "pending") return ["draft", "partial", "sent"].includes(status);
      if (activeTab === "overdue") return status === "overdue";
      if (activeTab === "paid") return status === "paid";
      return true;
    });
  }, [invoices, search, activeTab]);

  const handleCreateInvoice = () => {
    if (!newClient || !newDescription || !newAmount || !newDueDate || !organization) {
      toast.error("Fill all required fields"); return;
    }
    const count = invoices.length;
    createInvoice.mutate({
      organization_id: organization.id,
      client_id: null,
      project_id: null,
      invoice_number: `INV-2026-${String(count + 1).padStart(3, "0")}`,
      client_name: newClient,
      project_name: newProject || null,
      items: [{ description: newDescription, amount: parseFloat(newAmount) }] as any,
      subtotal: parseFloat(newAmount),
      discount_type: "percentage",
      discount_value: 0,
      tax_percent: 0,
      total_amount: parseFloat(newAmount),
      amount_paid: 0,
      status: "draft",
      due_date: newDueDate,
      payment_terms: null,
      notes: newNotes || null,
    });
    setCreateOpen(false);
    setNewClient(""); setNewProject(""); setNewDescription(""); setNewAmount(""); setNewDueDate(""); setNewNotes("");
  };

  const handleRecordPayment = () => {
    if (!selectedInvoice || !payAmount || !payMode) {
      toast.error("Fill all required fields"); return;
    }
    const amt = parseFloat(payAmount);
    const newPaid = selectedInvoice.amount_paid + amt;
    updateInvoice.mutate({
      id: selectedInvoice.id,
      amount_paid: newPaid,
      status: newPaid >= selectedInvoice.total_amount ? "paid" : "partial",
    });
    toast.success("Payment recorded!", { description: `${fmt(amt)} via ${payMode}` });
    setRecordPaymentOpen(false);
    setSelectedInvoice(null);
    setPayAmount(""); setPayMode(""); setPayReference("");
  };

  const handleSendInvoice = (inv: InvoiceRow) => {
    updateInvoice.mutate({ id: inv.id, status: "sent" });
    toast.success("Invoice sent to client!", { description: `${inv.invoice_number} → ${inv.client_name}` });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-black text-sm">S</span>
        </div>
      </div>
    );
  }

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
          { label: "Total Revenue", value: fmt(totalRevenue), color: "text-foreground", sub: `${invoices.length} invoices` },
          { label: "Collected", value: fmt(totalCollected), color: "text-emerald-500", pct: totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0 },
          { label: "Pending", value: fmt(totalPending), color: "text-amber-500", sub: `${invoices.filter(i => !["paid"].includes(i.status)).length} pending` },
          { label: "Overdue", value: fmt(overdueAmount), color: "text-red-500", sub: `${overdueInvoices.length} overdue` },
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

      {/* Tabs + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {[
            { key: "all", label: "All", count: invoices.length },
            { key: "pending", label: "Pending", count: invoices.filter(i => ["draft", "partial", "sent"].includes(getEffectiveStatus(i))).length },
            { key: "overdue", label: "Overdue", count: overdueInvoices.length },
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
                const status = getEffectiveStatus(inv);
                return (
                  <TableRow key={inv.id} className="cursor-pointer hover:bg-muted/30" onClick={() => setViewInvoice(inv)}>
                    <TableCell>
                      <span className="text-sm font-mono font-medium text-primary">{inv.invoice_number}</span>
                    </TableCell>
                    <TableCell className="text-sm font-medium text-foreground">{inv.client_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.project_name || "—"}</TableCell>
                    <TableCell className="text-sm font-bold text-foreground">{fmt(inv.total_amount)}</TableCell>
                    <TableCell className="text-sm font-medium text-emerald-500">{fmt(inv.amount_paid)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {inv.due_date ? new Date(inv.due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-[10px]", statusStyles[status] || statusStyles.pending)}>
                        {status}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        {status !== "paid" && (
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

      {/* CREATE INVOICE SHEET */}
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
                <SelectContent>{clients.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Project / Package</Label>
              <Select value={newProject} onValueChange={setNewProject}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.project_name}>{p.project_name}</SelectItem>)}
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

      {/* RECORD PAYMENT SHEET */}
      <Sheet open={recordPaymentOpen} onOpenChange={setRecordPaymentOpen}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Payment</SheetTitle>
            <SheetDescription>
              {selectedInvoice && `${selectedInvoice.invoice_number} - ${selectedInvoice.client_name}`}
            </SheetDescription>
          </SheetHeader>
          {selectedInvoice && (
            <div className="space-y-4 mt-4">
              <Card className="bg-muted/30">
                <CardContent className="p-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Invoice Total</span>
                    <span className="text-sm font-bold">{fmt(selectedInvoice.total_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Already Paid</span>
                    <span className="text-sm font-medium text-emerald-500">{fmt(selectedInvoice.amount_paid)}</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-1">
                    <span className="text-xs font-medium">Balance Due</span>
                    <span className="text-sm font-bold text-amber-500">{fmt(selectedInvoice.total_amount - selectedInvoice.amount_paid)}</span>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-2">
                <Label>Amount (₹) *</Label>
                <Input type="number" placeholder={String(selectedInvoice.total_amount - selectedInvoice.amount_paid)} value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
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

      {/* VIEW INVOICE DIALOG */}
      <Dialog open={!!viewInvoice} onOpenChange={(o) => !o && setViewInvoice(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {viewInvoice?.invoice_number}
            </DialogTitle>
          </DialogHeader>
          {viewInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Client</p>
                  <p className="font-medium text-foreground">{viewInvoice.client_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Project</p>
                  <p className="font-medium text-foreground">{viewInvoice.project_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="font-medium text-foreground">{new Date(viewInvoice.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Due Date</p>
                  <p className="font-medium text-foreground">{viewInvoice.due_date || "—"}</p>
                </div>
              </div>
              <div className="border border-border rounded-lg p-3 space-y-2">
                {(viewInvoice.items as any[]).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.description || item.name}</span>
                    <span className="font-bold">{fmt(item.amount)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                  <span>Total</span>
                  <span>{fmt(viewInvoice.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Paid</span>
                  <span className="text-emerald-500 font-medium">{fmt(viewInvoice.amount_paid)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span>Balance</span>
                  <span className="text-amber-500">{fmt(viewInvoice.total_amount - viewInvoice.amount_paid)}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {getEffectiveStatus(viewInvoice) !== "paid" && (
                  <Button size="sm" className="flex-1" onClick={() => { setSelectedInvoice(viewInvoice); setRecordPaymentOpen(true); setViewInvoice(null); }}>
                    <IndianRupee className="h-3.5 w-3.5 mr-1" /> Record Payment
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1" onClick={() => { setPdfInvoice(viewInvoice); setViewInvoice(null); }}>
                  <Download className="h-3.5 w-3.5 mr-1" /> PDF
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.success("Copied invoice link")}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {pdfInvoice && (
        <DocumentBuilder
          open={!!pdfInvoice}
          onOpenChange={(o) => !o && setPdfInvoice(null)}
          initialData={{
            kind: "invoice",
            documentNumber: pdfInvoice.invoice_number,
            title: pdfInvoice.project_name || `Invoice for ${pdfInvoice.client_name}`,
            issueDate: pdfInvoice.created_at,
            dueDate: pdfInvoice.due_date,
            status: pdfInvoice.status,
            clientName: pdfInvoice.client_name,
            lineItems: (Array.isArray(pdfInvoice.items) ? pdfInvoice.items : []).map((it: any): DocumentLineItem => ({
              name: it.name || it.description || "Item",
              qty: Number(it.qty ?? it.quantity ?? 1),
              unit_price: Number(it.price ?? it.unit_price ?? 0),
              amount: it.amount ? Number(it.amount) : undefined,
            })),
            taxPercent: pdfInvoice.tax_percent,
            discountValue: pdfInvoice.discount_value,
            discountType: (pdfInvoice.discount_type as any) || null,
            totalAmount: Number(pdfInvoice.total_amount || 0),
            amountPaid: Number(pdfInvoice.amount_paid || 0),
            notes: pdfInvoice.notes,
            terms: pdfInvoice.payment_terms,
            coverImageUrl: (pdfInvoice as any).cover_image_url || null,
          }}
          onPersistCover={async (url) => {
            await supabase.from("invoices").update({ cover_image_url: url }).eq("id", pdfInvoice.id);
          }}
        />
      )}
    </div>
  );
};

export default InvoicesPage;
