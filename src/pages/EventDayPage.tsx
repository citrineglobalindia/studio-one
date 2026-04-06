import { useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { sampleProjects, type TeamMember, type SubEvent } from "@/data/wedding-types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Video, Edit3, Users, MapPin, Clock,
  CheckCircle2, ImagePlus, Send, Loader2, Navigation, MessageSquare,
  CalendarDays, Upload, X, ChevronRight, Zap
} from "lucide-react";

type CrewStatus = "not-arrived" | "arrived" | "shooting" | "packing-up" | "left";

interface CheckInEntry {
  memberId: string;
  status: CrewStatus;
  arrivalPhoto?: string;
  arrivalTime?: string;
  photos: { id: string; url: string; caption: string; timestamp: string }[];
  notes: string[];
}

const statusConfig: Record<CrewStatus, { label: string; color: string; icon: typeof Clock }> = {
  "not-arrived": { label: "Not Arrived", color: "bg-muted text-muted-foreground", icon: Clock },
  "arrived": { label: "Arrived", color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle2 },
  "shooting": { label: "Shooting", color: "bg-blue-500/20 text-blue-400", icon: Camera },
  "packing-up": { label: "Packing Up", color: "bg-amber-500/20 text-amber-400", icon: Zap },
  "left": { label: "Left Venue", color: "bg-muted text-muted-foreground", icon: Navigation },
};

const statusFlow: CrewStatus[] = ["not-arrived", "arrived", "shooting", "packing-up", "left"];

const roleIcons: Record<string, typeof Camera> = {
  photographer: Camera,
  videographer: Video,
  editor: Edit3,
  "drone-operator": Camera,
  assistant: Users,
};

const EventDayPage = () => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get("event");

  const project = sampleProjects.find((p) => p.id === projectId);

  // Find today's events or fallback to all
  const todayStr = new Date().toISOString().split("T")[0];
  const todayEvents = project?.subEvents.filter((e) => e.date === todayStr) ?? [];
  const allEvents = project?.subEvents ?? [];
  const relevantEvents = todayEvents.length > 0 ? todayEvents : allEvents;

  const [selectedEventId, setSelectedEventId] = useState<string>(
    eventIdParam || relevantEvents[0]?.id || ""
  );
  const selectedEvent = allEvents.find((e) => e.id === selectedEventId);

  // Check-in state per member
  const [checkIns, setCheckIns] = useState<Record<string, CheckInEntry>>({});

  // Note input
  const [noteInput, setNoteInput] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-muted-foreground">Project not found</p>
        <Button variant="outline" onClick={() => navigate("/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Projects
        </Button>
      </div>
    );
  }

  const getCheckIn = (memberId: string): CheckInEntry => {
    return checkIns[memberId] || {
      memberId,
      status: "not-arrived",
      photos: [],
      notes: [],
    };
  };

  const updateCheckIn = (memberId: string, updates: Partial<CheckInEntry>) => {
    setCheckIns((prev) => ({
      ...prev,
      [memberId]: { ...getCheckIn(memberId), ...updates },
    }));
  };

  const advanceStatus = (memberId: string, member: TeamMember) => {
    const current = getCheckIn(memberId);
    const currentIdx = statusFlow.indexOf(current.status);
    if (currentIdx < statusFlow.length - 1) {
      const nextStatus = statusFlow[currentIdx + 1];
      const updates: Partial<CheckInEntry> = { status: nextStatus };
      if (nextStatus === "arrived") {
        updates.arrivalTime = new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      }
      updateCheckIn(memberId, updates);
      toast.success(`${member.name} → ${statusConfig[nextStatus].label}`);
    }
  };

  const handlePhotoUpload = (memberId: string) => {
    setUploadingFor(memberId);
    fileInputRef.current?.click();
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !uploadingFor) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        const entry = getCheckIn(uploadingFor);
        const newPhoto = {
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          url,
          caption: "",
          timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        };
        updateCheckIn(uploadingFor, { photos: [...entry.photos, newPhoto] });
        toast.success("Photo uploaded");
      };
      reader.readAsDataURL(file);
    });

    e.target.value = "";
    setUploadingFor(null);
  };

  const addNote = (memberId: string) => {
    const text = noteInput[memberId]?.trim();
    if (!text) return;
    const entry = getCheckIn(memberId);
    updateCheckIn(memberId, {
      notes: [...entry.notes, `${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} — ${text}`],
    });
    setNoteInput((prev) => ({ ...prev, [memberId]: "" }));
  };

  const removePhoto = (memberId: string, photoId: string) => {
    const entry = getCheckIn(memberId);
    updateCheckIn(memberId, { photos: entry.photos.filter((p) => p.id !== photoId) });
  };

  const assignedTeam = selectedEvent?.assignedTeam ?? [];
  const arrivedCount = assignedTeam.filter((m) => getCheckIn(m.id).status !== "not-arrived").length;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/projects/${project.id}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold text-foreground">Event Day</h1>
          <p className="text-xs text-muted-foreground">
            {project.clientName} & {project.partnerName} · {project.venue}
          </p>
        </div>
        <Badge variant="outline" className="text-xs gap-1">
          <Users className="h-3 w-3" /> {arrivedCount}/{assignedTeam.length} arrived
        </Badge>
      </div>

      {/* Event Selector */}
      {relevantEvents.length > 1 && (
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {relevantEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={cn(
                  "px-4 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all",
                  selectedEventId === ev.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30"
                )}
              >
                {ev.name}
              </button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Event Info Bar */}
      {selectedEvent && (
        <div className="flex items-center gap-4 p-3 rounded-xl bg-card border border-border text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{selectedEvent.date}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selectedEvent.location}</span>
          <Badge variant="outline" className="capitalize text-[10px]">{selectedEvent.status}</Badge>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onFileSelected}
      />

      {/* Crew Cards */}
      {assignedTeam.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">No team assigned to this event</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assignedTeam.map((member) => {
            const entry = getCheckIn(member.id);
            const Icon = roleIcons[member.role] || Users;
            const status = statusConfig[entry.status];
            const StatusIcon = status.icon;
            const canAdvance = statusFlow.indexOf(entry.status) < statusFlow.length - 1;

            return (
              <motion.div
                key={member.id}
                layout
                className="rounded-xl bg-card border border-border overflow-hidden"
              >
                {/* Member header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{member.role.replace("-", " ")}{member.type === "vendor" ? " · Vendor" : ""}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full", status.color)}>
                      <StatusIcon className="h-3 w-3" />{status.label}
                    </span>
                    {canAdvance && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                        onClick={() => advanceStatus(member.id, member)}
                      >
                        <ChevronRight className="h-3 w-3" />
                        {statusConfig[statusFlow[statusFlow.indexOf(entry.status) + 1]].label}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Arrival time */}
                {entry.arrivalTime && (
                  <div className="px-4 pb-2 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Arrived at {entry.arrivalTime}
                  </div>
                )}

                {/* Action bar - visible when arrived or beyond */}
                {entry.status !== "not-arrived" && entry.status !== "left" && (
                  <div className="border-t border-border/50 p-4 space-y-3">
                    {/* Photo upload */}
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-xs gap-1.5"
                        onClick={() => handlePhotoUpload(member.id)}
                      >
                        <ImagePlus className="h-3.5 w-3.5" /> Upload Photos
                      </Button>
                      <span className="text-[10px] text-muted-foreground">{entry.photos.length} photo(s)</span>
                    </div>

                    {/* Uploaded photos grid */}
                    {entry.photos.length > 0 && (
                      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                        <AnimatePresence>
                          {entry.photos.map((photo) => (
                            <motion.div
                              key={photo.id}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="relative aspect-square rounded-lg overflow-hidden group"
                            >
                              <img src={photo.url} alt="" className="w-full h-full object-cover" />
                              <button
                                onClick={() => removePhoto(member.id, photo.id)}
                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3 text-white" />
                              </button>
                              <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-1 py-0.5">
                                <span className="text-[8px] text-white">{photo.timestamp}</span>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* Notes */}
                    {entry.notes.length > 0 && (
                      <div className="space-y-1">
                        {entry.notes.map((note, i) => (
                          <p key={i} className="text-[11px] text-muted-foreground bg-muted/40 px-2.5 py-1.5 rounded-lg">
                            {note}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Add note */}
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a note..."
                        className="min-h-[36px] h-9 text-xs resize-none"
                        value={noteInput[member.id] || ""}
                        onChange={(e) => setNoteInput((prev) => ({ ...prev, [member.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(member.id); }}}
                      />
                      <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => addNote(member.id)}>
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventDayPage;
