import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CalendarDays, Clock, Building2, FileText, Loader2, Tag, Check, Camera, Video, Plane, Sparkles, Monitor, Radio, MapPin } from "lucide-react";
import type { DbEvent, EventStatus } from "@/hooks/useEvents";

const EVENT_TYPES = [
  "Wedding", "Pre-Wedding", "Engagement", "Reception",
  "Sangeet", "Haldi", "Mehendi", "Roka",
  "Birthday", "Anniversary", "Corporate",
  "360° Camera", "Semi-Candid Photography", "Baby Shower Photography",
  "Maternity Shoot", "Couple Shoot", "Album", "Other",
];

const STATUSES: EventStatus[] = ["upcoming", "in-progress", "completed", "cancelled"];

const REQUIREMENT_OPTIONS: { value: string; label: string; icon: typeof Camera; color: string }[] = [
  { value: "traditional_photographer", label: "Traditional Photographer", icon: Camera, color: "from-blue-500 to-cyan-500" },
  { value: "traditional_videographer", label: "Traditional Videographer", icon: Video, color: "from-purple-500 to-fuchsia-500" },
  { value: "candid_photographer",     label: "Candid Photographer",     icon: Camera, color: "from-rose-500 to-pink-500" },
  { value: "candid_videographer",     label: "Candid Videographer",     icon: Video,  color: "from-amber-500 to-orange-500" },
  { value: "semi_candid_photographer", label: "Semi-Candid Photographer", icon: Camera, color: "from-teal-500 to-emerald-500" },
  { value: "semi_candid_videographer", label: "Semi-Candid Videographer", icon: Video,  color: "from-sky-500 to-blue-500" },
  { value: "drone_shoot",             label: "Drone Shoot",             icon: Plane,  color: "from-emerald-500 to-teal-500" },
  { value: "led_wall",                label: "LED Wall",                icon: Monitor, color: "from-indigo-500 to-violet-500" },
  { value: "live_streaming",          label: "Live Streaming",          icon: Radio,  color: "from-red-500 to-rose-500" },
];

export function EventDialog({
  open, onOpenChange, editing, defaultVenue, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: DbEvent | null;
  defaultVenue?: string | null;
  onSubmit: (payload: Partial<DbEvent>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    event_type: "Wedding",
    event_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    venue_map_url: "",
    status: "upcoming" as EventStatus,
    notes: "",
    requirements: [] as string[],
    requirement_qty: {} as Record<string, number>,
    album_pages: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        event_type: editing.event_type || "Wedding",
        event_date: editing.event_date || "",
        start_time: editing.start_time ? String(editing.start_time).slice(0, 5) : "",
        end_time: editing.end_time ? String(editing.end_time).slice(0, 5) : "",
        venue: editing.venue || "",
        venue_map_url: (editing as any).venue_map_url || "",
        status: (editing.status as EventStatus) || "upcoming",
        notes: editing.notes || "",
        requirements: Array.isArray(editing.requirements) ? editing.requirements : [],
        requirement_qty: (editing as any).requirement_qty || {},
        album_pages: String((editing as any).requirement_qty?.album_pages ?? ""),
      });
    } else {
      setForm({
        event_type: "Wedding",
        event_date: "",
        start_time: "",
        end_time: "",
        venue: "",
        venue_map_url: "",
        status: "upcoming",
        notes: "",
        requirements: [],
        requirement_qty: {},
        album_pages: "",
      });
    }
  }, [open, editing]);

  const submit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        event_type: form.event_type,
        event_date: form.event_date || null,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue.trim() || defaultVenue || null,
        venue_map_url: form.venue_map_url.trim() || null,
        status: form.status,
        notes: form.notes.trim() || null,
        name: form.event_type, // mirror type into name for display
        requirements: form.requirements,
        requirement_qty: {
          ...form.requirement_qty,
          ...(form.event_type === "Album" && form.album_pages
            ? { album_pages: Number(form.album_pages) }
            : {}),
        },
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-3 shrink-0 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {editing ? "Edit event" : "Add event"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 overflow-y-auto px-6 py-4 flex-1 min-h-0">
          {/* Event type chips */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">Event type</Label>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((t) => {
                const active = form.event_type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, event_type: t }))}
                    className={
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition " +
                      (active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/40 text-foreground border-border hover:bg-muted")
                    }
                  >
                    {active && <Check className="h-3 w-3 inline -mt-0.5 mr-1" />}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Album page count */}
          {form.event_type === "Album" && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Number of album pages</Label>
              </div>
              <Input
                type="number"
                min={1}
                value={form.album_pages}
                onChange={(e) => setForm((p) => ({ ...p, album_pages: e.target.value }))}
                placeholder="e.g. 40"
              />
            </div>
          )}

          {/* Date + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Event date</Label>
              </div>
              <Input type="date" value={form.event_date} onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v as EventStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <Label className="text-xs text-muted-foreground">Start time</Label>
              </div>
              <Input type="time" value={form.start_time} onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">End time</Label>
              <Input type="time" value={form.end_time} onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))} />
            </div>
          </div>

          {/* Venue */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">Venue</Label>
            </div>
            <Input
              value={form.venue}
              onChange={(e) => setForm((p) => ({ ...p, venue: e.target.value }))}
              placeholder={defaultVenue || "Leave blank to use primary venue"}
            />
            {defaultVenue && !form.venue && (
              <p className="text-[11px] text-muted-foreground">
                Will save as: <span className="text-foreground">{defaultVenue}</span>
              </p>
            )}
          </div>

          {/* Location link */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">Location link (Google Maps)</Label>
            </div>
            <Input
              value={form.venue_map_url}
              onChange={(e) => setForm((p) => ({ ...p, venue_map_url: e.target.value }))}
              placeholder="https://maps.app.goo.gl/…"
            />
          </div>

          {/* Requirements (multi-select) */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">Requirements</Label>
              {form.requirements.length > 0 && (
                <span className="text-[10px] text-muted-foreground">({form.requirements.length} selected)</span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REQUIREMENT_OPTIONS.map((opt) => {
                const active = form.requirements.includes(opt.value);
                const Icon = opt.icon;
                const qty = form.requirement_qty[opt.value] ?? 1;
                const setQty = (n: number) => setForm((p) => ({ ...p, requirement_qty: { ...p.requirement_qty, [opt.value]: Math.max(1, n) } }));
                return (
                  <div
                    key={opt.value}
                    className={
                      "group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition " +
                      (active
                        ? "border-primary bg-primary/[0.08] ring-1 ring-primary/30"
                        : "border-border bg-muted/20 hover:border-border/80 hover:bg-muted/40")
                    }
                  >
                    <button type="button" className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                      onClick={() => setForm((p) => ({
                        ...p,
                        requirements: active ? p.requirements.filter((r) => r !== opt.value) : [...p.requirements, opt.value],
                        requirement_qty: active ? p.requirement_qty : { ...p.requirement_qty, [opt.value]: p.requirement_qty[opt.value] ?? 1 },
                      }))}
                    >
                      <div className={"h-8 w-8 rounded-lg bg-gradient-to-br text-white flex items-center justify-center shrink-0 " + opt.color}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={"text-sm font-medium truncate " + (active ? "text-foreground" : "text-foreground/90")}>{opt.label}</span>
                    </button>
                    {active ? (
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button type="button" onClick={() => setQty(qty - 1)} className="h-6 w-6 rounded-md border border-border bg-background text-sm font-bold leading-none hover:bg-muted">-</button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{qty}</span>
                        <button type="button" onClick={() => setQty(qty + 1)} className="h-6 w-6 rounded-md border border-border bg-background text-sm font-bold leading-none hover:bg-muted">+</button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <Label className="text-xs text-muted-foreground">Notes</Label>
            </div>
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Anything specific to this event…" />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 shrink-0 border-t border-border/60 bg-background">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={submit} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {editing ? "Save changes" : "Add event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
