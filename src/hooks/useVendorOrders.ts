import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";
import { toast } from "sonner";

export type OrderStatus = "pending" | "confirmed" | "in_progress" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";

export interface VendorOrder {
  id: string;
  organization_id: string;
  vendor_id: string | null;
  project_id: string | null;
  client_id: string | null;
  order_number: string | null;
  item_type: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  total_amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  amount_paid: number;
  due_date: string | null;
  delivery_date: string | null;
  tracking_info: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type VendorOrderInput = Omit<
  VendorOrder,
  "id" | "organization_id" | "created_at" | "updated_at"
>;

export function useVendorOrders(vendorId?: string) {
  const { organization } = useOrg();
  const qc = useQueryClient();
  const orgId = organization?.id;

  const query = useQuery({
    queryKey: ["vendor_orders", orgId, vendorId],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from("vendor_orders")
        .select("*")
        .eq("organization_id", orgId!)
        .order("created_at", { ascending: false });
      if (vendorId) q = q.eq("vendor_id", vendorId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as VendorOrder[];
    },
  });

  const addOrder = useMutation({
    mutationFn: async (input: VendorOrderInput) => {
      if (!orgId) throw new Error("No organization");
      const { data, error } = await supabase
        .from("vendor_orders")
        .insert({ ...input, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor_orders", orgId] });
      toast.success("Order created");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateOrder = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VendorOrder> & { id: string }) => {
      const { data, error } = await supabase
        .from("vendor_orders")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor_orders", orgId] });
      toast.success("Order updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("vendor_orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vendor_orders", orgId] });
      toast.success("Order deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return {
    orders: query.data ?? [],
    isLoading: query.isLoading,
    addOrder,
    updateOrder,
    deleteOrder,
  };
}
