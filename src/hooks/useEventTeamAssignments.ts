import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface DbEventTeamAssignment {
  id: string;
  organization_id: string;
  event_id: string;
  team_member_id: string;
  assigned_at: string;
}

export function useEventTeamAssignments() {
  const qc = useQueryClient();
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["event_team_assignments", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as DbEventTeamAssignment[];
      const { data, error } = await supabase
        .from("event_team_assignments")
        .select("*")
        .eq("organization_id", orgId);
      if (error) throw error;
      return (data as DbEventTeamAssignment[]) ?? [];
    },
  });

  /** Returns the team_member_ids assigned to a given event. */
  const getForEvent = (eventId: string): string[] =>
    (query.data ?? []).filter((r) => r.event_id === eventId).map((r) => r.team_member_id);

  /** Returns a map of event_id -> team_member_ids (used for conflict detection). */
  const byEvent = (): Record<string, string[]> => {
    const out: Record<string, string[]> = {};
    for (const r of query.data ?? []) {
      if (!out[r.event_id]) out[r.event_id] = [];
      out[r.event_id].push(r.team_member_id);
    }
    return out;
  };

  /**
   * Replaces the team-member list for an event atomically:
   * deletes all existing rows for that event, then inserts the new set.
   */
  const setAssignments = useMutation({
    mutationFn: async ({ eventId, memberIds }: { eventId: string; memberIds: string[] }) => {
      if (!orgId) throw new Error("No studio loaded");

      const { error: delErr } = await supabase
        .from("event_team_assignments")
        .delete()
        .eq("event_id", eventId);
      if (delErr) throw delErr;

      if (memberIds.length === 0) return;

      const rows = memberIds.map((mid) => ({
        event_id: eventId,
        team_member_id: mid,
        organization_id: orgId,
      }));
      const { error: insErr } = await supabase
        .from("event_team_assignments")
        .insert(rows);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["event_team_assignments", orgId] });
      toast.success("Team assignment saved");
    },
    onError: (e) => toast.error((e as Error).message || "Failed to save assignment"),
  });

  return {
    assignments: (query.data as DbEventTeamAssignment[]) ?? [],
    isLoading: query.isLoading,
    getForEvent,
    byEvent,
    setAssignments,
  };
}
