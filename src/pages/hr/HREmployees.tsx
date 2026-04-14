import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Users, UserCheck, UserPlus, Mail, MoreVertical, ArrowLeft, Loader2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { AddEmployeeForm, type EmployeeFormData } from "@/components/hr/AddEmployeeForm";
import { useEmployees } from "@/hooks/useEmployees";
import { useOrg } from "@/contexts/OrgContext";

const HREmployees = () => {
  const { organization } = useOrg();
  const { employees, isLoading, addEmployee, deleteEmployee } = useEmployees();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);

  const filtered = useMemo(() => {
    return employees.filter((e) => {
      if (search && !e.full_name.toLowerCase().includes(search.toLowerCase()) && !(e.email || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (deptFilter !== "all" && e.department !== deptFilter) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      return true;
    });
  }, [employees, search, deptFilter, statusFilter]);

  const handleAdd = (data: EmployeeFormData) => {
    if (!organization) return;
    addEmployee.mutate({
      organization_id: organization.id,
      full_name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      role: data.designation || "staff",
      department: data.department || null,
      type: "in-office",
      status: "active",
      join_date: new Date().toISOString().split("T")[0],
      salary: null,
      aadhaar: data.aadhaar || null,
      pan: data.pan || null,
      bank_name: null,
      bank_account: null,
      bank_ifsc: null,
      emergency_contact: null,
      emergency_phone: null,
      address: data.address || null,
      notes: null,
    }, {
      onSuccess: () => setShowAddForm(false),
    });
  };

  const statusColor: Record<string, string> = {
    active: "bg-green-500/10 text-green-600 border-green-200",
    "on-leave": "bg-amber-500/10 text-amber-600 border-amber-200",
    resigned: "bg-red-500/10 text-red-600 border-red-200",
  };

  const statusLabel: Record<string, string> = {
    active: "Active",
    "on-leave": "On Leave",
    resigned: "Resigned",
  };

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department).filter(Boolean));
    return Array.from(depts) as string[];
  }, [employees]);

  if (showAddForm) {
    return (
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
    );
  }

  return (
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
          { label: "Active", value: employees.filter(e => e.status === "active").length, icon: UserCheck, color: "bg-green-500/10 text-green-600" },
          { label: "On Leave", value: employees.filter(e => e.status === "on-leave").length, icon: UserPlus, color: "bg-amber-500/10 text-amber-600" },
          { label: "Resigned", value: employees.filter(e => e.status === "resigned").length, icon: Users, color: "bg-red-500/10 text-red-600" },
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
            {departments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on-leave">On Leave</SelectItem>
            <SelectItem value="resigned">Resigned</SelectItem>
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
                          {emp.full_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{emp.full_name}</p>
                          <p className="text-xs text-muted-foreground">{emp.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{emp.department || "—"}</TableCell>
                    <TableCell className="text-sm">{emp.role}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{emp.email || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColor[emp.status] || ""}>{statusLabel[emp.status] || emp.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{emp.join_date || "—"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toast.info("View profile coming soon")}>View Profile</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toast.info("Edit coming soon")}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteEmployee.mutate(emp.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && !isLoading && (
                  <TableRow><TableCell colSpan={7} className="text-center py-12 text-muted-foreground">No employees found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HREmployees;
