import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { sampleProjects } from "@/data/wedding-types";
import { sampleClients } from "@/data/clients-data";
import { toast } from "sonner";
import {
  Briefcase, Plus, Search, FileSignature, Check, Clock, AlertTriangle,
  Send, Download, Eye, Copy, X, CalendarDays, IndianRupee,
  FileText, Shield, Pen, Printer,
} from "lucide-react";

interface ContractClause {
  id: string;
  text: string;
}

interface Contract {
  id: string;
  contractNumber: string;
  client: string;
  project: string;
  amount: number;
  status: "draft" | "sent" | "viewed" | "signed" | "expired";
  createdDate: string;
  sentDate?: string;
  signedDate?: string;
  expiryDate: string;
  clauses: ContractClause[];
  terms?: string;
  notes?: string;
}

const defaultClauses: ContractClause[] = [
  { id: "c1", text: "50% advance payment required before shoot date" },
  { id: "c2", text: "Delivery within 45 working days of final event" },
  { id: "c3", text: "2 revision rounds included in package" },
  { id: "c4", text: "Travel & accommodation costs included for local events" },
  { id: "c5", text: "Additional hours billed at ₹5,000/hr" },
  { id: "c6", text: "Cancellation within 7 days: full refund; after 7 days: 50% refund" },
  { id: "c7", text: "Copyright remains with studio; usage rights granted to client" },
  { id: "c8", text: "Raw files not included in standard delivery" },
];

const sampleContracts: Contract[] = [
  { id: "ct1", contractNumber: "CTR-2026-001", client: "Priya Sharma & Rahul Kapoor", project: "Royal Wedding Package", amount: 350000, status: "signed", createdDate: "2026-03-01", sentDate: "2026-03-02", signedDate: "2026-03-03", expiryDate: "2026-04-01", clauses: defaultClauses.slice(0, 4) },
  { id: "ct2", contractNumber: "CTR-2026-002", client: "Ananya Desai & Vikram Malhotra", project: "Premium Wedding Package", amount: 250000, status: "signed", createdDate: "2026-03-10", sentDate: "2026-03-11", signedDate: "2026-03-12", expiryDate: "2026-04-10", clauses: defaultClauses.slice(0, 3) },
  { id: "ct3", contractNumber: "CTR-2026-003", client: "Sneha Kapoor & Rohan Jain", project: "Destination Wedding", amount: 500000, status: "sent", createdDate: "2026-03-28", sentDate: "2026-03-29", expiryDate: "2026-04-15", clauses: defaultClauses.slice(0, 5) },
  { id: "ct4", contractNumber: "CTR-2026-004", client: "Ritu & Karan", project: "Premium Wedding", amount: 300000, status: "viewed", createdDate: "2026-03-20", sentDate: "2026-03-21", expiryDate: "2026-04-15", clauses: defaultClauses.slice(0, 3) },
  { id: "ct5", contractNumber: "CTR-2026-005", client: "Divya & Arun", project: "Royal Package", amount: 350000, status: "draft", createdDate: "2026-03-30", expiryDate: "2026-04-30", clauses: defaultClauses.slice(0, 4) },
  { id: "ct6", contractNumber: "CTR-2026-006", client: "Sunita & Raj", project: "Premium Package", amount: 250000, status: "expired", createdDate: "2026-02-15", sentDate: "2026-02-16", expiryDate: "2026-03-15", clauses: defaultClauses.slice(0, 2) },
];

const statusConfig: Record<string, { label: string; style: string; icon: typeof Clock; bgColor: string }> = {
  draft: { label: "Draft", style: "bg-muted text-muted-foreground border-border", icon: Briefcase, bgColor: "bg-muted/50" },
  sent: { label: "Sent", style: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Send, bgColor: "bg-blue-500/10" },
  viewed: { label: "Viewed", style: "bg-primary/20 text-primary border-primary/30", icon: Eye, bgColor: "bg-primary/10" },
  signed: { label: "Signed", style: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: Check, bgColor: "bg-emerald-500/10" },
  expired: { label: "Expired", style: "bg-destructive/20 text-red-400 border-red-500/30", icon: AlertTriangle, bgColor: "bg-red-500/10" },
};

const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>(sampleContracts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewContract, setViewContract] = useState<Contract | null>(null);

  // Create form
  const [newClient, setNewClient] = useState("");
  const [newProject, setNewProject] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newExpiryDate, setNewExpiryDate] = useState("");
  const [selectedClauses, setSelectedClauses] = useState<string[]>(defaultClauses.slice(0, 4).map(c => c.id));
  const [customClause, setCustomClause] = useState("");
  const [newTerms, setNewTerms] = useState("");
  const [newNotes, setNewNotes] = useState("");

  const filtered = useMemo(() => {
    return contracts.filter(c => {
      if (search && !`${c.client} ${c.project} ${c.contractNumber}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      return true;
    });
  }, [contracts, search, statusFilter]);

  const stats = {
    signed: contracts.filter(c => c.status === "signed").length,
    pending: contracts.filter(c => ["sent", "viewed"].includes(c.status)).length,
    draft: contracts.filter(c => c.status === "draft").length,
    expired: contracts.filter(c => c.status === "expired").length,
    totalValue: contracts.filter(c => c.status === "signed").reduce((s, c) => s + c.amount, 0),
  };

  const clientNames = [...new Set([...sampleClients.map(c => `${c.name} & ${c.partnerName}`), ...sampleProjects.map(p => `${p.clientName} & ${p.partnerName}`)])];

  const toggleClause = (id: string) => {
    setSelectedClauses(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleCreateContract = () => {
    if (!newClient || !newAmount || !newExpiryDate) {
      toast.error("Fill all required fields"); return;
    }
    const clauses = defaultClauses.filter(c => selectedClauses.includes(c.id));
    if (customClause.trim()) {
      clauses.push({ id: `custom-${Date.now()}`, text: customClause.trim() });
    }
    const contract: Contract = {
      id: `ct-${Date.now()}`,
      contractNumber: `CTR-2026-${String(contracts.length + 1).padStart(3, "0")}`,
      client: newClient,
      project: newProject,
      amount: parseFloat(newAmount),
      status: "draft",
      createdDate: new Date().toISOString().split("T")[0],
      expiryDate: newExpiryDate,
      clauses,
      terms: newTerms || undefined,
      notes: newNotes || undefined,
    };
    setContracts(prev => [contract, ...prev]);
    toast.success("Contract created!", { description: contract.contractNumber });
    setCreateOpen(false);
    setNewClient(""); setNewProject(""); setNewAmount(""); setNewExpiryDate("");
    setSelectedClauses(defaultClauses.slice(0, 4).map(c => c.id));
    setCustomClause(""); setNewTerms(""); setNewNotes("");
  };

  const handleSendContract = (id: string) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status: "sent" as const, sentDate: new Date().toISOString().split("T")[0] } : c));
    toast.success("Contract sent for signing!");
  };

  const handleMarkSigned = (id: string) => {
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status: "signed" as const, signedDate: new Date().toISOString().split("T")[0] } : c));
    toast.success("Contract marked as signed!");
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-primary rounded" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">Contracts</h1>
            <p className="text-sm text-muted-foreground">{stats.signed} signed · {stats.pending} awaiting · {fmt(stats.totalValue)} value</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> New Contract
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Signed", count: stats.signed, color: "text-emerald-500", icon: Check },
          { label: "Sent", count: contracts.filter(c => c.status === "sent").length, color: "text-blue-500", icon: Send },
          { label: "Viewed", count: contracts.filter(c => c.status === "viewed").length, color: "text-primary", icon: Eye },
          { label: "Draft", count: stats.draft, color: "text-muted-foreground", icon: FileText },
          { label: "Total Value", count: null, value: fmt(stats.totalValue), color: "text-foreground", icon: IndianRupee },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <s.icon className={cn("h-4 w-4", s.color)} />
              <div>
                <p className={cn("text-lg font-bold", s.color)}>{s.value || s.count}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1">
          {["all", "draft", "sent", "viewed", "signed", "expired"].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all",
                statusFilter === s ? "bg-primary/15 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:border-primary/20"
              )}
            >
              {s === "all" ? "All" : statusConfig[s]?.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contracts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Contract List */}
      <div className="space-y-2">
        {filtered.map((contract) => {
          const config = statusConfig[contract.status];
          const isExpanded = expandedId === contract.id;
          const StatusIcon = config.icon;
          const daysLeft = Math.ceil((new Date(contract.expiryDate).getTime() - Date.now()) / 86400000);

          return (
            <Card key={contract.id} className={cn("overflow-hidden", isExpanded && "border-primary/30")}>
              <div
                onClick={() => setExpandedId(isExpanded ? null : contract.id)}
                className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center shrink-0", config.bgColor)}>
                    <FileSignature className={cn("h-5 w-5", config.style.split(" ")[1])} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">{contract.client}</p>
                      <Badge variant="outline" className={cn("text-[10px]", config.style)}>{config.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-mono">{contract.contractNumber}</span> · {contract.project}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{fmt(contract.amount)}</p>
                    <p className={cn("text-[10px]", daysLeft > 7 ? "text-muted-foreground" : daysLeft > 0 ? "text-amber-500" : "text-red-500")}>
                      {contract.status === "signed" ? `Signed ${contract.signedDate}` : daysLeft > 0 ? `${daysLeft}d to expire` : "Expired"}
                    </p>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div><p className="text-muted-foreground">Created</p><p className="font-medium text-foreground">{contract.createdDate}</p></div>
                    <div><p className="text-muted-foreground">Sent</p><p className="font-medium text-foreground">{contract.sentDate || "—"}</p></div>
                    <div><p className="text-muted-foreground">Signed</p><p className="font-medium text-foreground">{contract.signedDate || "—"}</p></div>
                    <div><p className="text-muted-foreground">Expires</p><p className="font-medium text-foreground">{contract.expiryDate}</p></div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Shield className="h-3 w-3" /> Key Clauses</p>
                    <div className="space-y-1">
                      {contract.clauses.map((clause) => (
                        <div key={clause.id} className="flex items-start gap-2 text-xs text-foreground">
                          <Check className="h-3 w-3 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{clause.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button variant="outline" size="sm" className="gap-1.5" onClick={() => toast.success("Contract PDF downloaded")}>
                      <Download className="h-3.5 w-3.5" /> Download
                    </Button>
                    {contract.status === "draft" && (
                      <Button size="sm" className="gap-1.5" onClick={() => handleSendContract(contract.id)}>
                        <Send className="h-3.5 w-3.5" /> Send for Signing
                      </Button>
                    )}
                    {["sent", "viewed"].includes(contract.status) && (
                      <>
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => handleSendContract(contract.id)}>
                          <Send className="h-3.5 w-3.5" /> Resend
                        </Button>
                        <Button size="sm" className="gap-1.5" onClick={() => handleMarkSigned(contract.id)}>
                          <Pen className="h-3.5 w-3.5" /> Mark Signed
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm" onClick={() => { toast.success("Link copied"); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <FileSignature className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No contracts found</p>
          </div>
        )}
      </div>

      {/* ═══ CREATE CONTRACT SHEET ═══ */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Create Contract</SheetTitle>
            <SheetDescription>Draft a new contract with clauses</SheetDescription>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Contract Value (₹) *</Label>
                <Input type="number" placeholder="0" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date *</Label>
                <Input type="date" value={newExpiryDate} onChange={(e) => setNewExpiryDate(e.target.value)} />
              </div>
            </div>

            {/* Clause Builder */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Contract Clauses</Label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {defaultClauses.map(clause => (
                  <label key={clause.id} className={cn(
                    "flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-xs",
                    selectedClauses.includes(clause.id) ? "border-primary/30 bg-primary/5" : "border-border hover:border-primary/20"
                  )}>
                    <input
                      type="checkbox"
                      checked={selectedClauses.includes(clause.id)}
                      onChange={() => toggleClause(clause.id)}
                      className="mt-0.5 accent-primary"
                    />
                    <span className="text-foreground">{clause.text}</span>
                  </label>
                ))}
              </div>
              <Input placeholder="Add custom clause..." value={customClause} onChange={(e) => setCustomClause(e.target.value)} className="text-xs" />
            </div>

            <div className="space-y-2">
              <Label>Additional Terms</Label>
              <Textarea placeholder="Any additional terms or conditions..." value={newTerms} onChange={(e) => setNewTerms(e.target.value)} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Internal Notes</Label>
              <Textarea placeholder="Notes (not shown to client)..." value={newNotes} onChange={(e) => setNewNotes(e.target.value)} rows={2} />
            </div>

            {/* Preview */}
            {newClient && newAmount && (
              <Card className="bg-muted/30">
                <CardContent className="p-3 space-y-1">
                  <p className="text-xs text-muted-foreground">Contract Preview</p>
                  <p className="text-sm font-medium text-foreground">{newClient}</p>
                  <p className="text-xs text-muted-foreground">{newProject || "No project"} · {fmt(parseFloat(newAmount) || 0)}</p>
                  <p className="text-xs text-muted-foreground">{selectedClauses.length} clauses selected</p>
                </CardContent>
              </Card>
            )}

            <Button className="w-full" onClick={handleCreateContract}>
              <Plus className="h-4 w-4 mr-1" /> Create Contract
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
