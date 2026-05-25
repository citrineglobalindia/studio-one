import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Phone, Mail, MapPin, Heart, Building2, Pencil,
  Save, X, Loader2, Trash2, MoreHorizontal, CalendarDays, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClients, type DbClient } from "@/hooks/useClients";
import { toast } from "sonner";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { clients, isLoading, updateClient, deleteClient } = useClients();

  const client = clients.find((c) => c.id === id);

  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<DbClient>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (client) setForm({ ...client });
  }, [client?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 p-6">
        <p className="text-muted-foreground">Client not found</p>
        <Button onClick={() => navigate("/clients")} variant="outline">Back to clients</Button>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      // Lock couple-name fields: ignore form.name + form.partner_name
      const { name, partner_name, ...editable } = form as any;
      await updateClient.mutateAsync({ id: client.id, ...editable });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const initials = (client.name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  const couple = client.partner_name ? `${client.name} & ${client.partner_name}` : client.name;

  const upd = (k: keyof DbClient, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-5 pb-10">
      {/* Top bar */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/clients")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-semibold">Client</p>
          <h1 className="text-lg font-bold text-foreground truncate">{couple}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!editing ? (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { setEditing(false); setForm(client); }} disabled={saving}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" className="gap-1.5" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  if (!window.confirm(`Delete ${couple}? This cannot be undone.`)) return;
                  deleteClient.mutate(client.id, { onSuccess: () => navigate("/clients") });
                }}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete client
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-rose-400/10 to-amber-200/10 p-6 flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-card border border-border flex items-center justify-center text-xl font-bold text-primary shrink-0">
          {initials || "C"}
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold text-foreground truncate">{couple}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
            {client.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{client.phone}</span>}
            {client.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{client.email}</span>}
            {client.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{client.city}</span>}
            {client.source && <Badge variant="secondary" className="text-[10px]">{client.source}</Badge>}
          </div>
        </div>
      </motion.div>

      {/* Couple section — names locked */}
      <Section title="Couple" icon={<Heart className="h-4 w-4 text-rose-500" />}>
        <Row>
          <Field label="Primary contact name (locked)">
            <Input value={client.name || ""} disabled />
          </Field>
          <Field label="Partner name (locked)">
            <Input value={client.partner_name || ""} disabled />
          </Field>
        </Row>
        <Row>
          <Field label="Marriage / event date">
            {editing ? <Input type="date" value={(form.marriage_date as string) || ""} onChange={(e) => upd("marriage_date", e.target.value || null)} /> : <ReadOnly v={client.marriage_date} type="date" />}
          </Field>
          <Field label="Engagement date">
            {editing ? <Input type="date" value={(form.engagement_date as string) || ""} onChange={(e) => upd("engagement_date", e.target.value || null)} /> : <ReadOnly v={client.engagement_date} type="date" />}
          </Field>
        </Row>
        <Row>
          <Field label="Primary DOB">
            {editing ? <Input type="date" value={(form.date_of_birth as string) || ""} onChange={(e) => upd("date_of_birth", e.target.value || null)} /> : <ReadOnly v={client.date_of_birth} type="date" />}
          </Field>
          <Field label="Partner DOB">
            {editing ? <Input type="date" value={(form.partner_date_of_birth as string) || ""} onChange={(e) => upd("partner_date_of_birth", e.target.value || null)} /> : <ReadOnly v={client.partner_date_of_birth} type="date" />}
          </Field>
        </Row>
      </Section>

      {/* Contact */}
      <Section title="Contact" icon={<Phone className="h-4 w-4 text-emerald-500" />}>
        <Row>
          <Field label="Primary phone">
            {editing ? <Input value={(form.phone as string) || ""} onChange={(e) => upd("phone", e.target.value)} /> : <ReadOnly v={client.phone} />}
          </Field>
          <Field label="Primary email">
            {editing ? <Input type="email" value={(form.email as string) || ""} onChange={(e) => upd("email", e.target.value)} /> : <ReadOnly v={client.email} />}
          </Field>
        </Row>
        <Row>
          <Field label="Partner phone">
            {editing ? <Input value={(form.partner_phone as string) || ""} onChange={(e) => upd("partner_phone", e.target.value)} /> : <ReadOnly v={client.partner_phone} />}
          </Field>
          <Field label="Partner email">
            {editing ? <Input type="email" value={(form.partner_email as string) || ""} onChange={(e) => upd("partner_email", e.target.value)} /> : <ReadOnly v={client.partner_email} />}
          </Field>
        </Row>
        <Row>
          <Field label="Address">
            {editing ? <Textarea rows={2} value={(form.address as string) || ""} onChange={(e) => upd("address", e.target.value)} /> : <ReadOnly v={client.address} />}
          </Field>
          <Field label="City">
            {editing ? <Input value={(form.city as string) || ""} onChange={(e) => upd("city", e.target.value)} /> : <ReadOnly v={client.city} />}
          </Field>
        </Row>
      </Section>

      {/* Venue */}
      <Section title="Venue" icon={<Building2 className="h-4 w-4 text-violet-500" />}>
        <Row>
          <Field label="Venue name">
            {editing ? <Input value={(form.venue_name as string) || ""} onChange={(e) => upd("venue_name", e.target.value)} /> : <ReadOnly v={client.venue_name} />}
          </Field>
          <Field label="City">
            {editing ? <Input value={(form.venue_city as string) || ""} onChange={(e) => upd("venue_city", e.target.value)} /> : <ReadOnly v={client.venue_city} />}
          </Field>
        </Row>
        <Row>
          <Field label="Address">
            {editing ? <Textarea rows={2} value={(form.venue_address as string) || ""} onChange={(e) => upd("venue_address", e.target.value)} /> : <ReadOnly v={client.venue_address} />}
          </Field>
          <Field label="Pincode">
            {editing ? <Input value={(form.venue_pincode as string) || ""} onChange={(e) => upd("venue_pincode", e.target.value)} /> : <ReadOnly v={client.venue_pincode} />}
          </Field>
        </Row>
        <Row>
          <Field label="Landmark">
            {editing ? <Input value={(form.venue_landmark as string) || ""} onChange={(e) => upd("venue_landmark", e.target.value)} /> : <ReadOnly v={client.venue_landmark} />}
          </Field>
          <Field label="Google Maps URL">
            {editing ? (
              <Input value={(form.venue_map_url as string) || ""} onChange={(e) => upd("venue_map_url", e.target.value)} />
            ) : client.venue_map_url ? (
              <a href={client.venue_map_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                Open in Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            ) : <ReadOnly v={null} />}
          </Field>
        </Row>
        <Row>
          <Field label="Contact person">
            {editing ? <Input value={(form.venue_contact_person as string) || ""} onChange={(e) => upd("venue_contact_person", e.target.value)} /> : <ReadOnly v={client.venue_contact_person} />}
          </Field>
          <Field label="Contact phone">
            {editing ? <Input value={(form.venue_contact_phone as string) || ""} onChange={(e) => upd("venue_contact_phone", e.target.value)} /> : <ReadOnly v={client.venue_contact_phone} />}
          </Field>
        </Row>
        <Field label="Venue notes">
          {editing ? <Textarea rows={3} value={(form.venue_notes as string) || ""} onChange={(e) => upd("venue_notes", e.target.value)} /> : <ReadOnly v={client.venue_notes} />}
        </Field>
      </Section>

      {/* Notes */}
      <Section title="Notes & basic" icon={<User className="h-4 w-4 text-amber-500" />}>
        <Row>
          <Field label="Source">
            {editing ? <Input value={(form.source as string) || ""} onChange={(e) => upd("source", e.target.value)} /> : <ReadOnly v={client.source} />}
          </Field>
          <Field label="Budget (₹)">
            {editing ? <Input type="number" value={(form.budget as any) ?? ""} onChange={(e) => upd("budget", e.target.value ? Number(e.target.value) : null)} /> : <ReadOnly v={client.budget != null ? `₹${client.budget}` : null} />}
          </Field>
        </Row>
        <Field label="Notes">
          {editing ? <Textarea rows={3} value={(form.notes as string) || ""} onChange={(e) => upd("notes", e.target.value)} /> : <ReadOnly v={client.notes} />}
        </Field>
      </Section>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">{icon}</div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function ReadOnly({ v, type }: { v: any; type?: "date" }) {
  if (!v) return <p className="text-sm text-muted-foreground">—</p>;
  if (type === "date") {
    try { return <p className="text-sm text-foreground">{new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</p>; } catch { return <p className="text-sm text-foreground">{String(v)}</p>; }
  }
  return <p className="text-sm text-foreground break-words">{String(v)}</p>;
}
