import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface EmployeeDB {
  id: string;
  organization_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  role: string;
  department: string | null;
  type: string;
  status: string;
  join_date: string | null;
  salary: number | null;
  aadhaar: string | null;
  pan: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_ifsc: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useEmployees() {
  const { organization } = useOrg();
  const queryClient = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["employees", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EmployeeDB[];
    },
    enabled: !!orgId,
  });

  const addEmployee = useMutation({
    mutationFn: async (emp: Omit<EmployeeDB, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("employees").insert(emp).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", orgId] });
      toast.success("Employee added!");
    },
    onError: (e) => toast.error(e.message),
  });

  const updateEmployee = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<EmployeeDB> & { id: string }) => {
      const { data, error } = await supabase.from("employees").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", orgId] });
      toast.success("Employee updated!");
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteEmployee = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("employees").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees", orgId] });
      toast.success("Employee removed!");
    },
    onError: (e) => toast.error(e.message),
  });

  return { employees: query.data || [], isLoading: query.isLoading, addEmployee, updateEmployee, deleteEmployee };
}
