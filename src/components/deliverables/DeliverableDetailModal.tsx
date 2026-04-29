import { useEffect, useMemo, useRef, useState } from "react";
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
  Loader2, Save, CalendarDays, User, FolderKanban, Image as ImageIcon, AlertTriangle,
  CheckCircle2, Upload, Trash2, FileText, Film, X, Send, IndianRupee,
} from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import {
  useDeliverables,
  type DeliverableDB,
  type DeliverableStatus,
  type DeliverablePriority,
} from "@/hooks/useDeliverables";
import { useDeliverableAttachments } from "@/hooks/useDeliverableAttachments";
import { usePaymentRequests } from "@/hooks/usePaymentRequests";
import { useProjects } from "@/hooks/useProjects";
import { useEvents } from "@/hooks/useEvents";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  deliverable: DeliverableDB | null;
};

const STATUS_OPTIONS: { value: DeliverableStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In Progress" },
  { value: "review", label: "Ready for Review" },
  { value: "approved", label: "Approved" },
  { value: "delivered", label: "Delivered" },
];

const PRIORITY_OPTIONS: { value: DeliverablePriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function fileIcon(type: string | null) {
  if (!type) return FileText;
  if (type.startsWith("image/")) return ImageIcon;
  if (type.startsWith("video/")) return Film;
  return FileText;
}
function formatBytes(b: number | null) {
  if (!b) return "";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function DeliverableDetailModal({ open, onOpenChange, deliverable }: Props) {
  const { user } = useAuth();
  const { updateDeliverable } = useDeliverables();
  const { projects = [] } = useProjects();
  const { events: dbEvents } = useEvents();
  const { clients = [] } = useClients();
  const { attachments, uploadFile, deleteAttachment } = useDeliverableAttachments(deliverable?.id);
  const { createRequest: createPaymentRequest } = usePaymentRequests();

  const [status, setStatus] = useState<DeliverableStatus>("pending");
  const [progress, setProgress] = useState<number>(0);
  const [notes, setNotes] = useState<string>("");
  const [submissionNotes, setSubmissionNotes] = useState<string>("");
  const [deliveredDate, setDeliveredDate] = useState<string>("");
  const [priority, setPriority] = useState<DeliverablePriority>("medium");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Payment-request panel state
  const [showPayment, setShowPayment] = useState(false);
  const [payAmount, setPayAmount] = useState<string>("");
  const [payDescription, setPayDescription] = useState<string>("");
  const [payMethod, setPayMethod] = useState<string>("upi");
  const [payAccount, setPayAccount] = useState<string>("");
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    if (deliverable) {
      setStatus((deliverable.status as DeliverableStatus) || "pending");
      setProgress(deliverable.progress || 0);
      setNotes(deliverable.notes || "");
      setDeliveredDate(deliverable.delivered_date || "");
      setPriority((deliverable.priority as DeliverablePriority) || "medium");
      setSubmissionNotes("");
      setShowPayment(false);
      setPayAmount("");
      setPayDescription(deliverable.title || deliverable.deliverable_type || "");
      setPayMethod("upi");
      setPayAccount("");
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

  const handleSubmitForReview = async () => {
    setSubmitting(true);
    try {
      // Mark deliverable as 'review' + record submission timestamp + notes
      const { error } = await supabase
        .from("deliverables")
        .update({
          status: "review",
          progress: Math.max(progress, 90),
          submitted_at: new Date().toISOString(),
          submission_notes: submissionNotes || null,
        } as any)
        .eq("id", deliverable.id);
      if (error) throw error;
      toast.success("Submitted for review!");
      setStatus("review");
      setProgress(Math.max(progress, 90));
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      try {
        await uploadFile.mutateAsync({ file });
      } catch { /* hook toasts */ }
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRaisePayment = async () => {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) { toast.error("Enter a valid amount"); return; }
    if (!payDescription.trim()) { toast.error("Describe what this payment is for"); return; }
    setSubmittingPayment(true);
    try {
      await createPaymentRequest.mutateAsync({
        team_member_id: null,
        deliverable_id: deliverable.id,
        project_id: deliverable.project_id ?? null,
        amount,
        currency: "INR",
        description: payDescription.trim(),
        payment_method: payMethod,
        payment_account: payAccount.trim() || null,
      });
      setShowPayment(false);
      setPayAmount("");
    } finally {
      setSubmittingPayment(false);
    }
  };

  const quickAdvance = async () => {
    const flow: DeliverableStatus[] = ["pending", "in_progress", "review", "approved", "delivered"];
    const idx = flow.indexOf(status);
    const next = flow[Math.min(idx + 1, flow.length - 1)];
    setStatus(next);
    setProgress(next === "delivered" || next === "approved" ? 100 : Math.max(progress, 25 * (idx + 1)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
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

        <div className="space-y-5">
          {dueDate && (
            <div
              className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
                isOverdue
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : isDueToday
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
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

          {/* Attachments */}
          <div>
            <Label className="text-xs flex items-center justify-between mb-2">
              <span className="flex items-center gap-1">
                <Upload className="h-3 w-3" /> Attachments ({attachments.length})
              </span>
              <span className="text-slate-400 font-normal">images / videos / PDFs / zip</span>
            </Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,application/pdf,.zip"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 border-dashed border-blue-300 hover:bg-blue-50"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload files
            </Button>
            {attachments.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {attachments.map(att => {
                  const FIcon = fileIcon(att.file_type);
                  const isImage = att.file_type?.startsWith("image/");
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-blue-100 bg-white"
                    >
                      {isImage ? (
                        <a href={att.file_url} target="_blank" rel="noreferrer" className="shrink-0">
                          <img src={att.file_url} alt={att.file_name} className="h-10 w-10 object-cover rounded-md" />
                        </a>
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-blue-50 flex items-center justify-center shrink-0">
                          <FIcon className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <a
                          href={att.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-slate-900 hover:text-blue-600 truncate block"
                        >
                          {att.file_name}
                        </a>
                        <p className="text-[10px] text-slate-500">
                          {formatBytes(att.file_size)} · {format(new Date(att.created_at), "d MMM HH:mm")}
                        </p>
                      </div>
                      {att.uploaded_by === user?.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-rose-500"
                          onClick={() => deleteAttachment.mutate(att)}
                        >
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
              <span className="text-blue-600 font-bold">{progress}%</span>
            </Label>
            <Slider value={[progress]} onValueChange={([v]) => setProgress(v)} min={0} max={100} step={5} />
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
            <Label className="text-xs">Internal notes</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Edit decisions, references, blockers, client feedback…"
              rows={3}
            />
          </div>

          {/* Submission notes (only when approaching review) */}
          {status !== "delivered" && status !== "approved" && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-3">
              <Label className="text-xs flex items-center gap-1 mb-1 text-blue-700">
                <Send className="h-3 w-3" /> Submission notes (visible to admin)
              </Label>
              <Textarea
                value={submissionNotes}
                onChange={e => setSubmissionNotes(e.target.value)}
                placeholder="Anything the admin should know when reviewing your work?"
                rows={2}
                className="bg-white"
              />
              <Button
                onClick={handleSubmitForReview}
                disabled={submitting || attachments.length === 0}
                className="mt-2 w-full gap-2"
                style={{ background: "linear-gradient(135deg,#38bdf8,#2563eb)" }}
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit for review
              </Button>
              {attachments.length === 0 && (
                <p className="text-[10px] text-slate-500 mt-1.5">Upload at least one file before submitting.</p>
              )}
            </div>
          )}

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

          {/* Mark as delivered shortcut */}
          {status !== "delivered" && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
              onClick={() => {
                setStatus("delivered");
                setProgress(100);
                setDeliveredDate(new Date().toISOString().slice(0, 10));
              }}
            >
              <CheckCircle2 className="h-4 w-4" /> Mark as delivered
            </Button>
          )}

          {/* Raise payment */}
          <div className="rounded-xl border border-amber-100 bg-amber-50/30 p-3">
            <Label className="text-xs flex items-center justify-between mb-1 text-amber-700">
              <span className="flex items-center gap-1">
                <IndianRupee className="h-3 w-3" /> Raise payment for this work
              </span>
              {!showPayment && (
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-amber-700" onClick={() => setShowPayment(true)}>
                  + Request
                </Button>
              )}
            </Label>
            {showPayment && (
              <div className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Amount (₹)"
                    value={payAmount}
                    onChange={e => setPayAmount(e.target.value)}
                    className="bg-white"
                  />
                  <Select value={payMethod} onValueChange={setPayMethod}>
                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  placeholder={payMethod === "upi" ? "UPI id (e.g. you@upi)" : "Account details"}
                  value={payAccount}
                  onChange={e => setPayAccount(e.target.value)}
                  className="bg-white"
                />
                <Textarea
                  placeholder="Description — what is this payment for?"
                  value={payDescription}
                  onChange={e => setPayDescription(e.target.value)}
                  rows={2}
                  className="bg-white"
                />
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowPayment(false)}>
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1"
                    style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}
                    onClick={handleRaisePayment}
                    disabled={submittingPayment}
                  >
                    {submittingPayment ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
