import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface LeaveDB {
  id: string;
  organization_id: string;
  employee_id: string;
  employee_name: string;
  leave_type: string;
  from_date: string;
  to_date: string;
  days: number;
  reason: string | null;
  status: string;
  applied_on: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useLeaves() {
  const { organization } = useOrg();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["leaves", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("leaves")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as LeaveDB[];
    },
    enabled: !!orgId,
  });

  const addLeave = useMutation({
    mutationFn: async (leave: Omit<LeaveDB, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("leaves").insert(leave).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves", orgId] });
      toast.success("Leave applied!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateLeave = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<LeaveDB> & { id: string }) => {
      const { data, error } = await supabase.from("leaves").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves", orgId] });
      toast.success("Leave updated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteLeave = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leaves").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves", orgId] });
    },
    onError: (e) => toast.error(e.message),
  });

  return { leaves: query.data || [], isLoading: query.isLoading, addLeave, updateLeave, deleteLeave };
}
