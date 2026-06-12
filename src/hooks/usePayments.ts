import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export const PAYMENT_METHODS = ["cash", "upi", "bank", "card", "cheque", "other"] as const;
export type PaymentMethod = typeof PAYMENT_METHODS[number];

export interface DbPayment {
  id: string;
  organization_id: string;
  invoice_id: string;
  client_id: string | null;
  amount: number;
  paid_on: string;
  method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

export interface InvoiceWithBalance {
  id: string;
  invoice_number: string | null;
  client_id: string | null;
  client_name: string | null;
  total_amount: number;
  amount_paid: number;
  balance: number;
  status: string | null;
  due_date: string | null;
  created_at: string;
  client?: { id: string; name: string; partner_name: string | null; phone: string | null } | null;
}

/** All invoices with computed balance + org payment summary */
export function usePaymentTracking() {
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["payment-tracking", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return { invoices: [] as InvoiceWithBalance[], totalBilled: 0, totalReceived: 0, totalBalance: 0 };
      const { data, error } = await (supabase as any)
        .from("invoices")
        .select("id,invoice_number,client_id,client_name,total_amount,amount_paid,status,due_date,created_at, client:clients(id,name,partner_name,phone)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const invoices: InvoiceWithBalance[] = (data ?? []).map((i: any) => ({
        ...i,
        total_amount: Number(i.total_amount || 0),
        amount_paid: Number(i.amount_paid || 0),
        balance: Math.max(0, Number(i.total_amount || 0) - Number(i.amount_paid || 0)),
      }));
      const totalBilled = invoices.reduce((s, i) => s + i.total_amount, 0);
      const totalReceived = invoices.reduce((s, i) => s + i.amount_paid, 0);
      const totalBalance = invoices.reduce((s, i) => s + i.balance, 0);
      return { invoices, totalBilled, totalReceived, totalBalance };
    },
  });

  return {
    invoices: query.data?.invoices ?? [],
    totalBilled: query.data?.totalBilled ?? 0,
    totalReceived: query.data?.totalReceived ?? 0,
    totalBalance: query.data?.totalBalance ?? 0,
    isLoading: query.isLoading,
  };
}

/** Payment history for a single invoice + record/delete */
export function useInvoicePayments(invoiceId: string | undefined) {
  const { organization } = useOrg();
  const { user } = useAuth();
  const qc = useQueryClient();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["invoice-payments", invoiceId],
    enabled: !!invoiceId,
    queryFn: async () => {
      if (!invoiceId) return [] as DbPayment[];
      const { data, error } = await (supabase as any)
        .from("payments").select("*").eq("invoice_id", invoiceId).order("paid_on", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DbPayment[];
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["invoice-payments", invoiceId] });
    qc.invalidateQueries({ queryKey: ["payment-tracking"] });
    qc.invalidateQueries({ queryKey: ["all-invoices"] });
    qc.invalidateQueries({ queryKey: ["ledger"] });
  };

  const record = useMutation({
    mutationFn: async (p: { amount: number; paid_on: string; method: PaymentMethod; reference?: string; notes?: string; client_id?: string | null }) => {
      if (!orgId || !invoiceId) throw new Error("Missing context");
      const { error } = await (supabase as any).from("payments").insert({
        organization_id: orgId, invoice_id: invoiceId, client_id: p.client_id ?? null,
        amount: p.amount, paid_on: p.paid_on, method: p.method,
        reference: p.reference || null, notes: p.notes || null, recorded_by: user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Payment recorded"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("payments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Payment removed"); },
    onError: (e: Error) => toast.error(e.message),
  });

  return { payments: query.data ?? [], isLoading: query.isLoading, record, remove };
}
