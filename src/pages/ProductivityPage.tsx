import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ListChecks, Search, Loader2, Check, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useClients } from "@/hooks/useClients";
import { useClientProductivity, PRODUCTIVITY_ITEMS, type ClientProductivity } from "@/hooks/useClientProductivity";
import { useRole } from "@/contexts/RoleContext";

export default function ProductivityPage() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const canView = currentRole === "admin" || currentRole === "administrator" || currentRole === "telecaller";
  const canEdit = canView; // sales + admin + administrator can edit
  const { clients, isLoading: lc } = useClients();
  const { byClient, isLoading: lp, setFlag } = useClientProductivity();
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = clients;
    if (q) list = list.filter((c: any) => `${c.name} ${c.partner_name || ""} ${c.phone || ""}`.toLowerCase().includes(q));
    return list;
  }, [clients, search]);

  const totals = useMemo(() => {
    const t: Record<string, number> = {};
    for (const it of PRODUCTIVITY_ITEMS) t[it.key] = 0;
    for (const c of clients) {
      const p = byClient.get(c.id);
      if (!p) continue;
      for (const it of PRODUCTIVITY_ITEMS) if ((p as any)[it.key]) t[it.key]++;
    }
    return t;
  }, [clients, byClient]);

  if (!canView) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <ListChecks className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Productivity is restricted</p>
        <p className="text-sm text-muted-foreground">Only Sales, Administrator and Admin can view this module.</p>
      </div>
    );
  }

  const isLoading = lc || lp;

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-3xl overflow-hidden border border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-400/10 via-emerald-400/5 to-transparent" />
        <div className="relative p-5 md:p-6 flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-teal-500/25 to-teal-500/5 border border-teal-500/30 flex items-center justify-center shadow-sm">
            <ListChecks className="h-6 w-6 text-teal-500" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-medium">Operations</p>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Productivity</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Deliverable progress per client {canEdit ? "— tick as each is completed" : ""}</p>
          </div>
        </div>
      </motion.div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search client…" className="pl-9 h-9" />
      </div>

      {isLoading ? (
        <div className="py-12 text-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground mx-auto" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No clients yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-fixed min-w-[820px]">
              <colgroup>
                <col className="w-[26%]" />
                {PRODUCTIVITY_ITEMS.map((it) => <col key={it.key} className="w-[13%]" />)}
                <col className="w-[9%]" />
              </colgroup>
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Client</th>
                  {PRODUCTIVITY_ITEMS.map((it) => (
                    <th key={it.key} className="text-center px-2 py-3 font-semibold">{it.label}</th>
                  ))}
                  <th className="text-center px-2 py-3 font-semibold">Done</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((c: any) => {
                  const p = byClient.get(c.id) as ClientProductivity | undefined;
                  const doneCount = PRODUCTIVITY_ITEMS.filter((it) => p && (p as any)[it.key]).length;
                  return (
                    <tr key={c.id} className="hover:bg-muted/20 transition-colors align-middle">
                      <td className="px-4 py-3 align-middle">
                        <button onClick={() => navigate(`/clients/${c.id}`)} className="font-semibold text-foreground hover:text-primary truncate text-left">
                          {c.partner_name ? `${c.name} & ${c.partner_name}` : c.name}
                        </button>
                        {c.phone && <p className="text-[11px] text-muted-foreground">{c.phone}</p>}
                      </td>
                      {PRODUCTIVITY_ITEMS.map((it) => {
                        const checked = !!(p && (p as any)[it.key]);
                        return (
                          <td key={it.key} className="px-2 py-3 text-center align-middle">
                            <button
                              type="button"
                              disabled={!canEdit || setFlag.isPending}
                              onClick={() => setFlag.mutate({ clientId: c.id, key: it.key, value: !checked, current: p })}
                              className={
                                "h-6 w-6 rounded-md border inline-flex items-center justify-center transition " +
                                (checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-border bg-background hover:border-emerald-500/50") +
                                (!canEdit ? " opacity-70 cursor-default" : " cursor-pointer")
                              }
                              aria-label={`${it.label} for ${c.name}`}
                              title={canEdit ? `Toggle ${it.label}` : it.label}
                            >
                              {checked && <Check className="h-4 w-4" />}
                            </button>
                          </td>
                        );
                      })}
                      <td className="px-2 py-3 text-center align-middle">
                        <span className={"text-xs font-semibold tabular-nums " + (doneCount === PRODUCTIVITY_ITEMS.length ? "text-emerald-600" : "text-muted-foreground")}>
                          {doneCount}/{PRODUCTIVITY_ITEMS.length}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-muted/30 text-[11px] text-muted-foreground">
                <tr>
                  <td className="px-4 py-2.5 font-medium">Completed</td>
                  {PRODUCTIVITY_ITEMS.map((it) => (
                    <td key={it.key} className="px-2 py-2.5 text-center tabular-nums font-medium text-foreground">{totals[it.key]}</td>
                  ))}
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">
            {rows.length} client{rows.length === 1 ? "" : "s"}{!canEdit ? " · view only" : ""}
          </div>
        </div>
      )}
    </div>
  );
}
