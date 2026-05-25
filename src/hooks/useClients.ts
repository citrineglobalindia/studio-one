import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface DbClient {
  id: string;
  organization_id: string;
  name: string;
  partner_name: string | null;
  email: string | null;
  phone: string | null;
  partner_email: string | null;
  partner_phone: string | null;
  address: string | null;
  city: string | null;
  source: string | null;
  status: string | null;
  budget: number | null;
  notes: string | null;
  date_of_birth: string | null;
  partner_date_of_birth: string | null;
  engagement_date: string | null;
  marriage_date: string | null;
  event_date: string | null;
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  venue_pincode: string | null;
  venue_contact_person: string | null;
  venue_contact_phone: string | null;
  venue_landmark: string | null;
  venue_map_url: string | null;
  venue_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useClients() {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["clients", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as DbClient[];
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as unknown) ?? []) as DbClient[];
    },
  });

  const addClient = useMutation({
    mutationFn: async (payload: Partial<DbClient>) => {
      if (!orgId) throw new Error("No studio loaded — please log out and back in");
      const { data, error } = await supabase
        .from("clients")
        .insert({ ...(payload as any), organization_id: orgId } as any)
        .select()
        .single();
      if (error) throw error;
      return (data as unknown) as DbClient;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", orgId] });
      toast.success("Client saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateClient = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbClient> & { id: string }) => {
      const { data, error } = await supabase
        .from("clients")
        .update(patch as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return (data as unknown) as DbClient;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", orgId] });
      toast.success("Client updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clients", orgId] });
      toast.success("Client deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    clients: query.data ?? [],
    isLoading: query.isLoading,
    addClient,
    updateClient,
    deleteClient,
  };
}
