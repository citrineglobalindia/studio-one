import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface EventCheckIn {
  id: string;
  organization_id: string;
  event_id: string;
  team_member_id: string;
  user_id: string | null;
  status: string;
  arrival_time: string | null;
  arrival_photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EventActivity {
  id: string;
  organization_id: string;
  event_id: string;
  team_member_id: string | null;
  user_id: string | null;
  actor_name: string | null;
  activity_type: "status" | "photo" | "note" | string;
  status: string | null;
  photo_url: string | null;
  note: string | null;
  created_at: string;
}

export function useEventCheckIns(eventId?: string) {
  const qc = useQueryClient();
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;

  const checkIns = useQuery({
    queryKey: ["event_check_ins", orgId, eventId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as EventCheckIn[];
      let q = supabase.from("event_check_ins").select("*").eq("organization_id", orgId);
      if (eventId) q = q.eq("event_id", eventId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EventCheckIn[];
    },
  });

  const activity = useQuery({
    queryKey: ["event_activity", orgId, eventId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as EventActivity[];
      let q = supabase
        .from("event_activity")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (eventId) q = q.eq("event_id", eventId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as EventActivity[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!orgId) return;
    const channel = supabase
      .channel(`live-events-${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_check_ins", filter: `organization_id=eq.${orgId}` },
        () => qc.invalidateQueries({ queryKey: ["event_check_ins", orgId] }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "event_activity", filter: `organization_id=eq.${orgId}` },
        () => qc.invalidateQueries({ queryKey: ["event_activity", orgId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, qc]);

  const upsertCheckIn = useMutation({
    mutationFn: async (payload: {
      eventId: string;
      teamMemberId: string;
      status: string;
      arrivalPhotoUrl?: string | null;
      arrivalTime?: string | null;
    }) => {
      if (!orgId) throw new Error("No studio loaded");
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id ?? null;

      const row = {
        organization_id: orgId,
        event_id: payload.eventId,
        team_member_id: payload.teamMemberId,
        user_id: userId,
        status: payload.status,
        arrival_time: payload.arrivalTime ?? null,
        arrival_photo_url: payload.arrivalPhotoUrl ?? null,
      };

      const { data, error } = await supabase
        .from("event_check_ins")
        .upsert(row, { onConflict: "event_id,team_member_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onError: (e) => toast.error((e as Error).message || "Failed to update status"),
  });

  const logActivity = useMutation({
    mutationFn: async (payload: {
      eventId: string;
      teamMemberId?: string | null;
      activityType: "status" | "photo" | "note";
      status?: string | null;
      photoUrl?: string | null;
      note?: string | null;
      actorName?: string | null;
    }) => {
      if (!orgId) throw new Error("No studio loaded");
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id ?? null;

      const { error } = await supabase.from("event_activity").insert({
        organization_id: orgId,
        event_id: payload.eventId,
        team_member_id: payload.teamMemberId ?? null,
        user_id: userId,
        actor_name: payload.actorName ?? null,
        activity_type: payload.activityType,
        status: payload.status ?? null,
        photo_url: payload.photoUrl ?? null,
        note: payload.note ?? null,
      });
      if (error) throw error;
    },
  });

  return {
    checkIns: checkIns.data ?? [],
    activity: activity.data ?? [],
    isLoading: checkIns.isLoading || activity.isLoading,
    upsertCheckIn,
    logActivity,
  };
}
