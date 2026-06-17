import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  UserPlus, Heart, Phone, MapPinned, Sparkles, Building2,
  ChevronRight, ChevronLeft, Check, Loader2, SkipForward, ArrowLeft,
  CalendarDays, Clock, MapPin, Plus, Trash2, PartyPopper,
} from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useOrg } from "@/contexts/OrgContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SOURCES = ["Instagram", "Referral", "Website", "Google", "WhatsApp", "Facebook", "Other"];

const EVENT_TYPES = [
  "Wedding", "Pre-Wedding", "Engagement", "Reception",
  "Sangeet", "Haldi", "Mehendi", "Roka",
  "Birthday", "Anniversary", "Corporate", "Other",
];

const REQUIREMENT_OPTIONS = [
  { value: "traditional_photographer", label: "Trad Photographer" },
  { value: "traditional_videographer", label: "Trad Videographer" },
  { value: "candid_photographer",     label: "Candid Photographer" },
  { value: "candid_videographer",     label: "Candid Videographer" },
  { value: "drone_shoot",             label: "Drone Shoot" },
  { value: "led_wall",                label: "LED Wall" },
  { value: "live_streaming",          label: "Live Streaming" },
];

type Step1 = {
  name: string; partner_name: string;
  phone: string; email: string;
  partner_phone: string; partner_email: string;
  address: string; city: string;
  source: string;
  event_date: string; engagement_date: string;
  budget: string; notes: string;
};

type Step2 = {
  venue_name: string;
  venue_address: string;
  venue_city: string;
  venue_contact_person: string;
  venue_landmark: string;
  venue_map_url: string;
  venue_notes: string;
};

type EventRow = {
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string;
  venue: string;
  venue_map_url: string;
  requirements: string[];
  requirement_qty: Record<string, number>;
};

const BLANK1: Step1 = {
  name: "", partner_name: "",
  phone: "", email: "",
  partner_phone: "", partner_email: "",
  address: "", city: "",
  source: "",
  event_date: "", engagement_date: "",
  budget: "", notes: "",
};

const BLANK2: Step2 = {
  venue_name: "", venue_address: "", venue_city: "",
  venue_contact_person: "",
  venue_landmark: "", venue_map_url: "", venue_notes: "",
};

const blankEvent = (): EventRow => ({
  event_type: "Wedding",
  event_date: "",
  start_time: "",
  end_time: "",
  venue: "",
  venue_map_url: "",
  requirements: [],
  requirement_qty: {},
});

export default function AddClientPage() {
  const navigate = useNavigate();
  const { addClient, updateClient } = useClients();
  const { organization } = useOrg();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [s1, setS1] = useState<Step1>(BLANK1);
  const [s2, setS2] = useState<Step2>(BLANK2);
  const [events, setEvents] = useState<EventRow[]>([blankEvent()]);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);

  const u1 = <K extends keyof Step1>(k: K, v: Step1[K]) => setS1((p) => ({ ...p, [k]: v }));
  const u2 = <K extends keyof Step2>(k: K, v: Step2[K]) => setS2((p) => ({ ...p, [k]: v }));
  const uEvent = (i: number, patch: Partial<EventRow>) =>
    setEvents((p) => p.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  const addEventRow = () => setEvents((p) => [...p, blankEvent()]);
  const removeEventRow = (i: number) => setEvents((p) => (p.length === 1 ? p : p.filter((_, idx) => idx !== i)));
  const toggleReq = (i: number, val: string) =>
    setEvents((p) => p.map((e, idx) => idx === i ? {
      ...e,
      requirements: e.requirements.includes(val)
        ? e.requirements.filter((r) => r !== val)
        : [...e.requirements, val],
      requirement_qty: e.requirements.includes(val)
        ? e.requirement_qty
        : { ...e.requirement_qty, [val]: e.requirement_qty[val] ?? 1 },
    } : e));
  const setReqQty = (i: number, val: string, n: number) =>
    setEvents((p) => p.map((e, idx) => idx === i ? { ...e, requirement_qty: { ...e.requirement_qty, [val]: Math.max(1, n) } } : e));

  const saveStep1AndNext = async () => {
    setSaving(true);
    try {
      const created = await addClient.mutateAsync({
        name: s1.name.trim() || s1.phone.trim() || "Untitled client",
        partner_name: s1.partner_name.trim() || null,
        phone: s1.phone.trim() || null,
        email: s1.email.trim() || null,
        partner_phone: s1.partner_phone.trim() || null,
        partner_email: s1.partner_email.trim() || null,
        address: s1.address.trim() || null,
        city: s1.city.trim() || null,
        source: s1.source || null,
        engagement_date: s1.engagement_date || null,
        event_date: s1.event_date || null,
        budget: s1.budget ? Number(s1.budget) : null,
        notes: s1.notes.trim() || null,
        status: "active",
      });
      setCreatedId((created as any).id);
      setStep(2);
    } catch (e: any) {
      toast.error(e.message || "Could not save client");
    } finally {
      setSaving(false);
    }
  };

  const saveStep2AndNext = async () => {
    if (!createdId) { setStep(3); return; }
    setSaving(true);
    try {
      await updateClient.mutateAsync({
        id: createdId,
        venue_name: s2.venue_name.trim() || null,
        venue_address: s2.venue_address.trim() || null,
        venue_city: s2.venue_city.trim() || null,
        venue_contact_person: s2.venue_contact_person.trim() || null,
        venue_landmark: s2.venue_landmark.trim() || null,
        venue_map_url: s2.venue_map_url.trim() || null,
        venue_notes: s2.venue_notes.trim() || null,
      });
      setStep(3);
    } catch (e: any) {
      toast.error(e.message || "Could not save venue");
    } finally {
      setSaving(false);
    }
  };

  const finish = async () => {
    if (!createdId) { navigate("/clients"); return; }
    setSaving(true);
    try {
      // Insert any events that have at least a date — these flow straight to the Calendar.
      const rows = events
        .filter((e) => e.event_date)
        .map((e, idx) => ({
          organization_id: organization?.id ?? null,
          client_id: createdId,
          event_type: e.event_type,
          name: e.event_type,
          event_date: e.event_date,
          start_time: e.start_time || null,
          end_time: e.end_time || null,
          venue: (e.venue.trim() || s2.venue_name.trim()) || null,
          venue_map_url: (e.venue_map_url.trim() || s2.venue_map_url.trim()) || null,
          requirements: e.requirements,
          requirement_qty: e.requirement_qty,
          status: "upcoming",
          display_order: idx + 1,
        }));
      if (rows.length > 0) {
        const { error } = await supabase.from("events").insert(rows as any);
        if (error) throw error;
        toast.success(`${rows.length} event${rows.length > 1 ? "s" : ""} added to the calendar`);
      }
      navigate(`/clients/${createdId}`);
    } catch (e: any) {
      toast.error(e.message || "Could not save events");
    } finally {
      setSaving(false);
    }
  };

  const skipEvents = () => navigate(createdId ? `/clients/${createdId}` : "/clients");

  const stepLabel = step === 1 ? "Couple & contact" : step === 2 ? "Venue details" : "Events";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="w-full px-3 md:px-5 lg:px-6 py-3 md:py-4">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate("/clients")} aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-xl font-bold text-foreground truncate">Add Client</h1>
              <p className="text-xs text-muted-foreground">Step {step} of 3 — {stepLabel}</p>
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

      <main className="w-full px-3 md:px-5 lg:px-6 py-5 md:py-6 pb-32">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="s1" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }} className="space-y-6">
              <Section title="Couple" icon={<Heart className="h-4 w-4 text-rose-500" />}>
                <Row>
                  <Field label="Primary contact name"><Input value={s1.name} onChange={(e) => u1("name", e.target.value)} placeholder="Riya Sharma" /></Field>
                  <Field label="Partner name"><Input value={s1.partner_name} onChange={(e) => u1("partner_name", e.target.value)} placeholder="Arjun Mehta" /></Field>
                </Row>
                <Row>
                  <Field label="Event date"><Input type="date" value={s1.event_date} onChange={(e) => u1("event_date", e.target.value)} /></Field>
                  <Field label="Engagement date"><Input type="date" value={s1.engagement_date} onChange={(e) => u1("engagement_date", e.target.value)} /></Field>
                </Row>
              </Section>

              <Section title="Contact" icon={<Phone className="h-4 w-4 text-emerald-500" />}>
                <Row>
                  <Field label="Primary phone"><PhoneInput value={s1.phone} onChange={(v) => u1("phone", v)} /></Field>
                  <Field label="Primary email"><Input type="email" value={s1.email} onChange={(e) => u1("email", e.target.value)} placeholder="couple@email.com" /></Field>
                </Row>
                <Row>
                  <Field label="Partner phone"><PhoneInput value={s1.partner_phone} onChange={(v) => u1("partner_phone", v)} /></Field>
                  <Field label="Partner email"><Input type="email" value={s1.partner_email} onChange={(e) => u1("partner_email", e.target.value)} placeholder="partner@email.com" /></Field>
                </Row>
                <Row>
                  <Field label="Address"><Textarea rows={2} value={s1.address} onChange={(e) => u1("address", e.target.value)} placeholder="Street, area" /></Field>
                  <Field label="City"><Input value={s1.city} onChange={(e) => u1("city", e.target.value)} placeholder="Mumbai" /></Field>
                </Row>
              </Section>

              <Section title="Basic info" icon={<Sparkles className="h-4 w-4 text-amber-500" />}>
                <Field label="Source">
                  <Select value={s1.source} onValueChange={(v) => u1("source", v)}>
                    <SelectTrigger><SelectValue placeholder="Pick source (optional)" /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Notes"><Textarea rows={3} value={s1.notes} onChange={(e) => u1("notes", e.target.value)} placeholder="Special requests, references…" /></Field>
              </Section>
            </motion.div>
          ) : step === 2 ? (
            <motion.div key="s2" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }} className="space-y-6">
              <Section title="Venue" icon={<Building2 className="h-4 w-4 text-violet-500" />}>
                <Row>
                  <Field label="Venue name"><Input value={s2.venue_name} onChange={(e) => u2("venue_name", e.target.value)} placeholder="Taj Banquet Hall" /></Field>
                  <Field label="City"><Input value={s2.venue_city} onChange={(e) => u2("venue_city", e.target.value)} placeholder="Mumbai" /></Field>
                </Row>
                <Field label="Address"><Textarea rows={2} value={s2.venue_address} onChange={(e) => u2("venue_address", e.target.value)} placeholder="Full street address" /></Field>
                <Row>
                  <Field label="Landmark"><Input value={s2.venue_landmark} onChange={(e) => u2("venue_landmark", e.target.value)} placeholder="Near Gateway of India" /></Field>
                  <Field label="Google Maps URL"><Input value={s2.venue_map_url} onChange={(e) => u2("venue_map_url", e.target.value)} placeholder="https://maps.app.goo.gl/…" /></Field>
                </Row>
              </Section>

              <Section title="Venue contact" icon={<MapPinned className="h-4 w-4 text-emerald-500" />}>
                <Field label="Contact person"><Input value={s2.venue_contact_person} onChange={(e) => u2("venue_contact_person", e.target.value)} placeholder="Mr Sharma — Events Manager" /></Field>
                <Field label="Venue notes"><Textarea rows={3} value={s2.venue_notes} onChange={(e) => u2("venue_notes", e.target.value)} placeholder="Parking, power, restrictions, AV setup…" /></Field>
              </Section>
            </motion.div>
          ) : (
            <motion.div key="s3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.2 }} className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-muted/50 flex items-center justify-center"><PartyPopper className="h-4 w-4 text-pink-500" /></div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Events</h4>
                    <p className="text-[11px] text-muted-foreground">Add each function (Haldi, Wedding…) with its date & venue — these show up on the Calendar.</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={addEventRow} className="gap-1.5"><Plus className="h-4 w-4" /> Add event</Button>
              </div>

              {events.map((ev, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 space-y-4 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Event {i + 1}</span>
                    {events.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-rose-500" onClick={() => removeEventRow(i)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <Field label="Event type">
                    <div className="flex flex-wrap gap-1.5">
                      {EVENT_TYPES.map((t) => {
                        const active = ev.event_type === t;
                        return (
                          <button key={t} type="button" onClick={() => uEvent(i, { event_type: t })}
                            className={"px-3 py-1.5 rounded-full text-xs font-medium border transition " + (active ? "bg-primary text-primary-foreground border-primary" : "bg-muted/40 text-foreground border-border hover:bg-muted")}>
                            {active && <Check className="h-3 w-3 inline -mt-0.5 mr-1" />}{t}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <Row>
                    <Field label="Date"><div className="relative"><CalendarDays className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" /><Input type="date" className="pl-9" value={ev.event_date} onChange={(e) => uEvent(i, { event_date: e.target.value })} /></div></Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Start time"><Input type="time" value={ev.start_time} onChange={(e) => uEvent(i, { start_time: e.target.value })} /></Field>
                      <Field label="End time"><Input type="time" value={ev.end_time} onChange={(e) => uEvent(i, { end_time: e.target.value })} /></Field>
                    </div>
                  </Row>

                  <Row>
                    <Field label="Venue"><Input value={ev.venue} onChange={(e) => uEvent(i, { venue: e.target.value })} placeholder={s2.venue_name || "Venue name"} /></Field>
                    <Field label="Location link (Google Maps)"><div className="relative"><MapPin className="h-3.5 w-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" /><Input className="pl-9" value={ev.venue_map_url} onChange={(e) => uEvent(i, { venue_map_url: e.target.value })} placeholder={s2.venue_map_url || "https://maps.app.goo.gl/…"} /></div></Field>
                  </Row>

                  <Field label="Requirements">
                    <div className="flex flex-wrap gap-1.5">
                      {REQUIREMENT_OPTIONS.map((opt) => {
                        const active = ev.requirements.includes(opt.value);
                        return (
                          <button key={opt.value} type="button" onClick={() => toggleReq(i, opt.value)}
                            className={"px-3 py-1.5 rounded-full text-xs font-medium border transition " + (active ? "bg-primary/10 text-primary border-primary/40 ring-1 ring-primary/20" : "bg-muted/40 text-foreground border-border hover:bg-muted")}>
                            {active && <Check className="h-3 w-3 inline -mt-0.5 mr-1" />}{opt.label}
                          </button>
                        );
                      })}
                    </div>
                    {ev.requirements.length > 0 && (
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ev.requirements.map((rv) => {
                          const opt = REQUIREMENT_OPTIONS.find((o) => o.value === rv);
                          const qty = ev.requirement_qty[rv] ?? 1;
                          return (
                            <div key={rv} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-1.5">
                              <span className="text-xs font-medium text-foreground truncate">{opt?.label || rv}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button type="button" onClick={() => setReqQty(i, rv, qty - 1)} className="h-6 w-6 rounded-md border border-border bg-background text-sm font-bold leading-none hover:bg-muted">-</button>
                                <span className="w-6 text-center text-sm font-semibold tabular-nums">{qty}</span>
                                <button type="button" onClick={() => setReqQty(i, rv, qty + 1)} className="h-6 w-6 rounded-md border border-border bg-background text-sm font-bold leading-none hover:bg-muted">+</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </Field>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-background/95 backdrop-blur">
        <div className="w-full px-3 md:px-5 lg:px-6 py-3 flex items-center justify-between gap-2">
          {step === 1 ? (
            <>
              <Button variant="ghost" onClick={() => navigate("/clients")} disabled={saving}>Cancel</Button>
              <Button onClick={saveStep1AndNext} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Save &amp; add venue
              </Button>
            </>
          ) : step === 2 ? (
            <>
              <Button variant="ghost" onClick={() => setStep(1)} disabled={saving} className="gap-2"><ChevronLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={saveStep2AndNext} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                Save &amp; add events
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setStep(2)} disabled={saving} className="gap-2"><ChevronLeft className="h-4 w-4" /> Back</Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={skipEvents} disabled={saving} className="gap-2"><SkipForward className="h-4 w-4" /> Skip</Button>
                <Button onClick={finish} disabled={saving} className="gap-2">
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
      <div className={"h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors " + (done ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
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
