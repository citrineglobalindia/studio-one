import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface DbService {
  id: string;
  organization_id: string;
  title: string;
  description: string | null;
  amount: number;
  category: string | null;
  sort_order: number | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function useServices() {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["services", orgId],
    enabled: !!orgId,
    staleTime: 30_000,
    queryFn: async () => {
      if (!orgId) return [] as DbService[];
      const { data, error } = await (supabase as any)
        .from("services")
        .select("*")
        .eq("organization_id", orgId)
        .order("sort_order", { ascending: true })
        .order("title", { ascending: true });
      if (error) throw error;
      return ((data as unknown) ?? []) as DbService[];
    },
  });

  const add = useMutation({
    mutationFn: async (payload: Partial<DbService>) => {
      if (!orgId) throw new Error("No studio");
      const { data, error } = await (supabase as any)
        .from("services")
        .insert({ ...payload, organization_id: orgId })
        .select().single();
      if (error) throw error;
      return data as DbService;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success("Service saved"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbService> & { id: string }) => {
      const { error } = await (supabase as any).from("services").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success("Service updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["services"] }); toast.success("Service removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { services: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}
