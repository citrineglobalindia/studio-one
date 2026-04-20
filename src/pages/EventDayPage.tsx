import { useState, useRef, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Camera, Video, Edit3, Users, MapPin, Clock,
  CheckCircle2, ImagePlus, Send, Navigation, CalendarDays, ChevronRight, Zap
} from "lucide-react";
import { useProjects } from "@/hooks/useProjects";
import { useEvents } from "@/hooks/useEvents";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useEventTeamAssignments } from "@/hooks/useEventTeamAssignments";
import { useEventCheckIns } from "@/hooks/useEventCheckIns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type CrewStatus = "not-arrived" | "arrived" | "shooting" | "packing-up" | "left";

const statusConfig: Record<CrewStatus, { label: string; color: string; icon: typeof Clock }> = {
  "not-arrived": { label: "Not Arrived", color: "bg-muted text-muted-foreground", icon: Clock },
  "arrived":     { label: "Arrived",     color: "bg-emerald-500/20 text-emerald-500", icon: CheckCircle2 },
  "shooting":    { label: "Shooting",    color: "bg-blue-500/20 text-blue-500", icon: Camera },
  "packing-up": { label: "Packing Up",  color: "bg-amber-500/20 text-amber-500", icon: Zap },
  "left":        { label: "Left Venue",  color: "bg-muted text-muted-foreground", icon: Navigation },
};

const statusFlow: CrewStatus[] = ["not-arrived", "arrived", "shooting", "packing-up", "left"];

const roleIcons: Record<string, typeof Camera> = {
  photographer: Camera,
  videographer: Video,
  editor: Edit3,
  vendor: Users,
};

const EventDayPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get("event");

  const { projects } = useProjects();
  const { events } = useEvents();
  const { members } = useTeamMembers();
  const { assignments } = useEventTeamAssignments();

  const project = projects.find((p) => p.id === projectId);
  const projectEvents = useMemo(
    () => events
      .filter((e) => e.project_id === projectId || (project && e.client_id === project.client_id))
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()),
    [events, projectId, project],
  );

  const [selectedEventId, setSelectedEventId] = useState<string>(
    eventIdParam || projectEvents[0]?.id || "",
  );
  const selectedEvent = projectEvents.find((e) => e.id === selectedEventId);

  const { checkIns, upsertCheckIn, logActivity } = useEventCheckIns(selectedEventId);

  const assignedMemberIds = useMemo(
    () => assignments.filter((a) => a.event_id === selectedEventId).map((a) => a.team_member_id),
    [assignments, selectedEventId],
  );
  const assignedTeam = useMemo(
    () => members.filter((m) => assignedMemberIds.includes(m.id)),
    [members, assignedMemberIds],
  );

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

  const getStatus = (memberId: string): CrewStatus => {
    const ci = checkIns.find((c) => c.team_member_id === memberId);
    return (ci?.status as CrewStatus) ?? "not-arrived";
  };
  const getArrival = (memberId: string) =>
    checkIns.find((c) => c.team_member_id === memberId)?.arrival_time;

  const advanceStatus = async (memberId: string, name: string) => {
    if (!selectedEventId) return;
    const current = getStatus(memberId);
    const idx = statusFlow.indexOf(current);
    if (idx >= statusFlow.length - 1) return;
    const next = statusFlow[idx + 1];
    const arrivalTime = next === "arrived" ? new Date().toISOString() : undefined;
    await upsertCheckIn.mutateAsync({
      eventId: selectedEventId,
      teamMemberId: memberId,
      status: next,
      arrivalTime,
    });
    await logActivity.mutateAsync({
      eventId: selectedEventId,
      teamMemberId: memberId,
      activityType: "status",
      status: next,
      actorName: user?.user_metadata?.full_name || user?.email || name,
    });
    toast.success(`${name} → ${statusConfig[next].label}`);
  };

  const handlePhotoUpload = (memberId: string) => {
    setUploadingFor(memberId);
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !uploadingFor || !selectedEventId) return;
    const memberId = uploadingFor;
    setUploadingFor(null);

    for (const file of Array.from(files)) {
      const path = `${selectedEventId}/${memberId}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("event-day-media").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (upErr) {
        toast.error(upErr.message);
        continue;
      }
      const { data: urlData } = supabase.storage.from("event-day-media").getPublicUrl(path);
      const url = urlData.publicUrl;

      // First photo doubles as arrival photo if not set
      const existing = checkIns.find((c) => c.team_member_id === memberId);
      if (existing && !existing.arrival_photo_url) {
        await upsertCheckIn.mutateAsync({
          eventId: selectedEventId,
          teamMemberId: memberId,
          status: existing.status,
          arrivalTime: existing.arrival_time ?? new Date().toISOString(),
          arrivalPhotoUrl: url,
        });
      }
      await logActivity.mutateAsync({
        eventId: selectedEventId,
        teamMemberId: memberId,
        activityType: "photo",
        photoUrl: url,
        actorName: user?.user_metadata?.full_name || user?.email || null,
      });
    }
    toast.success("Photo uploaded — admin notified");
    e.target.value = "";
  };

  const addNote = async (memberId: string, name: string) => {
    const text = noteInput[memberId]?.trim();
    if (!text || !selectedEventId) return;
    await logActivity.mutateAsync({
      eventId: selectedEventId,
      teamMemberId: memberId,
      activityType: "note",
      note: text,
      actorName: user?.user_metadata?.full_name || user?.email || name,
    });
    setNoteInput((prev) => ({ ...prev, [memberId]: "" }));
    toast.success("Note posted");
  };

  const arrivedCount = assignedTeam.filter((m) => getStatus(m.id) !== "not-arrived").length;
  const clientName = (project as any).client?.name ?? project.project_name;
  const partnerName = (project as any).client?.partner_name ?? "";

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
            {clientName}{partnerName ? ` & ${partnerName}` : ""} · {project.venue ?? ""}
          </p>
        </div>
        <Badge variant="outline" className="text-xs gap-1">
          <Users className="h-3 w-3" /> {arrivedCount}/{assignedTeam.length} arrived
        </Badge>
      </div>

      {/* Event Selector */}
      {projectEvents.length > 1 && (
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {projectEvents.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={cn(
                  "px-4 py-2 rounded-xl border text-sm font-medium whitespace-nowrap transition-all",
                  selectedEventId === ev.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-primary/30",
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
          <span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{selectedEvent.event_date}</span>
          {selectedEvent.venue && (
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selectedEvent.venue}</span>
          )}
          <Badge variant="outline" className="capitalize text-[10px]">{selectedEvent.status}</Badge>
          <span className="ml-auto inline-flex items-center gap-1 text-emerald-500 font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </span>
        </div>
      )}

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
            const Icon = roleIcons[member.role] || Users;
            const status = getStatus(member.id);
            const cfg = statusConfig[status];
            const StatusIcon = cfg.icon;
            const canAdvance = statusFlow.indexOf(status) < statusFlow.length - 1;
            const arrival = getArrival(member.id);

            return (
              <motion.div key={member.id} layout className="rounded-xl bg-card border border-border overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className="h-11 w-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{member.full_name}</p>
                    <p className="text-[10px] text-muted-foreground capitalize">{member.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("inline-flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-full", cfg.color)}>
                      <StatusIcon className="h-3 w-3" />{cfg.label}
                    </span>
                    {canAdvance && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => advanceStatus(member.id, member.full_name)}
                        disabled={upsertCheckIn.isPending}
                      >
                        <ChevronRight className="h-3 w-3" />
                        {statusConfig[statusFlow[statusFlow.indexOf(status) + 1]].label}
                      </Button>
                    )}
                  </div>
                </div>

                {arrival && (
                  <div className="px-4 pb-2 text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Arrived at {new Date(arrival).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}

                {status !== "not-arrived" && status !== "left" && (
                  <div className="border-t border-border/50 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => handlePhotoUpload(member.id)}>
                        <ImagePlus className="h-3.5 w-3.5" /> Upload Photos
                      </Button>
                    </div>

                    <div className="flex gap-2">
                      <Textarea
                        placeholder="Add a live note for the studio…"
                        className="min-h-[36px] h-9 text-xs resize-none"
                        value={noteInput[member.id] || ""}
                        onChange={(e) => setNoteInput((prev) => ({ ...prev, [member.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); addNote(member.id, member.full_name); }}}
                      />
                      <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0" onClick={() => addNote(member.id, member.full_name)}>
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

      <AnimatePresence />
    </div>
  );
};

export default EventDayPage;
