import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type CallDirection = "outbound" | "inbound";
export type CallOutcome =
  | "connected"
  | "no_answer"
  | "busy"
  | "voicemail"
  | "wrong_number"
  | "interested"
  | "not_interested"
  | "callback_requested"
  | "converted";

export interface CallLog {
  id: string;
  organization_id: string;
  lead_id: string | null;
  client_id: string | null;
  caller_id: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  direction: CallDirection;
  outcome: CallOutcome;
  duration_seconds: number;
  notes: string | null;
  next_action: string | null;
  next_action_date: string | null;
  called_at: string;
  created_at: string;
  updated_at: string;
}

export type CreateCallLogInput = Omit<
  CallLog,
  "id" | "organization_id" | "caller_id" | "created_at" | "updated_at"
> & {
  called_at?: string;
};

export function useCallLogs(opts?: { leadId?: string; clientId?: string }) {
  const { organization } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["call_logs", orgId, opts?.leadId, opts?.clientId],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from("call_logs")
        .select("*")
        .eq("organization_id", orgId!)
        .order("called_at", { ascending: false });
      if (opts?.leadId) q = q.eq("lead_id", opts.leadId);
      if (opts?.clientId) q = q.eq("client_id", opts.clientId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as CallLog[];
    },
  });

  const addCallLog = useMutation({
    mutationFn: async (input: CreateCallLogInput) => {
      if (!orgId) throw new Error("No organization");
      const { data, error } = await supabase
        .from("call_logs")
        .insert({
          ...input,
          organization_id: orgId,
          caller_id: user?.id ?? null,
          called_at: input.called_at ?? new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["call_logs", orgId] });
      toast.success("Call logged");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateCallLog = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CallLog> & { id: string }) => {
      const { data, error } = await supabase
        .from("call_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["call_logs", orgId] });
      toast.success("Call updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCallLog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("call_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["call_logs", orgId] });
      toast.success("Call log deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    callLogs: query.data ?? [],
    isLoading: query.isLoading,
    addCallLog,
    updateCallLog,
    deleteCallLog,
  };
}
