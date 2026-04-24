import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Loader2, Save, CalendarDays, User, FolderKanban, Image as ImageIcon, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import {
  useDeliverables,
  type DeliverableDB,
  type DeliverableStatus,
  type DeliverablePriority,
} from "@/hooks/useDeliverables";
import { useProjects } from "@/hooks/useProjects";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  deliverable: DeliverableDB | null;
};

const STATUS_OPTIONS: { value: DeliverableStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pending", color: "bg-muted text-muted-foreground" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" },
  { value: "review", label: "Ready for Review", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "approved", label: "Approved", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
  { value: "delivered", label: "Delivered", color: "bg-primary/15 text-primary border-primary/30" },
];

const PRIORITY_OPTIONS: { value: DeliverablePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export function DeliverableDetailModal({ open, onOpenChange, deliverable }: Props) {
  const { updateDeliverable } = useDeliverables();
  const { projects = [] } = useProjects();
  const { events: dbEvents } = useEvents();
  const { clients = [] } = useClients();

  const [status, setStatus] = useState<DeliverableStatus>("pending");
  const [progress, setProgress] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [deliveredDate, setDeliveredDate] = useState<string>("");
  const [priority, setPriority] = useState<DeliverablePriority>("medium");
  const [saving, setSaving] = useState(false);

  // Reset form when a different deliverable is opened
  useEffect(() => {
    if (deliverable) {
      setStatus((deliverable.status as DeliverableStatus) || "pending");
      setProgress(deliverable.progress || 0);
      setNotes(deliverable.notes || "");
      setDeliveredDate(deliverable.delivered_date || "");
      setPriority((deliverable.priority as DeliverablePriority) || "medium");
    }
  }, [deliverable]);

  const project = useMemo(
    () => (deliverable?.project_id ? (projects as any[]).find(p => p.id === deliverable.project_id) : null),
    [deliverable?.project_id, projects]
  );
  const event = useMemo(
    () => (deliverable?.event_id ? dbEvents.find(e => e.id === deliverable.event_id) : null),
    [deliverable?.event_id, dbEvents]
  );
  const client = useMemo(
    () => (deliverable?.client_id ? (clients as any[]).find(c => c.id === deliverable.client_id) : null),
    [deliverable?.client_id, clients]
  );

  const dueDate = deliverable?.due_date ? new Date(deliverable.due_date) : null;
  const isOverdue = dueDate && isPast(dueDate) && !isToday(dueDate) && status !== "delivered" && status !== "approved";
  const isDueToday = dueDate && isToday(dueDate);

  if (!deliverable) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDeliverable.mutateAsync({
        id: deliverable.id,
        status,
        progress,
        notes: notes || null,
        delivered_date: deliveredDate || null,
        priority,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const quickAdvance = async () => {
    // One-tap "next stage" button
    const flow: DeliverableStatus[] = ["pending", "in_progress", "review", "approved", "delivered"];
    const idx = flow.indexOf(status);
    const next = flow[Math.min(idx + 1, flow.length - 1)];
    setStatus(next);
    setProgress(next === "delivered" || next === "approved" ? 100 : Math.max(progress, 25 * (idx + 1)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start gap-2 pr-6">
            <span className="flex-1">{deliverable.title || deliverable.deliverable_type}</span>
          </DialogTitle>
          <DialogDescription className="flex flex-wrap gap-2 items-center text-xs">
            <Badge variant="outline" className="capitalize text-[10px]">
              {deliverable.deliverable_type}
            </Badge>
            {client && (
              <span className="inline-flex items-center gap-1">
                <User className="h-3 w-3" /> {client.name}{client.partner_name ? ` & ${client.partner_name}` : ""}
              </span>
            )}
            {project && (
              <span className="inline-flex items-center gap-1">
                <FolderKanban className="h-3 w-3" /> {project.project_name}
              </span>
            )}
            {event && (
              <span className="inline-flex items-center gap-1">
                <ImageIcon className="h-3 w-3" /> {event.name}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Due date warning */}
          {dueDate && (
            <div
              className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
                isOverdue
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : isDueToday
                  ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  : "bg-muted/40 text-muted-foreground"
              }`}
            >
              {isOverdue ? <AlertTriangle className="h-3 w-3" /> : <CalendarDays className="h-3 w-3" />}
              {isOverdue
                ? `Overdue — was due ${format(dueDate, "d MMM")}`
                : isDueToday
                ? "Due today"
                : `Due ${format(dueDate, "d MMM yyyy")}`}
            </div>
          )}

          {/* Status */}
          <div>
            <Label className="text-xs flex items-center justify-between mb-1">
              Status
              <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={quickAdvance}>
                Advance →
              </Button>
            </Label>
            <Select value={status} onValueChange={(v) => setStatus(v as DeliverableStatus)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Progress */}
          <div>
            <Label className="text-xs flex items-center justify-between mb-2">
              <span>Progress</span>
              <span className="text-foreground font-medium">{progress}%</span>
            </Label>
            <Slider
              value={[progress]}
              onValueChange={([v]) => setProgress(v)}
              min={0}
              max={100}
              step={5}
            />
            <div className="flex gap-1 mt-2">
              {[0, 25, 50, 75, 100].map(p => (
                <Button
                  key={p}
                  size="sm"
                  variant={progress === p ? "default" : "outline"}
                  className="h-6 px-2 text-[10px] flex-1"
                  onClick={() => setProgress(p)}
                >
                  {p}%
                </Button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <Label className="text-xs">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as DeliverablePriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map(p => (
                  <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs">Editor notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Edit decisions, references, blockers, client feedback…"
              rows={4}
            />
          </div>

          {/* Delivered date (only shown when status is delivered) */}
          {(status === "delivered" || status === "approved") && (
            <div>
              <Label className="text-xs">Delivered on</Label>
              <Input
                type="date"
                value={deliveredDate || new Date().toISOString().slice(0, 10)}
                onChange={e => setDeliveredDate(e.target.value)}
              />
            </div>
          )}

          {/* Quick-mark delivered action */}
          {status !== "delivered" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500/10"
              onClick={() => {
                setStatus("delivered");
                setProgress(100);
                setDeliveredDate(new Date().toISOString().slice(0, 10));
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Mark as delivered
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
