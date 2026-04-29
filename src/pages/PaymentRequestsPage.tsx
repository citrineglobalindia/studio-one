import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Wallet, Search, Loader2, IndianRupee, CheckCircle2, XCircle, BanknoteIcon, Clock, FileText, Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { usePaymentRequests, type PaymentRequest, type PaymentStatus } from "@/hooks/usePaymentRequests";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useDeliverables } from "@/hooks/useDeliverables";
import { supabase } from "@/integrations/supabase/client";

const statusBadge: Record<PaymentStatus, { label: string; tone: string; icon: any }> = {
  pending: { label: "Pending", tone: "bg-amber-500/15 text-amber-600 border-amber-300", icon: Clock },
  approved: { label: "Approved", tone: "bg-sky-500/15 text-sky-600 border-sky-300", icon: CheckCircle2 },
  rejected: { label: "Rejected", tone: "bg-rose-500/15 text-rose-600 border-rose-300", icon: XCircle },
  paid: { label: "Paid", tone: "bg-emerald-500/15 text-emerald-600 border-emerald-300", icon: BanknoteIcon },
  cancelled: { label: "Cancelled", tone: "bg-muted text-muted-foreground", icon: XCircle },
};

export default function PaymentRequestsPage() {
  const { requests, isLoading, approve, reject } = usePaymentRequests();
  const { members: teamMembers = [] } = useTeamMembers();
  const { deliverables } = useDeliverables();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [decision, setDecision] = useState<{ req: PaymentRequest; mode: "approve" | "reject" | "pay" } | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");
  const [paidReference, setPaidReference] = useState("");
  const [requesterNames, setRequesterNames] = useState<Record<string, string>>({});

  // Resolve user ids -> display names from auth.users via supabase (best-effort)
  // Falls back to team_member.full_name when team_member_id is set on the request.
  useMemo(() => {
    const ids = Array.from(new Set(requests.map(r => r.requested_by).filter(Boolean)));
    if (ids.length === 0) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", ids);
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => { if (p.display_name) map[p.user_id] = p.display_name; });
      setRequesterNames(map);
    })();
  }, [requests.length]);

  const requesterFor = (r: PaymentRequest) => {
    if (r.team_member_id) {
      const tm = (teamMembers as any[]).find(t => t.id === r.team_member_id);
      if (tm?.full_name) return tm.full_name;
    }
    return requesterNames[r.requested_by] || "Team member";
  };

  const filtered = requests.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.description.toLowerCase().includes(q) ||
      requesterFor(r).toLowerCase().includes(q) ||
      String(r.amount).includes(q)
    );
  });

  const totals = {
    pending: requests.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.amount || 0), 0),
    approved: requests.filter(r => r.status === "approved").reduce((s, r) => s + Number(r.amount || 0), 0),
    paid: requests.filter(r => r.status === "paid").reduce((s, r) => s + Number(r.amount || 0), 0),
    pendingCount: requests.filter(r => r.status === "pending").length,
  };

  const submitDecision = async () => {
    if (!decision) return;
    if (decision.mode === "reject") {
      if (!decisionNotes.trim()) return;
      await reject.mutateAsync({ id: decision.req.id, notes: decisionNotes.trim() });
    } else if (decision.mode === "approve") {
      await approve.mutateAsync({
        id: decision.req.id,
        notes: decisionNotes.trim() || undefined,
      });
    } else if (decision.mode === "pay") {
      await approve.mutateAsync({
        id: decision.req.id,
        notes: decisionNotes.trim() || undefined,
        markPaid: true,
        reference: paidReference.trim() || undefined,
      });
    }
    setDecision(null);
    setDecisionNotes("");
    setPaidReference("");
  };

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" /> Payment Requests
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review and approve payment requests raised by your team
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Pending</div>
          <div className="text-2xl font-bold mt-1 text-amber-600">{totals.pendingCount}</div>
          <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
            <IndianRupee className="h-3 w-3" /> {totals.pending.toLocaleString("en-IN")}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Approved (unpaid)</div>
          <div className="text-2xl font-bold mt-1 text-sky-600 flex items-center gap-1">
            <IndianRupee className="h-5 w-5" /> {totals.approved.toLocaleString("en-IN")}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total paid</div>
          <div className="text-2xl font-bold mt-1 text-emerald-600 flex items-center gap-1">
            <IndianRupee className="h-5 w-5" /> {totals.paid.toLocaleString("en-IN")}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wider">Total requests</div>
          <div className="text-2xl font-bold mt-1">{requests.length}</div>
        </CardContent></Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search description, requester, amount…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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
              <Wallet className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No payment requests {statusFilter !== "all" ? `with status "${statusFilter}"` : "yet"}.</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(r => {
                const sb = statusBadge[r.status];
                const SIcon = sb.icon;
                const deliverable = r.deliverable_id ? deliverables.find(d => d.id === r.deliverable_id) : null;
                return (
                  <div key={r.id} className="p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xl font-extrabold flex items-center">
                            <IndianRupee className="h-4 w-4" />
                            {Number(r.amount).toLocaleString("en-IN")}
                          </span>
                          <Badge variant="outline" className={`text-[10px] gap-1 ${sb.tone}`}>
                            <SIcon className="h-3 w-3" />
                            {sb.label}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span><span className="text-foreground font-medium">{requesterFor(r)}</span> requested</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {format(new Date(r.created_at), "d MMM yyyy")}
                          </span>
                          {r.payment_method && (
                            <span className="capitalize">via {r.payment_method.replace("_", " ")}</span>
                          )}
                          {deliverable && (
                            <span className="flex items-center gap-1">
                              <FileText className="h-3 w-3" /> {deliverable.title || deliverable.deliverable_type}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground mt-2">{r.description}</p>
                        {r.payment_account && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            <span className="font-medium">Pay to:</span> {r.payment_account}
                          </p>
                        )}
                        {r.admin_notes && (
                          <div className={`mt-2 p-2 rounded text-[11px] border ${r.status === "rejected" ? "bg-rose-500/10 text-rose-700 border-rose-200" : "bg-sky-500/10 text-sky-700 border-sky-200"}`}>
                            <span className="font-semibold">Admin note:</span> {r.admin_notes}
                          </div>
                        )}
                        {r.status === "paid" && r.paid_reference && (
                          <p className="text-[11px] text-emerald-700 mt-1">Ref: {r.paid_reference}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {r.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              className="gap-1 text-white"
                              style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}
                              onClick={() => setDecision({ req: r, mode: "approve" })}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-rose-600 border-rose-300 hover:bg-rose-50"
                              onClick={() => setDecision({ req: r, mode: "reject" })}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <Button
                            size="sm"
                            className="gap-1 text-white"
                            style={{ background: "linear-gradient(135deg,#38bdf8,#2563eb)" }}
                            onClick={() => setDecision({ req: r, mode: "pay" })}
                          >
                            <BanknoteIcon className="h-3.5 w-3.5" /> Mark paid
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!decision} onOpenChange={(o) => !o && setDecision(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision?.mode === "approve" && "Approve payment request"}
              {decision?.mode === "reject" && "Reject payment request"}
              {decision?.mode === "pay" && "Mark as paid"}
            </DialogTitle>
          </DialogHeader>
          {decision && (
            <div className="space-y-3">
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="text-lg font-bold flex items-center">
                  <IndianRupee className="h-4 w-4" />
                  {Number(decision.req.amount).toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{decision.req.description}</p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Requested by {requesterFor(decision.req)}
                </p>
              </div>
              <div>
                <Label className="text-xs">
                  {decision.mode === "reject" ? "Reason for rejection *" : "Notes (optional)"}
                </Label>
                <Textarea
                  value={decisionNotes}
                  onChange={e => setDecisionNotes(e.target.value)}
                  placeholder={decision.mode === "reject" ? "Why is this being rejected?" : "Optional notes for the requester"}
                  rows={3}
                />
              </div>
              {decision.mode === "pay" && (
                <div>
                  <Label className="text-xs">Transaction reference (optional)</Label>
                  <Input
                    value={paidReference}
                    onChange={e => setPaidReference(e.target.value)}
                    placeholder="UTR / Cheque # / UPI txn id"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecision(null)}>Cancel</Button>
            <Button
              onClick={submitDecision}
              disabled={(decision?.mode === "reject" && !decisionNotes.trim()) || approve.isPending || reject.isPending}
              variant={decision?.mode === "reject" ? "destructive" : "default"}
              className="gap-2"
            >
              {(approve.isPending || reject.isPending) ? <Loader2 className="h-4 w-4 animate-spin" /> :
                decision?.mode === "approve" ? <CheckCircle2 className="h-4 w-4" /> :
                decision?.mode === "reject" ? <XCircle className="h-4 w-4" /> :
                <BanknoteIcon className="h-4 w-4" />
              }
              {decision?.mode === "approve" && "Approve"}
              {decision?.mode === "reject" && "Reject"}
              {decision?.mode === "pay" && "Mark paid"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
