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

  // Same-day busy set: team_members already booked on `eventDate`
  // for other events in this org.
  const conflictsQ = useQuery({
    queryKey: ["event-day-conflicts", orgId, eventDate, eventId],
    enabled: !!orgId && !!eventDate,
    queryFn: async () => {
      const map = new Map<string, string>();
      if (!orgId || !eventDate) return map;
      // 1) find every event on this date in this org
      const eventsRes = await (supabase as any)
        .from("events")
        .select("id, name")
        .eq("organization_id", orgId)
        .eq("event_date", eventDate);
      if (eventsRes.error) throw eventsRes.error;
      const sameDayEvents = (eventsRes.data ?? []) as Array<{ id: string; name: string | null }>;
      const otherIds = sameDayEvents.filter((e) => e.id !== eventId).map((e) => e.id);
      if (otherIds.length === 0) return map;
      // 2) find all assignments to those events
      const assignRes = await (supabase as any)
        .from("event_team_assignments")
        .select("team_member_id, event_id")
        .eq("organization_id", orgId)
        .in("event_id", otherIds);
      if (assignRes.error) throw assignRes.error;
      const nameById = new Map(sameDayEvents.map((e) => [e.id, e.name || "another event"]));
      for (const row of (assignRes.data ?? []) as Array<{ team_member_id: string; event_id: string }>) {
        map.set(row.team_member_id, nameById.get(row.event_id) || "another event");
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
      qc.invalidateQueries({ queryKey: ["event-day-conflicts", orgId, eventDate] });
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
      qc.invalidateQueries({ queryKey: ["event-day-conflicts", orgId, eventDate] });
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
