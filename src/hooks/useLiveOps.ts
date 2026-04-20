import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export interface LiveOpsItem {
  id: string;
  kind: "check_in" | "activity" | "deliverable" | "expense";
  title: string;
  subtitle?: string;
  meta?: string;
  created_at: string;
  tone: "blue" | "emerald" | "amber" | "rose" | "primary";
}

/**
 * Aggregates the latest crew, deliverable, and expense activity into a single
 * realtime feed for the admin dashboard and Live Clients view.
 */
export function useLiveOps(limit = 25) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const q = useQuery({
    queryKey: ["live_ops_feed", orgId, limit],
    enabled: !!orgId,
    queryFn: async (): Promise<LiveOpsItem[]> => {
      if (!orgId) return [];
      const [activity, deliv, exp, events, members] = await Promise.all([
        supabase.from("event_activity").select("*")
          .eq("organization_id", orgId).order("created_at", { ascending: false }).limit(limit),
        supabase.from("deliverables").select("*")
          .eq("organization_id", orgId).order("updated_at", { ascending: false }).limit(limit),
        supabase.from("expenses").select("*")
          .order("created_at", { ascending: false }).limit(limit),
        supabase.from("events").select("id, name").eq("organization_id", orgId),
        supabase.from("team_members").select("id, full_name").eq("organization_id", orgId),
      ]);

      const eventMap = new Map((events.data ?? []).map((e: any) => [e.id, e.name]));
      const memberMap = new Map((members.data ?? []).map((m: any) => [m.id, m.full_name]));

      const items: LiveOpsItem[] = [];

      for (const a of activity.data ?? []) {
        const evName = eventMap.get((a as any).event_id) ?? "Event";
        const who = (a as any).actor_name ?? memberMap.get((a as any).team_member_id) ?? "Team";
        if (a.activity_type === "status") {
          items.push({
            id: `act-${a.id}`, kind: "activity",
            title: `${who} → ${a.status}`,
            subtitle: evName, meta: "Event check-in",
            created_at: a.created_at, tone: "blue",
          });
        } else if (a.activity_type === "photo") {
          items.push({
            id: `act-${a.id}`, kind: "activity",
            title: `${who} uploaded an arrival photo`,
            subtitle: evName, meta: "Live photo",
            created_at: a.created_at, tone: "emerald",
          });
        } else if (a.activity_type === "note") {
          items.push({
            id: `act-${a.id}`, kind: "activity",
            title: `${who}: “${(a.note ?? "").slice(0, 70)}”`,
            subtitle: evName, meta: "On-site note",
            created_at: a.created_at, tone: "amber",
          });
        }
      }
      for (const d of deliv.data ?? []) {
        items.push({
          id: `del-${d.id}`, kind: "deliverable",
          title: `${d.title ?? d.deliverable_type} → ${d.status}`,
          subtitle: d.assigned_to ?? "Editor",
          meta: "Deliverable",
          created_at: d.updated_at, tone: "primary",
        });
      }
      for (const e of exp.data ?? []) {
        items.push({
          id: `exp-${e.id}`, kind: "expense",
          title: `${e.submitted_by} raised ₹${Number(e.amount).toLocaleString("en-IN")}`,
          subtitle: e.description, meta: e.category ?? "Expense",
          created_at: e.created_at, tone: "rose",
        });
      }

      return items
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
    },
  });

  useEffect(() => {
    if (!orgId) return;
    const ch = supabase
      .channel(`live-ops-${orgId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_activity", filter: `organization_id=eq.${orgId}` },
        () => qc.invalidateQueries({ queryKey: ["live_ops_feed", orgId] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "deliverables", filter: `organization_id=eq.${orgId}` },
        () => qc.invalidateQueries({ queryKey: ["live_ops_feed", orgId] }))
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" },
        () => qc.invalidateQueries({ queryKey: ["live_ops_feed", orgId] }))
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [orgId, qc]);

  return { items: q.data ?? [], isLoading: q.isLoading };
}
