import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "converted", "lost"];

export const LEAD_SOURCES = ["Instagram", "Facebook", "WhatsApp", "Website", "Referral", "Google", "Walk-in", "Other"];

export interface DbLead {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  event_type: string | null;
  event_date: string | null;
  city: string | null;
  budget: number | null;
  status: LeadStatus | string;
  assigned_to: string | null;
  assigned_user_id: string | null;
  follow_up_date: string | null;
  notes: string | null;
  converted_client_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useLeads() {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["leads", orgId],
    enabled: !!orgId,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
    queryFn: async () => {
      if (!orgId) return [] as DbLead[];
      const { data, error } = await (supabase as any)
        .from("leads")
        .select("*")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as unknown) ?? []) as DbLead[];
    },
  });

  const add = useMutation({
    mutationFn: async (payload: Partial<DbLead>) => {
      if (!orgId) throw new Error("No studio");
      const { data, error } = await (supabase as any)
        .from("leads")
        .insert({ ...payload, organization_id: orgId, status: payload.status ?? "new" })
        .select().single();
      if (error) throw error;
      return data as DbLead;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success("Lead added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbLead> & { id: string }) => {
      const { error } = await (supabase as any).from("leads").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success("Lead updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success("Lead removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: LeadStatus }) => {
      const { error } = await (supabase as any).from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["leads"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const bulkImport = useMutation({
    mutationFn: async (rows: Partial<DbLead>[]) => {
      if (!orgId) throw new Error("No studio");
      const prepared = rows.map((r) => ({
        ...r, organization_id: orgId, status: r.status ?? "new",
      }));
      const { data, error } = await (supabase as any).from("leads").insert(prepared).select();
      if (error) throw error;
      return data?.length ?? 0;
    },
    onSuccess: (n) => { qc.invalidateQueries({ queryKey: ["leads"] }); toast.success(`Imported ${n} leads`); },
    onError: (e: Error) => toast.error(e.message),
  });

  // Convert lead → client (creates a client row, marks lead converted)
  const convertToClient = useMutation({
    mutationFn: async (lead: DbLead) => {
      if (!orgId) throw new Error("No studio");
      const { data: created, error: e1 } = await (supabase as any).from("clients").insert({
        organization_id: orgId,
        name: lead.name,
        phone: lead.phone,
        email: lead.email,
        city: lead.city,
        source: lead.source,
        event_date: lead.event_date,
        notes: lead.notes,
        status: "active",
      }).select().single();
      if (e1) throw e1;
      const { error: e2 } = await (supabase as any).from("leads").update({
        status: "converted", converted_client_id: created.id,
      }).eq("id", lead.id);
      if (e2) throw e2;
      return created;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["clients"] });
      toast.success("Lead converted to client");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    leads: query.data ?? [],
    isLoading: query.isLoading,
    add, update, remove, setStatus, bulkImport, convertToClient,
  };
}
