import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Plus, Search, Phone, Mail, MapPin, ChevronRight, Loader2, FilterX, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClients, type DbClient } from "@/hooks/useClients";
import { useSalesExecutives } from "@/hooks/useSalesExecutives";
import { useRole } from "@/contexts/RoleContext";
import { useOrg } from "@/contexts/OrgContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lock } from "lucide-react";

export default function ClientsPage() {
  const navigate = useNavigate();
  const { currentRole } = useRole();
  const canViewClients = currentRole === "admin" || currentRole === "administrator" || currentRole === "telecaller";
  const isAdmin = currentRole === "admin" || currentRole === "administrator";
  const { clients, isLoading } = useClients();
  const { executives } = useSalesExecutives();
  const { organization } = useOrg();
  const orgId = organization?.id ?? null;
  const { data: eventsByClient = new Map<string, any[]>() } = useQuery({
    queryKey: ["clients-events", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("events")
        .select("id, client_id, event_type, event_date")
        .eq("organization_id", orgId)
        .order("event_date", { ascending: true });
      if (error) throw error;
      const m = new Map<string, any[]>();
      for (const e of (data ?? [])) {
        if (!e.client_id) continue;
        if (!m.has(e.client_id)) m.set(e.client_id, []);
        m.get(e.client_id)!.push(e);
      }
      return m;
    },
  });

  const [search, setSearch] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [filterExec, setFilterExec] = useState("all");

  const filtered = useMemo(() => {
    let list = clients as any[];
    if (filterFrom) list = list.filter((c) => c.event_date && c.event_date >= filterFrom);
    if (filterTo) list = list.filter((c) => c.event_date && c.event_date <= filterTo);
    if (isAdmin && filterExec !== "all") {
      list = list.filter((c) => (filterExec === "unassigned" ? !c.created_by : c.created_by === filterExec));
    }
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((c) => [c.name, c.partner_name, c.phone, c.email, c.city].filter(Boolean).join(" ").toLowerCase().includes(q));
    return list as DbClient[];
  }, [clients, search, filterFrom, filterTo, filterExec, isAdmin]);

  const activeFilters = [filterFrom, filterTo, isAdmin && filterExec !== "all", search.trim()].filter(Boolean).length;

  if (!canViewClients) {
    return (
      <div className="w-full px-3 md:px-5 lg:px-6 py-10 max-w-3xl mx-auto text-center space-y-3">
        <Lock className="h-12 w-12 text-muted-foreground/30 mx-auto" />
        <p className="text-base font-semibold text-foreground">Clients are restricted</p>
        <p className="text-sm text-muted-foreground">Only Sales, Administrator and Admin can view clients.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-5 lg:px-6 py-4 md:py-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Clients</h1>
            <p className="text-xs text-muted-foreground">{filtered.length} of {clients.length}</p>
          </div>
        </div>
        <Button onClick={() => navigate("/clients/new")} className="gap-2">
          <Plus className="h-4 w-4" /> Add Client
        </Button>
      </motion.div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, email, city…" className="pl-9 h-9" />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Input type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} className="h-9 w-full sm:w-36 text-xs" title="Event date from" />
          <span className="text-xs text-muted-foreground">–</span>
          <Input type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} className="h-9 w-full sm:w-36 text-xs" title="Event date to" />
        </div>
        {isAdmin && (
          <Select value={filterExec} onValueChange={setFilterExec}>
            <SelectTrigger className="h-9 w-full sm:w-44 text-xs"><SelectValue placeholder="Sales person" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sales people</SelectItem>
              <SelectItem value="unassigned">No owner</SelectItem>
              {executives.map((e) => <SelectItem key={e.user_id} value={e.user_id}>{e.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )}
        {activeFilters > 0 && (
          <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-xs shrink-0" onClick={() => { setSearch(""); setFilterFrom(""); setFilterTo(""); setFilterExec("all"); }}>
            <FilterX className="h-3.5 w-3.5" /> Clear
          </Button>
        )}
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
            <ClientCard key={c.id} c={c} events={eventsByClient.get(c.id) || []} onClick={() => navigate(`/clients/${c.id}`)} />
          ))}
        </motion.div>
      )}
    </div>
  );
}

function fmtEvDate(d: string | null) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }); } catch { return ""; }
}

function ClientCard({ c, events, onClick }: { c: DbClient; events: any[]; onClick: () => void }) {
  const initials = (c.name || "?").split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");
  const fullCouple = c.partner_name ? `${c.name} & ${c.partner_name}` : c.name;
  const shownEvents = events.slice(0, 3);
  const moreEvents = events.length - shownEvents.length;

  return (
    <motion.button
      variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
      onClick={onClick}
      className="text-left rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition group"
    >
      <div className="flex items-start gap-3">
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
          {events.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              {shownEvents.map((e) => (
                <span key={e.id} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-medium">
                  <CalendarDays className="h-2.5 w-2.5" />
                  {e.event_type || "Event"}{e.event_date ? ` · ${fmtEvDate(e.event_date)}` : ""}
                </span>
              ))}
              {moreEvents > 0 && (
                <span className="inline-flex items-center rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-medium">+{moreEvents} more</span>
              )}
            </div>
          )}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition" />
      </div>
    </motion.button>
  );
}
