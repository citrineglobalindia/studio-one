import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Plus, Search, Phone, Mail, MapPin, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useClients, type DbClient } from "@/hooks/useClients";
import { useRole } from "@/contexts/RoleContext";
import { Lock } from "lucide-react";

export default function ClientsPage() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const canViewClients = currentRole === "admin" || currentRole === "administrator" || currentRole === "telecaller";
  const { clients, isLoading } = useClients();

  if (!canViewClients) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <Lock className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Clients are restricted</p>
        <p className="text-sm text-muted-foreground">Only Sales, Administrator and Admin can view clients.</p>
      </div>
    );
  }
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const hay = [c.name, c.partner_name, c.phone, c.email, c.city].filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [clients, search]);

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Clients</h1>
            <p className="text-xs text-muted-foreground">{clients.length} total</p>
          </div>
        </div>
        <Button onClick={() => navigate("/clients/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </motion.div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, email, city…" className="pl-9" />
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {clients.length === 0 ? "No clients yet" : "No matching clients"}
          </p>
          {clients.length === 0 && (
            <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => navigate("/clients/new")}>
              <Plus className="h-3.5 w-3.5" /> Add your first client
            </Button>
          )}
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {filtered.map((c) => (
            <ClientCard key={c.id} c={c} onClick={() => navigate(`/clients/${c.id}`)} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function ClientCard({ c, onClick }: { c: DbClient; onClick: () => void }) {
  const initials = (c.name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  const fullCouple = c.partner_name ? `${c.name} & ${c.partner_name}` : c.name;

  return (
    <motion.button
      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
      onClick={onClick}
      className="text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition group"
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
          {initials || "C"}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate">{fullCouple || "Untitled client"}</p>
          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1 mt-0.5">
            {c.phone && (<span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>)}
            {c.email && (<span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>)}
            {c.city && (<span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{c.city}</span>)}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition" />
      </div>
    </motion.button>
  );
}
