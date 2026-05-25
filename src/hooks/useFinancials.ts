import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

// ───── Shared line item shape (jsonb in DB) ─────
export interface LineItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

// ───── Quotations (Estimations) ─────
export interface DbQuotation {
  event_id: string | null;
  gst_applicable: boolean | null;
  id: string;
  organization_id: string;
  client_id: string | null;
  quotation_number: string | null;
  client_name: string | null;
  project_name: string | null;
  items: LineItem[] | null;
  subtotal: number | null;
  discount_type: string | null;
  discount_value: number | null;
  tax_percent: number | null;
  total_amount: number | null;
  status: string | null;
  valid_until: string | null;
  terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientQuotations(clientId: string | undefined) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["client-quotations", orgId, clientId],
    enabled: !!orgId && !!clientId,
    queryFn: async () => {
      if (!orgId || !clientId) return [] as DbQuotation[];
      const { data, error } = await (supabase as any)
        .from("quotations").select("*")
        .eq("organization_id", orgId).eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbQuotation[];
    },
  });

  const add = useMutation({
    mutationFn: async (payload: Partial<DbQuotation>) => {
      if (!orgId || !clientId) throw new Error("Missing studio or client");
      const { data, error } = await (supabase as any).from("quotations").insert({
        ...payload, organization_id: orgId, client_id: clientId,
      }).select().single();
      if (error) throw error;
      return data as DbQuotation;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-quotations", orgId, clientId] }); toast.success("Estimation added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbQuotation> & { id: string }) => {
      const { data, error } = await (supabase as any).from("quotations").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as DbQuotation;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-quotations", orgId, clientId] }); toast.success("Estimation updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("quotations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-quotations", orgId, clientId] }); toast.success("Estimation deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { quotations: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}

// ───── Contracts (Proposals) ─────
export interface DbContract {
  event_id: string | null;
  gst_applicable: boolean | null;
  id: string;
  organization_id: string;
  client_id: string | null;
  contract_number: string | null;
  title: string | null;
  client_name: string | null;
  event_type: string | null;
  event_date: string | null;
  contract_amount: number | null;
  status: string | null;
  valid_until: string | null;
  body: string | null;
  terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientContracts(clientId: string | undefined) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["client-contracts", orgId, clientId],
    enabled: !!orgId && !!clientId,
    queryFn: async () => {
      if (!orgId || !clientId) return [] as DbContract[];
      const { data, error } = await (supabase as any)
        .from("contracts").select("*")
        .eq("organization_id", orgId).eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbContract[];
    },
  });

  const add = useMutation({
    mutationFn: async (payload: Partial<DbContract>) => {
      if (!orgId || !clientId) throw new Error("Missing studio or client");
      const { data, error } = await (supabase as any).from("contracts").insert({
        ...payload, organization_id: orgId, client_id: clientId,
      }).select().single();
      if (error) throw error;
      return data as DbContract;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-contracts", orgId, clientId] }); toast.success("Proposal added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbContract> & { id: string }) => {
      const { data, error } = await (supabase as any).from("contracts").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as DbContract;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-contracts", orgId, clientId] }); toast.success("Proposal updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("contracts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-contracts", orgId, clientId] }); toast.success("Proposal deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { contracts: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}

// ───── Invoices ─────
export interface DbInvoice {
  event_id: string | null;
  gst_applicable: boolean | null;
  id: string;
  organization_id: string;
  client_id: string | null;
  invoice_number: string | null;
  client_name: string | null;
  project_name: string | null;
  items: LineItem[] | null;
  subtotal: number | null;
  discount_type: string | null;
  discount_value: number | null;
  tax_percent: number | null;
  total_amount: number | null;
  amount_paid: number | null;
  status: string | null;
  due_date: string | null;
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useClientInvoices(clientId: string | undefined) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["client-invoices", orgId, clientId],
    enabled: !!orgId && !!clientId,
    queryFn: async () => {
      if (!orgId || !clientId) return [] as DbInvoice[];
      const { data, error } = await (supabase as any)
        .from("invoices").select("*")
        .eq("organization_id", orgId).eq("client_id", clientId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbInvoice[];
    },
  });

  const add = useMutation({
    mutationFn: async (payload: Partial<DbInvoice>) => {
      if (!orgId || !clientId) throw new Error("Missing studio or client");
      const { data, error } = await (supabase as any).from("invoices").insert({
        ...payload, organization_id: orgId, client_id: clientId,
      }).select().single();
      if (error) throw error;
      return data as DbInvoice;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-invoices", orgId, clientId] }); toast.success("Invoice added"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<DbInvoice> & { id: string }) => {
      const { data, error } = await (supabase as any).from("invoices").update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data as DbInvoice;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-invoices", orgId, clientId] }); toast.success("Invoice updated"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["client-invoices", orgId, clientId] }); toast.success("Invoice deleted"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { invoices: query.data ?? [], isLoading: query.isLoading, add, update, remove };
}
