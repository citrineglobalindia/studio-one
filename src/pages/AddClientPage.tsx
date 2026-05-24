import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  UserPlus, Heart, Phone, MapPinned, CalendarDays,
  Sparkles, Building2, ChevronRight, ChevronLeft, Check,
  Loader2, SkipForward, ArrowLeft, Plus, Trash2, Calendar,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useEvents } from "@/hooks/useEvents";
import { toast } from "sonner";

const SOURCES = ["Instagram", "Referral", "Website", "Google", "WhatsApp", "Facebook", "Other"];
const EVENT_TYPES = ["Wedding", "Pre-Wedding", "Engagement", "Reception", "Sangeet", "Haldi", "Birthday", "Corporate", "Other"];

type Step1 = {
  name: string; partner_name: string;
  email: string; phone: string;
  partner_email: string; partner_phone: string;
  address: string; city: string;
  source: string;
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

type EventRow = {
  uid: string;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  notes: string;
};

const BLANK_S1: Step1 = {
  name: "", partner_name: "",
  email: "", phone: "",
  partner_email: "", partner_phone: "",
  address: "", city: "",
  source: "",
  marriage_date: "", engagement_date: "",
  date_of_birth: "", partner_date_of_birth: "",
  budget: "", notes: "",
};

const BLANK_S2: Step2 = {
  venue_name: "", venue_address: "", venue_city: "", venue_pincode: "",
  venue_contact_person: "", venue_contact_phone: "",
  venue_landmark: "", venue_map_url: "", venue_notes: "",
};

const blankEvent = (): EventRow => ({
  uid: Math.random().toString(36).slice(2, 9),
  event_type: "Wedding",
  event_date: "",
  start_time: "",
  end_time: "",
  venue: "",
  notes: "",
});

type StepN = 1 | 2 | 3;

export default function AddClientPage() {
  const navigate = useNavigate();
  const { addClient, updateClient } = useClients();
  const { addEvent } = useEvents();

  const [step, setStep] = useState<StepN>(1);
  const [s1, setS1] = useState<Step1>(BLANK_S1);
  const [s2, setS2] = useState<Step2>(BLANK_S2);
  const [events, setEvents] = useState<EventRow[]>([blankEvent()]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const u1 = <K extends keyof Step1>(k: K, v: Step1[K]) => setS1((p) => ({ ...p, [k]: v }));
  const u2 = <K extends keyof Step2>(k: K, v: Step2[K]) => setS2((p) => ({ ...p, [k]: v }));
  const updateEventRow = (uid: string, patch: Partial<EventRow>) =>
    setEvents((prev) => prev.map((r) => (r.uid === uid ? { ...r, ...patch } : r)));
  const removeEventRow = (uid: string) =>
    setEvents((prev) => prev.length <= 1 ? [blankEvent()] : prev.filter((r) => r.uid !== uid));
  const addEventRow = () => setEvents((prev) => [...prev, blankEvent()]);

  // ───── ACTIONS ─────
  const saveStep1AndNext = async () => {
    setSaving(true);
    try {
      const trimmedName = s1.name.trim();
      const payload: any = {
        name: trimmedName || s1.phone.trim() || "Untitled client",
        partner_name: s1.partner_name.trim() || null,
        email: s1.email.trim() || null,
        phone: s1.phone.trim() || null,
        partner_email: s1.partner_email.trim() || null,
        partner_phone: s1.partner_phone.trim() || null,
        address: s1.address.trim() || null,
        city: s1.city.trim() || null,
        source: s1.source || null,
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
      toast.success("Client saved");
      setStep(2);
    } catch (e: any) {
      toast.error(e.message || "Could not save client");
    } finally {
      setSaving(false);
    }
  };

  const saveStep2AndNext = async () => {
    if (!createdId) { setStep(3); return; }
    // Only call update if anything in step 2 has a value
    const hasAny = Object.values(s2).some((v) => v && v.trim());
    if (!hasAny) { setStep(3); return; }
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
      setStep(3);
    } catch (e: any) {
      toast.error(e.message || "Could not save venue");
    } finally {
      setSaving(false);
    }
  };

  const finishAndExit = () => {
    navigate(createdId ? `/clients/${createdId}` : "/clients");
  };

  const saveStep3AndFinish = async () => {
    if (!createdId) { finishAndExit(); return; }
    setSaving(true);
    try {
      // Insert only events that have at least a date OR a type
      const toCreate = events.filter((e) => e.event_date || e.event_type);
      for (const e of toCreate) {
        await addEvent.mutateAsync({
          client_id: createdId,
          project_id: null,
          name: `${e.event_type || "Event"} — ${s1.name.trim() || "Client"}`,
          event_type: e.event_type || null,
          event_date: e.event_date || new Date().toISOString().slice(0, 10),
          start_time: e.start_time || null,
          end_time: e.end_time || null,
          venue: e.venue.trim() || s2.venue_name.trim() || null,
          notes: e.notes.trim() || null,
          status: "upcoming",
        } as any);
      }
      if (toCreate.length) toast.success(`Saved ${toCreate.length} event${toCreate.length > 1 ? "s" : ""}`);
      navigate(`/clients/${createdId}`);
    } catch (e: any) {
      toast.error(e.message || "Could not save events");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ── STICKY HEADER ── */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/clients")} aria-label="Back to clients">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">Add Client</h1>
              <p className="text-xs text-muted-foreground">
                Step {step} of 3 — {step === 1 ? "Couple & contact" : step === 2 ? "Venue details" : "Events"}
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 max-w-2xl">
            <StepDot active={step === 1} done={step > 1} number={1} label="Couple" />
            <div className="h-px flex-1 bg-border" />
            <StepDot active={step === 2} done={step > 2} number={2} label="Venue" />
            <div className="h-px flex-1 bg-border" />
            <StepDot active={step === 3} done={false} number={3} label="Events" />
          </div>
        </div>
      </header>

      {/* ── BODY ── */}
      <main className="max-w-5xl mx-auto px-4 md:px-8 py-6 pb-32">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }} className="space-y-6">
              <Section title="Couple" icon={<Heart className="h-4 w-4 text-rose-500" />}>
                <Row>
                  <Field label="Primary contact name"><Input value={s1.name} onChange={(e) => u1("name", e.target.value)} placeholder="Riya Sharma" /></Field>
                  <Field label="Partner name"><Input value={s1.partner_name} onChange={(e) => u1("partner_name", e.target.value)} placeholder="Arjun Mehta" /></Field>
                </Row>
                <Row>
                  <Field label="Marriage / event date"><Input type="date" value={s1.marriage_date} onChange={(e) => u1("marriage_date", e.target.value)} /></Field>
                  <Field label="Engagement date"><Input type="date" value={s1.engagement_date} onChange={(e) => u1("engagement_date", e.target.value)} /></Field>
                </Row>
                <Row>
                  <Field label="Primary DOB"><Input type="date" value={s1.date_of_birth} onChange={(e) => u1("date_of_birth", e.target.value)} /></Field>
                  <Field label="Partner DOB"><Input type="date" value={s1.partner_date_of_birth} onChange={(e) => u1("partner_date_of_birth", e.target.value)} /></Field>
                </Row>
              </Section>

              <Section title="Contact" icon={<Phone className="h-4 w-4 text-emerald-500" />}>
                <Row>
                  <Field label="Primary phone"><Input value={s1.phone} onChange={(e) => u1("phone", e.target.value)} placeholder="+91 98765 43210" /></Field>
                  <Field label="Primary email"><Input type="email" value={s1.email} onChange={(e) => u1("email", e.target.value)} placeholder="couple@email.com" /></Field>
                </Row>
                <Row>
                  <Field label="Partner phone"><Input value={s1.partner_phone} onChange={(e) => u1("partner_phone", e.target.value)} placeholder="+91 98765 00000" /></Field>
                  <Field label="Partner email"><Input type="email" value={s1.partner_email} onChange={(e) => u1("partner_email", e.target.value)} placeholder="partner@email.com" /></Field>
                </Row>
                <Row>
                  <Field label="Address"><Textarea rows={2} value={s1.address} onChange={(e) => u1("address", e.target.value)} placeholder="Street, area" /></Field>
                  <Field label="City"><Input value={s1.city} onChange={(e) => u1("city", e.target.value)} placeholder="Mumbai" /></Field>
                </Row>
              </Section>

              <Section title="Basic info" icon={<Sparkles className="h-4 w-4 text-amber-500" />}>
                <Row>
                  <Field label="Source">
                    <Select value={s1.source} onValueChange={(v) => u1("source", v)}>
                      <SelectTrigger><SelectValue placeholder="Pick source (optional)" /></SelectTrigger>
                      <SelectContent>
                        {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Approx budget (₹)"><Input type="number" value={s1.budget} onChange={(e) => u1("budget", e.target.value)} placeholder="150000" /></Field>
                </Row>
                <Field label="Notes"><Textarea rows={3} value={s1.notes} onChange={(e) => u1("notes", e.target.value)} placeholder="Special requests, references, anything to remember…" /></Field>
              </Section>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }} className="space-y-6">
              <Section title="Venue" icon={<Building2 className="h-4 w-4 text-violet-500" />}>
                <Row>
                  <Field label="Venue name"><Input value={s2.venue_name} onChange={(e) => u2("venue_name", e.target.value)} placeholder="Taj Banquet Hall" /></Field>
                  <Field label="City"><Input value={s2.venue_city} onChange={(e) => u2("venue_city", e.target.value)} placeholder="Mumbai" /></Field>
                </Row>
                <Row>
                  <Field label="Address"><Textarea rows={2} value={s2.venue_address} onChange={(e) => u2("venue_address", e.target.value)} placeholder="Full street address" /></Field>
                  <Field label="Pincode"><Input value={s2.venue_pincode} onChange={(e) => u2("venue_pincode", e.target.value)} placeholder="400001" /></Field>
                </Row>
                <Row>
                  <Field label="Landmark"><Input value={s2.venue_landmark} onChange={(e) => u2("venue_landmark", e.target.value)} placeholder="Near Gateway of India" /></Field>
                  <Field label="Google Maps URL"><Input value={s2.venue_map_url} onChange={(e) => u2("venue_map_url", e.target.value)} placeholder="https://maps.app.goo.gl/…" /></Field>
                </Row>
              </Section>
              <Section title="Venue contact" icon={<MapPinned className="h-4 w-4 text-emerald-500" />}>
                <Row>
                  <Field label="Contact person"><Input value={s2.venue_contact_person} onChange={(e) => u2("venue_contact_person", e.target.value)} placeholder="Mr Sharma — Events Manager" /></Field>
                  <Field label="Contact phone"><Input value={s2.venue_contact_phone} onChange={(e) => u2("venue_contact_phone", e.target.value)} placeholder="+91 98765 43210" /></Field>
                </Row>
                <Field label="Venue notes"><Textarea rows={3} value={s2.venue_notes} onChange={(e) => u2("venue_notes", e.target.value)} placeholder="Parking, power, restrictions, AV setup…" /></Field>
              </Section>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" /> Events ({events.filter(e => e.event_date || e.event_type).length})
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">Add one or more events for this client. All fields are optional.</p>
                </div>
                <Button onClick={addEventRow} variant="outline" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" /> Add event
                </Button>
              </div>

              <div className="space-y-3">
                {events.map((row, idx) => (
                  <div key={row.uid} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <span className="text-sm font-medium text-foreground">Event #{idx + 1}</span>
                      </div>
                      {events.length > 1 && (
                        <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => removeEventRow(row.uid)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Row>
                      <Field label="Event type">
                        <Select value={row.event_type} onValueChange={(v) => updateEventRow(row.uid, { event_type: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {EVENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Event date">
                        <Input type="date" value={row.event_date} onChange={(e) => updateEventRow(row.uid, { event_date: e.target.value })} />
                      </Field>
                    </Row>
                    <Row>
                      <Field label="Start time">
                        <Input type="time" value={row.start_time} onChange={(e) => updateEventRow(row.uid, { start_time: e.target.value })} />
                      </Field>
                      <Field label="End time">
                        <Input type="time" value={row.end_time} onChange={(e) => updateEventRow(row.uid, { end_time: e.target.value })} />
                      </Field>
                    </Row>
                    <Field label="Venue (leave blank to use primary venue from Step 2)">
                      <Input value={row.venue} onChange={(e) => updateEventRow(row.uid, { venue: e.target.value })} placeholder={s2.venue_name || "Same as primary venue"} />
                    </Field>
                    <Field label="Notes">
                      <Textarea rows={2} value={row.notes} onChange={(e) => updateEventRow(row.uid, { notes: e.target.value })} placeholder="Anything specific to this event…" />
                    </Field>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── FOOTER ── */}
      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-2">
          {step === 1 && (
            <>
              <Button variant="ghost" onClick={() => navigate("/clients")} disabled={saving}>Cancel</Button>
              <Button onClick={saveStep1AndNext} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Save &amp; continue
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} disabled={saving} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(3)} disabled={saving} className="gap-2">
                  <SkipForward className="h-4 w-4" /> Skip venue
                </Button>
                <Button onClick={saveStep2AndNext} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  Save &amp; continue
                </Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <Button variant="ghost" onClick={() => setStep(2)} disabled={saving} className="gap-2">
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={finishAndExit} disabled={saving} className="gap-2">
                  <SkipForward className="h-4 w-4" /> Skip events
                </Button>
                <Button onClick={saveStep3AndFinish} disabled={saving} className="gap-2">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Save &amp; finish
                </Button>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function StepDot({ active, done, number, label }: { active: boolean; done: boolean; number: number; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={
        "h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors " +
        (done ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
      }>
        {done ? <Check className="h-3.5 w-3.5" /> : number}
      </div>
      <span className={"text-xs font-medium " + (active || done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
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
