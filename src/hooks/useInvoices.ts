import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export interface InvoiceRow {
  id: string;
  organization_id: string;
  client_id: string | null;
  project_id: string | null;
  invoice_number: string;
  client_name: string;
  project_name: string | null;
  items: any[];
  subtotal: number;
  discount_type: string | null;
  discount_value: number | null;
  tax_percent: number | null;
  total_amount: number;
  amount_paid: number;
  status: string;
  due_date: string | null;
  payment_terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useInvoices() {
  const { currentOrg } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["invoices", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as InvoiceRow[];
    },
  });

  const createInvoice = useMutation({
    mutationFn: async (invoice: Omit<InvoiceRow, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase.from("invoices").insert(invoice).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", orgId] });
      toast.success("Invoice created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateInvoice = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<InvoiceRow> & { id: string }) => {
      const { error } = await supabase.from("invoices").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["invoices", orgId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const deleteInvoice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("invoices").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices", orgId] });
      toast.success("Invoice deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { invoices: query.data ?? [], isLoading: query.isLoading, createInvoice, updateInvoice, deleteInvoice };
}
