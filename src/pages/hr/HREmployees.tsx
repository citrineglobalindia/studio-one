import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Users, UserCheck, UserPlus, Mail, MoreVertical, ArrowLeft } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AddEmployeeForm, type EmployeeFormData } from "@/components/hr/AddEmployeeForm";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  status: "Active" | "On Leave" | "Resigned";
  joinDate: string;
}

const initialEmployees: Employee[] = [
  { id: "EMP001", name: "John Smith", email: "john@studio.com", phone: "+1-555-0101", department: "Engineering", designation: "Senior Developer", status: "Active", joinDate: "2024-03-15" },
  { id: "EMP002", name: "Sarah Wilson", email: "sarah@studio.com", phone: "+1-555-0102", department: "Marketing", designation: "Marketing Lead", status: "Active", joinDate: "2024-06-01" },
  { id: "EMP003", name: "Mike Johnson", email: "mike@studio.com", phone: "+1-555-0103", department: "Sales", designation: "Sales Executive", status: "On Leave", joinDate: "2025-01-10" },
  { id: "EMP004", name: "Emily Davis", email: "emily@studio.com", phone: "+1-555-0104", department: "HR", designation: "HR Manager", status: "Active", joinDate: "2023-11-20" },
  { id: "EMP005", name: "David Brown", email: "david@studio.com", phone: "+1-555-0105", department: "Finance", designation: "Accountant", status: "Active", joinDate: "2024-09-05" },
  { id: "EMP006", name: "Lisa Taylor", email: "lisa@studio.com", phone: "+1-555-0106", department: "Operations", designation: "Operations Manager", status: "Active", joinDate: "2024-02-14" },
  { id: "EMP007", name: "James Anderson", email: "james@studio.com", phone: "+1-555-0107", department: "Engineering", designation: "Junior Developer", status: "Active", joinDate: "2025-08-01" },
  { id: "EMP008", name: "Anna Martinez", email: "anna@studio.com", phone: "+1-555-0108", department: "Engineering", designation: "QA Engineer", status: "Resigned", joinDate: "2024-04-20" },
];

const HREmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.email.toLowerCase().includes(search.toLowerCase())) return false;
      if (deptFilter !== "all" && e.department !== deptFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      return true;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const handleAdd = (data: EmployeeFormData) => {
    const newEmp: Employee = {
      id: `EMP${String(employees.length + 1).padStart(3, "0")}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      department: data.department,
      designation: data.designation,
      status: "Active",
      joinDate: new Date().toISOString().split("T")[0],
    };
    setEmployees([newEmp, ...employees]);
    setShowAddForm(false);
    toast.success("Employee added successfully");
  };

  const statusColor: Record<string, string> = {
    Active: "bg-green-500/10 text-green-600 border-green-200",
    "On Leave": "bg-amber-500/10 text-amber-600 border-amber-200",
    Resigned: "bg-red-500/10 text-red-600 border-red-200",
  };

  if (showAddForm) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowAddForm(false)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-foreground text-xl font-semibold">Add New Employee</h1>
              <p className="text-muted-foreground text-sm">Fill in all required details to register a new employee</p>
            </div>
          </div>
          <AddEmployeeForm onSubmit={handleAdd} onCancel={() => setShowAddForm(false)} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-foreground text-xl font-semibold">Employees</h1>
            <p className="text-muted-foreground text-sm">Manage your workforce</p>
          </div>
          <Button size="sm" onClick={() => setShowAddForm(true)}><Plus className="h-4 w-4 mr-1" /> Add Employee</Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total", value: employees.length, icon: Users, color: "bg-primary/10 text-primary" },
            { label: "Active", value: employees.filter(e => e.status === "Active").length, icon: UserCheck, color: "bg-green-500/10 text-green-600" },
            { label: "On Leave", value: employees.filter(e => e.status === "On Leave").length, icon: UserPlus, color: "bg-amber-500/10 text-amber-600" },
            { label: "Resigned", value: employees.filter(e => e.status === "Resigned").length, icon: Users, color: "bg-red-500/10 text-red-600" },
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
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {["Engineering", "Marketing", "Sales", "HR", "Finance", "Operations"].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="On Leave">On Leave</SelectItem>
              <SelectItem value="Resigned">Resigned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((emp) => (
                  <TableRow key={emp.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                          {emp.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.id}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{emp.department}</TableCell>
                    <TableCell className="text-sm">{emp.designation}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{emp.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[emp.status]}>{emp.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.joinDate}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info("View profile coming soon")}>View Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Edit coming soon")}>Edit</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No employees found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default HREmployees;
