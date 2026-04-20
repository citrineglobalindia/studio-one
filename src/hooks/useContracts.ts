import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ContractStatus = "draft" | "sent" | "viewed" | "signed" | "expired" | "cancelled";

export interface ContractRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  project_id: string | null;
  contract_number: string | null;
  title: string;
  client_name: string;
  event_type: string | null;
  event_date: string | null;
  contract_amount: number;
  status: ContractStatus;
  sent_at: string | null;
  viewed_at: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
  valid_until: string | null;
  body: string | null;
  terms: string | null;
  clauses: { id: string; title: string; content: string }[];
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type ContractInput = Omit<ContractRow, "id" | "organization_id" | "created_by" | "created_at" | "updated_at">;

export function useContracts() {
  const { organization } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["contracts", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as ContractRow[];
    },
  });

  const addContract = useMutation({
    mutationFn: async (input: Partial<ContractInput> & { title: string; client_name: string }) => {
      if (!orgId) throw new Error("No organization");
      const { data, error } = await supabase
        .from("contracts")
        .insert({ ...input, organization_id: orgId, created_by: user?.id ?? null } as any)
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts", orgId] }); toast.success("Contract created"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateContract = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContractRow> & { id: string }) => {
      const { data, error } = await supabase.from("contracts").update(updates as any).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts", orgId] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteContract = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["contracts", orgId] }); toast.success("Contract deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    contracts: query.data ?? [],
    isLoading: query.isLoading,
    addContract, updateContract, deleteContract,
  };
}
