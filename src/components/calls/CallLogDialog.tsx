import { useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCallLogs, CallDirection, CallOutcome } from "@/hooks/useCallLogs";
import { Loader2, Phone } from "lucide-react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId?: string;
  clientId?: string;
  contactName?: string;
  contactPhone?: string;
  onLogged?: () => void;
};

const OUTCOME_OPTIONS: { value: CallOutcome; label: string }[] = [
  { value: "connected", label: "Connected" },
  { value: "no_answer", label: "No answer" },
  { value: "busy", label: "Busy" },
  { value: "voicemail", label: "Voicemail left" },
  { value: "wrong_number", label: "Wrong number" },
  { value: "interested", label: "Interested" },
  { value: "not_interested", label: "Not interested" },
  { value: "callback_requested", label: "Callback requested" },
  { value: "converted", label: "Converted to client" },
];

export function CallLogDialog({
  open, onOpenChange, leadId, clientId, contactName, contactPhone, onLogged,
}: Props) {
  const { addCallLog } = useCallLogs();
  const [direction, setDirection] = useState<CallDirection>("outbound");
  const [outcome, setOutcome] = useState<CallOutcome>("connected");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");

  const reset = () => {
    setDirection("outbound");
    setOutcome("connected");
    setDurationMinutes("");
    setNotes("");
    setNextAction("");
    setNextActionDate("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const durationSeconds = durationMinutes ? Math.round(Number(durationMinutes) * 60) : 0;
    await addCallLog.mutateAsync({
      lead_id: leadId ?? null,
      client_id: clientId ?? null,
      contact_name: contactName ?? null,
      contact_phone: contactPhone ?? null,
      direction,
      outcome,
      duration_seconds: durationSeconds,
      notes: notes || null,
      next_action: nextAction || null,
      next_action_date: nextActionDate || null,
    });
    reset();
    onOpenChange(false);
    onLogged?.();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-4 w-4" /> Log a call
          </DialogTitle>
          <DialogDescription>
            {contactName ? `Calling ${contactName}` : "Record a call with a lead or client"}
            {contactPhone && ` · ${contactPhone}`}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Direction</Label>
              <Select value={direction} onValueChange={(v) => setDirection(v as CallDirection)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Duration (minutes)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">Outcome</Label>
            <Select value={outcome} onValueChange={(v) => setOutcome(v as CallOutcome)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OUTCOME_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs">Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you discuss?"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Next action</Label>
              <Input
                value={nextAction}
                onChange={(e) => setNextAction(e.target.value)}
                placeholder="Send quote, follow up…"
              />
            </div>
            <div>
              <Label className="text-xs">Next action date</Label>
              <Input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={addCallLog.isPending}>
              {addCallLog.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log call"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
