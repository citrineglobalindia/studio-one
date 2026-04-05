import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ClientEvent } from "@/data/clients-data";
import { toast } from "sonner";

interface AddEventSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (event: ClientEvent) => void;
}

const eventTypes = [
  { value: "mehendi", label: "Mehendi", emoji: "🌿" },
  { value: "haldi", label: "Haldi", emoji: "✨" },
  { value: "sangeet", label: "Sangeet", emoji: "🎶" },
  { value: "wedding", label: "Wedding", emoji: "💍" },
  { value: "reception", label: "Reception", emoji: "🎉" },
  { value: "engagement", label: "Engagement", emoji: "💑" },
  { value: "pre-wedding", label: "Pre-wedding Shoot", emoji: "📸" },
  { value: "other", label: "Other", emoji: "📅" },
] as const;

export function AddEventSheet({ open, onOpenChange, onAdd }: AddEventSheetProps) {
  const [name, setName] = useState("");
  const [date, setDate] = useState<Date>();
  const [venue, setVenue] = useState("");
  const [type, setType] = useState<ClientEvent["type"]>("wedding");
  const [status, setStatus] = useState<ClientEvent["status"]>("upcoming");
  const [notes, setNotes] = useState("");

  const reset = () => {
    setName("");
    setDate(undefined);
    setVenue("");
    setType("wedding");
    setStatus("upcoming");
    setNotes("");
  };

  const handleSubmit = () => {
    if (!name.trim() || !date || !venue.trim()) {
      toast.error("Please fill in event name, date and venue");
      return;
    }

    const event: ClientEvent = {
      id: `ev-${Date.now()}`,
      name: name.trim(),
      date: format(date, "yyyy-MM-dd"),
      venue: venue.trim(),
      type,
      status,
      notes: notes.trim() || undefined,
    };

    onAdd(event);
    toast.success("Event added successfully");
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-lg font-bold">Add Event</SheetTitle>
          <SheetDescription>Schedule a new event for this client</SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          {/* Event Type */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Type</Label>
            <div className="grid grid-cols-4 gap-2">
              {eventTypes.map((et) => (
                <button
                  key={et.value}
                  type="button"
                  onClick={() => {
                    setType(et.value);
                    if (!name.trim()) setName(et.label);
                  }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs transition-all",
                    type === et.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border bg-card text-muted-foreground hover:border-primary/30"
                  )}
                >
                  <span className="text-lg">{et.emoji}</span>
                  <span className="truncate w-full text-center">{et.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Event Name */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Event Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sangeet Night"
              className="rounded-xl"
            />
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal rounded-xl",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="h-4 w-4 mr-2" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Venue */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Venue</Label>
            <Input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. The Grand Hotel, Delhi"
              className="rounded-xl"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ClientEvent["status"])}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requirements..."
              className="rounded-xl resize-none"
              rows={2}
            />
          </div>

          {/* Submit */}
          <Button onClick={handleSubmit} className="w-full rounded-xl h-12 text-sm font-semibold gap-2">
            <CalendarDays className="h-4 w-4" /> Add Event
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
