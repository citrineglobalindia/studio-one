import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FileText, Plus, Search, Loader2, Trash2, Calendar, IndianRupee, Send, CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { useContracts, ContractStatus } from "@/hooks/useContracts";
import { useClients } from "@/hooks/useClients";

const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  expired: "Expired",
  cancelled: "Cancelled",
};

const statusColor: Record<ContractStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  viewed: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  signed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  expired: "bg-red-500/15 text-red-400 border-red-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

export default function ContractsPage() {
  const { contracts, isLoading, addContract, updateContract, deleteContract } = useContracts();
  const { clients = [] } = useClients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    client_id: "",
    event_type: "",
    event_date: "",
    contract_amount: 0,
    valid_until: "",
    body: "",
    terms: "",
  });

  const clientMap = useMemo(() => new Map((clients as any[]).map(c => [c.id, c])), [clients]);

  const filtered = contracts.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.title.toLowerCase().includes(q) ||
      c.client_name.toLowerCase().includes(q) ||
      (c.contract_number || "").toLowerCase().includes(q)
    );
  });

  const totalValue = contracts.reduce((s, c) => s + Number(c.contract_amount || 0), 0);
  const signedValue = contracts
    .filter(c => c.status === "signed")
    .reduce((s, c) => s + Number(c.contract_amount || 0), 0);

  const handleCreate = async () => {
    if (!form.title || !form.client_id) return;
    const client = clientMap.get(form.client_id);
    const contractNumber = `CONTRACT-${Date.now().toString(36).toUpperCase()}`;
    await addContract.mutateAsync({
      title: form.title,
      client_id: form.client_id,
      project_id: null,
      client_name: (client as any)?.name || "Unknown",
      contract_number: contractNumber,
      event_type: form.event_type || null,
      event_date: form.event_date || null,
      contract_amount: form.contract_amount,
      valid_until: form.valid_until || null,
      body: form.body || null,
      terms: form.terms || null,
      clauses: [],
      notes: null,
      sent_at: null,
      viewed_at: null,
      signed_at: null,
      signed_by_name: null,
      status: "draft",
    });
    setForm({ title: "", client_id: "", event_type: "", event_date: "", contract_amount: 0, valid_until: "", body: "", terms: "" });
    setDialogOpen(false);
  };

  const markSent = (id: string) =>
    updateContract.mutate({ id, status: "sent", sent_at: new Date().toISOString() });
  const markSigned = (id: string) =>
    updateContract.mutate({ id, status: "signed", signed_at: new Date().toISOString() });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6" /> Contracts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Track contract lifecycle with clients</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> New contract
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total contracts</div>
          <div className="text-2xl font-bold mt-1">{contracts.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Signed</div>
          <div className="text-2xl font-bold mt-1 text-emerald-400">
            {contracts.filter(c => c.status === "signed").length}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total value</div>
          <div className="text-2xl font-bold mt-1 flex items-center gap-1">
            <IndianRupee className="h-4 w-4" /> {totalValue.toLocaleString("en-IN")}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Signed value</div>
          <div className="text-2xl font-bold mt-1 flex items-center gap-1 text-emerald-400">
            <IndianRupee className="h-4 w-4" /> {signedValue.toLocaleString("en-IN")}
          </div>
        </CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search title, client, contract#..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No contracts yet. Click "New contract" to create one.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(c => (
                <div key={c.id} className="p-4 hover:bg-muted/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold">{c.title}</span>
                        <Badge variant="outline" className={`text-[10px] ${statusColor[c.status]}`}>
                          {STATUS_LABELS[c.status]}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Client: <span className="text-foreground">{c.client_name}</span></span>
                        {c.contract_number && <span>#{c.contract_number}</span>}
                        {c.contract_amount > 0 && (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" /> {Number(c.contract_amount).toLocaleString("en-IN")}
                          </span>
                        )}
                        {c.event_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {format(new Date(c.event_date), "d MMM yyyy")}
                          </span>
                        )}
                      </div>
                      {c.body && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.body}</p>}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {c.status === "draft" && (
                        <Button size="sm" variant="outline" onClick={() => markSent(c.id)} className="h-7 gap-1">
                          <Send className="h-3 w-3" /> Send
                        </Button>
                      )}
                      {(c.status === "sent" || c.status === "viewed") && (
                        <Button size="sm" variant="outline" onClick={() => markSigned(c.id)} className="h-7 gap-1 text-emerald-400 border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> Mark signed
                        </Button>
                      )}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete contract?</AlertDialogTitle>
                            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteContract.mutate(c.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New contract</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Title *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Wedding photography contract" />
            </div>
            <div>
              <Label className="text-xs">Client *</Label>
              <Select value={form.client_id || "none"} onValueChange={v => setForm(f => ({ ...f, client_id: v === "none" ? "" : v }))}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— choose —</SelectItem>
                  {(clients as any[]).map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}{c.partner_name ? ` & ${c.partner_name}` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Event type</Label>
                <Input value={form.event_type} onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))} placeholder="Wedding" />
              </div>
              <div>
                <Label className="text-xs">Event date</Label>
                <Input type="date" value={form.event_date} onChange={e => setForm(f => ({ ...f, event_date: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Amount (₹)</Label>
                <Input type="number" value={form.contract_amount} onChange={e => setForm(f => ({ ...f, contract_amount: Number(e.target.value) }))} />
              </div>
              <div>
                <Label className="text-xs">Valid until</Label>
                <Input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Contract body</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Scope of work, deliverables..." />
            </div>
            <div>
              <Label className="text-xs">Terms &amp; conditions</Label>
              <Textarea value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} rows={3} placeholder="Payment terms, cancellation, etc." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={!form.title || !form.client_id || addContract.isPending}>
              {addContract.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
