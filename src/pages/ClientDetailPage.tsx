import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Phone, MapPin, Heart, Building2,
  Loader2, Trash2, MoreHorizontal, ExternalLink, Sparkles,
  Eraser, Mail, Lock, Check,
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

type SectionKey = "couple" | "contact" | "venue" | "basic";

const SECTION_FIELDS: Record<SectionKey, (keyof DbClient)[]> = {
  couple: ["marriage_date", "engagement_date", "date_of_birth", "partner_date_of_birth"],
  contact: ["phone", "email", "partner_phone", "partner_email", "address", "city"],
  venue: [
    "venue_name", "venue_address", "venue_city", "venue_pincode",
    "venue_landmark", "venue_map_url",
    "venue_contact_person", "venue_contact_phone", "venue_notes",
  ],
  basic: ["source", "budget", "notes"],
};

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

  // Save a single field. Empty strings → null.
  const saveField = async (key: keyof DbClient, raw: any) => {
    const value =
      raw === "" || raw === undefined ? null :
      key === "budget" ? (raw === null ? null : Number(raw)) :
      raw;
    await updateClient.mutateAsync({ id: client.id, [key]: value } as any);
  };

  const clearSection = async (sectionKey: SectionKey, sectionLabel: string) => {
    if (!window.confirm(`Clear all fields in "${sectionLabel}"? Values will be set to empty.`)) return;
    const patch: Record<string, any> = { id: client.id };
    for (const f of SECTION_FIELDS[sectionKey]) patch[f as string] = null;
    await updateClient.mutateAsync(patch as any);
    toast.success(`${sectionLabel} cleared`);
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
      <SectionShell title="Couple" icon={<Heart className="h-4 w-4 text-rose-500" />} onClear={() => clearSection("couple", "Couple dates")}>
        <Row>
          <LockedField label="Primary contact name" value={client.name} />
          <LockedField label="Partner name" value={client.partner_name} />
        </Row>
        <Row>
          <InlineField label="Marriage / event date" value={client.marriage_date} type="date" onSave={(v) => saveField("marriage_date", v)} />
          <InlineField label="Engagement date" value={client.engagement_date} type="date" onSave={(v) => saveField("engagement_date", v)} />
        </Row>
        <Row>
          <InlineField label="Primary DOB" value={client.date_of_birth} type="date" onSave={(v) => saveField("date_of_birth", v)} />
          <InlineField label="Partner DOB" value={client.partner_date_of_birth} type="date" onSave={(v) => saveField("partner_date_of_birth", v)} />
        </Row>
      </SectionShell>

      {/* CONTACT */}
      <SectionShell title="Contact" icon={<Phone className="h-4 w-4 text-emerald-500" />} onClear={() => clearSection("contact", "Contact")}>
        <Row>
          <InlineField label="Primary phone" value={client.phone} type="text" placeholder="+91 98765 43210" onSave={(v) => saveField("phone", v)} />
          <InlineField label="Primary email" value={client.email} type="email" placeholder="couple@email.com" onSave={(v) => saveField("email", v)} />
        </Row>
        <Row>
          <InlineField label="Partner phone" value={client.partner_phone} type="text" onSave={(v) => saveField("partner_phone", v)} />
          <InlineField label="Partner email" value={client.partner_email} type="email" onSave={(v) => saveField("partner_email", v)} />
        </Row>
        <Row>
          <InlineField label="Address" value={client.address} type="textarea" placeholder="Street, area" onSave={(v) => saveField("address", v)} />
          <InlineField label="City" value={client.city} type="text" placeholder="Mumbai" onSave={(v) => saveField("city", v)} />
        </Row>
      </SectionShell>

      {/* VENUE */}
      <SectionShell title="Venue" icon={<Building2 className="h-4 w-4 text-violet-500" />} onClear={() => clearSection("venue", "Venue")}>
        <Row>
          <InlineField label="Venue name" value={client.venue_name} type="text" placeholder="Taj Banquet Hall" onSave={(v) => saveField("venue_name", v)} />
          <InlineField label="City" value={client.venue_city} type="text" onSave={(v) => saveField("venue_city", v)} />
        </Row>
        <Row>
          <InlineField label="Address" value={client.venue_address} type="textarea" placeholder="Full street address" onSave={(v) => saveField("venue_address", v)} />
          <InlineField label="Pincode" value={client.venue_pincode} type="text" placeholder="400001" onSave={(v) => saveField("venue_pincode", v)} />
        </Row>
        <Row>
          <InlineField label="Landmark" value={client.venue_landmark} type="text" placeholder="Near Gateway of India" onSave={(v) => saveField("venue_landmark", v)} />
          <InlineField
            label="Google Maps URL"
            value={client.venue_map_url}
            type="text"
            placeholder="https://maps.app.goo.gl/…"
            onSave={(v) => saveField("venue_map_url", v)}
            displayView={client.venue_map_url ? (
              <a href={client.venue_map_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
                Open in Google Maps <ExternalLink className="h-3 w-3" />
              </a>
            ) : null}
          />
        </Row>
        <Row>
          <InlineField label="Contact person" value={client.venue_contact_person} type="text" placeholder="Mr Sharma — Events Manager" onSave={(v) => saveField("venue_contact_person", v)} />
          <InlineField label="Contact phone" value={client.venue_contact_phone} type="text" onSave={(v) => saveField("venue_contact_phone", v)} />
        </Row>
        <InlineField label="Venue notes" value={client.venue_notes} type="textarea" placeholder="Parking, power, restrictions, AV setup…" onSave={(v) => saveField("venue_notes", v)} />
      </SectionShell>

      {/* BASIC */}
      <SectionShell title="Notes & basic" icon={<Sparkles className="h-4 w-4 text-amber-500" />} onClear={() => clearSection("basic", "Notes & basic")}>
        <Row>
          <InlineField label="Source" value={client.source} type="text" placeholder="Instagram / Referral / …" onSave={(v) => saveField("source", v)} />
          <InlineField label="Budget (₹)" value={client.budget} type="number" placeholder="150000" onSave={(v) => saveField("budget", v)} />
        </Row>
        <InlineField label="Notes" value={client.notes} type="textarea" placeholder="Tap to add notes…" onSave={(v) => saveField("notes", v)} />
      </SectionShell>
    </div>
  );
}

// ============================================================================
// SECTION SHELL — header with title + clear-section action
// ============================================================================

function SectionShell({
  title, icon, onClear, children,
}: {
  title: string;
  icon: React.ReactNode;
  onClear: () => Promise<void>;
  children: React.ReactNode;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">{icon}</div>
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem className="text-destructive" onClick={onClear}>
              <Eraser className="h-3.5 w-3.5 mr-2" /> Clear section
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">{children}</div>
    </motion.div>
  );
}

// ============================================================================
// INLINE FIELD — click to edit, blur/Enter saves, Esc cancels
// ============================================================================

type InlineFieldType = "text" | "email" | "date" | "textarea" | "number";

function InlineField({
  label, value, type, placeholder, onSave, displayView,
}: {
  label: string;
  value: any;
  type: InlineFieldType;
  placeholder?: string;
  onSave: (next: any) => Promise<void>;
  /** Optional custom render for read mode (e.g. a clickable link). */
  displayView?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>(value == null ? "" : String(value));
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Re-sync draft when value changes from outside (e.g. after a clear-section)
  useEffect(() => {
    if (!editing) setDraft(value == null ? "" : String(value));
  }, [value, editing]);

  const startEdit = () => {
    setDraft(value == null ? "" : String(value));
    setEditing(true);
    // focus on next tick
    setTimeout(() => {
      inputRef.current?.focus();
      if (inputRef.current && "select" in inputRef.current && typeof inputRef.current.select === "function") {
        try { inputRef.current.select(); } catch { /* ignore */ }
      }
    }, 0);
  };

  const commit = async () => {
    const original = value == null ? "" : String(value);
    if (draft === original) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      // type=number: convert empty to null, otherwise to number
      let toSave: any = draft;
      if (type === "number") toSave = draft === "" ? null : Number(draft);
      await onSave(toSave);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1200);
    } catch (e: any) {
      toast.error(e?.message || "Could not save");
      setDraft(original);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const cancel = () => {
    setDraft(value == null ? "" : String(value));
    setEditing(false);
  };

  // Display formatting
  const hasValue = value != null && value !== "";
  let display: React.ReactNode;
  if (displayView) {
    display = displayView;
  } else if (!hasValue) {
    display = (
      <p className="text-sm text-muted-foreground italic">
        {placeholder ? `Click to add — ${placeholder}` : "Click to add"}
      </p>
    );
  } else if (type === "date") {
    try {
      display = (
        <p className="text-sm text-foreground">
          {new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
        </p>
      );
    } catch {
      display = <p className="text-sm text-foreground">{String(value)}</p>;
    }
  } else if (type === "number" && label.toLowerCase().includes("budget")) {
    const n = Number(value);
    display = <p className="text-sm text-foreground tabular-nums">₹{isNaN(n) ? value : n.toLocaleString("en-IN")}</p>;
  } else {
    display = (
      <p className="text-sm text-foreground break-words whitespace-pre-wrap">{String(value)}</p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {saving && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
        {justSaved && !saving && <Check className="h-3 w-3 text-emerald-500" />}
      </div>

      {editing ? (
        type === "textarea" ? (
          <Textarea
            ref={(el) => { inputRef.current = el; }}
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              // Enter inside textarea creates new line — Cmd/Ctrl+Enter saves
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); commit(); }
            }}
            placeholder={placeholder}
            disabled={saving}
          />
        ) : (
          <Input
            ref={(el) => { inputRef.current = el; }}
            type={type === "email" ? "email" : type === "date" ? "date" : type === "number" ? "number" : "text"}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter") { e.preventDefault(); commit(); }
            }}
            placeholder={placeholder}
            disabled={saving}
          />
        )
      ) : (
        <button
          type="button"
          onClick={startEdit}
          className="w-full text-left min-h-[36px] rounded-md px-2 py-1.5 -mx-2 hover:bg-muted/40 hover:ring-1 hover:ring-border transition cursor-text group"
        >
          {display}
        </button>
      )}
    </div>
  );
}

// Couple names are locked — display only, no click handler
function LockedField({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Lock className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="min-h-[36px] rounded-md px-2 py-1.5 -mx-2 bg-muted/20">
        <p className={"text-sm " + (value ? "text-foreground" : "text-muted-foreground")}>
          {value || "—"}
        </p>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>;
}
