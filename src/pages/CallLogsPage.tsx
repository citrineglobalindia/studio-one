import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Phone, PhoneIncoming, PhoneOutgoing, Search, Loader2, Clock, Calendar, Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { useCallLogs, CallOutcome } from "@/hooks/useCallLogs";
import { useLeads } from "@/hooks/useLeads";
import { useClients } from "@/hooks/useClients";
import { CallLogDialog } from "@/components/calls/CallLogDialog";

const outcomeLabels: Record<CallOutcome, string> = {
  connected: "Connected",
  no_answer: "No answer",
  busy: "Busy",
  voicemail: "Voicemail",
  wrong_number: "Wrong number",
  interested: "Interested",
  not_interested: "Not interested",
  callback_requested: "Callback",
  converted: "Converted",
};

const outcomeColor: Record<CallOutcome, string> = {
  connected: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  interested: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  converted: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  callback_requested: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  no_answer: "bg-muted text-muted-foreground border-muted",
  busy: "bg-muted text-muted-foreground border-muted",
  voicemail: "bg-muted text-muted-foreground border-muted",
  wrong_number: "bg-red-500/15 text-red-400 border-red-500/30",
  not_interested: "bg-red-500/15 text-red-400 border-red-500/30",
};

function formatDuration(seconds: number): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m ? `${m}m ${s}s` : `${s}s`;
}

export default function CallLogsPage() {
  const { callLogs, isLoading, deleteCallLog } = useCallLogs();
  const { leads } = useLeads();
  const { clients = [] } = useClients();
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("all");
  const [logOpen, setLogOpen] = useState(false);

  const leadMap = useMemo(() => new Map(leads.map(l => [l.id, l])), [leads]);
  const clientMap = useMemo(() => new Map((clients as any[]).map(c => [c.id, c])), [clients]);

  const filtered = callLogs.filter(c => {
    if (outcomeFilter !== "all" && c.outcome !== outcomeFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    const relatedName = c.lead_id
      ? leadMap.get(c.lead_id)?.name
      : c.client_id
      ? clientMap.get(c.client_id)?.name
      : c.contact_name;
    return (
      (relatedName || "").toLowerCase().includes(q) ||
      (c.contact_phone || "").toLowerCase().includes(q) ||
      (c.notes || "").toLowerCase().includes(q)
    );
  });

  const totalDuration = callLogs.reduce((s, c) => s + (c.duration_seconds || 0), 0);
  const connectedCount = callLogs.filter(c =>
    ["connected", "interested", "converted", "callback_requested"].includes(c.outcome)
  ).length;

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Phone className="h-6 w-6" /> Call Logs
          </h1>
          <p className="text-sm text-muted-foreground mt-1">All calls logged by your team</p>
        </div>
        <Button onClick={() => setLogOpen(true)} className="gap-2">
          <Phone className="h-4 w-4" /> Log a call
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Calls</div>
            <div className="text-2xl font-bold mt-1">{callLogs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Connected</div>
            <div className="text-2xl font-bold mt-1 text-emerald-400">{connectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Total Talk Time</div>
            <div className="text-2xl font-bold mt-1">{Math.round(totalDuration / 60)}m</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Connect Rate</div>
            <div className="text-2xl font-bold mt-1">
              {callLogs.length ? Math.round((connectedCount / callLogs.length) * 100) : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, phone, notes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={outcomeFilter} onValueChange={setOutcomeFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All outcomes</SelectItem>
            {Object.entries(outcomeLabels).map(([v, l]) => (
              <SelectItem key={v} value={v}>{l}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No calls logged yet.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(c => {
                const lead = c.lead_id ? leadMap.get(c.lead_id) : null;
                const client = c.client_id ? clientMap.get(c.client_id) : null;
                const contactName = lead?.name || client?.name || c.contact_name || "Unknown";
                const contactPhone = lead?.phone || (client as any)?.phone || c.contact_phone;
                return (
                  <div key={c.id} className="p-4 hover:bg-muted/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        {c.direction === "inbound"
                          ? <PhoneIncoming className="h-4 w-4 text-blue-400" />
                          : <PhoneOutgoing className="h-4 w-4 text-purple-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold">{contactName}</span>
                          {lead && <Badge variant="outline" className="text-[10px]">Lead</Badge>}
                          {client && <Badge variant="outline" className="text-[10px]">Client</Badge>}
                          <Badge variant="outline" className={`text-[10px] ${outcomeColor[c.outcome] || ""}`}>
                            {outcomeLabels[c.outcome]}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {contactPhone && <span>{contactPhone}</span>}
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(c.called_at), "d MMM yyyy, HH:mm")}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDuration(c.duration_seconds)}</span>
                        </div>
                        {c.notes && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{c.notes}</p>}
                        {c.next_action && (
                          <p className="text-xs mt-1.5 text-amber-400">
                            → {c.next_action}
                            {c.next_action_date && ` on ${format(new Date(c.next_action_date), "d MMM")}`}
                          </p>
                        )}
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this call log?</AlertDialogTitle>
                            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCallLog.mutate(c.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CallLogDialog open={logOpen} onOpenChange={setLogOpen} />
    </div>
  );
}
