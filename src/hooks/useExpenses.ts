import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { toast } from "sonner";

export type ExpenseStatus = "pending" | "approved" | "rejected" | "paid";

export interface DbExpense {
  id: string;
  organization_id: string;
  requested_by: string | null;
  team_member_id: string | null;
  event_id: string | null;
  project_id: string | null;
  amount: number;
  currency: string | null;
  category: string | null;
  description: string | null;
  payment_method: string | null;
  payment_account: string | null;
  receipt_url: string | null;
  status: ExpenseStatus | string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  paid_at: string | null;
  paid_reference: string | null;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES = [
  "Travel", "Equipment", "Refreshments", "Vendor Payment",
  "Software", "Marketing", "Office", "Repairs", "Other",
];

export function useExpenses() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const { currentRole } = useRole();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;
  const canApprove = currentRole === "admin" || currentRole === "administrator" || currentRole === "accounts";

  const query = useQuery({
    queryKey: ["expenses", orgId, currentRole, user?.id],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as DbExpense[];
      const { data, error } = await (supabase as any)
        .from("payment_requests")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as unknown) ?? []) as DbExpense[];
    },
  });

  const add = useMutation({
    mutationFn: async (payload: Partial<DbExpense>) => {
      if (!orgId) throw new Error("No studio loaded");
      const { data, error } = await (supabase as any)
        .from("payment_requests")
        .insert({
          ...payload,
          organization_id: orgId,
          status: payload.status ?? "pending",
          currency: payload.currency ?? "INR",
        })
        .select().single();
      if (error) throw error;
      return data as DbExpense;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", orgId] });
      qc.invalidateQueries({ queryKey: ["ledger", orgId] });
      toast.success("Expense raised");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbExpense> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from("payment_requests")
        .update(patch as any)
        .eq("id", id)
        .select().single();
      if (error) throw error;
      return data as DbExpense;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", orgId] });
      qc.invalidateQueries({ queryKey: ["ledger", orgId] });
      toast.success("Expense updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("payment_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", orgId] });
      qc.invalidateQueries({ queryKey: ["ledger", orgId] });
      toast.success("Expense deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const approve = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { error } = await (supabase as any).from("payment_requests").update({
        status: "approved",
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes ?? null,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", orgId] });
      qc.invalidateQueries({ queryKey: ["ledger", orgId] });
      toast.success("Expense approved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const reject = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { error } = await (supabase as any).from("payment_requests").update({
        status: "rejected",
        reviewed_by: user?.id ?? null,
        reviewed_at: new Date().toISOString(),
        admin_notes: notes ?? null,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", orgId] });
      qc.invalidateQueries({ queryKey: ["ledger", orgId] });
      toast.success("Expense rejected");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: async ({ id, reference }: { id: string; reference?: string }) => {
      const { error } = await (supabase as any).from("payment_requests").update({
        status: "paid",
        paid_at: new Date().toISOString(),
        paid_reference: reference ?? null,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses", orgId] });
      qc.invalidateQueries({ queryKey: ["ledger", orgId] });
      toast.success("Marked paid");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    expenses: query.data ?? [],
    isLoading: query.isLoading,
    canApprove,
    add, update, remove, approve, reject, markPaid,
  };
}
