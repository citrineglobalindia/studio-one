import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Database, Search, Shield, Link2, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight, Layers, Table2, Columns3, Activity,
  Workflow, Server, HardDrive, Eye, RefreshCw, Loader2,
  CircleDot, ArrowRight, Lock, Unlock, BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Module-to-table mapping
const MODULE_TABLE_MAP: Record<string, { tables: string[]; label: string; color: string }> = {
  "Sales CRM": {
    tables: ["leads", "clients", "quotations"],
    label: "Sales CRM",
    color: "text-blue-400",
  },
  "Operations": {
    tables: ["projects", "deliverables", "team_members"],
    label: "Operations",
    color: "text-violet-400",
  },
  "Finance": {
    tables: ["invoices", "expenses"],
    label: "Finance",
    color: "text-emerald-400",
  },
  "HR Module": {
    tables: ["employees", "attendance", "leaves"],
    label: "HR Module",
    color: "text-amber-400",
  },
  "Studio Assets": {
    tables: ["albums"],
    label: "Studio Assets",
    color: "text-pink-400",
  },
  "Platform Core": {
    tables: ["organizations", "organization_members", "profiles", "super_admins"],
    label: "Platform Core",
    color: "text-primary",
  },
  "Billing": {
    tables: ["subscriptions", "subscription_plans", "studio_module_restrictions"],
    label: "Billing & Config",
    color: "text-orange-400",
  },
};

// Known column schemas
const TABLE_SCHEMAS: Record<string, string[]> = {
  organizations: ["id", "name", "slug", "logo_url", "owner_id", "city", "phone", "website", "instagram", "team_size", "specialties", "primary_color", "created_at", "updated_at"],
  organization_members: ["id", "organization_id", "user_id", "role", "invited_email", "invited_at", "joined_at", "created_at"],
  profiles: ["id", "user_id", "display_name", "avatar_url", "role", "created_at", "updated_at"],
  super_admins: ["id", "user_id", "created_at"],
  clients: ["id", "organization_id", "name", "partner_name", "email", "phone", "city", "event_type", "event_date", "delivery_date", "budget", "source", "status", "notes", "created_at", "updated_at"],
  leads: ["id", "organization_id", "name", "email", "phone", "city", "source", "event_type", "event_date", "budget", "status", "assigned_to", "follow_up_date", "notes", "converted_client_id", "created_at", "updated_at"],
  projects: ["id", "organization_id", "client_id", "project_name", "event_type", "event_date", "venue", "status", "total_amount", "amount_paid", "assigned_team", "notes", "card_number", "raw_data_size", "backup_number", "delivery_hdd", "created_at", "updated_at"],
  deliverables: ["id", "organization_id", "project_id", "deliverable_type", "title", "status", "priority", "assigned_to", "due_date", "delivered_date", "notes", "created_at", "updated_at"],
  invoices: ["id", "organization_id", "client_id", "project_id", "invoice_number", "client_name", "project_name", "items", "subtotal", "discount_type", "discount_value", "tax_percent", "total_amount", "amount_paid", "status", "due_date", "payment_terms", "notes", "created_at", "updated_at"],
  quotations: ["id", "organization_id", "client_id", "project_id", "quotation_number", "client_name", "project_name", "items", "subtotal", "discount_type", "discount_value", "tax_percent", "total_amount", "status", "valid_until", "terms", "notes", "created_at", "updated_at"],
  team_members: ["id", "organization_id", "user_id", "full_name", "role", "email", "phone", "specialties", "experience_years", "daily_rate", "rating", "availability", "notes", "created_at", "updated_at"],
  employees: ["id", "organization_id", "full_name", "email", "phone", "role", "department", "type", "status", "join_date", "salary", "aadhaar", "pan", "bank_name", "bank_account", "bank_ifsc", "emergency_contact", "emergency_phone", "address", "notes", "created_at", "updated_at"],
  attendance: ["id", "organization_id", "employee_id", "date", "status", "clock_in", "clock_out", "total_hours", "notes", "created_at", "updated_at"],
  leaves: ["id", "organization_id", "employee_id", "employee_name", "leave_type", "from_date", "to_date", "days", "reason", "status", "applied_on", "approved_by", "created_at", "updated_at"],
  expenses: ["id", "client_name", "event_name", "project_name", "category", "description", "amount", "expense_date", "submitted_by", "paid_to", "approval_status", "approved_by", "approved_at", "receipt_url", "notes", "created_at", "updated_at"],
  albums: ["id", "organization_id", "client_id", "client_name", "project_name", "album_type", "status", "event_name", "event_date", "designer", "pages", "paper_type", "cover_type", "album_size", "printer_name", "printer_contact", "printing_cost", "pdf_file_name", "pdf_file_path", "pdf_file_size", "notes", "created_at", "updated_at"],
  subscriptions: ["id", "organization_id", "plan_id", "status", "trial_ends_at", "current_period_start", "current_period_end", "cancelled_at", "created_at", "updated_at"],
  subscription_plans: ["id", "name", "slug", "price", "billing_period", "max_clients", "max_projects", "max_team_members", "features", "is_active", "sort_order", "created_at"],
  studio_module_restrictions: ["id", "organization_id", "restricted_modules", "created_at", "updated_at"],
};

const RELATIONSHIPS = [
  { from: "clients", to: "organizations", via: "organization_id" },
  { from: "leads", to: "organizations", via: "organization_id" },
  { from: "leads", to: "clients", via: "converted_client_id" },
  { from: "projects", to: "organizations", via: "organization_id" },
  { from: "projects", to: "clients", via: "client_id" },
  { from: "deliverables", to: "organizations", via: "organization_id" },
  { from: "deliverables", to: "projects", via: "project_id" },
  { from: "invoices", to: "organizations", via: "organization_id" },
  { from: "invoices", to: "clients", via: "client_id" },
  { from: "invoices", to: "projects", via: "project_id" },
  { from: "quotations", to: "organizations", via: "organization_id" },
  { from: "quotations", to: "clients", via: "client_id" },
  { from: "quotations", to: "projects", via: "project_id" },
  { from: "team_members", to: "organizations", via: "organization_id" },
  { from: "employees", to: "organizations", via: "organization_id" },
  { from: "attendance", to: "organizations", via: "organization_id" },
  { from: "attendance", to: "employees", via: "employee_id" },
  { from: "leaves", to: "organizations", via: "organization_id" },
  { from: "leaves", to: "employees", via: "employee_id" },
  { from: "albums", to: "organizations", via: "organization_id" },
  { from: "albums", to: "clients", via: "client_id" },
  { from: "organization_members", to: "organizations", via: "organization_id" },
  { from: "subscriptions", to: "organizations", via: "organization_id" },
  { from: "subscriptions", to: "subscription_plans", via: "plan_id" },
  { from: "studio_module_restrictions", to: "organizations", via: "organization_id" },
];

interface TableData {
  count: number;
  nullRates: Record<string, number>; // field => % null
}

export default function SASystemControl() {
  const [tableData, setTableData] = useState<Record<string, TableData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    setLoading(true);
    const tables = Object.keys(TABLE_SCHEMAS);
    const results: Record<string, TableData> = {};

    // Fetch counts + sample data for null analysis in parallel batches
    const batchSize = 5;
    for (let i = 0; i < tables.length; i += batchSize) {
      const batch = tables.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (table) => {
          try {
            const { count } = await (supabase.from as any)(table).select("*", { count: "exact", head: true });
            const { data: rows } = await (supabase.from as any)(table).select("*").limit(100);

            const nullRates: Record<string, number> = {};
            if (rows && rows.length > 0) {
              const columns = TABLE_SCHEMAS[table] || Object.keys(rows[0]);
              for (const col of columns) {
                if (["id", "created_at", "updated_at"].includes(col)) continue;
                const nullCount = rows.filter((r: any) => r[col] === null || r[col] === "" || r[col] === undefined).length;
                if (nullCount > 0) {
                  nullRates[col] = Math.round((nullCount / rows.length) * 100);
                }
              }
            }

            results[table] = { count: count || 0, nullRates };
          } catch {
            results[table] = { count: 0, nullRates: {} };
          }
        })
      );
    }

    setTableData(results);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSystemData();
    setRefreshing(false);
  };

  const allTables = Object.keys(TABLE_SCHEMAS);
  const filteredTables = allTables.filter((t) => t.includes(search.toLowerCase()));
  const totalRows = Object.values(tableData).reduce((s, t) => s + t.count, 0);
  const totalFields = Object.values(TABLE_SCHEMAS).reduce((s, cols) => s + cols.length, 0);
  const tablesWithData = Object.entries(tableData).filter(([, d]) => d.count > 0).length;
  const emptyTables = allTables.length - tablesWithData;

  // Data quality score
  const qualityScore = useMemo(() => {
    let totalChecked = 0;
    let totalClean = 0;
    Object.entries(tableData).forEach(([table, data]) => {
      if (data.count === 0) return;
      const cols = TABLE_SCHEMAS[table]?.filter((c) => !["id", "created_at", "updated_at"].includes(c)) || [];
      cols.forEach((col) => {
        totalChecked++;
        const nullRate = data.nullRates[col] || 0;
        if (nullRate < 50) totalClean++;
      });
    });
    return totalChecked > 0 ? Math.round((totalClean / totalChecked) * 100) : 100;
  }, [tableData]);

  // Find tables with missing org_id (should have RLS)
  const missingOrgTables = allTables.filter((t) => {
    const cols = TABLE_SCHEMAS[t] || [];
    return !cols.includes("organization_id") && !["profiles", "super_admins", "subscription_plans"].includes(t);
  });

  const getModuleForTable = (table: string): string | null => {
    for (const [module, info] of Object.entries(MODULE_TABLE_MAP)) {
      if (info.tables.includes(table)) return module;
    }
    return null;
  };

  const getModuleColor = (table: string): string => {
    const module = getModuleForTable(table);
    return module ? MODULE_TABLE_MAP[module].color : "text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Scanning system schema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Database className="h-6 w-6 text-primary" />
            System Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Database schema, module linkage, and data quality analysis</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
          {refreshing ? "Scanning..." : "Refresh Scan"}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Table2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{allTables.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tables</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Columns3 className="h-5 w-5 text-violet-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{totalFields}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Fields</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <HardDrive className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{totalRows.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Rows</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Link2 className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{RELATIONSHIPS.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Relations</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              qualityScore >= 80 ? "bg-emerald-500/10" : qualityScore >= 50 ? "bg-amber-500/10" : "bg-red-500/10"
            )}>
              <BarChart3 className={cn(
                "h-5 w-5",
                qualityScore >= 80 ? "text-emerald-400" : qualityScore >= 50 ? "text-amber-400" : "text-red-400"
              )} />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{qualityScore}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Data Quality</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="modules" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="modules">Module Map</TabsTrigger>
          <TabsTrigger value="tables">All Tables</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="relations">Relations</TabsTrigger>
        </TabsList>

        {/* MODULE MAP TAB */}
        <TabsContent value="modules" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Object.entries(MODULE_TABLE_MAP).map(([module, info]) => (
              <Card key={module} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Layers className={`h-4 w-4 ${info.color}`} />
                    {info.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {info.tables.map((table) => {
                    const data = tableData[table];
                    const cols = TABLE_SCHEMAS[table] || [];
                    const hasOrg = cols.includes("organization_id");
                    const nullFieldCount = data ? Object.keys(data.nullRates).length : 0;

                    return (
                      <div key={table} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <CircleDot className={cn("h-3 w-3", data && data.count > 0 ? "text-emerald-400" : "text-muted-foreground/40")} />
                          <div>
                            <p className="text-sm font-mono font-medium text-foreground">{table}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{cols.length} cols</span>
                              <span className="text-[10px] text-muted-foreground">•</span>
                              <span className="text-[10px] text-muted-foreground">{data?.count || 0} rows</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {hasOrg && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-emerald-400 border-emerald-500/30">
                              <Lock className="h-2.5 w-2.5 mr-0.5" /> RLS
                            </Badge>
                          )}
                          {nullFieldCount > 0 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-amber-400 border-amber-500/30">
                              {nullFieldCount} gaps
                            </Badge>
                          )}
                          {data && data.count === 0 && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 text-muted-foreground">
                              Empty
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ALL TABLES TAB */}
        <TabsContent value="tables" className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tables..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {filteredTables.map((table) => {
                  const cols = TABLE_SCHEMAS[table] || [];
                  const data = tableData[table];
                  const isExpanded = expandedTable === table;
                  const module = getModuleForTable(table);

                  return (
                    <Collapsible key={table} open={isExpanded} onOpenChange={() => setExpandedTable(isExpanded ? null : table)}>
                      <CollapsibleTrigger className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                          <Table2 className={cn("h-4 w-4", getModuleColor(table))} />
                          <span className="font-mono text-sm font-medium text-foreground">{table}</span>
                          {module && <Badge variant="secondary" className="text-[9px] ml-2">{module}</Badge>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">{cols.length} columns</span>
                          <Badge variant={data && data.count > 0 ? "default" : "outline"} className="text-xs">
                            {data?.count || 0} rows
                          </Badge>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="px-5 pb-4 pl-12">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                            {cols.map((col) => {
                              const nullRate = data?.nullRates[col];
                              return (
                                <div key={col} className={cn(
                                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono",
                                  nullRate && nullRate >= 80 ? "bg-red-500/10 text-red-400" :
                                  nullRate && nullRate >= 50 ? "bg-amber-500/10 text-amber-400" :
                                  "bg-muted/40 text-muted-foreground"
                                )}>
                                  <span className="truncate">{col}</span>
                                  {nullRate !== undefined && nullRate > 0 && (
                                    <span className="text-[9px] opacity-70 shrink-0">{nullRate}%∅</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* DATA QUALITY TAB */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                Missing Data Analysis
              </CardTitle>
              <p className="text-xs text-muted-foreground">Fields with NULL values across sampled rows (up to 100)</p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {Object.entries(tableData)
                  .filter(([, data]) => Object.keys(data.nullRates).length > 0)
                  .sort(([, a], [, b]) => {
                    const aMax = Math.max(...Object.values(a.nullRates), 0);
                    const bMax = Math.max(...Object.values(b.nullRates), 0);
                    return bMax - aMax;
                  })
                  .map(([table, data]) => {
                    const sortedFields = Object.entries(data.nullRates).sort(([, a], [, b]) => b - a);
                    const critical = sortedFields.filter(([, v]) => v >= 80);
                    const warning = sortedFields.filter(([, v]) => v >= 50 && v < 80);
                    const minor = sortedFields.filter(([, v]) => v < 50);

                    return (
                      <div key={table} className="px-5 py-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Table2 className={cn("h-4 w-4", getModuleColor(table))} />
                            <span className="font-mono text-sm font-medium text-foreground">{table}</span>
                            <span className="text-xs text-muted-foreground">({data.count} rows)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {critical.length > 0 && <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">{critical.length} critical</Badge>}
                            {warning.length > 0 && <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">{warning.length} warning</Badge>}
                            {minor.length > 0 && <Badge variant="outline" className="text-[10px]">{minor.length} minor</Badge>}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {sortedFields.slice(0, 12).map(([field, rate]) => (
                            <div key={field} className="flex items-center gap-2">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-mono text-muted-foreground truncate">{field}</span>
                                  <span className={cn(
                                    "text-[10px] font-medium",
                                    rate >= 80 ? "text-red-400" : rate >= 50 ? "text-amber-400" : "text-muted-foreground"
                                  )}>
                                    {rate}% null
                                  </span>
                                </div>
                                <Progress
                                  value={rate}
                                  className="h-1.5"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                {Object.entries(tableData).filter(([, d]) => Object.keys(d.nullRates).length > 0).length === 0 && (
                  <div className="py-16 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>All fields are populated — no missing data detected!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Empty Tables */}
          {emptyTables > 0 && (
            <Card className="border-amber-500/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4 text-amber-400" />
                  Empty Tables ({emptyTables})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {allTables.filter((t) => !tableData[t] || tableData[t].count === 0).map((table) => (
                    <Badge key={table} variant="outline" className="font-mono text-xs">{table}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* RELATIONS TAB */}
        <TabsContent value="relations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Workflow className="h-4 w-4 text-primary" />
                Foreign Key Relationships ({RELATIONSHIPS.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>From Table</TableHead>
                      <TableHead className="w-12 text-center"></TableHead>
                      <TableHead>To Table</TableHead>
                      <TableHead>Via Column</TableHead>
                      <TableHead>Module</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {RELATIONSHIPS.map((rel, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <span className="font-mono text-sm text-foreground">{rel.from}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground mx-auto" />
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-sm text-foreground">{rel.to}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">{rel.via}</Badge>
                        </TableCell>
                        <TableCell>
                          {getModuleForTable(rel.from) && (
                            <Badge variant="secondary" className="text-[10px]">{getModuleForTable(rel.from)}</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Security Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                RLS Security Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {allTables.map((table) => {
                  const cols = TABLE_SCHEMAS[table] || [];
                  const hasOrg = cols.includes("organization_id");
                  const isSystem = ["profiles", "super_admins", "subscription_plans"].includes(table);

                  return (
                    <div key={table} className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg",
                      hasOrg ? "bg-emerald-500/10" : isSystem ? "bg-blue-500/10" : "bg-amber-500/10"
                    )}>
                      {hasOrg ? <Lock className="h-3 w-3 text-emerald-400" /> :
                       isSystem ? <Shield className="h-3 w-3 text-blue-400" /> :
                       <Unlock className="h-3 w-3 text-amber-400" />}
                      <span className="font-mono text-xs text-foreground truncate">{table}</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Lock className="h-3 w-3 text-emerald-400" /> Org-scoped RLS</span>
                <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-blue-400" /> System table</span>
                <span className="flex items-center gap-1"><Unlock className="h-3 w-3 text-amber-400" /> Special policy</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
