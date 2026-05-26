import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Phone as PhoneIcon, Plus, Pencil, Trash2, Loader2, Search, Upload, Download,
  Sparkles, Mail, MapPin, CalendarDays, IndianRupee, ArrowRight, X, Check,
  Filter, FilterX, UserCheck, Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLeads, LEAD_STATUSES, LEAD_SOURCES, type DbLead, type LeadStatus } from "@/hooks/useLeads";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

const STATUS_META: Record<string, { label: string; color: string; dot: string }> = {
  new:       { label: "New",        color: "bg-blue-500/10 text-blue-600 border-blue-500/30",         dot: "bg-blue-500" },
  contacted: { label: "Contacted",  color: "bg-amber-500/10 text-amber-700 border-amber-500/30",     dot: "bg-amber-500" },
  qualified: { label: "Qualified",  color: "bg-violet-500/10 text-violet-600 border-violet-500/30",  dot: "bg-violet-500" },
  proposal:  { label: "Proposal",   color: "bg-fuchsia-500/10 text-fuchsia-600 border-fuchsia-500/30", dot: "bg-fuchsia-500" },
  converted: { label: "Converted",  color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", dot: "bg-emerald-500" },
  lost:      { label: "Lost",       color: "bg-rose-500/10 text-rose-600 border-rose-500/30",         dot: "bg-rose-500" },
};

function inr(n: number | null | undefined) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0));
}
function fmtDate(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); } catch { return d; }
}

export default function LeadsPage() {
  const { currentRole } = useRole();
  const allowed = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts" || currentRole === "telecaller";
  const { leads, isLoading, add, update, remove, setStatus, bulkImport, convertToClient } = useLeads();

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [filterCity, setFilterCity] = useState<string>("");
  const [view, setView] = useState<"table" | "kanban">("table");
  const [editing, setEditing] = useState<DbLead | null | undefined>(undefined);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => {
    let list = leads;
    if (filterStatus !== "all") list = list.filter((l) => l.status === filterStatus);
    if (filterSource !== "all") list = list.filter((l) => l.source === filterSource);
    if (filterCity.trim()) list = list.filter((l) => (l.city || "").toLowerCase().includes(filterCity.trim().toLowerCase()));
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((l) => [l.name, l.phone, l.email, l.notes, l.event_type, l.city].filter(Boolean).join(" ").toLowerCase().includes(q));
    return list;
  }, [leads, filterStatus, filterSource, filterCity, search]);

  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of LEAD_STATUSES) counts[s] = 0;
    for (const l of leads) counts[String(l.status)] = (counts[String(l.status)] || 0) + 1;
    return counts;
  }, [leads]);
  const activeFilterCount = [filterStatus !== "all", filterSource !== "all", filterCity.trim(), search.trim()].filter(Boolean).length;

  const exportCSV = () => {
    if (filtered.length === 0) { toast.info("Nothing to export"); return; }
    const headers = ["name", "phone", "email", "source", "event_type", "event_date", "city", "budget", "status", "follow_up_date", "notes"];
    const csv = [headers.join(",")];
    for (const l of filtered) {
      csv.push(headers.map((h) => {
        const v = (l as any)[h];
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(","));
    }
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const importCSV = async (file: File) => {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) { toast.error("CSV is empty"); return; }
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const rows: Partial<DbLead>[] = [];
    for (let i = 1; i < lines.length; i++) {
      // very simple CSV parse (handles quoted commas)
      const cells: string[] = [];
      let cur = "", inQ = false;
      for (const ch of lines[i]) {
        if (ch === '"') inQ = !inQ;
        else if (ch === "," && !inQ) { cells.push(cur); cur = ""; }
        else cur += ch;
      }
      cells.push(cur);
      const r: any = {};
      headers.forEach((h, idx) => {
        const v = (cells[idx] ?? "").trim();
        if (!v) return;
        if (h === "budget") r[h] = Number(v.replace(/[^0-9.]/g, "")) || null;
        else r[h] = v;
      });
      if (r.name) rows.push(r);
    }
    if (rows.length === 0) { toast.error("No valid rows in CSV"); return; }
    await bulkImport.mutateAsync(rows);
  };

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <Target className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Leads is restricted</p>
        <p className="text-sm text-muted-foreground">Only Sales, Administrator, Admin and Accounts can view leads.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-teal-400/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
        <div className="relative p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <Target className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Sales</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Lead Management</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Capture, qualify and convert prospects</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) importCSV(f); e.currentTarget.value = ""; }} />
            <Button variant="outline" size="sm" className="gap-2 h-9" onClick={() => fileRef.current?.click()}><Upload className="h-4 w-4" /> Import CSV</Button>
            <Button variant="outline" size="sm" className="gap-2 h-9" onClick={exportCSV}><Download className="h-4 w-4" /> Export CSV</Button>
            <Button onClick={() => setEditing(null)} className="gap-2 h-9"><Plus className="h-4 w-4" /> Add lead</Button>
          </div>
        </div>
      </motion.div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {LEAD_STATUSES.map((s) => {
          const meta = STATUS_META[s];
          const count = stats[s] ?? 0;
          const isActive = filterStatus === s;
          return (
            <button key={s} onClick={() => setFilterStatus(isActive ? "all" : s)}
              className={"rounded-xl border bg-card p-3 text-left transition hover:border-border " + (isActive ? "ring-2 ring-primary border-primary" : "border-border/80")}>
              <div className="flex items-center gap-1.5">
                <span className={"h-2 w-2 rounded-full " + meta.dot} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{meta.label}</span>
              </div>
              <p className="text-xl font-bold text-foreground tabular-nums mt-1">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, phone, email, notes…" className="pl-9 h-9" />
        </div>
        <Select value={filterSource} onValueChange={setFilterSource}>
          <SelectTrigger className="h-9 w-full sm:w-40 text-xs"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All sources</SelectItem>
            {LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={filterCity} onChange={(e) => setFilterCity(e.target.value)} placeholder="City filter" className="h-9 w-full sm:w-36" />
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => { setSearch(""); setFilterStatus("all"); setFilterSource("all"); setFilterCity(""); }}>
            <FilterX className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border w-fit">
          {(["table", "kanban"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)} className={"px-2.5 py-1.5 rounded-md text-xs font-medium capitalize transition " + (view === v ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Target className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No leads match the current filters</p>
        </div>
      ) : view === "table" ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[1100px]">
              <colgroup>
                <col className="w-[20%]" />
                <col className="w-[18%]" />
                <col className="w-[10%]" />
                <col className="w-[14%]" />
                <col className="w-[10%]" />
                <col className="w-[11%]" />
                <col className="w-[9%]" />
                <col className="w-[8%]" />
              </colgroup>
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Lead</th>
                  <th className="text-left px-3 py-3 font-semibold">Contact</th>
                  <th className="text-left px-3 py-3 font-semibold">Source</th>
                  <th className="text-left px-3 py-3 font-semibold">Event</th>
                  <th className="text-right px-3 py-3 font-semibold">Budget</th>
                  <th className="text-left px-3 py-3 font-semibold">Status</th>
                  <th className="text-left px-3 py-3 font-semibold">Follow-up</th>
                  <th className="text-right px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((l) => (
                  <tr key={l.id} className="hover:bg-muted/20 transition-colors align-middle">
                    {/* Lead name + city */}
                    <td className="px-4 py-3 align-middle">
                      <p className="font-semibold text-foreground truncate" title={l.name}>{l.name}</p>
                      {l.city ? (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                          <MapPin className="h-3 w-3 shrink-0" /> {l.city}
                        </p>
                      ) : null}
                    </td>

                    {/* Contact stacked */}
                    <td className="px-3 py-3 text-xs align-middle">
                      <div className="space-y-1">
                        {l.phone ? (
                          <p className="text-foreground flex items-center gap-1.5 truncate" title={l.phone}>
                            <PhoneIcon className="h-3 w-3 text-muted-foreground shrink-0" /> {l.phone}
                          </p>
                        ) : null}
                        {l.email ? (
                          <p className="text-muted-foreground flex items-center gap-1.5 truncate" title={l.email}>
                            <Mail className="h-3 w-3 shrink-0" /> {l.email}
                          </p>
                        ) : null}
                        {!l.phone && !l.email ? <span className="text-muted-foreground">—</span> : null}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-3 py-3 align-middle">
                      {l.source ? (
                        <Badge variant="secondary" className="text-[10px] font-normal capitalize">{l.source}</Badge>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>

                    {/* Event */}
                    <td className="px-3 py-3 text-xs align-middle">
                      {l.event_type ? <p className="text-foreground capitalize truncate" title={l.event_type}>{l.event_type}</p> : <p className="text-muted-foreground">—</p>}
                      {l.event_date ? (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <CalendarDays className="h-3 w-3 shrink-0" /> {fmtDate(l.event_date)}
                        </p>
                      ) : null}
                    </td>

                    {/* Budget */}
                    <td className="px-3 py-3 text-right tabular-nums font-medium text-foreground align-middle">
                      {l.budget ? inr(l.budget) : <span className="text-muted-foreground font-normal">—</span>}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3 align-middle">
                      <Select value={String(l.status)} onValueChange={(v) => setStatus.mutate({ id: l.id, status: v as LeadStatus })}>
                        <SelectTrigger className={"h-7 w-full text-[11px] font-medium capitalize border " + (STATUS_META[String(l.status)]?.color || "")}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAD_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className="inline-flex items-center gap-2">
                                <span className={"h-2 w-2 rounded-full " + STATUS_META[s].dot} />
                                {STATUS_META[s].label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>

                    {/* Follow-up */}
                    <td className="px-3 py-3 text-xs text-muted-foreground tabular-nums align-middle">
                      {l.follow_up_date ? fmtDate(l.follow_up_date) : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center justify-end gap-0.5">
                        {l.status !== "converted" && (
                          <Button
                            size="icon" variant="ghost"
                            className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10"
                            title="Convert to client"
                            onClick={() => { if (window.confirm(`Convert ${l.name} to a client?`)) convertToClient.mutate(l); }}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7" title="Edit" onClick={() => setEditing(l)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                          title="Delete"
                          onClick={() => { if (window.confirm("Delete this lead?")) remove.mutate(l.id); }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">
            <span>Showing <span className="font-medium text-foreground">{filtered.length}</span> of <span className="font-medium text-foreground">{leads.length}</span> leads</span>
            {activeFilterCount > 0 ? <span className="inline-flex items-center gap-1"><Filter className="h-3 w-3" /> {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active</span> : null}
          </div>
        </div>
      ) : (
        // KANBAN
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {LEAD_STATUSES.map((s) => {
            const cards = filtered.filter((l) => l.status === s);
            const meta = STATUS_META[s];
            return (
              <div key={s} className="rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-border">
                  <div className="flex items-center gap-1.5">
                    <span className={"h-2 w-2 rounded-full " + meta.dot} />
                    <p className="text-xs font-semibold text-foreground capitalize">{meta.label}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{cards.length}</Badge>
                </div>
                <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                  {cards.length === 0 && <p className="text-[10px] text-muted-foreground italic text-center py-4">No leads</p>}
                  {cards.map((l) => (
                    <button key={l.id} onClick={() => setEditing(l)}
                      className="w-full text-left rounded-lg border border-border bg-background p-2.5 hover:border-primary/40 transition">
                      <p className="text-sm font-medium text-foreground truncate">{l.name}</p>
                      <div className="text-[10px] text-muted-foreground space-y-0.5 mt-1">
                        {l.phone && <p className="truncate">📞 {l.phone}</p>}
                        {l.event_type && <p className="truncate">🎉 {l.event_type}{l.event_date ? ` · ${fmtDate(l.event_date)}` : ""}</p>}
                        {l.budget && <p className="truncate">💰 {inr(l.budget)}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing !== undefined && (
        <LeadDialog
          open onOpenChange={() => setEditing(undefined)}
          editing={editing}
          onSubmit={async (payload) => {
            if (editing) await update.mutateAsync({ id: editing.id, ...payload });
            else await add.mutateAsync(payload);
          }}
        />
      )}
    </div>
  );
}

// ─────────── Add/Edit lead dialog ───────────
function LeadDialog({ open, onOpenChange, editing, onSubmit }: { open: boolean; onOpenChange: () => void; editing: DbLead | null; onSubmit: (p: Partial<DbLead>) => Promise<void> }) {
  const [form, setForm] = useState({
    name: editing?.name || "",
    phone: editing?.phone || "",
    email: editing?.email || "",
    source: editing?.source || LEAD_SOURCES[0],
    event_type: editing?.event_type || "",
    event_date: editing?.event_date || "",
    city: editing?.city || "",
    budget: Number(editing?.budget || 0),
    status: editing?.status || ("new" as LeadStatus),
    follow_up_date: editing?.follow_up_date || "",
    notes: editing?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    setSaving(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        source: form.source || null,
        event_type: form.event_type.trim() || null,
        event_date: form.event_date || null,
        city: form.city.trim() || null,
        budget: form.budget || null,
        status: form.status,
        follow_up_date: form.follow_up_date || null,
        notes: form.notes.trim() || null,
      } as any);
      onOpenChange();
    } finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-emerald-500" /> {editing ? "Edit lead" : "Add lead"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Field label="Name *"><Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Source">
              <Select value={form.source} onValueChange={(v) => setForm((p) => ({ ...p, source: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
            <Field label="Status">
              <Select value={String(form.status)} onValueChange={(v) => setForm((p) => ({ ...p, status: v as LeadStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}</SelectContent>
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Event type"><Input value={form.event_type} onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value }))} placeholder="Wedding, Reception…" /></Field>
            <Field label="Event date"><Input type="date" value={form.event_date} onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City"><Input value={form.city} onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))} /></Field>
            <Field label="Budget (₹)"><Input type="number" value={form.budget || ""} onChange={(e) => setForm((p) => ({ ...p, budget: Number(e.target.value || 0) }))} /></Field>
          </div>
          <Field label="Follow-up date"><Input type="date" value={form.follow_up_date} onChange={(e) => setForm((p) => ({ ...p, follow_up_date: e.target.value }))} /></Field>
          <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></Field>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onOpenChange} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.name.trim()} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{editing ? "Save" : "Add lead"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>;
}
