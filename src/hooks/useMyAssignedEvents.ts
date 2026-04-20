import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

export interface AssignedEvent {
  id: string;
  name: string;
  event_type: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  status: string;
  client_id: string | null;
  project_id: string | null;
  client_name?: string | null;
  partner_name?: string | null;
}

/**
 * Returns events where the logged-in user is assigned via team_members.user_id
 * mapped through event_team_assignments. Used by photographer/videographer/
 * editor/vendor mobile shells.
 */
export function useMyAssignedEvents() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;
  const userId = user?.id ?? null;

  const teamMember = useQuery({
    queryKey: ["my_team_member", orgId, userId],
    enabled: !!orgId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, full_name, role")
        .eq("organization_id", orgId!)
        .eq("user_id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const teamMemberId = teamMember.data?.id ?? null;

  const events = useQuery({
    queryKey: ["my_assigned_events", orgId, teamMemberId],
    enabled: !!orgId && !!teamMemberId,
    queryFn: async () => {
      const { data: assigns, error: aErr } = await supabase
        .from("event_team_assignments")
        .select("event_id")
        .eq("organization_id", orgId!)
        .eq("team_member_id", teamMemberId!);
      if (aErr) throw aErr;
      const ids = (assigns ?? []).map((a) => a.event_id);
      if (ids.length === 0) return [] as AssignedEvent[];

      const { data: evs, error: eErr } = await supabase
        .from("events")
        .select("*, client:clients(name, partner_name)")
        .in("id", ids)
        .order("event_date", { ascending: true });
      if (eErr) throw eErr;

      return ((evs ?? []) as any[]).map((e) => ({
        ...e,
        client_name: e.client?.name ?? null,
        partner_name: e.client?.partner_name ?? null,
      })) as AssignedEvent[];
    },
  });

  // Realtime: refresh when assignments or events change
  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`my-assigned-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_team_assignments", filter: `organization_id=eq.${orgId}` },
        () => qc.invalidateQueries({ queryKey: ["my_assigned_events", orgId] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "events", filter: `organization_id=eq.${orgId}` },
        () => qc.invalidateQueries({ queryKey: ["my_assigned_events", orgId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, qc]);

  return {
    teamMember: teamMember.data,
    teamMemberId,
    events: events.data ?? [],
    isLoading: teamMember.isLoading || events.isLoading,
  };
}
