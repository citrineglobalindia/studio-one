import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, IndianRupee, FileText, CheckCircle2, Clock, AlertTriangle,
  TrendingUp, Download, CreditCard, Receipt, ArrowUpRight,
} from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: string;
  client: string;
  amount: number;
  date: string;
  method: string;
  status: "Verified" | "Pending" | "Failed";
  reference: string;
  service: string;
}

interface Expense {
  id: string;
  description: string;
  category: string;
  amount: number;
  date: string;
  status: "Approved" | "Pending" | "Rejected";
  paidTo: string;
}

const mockPayments: Payment[] = [
  { id: "PAY001", client: "Anderson Wedding", amount: 5000, date: "2026-04-05", method: "Bank Transfer", status: "Verified", reference: "TXN-9876543", service: "Wedding Photography" },
  { id: "PAY002", client: "Miller Corp", amount: 2500, date: "2026-04-04", method: "Credit Card", status: "Verified", reference: "TXN-9876544", service: "Corporate Event" },
  { id: "PAY003", client: "Johnson Family", amount: 1800, date: "2026-04-03", method: "UPI", status: "Pending", reference: "TXN-9876545", service: "Family Portrait" },
  { id: "PAY004", client: "Smith Wedding", amount: 7500, date: "2026-04-02", method: "Bank Transfer", status: "Verified", reference: "TXN-9876546", service: "Wedding Package" },
  { id: "PAY005", client: "Davis Inc", amount: 3200, date: "2026-04-01", method: "Check", status: "Failed", reference: "TXN-9876547", service: "Product Shoot" },
  { id: "PAY006", client: "Brown Engagement", amount: 1500, date: "2026-03-30", method: "Cash", status: "Pending", reference: "TXN-9876548", service: "Engagement Shoot" },
];

const mockExpenses: Expense[] = [
  { id: "EXP001", description: "Camera Lens Purchase", category: "Equipment", amount: 2400, date: "2026-04-04", status: "Approved", paidTo: "Canon Store" },
  { id: "EXP002", description: "Studio Rent - April", category: "Rent", amount: 3500, date: "2026-04-01", status: "Approved", paidTo: "Property Owner" },
  { id: "EXP003", description: "Editing Software License", category: "Software", amount: 600, date: "2026-04-03", status: "Pending", paidTo: "Adobe Inc" },
  { id: "EXP004", description: "Travel to Client Venue", category: "Travel", amount: 350, date: "2026-04-02", status: "Approved", paidTo: "Travel Agency" },
  { id: "EXP005", description: "Backdrop Purchase", category: "Supplies", amount: 800, date: "2026-03-28", status: "Rejected", paidTo: "Prop Store" },
];

const fmt = (n: number) => `$${n.toLocaleString()}`;

const paymentStatusColor: Record<string, string> = {
  Verified: "bg-green-500/10 text-green-600 border-green-200",
  Pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  Failed: "bg-red-500/10 text-red-600 border-red-200",
};

const expenseStatusColor: Record<string, string> = {
  Approved: "bg-green-500/10 text-green-600 border-green-200",
  Pending: "bg-amber-500/10 text-amber-600 border-amber-200",
  Rejected: "bg-red-500/10 text-red-600 border-red-200",
};

const AccountsPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const totalRevenue = mockPayments.filter(p => p.status === "Verified").reduce((s, p) => s + p.amount, 0);
  const pendingPayments = mockPayments.filter(p => p.status === "Pending").reduce((s, p) => s + p.amount, 0);
  const totalExpenses = mockExpenses.filter(e => e.status === "Approved").reduce((s, e) => s + e.amount, 0);

  const filteredPayments = useMemo(() => {
    return mockPayments.filter((p) => {
      if (search && !p.client.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      return true;
    });
  }, [search, statusFilter]);

  const filteredExpenses = useMemo(() => {
    return mockExpenses.filter((e) => {
      if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && e.status !== statusFilter) return false;
      return true;
    });
  }, [search, statusFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-primary rounded" />
            <div>
              <h1 className="text-foreground text-xl font-semibold">Accounts</h1>
              <p className="text-muted-foreground text-sm">Financial overview and management</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast.success("Report exported")}>
            <Download className="h-4 w-4 mr-1" /> Export
          </Button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Revenue", value: fmt(totalRevenue), icon: TrendingUp, color: "bg-green-500/10 text-green-600", sub: "Verified payments" },
            { label: "Pending", value: fmt(pendingPayments), icon: Clock, color: "bg-amber-500/10 text-amber-600", sub: "Awaiting verification" },
            { label: "Expenses", value: fmt(totalExpenses), icon: Receipt, color: "bg-blue-500/10 text-blue-600", sub: "Approved expenses" },
            { label: "Net Profit", value: fmt(totalRevenue - totalExpenses), icon: ArrowUpRight, color: "bg-primary/10 text-primary", sub: "Revenue - Expenses" },
          ].map((k) => (
            <Card key={k.label}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl ${k.color} flex items-center justify-center`}><k.icon className="h-5 w-5" /></div>
                  <div>
                    <p className="text-xl font-bold text-foreground">{k.value}</p>
                    <p className="text-xs text-muted-foreground">{k.label}</p>
                    {k.sub && <p className="text-[10px] text-muted-foreground mt-0.5">{k.sub}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={(t) => { setActiveTab(t); setSearch(""); setStatusFilter("all"); }}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview" className="space-y-6 mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base">Recent Payments</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {mockPayments.slice(0, 4).map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.client}</p>
                        <p className="text-xs text-muted-foreground">{p.service} · {p.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{fmt(p.amount)}</p>
                        <Badge variant="outline" className={paymentStatusColor[p.status] + " text-[10px]"}>{p.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Recent Expenses</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {mockExpenses.slice(0, 4).map((e) => (
                    <div key={e.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                      <div>
                        <p className="text-sm font-medium text-foreground">{e.description}</p>
                        <p className="text-xs text-muted-foreground">{e.category} · {e.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-foreground">{fmt(e.amount)}</p>
                        <Badge variant="outline" className={expenseStatusColor[e.status] + " text-[10px]"}>{e.status}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments */}
          <TabsContent value="payments" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search payments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><span className="text-sm font-medium text-foreground">{p.client}</span></TableCell>
                        <TableCell className="text-sm">{p.service}</TableCell>
                        <TableCell className="text-sm font-bold">{fmt(p.amount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.method}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.date}</TableCell>
                        <TableCell><Badge variant="outline" className={paymentStatusColor[p.status]}>{p.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expenses */}
          <TabsContent value="expenses" className="space-y-4 mt-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search expenses..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Paid To</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredExpenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell><span className="text-sm font-medium text-foreground">{e.description}</span></TableCell>
                        <TableCell className="text-sm">{e.category}</TableCell>
                        <TableCell className="text-sm font-bold">{fmt(e.amount)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.paidTo}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{e.date}</TableCell>
                        <TableCell><Badge variant="outline" className={expenseStatusColor[e.status]}>{e.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AccountsPage;
