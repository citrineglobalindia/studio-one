import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type DeliverableStatus = "pending" | "in_progress" | "review" | "approved" | "delivered";
export type DeliverablePriority = "low" | "medium" | "high" | "urgent";

export interface DeliverableDB {
  id: string;
  organization_id: string;
  project_id: string;
  event_id: string | null;
  client_id: string | null;
  deliverable_type: string;
  title: string | null;
  status: string;
  assigned_to: string | null;
  due_date: string | null;
  delivered_date: string | null;
  priority: string | null;
  notes: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
}

export function useDeliverables(opts?: { projectId?: string; eventId?: string }) {
  const { organization } = useOrg();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["deliverables", orgId, opts?.projectId, opts?.eventId],
    queryFn: async () => {
      if (!orgId) return [];
      let q = supabase.from("deliverables").select("*").eq("organization_id", orgId);
      if (opts?.projectId) q = q.eq("project_id", opts.projectId);
      if (opts?.eventId) q = q.eq("event_id", opts.eventId);
      const { data, error } = await q.order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return ((data || []) as any) as DeliverableDB[];
    },
    enabled: !!orgId,
  });

  const addDeliverable = useMutation({
    mutationFn: async (d: Omit<DeliverableDB, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("deliverables").insert(d as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables", orgId] });
      toast.success("Deliverable added!");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const updateDeliverable = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DeliverableDB> & { id: string }) => {
      const payload: any = { ...updates };
      // Auto-set delivered_date when marking delivered, if not provided
      if (updates.status === "delivered" && !updates.delivered_date) {
        payload.delivered_date = new Date().toISOString().slice(0, 10);
      }
      // Auto-bump progress to 100 on delivered/approved
      if ((updates.status === "delivered" || updates.status === "approved") && updates.progress === undefined) {
        payload.progress = 100;
      }
      const { data, error } = await supabase
        .from("deliverables")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables", orgId] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const deleteDeliverable = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deliverables").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deliverables", orgId] });
      toast.success("Deliverable deleted");
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return {
    deliverables: query.data || [],
    data: query.data || [],
    isLoading: query.isLoading,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
  };
}

/**
 * Variant: only deliverables assigned to the currently logged-in user
 * (looked up via team_members.user_id → team_members.id → deliverables.assigned_to).
 */
export function useMyDeliverables() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const orgId = organization?.id;

  const teamMember = useQuery({
    queryKey: ["my_team_member", orgId, user?.id],
    enabled: !!orgId && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, full_name, role")
        .eq("organization_id", orgId!)
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const teamMemberId = teamMember.data?.id ?? null;

  const query = useQuery({
    queryKey: ["my_deliverables", orgId, teamMemberId],
    enabled: !!orgId && !!teamMemberId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("deliverables")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("assigned_to", teamMemberId!)
        .order("due_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return ((data || []) as any) as DeliverableDB[];
    },
  });

  return {
    deliverables: query.data || [],
    teamMember: teamMember.data,
    teamMemberId,
    isLoading: teamMember.isLoading || query.isLoading,
  };
}
