import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export type LedgerType = "income" | "expense";

export interface LedgerEntry {
  id: string;
  date: string;            // ISO date
  type: LedgerType;
  category: string;        // 'invoice' | 'expense category'
  description: string;
  reference: string;       // invoice number / expense id snippet
  amount: number;          // positive number
  client_name?: string | null;
  client_id?: string | null;
}

export function useLedger(fromIso?: string | null, toIso?: string | null) {
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;

  return useQuery({
    queryKey: ["ledger", orgId, fromIso, toIso],
    enabled: !!orgId,
    queryFn: async () => {
      if (!orgId) return [] as LedgerEntry[];
      // Pull invoices (income — only paid portion = amount_paid) and approved/paid expenses
      const invRes = await (supabase as any).from("invoices")
        .select("id, invoice_number, amount_paid, total_amount, status, created_at, due_date, client_id, client_name, client:clients(id,name,partner_name)")
        .eq("organization_id", orgId);
      if (invRes.error) throw invRes.error;

      const expRes = await (supabase as any).from("payment_requests")
        .select("id, amount, category, description, status, created_at, reviewed_at, paid_at")
        .eq("organization_id", orgId)
        .in("status", ["approved", "paid"]);
      if (expRes.error) throw expRes.error;

      const entries: LedgerEntry[] = [];

      for (const inv of (invRes.data ?? []) as any[]) {
        const paid = Number(inv.amount_paid || 0);
        if (paid <= 0) continue;
        const client = inv.client;
        const couple = client ? (client.partner_name ? `${client.name} & ${client.partner_name}` : client.name) : inv.client_name;
        entries.push({
          id: "inv-" + inv.id,
          date: inv.created_at,
          type: "income",
          category: "Invoice payment",
          description: `Invoice ${inv.invoice_number || ""}`,
          reference: inv.invoice_number || inv.id.slice(0, 8),
          amount: paid,
          client_id: inv.client_id,
          client_name: couple,
        });
      }

      for (const ex of (expRes.data ?? []) as any[]) {
        entries.push({
          id: "exp-" + ex.id,
          date: ex.paid_at || ex.reviewed_at || ex.created_at,
          type: "expense",
          category: ex.category || "Expense",
          description: ex.description || "Expense",
          reference: ex.id.slice(0, 8),
          amount: Number(ex.amount || 0),
        });
      }

      // Filter by date range if given
      let list = entries;
      if (fromIso) list = list.filter((e) => e.date >= fromIso);
      if (toIso) list = list.filter((e) => e.date <= toIso + "T23:59:59");

      list.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      return list;
    },
  });
}
