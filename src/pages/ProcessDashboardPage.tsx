import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Workflow, AlertTriangle, Clock, CheckCircle2, Circle, ListTodo, Loader2 } from "lucide-react";
import { useAllProcessSteps } from "@/hooks/useProcessTemplates";
import { useClients } from "@/hooks/useClients";
import { format, isPast, isToday } from "date-fns";

const STATUS_TONE: Record<string, { label: string; tone: string; icon: any }> = {
  pending: { label: "Pending", tone: "bg-slate-100 text-slate-700 border-slate-200", icon: Circle },
  not_started: { label: "Pending", tone: "bg-slate-100 text-slate-700 border-slate-200", icon: Circle },
  in_progress: { label: "In Progress", tone: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  done: { label: "Done", tone: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  completed: { label: "Done", tone: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  blocked: { label: "Blocked", tone: "bg-rose-100 text-rose-700 border-rose-200", icon: AlertTriangle },
};

export default function ProcessDashboardPage() {
  const navigate = useNavigate();
  const { steps, isLoading } = useAllProcessSteps();
  const { clients = [] } = useClients();

  const tabs = [
    { label: "Per-Client", path: "/process-planner" },
    { label: "Templates", path: "/process-planner/templates" },
    { label: "Across Projects", path: "/process-planner/dashboard" },
  ];

  // Bottleneck: group active steps by step name to see where projects pile up
  const bottleneck = useMemo(() => {
    const map = new Map<string, { count: number; oldestDays: number; clientNames: string[] }>();
    const active = steps.filter((s: any) => s.status !== "done" && s.status !== "completed");
    for (const s of active) {
      const heading = s.heading || "Untitled step";
      const created = s.created_at ? new Date(s.created_at) : new Date();
      const ageDays = Math.max(0, Math.round((Date.now() - created.getTime()) / 86400000));
      const client = (clients as any[]).find(c => c.id === s.client_id);
      const clientLabel = client ? (client.partner_name ? `${client.name} & ${client.partner_name}` : client.name) : "Client";
      const existing = map.get(heading);
      if (existing) {
        existing.count += 1;
        existing.oldestDays = Math.max(existing.oldestDays, ageDays);
        if (existing.clientNames.length < 4) existing.clientNames.push(clientLabel);
      } else {
        map.set(heading, { count: 1, oldestDays: ageDays, clientNames: [clientLabel] });
      }
    }
    return Array.from(map.entries())
      .map(([heading, v]) => ({ heading, ...v }))
      .sort((a, b) => b.count - a.count || b.oldestDays - a.oldestDays);
  }, [steps, clients]);

  // Per-status totals
  const totals = useMemo(() => {
    const t = { pending: 0, in_progress: 0, done: 0, blocked: 0, overdue: 0 };
    for (const s of steps as any[]) {
      const st = (s.status || "pending").toLowerCase();
      if (st === "in_progress") t.in_progress += 1;
      else if (st === "done" || st === "completed") t.done += 1;
      else if (st === "blocked") t.blocked += 1;
      else t.pending += 1;
      if (s.due_date && st !== "done" && st !== "completed") {
        const d = new Date(s.due_date);
        if (isPast(d) && !isToday(d)) t.overdue += 1;
      }
    }
    return t;
  }, [steps]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Workflow className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Process Planner</h1>
            <p className="text-sm text-muted-foreground">Bird's-eye view of every workflow step across every project</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-1 border-b">
          {tabs.map(t => (
            <button
              key={t.path}
              onClick={() => navigate(t.path)}
              className={`px-3 py-2 text-sm font-medium ${t.path === "/process-planner/dashboard" ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI tiles */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card><CardContent className="p-4">
          <Circle className="h-4 w-4 text-slate-500 mb-2" />
          <p className="text-2xl font-bold">{totals.pending}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Pending</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <Clock className="h-4 w-4 text-amber-600 mb-2" />
          <p className="text-2xl font-bold">{totals.in_progress}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">In Progress</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 mb-2" />
          <p className="text-2xl font-bold">{totals.done}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Done</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <AlertTriangle className="h-4 w-4 text-rose-600 mb-2" />
          <p className="text-2xl font-bold">{totals.blocked}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Blocked</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <AlertTriangle className="h-4 w-4 text-rose-600 mb-2" />
          <p className="text-2xl font-bold text-rose-600">{totals.overdue}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1 font-semibold">Overdue</p>
        </CardContent></Card>
      </div>

      {/* Bottleneck */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold flex items-center gap-2 text-sm">
              <ListTodo className="h-4 w-4" /> Where projects are stuck
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Most-common active step grouped across all projects — biggest piles = biggest bottlenecks.
            </p>
          </div>
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : bottleneck.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Workflow className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No active steps. Create a process template, apply it to a client, and you'll see live progress here.</p>
            </div>
          ) : (
            <div className="divide-y">
              {bottleneck.map(b => (
                <div key={b.heading} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{b.heading}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {b.clientNames.join(" · ")}
                        {b.count > 4 ? ` and ${b.count - 4} more` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">
                        {b.count} {b.count === 1 ? "project" : "projects"}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] ${b.oldestDays > 14 ? "bg-rose-50 text-rose-700 border-rose-200" : b.oldestDays > 7 ? "bg-amber-50 text-amber-700 border-amber-200" : ""}`}>
                        {b.oldestDays}d oldest
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All active steps list */}
      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-sm">All active steps</h2>
          </div>
          {steps.length === 0 ? (
            <div className="p-12 text-center text-sm text-muted-foreground">No steps yet.</div>
          ) : (
            <div className="divide-y">
              {(steps as any[])
                .filter(s => s.status !== "done" && s.status !== "completed")
                .slice(0, 50)
                .map(s => {
                  const tone = STATUS_TONE[s.status] || STATUS_TONE.pending;
                  const Icon = tone.icon;
                  const client = (clients as any[]).find(c => c.id === s.client_id);
                  const dd = s.due_date ? new Date(s.due_date) : null;
                  const overdue = dd && isPast(dd) && !isToday(dd);
                  return (
                    <div key={s.id} className="p-3 hover:bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.heading}</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {client ? `${client.name}${client.partner_name ? ` & ${client.partner_name}` : ""}` : "Client"}
                            {s.responsible_role && ` · ${s.responsible_role}`}
                            {dd && (overdue ? ` · Overdue (${format(dd, "d MMM")})` : ` · Due ${format(dd, "d MMM")}`)}
                          </p>
                        </div>
                        <Badge variant="outline" className={`text-[10px] ${tone.tone}`}>{tone.label}</Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
