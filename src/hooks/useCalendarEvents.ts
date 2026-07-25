import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import type { DbEvent } from "@/hooks/useEvents";

export interface CalendarEventRow extends DbEvent {
  client_name?: string | null;
  assigned_member_ids: string[];
}

/**
 * Returns events for the calendar within [fromIso, toIso].
 * - admin / administrator / accounts → all org events
 * - other roles → only events the current user is assigned to
 *   (matched via team_members.user_id = auth.uid())
 */
export function useCalendarEvents(fromIso: string, toIso: string) {
  const { organization } = useOrg();
  const { user } = useAuth();
  const { currentRole } = useRole();
  const orgId = organization?.id ?? null;
  const userId = user?.id ?? null;
  const canSeeAll = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts" || currentRole === "telecaller";

  return useQuery({
    queryKey: ["calendar-events", orgId, fromIso, toIso, currentRole, userId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as CalendarEventRow[];

      // 1) Pull events in date range
      const evRes = await (supabase as any)
        .from("events")
        .select("*, client:clients(id,name,partner_name)")
        .eq("organization_id", orgId)
        .gte("event_date", fromIso)
        .lte("event_date", toIso)
        .order("event_date", { ascending: true });
      if (evRes.error) throw evRes.error;
      const allEvents = (evRes.data ?? []) as Array<DbEvent & { client?: { id: string; name: string; partner_name: string | null } | null }>;

      if (allEvents.length === 0) return [];

      // 2) Pull all assignments for these events
      const assignRes = await (supabase as any)
        .from("event_team_assignments")
        .select("event_id, team_member_id")
        .eq("organization_id", orgId)
        .in("event_id", allEvents.map((e) => e.id));
      if (assignRes.error) throw assignRes.error;
      const assignments = (assignRes.data ?? []) as Array<{ event_id: string; team_member_id: string }>;
      const byEvent = new Map<string, string[]>();
      for (const a of assignments) {
        if (!byEvent.has(a.event_id)) byEvent.set(a.event_id, []);
        byEvent.get(a.event_id)!.push(a.team_member_id);
      }

      // 3) Determine which events this user can see
      let visibleEvents = allEvents;
      if (!canSeeAll && userId) {
        // Find the team_member row matching this auth user
        const tmRes = await (supabase as any)
          .from("team_members").select("id")
          .eq("organization_id", orgId)
          .eq("user_id", userId);
        const myMemberIds = new Set(((tmRes.data ?? []) as Array<{ id: string }>).map((r) => r.id));
        if (myMemberIds.size === 0) {
          visibleEvents = [];
        } else {
          visibleEvents = allEvents.filter((e) => {
            const list = byEvent.get(e.id) || [];
            return list.some((mid) => myMemberIds.has(mid));
          });
        }
      }

      return visibleEvents.map((e) => ({
        ...e,
        client_name: e.client ? (e.client.partner_name ? `${e.client.name} & ${e.client.partner_name}` : e.client.name) : null,
        assigned_member_ids: byEvent.get(e.id) ?? [],
      })) as CalendarEventRow[];
    },
  });
}
