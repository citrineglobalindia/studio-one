import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, CheckCircle2, XCircle, Clock, CalendarOff } from "lucide-react";
import { toast } from "sonner";

interface LeaveRequest {
  id: string;
  employee: string;
  empId: string;
  type: string;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedOn: string;
}

const initialLeaves: LeaveRequest[] = [
  { id: "LR001", employee: "John Smith", empId: "EMP001", type: "Casual Leave", from: "2026-04-07", to: "2026-04-08", days: 2, reason: "Personal work", status: "Pending", appliedOn: "2026-04-03" },
  { id: "LR002", employee: "Sarah Wilson", empId: "EMP002", type: "Sick Leave", from: "2026-04-06", to: "2026-04-06", days: 1, reason: "Fever", status: "Pending", appliedOn: "2026-04-04" },
  { id: "LR003", employee: "Mike Johnson", empId: "EMP003", type: "Personal Leave", from: "2026-04-10", to: "2026-04-12", days: 3, reason: "Family event", status: "Pending", appliedOn: "2026-04-02" },
  { id: "LR004", employee: "Emily Davis", empId: "EMP004", type: "Casual Leave", from: "2026-03-20", to: "2026-03-21", days: 2, reason: "Travel", status: "Approved", appliedOn: "2026-03-15" },
  { id: "LR005", employee: "David Brown", empId: "EMP005", type: "Sick Leave", from: "2026-03-25", to: "2026-03-25", days: 1, reason: "Doctor appointment", status: "Approved", appliedOn: "2026-03-23" },
  { id: "LR006", employee: "Lisa Taylor", empId: "EMP006", type: "Earned Leave", from: "2026-03-10", to: "2026-03-12", days: 3, reason: "Vacation", status: "Rejected", appliedOn: "2026-03-05" },
];

const statusColor: Record<string, string> = {
  Pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  Approved: "bg-green-500/10 text-green-600 border-green-200",
  Rejected: "bg-red-500/10 text-red-600 border-red-200",
};

const HRLeaves = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>(initialLeaves);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ employee: "", type: "Casual Leave", from: "", to: "", reason: "" });

  const filtered = leaves.filter((l) => {
    if (search && !l.employee.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && l.status !== statusFilter) return false;
    return true;
  });

  const handleAction = (id: string, action: "Approved" | "Rejected") => {
    setLeaves(leaves.map(l => l.id === id ? { ...l, status: action } : l));
    toast.success(`Leave ${action.toLowerCase()}`);
  };

  const handleApply = () => {
    if (!form.employee || !form.from || !form.to) { toast.error("Fill all required fields"); return; }
    const days = Math.ceil((new Date(form.to).getTime() - new Date(form.from).getTime()) / 86400000) + 1;
    const newLeave: LeaveRequest = {
      id: `LR${String(leaves.length + 1).padStart(3, "0")}`,
      employee: form.employee, empId: "EMP000", type: form.type,
      from: form.from, to: form.to, days, reason: form.reason,
      status: "Pending", appliedOn: new Date().toISOString().split("T")[0],
    };
    setLeaves([newLeave, ...leaves]);
    setShowApply(false);
    setForm({ employee: "", type: "Casual Leave", from: "", to: "", reason: "" });
    toast.success("Leave applied");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-xl font-semibold">Leave Management</h1>
            <p className="text-muted-foreground text-sm">Manage employee leave requests</p>
          </div>
          <Button size="sm" onClick={() => setShowApply(true)}><Plus className="h-4 w-4 mr-1" /> Apply Leave</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: leaves.length, icon: CalendarOff, color: "bg-primary/10 text-primary" },
            { label: "Pending", value: leaves.filter(l => l.status === "Pending").length, icon: Clock, color: "bg-amber-500/10 text-amber-600" },
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <p className="text-sm font-medium text-foreground">{l.employee}</p>
                      <p className="text-xs text-muted-foreground">{l.appliedOn}</p>
                    </TableCell>
                    <TableCell className="text-sm">{l.type}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{l.from} to {l.to}</TableCell>
                    <TableCell className="text-sm font-medium">{l.days}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">{l.reason}</TableCell>
                    <TableCell><Badge variant="outline" className={statusColor[l.status]}>{l.status}</Badge></TableCell>
                    <TableCell>
                      {l.status === "Pending" && (
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="text-green-600 h-8 px-2" onClick={() => handleAction(l.id, "Approved")}>
                            <CheckCircle2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" className="text-red-600 h-8 px-2" onClick={() => handleAction(l.id, "Rejected")}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={showApply} onOpenChange={setShowApply}>
          <DialogContent>
            <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Employee Name</Label><Input value={form.employee} onChange={(e) => setForm({ ...form, employee: e.target.value })} /></div>
              <div><Label>Leave Type</Label>
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
            <DialogFooter><Button onClick={handleApply}>Submit</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default HRLeaves;
