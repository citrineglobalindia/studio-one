import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Users, Plus, Pencil, Trash2, Loader2, Search, Phone, Mail,
  Banknote, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HRTabs } from "@/components/hr/HRTabs";
import { useEmployees, type DbEmployee } from "@/hooks/useHR";
import { useRole } from "@/contexts/RoleContext";

const TYPES = ["Full-time", "Part-time", "Contractor", "Intern"];
const STATUSES = ["active", "on-leave", "inactive"];

function inr(n: number | null | undefined) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n ?? 0)); }
function initials(n: string) { return (n || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join(""); }

export default function HREmployeesPage() {
  const { currentRole } = useRole();
  const allowed = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts";
  const canEdit = currentRole === "admin" || currentRole === "administrator";
  const { employees, isLoading, add, update, remove } = useEmployees();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<DbEmployee | null | undefined>(undefined);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase(); if (!q) return employees;
    return employees.filter((e) => [e.full_name, e.email, e.phone, e.role, e.department].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [employees, search]);

  if (!allowed) return <RestrictedNotice />;

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <HRHero />
      <HRTabs />
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, role, phone…" className="pl-9 h-9" />
        </div>
        {canEdit && <Button onClick={() => setEditing(null)} className="gap-2 h-9"><Plus className="h-4 w-4" /> Add employee</Button>}
      </div>

      {isLoading ? (
        <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center"><Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" /><p className="text-sm text-muted-foreground">No employees yet</p></div>
      ) : (
        <motion.div initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.03 } } }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((e) => (
            <motion.div key={e.id} variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/25 to-primary/5 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">{initials(e.full_name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{e.full_name}</p>
                  <p className="text-[11px] text-muted-foreground capitalize truncate">{(e.role || "—").replace(/_/g, " ")}{e.department ? " · " + e.department : ""}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {e.status && <Badge variant="outline" className={"text-[10px] capitalize " + (e.status === "active" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" : "bg-muted text-muted-foreground")}>{e.status}</Badge>}
                    {e.type && <Badge variant="secondary" className="text-[10px]">{e.type}</Badge>}
                  </div>
                </div>
                {canEdit && (
                  <div className="flex flex-col gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => { if (window.confirm("Remove this employee?")) remove.mutate(e.id); }}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                )}
              </div>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {e.email && <p className="inline-flex items-center gap-1.5"><Mail className="h-3 w-3" />{e.email}</p>}
                {e.phone && <p className="inline-flex items-center gap-1.5"><Phone className="h-3 w-3" />{e.phone}</p>}
                {e.salary && <p className="inline-flex items-center gap-1.5"><Banknote className="h-3 w-3" />{inr(e.salary)} / month</p>}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {editing !== undefined && (
        <EmployeeDialog open onOpenChange={() => setEditing(undefined)} editing={editing}
          onSubmit={async (payload) => { if (editing) await update.mutateAsync({ id: editing.id, ...payload }); else await add.mutateAsync(payload); }}
        />
      )}
    </div>
  );
}

export function HRHero() {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
      <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 via-emerald-400/5 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />
      <div className="relative p-5 md:p-6 flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500/25 to-teal-500/5 border border-teal-500/30 flex items-center justify-center shadow-sm"><Users className="h-6 w-6 text-teal-500" /></div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">People</p>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">HR</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Employees, salary, payslips, attendance &amp; leaves</p>
        </div>
      </div>
    </motion.div>
  );
}

export function RestrictedNotice() {
  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
      <Users className="h-12 w-12 text-muted-foreground/30 mx-auto" />
      <p className="text-base font-semibold text-foreground">HR module is restricted</p>
      <p className="text-sm text-muted-foreground">Only Admin, Administrator and Accounts can view this page.</p>
    </div>
  );
}

function EmployeeDialog({ open, onOpenChange, editing, onSubmit }: { open: boolean; onOpenChange: () => void; editing: DbEmployee | null; onSubmit: (p: Partial<DbEmployee>) => Promise<void>; }) {
  const [form, setForm] = useState({
    full_name: editing?.full_name || "", email: editing?.email || "", phone: editing?.phone || "",
    role: editing?.role || "", department: editing?.department || "", type: editing?.type || "Full-time",
    status: editing?.status || "active", join_date: editing?.join_date || "", salary: Number(editing?.salary || 0),
    bank_name: editing?.bank_name || "", bank_account: editing?.bank_account || "", bank_ifsc: editing?.bank_ifsc || "",
    aadhaar: editing?.aadhaar || "", pan: editing?.pan || "", address: editing?.address || "", notes: editing?.notes || "",
  });
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!form.full_name.trim()) return;
    setSaving(true);
    try {
      await onSubmit({ ...form, full_name: form.full_name.trim(), email: form.email.trim() || null, phone: form.phone.trim() || null, role: form.role.trim() || null, department: form.department.trim() || null, join_date: form.join_date || null, salary: form.salary || null, bank_name: form.bank_name.trim() || null, bank_account: form.bank_account.trim() || null, bank_ifsc: form.bank_ifsc.trim() || null, aadhaar: form.aadhaar.trim() || null, pan: form.pan.trim() || null, address: form.address.trim() || null, notes: form.notes.trim() || null } as any);
      onOpenChange();
    } finally { setSaving(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-teal-500" /> {editing ? "Edit employee" : "Add employee"}</DialogTitle></DialogHeader>
        <div className="flex-1 overflow-y-auto pr-1 space-y-5">
          <SectionDlg title="Identity">
            <Row><Field label="Full name *"><Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} /></Field><Field label="Role / designation"><Input value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="e.g. Photographer" /></Field></Row>
            <Row><Field label="Email"><Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} /></Field><Field label="Phone"><PhoneInput value={form.phone} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} /></Field></Row>
            <Row><Field label="Department"><Input value={form.department} onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))} placeholder="e.g. Operations" /></Field><Field label="Type"><Select value={form.type} onValueChange={(v) => setForm((p) => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></Field></Row>
            <Row><Field label="Status"><Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Field><Field label="Join date"><Input type="date" value={form.join_date} onChange={(e) => setForm((p) => ({ ...p, join_date: e.target.value }))} /></Field></Row>
            <Field label="Address"><Textarea rows={2} value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} /></Field>
          </SectionDlg>
          <SectionDlg title="Compensation"><Field label="Monthly salary (₹)"><Input type="number" value={form.salary || ""} onChange={(e) => setForm((p) => ({ ...p, salary: Number(e.target.value || 0) }))} /></Field></SectionDlg>
          <SectionDlg title="Bank details">
            <Row><Field label="Bank name"><Input value={form.bank_name} onChange={(e) => setForm((p) => ({ ...p, bank_name: e.target.value }))} /></Field><Field label="IFSC"><Input value={form.bank_ifsc} onChange={(e) => setForm((p) => ({ ...p, bank_ifsc: e.target.value }))} /></Field></Row>
            <Field label="Account number"><Input value={form.bank_account} onChange={(e) => setForm((p) => ({ ...p, bank_account: e.target.value }))} /></Field>
          </SectionDlg>
          <SectionDlg title="Identification">
            <Row><Field label="PAN"><Input value={form.pan} onChange={(e) => setForm((p) => ({ ...p, pan: e.target.value }))} placeholder="ABCDE1234F" /></Field><Field label="Aadhaar"><Input value={form.aadhaar} onChange={(e) => setForm((p) => ({ ...p, aadhaar: e.target.value }))} /></Field></Row>
            <Field label="Notes"><Textarea rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} /></Field>
          </SectionDlg>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onOpenChange} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !form.full_name.trim()} className="gap-2">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{editing ? "Save" : "Add employee"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionDlg({ title, children }: { title: string; children: React.ReactNode }) { return <div className="space-y-3"><p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">{title}</p><div className="space-y-3">{children}</div></div>; }
function Row({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="space-y-1.5"><Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</Label>{children}</div>; }
