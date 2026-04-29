import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type PaymentStatus = "pending" | "approved" | "rejected" | "paid" | "cancelled";

export interface PaymentRequest {
  id: string;
  organization_id: string;
  requested_by: string;
  team_member_id: string | null;
  deliverable_id: string | null;
  project_id: string | null;
  amount: number;
  currency: string;
  description: string;
  payment_method: string | null;
  payment_account: string | null;
  status: PaymentStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  paid_at: string | null;
  paid_reference: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentRequestInput = Omit<
  PaymentRequest,
  "id" | "organization_id" | "requested_by" | "status" | "admin_notes" | "reviewed_by" | "reviewed_at" | "paid_at" | "paid_reference" | "created_at" | "updated_at"
>;

/**
 * Returns either:
 * - All payment requests in the org (admin view), or
 * - Only the current user's requests (employee view), depending on `mineOnly`.
 */
export function usePaymentRequests(opts?: { mineOnly?: boolean }) {
  const { organization } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["payment_requests", orgId, opts?.mineOnly, user?.id],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from("payment_requests")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (opts?.mineOnly && user?.id) q = q.eq("requested_by", user.id);
      const { data, error } = await q;
      if (error) throw error;
      return ((data || []) as any) as PaymentRequest[];
    },
  });

  const createRequest = useMutation({
    mutationFn: async (input: PaymentRequestInput) => {
      if (!orgId || !user?.id) throw new Error("Missing context");
      const { data, error } = await supabase
        .from("payment_requests")
        .insert({
          ...input,
          organization_id: orgId,
          requested_by: user.id,
          status: "pending",
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_requests", orgId] });
      toast.success("Payment request submitted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateRequest = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PaymentRequest> & { id: string }) => {
      const { data, error } = await supabase
        .from("payment_requests")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payment_requests", orgId] }),
    onError: (e: Error) => toast.error(e.message),
  });

  /** Admin action: approve a request (and optionally mark paid in the same call). */
  const approve = useMutation({
    mutationFn: async ({ id, notes, markPaid, reference }: { id: string; notes?: string; markPaid?: boolean; reference?: string }) => {
      const updates: any = {
        status: markPaid ? "paid" : "approved",
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
      };
      if (notes) updates.admin_notes = notes;
      if (markPaid) {
        updates.paid_at = new Date().toISOString();
        if (reference) updates.paid_reference = reference;
      }
      const { error } = await supabase.from("payment_requests").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["payment_requests", orgId] });
      toast.success(vars.markPaid ? "Marked as paid" : "Request approved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("payment_requests")
        .update({
          status: "rejected",
          admin_notes: notes,
          reviewed_by: user?.id ?? null,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_requests", orgId] });
      toast.success("Request rejected");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const cancelRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("payment_requests")
        .update({ status: "cancelled" } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["payment_requests", orgId] });
      toast.success("Request cancelled");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    requests: query.data ?? [],
    isLoading: query.isLoading,
    createRequest,
    updateRequest,
    approve,
    reject,
    cancelRequest,
  };
}
