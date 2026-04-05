import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock, UserCheck, UserX, AlertTriangle, Calendar } from "lucide-react";

const attendanceRecords = [
  { id: "1", name: "John Smith", empId: "EMP001", date: "2026-04-05", checkIn: "09:02 AM", checkOut: "06:15 PM", status: "Present", hours: "9h 13m" },
  { id: "2", name: "Sarah Wilson", empId: "EMP002", date: "2026-04-05", checkIn: "09:30 AM", checkOut: "06:00 PM", status: "Late", hours: "8h 30m" },
  { id: "3", name: "Mike Johnson", empId: "EMP003", date: "2026-04-05", checkIn: "-", checkOut: "-", status: "On Leave", hours: "-" },
  { id: "4", name: "Emily Davis", empId: "EMP004", date: "2026-04-05", checkIn: "08:55 AM", checkOut: "05:50 PM", status: "Present", hours: "8h 55m" },
  { id: "5", name: "David Brown", empId: "EMP005", date: "2026-04-05", checkIn: "-", checkOut: "-", status: "Absent", hours: "-" },
  { id: "6", name: "Lisa Taylor", empId: "EMP006", date: "2026-04-05", checkIn: "09:00 AM", checkOut: "06:30 PM", status: "Present", hours: "9h 30m" },
  { id: "7", name: "James Anderson", empId: "EMP007", date: "2026-04-05", checkIn: "09:45 AM", checkOut: "06:00 PM", status: "Late", hours: "8h 15m" },
];

const statusColor: Record<string, string> = {
  Present: "bg-green-500/10 text-green-600 border-green-200",
  Late: "bg-amber-500/10 text-amber-600 border-amber-200",
  Absent: "bg-red-500/10 text-red-600 border-red-200",
  "On Leave": "bg-blue-500/10 text-blue-600 border-blue-200",
};

const HRAttendance = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = attendanceRecords.filter((r) => {
    if (search && !r.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    return true;
  });

  const stats = {
    present: attendanceRecords.filter(r => r.status === "Present").length,
    late: attendanceRecords.filter(r => r.status === "Late").length,
    absent: attendanceRecords.filter(r => r.status === "Absent").length,
    onLeave: attendanceRecords.filter(r => r.status === "On Leave").length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-foreground text-xl font-semibold">Attendance Management</h1>
          <p className="text-muted-foreground text-sm">Track daily attendance records</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Present", value: stats.present, icon: UserCheck, color: "bg-green-500/10 text-green-600" },
            { label: "Late", value: stats.late, icon: Clock, color: "bg-amber-500/10 text-amber-600" },
            { label: "Absent", value: stats.absent, icon: UserX, color: "bg-red-500/10 text-red-600" },
            { label: "On Leave", value: stats.onLeave, icon: Calendar, color: "bg-blue-500/10 text-blue-600" },
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
            <Input placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Present">Present</SelectItem>
              <SelectItem value="Late">Late</SelectItem>
              <SelectItem value="Absent">Absent</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-foreground">{r.name}</p>
                        <p className="text-xs text-muted-foreground">{r.empId}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{r.date}</TableCell>
                    <TableCell className="text-sm">{r.checkIn}</TableCell>
                    <TableCell className="text-sm">{r.checkOut}</TableCell>
                    <TableCell className="text-sm font-medium">{r.hours}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[r.status]}>{r.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HRAttendance;
