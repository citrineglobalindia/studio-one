import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrg } from "@/contexts/OrgContext";

export interface ClientPnlRow {
  client_id: string;
  client_name: string;
  billed: number;       // sum of invoice total_amount
  collected: number;    // sum of invoice amount_paid
  outstanding: number;  // billed - collected (>=0)
  expenses: number;     // approved/paid expenses attributed to this client (via event_id)
  net: number;          // collected - expenses
  margin: number;       // net / collected (%) — 0 when no revenue
  invoices: number;     // invoice count
}

// Statuses that represent a real, payable cost (not pending/rejected).
const COST_STATUSES = new Set(["approved", "paid"]);
// Invoice statuses excluded from revenue roll-ups.
const DEAD_INVOICE_STATUSES = new Set(["cancelled", "void", "voided", "draft"]);

export function useClientPnl() {
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;

  const query = useQuery({
    queryKey: ["client-pnl", orgId],
    enabled: !!orgId,
    refetchOnWindowFocus: true,
    staleTime: 10_000,
    queryFn: async () => {
      if (!orgId) return { rows: [] as ClientPnlRow[], totals: { billed: 0, collected: 0, outstanding: 0, expenses: 0, net: 0 } };

      // 1) Invoices → revenue per client
      const invRes = await (supabase as any)
        .from("invoices")
        .select("id, client_id, total_amount, amount_paid, status, client:clients(id,name,partner_name)")
        .eq("organization_id", orgId);
      if (invRes.error) throw invRes.error;
      const invoices = (invRes.data ?? []) as any[];

      // 2) Events → map event_id to client_id (to attribute expenses)
      const evRes = await (supabase as any)
        .from("events").select("id, client_id").eq("organization_id", orgId);
      if (evRes.error) throw evRes.error;
      const eventToClient = new Map<string, string>();
      for (const e of evRes.data ?? []) if (e.client_id) eventToClient.set(e.id, e.client_id);

      // 3) Expenses (payment_requests) → cost per client via event_id
      const expRes = await (supabase as any)
        .from("payment_requests")
        .select("amount, status, event_id")
        .eq("organization_id", orgId);
      if (expRes.error) throw expRes.error;
      const expenses = (expRes.data ?? []) as any[];

      const map = new Map<string, ClientPnlRow>();
      const ensure = (cid: string, name: string) => {
        if (!map.has(cid)) map.set(cid, {
          client_id: cid, client_name: name,
          billed: 0, collected: 0, outstanding: 0, expenses: 0, net: 0, margin: 0, invoices: 0,
        });
        return map.get(cid)!;
      };

      for (const inv of invoices) {
        if (!inv.client_id) continue;
        if (DEAD_INVOICE_STATUSES.has(String(inv.status || "").toLowerCase())) continue;
        const name = inv.client?.partner_name ? `${inv.client.name} & ${inv.client.partner_name}` : (inv.client?.name || "Unknown client");
        const row = ensure(inv.client_id, name);
        row.billed += Number(inv.total_amount || 0);
        row.collected += Number(inv.amount_paid || 0);
        row.invoices += 1;
      }

      for (const ex of expenses) {
        if (!COST_STATUSES.has(String(ex.status || "").toLowerCase())) continue;
        const cid = ex.event_id ? eventToClient.get(ex.event_id) : undefined;
        if (!cid) continue; // unattributed expense — excluded from client P&L
        const row = map.get(cid);
        if (row) row.expenses += Number(ex.amount || 0);
      }

      const rows = [...map.values()].map((r) => {
        r.outstanding = Math.max(0, r.billed - r.collected);
        r.net = r.collected - r.expenses;
        r.margin = r.collected > 0 ? Math.round((r.net / r.collected) * 100) : 0;
        return r;
      }).sort((a, b) => b.net - a.net);

      const totals = rows.reduce((t, r) => ({
        billed: t.billed + r.billed,
        collected: t.collected + r.collected,
        outstanding: t.outstanding + r.outstanding,
        expenses: t.expenses + r.expenses,
        net: t.net + r.net,
      }), { billed: 0, collected: 0, outstanding: 0, expenses: 0, net: 0 });

      return { rows, totals };
    },
  });

  return {
    rows: query.data?.rows ?? [],
    totals: query.data?.totals ?? { billed: 0, collected: 0, outstanding: 0, expenses: 0, net: 0 },
    isLoading: query.isLoading,
  };
}
