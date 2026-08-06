import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export type EventStatus = "upcoming" | "in-progress" | "completed" | "cancelled";

export interface DbEvent {
  id: string;
  organization_id: string;
  client_id: string | null;
  project_id: string | null;
  name: string | null;
  event_type: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  venue_map_url: string | null;
  notes: string | null;
  status: EventStatus | string | null;
  display_order: number | null;
  requirements: string[] | null;
  requirement_qty: Record<string, number> | null;
  is_finalized: boolean;
  finalized_at: string | null;
  finalized_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientEvents(clientId: string | undefined) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["client-events", orgId, clientId],
    enabled: !!orgId && !!clientId,
    queryFn: async () => {
      if (!orgId || !clientId) return [] as DbEvent[];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organization_id", orgId)
        .eq("client_id", clientId)
        .order("display_order", { ascending: true, nullsFirst: false })
        .order("event_date", { ascending: true });
      if (error) throw error;
      return ((data as unknown) ?? []) as DbEvent[];
    },
  });

  const events = query.data ?? [];

  const addEvent = useMutation({
    mutationFn: async (payload: Partial<DbEvent>) => {
      if (!orgId || !clientId) throw new Error("Missing studio or client");
      // Append at the end of the list
      const nextOrder = (events.reduce((m, e) => Math.max(m, e.display_order ?? 0), 0)) + 1;
      const row = {
        ...(payload as any),
        organization_id: orgId,
        client_id: clientId,
        display_order: payload.display_order ?? nextOrder,
        name: payload.name || payload.event_type || "Event",
        status: payload.status || "upcoming",
      };
      const { data, error } = await supabase.from("events").insert(row as any).select().single();
      if (error) throw error;
      return (data as unknown) as DbEvent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-events", orgId, clientId] });
      toast.success("Event added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("events")
        .update(patch as any)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Couldn't update this event — you may not have permission.");
      return (data as unknown) as DbEvent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-events", orgId, clientId] });
      toast.success("Event updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-events", orgId, clientId] });
      toast.success("Event deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const finalizeEvent = useMutation({
    mutationFn: async ({ id, finalize }: { id: string; finalize: boolean }) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("events")
        .update({
          is_finalized: finalize,
          finalized_at: finalize ? new Date().toISOString() : null,
          finalized_by: finalize ? (u.user?.id ?? null) : null,
        } as any)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Couldn't update this event — you may not have permission.");
      return (data as unknown) as DbEvent;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["client-events", orgId, clientId] });
      toast.success(vars.finalize ? "Event finalized — ready to assign team" : "Event reopened");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Swap display_order of two events (used by Up/Down arrows)
  const swapOrder = useMutation({
    mutationFn: async ({ a, b }: { a: DbEvent; b: DbEvent }) => {
      const orderA = a.display_order ?? 0;
      const orderB = b.display_order ?? 0;
      // Use a temporary -1 to avoid the unique-ish constraint on (client_id, display_order)
      // (No unique index defined right now, but be defensive.)
      const { error: e1 } = await supabase.from("events").update({ display_order: -1 } as any).eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await supabase.from("events").update({ display_order: orderA } as any).eq("id", b.id);
      if (e2) throw e2;
      const { error: e3 } = await supabase.from("events").update({ display_order: orderB } as any).eq("id", a.id);
      if (e3) throw e3;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client-events", orgId, clientId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    events,
    isLoading: query.isLoading,
    addEvent,
    updateEvent,
    deleteEvent,
    swapOrder,
    finalizeEvent,
  };
}
