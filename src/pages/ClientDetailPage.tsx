import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Phone, MapPin, Heart, Building2, Pencil,
  Save, X, Loader2, Trash2, MoreHorizontal, ExternalLink, Sparkles,
  Mail, Lock,
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

  const client = useMemo(() => clients.find((c) => c.id === id), [clients, id]);

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

  const initials = (client.name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  const couple = client.partner_name ? `${client.name} & ${client.partner_name}` : client.name;

  const saveFields = async (values: Record<string, any>) => {
    const patch: Record<string, any> = { id: client.id };
    for (const [k, v] of Object.entries(values)) {
      if (typeof v === "string" && v.trim() === "") patch[k] = null;
      else if (v === undefined) patch[k] = null;
      else patch[k] = v;
    }
    await updateClient.mutateAsync(patch as any);
  };

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

      {/* COUPLE */}
      <EditableSection
        title="Couple"
        icon={<Heart className="h-4 w-4 text-rose-500" />}
        initialValues={{
          marriage_date: client.marriage_date,
          engagement_date: client.engagement_date,
          date_of_birth: client.date_of_birth,
          partner_date_of_birth: client.partner_date_of_birth,
        }}
        onSave={saveFields}
        renderView={() => (
          <>
            <Row>
              <LockedField label="Primary contact name" value={client.name} />
              <LockedField label="Partner name" value={client.partner_name} />
            </Row>
            <Row>
              <ReadField label="Marriage / event date" value={client.marriage_date} type="date" />
              <ReadField label="Engagement date" value={client.engagement_date} type="date" />
            </Row>
            <Row>
              <ReadField label="Primary DOB" value={client.date_of_birth} type="date" />
              <ReadField label="Partner DOB" value={client.partner_date_of_birth} type="date" />
            </Row>
          </>
        )}
        renderEdit={(v, set) => (
          <>
            <Row>
              <Field label="Primary contact name (locked)"><Input value={client.name || ""} disabled /></Field>
              <Field label="Partner name (locked)"><Input value={client.partner_name || ""} disabled /></Field>
            </Row>
            <Row>
              <Field label="Marriage / event date"><Input type="date" value={v.marriage_date || ""} onChange={(e) => set("marriage_date", e.target.value)} /></Field>
              <Field label="Engagement date"><Input type="date" value={v.engagement_date || ""} onChange={(e) => set("engagement_date", e.target.value)} /></Field>
            </Row>
            <Row>
              <Field label="Primary DOB"><Input type="date" value={v.date_of_birth || ""} onChange={(e) => set("date_of_birth", e.target.value)} /></Field>
              <Field label="Partner DOB"><Input type="date" value={v.partner_date_of_birth || ""} onChange={(e) => set("partner_date_of_birth", e.target.value)} /></Field>
            </Row>
          </>
        )}
      />

      {/* CONTACT */}
      <EditableSection
        title="Contact"
        icon={<Phone className="h-4 w-4 text-emerald-500" />}
        initialValues={{
          phone: client.phone, email: client.email,
          partner_phone: client.partner_phone, partner_email: client.partner_email,
          address: client.address, city: client.city,
        }}
        onSave={saveFields}
        renderView={() => (
          <>
            <Row>
              <ReadField label="Primary phone" value={client.phone} />
              <ReadField label="Primary email" value={client.email} />
            </Row>
            <Row>
              <ReadField label="Partner phone" value={client.partner_phone} />
              <ReadField label="Partner email" value={client.partner_email} />
            </Row>
            <Row>
              <ReadField label="Address" value={client.address} />
              <ReadField label="City" value={client.city} />
            </Row>
          </>
        )}
        renderEdit={(v, set) => (
          <>
            <Row>
              <Field label="Primary phone"><Input value={v.phone || ""} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" /></Field>
              <Field label="Primary email"><Input type="email" value={v.email || ""} onChange={(e) => set("email", e.target.value)} placeholder="couple@email.com" /></Field>
            </Row>
            <Row>
              <Field label="Partner phone"><Input value={v.partner_phone || ""} onChange={(e) => set("partner_phone", e.target.value)} /></Field>
              <Field label="Partner email"><Input type="email" value={v.partner_email || ""} onChange={(e) => set("partner_email", e.target.value)} /></Field>
            </Row>
            <Row>
              <Field label="Address"><Textarea rows={2} value={v.address || ""} onChange={(e) => set("address", e.target.value)} placeholder="Street, area" /></Field>
              <Field label="City"><Input value={v.city || ""} onChange={(e) => set("city", e.target.value)} placeholder="Mumbai" /></Field>
            </Row>
          </>
        )}
      />

      {/* VENUE */}
      <EditableSection
        title="Venue"
        icon={<Building2 className="h-4 w-4 text-violet-500" />}
        initialValues={{
          venue_name: client.venue_name, venue_address: client.venue_address,
          venue_city: client.venue_city, venue_pincode: client.venue_pincode,
          venue_landmark: client.venue_landmark, venue_map_url: client.venue_map_url,
          venue_contact_person: client.venue_contact_person,
          venue_contact_phone: client.venue_contact_phone,
          venue_notes: client.venue_notes,
        }}
        onSave={saveFields}
        renderView={() => (
          <>
            <Row>
              <ReadField label="Venue name" value={client.venue_name} />
              <ReadField label="City" value={client.venue_city} />
            </Row>
            <Row>
              <ReadField label="Address" value={client.venue_address} />
              <ReadField label="Pincode" value={client.venue_pincode} />
            </Row>
            <Row>
              <ReadField label="Landmark" value={client.venue_landmark} />
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Google Maps URL</Label>
                {client.venue_map_url ? (
                  <a href={client.venue_map_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                    Open in Google Maps <ExternalLink className="h-3 w-3" />
                  </a>
                ) : <p className="text-sm text-muted-foreground">—</p>}
              </div>
            </Row>
            <Row>
              <ReadField label="Contact person" value={client.venue_contact_person} />
              <ReadField label="Contact phone" value={client.venue_contact_phone} />
            </Row>
            <ReadField label="Venue notes" value={client.venue_notes} />
          </>
        )}
        renderEdit={(v, set) => (
          <>
            <Row>
              <Field label="Venue name"><Input value={v.venue_name || ""} onChange={(e) => set("venue_name", e.target.value)} placeholder="Taj Banquet Hall" /></Field>
              <Field label="City"><Input value={v.venue_city || ""} onChange={(e) => set("venue_city", e.target.value)} /></Field>
            </Row>
            <Row>
              <Field label="Address"><Textarea rows={2} value={v.venue_address || ""} onChange={(e) => set("venue_address", e.target.value)} placeholder="Full street address" /></Field>
              <Field label="Pincode"><Input value={v.venue_pincode || ""} onChange={(e) => set("venue_pincode", e.target.value)} placeholder="400001" /></Field>
            </Row>
            <Row>
              <Field label="Landmark"><Input value={v.venue_landmark || ""} onChange={(e) => set("venue_landmark", e.target.value)} placeholder="Near Gateway of India" /></Field>
              <Field label="Google Maps URL"><Input value={v.venue_map_url || ""} onChange={(e) => set("venue_map_url", e.target.value)} placeholder="https://maps.app.goo.gl/…" /></Field>
            </Row>
            <Row>
              <Field label="Contact person"><Input value={v.venue_contact_person || ""} onChange={(e) => set("venue_contact_person", e.target.value)} placeholder="Mr Sharma — Events Manager" /></Field>
              <Field label="Contact phone"><Input value={v.venue_contact_phone || ""} onChange={(e) => set("venue_contact_phone", e.target.value)} /></Field>
            </Row>
            <Field label="Venue notes"><Textarea rows={3} value={v.venue_notes || ""} onChange={(e) => set("venue_notes", e.target.value)} placeholder="Parking, power, restrictions, AV setup…" /></Field>
          </>
        )}
      />

      {/* BASIC */}
      <EditableSection
        title="Notes & basic"
        icon={<Sparkles className="h-4 w-4 text-amber-500" />}
        initialValues={{
          source: client.source,
          budget: client.budget,
          notes: client.notes,
        }}
        onSave={saveFields}
        renderView={() => (
          <>
            <Row>
              <ReadField label="Source" value={client.source} />
              <ReadField label="Budget (₹)" value={client.budget != null ? `₹${Number(client.budget).toLocaleString("en-IN")}` : null} />
            </Row>
            <ReadField label="Notes" value={client.notes} />
          </>
        )}
        renderEdit={(v, set) => (
          <>
            <Row>
              <Field label="Source"><Input value={v.source || ""} onChange={(e) => set("source", e.target.value)} placeholder="Instagram / Referral / …" /></Field>
              <Field label="Budget (₹)"><Input type="number" value={v.budget ?? ""} onChange={(e) => set("budget", e.target.value === "" ? null : Number(e.target.value))} placeholder="150000" /></Field>
            </Row>
            <Field label="Notes"><Textarea rows={4} value={v.notes || ""} onChange={(e) => set("notes", e.target.value)} placeholder="Any notes about this client…" /></Field>
          </>
        )}
      />
    </div>
  );
}

// ============================================================================
// EDITABLE SECTION — header with Edit/Save/Cancel
// ============================================================================

function EditableSection({
  title, icon, initialValues, renderView, renderEdit, onSave,
}: {
  title: string;
  icon: React.ReactNode;
  initialValues: Record<string, any>;
  renderView: () => React.ReactNode;
  renderEdit: (values: Record<string, any>, set: (k: string, v: any) => void) => React.ReactNode;
  onSave: (values: Record<string, any>) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<string, any>>(initialValues);
  const [saving, setSaving] = useState(false);

  // Re-sync when DB state changes (after a save) and we're not editing
  useEffect(() => {
    if (!editing) setValues(initialValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initialValues), editing]);

  const set = (k: string, v: any) => setValues((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      await onSave(values);
      setEditing(false);
    } catch (e: any) {
      toast.error(e?.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const cancel = () => {
    setValues(initialValues);
    setEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">{icon}</div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          {!editing ? (
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => setEditing(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="gap-1.5 h-8" onClick={cancel} disabled={saving}>
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button size="sm" className="gap-1.5 h-8" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        {editing ? renderEdit(values, set) : renderView()}
      </div>
    </motion.div>
  );
}

// ============================================================================
// SMALL HELPERS
// ============================================================================

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

function ReadField({ label, value, type }: { label: string; value: any; type?: "date" }) {
  let display: React.ReactNode = "—";
  if (value != null && value !== "") {
    if (type === "date") {
      try {
        display = new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      } catch {
        display = String(value);
      }
    } else {
      display = String(value);
    }
  }
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className={"text-sm break-words whitespace-pre-wrap " + (display === "—" ? "text-muted-foreground" : "text-foreground")}>
        {display}
      </p>
    </div>
  );
}

function LockedField({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Lock className="h-3 w-3 text-muted-foreground" />
      </div>
      <p className={"text-sm " + (value ? "text-foreground" : "text-muted-foreground")}>
        {value || "—"}
      </p>
    </div>
  );
}
