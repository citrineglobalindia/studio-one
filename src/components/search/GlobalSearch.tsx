import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  UserPlus, Users, FolderKanban, CalendarCheck, FileText, CreditCard, Film, Wallet,
  LayoutDashboard, Settings as Cog, Loader2,
} from "lucide-react";
import { useLeads } from "@/hooks/useLeads";
import { useClients } from "@/hooks/useClients";
import { useProjects } from "@/hooks/useProjects";
import { useEvents } from "@/hooks/useEvents";
import { useInvoices } from "@/hooks/useInvoices";
import { useContracts } from "@/hooks/useContracts";
import { useDeliverables } from "@/hooks/useDeliverables";

type Props = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
};

const QUICK_ACTIONS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Leads", icon: UserPlus, path: "/leads" },
  { label: "Clients", icon: Users, path: "/clients" },
  { label: "Projects", icon: FolderKanban, path: "/projects" },
  { label: "Events", icon: CalendarCheck, path: "/events" },
  { label: "Calendar", icon: CalendarCheck, path: "/calendar" },
  { label: "Quotations", icon: FileText, path: "/quotations" },
  { label: "Invoices", icon: CreditCard, path: "/invoices" },
  { label: "Contracts", icon: FileText, path: "/contracts" },
  { label: "Payment Requests", icon: Wallet, path: "/payment-requests" },
  { label: "Settings", icon: Cog, path: "/settings" },
];

export function GlobalSearch({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  const { leads = [], isLoading: lL } = useLeads();
  const { clients = [], isLoading: cL } = useClients();
  const { projects = [], isLoading: pL } = useProjects();
  const { events: dbEvents = [], isLoading: eL } = useEvents();
  const { invoices = [], isLoading: iL } = useInvoices();
  const { contracts = [], isLoading: kL } = useContracts();
  const { deliverables = [], isLoading: dL } = useDeliverables();

  const isLoading = lL || cL || pL || eL || iL || kL || dL;

  // Reset query when opened
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const q = query.trim().toLowerCase();

  const matchesQuery = (s: string | null | undefined) =>
    !q || (s ?? "").toLowerCase().includes(q);

  const matchedLeads = useMemo(
    () => leads.filter(l => !q || [l.name, l.phone, l.email, l.event_type, l.city].some(v => matchesQuery(v))).slice(0, 6),
    [leads, q]
  );
  const matchedClients = useMemo(
    () => (clients as any[]).filter(c => !q || [c.name, c.partner_name, c.email, c.phone, c.city].some(v => matchesQuery(v))).slice(0, 6),
    [clients, q]
  );
  const matchedProjects = useMemo(
    () => (projects as any[]).filter(p => !q || [p.project_name, p.event_type, p.venue].some(v => matchesQuery(v))).slice(0, 6),
    [projects, q]
  );
  const matchedEvents = useMemo(
    () => dbEvents.filter(e => !q || [e.name, e.event_type, e.venue].some(v => matchesQuery(v))).slice(0, 6),
    [dbEvents, q]
  );
  const matchedInvoices = useMemo(
    () => invoices.filter(i => !q || [i.invoice_number, i.client_name, i.project_name].some(v => matchesQuery(v))).slice(0, 6),
    [invoices, q]
  );
  const matchedContracts = useMemo(
    () => contracts.filter(c => !q || [c.title, c.client_name, c.contract_number].some(v => matchesQuery(v))).slice(0, 6),
    [contracts, q]
  );
  const matchedDeliverables = useMemo(
    () => deliverables.filter(d => !q || [d.title, d.deliverable_type].some(v => matchesQuery(v))).slice(0, 6),
    [deliverables, q]
  );
  const matchedActions = useMemo(
    () => QUICK_ACTIONS.filter(a => !q || a.label.toLowerCase().includes(q)),
    [q]
  );

  const go = (path: string) => {
    onOpenChange(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search clients, leads, events, invoices… (or type a page name)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[420px]">
        {isLoading && (
          <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading…
          </div>
        )}
        <CommandEmpty>No results found.</CommandEmpty>

        {q.length === 0 && (
          <CommandGroup heading="Jump to">
            {QUICK_ACTIONS.slice(0, 8).map(a => (
              <CommandItem key={a.path} onSelect={() => go(a.path)} className="gap-2">
                <a.icon className="h-4 w-4 text-muted-foreground" />
                {a.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {q.length > 0 && matchedActions.length > 0 && (
          <CommandGroup heading="Pages">
            {matchedActions.map(a => (
              <CommandItem key={a.path} onSelect={() => go(a.path)} className="gap-2">
                <a.icon className="h-4 w-4 text-muted-foreground" />
                {a.label}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedLeads.length > 0 && (
          <CommandGroup heading={`Leads (${matchedLeads.length})`}>
            {matchedLeads.map(l => (
              <CommandItem key={l.id} onSelect={() => go("/leads")} className="gap-2">
                <UserPlus className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{l.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {[l.phone, l.event_type, l.city].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedClients.length > 0 && (
          <CommandGroup heading={`Clients (${matchedClients.length})`}>
            {matchedClients.map((c: any) => (
              <CommandItem key={c.id} onSelect={() => go(`/clients/${c.id}`)} className="gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {c.name}{c.partner_name ? ` & ${c.partner_name}` : ""}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {[c.event_type, c.city].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedProjects.length > 0 && (
          <CommandGroup heading={`Projects (${matchedProjects.length})`}>
            {matchedProjects.map((p: any) => (
              <CommandItem key={p.id} onSelect={() => go(`/projects/${p.id}`)} className="gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{p.project_name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {[p.event_type, p.status].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedEvents.length > 0 && (
          <CommandGroup heading={`Events (${matchedEvents.length})`}>
            {matchedEvents.map(e => (
              <CommandItem key={e.id} onSelect={() => go("/events")} className="gap-2">
                <CalendarCheck className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{e.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {[e.event_date, e.venue].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedInvoices.length > 0 && (
          <CommandGroup heading={`Invoices (${matchedInvoices.length})`}>
            {matchedInvoices.map(i => (
              <CommandItem key={i.id} onSelect={() => go("/invoices")} className="gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {i.invoice_number} · {i.client_name}
                  </div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    ₹{Number(i.total_amount).toLocaleString("en-IN")} · {i.status}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedContracts.length > 0 && (
          <CommandGroup heading={`Contracts (${matchedContracts.length})`}>
            {matchedContracts.map(c => (
              <CommandItem key={c.id} onSelect={() => go("/contracts")} className="gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{c.title}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {c.client_name} · {c.status}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {matchedDeliverables.length > 0 && (
          <CommandGroup heading={`Deliverables (${matchedDeliverables.length})`}>
            {matchedDeliverables.map(d => (
              <CommandItem key={d.id} onSelect={() => go("/m/deliverables")} className="gap-2">
                <Film className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">{d.title || d.deliverable_type}</div>
                  <div className="text-[10px] text-muted-foreground truncate">
                    {d.deliverable_type} · {d.status}
                  </div>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
