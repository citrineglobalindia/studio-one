import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export type ReminderType = "google-meet" | "in-person" | "phone-call" | "follow-up";
export type ReminderStatus = "pending" | "completed" | "cancelled";

export interface DbLeadReminder {
  id: string;
  organization_id: string;
  lead_id: string;
  title: string;
  notes: string | null;
  reminder_type: ReminderType;
  scheduled_at: string;
  meeting_link: string | null;
  location: string | null;
  status: ReminderStatus;
  created_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useLeadReminders(leadId?: string) {
  const { organization } = useOrg();
  const orgId = organization?.id;
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["lead_reminders", orgId, leadId ?? "all"],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase
        .from("lead_reminders")
        .select("*")
        .eq("organization_id", orgId)
        .order("scheduled_at", { ascending: true });
      if (leadId) q = q.eq("lead_id", leadId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as DbLeadReminder[];
    },
    enabled: !!orgId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["lead_reminders", orgId] });

  const addReminder = useMutation({
    mutationFn: async (
      r: Omit<DbLeadReminder, "id" | "created_at" | "updated_at" | "organization_id" | "completed_at" | "created_by"> & {
        created_by?: string | null;
      },
    ) => {
      if (!orgId) throw new Error("No organization");
      const { data, error } = await supabase
        .from("lead_reminders")
        .insert({ ...r, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Reminder added");
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  }).mutateAsync;

  const updateReminder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbLeadReminder> & { id: string }) => {
      const { data, error } = await supabase
        .from("lead_reminders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Reminder updated");
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  }).mutateAsync;

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lead_reminders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Reminder deleted");
    },
    onError: (e: Error) => toast.error(`Failed: ${e.message}`),
  }).mutateAsync;

  const markComplete = (id: string) =>
    updateReminder({ id, status: "completed", completed_at: new Date().toISOString() });

  return {
    reminders: query.data ?? [],
    isLoading: query.isLoading,
    addReminder,
    updateReminder,
    deleteReminder,
    markComplete,
  };
}
