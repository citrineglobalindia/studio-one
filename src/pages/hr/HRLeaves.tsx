import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, CheckCircle2, XCircle, Clock, CalendarOff, Loader2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLeaves, LeaveDB } from "@/hooks/useLeaves";
import { useEmployees } from "@/hooks/useEmployees";
import { useOrg } from "@/contexts/OrgContext";

const statusColor: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  Approved: "bg-green-500/10 text-green-600 border-green-200",
  Rejected: "bg-red-500/10 text-red-600 border-red-200",
};

const HRLeaves = () => {
  const { organization } = useOrg();
  const { leaves, isLoading, addLeave, decideLeave } = useLeaves();
  const { employees } = useEmployees();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ employeeId: "", type: "Casual Leave", from: "", to: "", reason: "" });
  const [decisionTarget, setDecisionTarget] = useState<{ leave: LeaveDB; decision: "Approved" | "Rejected" } | null>(null);
  const [decisionNotes, setDecisionNotes] = useState("");

  const filtered = leaves.filter((l) => {
    if (search && !l.employee_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  });

  const pending = leaves.filter(l => l.status === "Pending");

  const openDecision = (leave: LeaveDB, decision: "Approved" | "Rejected") => {
    setDecisionTarget({ leave, decision });
    setDecisionNotes("");
  };

  const confirmDecision = async () => {
    if (!decisionTarget) return;
    if (decisionTarget.decision === "Rejected" && !decisionNotes.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    await decideLeave.mutateAsync({
      id: decisionTarget.leave.id,
      decision: decisionTarget.decision,
      notes: decisionNotes.trim() || undefined,
    });
    setDecisionTarget(null);
  };

  const bulkApprove = async () => {
    if (pending.length === 0) return;
    for (const l of pending) {
      await decideLeave.mutateAsync({ id: l.id, decision: "Approved" });
    }
  };

  const handleApply = () => {
    if (!form.employeeId || !form.from || !form.to) { toast.error("Fill all required fields"); return; }
    if (!organization) return;
    const emp = employees.find(e => e.id === form.employeeId);
    const days = Math.ceil((new Date(form.to).getTime() - new Date(form.from).getTime()) / 86400000) + 1;
    addLeave.mutate({
      organization_id: organization.id,
      employee_id: form.employeeId,
      employee_name: emp?.full_name || "Unknown",
      leave_type: form.type,
      from_date: form.from,
      to_date: form.to,
      days,
      reason: form.reason || null,
      status: "Pending",
      applied_on: new Date().toISOString().split("T")[0],
      approved_by: null,
    } as any, {
      onSuccess: () => {
        setShowApply(false);
        setForm({ employeeId: "", type: "Casual Leave", from: "", to: "", reason: "" });
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-foreground text-xl font-semibold">Leave Management</h1>
          <p className="text-muted-foreground text-sm">Manage employee leave requests</p>
        </div>
        <div className="flex gap-2">
          {pending.length > 0 && (
            <Button size="sm" variant="outline" onClick={bulkApprove} disabled={decideLeave.isPending} className="gap-1">
              <CheckCheck className="h-4 w-4" /> Approve all ({pending.length})
            </Button>
          )}
          <Button size="sm" onClick={() => setShowApply(true)}><Plus className="h-4 w-4 mr-1" /> Apply Leave</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: leaves.length, icon: CalendarOff, color: "bg-primary/10 text-primary" },
          { label: "Pending", value: pending.length, icon: Clock, color: "bg-amber-500/10 text-amber-600" },
          { label: "Approved", value: leaves.filter(l => l.status === "Approved").length, icon: CheckCircle2, color: "bg-green-500/10 text-green-600" },
          { label: "Rejected", value: leaves.filter(l => l.status === "Rejected").length, icon: XCircle, color: "bg-red-500/10 text-red-600" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{l.employee_name}</p>
                      <p className="text-xs text-muted-foreground">Applied {l.applied_on}</p>
                    </TableCell>
                    <TableCell className="text-sm">{l.leave_type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(l.from_date), "d MMM")} – {format(new Date(l.to_date), "d MMM yyyy")}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{l.days}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{l.reason || "—"}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColor[l.status]}>{l.status}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {l.approved_at ? (
                        <>
                          <div>{format(new Date(l.approved_at), "d MMM, HH:mm")}</div>
                          {l.approval_notes && <div className="text-xs italic max-w-[160px] truncate" title={l.approval_notes}>"{l.approval_notes}"</div>}
                        </>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      {l.status === "Pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="text-green-600 h-8 px-2" onClick={() => openDecision(l, "Approved")}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600 h-8 px-2" onClick={() => openDecision(l, "Rejected")}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">No leave requests found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showApply} onOpenChange={setShowApply}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Employee</Label>
              <Select value={form.employeeId} onValueChange={(v) => setForm({ ...form, employeeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.filter(e => e.status === "active").map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Leave Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Casual Leave", "Sick Leave", "Earned Leave", "Personal Leave"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>From</Label><Input type="date" value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} /></div>
              <div><Label>To</Label><Input type="date" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} /></div>
            </div>
            <div><Label>Reason</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleApply} disabled={addLeave.isPending}>Submit</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!decisionTarget} onOpenChange={(o) => !o && setDecisionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decisionTarget?.decision === "Approved" ? "Approve leave" : "Reject leave"}
            </DialogTitle>
            <DialogDescription>
              {decisionTarget && (
                <>
                  {decisionTarget.leave.employee_name} · {decisionTarget.leave.leave_type} ·{" "}
                  {format(new Date(decisionTarget.leave.from_date), "d MMM")} to{" "}
                  {format(new Date(decisionTarget.leave.to_date), "d MMM yyyy")} ({decisionTarget.leave.days} days)
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>
              {decisionTarget?.decision === "Rejected" ? "Reason for rejection *" : "Notes (optional)"}
            </Label>
            <Textarea
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder={decisionTarget?.decision === "Rejected" ? "Please explain why…" : "Optional notes for the employee"}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionTarget(null)}>Cancel</Button>
            <Button
              onClick={confirmDecision}
              disabled={decideLeave.isPending}
              variant={decisionTarget?.decision === "Rejected" ? "destructive" : "default"}
            >
              {decideLeave.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : decisionTarget?.decision === "Approved" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRLeaves;
