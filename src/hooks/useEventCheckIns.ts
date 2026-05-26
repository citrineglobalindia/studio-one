import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DbCheckIn {
  id: string;
  organization_id: string;
  event_id: string;
  team_member_id: string | null;
  user_id: string;
  photo_url: string;
  latitude: number | null;
  longitude: number | null;
  accuracy_m: number | null;
  location_name: string | null;
  captured_at: string;
  notes: string | null;
  created_at: string;
}

export interface CheckInRow extends DbCheckIn {
  event?: { id: string; name: string | null; event_type: string | null; event_date: string | null; venue: string | null } | null;
  member?: { id: string; full_name: string | null; role: string | null } | null;
}

/** Upload a blob to storage + return the public URL */
export async function uploadCheckInPhoto(orgId: string, userId: string, blob: Blob): Promise<string> {
  const fname = `${orgId}/${userId}/${Date.now()}.jpg`;
  const { error: upErr } = await (supabase as any).storage.from("event-check-ins").upload(fname, blob, {
    contentType: "image/jpeg", upsert: false,
  });
  if (upErr) throw upErr;
  const { data } = (supabase as any).storage.from("event-check-ins").getPublicUrl(fname);
  return data.publicUrl as string;
}

/** Submit a check-in row */
export function useCheckInSubmit() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: {
      event_id: string;
      team_member_id: string | null;
      photo_blob: Blob;
      latitude: number | null;
      longitude: number | null;
      accuracy_m: number | null;
      notes?: string | null;
    }) => {
      if (!organization?.id) throw new Error("No studio");
      if (!user?.id) throw new Error("Not signed in");
      const photo_url = await uploadCheckInPhoto(organization.id, user.id, p.photo_blob);
      const { error } = await (supabase as any).from("event_check_ins").insert({
        organization_id: organization.id,
        event_id: p.event_id,
        team_member_id: p.team_member_id,
        user_id: user.id,
        photo_url,
        latitude: p.latitude,
        longitude: p.longitude,
        accuracy_m: p.accuracy_m,
        notes: p.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["check-ins"] });
      qc.invalidateQueries({ queryKey: ["event-check-ins"] });
      toast.success("Checked in!");
    },
    onError: (e: Error) => toast.error(`Check-in failed: ${e.message}`),
  });
}

/** All check-ins for the org — used on the Event Reports page (admin/admin/accounts) */
export function useAllCheckIns(filters?: { fromDate?: string; toDate?: string; eventId?: string; userId?: string }) {
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;
  return useQuery({
    queryKey: ["event-check-ins", orgId, filters?.fromDate, filters?.toDate, filters?.eventId, filters?.userId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as CheckInRow[];
      let q = (supabase as any).from("event_check_ins")
        .select(`*,
          event:events(id,name,event_type,event_date,venue),
          member:team_members(id,full_name,role)
        `)
        .eq("organization_id", orgId)
        .order("captured_at", { ascending: false });
      if (filters?.eventId) q = q.eq("event_id", filters.eventId);
      if (filters?.userId) q = q.eq("user_id", filters.userId);
      if (filters?.fromDate) q = q.gte("captured_at", filters.fromDate);
      if (filters?.toDate) q = q.lte("captured_at", filters.toDate);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as CheckInRow[];
    },
  });
}

/** Check-ins for a single event — used on the event detail card */
export function useEventCheckIns(eventId: string | undefined) {
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;
  return useQuery({
    queryKey: ["check-ins", "event", orgId, eventId],
    enabled: !!orgId && !!eventId,
    queryFn: async () => {
      if (!orgId || !eventId) return [] as CheckInRow[];
      const { data, error } = await (supabase as any).from("event_check_ins")
        .select("*, member:team_members(id,full_name,role)")
        .eq("organization_id", orgId).eq("event_id", eventId)
        .order("captured_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as CheckInRow[];
    },
  });
}
