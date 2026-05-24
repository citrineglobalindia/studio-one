import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface DbSalary {
  id: string;
  organization_id: string;
  employee_id: string;
  month: string;          // YYYY-MM-01
  base_amount: number;
  bonus_amount: number;
  deductions: number;
  net_amount: number;
  status: "draft" | "approved" | "paid";
  paid_at: string | null;
  paid_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function useSalaries(month: string) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["salaries", orgId, month],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("salaries" as any)
        .select("*")
        .eq("organization_id", orgId)
        .eq("month", month)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as DbSalary[];
    },
    enabled: !!orgId && !!month,
  });

  const upsertSalary = useMutation({
    mutationFn: async (payload: Partial<DbSalary> & { employee_id: string; month: string }) => {
      if (!orgId) throw new Error("No organization");
      const row = {
        organization_id: orgId,
        employee_id: payload.employee_id,
        month: payload.month,
        base_amount: payload.base_amount ?? 0,
        bonus_amount: payload.bonus_amount ?? 0,
        deductions: payload.deductions ?? 0,
        status: payload.status ?? "draft",
        notes: payload.notes ?? null,
      };
      const { data, error } = await supabase
        .from("salaries" as any)
        .upsert(row as any, { onConflict: "organization_id,employee_id,month" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salaries", orgId, month] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateSalary = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbSalary> & { id: string }) => {
      const { data, error } = await supabase
        .from("salaries" as any)
        .update(patch as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salaries", orgId, month] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const markPaid = useMutation({
    mutationFn: async (id: string) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("salaries" as any)
        .update({ status: "paid", paid_at: new Date().toISOString(), paid_by: u.user?.id ?? null } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salaries", orgId, month] });
      toast.success("Marked paid");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteSalary = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("salaries" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["salaries", orgId, month] });
      toast.success("Deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    salaries: query.data || [],
    isLoading: query.isLoading,
    upsertSalary,
    updateSalary,
    markPaid,
    deleteSalary,
  };
}
