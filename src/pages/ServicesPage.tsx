import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Search, Loader2, Pencil, Trash2, Check, IndianRupee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { FinanceTabs } from "@/components/accounts/FinanceTabs";
import { useServices, type DbService } from "@/hooks/useServices";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}

export default function ServicesPage() {
  const { currentRole } = useRole();
  const allowed = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts";
  const { services, isLoading, add, update, remove } = useServices();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DbService | null | undefined>(undefined);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return services;
    return services.filter((s) => (s.title + " " + (s.description || "")).toLowerCase().includes(q));
  }, [services, search]);

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <Package className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Services is restricted</p>
        <p className="text-sm text-muted-foreground">Only Admin, Administrator and Accounts can manage the service catalog.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/10 via-orange-400/5 to-transparent" />
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-amber-500/25 to-amber-500/5 border border-amber-500/30 flex items-center justify-center shadow-sm">
              <Package className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Finance</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Service Catalog</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Reusable packages that appear when building a bill</p>
            </div>
          </div>
          <Button onClick={() => setEditing(null)} className="gap-2 h-9"><Plus className="h-4 w-4" /> Add service</Button>
        </div>
      </motion.div>

      <FinanceTabs />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services…" className="pl-9 h-9" />
      </div>

      {isLoading ? (
        <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Package className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No services yet. Add your ceremony packages here.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold w-32">Amount</th>
                  <th className="text-left px-3 py-3 font-semibold">Title &amp; Description</th>
                  <th className="text-right px-4 py-3 font-semibold w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors align-top">
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-foreground">{s.amount > 0 ? inr(s.amount) : <span className="text-muted-foreground font-normal">₹ 0</span>}</td>
                    <td className="px-3 py-3">
                      <p className="font-semibold text-foreground">{s.title}</p>
                      {s.description && <p className="text-[11px] text-muted-foreground whitespace-pre-line leading-snug mt-0.5">{s.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(s)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-500/10" onClick={() => { if (window.confirm(`Delete "${s.title}"?`)) remove.mutate(s.id); }} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">{filtered.length} service{filtered.length === 1 ? "" : "s"}</div>
        </div>
      )}

      {editing !== undefined && (
        <ServiceDialog
          editing={editing}
          nextOrder={(services.reduce((m, s) => Math.max(m, s.sort_order || 0), 0)) + 1}
          onClose={() => setEditing(undefined)}
          onSubmit={async (payload) => {
            if (editing) await update.mutateAsync({ id: editing.id, ...payload });
            else await add.mutateAsync(payload);
          }}
        />
      )}
    </div>
  );
}

function ServiceDialog({ editing, nextOrder, onClose, onSubmit }: { editing: DbService | null; nextOrder: number; onClose: () => void; onSubmit: (p: Partial<DbService>) => Promise<void> }) {
  const [title, setTitle] = useState(editing?.title || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [amount, setAmount] = useState<number>(Number(editing?.amount || 0));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    setSaving(true);
    try {
      await onSubmit({ title: title.trim(), description: description.trim() || null, amount: Number(amount || 0), sort_order: editing?.sort_order ?? nextOrder });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-amber-500" /> {editing ? "Edit service" : "Add service"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Title *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="HALDI" /></div>
          <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Description / deliverables</Label><Textarea rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder={"1 TRADITIONAL PHOTOGRAPHY\n1 TRADITIONAL VIDEOGRAPHY"} /></div>
          <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Default amount (₹)</Label>
            <div className="relative"><IndianRupee className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" /><Input type="number" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value || 0))} placeholder="0" className="pl-8 text-right tabular-nums" /></div>
            <p className="text-[10px] text-muted-foreground">Can be overridden per bill.</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !title.trim()} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{editing ? "Save" : "Add"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
