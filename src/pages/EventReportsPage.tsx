import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera, MapPin, Search, Filter, FilterX, Loader2, ExternalLink,
  CalendarDays, Clock, UserCheck, ImageOff, Satellite, Image as ImageIcon,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAllCheckIns, type CheckInRow } from "@/hooks/useEventCheckIns";
import { useRole } from "@/contexts/RoleContext";

function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  try { return new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); } catch { return d; }
}

export default function EventReportsPage() {
  const { currentRole } = useRole();
  const allowed = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts";

  const [search, setSearch] = useState("");
  const [filterEvent, setFilterEvent] = useState<string>("all");
  const [filterPerson, setFilterPerson] = useState<string>("all");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [preview, setPreview] = useState<CheckInRow | null>(null);

  const filtersForQuery = useMemo(() => ({
    fromDate: fromDate ? fromDate + "T00:00:00Z" : undefined,
    toDate: toDate ? toDate + "T23:59:59Z" : undefined,
    eventId: filterEvent !== "all" ? filterEvent : undefined,
    userId: filterPerson !== "all" ? filterPerson : undefined,
  }), [fromDate, toDate, filterEvent, filterPerson]);

  const { data, isLoading } = useAllCheckIns(filtersForQuery);
  const rows = (data ?? []) as CheckInRow[];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(r => [
      r.event?.name, r.event?.event_type, r.event?.venue,
      r.member?.full_name, r.notes,
    ].filter(Boolean).join(" ").toLowerCase().includes(q));
  }, [rows, search]);

  const eventOpts = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) if (r.event?.id) m.set(r.event.id, r.event.name || r.event.event_type || "Event");
    return Array.from(m.entries());
  }, [rows]);

  const personOpts = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) if (r.user_id) m.set(r.user_id, r.member?.full_name || r.user_id);
    return Array.from(m.entries());
  }, [rows]);

  const activeFilterCount = [filterEvent !== "all", filterPerson !== "all", fromDate, toDate, search.trim()].filter(Boolean).length;

  if (!allowed) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <Camera className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Event Reports is restricted</p>
        <p className="text-sm text-muted-foreground">Only Admin, Administrator and Accounts can view team check-ins.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        <div className="relative p-5 md:p-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/25 to-emerald-500/5 border border-emerald-500/30 flex items-center justify-center shadow-sm">
              <Camera className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Operations</p>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Event Reports</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Geo-tagged check-in photos from your team on event day</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search event, member, notes…" className="pl-9 h-9" />
        </div>
        <Select value={filterEvent} onValueChange={setFilterEvent}>
          <SelectTrigger className="h-9 w-full sm:w-48 text-xs"><SelectValue placeholder="Event" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All events</SelectItem>
            {eventOpts.map(([id, label]) => <SelectItem key={id} value={id}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPerson} onValueChange={setFilterPerson}>
          <SelectTrigger className="h-9 w-full sm:w-44 text-xs"><SelectValue placeholder="Person" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All people</SelectItem>
            {personOpts.map(([uid, label]) => <SelectItem key={uid} value={uid}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-9 w-full sm:w-40 text-xs" placeholder="From" />
        <Input type="date" value={toDate}   onChange={(e) => setToDate(e.target.value)}   className="h-9 w-full sm:w-40 text-xs" placeholder="To" />
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs" onClick={() => { setSearch(""); setFilterEvent("all"); setFilterPerson("all"); setFromDate(""); setToDate(""); }}>
            <FilterX className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
      </div>

      {/* Body */}
      {isLoading ? (
        <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Camera className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No check-ins yet</p>
          <p className="text-[11px] text-muted-foreground mt-1">Once assigned team members check in on event day, their photos and GPS will show here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(r => <CheckInCard key={r.id} row={r} onOpen={() => setPreview(r)} />)}
        </div>
      )}

      {/* Preview dialog */}
      {preview && (
        <Dialog open onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden">
            <div className="relative bg-black flex items-center justify-center max-h-[70vh]">
              {preview.photo_url ? (
                <img src={preview.photo_url} alt="" className="max-h-[70vh] w-auto object-contain" />
              ) : <ImageOff className="h-12 w-12 text-white/40" />}
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-foreground">{preview.event?.name || preview.event?.event_type || "Event"}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Checked in by {preview.member?.full_name || "Team member"} · {fmtDateTime(preview.captured_at)}
                  </p>
                </div>
                {preview.latitude != null && preview.longitude != null && (
                  <a href={`https://www.google.com/maps?q=${preview.latitude},${preview.longitude}`} target="_blank" rel="noreferrer"
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:underline">
                    <MapPin className="h-3.5 w-3.5" /> Open in Maps <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <Info label="Event date" value={preview.event?.event_date ? new Date(preview.event.event_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
                <Info label="Venue" value={preview.event?.venue || "—"} />
                <Info label="GPS" value={preview.latitude != null ? `${Number(preview.latitude).toFixed(5)}, ${Number(preview.longitude).toFixed(5)} (±${Math.round(Number(preview.accuracy_m || 0))}m)` : "Not captured"} />
                <Info label="Role" value={(preview.member?.role || "").replace(/_/g, " ") || "—"} />
              </div>
              {preview.notes && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Notes</p>
                  <p className="text-sm text-foreground">{preview.notes}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CheckInCard({ row, onOpen }: { row: CheckInRow; onOpen: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/40 transition cursor-pointer group"
      onClick={onOpen}>
      <div className="relative aspect-square bg-muted">
        {row.photo_url ? (
          <img src={row.photo_url} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : <div className="w-full h-full flex items-center justify-center"><ImageOff className="h-8 w-8 text-muted-foreground/40" /></div>}
        {row.latitude != null && (
          <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/65 text-white text-[10px]">
            <Satellite className="h-2.5 w-2.5" /> GPS
          </div>
        )}
      </div>
      <div className="p-3 space-y-1.5">
        <p className="text-xs font-semibold text-foreground truncate">{row.event?.name || row.event?.event_type || "Event"}</p>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <UserCheck className="h-3 w-3" />
          <span className="truncate">{row.member?.full_name || "—"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3 shrink-0" />
          <span className="truncate">{fmtDateTime(row.captured_at)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 px-2.5 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-xs text-foreground truncate">{value}</p>
    </div>
  );
}
