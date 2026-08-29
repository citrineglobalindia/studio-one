import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MessageCircle } from "lucide-react";

export interface WaTemplate { label: string; body: string; }

function waNumber(phone?: string | null): string {
  const digits = (phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.length === 10 ? "91" + digits : digits;
}

/** Reusable "review before you send" WhatsApp dialog: pick a template, edit it, then send. */
export function WhatsAppSendDialog({
  open, onOpenChange, phone, title = "Send WhatsApp", templates = [], defaultBody = "",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  phone?: string | null;
  title?: string;
  templates?: WaTemplate[];
  defaultBody?: string;
}) {
  const [body, setBody] = useState(defaultBody);

  useEffect(() => {
    if (open) setBody(defaultBody || templates[0]?.body || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultBody]);

  const send = () => {
    const num = waNumber(phone);
    const base = num ? `https://wa.me/${num}` : "https://wa.me/";
    window.open(`${base}?text=${encodeURIComponent(body)}`, "_blank", "noopener,noreferrer");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0 border-b border-border/60">
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-emerald-500" /> {title}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3 overflow-y-auto flex-1 min-h-0">
          {templates.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Choose a template</Label>
              <div className="flex flex-wrap gap-1.5">
                {templates.map((t) => (
                  <button
                    key={t.label}
                    type="button"
                    onClick={() => setBody(t.body)}
                    className="px-2.5 py-1 rounded-full text-xs font-medium border border-border bg-muted/40 hover:bg-muted text-foreground transition"
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Message (edit before sending)</Label>
            <Textarea rows={9} value={body} onChange={(e) => setBody(e.target.value)} className="text-sm" placeholder="Type your message…" />
          </div>
          {!waNumber(phone) && (
            <p className="text-[11px] text-amber-600">No phone number saved — WhatsApp will open so you can pick the contact.</p>
          )}
        </div>

        <DialogFooter className="px-5 py-4 shrink-0 border-t border-border/60">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={send} disabled={!body.trim()}>
            <MessageCircle className="h-4 w-4" /> Send on WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
