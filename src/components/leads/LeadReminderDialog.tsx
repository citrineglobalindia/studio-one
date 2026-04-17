import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useLeadReminders, type ReminderType, type DbLeadReminder } from "@/hooks/useLeadReminders";
import {
  Bell, Video, MapPin, Phone, MessageCircle, CheckCircle2, Trash2, Clock, Plus, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  leadId: string;
  leadName: string;
}

const REMINDER_TYPES: { value: ReminderType; label: string; icon: typeof Video; color: string }[] = [
  { value: "google-meet", label: "Google Meet", icon: Video, color: "text-blue-500" },
  { value: "in-person", label: "In-Person", icon: MapPin, color: "text-emerald-500" },
  { value: "phone-call", label: "Phone Call", icon: Phone, color: "text-amber-500" },
  { value: "follow-up", label: "Follow-up", icon: MessageCircle, color: "text-purple-500" },
];

function getTypeMeta(t: string) {
  return REMINDER_TYPES.find((r) => r.value === t) ?? REMINDER_TYPES[3];
}

export default function LeadReminderDialog({ open, onOpenChange, leadId, leadName }: Props) {
  const { reminders, isLoading, addReminder, deleteReminder, markComplete } = useLeadReminders(leadId);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReminderType>("follow-up");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setShowForm(false);
      setTitle(""); setType("follow-up"); setDate(""); setTime("10:00");
      setMeetingLink(""); setLocation(""); setNotes("");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    if (!date) return;
    setSubmitting(true);
    try {
      await addReminder({
        lead_id: leadId,
        title: title.trim(),
        notes: notes.trim() || null,
        reminder_type: type,
        scheduled_at: new Date(`${date}T${time}:00`).toISOString(),
        meeting_link: type === "google-meet" ? (meetingLink.trim() || null) : null,
        location: type === "in-person" ? (location.trim() || null) : null,
        status: "pending",
      });
      setShowForm(false);
      setTitle(""); setNotes(""); setMeetingLink(""); setLocation("");
    } finally {
      setSubmitting(false);
    }
  };

  const sorted = [...reminders].sort((a, b) =>
    a.status === b.status ? a.scheduled_at.localeCompare(b.scheduled_at) : a.status === "pending" ? -1 : 1
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            Reminders for {leadName}
          </DialogTitle>
          <DialogDescription>
            Schedule follow-up calls, meetings or notes to stay on top of this lead.
          </DialogDescription>
        </DialogHeader>

        {/* List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : sorted.length === 0 && !showForm ? (
            <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border rounded-lg">
              <Clock className="h-8 w-8 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No reminders yet</p>
            </div>
          ) : (
            sorted.map((r: DbLeadReminder) => {
              const meta = getTypeMeta(r.reminder_type);
              const Icon = meta.icon;
              const dt = new Date(r.scheduled_at);
              const isPast = dt.getTime() < Date.now() && r.status === "pending";
              return (
                <div
                  key={r.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    r.status === "completed"
                      ? "bg-muted/30 border-border opacity-60"
                      : isPast
                      ? "bg-destructive/5 border-destructive/30"
                      : "bg-card border-border"
                  )}
                >
                  <div className={cn("p-2 rounded-md bg-muted", meta.color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("text-sm font-medium", r.status === "completed" && "line-through")}>
                        {r.title}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {meta.label}
                      </Badge>
                      {r.status === "completed" && (
                        <Badge variant="outline" className="text-[10px] h-5 text-emerald-600 border-emerald-200">
                          Done
                        </Badge>
                      )}
                      {isPast && (
                        <Badge variant="outline" className="text-[10px] h-5 text-destructive border-destructive/30">
                          Overdue
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(dt, "PPP 'at' p")}
                    </p>
                    {r.meeting_link && (
                      <a
                        href={r.meeting_link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-primary hover:underline truncate block mt-1"
                      >
                        {r.meeting_link}
                      </a>
                    )}
                    {r.location && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {r.location}
                      </p>
                    )}
                    {r.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {r.status === "pending" && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                        onClick={() => markComplete(r.id)}
                        title="Mark complete"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => deleteReminder(r.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Add form */}
        {showForm ? (
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              {REMINDER_TYPES.map((rt) => {
                const Icon = rt.icon;
                const active = type === rt.value;
                return (
                  <button
                    key={rt.value}
                    type="button"
                    onClick={() => setType(rt.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md border text-sm transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:bg-muted/50"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", active ? "" : rt.color)} />
                    {rt.label}
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input
                placeholder="e.g. Discuss wedding package"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Time</Label>
                <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
            </div>

            {type === "google-meet" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Meeting Link</Label>
                <Input
                  placeholder="https://meet.google.com/..."
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                />
              </div>
            )}

            {type === "in-person" && (
              <div className="space-y-1.5">
                <Label className="text-xs">Location</Label>
                <Input
                  placeholder="Studio, café, client home..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                rows={2}
                placeholder="Anything to remember..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowForm(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={submitting || !title.trim() || !date}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Reminder"}
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter>
            <Button onClick={() => setShowForm(true)} className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" /> Add Reminder
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
