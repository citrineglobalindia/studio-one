import { useEffect, useRef, useState } from "react";
import { Camera, MapPin, X, Check, Loader2, RotateCcw, AlertTriangle, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCheckInSubmit } from "@/hooks/useEventCheckIns";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: () => void;
  event: { id: string; name?: string | null; event_type?: string | null; event_date?: string | null; venue?: string | null };
  teamMemberId: string | null;
}

type GpsState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ok"; lat: number; lon: number; accuracy: number }
  | { kind: "error"; msg: string };

export function CheckInDialog({ open, onOpenChange, event, teamMemberId }: Props) {
  const submit = useCheckInSubmit();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facing, setFacing] = useState<"user" | "environment">("user");
  const [snap, setSnap] = useState<{ blob: Blob; dataUrl: string } | null>(null);
  const [gps, setGps] = useState<GpsState>({ kind: "idle" });
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function start() {
      try {
        stopStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false,
        });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play(); }
        setCamErr(null);
      } catch (err: any) {
        setCamErr(err?.message || "Could not access camera. Allow camera permission and try again.");
      }
    }
    if (!snap) start();
    return () => { cancelled = true; };
  }, [open, facing, snap]);

  useEffect(() => {
    if (!open) { stopStream(); setSnap(null); setGps({ kind: "idle" }); setNotes(""); }
  }, [open]);

  useEffect(() => {
    if (!open || gps.kind !== "idle") return;
    if (!("geolocation" in navigator)) { setGps({ kind: "error", msg: "Browser doesn't support GPS" }); return; }
    setGps({ kind: "loading" });
    navigator.geolocation.getCurrentPosition(
      (pos) => setGps({ kind: "ok", lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => setGps({ kind: "error", msg: err.message || "GPS denied. Allow location permission." }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [open, gps.kind]);

  function stopStream() { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; }

  function capture() {
    const v = videoRef.current; const c = canvasRef.current;
    if (!v || !c) return;
    const w = v.videoWidth || 1280, h = v.videoHeight || 720;
    c.width = w; c.height = h;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    if (facing === "user") { ctx.translate(w, 0); ctx.scale(-1, 1); }
    ctx.drawImage(v, 0, 0, w, h);
    const stamp = new Date().toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const gpsTxt = gps.kind === "ok" ? `${gps.lat.toFixed(5)}, ${gps.lon.toFixed(5)}` : "(no gps)";
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, h - 56, w, 56);
    ctx.fillStyle = "white";
    ctx.font = "bold 18px Helvetica";
    ctx.fillText(stamp, 12, h - 32);
    ctx.font = "14px Helvetica";
    ctx.fillText(gpsTxt, 12, h - 10);
    c.toBlob((blob) => {
      if (!blob) { toast.error("Capture failed"); return; }
      const dataUrl = c.toDataURL("image/jpeg", 0.9);
      setSnap({ blob, dataUrl });
      stopStream();
    }, "image/jpeg", 0.9);
  }

  function retake() { setSnap(null); }

  async function send() {
    if (!snap) return;
    setSubmitting(true);
    try {
      await submit.mutateAsync({
        event_id: event.id,
        team_member_id: teamMemberId,
        photo_blob: snap.blob,
        latitude: gps.kind === "ok" ? gps.lat : null,
        longitude: gps.kind === "ok" ? gps.lon : null,
        accuracy_m: gps.kind === "ok" ? gps.accuracy : null,
        notes: notes.trim() || null,
      });
      onOpenChange();
    } finally { setSubmitting(false); }
  }

  const eventLabel = event.name || event.event_type || "Event";
  const dateLabel = event.event_date ? new Date(event.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "";
  const mapsUrl = gps.kind === "ok" ? `https://www.google.com/maps?q=${gps.lat},${gps.lon}` : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Camera className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-base font-semibold text-foreground">Check in to event</p>
              <p className="text-xs text-muted-foreground font-normal">{eventLabel}{dateLabel ? ` · ${dateLabel}` : ""}{event.venue ? ` · ${event.venue}` : ""}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-2.5 border-b border-border bg-muted/20 flex items-center gap-2 text-xs">
          <Satellite className="h-3.5 w-3.5 text-muted-foreground" />
          {gps.kind === "loading" && <span className="text-muted-foreground">Getting GPS…</span>}
          {gps.kind === "ok" && (
            <>
              <span className="text-foreground tabular-nums">{gps.lat.toFixed(5)}, {gps.lon.toFixed(5)}</span>
              <span className="text-muted-foreground">±{Math.round(gps.accuracy)}m</span>
              {mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" className="ml-auto text-emerald-600 hover:underline inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Open map</a>}
            </>
          )}
          {gps.kind === "error" && <span className="text-amber-700 inline-flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {gps.msg}</span>}
          {gps.kind === "idle" && <span className="text-muted-foreground">GPS not started</span>}
        </div>

        <div className="relative bg-black aspect-[4/3] flex items-center justify-center overflow-hidden">
          {camErr && !snap ? (
            <div className="text-center text-white p-4">
              <AlertTriangle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Camera unavailable</p>
              <p className="text-xs text-white/70 mt-1">{camErr}</p>
              <p className="text-[10px] text-white/50 mt-2">Allow camera permission in your browser and try again</p>
            </div>
          ) : snap ? (
            <img src={snap.dataUrl} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <video ref={videoRef} className={"w-full h-full object-cover " + (facing === "user" ? "scale-x-[-1]" : "")} playsInline muted />
          )}
          {!snap && !camErr && (
            <button onClick={() => setFacing((f) => f === "user" ? "environment" : "user")}
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition" title="Flip camera">
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="p-5 space-y-3">
          {snap && (
            <div className="space-y-1.5">
              <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">Notes (optional)</Label>
              <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Arrived on time, all gear set" />
            </div>
          )}

          <div className="flex items-center gap-2">
            {snap ? (
              <>
                <Button variant="ghost" onClick={retake} disabled={submitting} className="gap-2"><RotateCcw className="h-4 w-4" /> Retake</Button>
                <Button onClick={send} disabled={submitting} className="ml-auto gap-2 bg-emerald-600 hover:bg-emerald-700">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Submit check-in
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={onOpenChange} className="gap-2"><X className="h-4 w-4" /> Cancel</Button>
                <Button onClick={capture} disabled={!!camErr} className="ml-auto gap-2 bg-emerald-600 hover:bg-emerald-700">
                  <Camera className="h-4 w-4" /> Capture
                </Button>
              </>
            )}
          </div>

          {gps.kind !== "ok" && snap && (
            <p className="text-[11px] text-amber-700 flex items-center gap-1 px-1"><AlertTriangle className="h-3 w-3" /> Submitting without GPS location</p>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
}
