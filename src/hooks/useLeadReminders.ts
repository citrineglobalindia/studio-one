import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export type ReminderType = "google-meet" | "in-person" | "phone-call" | "follow-up";
export type ReminderStatus = "pending" | "completed" | "cancelled";

export interface DbLeadReminder {
  id: string;
  organization_id: string;
  lead_id: string;
  created_by: string | null;
  title: string;
  notes: string | null;
  reminder_type: ReminderType;
  scheduled_at: string;
  meeting_link: string | null;
  location: string | null;
  status: ReminderStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload shape sent by the dialog; status defaults to "pending" */
export interface NewReminderInput {
  lead_id: string;
  title: string;
  notes: string | null;
  reminder_type: ReminderType;
  scheduled_at: string;
  meeting_link: string | null;
  location: string | null;
  status?: ReminderStatus;
}

export function useLeadReminders(leadId: string | null | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["lead_reminders", leadId],
    enabled: !!leadId,
    queryFn: async () => {
      if (!leadId) return [] as DbLeadReminder[];
      const { data, error } = await supabase
        .from("lead_reminders")
        .select("*")
        .eq("lead_id", leadId)
        .order("scheduled_at", { ascending: true });
      if (error) throw error;
      return (data as DbLeadReminder[]) ?? [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (input: NewReminderInput) => {
      if (!orgId) throw new Error("No organization loaded — cannot create reminder.");
      const { data, error } = await supabase
        .from("lead_reminders")
        .insert({
          organization_id: orgId,
          lead_id: input.lead_id,
          created_by: user?.id ?? null,
          title: input.title,
          notes: input.notes,
          reminder_type: input.reminder_type,
          scheduled_at: input.scheduled_at,
          meeting_link: input.meeting_link,
          location: input.location,
          status: input.status ?? "pending",
        })
        .select()
        .single();
      if (error) throw error;
      return data as DbLeadReminder;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead_reminders", leadId] });
      toast.success("Reminder added");
    },
    onError: (e) => {
      toast.error((e as Error).message || "Failed to add reminder");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead_reminders", leadId] });
      toast.success("Reminder deleted");
    },
    onError: (e) => {
      toast.error((e as Error).message || "Failed to delete reminder");
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lead_reminders")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lead_reminders", leadId] });
      toast.success("Marked complete");
    },
    onError: (e) => {
      toast.error((e as Error).message || "Failed to update reminder");
    },
  });

  return {
    reminders: (query.data as DbLeadReminder[]) ?? [],
    isLoading: query.isLoading,
    error: query.error as Error | null,
    /** Returns a Promise — dialog awaits this. */
    addReminder: addMutation.mutateAsync,
    /** Fire-and-forget — dialog doesn't await. */
    deleteReminder: (id: string) => deleteMutation.mutate(id),
    markComplete: (id: string) => completeMutation.mutate(id),
  };
}
