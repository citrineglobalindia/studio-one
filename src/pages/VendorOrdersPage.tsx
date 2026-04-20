import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Package, Plus, Search, Loader2, Trash2, Calendar, IndianRupee,
} from "lucide-react";
import { format } from "date-fns";
import { useVendorOrders, OrderStatus, PaymentStatus, VendorOrderInput } from "@/hooks/useVendorOrders";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useProjects } from "@/hooks/useProjects";
import { useClients } from "@/hooks/useClients";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusColor: Record<OrderStatus, string> = {
  pending: "bg-muted text-muted-foreground",
  confirmed: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  in_progress: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  shipped: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

const paymentColor: Record<PaymentStatus, string> = {
  unpaid: "bg-red-500/15 text-red-400 border-red-500/30",
  partial: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  paid: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
};

function OrderDialog({
  open, onOpenChange, onSubmit, initial, vendors, projects, clients,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSubmit: (input: VendorOrderInput) => Promise<void>;
  initial?: Partial<VendorOrderInput>;
  vendors: { id: string; full_name: string | null; role: string | null }[];
  projects: { id: string; name?: string | null; event_name?: string | null }[];
  clients: { id: string; name: string }[];
}) {
  const [form, setForm] = useState<VendorOrderInput>({
    vendor_id: initial?.vendor_id ?? null,
    project_id: initial?.project_id ?? null,
    client_id: initial?.client_id ?? null,
    order_number: initial?.order_number ?? null,
    item_type: initial?.item_type ?? "",
    description: initial?.description ?? null,
    quantity: initial?.quantity ?? 1,
    unit_price: initial?.unit_price ?? 0,
    total_amount: initial?.total_amount ?? 0,
    status: initial?.status ?? "pending",
    payment_status: initial?.payment_status ?? "unpaid",
    amount_paid: initial?.amount_paid ?? 0,
    due_date: initial?.due_date ?? null,
    delivery_date: initial?.delivery_date ?? null,
    tracking_info: initial?.tracking_info ?? null,
    notes: initial?.notes ?? null,
  });
  const [saving, setSaving] = useState(false);

  const recalcTotal = (qty: number, price: number) => qty * price;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit({
      ...form,
      total_amount: recalcTotal(form.quantity, form.unit_price),
    });
    setSaving(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New vendor order</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label className="text-xs">Item type *</Label>
            <Input
              required
              value={form.item_type}
              onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))}
              placeholder="Album prints, drone rental, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Vendor</Label>
              <Select
                value={form.vendor_id ?? "none"}
                onValueChange={v => setForm(f => ({ ...f, vendor_id: v === "none" ? null : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.full_name} {v.role ? `(${v.role})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Project</Label>
              <Select
                value={form.project_id ?? "none"}
                onValueChange={v => setForm(f => ({ ...f, project_id: v === "none" ? null : v }))}
              >
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— none —</SelectItem>
                  {projects.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name || p.event_name || p.id.slice(0, 8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="text-xs">Unit price (₹)</Label>
              <Input
                type="number"
                min="0"
                value={form.unit_price}
                onChange={e => setForm(f => ({ ...f, unit_price: Number(e.target.value) }))}
              />
            </div>
            <div>
              <Label className="text-xs">Total (₹)</Label>
              <Input
                disabled
                value={recalcTotal(form.quantity, form.unit_price)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v as OrderStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Payment</Label>
              <Select value={form.payment_status} onValueChange={v => setForm(f => ({ ...f, payment_status: v as PaymentStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Due date</Label>
              <Input
                type="date"
                value={form.due_date ?? ""}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value || null }))}
              />
            </div>
            <div>
              <Label className="text-xs">Delivery date</Label>
              <Input
                type="date"
                value={form.delivery_date ?? ""}
                onChange={e => setForm(f => ({ ...f, delivery_date: e.target.value || null }))}
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Description / notes</Label>
            <Textarea
              value={form.description ?? ""}
              onChange={e => setForm(f => ({ ...f, description: e.target.value || null }))}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving || !form.item_type}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function VendorOrdersPage() {
  const { orders, isLoading, addOrder, updateOrder, deleteOrder } = useVendorOrders();
  const { members: teamMembers = [] } = useTeamMembers();
  const { projects = [] } = useProjects();
  const { clients = [] } = useClients();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const vendors = useMemo(
    () => (teamMembers as any[]).filter(t => {
      const r = (t.role || "").toLowerCase();
      return r.includes("vendor") || r.includes("freelance") || r.includes("contractor") || r.includes("printer");
    }),
    [teamMembers]
  );
  const vendorMap = useMemo(() => new Map((teamMembers as any[]).map(t => [t.id, t])), [teamMembers]);
  const projectMap = useMemo(() => new Map((projects as any[]).map(p => [p.id, p])), [projects]);

  const filtered = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const vendor = o.vendor_id ? vendorMap.get(o.vendor_id) : null;
    return (
      o.item_type.toLowerCase().includes(q) ||
      (o.description || "").toLowerCase().includes(q) ||
      (o.order_number || "").toLowerCase().includes(q) ||
      (vendor?.full_name || "").toLowerCase().includes(q)
    );
  });

  const totalValue = orders.reduce((s, o) => s + Number(o.total_amount || 0), 0);
  const outstanding = orders.reduce(
    (s, o) => s + (Number(o.total_amount || 0) - Number(o.amount_paid || 0)),
    0
  );

  const handleAdd = async (input: VendorOrderInput) => {
    await addOrder.mutateAsync(input);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Package className="h-6 w-6" /> Vendor Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track orders placed with external vendors, freelancers, and contractors
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New order
        </Button>
      </div>

      <OrderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleAdd}
        vendors={vendors}
        projects={projects as any}
        clients={clients as any}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total orders</div>
          <div className="text-2xl font-bold mt-1">{orders.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">In progress</div>
          <div className="text-2xl font-bold mt-1 text-amber-400">
            {orders.filter(o => ["pending", "confirmed", "in_progress", "shipped"].includes(o.status)).length}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total value</div>
          <div className="text-2xl font-bold mt-1 flex items-center gap-1">
            <IndianRupee className="h-4 w-4" /> {totalValue.toLocaleString("en-IN")}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Outstanding</div>
          <div className="text-2xl font-bold mt-1 flex items-center gap-1 text-red-400">
            <IndianRupee className="h-4 w-4" /> {outstanding.toLocaleString("en-IN")}
          </div>
        </CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search item, vendor, order#..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
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
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No orders yet. Click "New order" to create one.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(o => {
                const vendor = o.vendor_id ? vendorMap.get(o.vendor_id) : null;
                const project = o.project_id ? projectMap.get(o.project_id) : null;
                return (
                  <div key={o.id} className="p-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold">{o.item_type}</span>
                          <Badge variant="outline" className={`text-[10px] ${statusColor[o.status]}`}>{STATUS_LABELS[o.status]}</Badge>
                          <Badge variant="outline" className={`text-[10px] capitalize ${paymentColor[o.payment_status]}`}>{o.payment_status}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {vendor && <span>Vendor: {(vendor as any).full_name}</span>}
                          {project && <span>Project: {(project as any).name || (project as any).event_name}</span>}
                          <span className="flex items-center gap-1">
                            <IndianRupee className="h-3 w-3" /> {Number(o.total_amount).toLocaleString("en-IN")}
                            {o.quantity > 1 && ` (${o.quantity} × ₹${Number(o.unit_price).toLocaleString("en-IN")})`}
                          </span>
                          {o.delivery_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" /> Due {format(new Date(o.delivery_date), "d MMM")}
                            </span>
                          )}
                        </div>
                        {o.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{o.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Select
                          value={o.status}
                          onValueChange={(v) => updateOrder.mutate({ id: o.id, status: v as OrderStatus })}
                        >
                          <SelectTrigger className="h-7 text-xs w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Object.entries(STATUS_LABELS).map(([v, l]) => (
                              <SelectItem key={v} value={v}>{l}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete order?</AlertDialogTitle>
                              <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteOrder.mutate(o.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
