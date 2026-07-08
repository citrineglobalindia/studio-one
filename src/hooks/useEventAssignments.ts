import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface DbAssignment {
  id: string;
  organization_id: string;
  event_id: string;
  team_member_id: string;
  assigned_at: string;
  data_copied?: boolean;
  data_copied_at?: string | null;
  data_copied_by?: string | null;
}

/**
 * Fetches assignments for a specific event,
 * plus a same-day conflict map for the given event_date.
 */
export function useEventAssignments(eventId: string | undefined, eventDate: string | null | undefined) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const assignmentsQ = useQuery({
    queryKey: ["event-assignments", orgId, eventId],
    enabled: !!orgId && !!eventId,
    queryFn: async () => {
      if (!orgId || !eventId) return [] as DbAssignment[];
      const { data, error } = await supabase
        .from("event_team_assignments")
        .select("*")
        .eq("organization_id", orgId)
        .eq("event_id", eventId);
      if (error) throw error;
      return ((data as unknown) ?? []) as DbAssignment[];
    },
  });

  // Time-overlap conflict set: members booked on this date with overlapping times.
  // If either event lacks times, treat as date conflict (safe default).
  const conflictsQ = useQuery({
    queryKey: ["event-time-conflicts", orgId, eventDate, eventId],
    enabled: !!orgId && !!eventDate,
    queryFn: async () => {
      const map = new Map<string, string>();
      if (!orgId || !eventDate) return map;

      // Self event times
      let thisStart: string | null = null, thisEnd: string | null = null;
      if (eventId) {
        const selfRes = await (supabase as any)
          .from("events").select("start_time, end_time").eq("id", eventId).single();
        if (selfRes.data) {
          thisStart = selfRes.data.start_time as string | null;
          thisEnd = selfRes.data.end_time as string | null;
        }
      }

      // Other events on this date
      const eventsRes = await (supabase as any)
        .from("events")
        .select("id, name, start_time, end_time")
        .eq("organization_id", orgId)
        .eq("event_date", eventDate);
      if (eventsRes.error) throw eventsRes.error;
      const sameDayEvents = (eventsRes.data ?? []) as Array<{
        id: string; name: string | null; start_time: string | null; end_time: string | null;
      }>;
      const others = sameDayEvents.filter((e) => e.id !== eventId);
      if (others.length === 0) return map;

      // Filter by time-overlap
      const overlapping = others.filter((e) => {
        if (!thisStart || !thisEnd || !e.start_time || !e.end_time) return true; // safe default
        return thisStart < e.end_time && e.start_time < thisEnd;
      });
      if (overlapping.length === 0) return map;

      const assignRes = await (supabase as any)
        .from("event_team_assignments")
        .select("team_member_id, event_id")
        .eq("organization_id", orgId)
        .in("event_id", overlapping.map((e) => e.id));
      if (assignRes.error) throw assignRes.error;
      const labelById = new Map(overlapping.map((e) => {
        const t = (e.start_time && e.end_time) ? ` (${String(e.start_time).slice(0,5)}–${String(e.end_time).slice(0,5)})` : "";
        return [e.id, (e.name || "another event") + t];
      }));
      for (const row of (assignRes.data ?? []) as Array<{ team_member_id: string; event_id: string }>) {
        map.set(row.team_member_id, labelById.get(row.event_id) || "another event");
      }
      return map;
    },
  });

  const assignedIds = new Set((assignmentsQ.data ?? []).map((a) => a.team_member_id));

  const assignMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!orgId || !eventId) throw new Error("Missing studio or event");
      const { error } = await supabase.from("event_team_assignments").insert({
        organization_id: orgId,
        event_id: eventId,
        team_member_id: memberId,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-assignments", orgId, eventId] });
      qc.invalidateQueries({ queryKey: ["event-time-conflicts", orgId, eventDate] });
      qc.invalidateQueries({ queryKey: ["client-event-assignments"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const unassignMember = useMutation({
    mutationFn: async (memberId: string) => {
      if (!orgId || !eventId) throw new Error("Missing studio or event");
      const { error } = await supabase
        .from("event_team_assignments")
        .delete()
        .eq("organization_id", orgId)
        .eq("event_id", eventId)
        .eq("team_member_id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event-assignments", orgId, eventId] });
      qc.invalidateQueries({ queryKey: ["event-time-conflicts", orgId, eventDate] });
      qc.invalidateQueries({ queryKey: ["client-event-assignments"] });
      qc.invalidateQueries({ queryKey: ["calendar-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    assignments: assignmentsQ.data ?? [],
    assignedIds,
    conflicts: conflictsQ.data ?? new Map<string, string>(),
    isLoading: assignmentsQ.isLoading,
    assignMember,
    unassignMember,
  };
}

/** Toggle the "data copied" flag on a single assignment (assigned member or admin). */
export function useToggleDataCopied() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, value, userId }: { id: string; value: boolean; userId?: string | null }) => {
      const { error } = await (supabase as any)
        .from("event_team_assignments")
        .update({ data_copied: value, data_copied_at: value ? new Date().toISOString() : null, data_copied_by: value ? (userId ?? null) : null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-event-assignments"] });
      qc.invalidateQueries({ queryKey: ["event-assignments"] });
      qc.invalidateQueries({ queryKey: ["day-assignments"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
