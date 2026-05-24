import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  UserPlus, User, Heart, Phone, Mail, MapPin, CalendarDays,
  Sparkles, IndianRupee, FileText, ChevronRight, ChevronLeft,
  Check, MapPinned, Building2, Loader2, SkipForward,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { toast } from "sonner";

interface AddClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional: called after Step 1 (client created) so the parent can refresh. */
  onAdd?: (client: any) => void;
}

const SOURCES = ["Instagram", "Referral", "Website", "Google", "WhatsApp", "Facebook", "Other"];
const EVENT_TYPES = ["Wedding", "Pre-Wedding", "Engagement", "Reception", "Sangeet", "Haldi", "Birthday", "Corporate", "Other"];

type Step1 = {
  name: string; partner_name: string;
  email: string; phone: string;
  partner_email: string; partner_phone: string;
  address: string; city: string;
  source: string;
  event_types: string[];
  other_event_type: string;
  marriage_date: string; engagement_date: string;
  date_of_birth: string; partner_date_of_birth: string;
  budget: string; notes: string;
};

type Step2 = {
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_pincode: string;
  venue_contact_person: string;
  venue_contact_phone: string;
  venue_landmark: string;
  venue_map_url: string;
  venue_notes: string;
};

const BLANK_S1: Step1 = {
  name: "", partner_name: "",
  email: "", phone: "",
  partner_email: "", partner_phone: "",
  address: "", city: "",
  source: "Instagram",
  event_types: [],
  other_event_type: "",
  marriage_date: "", engagement_date: "",
  date_of_birth: "", partner_date_of_birth: "",
  budget: "", notes: "",
};

const BLANK_S2: Step2 = {
  venue_name: "", venue_address: "", venue_city: "", venue_pincode: "",
  venue_contact_person: "", venue_contact_phone: "",
  venue_landmark: "", venue_map_url: "", venue_notes: "",
};

export function AddClientSheet({ open, onOpenChange, onAdd }: AddClientSheetProps) {
  const { addClient, updateClient } = useClients();

  const [step, setStep] = useState<1 | 2>(1);
  const [s1, setS1] = useState<Step1>(BLANK_S1);
  const [s2, setS2] = useState<Step2>(BLANK_S2);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Reset everything whenever the sheet is opened from scratch
  useEffect(() => {
    if (open) {
      setStep(1);
      setS1(BLANK_S1);
      setS2(BLANK_S2);
      setCreatedId(null);
      setSaving(false);
    }
  }, [open]);

  const update1 = <K extends keyof Step1>(k: K, v: Step1[K]) => setS1((p) => ({ ...p, [k]: v }));
  const update2 = <K extends keyof Step2>(k: K, v: Step2[K]) => setS2((p) => ({ ...p, [k]: v }));

  const toggleEventType = (t: string) => {
    setS1((p) => ({
      ...p,
      event_types: p.event_types.includes(t)
        ? p.event_types.filter((x) => x !== t)
        : [...p.event_types, t],
    }));
  };

  // ---- VALIDATION ----
  const step1Errors: Partial<Record<keyof Step1, string>> = {};
  if (!s1.name.trim()) step1Errors.name = "Required";
  if (!s1.phone.trim() || s1.phone.trim().length < 10) step1Errors.phone = "Enter a valid phone";
  if (s1.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.email)) step1Errors.email = "Invalid email";
  if (s1.partner_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s1.partner_email)) step1Errors.partner_email = "Invalid email";
  if (!s1.source) step1Errors.source = "Pick a source";
  if (s1.event_types.includes("Other") && !s1.other_event_type.trim()) {
    step1Errors.other_event_type = "Describe the event type";
  }
  const step1Valid = Object.keys(step1Errors).length === 0;

  // ---- ACTIONS ----
  const saveStep1AndNext = async () => {
    if (!step1Valid) {
      toast.error("Fix the highlighted fields first");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        name: s1.name.trim(),
        partner_name: s1.partner_name.trim() || null,
        email: s1.email.trim() || null,
        phone: s1.phone.trim(),
        partner_email: s1.partner_email.trim() || null,
        partner_phone: s1.partner_phone.trim() || null,
        address: s1.address.trim() || null,
        city: s1.city.trim() || null,
        source: s1.source,
        event_types: s1.event_types.length ? s1.event_types : null,
        event_type: s1.event_types.includes("Other") ? s1.other_event_type.trim() : (s1.event_types[0] || null),
        marriage_date: s1.marriage_date || null,
        engagement_date: s1.engagement_date || null,
        date_of_birth: s1.date_of_birth || null,
        partner_date_of_birth: s1.partner_date_of_birth || null,
        event_date: s1.marriage_date || null,
        budget: s1.budget ? Number(s1.budget) : null,
        notes: s1.notes.trim() || null,
        status: "active",
      };
      const created = await addClient.mutateAsync(payload);
      setCreatedId((created as any).id);
      onAdd?.(created);
      toast.success("Client saved — now add venue details");
      setStep(2);
    } catch (e: any) {
      toast.error(e.message || "Could not save client");
    } finally {
      setSaving(false);
    }
  };

  const finishSkipVenue = () => {
    onOpenChange(false);
  };

  const saveStep2AndClose = async () => {
    if (!createdId) {
      onOpenChange(false);
      return;
    }
    if (!s2.venue_name.trim()) {
      toast.error("Venue name is required (or click Skip)");
      return;
    }
    setSaving(true);
    try {
      await updateClient.mutateAsync({
        id: createdId,
        venue_name: s2.venue_name.trim() || null,
        venue_address: s2.venue_address.trim() || null,
        venue_city: s2.venue_city.trim() || null,
        venue_pincode: s2.venue_pincode.trim() || null,
        venue_contact_person: s2.venue_contact_person.trim() || null,
        venue_contact_phone: s2.venue_contact_phone.trim() || null,
        venue_landmark: s2.venue_landmark.trim() || null,
        venue_map_url: s2.venue_map_url.trim() || null,
        venue_notes: s2.venue_notes.trim() || null,
      } as any);
      toast.success("Venue saved");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message || "Could not save venue");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Add Client
          </SheetTitle>
          <SheetDescription>
            Step {step} of 2 — {step === 1 ? "Couple & contact details" : "Venue details"}
          </SheetDescription>

          {/* Stepper */}
          <div className="flex items-center gap-2 pt-3">
            <StepDot active={step === 1} done={step > 1} number={1} label="Couple" />
            <div className="h-px flex-1 bg-border" />
            <StepDot active={step === 2} done={false} number={2} label="Venue" />
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-6"
              >
                {/* COUPLE */}
                <Section title="Couple" icon={<Heart className="h-4 w-4 text-rose-500" />}>
                  <Row>
                    <Field label="Primary contact name *" error={step1Errors.name}>
                      <Input value={s1.name} onChange={(e) => update1("name", e.target.value)} placeholder="Riya Sharma" />
                    </Field>
                    <Field label="Partner name">
                      <Input value={s1.partner_name} onChange={(e) => update1("partner_name", e.target.value)} placeholder="Arjun Mehta" />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Marriage / event date">
                      <Input type="date" value={s1.marriage_date} onChange={(e) => update1("marriage_date", e.target.value)} />
                    </Field>
                    <Field label="Engagement date">
                      <Input type="date" value={s1.engagement_date} onChange={(e) => update1("engagement_date", e.target.value)} />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Primary DOB">
                      <Input type="date" value={s1.date_of_birth} onChange={(e) => update1("date_of_birth", e.target.value)} />
                    </Field>
                    <Field label="Partner DOB">
                      <Input type="date" value={s1.partner_date_of_birth} onChange={(e) => update1("partner_date_of_birth", e.target.value)} />
                    </Field>
                  </Row>
                </Section>

                {/* CONTACT */}
                <Section title="Contact" icon={<Phone className="h-4 w-4 text-emerald-500" />}>
                  <Row>
                    <Field label="Primary phone *" error={step1Errors.phone}>
                      <Input value={s1.phone} onChange={(e) => update1("phone", e.target.value)} placeholder="+91 98765 43210" />
                    </Field>
                    <Field label="Primary email" error={step1Errors.email}>
                      <Input type="email" value={s1.email} onChange={(e) => update1("email", e.target.value)} placeholder="couple@email.com" />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Partner phone">
                      <Input value={s1.partner_phone} onChange={(e) => update1("partner_phone", e.target.value)} placeholder="+91 98765 00000" />
                    </Field>
                    <Field label="Partner email" error={step1Errors.partner_email}>
                      <Input type="email" value={s1.partner_email} onChange={(e) => update1("partner_email", e.target.value)} placeholder="partner@email.com" />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Address">
                      <Textarea rows={2} value={s1.address} onChange={(e) => update1("address", e.target.value)} placeholder="Street, area" />
                    </Field>
                    <Field label="City">
                      <Input value={s1.city} onChange={(e) => update1("city", e.target.value)} placeholder="Mumbai" />
                    </Field>
                  </Row>
                </Section>

                {/* BASIC INFO */}
                <Section title="Basic info" icon={<Sparkles className="h-4 w-4 text-amber-500" />}>
                  <Row>
                    <Field label="Source *" error={step1Errors.source}>
                      <Select value={s1.source} onValueChange={(v) => update1("source", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Approx budget (₹)">
                      <Input type="number" value={s1.budget} onChange={(e) => update1("budget", e.target.value)} placeholder="150000" />
                    </Field>
                  </Row>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Event types</Label>
                    <div className="flex flex-wrap gap-2">
                      {EVENT_TYPES.map((t) => {
                        const active = s1.event_types.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => toggleEventType(t)}
                            className={
                              "px-3 py-1.5 rounded-full text-xs font-medium border transition " +
                              (active
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-muted/40 text-foreground border-border hover:bg-muted")
                            }
                          >
                            {active && <Check className="h-3 w-3 inline -mt-0.5 mr-1" />}{t}
                          </button>
                        );
                      })}
                    </div>
                    {s1.event_types.includes("Other") && (
                      <Field label="Describe 'Other' event type" error={step1Errors.other_event_type}>
                        <Input value={s1.other_event_type} onChange={(e) => update1("other_event_type", e.target.value)} placeholder="Anniversary, Naming, …" />
                      </Field>
                    )}
                  </div>

                  <Field label="Notes">
                    <Textarea rows={3} value={s1.notes} onChange={(e) => update1("notes", e.target.value)} placeholder="Special requests, references, anything to remember…" />
                  </Field>
                </Section>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-6 space-y-6"
              >
                <Section title="Venue" icon={<Building2 className="h-4 w-4 text-violet-500" />}>
                  <Row>
                    <Field label="Venue name *">
                      <Input value={s2.venue_name} onChange={(e) => update2("venue_name", e.target.value)} placeholder="Taj Banquet Hall" />
                    </Field>
                    <Field label="City">
                      <Input value={s2.venue_city} onChange={(e) => update2("venue_city", e.target.value)} placeholder="Mumbai" />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Address">
                      <Textarea rows={2} value={s2.venue_address} onChange={(e) => update2("venue_address", e.target.value)} placeholder="Full street address" />
                    </Field>
                    <Field label="Pincode">
                      <Input value={s2.venue_pincode} onChange={(e) => update2("venue_pincode", e.target.value)} placeholder="400001" />
                    </Field>
                  </Row>
                  <Row>
                    <Field label="Landmark">
                      <Input value={s2.venue_landmark} onChange={(e) => update2("venue_landmark", e.target.value)} placeholder="Near Gateway of India" />
                    </Field>
                    <Field label="Google Maps URL">
                      <Input value={s2.venue_map_url} onChange={(e) => update2("venue_map_url", e.target.value)} placeholder="https://maps.app.goo.gl/…" />
                    </Field>
                  </Row>
                </Section>

                <Section title="Venue contact" icon={<MapPinned className="h-4 w-4 text-emerald-500" />}>
                  <Row>
                    <Field label="Contact person">
                      <Input value={s2.venue_contact_person} onChange={(e) => update2("venue_contact_person", e.target.value)} placeholder="Mr Sharma — Events Manager" />
                    </Field>
                    <Field label="Contact phone">
                      <Input value={s2.venue_contact_phone} onChange={(e) => update2("venue_contact_phone", e.target.value)} placeholder="+91 98765 43210" />
                    </Field>
                  </Row>
                  <Field label="Venue notes">
                    <Textarea rows={3} value={s2.venue_notes} onChange={(e) => update2("venue_notes", e.target.value)} placeholder="Parking, power, restrictions, AV setup…" />
                  </Field>
                </Section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-6 py-4 flex items-center justify-between gap-2 bg-card">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
              <Button onClick={saveStep1AndNext} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Save &amp; add venue
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} disabled={saving} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={finishSkipVenue} disabled={saving} className="gap-2">
                  <SkipForward className="h-4 w-4" /> Skip for now
                </Button>
                <Button onClick={saveStep2AndClose} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save &amp; finish
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---- helpers ----
function StepDot({ active, done, number, label }: { active: boolean; done: boolean; number: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={
        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold " +
        (done
          ? "bg-emerald-500 text-white"
          : active
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground")
      }>
        {done ? <Check className="h-3.5 w-3.5" /> : number}
      </div>
      <span className={
        "text-xs font-medium " + (active || done ? "text-foreground" : "text-muted-foreground")
      }>{label}</span>
    </div>
  );
}

function Section({
  title, icon, children,
}: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center">{icon}</div>
        <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{children}</div>;
}

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-[11px] text-rose-500">{error}</p>}
    </div>
  );
}
