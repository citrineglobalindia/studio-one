import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera, Plus, Search, Loader2, Trash2, Pencil, PackageCheck, PackageOpen,
  Check, X, CheckCircle2, Clock, User, CalendarDays, Box,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEquipment, EQUIPMENT_PRESETS, deriveStatus, type DbEquipmentLog, type EquipmentItem } from "@/hooks/useEquipment";
import { useClients } from "@/hooks/useClients";
import { useClientEvents } from "@/hooks/useEvents";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  issued:   { label: "Issued",   color: "bg-amber-500/10 text-amber-700 border-amber-500/30",   icon: PackageOpen },
  partial:  { label: "Partial return", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Clock },
  returned: { label: "Returned", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: PackageCheck },
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}

export default function EquipmentPage() {
  const { hasAccess } = useRole();
  const allowed = hasAccess("equipment");
  const { logs, isLoading, add, update, remove } = useEquipment();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [editing, setEditing] = useState<DbEquipmentLog | null | undefined>(undefined);

  const filtered = useMemo(() => {
    let list = logs;
    if (filterStatus !== "all") list = list.filter((l) => l.status === filterStatus);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((l) => [l.responsible_person, l.client?.name, l.event?.name, l.notes, ...(l.items || []).map((i) => i.name)].filter(Boolean).join(" ").toLowerCase().includes(q));
    return list;
  }, [logs, filterStatus, search]);

  const stats = useMemo(() => ({
    issued: logs.filter((l) => l.status === "issued").length,
    partial: logs.filter((l) => l.status === "partial").length,
    returned: logs.filter((l) => l.status === "returned").length,
  }), [logs]);

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <Camera className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Equipment is restricted</p>
        <p className="text-sm text-muted-foreground">You don't have access to the equipment module.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/10 via-sky-400/5 to-transparent" />
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/25 to-cyan-500/5 border border-cyan-500/30 flex items-center justify-center shadow-sm">
              <Camera className="h-6 w-6 text-cyan-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Operations</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Equipment Tracking</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Gear issued & returned per event</p>
            </div>
          </div>
          <Button onClick={() => setEditing(null)} className="gap-2 h-9"><Plus className="h-4 w-4" /> New log</Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-2">
        {(["issued", "partial", "returned"] as const).map((k) => {
          const meta = STATUS_META[k];
          const active = filterStatus === k;
          return (
            <button key={k} onClick={() => setFilterStatus(active ? "all" : k)}
              className={"rounded-xl border bg-card p-3 text-left transition " + (active ? "ring-2 ring-primary border-primary" : "border-border/80 hover:border-border")}>
              <div className="flex items-center gap-1.5"><meta.icon className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{meta.label}</span></div>
              <p className="text-xl font-bold text-foreground tabular-nums mt-1">{stats[k]}</p>
            </button>
          );
        })}
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search gear, person, client, event…" className="pl-9 h-9" />
      </div>

      {isLoading ? (
        <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Box className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No equipment logs yet. Create one when gear goes out for an event.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((l) => {
            const meta = STATUS_META[l.status] || STATUS_META.issued;
            const issued = (l.items || []).filter((i) => i.issued);
            const returned = issued.filter((i) => i.returned);
            return (
              <div key={l.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{l.client?.partner_name ? `${l.client.name} & ${l.client.partner_name}` : (l.client?.name || "—")}</p>
                      <Badge variant="outline" className={"text-[10px] gap-1 " + meta.color}><meta.icon className="h-3 w-3" />{meta.label}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                      {l.event && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" />{l.event.name || l.event.event_type}{l.event.event_date ? ` · ${fmtDate(l.event.event_date)}` : ""}</span>}
                      {l.responsible_person && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{l.responsible_person}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(l)} title="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-500/10" onClick={() => { if (window.confirm("Delete this equipment log?")) remove.mutate(l.id); }} title="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{issued.length} item{issued.length === 1 ? "" : "s"} issued · {returned.length} returned</span>
                  <span className="tabular-nums">{issued.length > 0 ? Math.round((returned.length / issued.length) * 100) : 0}% back</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {issued.slice(0, 8).map((it, i) => (
                    <span key={i} className={"inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border " + (it.returned ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-foreground border-border")}>
                      {it.returned ? <Check className="h-2.5 w-2.5" /> : <PackageOpen className="h-2.5 w-2.5" />}{it.name}
                    </span>
                  ))}
                  {issued.length > 8 && <span className="text-[10px] text-muted-foreground">+{issued.length - 8} more</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing !== undefined && (
        <EquipmentDialog
          editing={editing}
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

function EquipmentDialog({ editing, onClose, onSubmit }: { editing: DbEquipmentLog | null; onClose: () => void; onSubmit: (p: Partial<DbEquipmentLog>) => Promise<void> }) {
  const { clients } = useClients();
  const { members } = useTeamMembers();
  const [clientId, setClientId] = useState<string>(editing?.client_id || "");
  const { events } = useClientEvents(clientId || undefined);
  const [eventId, setEventId] = useState<string>(editing?.event_id || "");
  const [person, setPerson] = useState<string>(editing?.responsible_person || "");
  const [notes, setNotes] = useState<string>(editing?.notes || "");
  const [items, setItems] = useState<EquipmentItem[]>(editing?.items?.length ? editing.items : []);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  const addItem = (name: string) => {
    const n = name.trim();
    if (!n) return;
    if (items.some((i) => i.name.toLowerCase() === n.toLowerCase())) { toast.info("Already added"); return; }
    setItems((p) => [...p, { name: n, issued: true, returned: false }]);
  };
  const toggle = (i: number, key: "issued" | "returned") =>
    setItems((p) => p.map((it, idx) => idx === i ? { ...it, [key]: !it[key], ...(key === "issued" && it.issued ? { returned: false } : {}) } : it));
  const removeItem = (i: number) => setItems((p) => p.filter((_, idx) => idx !== i));

  const save = async () => {
    if (items.length === 0) { toast.error("Add at least one equipment item"); return; }
    setSaving(true);
    try {
      await onSubmit({
        client_id: clientId || null,
        event_id: eventId || null,
        responsible_person: person.trim() || null,
        notes: notes.trim() || null,
        items,
      } as any);
      onClose();
    } finally { setSaving(false); }
  };

  const issuedCount = items.filter((i) => i.issued).length;
  const returnedCount = items.filter((i) => i.issued && i.returned).length;
  const status = deriveStatus(items);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Camera className="h-5 w-5 text-cyan-500" /> {editing ? "Edit equipment log" : "New equipment log"}</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Client">
              <Select value={clientId} onValueChange={(v) => { setClientId(v); setEventId(""); }}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.partner_name ? `${c.name} & ${c.partner_name}` : c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Event">
              <Select value={eventId} onValueChange={setEventId} disabled={!clientId}>
                <SelectTrigger><SelectValue placeholder={clientId ? "Select event" : "Pick client first"} /></SelectTrigger>
                <SelectContent>
                  {events.map((e) => <SelectItem key={e.id} value={e.id}>{(e.name || e.event_type || "Event")}{e.event_date ? ` · ${fmtDate(e.event_date)}` : ""}</SelectItem>)}
                  {events.length === 0 && <div className="px-2 py-1.5 text-[11px] text-muted-foreground">No events for this client</div>}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Responsible person">
              <Select value={person || "none"} onValueChange={(v) => setPerson(v === "none" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members.map((m) => <SelectItem key={m.id} value={m.full_name}>{m.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {/* Checklist */}
          <div className="rounded-xl border border-border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Equipment checklist</p>
              <Badge variant="outline" className={"text-[10px] " + (STATUS_META[status]?.color || "")}>{issuedCount} issued · {returnedCount} returned</Badge>
            </div>

            {/* presets */}
            <div className="flex flex-wrap gap-1.5">
              {EQUIPMENT_PRESETS.filter((g) => !items.some((i) => i.name === g)).map((g) => (
                <button key={g} type="button" onClick={() => addItem(g)} className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-dashed border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border">
                  + {g}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(custom); setCustom(""); } }} placeholder="Add custom item…" className="h-8 text-sm" />
              <Button type="button" variant="outline" size="sm" className="h-8" onClick={() => { addItem(custom); setCustom(""); }}>Add</Button>
            </div>

            {/* item table: outbound (issued) + return checklist */}
            {items.length === 0 ? (
              <p className="text-[11px] text-muted-foreground italic text-center py-3">No items yet. Add from presets or custom.</p>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                    <tr>
                      <th className="text-left px-2.5 py-2 font-semibold">Item</th>
                      <th className="text-center px-2 py-2 font-semibold w-20">Issued</th>
                      <th className="text-center px-2 py-2 font-semibold w-20">Returned</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((it, i) => (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-2.5 py-1.5 font-medium text-foreground">{it.name}</td>
                        <td className="px-2 py-1.5 text-center">
                          <button type="button" onClick={() => toggle(i, "issued")} className={"h-5 w-5 rounded border inline-flex items-center justify-center " + (it.issued ? "bg-amber-500 border-amber-500 text-white" : "border-border bg-background")}>{it.issued && <Check className="h-3 w-3" />}</button>
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button type="button" disabled={!it.issued} onClick={() => toggle(i, "returned")} className={"h-5 w-5 rounded border inline-flex items-center justify-center disabled:opacity-30 " + (it.returned ? "bg-emerald-500 border-emerald-500 text-white" : "border-border bg-background")}>{it.returned && <Check className="h-3 w-3" />}</button>
                        </td>
                        <td className="px-1 py-1.5 text-center">
                          <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-rose-500"><X className="h-3.5 w-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {items.length > 0 && (
              <div className="flex items-center justify-end">
                <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px] gap-1 text-emerald-600" onClick={() => setItems((p) => p.map((it) => it.issued ? { ...it, returned: true } : it))}>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark all returned
                </Button>
              </div>
            )}
          </div>

          <Field label="Notes"><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condition, damages, accessories…" /></Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{editing ? "Save" : "Create log"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
