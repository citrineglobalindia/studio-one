import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, MapPin, Calendar, ChevronRight, Briefcase, Clock, Camera, CheckCircle2, Zap, Navigation } from "lucide-react";
import { useMyAssignedEvents } from "@/hooks/useMyAssignedEvents";
import { useEventCheckIns } from "@/hooks/useEventCheckIns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type CrewStatus = "not-arrived" | "arrived" | "shooting" | "packing-up" | "left";
const statusFlow: CrewStatus[] = ["not-arrived", "arrived", "shooting", "packing-up", "left"];
const statusLabels: Record<CrewStatus, { label: string; tone: string; icon: any }> = {
  "not-arrived": { label: "Not Arrived", tone: "bg-muted text-muted-foreground", icon: Clock },
  arrived:       { label: "Arrived",     tone: "bg-emerald-500/15 text-emerald-500", icon: CheckCircle2 },
  shooting:      { label: "Shooting",    tone: "bg-blue-500/15 text-blue-500", icon: Camera },
  "packing-up": { label: "Packing Up",  tone: "bg-amber-500/15 text-amber-500", icon: Zap },
  left:          { label: "Left",        tone: "bg-secondary text-secondary-foreground", icon: Navigation },
};

export default function RoleProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { events, teamMember, teamMemberId, isLoading } = useMyAssignedEvents();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"All" | "Today" | "Upcoming" | "Done">("All");

  const todayStr = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    return events.filter((e) => {
      if (tab === "Today" && e.event_date !== todayStr) return false;
      if (tab === "Upcoming" && new Date(e.event_date) <= new Date(todayStr)) return false;
      if (tab === "Done" && e.status !== "completed") return false;
      if (q && !`${e.name} ${e.client_name ?? ""} ${e.venue ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [events, q, tab, todayStr]);

  if (isLoading) {
    return <div className="px-5 pt-12 text-center text-sm text-muted-foreground">Loading your assignments…</div>;
  }

  if (!teamMember) {
    return (
      <div className="px-5 pt-10">
        <div className="rounded-2xl bg-card border border-border p-6 text-center">
          <Briefcase className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <h3 className="text-sm font-bold text-foreground">No staff profile linked</h3>
          <p className="text-[12px] text-muted-foreground mt-1">
            Ask your studio admin to link your account to a team member to see your assigned events.
          </p>
        </div>
      </div>
    );
  }

  const todayCount = events.filter((e) => e.event_date === todayStr).length;
  const upcomingCount = events.filter((e) => new Date(e.event_date) > new Date(todayStr)).length;
  const doneCount = events.filter((e) => e.status === "completed").length;

  return (
    <div>
      {/* Hero */}
      <div className="relative px-5 pt-5 pb-12 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/85 to-primary/55" />
        <div className="absolute -top-24 -right-12 h-56 w-56 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />

        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-[0.18em] opacity-75 font-semibold flex items-center gap-1.5">
            <Briefcase className="h-3 w-3" /> My Assignments
          </p>
          <p className="text-2xl font-black tracking-tight mt-1">Hi, {teamMember.full_name.split(" ")[0]}</p>
          <p className="text-[12px] opacity-85 mt-0.5">{events.length} event{events.length === 1 ? "" : "s"} on your plate</p>

          <div className="grid grid-cols-3 gap-2 mt-4">
            {[
              { label: "Today",    value: todayCount,    icon: Zap },
              { label: "Upcoming", value: upcomingCount, icon: Clock },
              { label: "Done",     value: doneCount,     icon: CheckCircle2 },
            ].map((s, i) => {
              const I = s.icon;
              return (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 + i * 0.05 }}
                  className="bg-white/15 backdrop-blur-xl rounded-2xl p-3 border border-white/15"
                >
                  <I className="h-3.5 w-3.5 mb-1 opacity-90" />
                  <p className="text-[9px] uppercase tracking-wider opacity-75 font-semibold">{s.label}</p>
                  <p className="text-[18px] font-black mt-0.5">{s.value}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sheet */}
      <div className="bg-background -mt-6 rounded-t-[28px] relative z-10 px-5 pt-5 pb-6 ring-1 ring-border/40">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search events, clients, venues…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-card ring-1 ring-border text-[13px] outline-none focus:ring-primary"
          />
        </div>

        <div className="flex gap-1.5 mb-4 bg-secondary/60 rounded-2xl p-1">
          {(["All", "Today", "Upcoming", "Done"] as const).map((t) => {
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative flex-1 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                  active ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {active && (
                  <motion.div layoutId="proj-tab" className="absolute inset-0 bg-primary rounded-xl shadow" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10">{t}</span>
              </button>
            );
          })}
        </div>

        <div className="space-y-2.5">
          {filtered.map((e, i) => (
            <EventCard
              key={e.id}
              event={e}
              index={i}
              teamMemberId={teamMemberId!}
              actorName={user?.user_metadata?.full_name || user?.email || teamMember.full_name}
              onOpen={() => navigate(`/m/projects/${e.project_id ?? e.id}/event-day?event=${e.id}`)}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-12 rounded-2xl bg-card border border-dashed border-border">
              <Briefcase className="h-7 w-7 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm font-semibold text-foreground">No events to show</p>
              <p className="text-[11px] text-muted-foreground mt-1">Try a different filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EventCard({
  event, index, teamMemberId, actorName, onOpen,
}: {
  event: any; index: number; teamMemberId: string; actorName: string; onOpen: () => void;
}) {
  const { checkIns, upsertCheckIn, logActivity } = useEventCheckIns(event.id);
  const my = checkIns.find((c) => c.team_member_id === teamMemberId);
  const status = (my?.status as CrewStatus) ?? "not-arrived";
  const cfg = statusLabels[status];
  const Icon = cfg.icon;
  const canAdvance = statusFlow.indexOf(status) < statusFlow.length - 1;

  const advance = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = statusFlow.indexOf(status);
    const next = statusFlow[idx + 1];
    await upsertCheckIn.mutateAsync({
      eventId: event.id,
      teamMemberId,
      status: next,
      arrivalTime: next === "arrived" ? new Date().toISOString() : my?.arrival_time ?? null,
    });
    await logActivity.mutateAsync({
      eventId: event.id,
      teamMemberId,
      activityType: "status",
      status: next,
      actorName,
    });
    toast.success(`Status updated → ${statusLabels[next].label}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-card border border-border rounded-2xl p-4"
    >
      <button onClick={onOpen} className="w-full text-left active:opacity-80">
        <div className="flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[14px] font-bold text-foreground truncate">{event.name}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.tone} inline-flex items-center gap-1`}>
                <Icon className="h-3 w-3" /> {cfg.label}
              </span>
            </div>
            {event.client_name && (
              <p className="text-[12px] text-muted-foreground mb-1">
                {event.client_name}{event.partner_name ? ` & ${event.partner_name}` : ""}
              </p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {event.event_date}</span>
              {event.venue && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {event.venue}</span>}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-1" />
        </div>
      </button>

      {canAdvance && (
        <button
          onClick={advance}
          disabled={upsertCheckIn.isPending}
          className="mt-3 w-full bg-primary/10 hover:bg-primary/15 text-primary text-[12px] font-semibold py-2 rounded-xl transition-colors active:scale-[0.98]"
        >
          Mark as “{statusLabels[statusFlow[statusFlow.indexOf(status) + 1]].label}”
        </button>
      )}
    </motion.div>
  );
}
