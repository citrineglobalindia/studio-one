import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface DbEvent {
  id: string;
  organization_id: string;
  client_id: string | null;
  project_id: string | null;
  name: string;
  event_type: string | null;
  event_date: string;           // ISO date 'YYYY-MM-DD'
  start_time: string | null;    // 'HH:MM:SS' or null
  end_time: string | null;
  venue: string | null;
  notes: string | null;
  status: "upcoming" | "in-progress" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export type NewEventInput = Omit<DbEvent, "id" | "organization_id" | "created_at" | "updated_at">;

export function useEvents() {
  const qc = useQueryClient();
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["events", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as DbEvent[];
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("organization_id", orgId)
        .order("event_date", { ascending: true });
      if (error) throw error;
      return (data as DbEvent[]) ?? [];
    },
  });

  const addEvent = useMutation({
    mutationFn: async (input: NewEventInput) => {
      if (!orgId) throw new Error("No studio loaded — please log out and log in again");
      const { data, error } = await supabase
        .from("events")
        .insert({ ...input, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data as DbEvent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", orgId] });
      toast.success("Event added");
    },
    onError: (e) => {
      const msg = (e as Error).message || "Failed to add event";
      if (msg.toLowerCase().includes("row-level security") || msg.toLowerCase().includes("violates")) {
        toast.error("Your session is out of sync. Log out and log back in.");
      } else {
        toast.error(msg);
      }
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbEvent> & { id: string }) => {
      const { data, error } = await supabase
        .from("events")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as DbEvent;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", orgId] });
      toast.success("Event updated");
    },
    onError: (e) => toast.error((e as Error).message || "Failed to update event"),
  });

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", orgId] });
      toast.success("Event deleted");
    },
    onError: (e) => toast.error((e as Error).message || "Failed to delete event"),
  });

  return {
    events: (query.data as DbEvent[]) ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    addEvent,
    updateEvent,
    deleteEvent,
  };
}
