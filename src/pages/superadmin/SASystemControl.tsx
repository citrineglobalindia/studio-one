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
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Database, Search, Shield, Link2, AlertTriangle, CheckCircle2,
  ChevronDown, ChevronRight, Layers, Table2, Columns3,
  Workflow, HardDrive, Eye, RefreshCw, Loader2,
  CircleDot, ArrowRight, Lock, Unlock, BarChart3,
  Wrench, Eraser, Zap, Sparkles, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Module-to-table mapping
const MODULE_TABLE_MAP: Record<string, { tables: string[]; label: string; color: string }> = {
  "Sales CRM": { tables: ["leads", "clients", "quotations"], label: "Sales CRM", color: "text-blue-400" },
  "Operations": { tables: ["projects", "deliverables", "team_members"], label: "Operations", color: "text-violet-400" },
  "Finance": { tables: ["invoices", "expenses"], label: "Finance", color: "text-emerald-400" },
  "HR Module": { tables: ["employees", "attendance", "leaves"], label: "HR Module", color: "text-amber-400" },
  "Studio Assets": { tables: ["albums"], label: "Studio Assets", color: "text-pink-400" },
  "Platform Core": { tables: ["organizations", "organization_members", "profiles", "super_admins"], label: "Platform Core", color: "text-primary" },
  "Billing": { tables: ["subscriptions", "subscription_plans", "studio_module_restrictions"], label: "Billing & Config", color: "text-orange-400" },
};

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

// Smart default values per field type patterns
const SMART_DEFAULTS: Record<string, string> = {
  notes: "N/A",
  phone: "Not provided",
  email: "Not provided",
  city: "Not specified",
  venue: "TBD",
  address: "Not provided",
  source: "Direct",
  status: "active",
  partner_name: "N/A",
  assigned_to: "Unassigned",
  approved_by: "Pending",
  paid_to: "N/A",
  designer: "Unassigned",
  printer_name: "N/A",
  printer_contact: "N/A",
  event_name: "Untitled Event",
  project_name: "Untitled Project",
  display_name: "User",
  emergency_contact: "Not provided",
  emergency_phone: "Not provided",
  bank_name: "Not provided",
  bank_account: "Not provided",
  bank_ifsc: "Not provided",
  pan: "Not provided",
  aadhaar: "Not provided",
  reason: "N/A",
  description: "No description",
  category: "general",
  terms: "Standard terms apply",
  payment_terms: "Due on receipt",
  department: "general",
  delivery_hdd: "N/A",
  card_number: "N/A",
  raw_data_size: "N/A",
  backup_number: "N/A",
  receipt_url: "",
  pdf_file_name: "",
  pdf_file_path: "",
  invited_email: "",
  website: "",
  instagram: "",
  logo_url: "",
  avatar_url: "",
};

interface TableData {
  count: number;
  nullRates: Record<string, number>;
}

interface FixTarget {
  table: string;
  field: string;
  nullRate: number;
  defaultValue: string;
}

export default function SASystemControl() {
  const [tableData, setTableData] = useState<Record<string, TableData>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedTable, setExpandedTable] = useState<string | null>(null);

  // Fix dialog state
  const [fixDialogOpen, setFixDialogOpen] = useState(false);
  const [fixTarget, setFixTarget] = useState<FixTarget | null>(null);
  const [fixValue, setFixValue] = useState("");
  const [fixing, setFixing] = useState(false);
  const [fixedFields, setFixedFields] = useState<Set<string>>(new Set());

  // Bulk fix state
  const [bulkFixDialogOpen, setBulkFixDialogOpen] = useState(false);
  const [bulkFixTable, setBulkFixTable] = useState<string | null>(null);
  const [bulkFixing, setBulkFixing] = useState(false);
  const [bulkFixResults, setBulkFixResults] = useState<{ field: string; fixed: number }[]>([]);

  useEffect(() => {
    fetchSystemData();
  }, []);

  const fetchSystemData = async () => {
    setLoading(true);
    const tables = Object.keys(TABLE_SCHEMAS);
    const results: Record<string, TableData> = {};

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
    setFixedFields(new Set());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSystemData();
    setRefreshing(false);
  };

  // Single field fix
  const openFixDialog = (table: string, field: string, nullRate: number) => {
    const defaultVal = SMART_DEFAULTS[field] || "N/A";
    setFixTarget({ table, field, nullRate, defaultValue: defaultVal });
    setFixValue(defaultVal);
    setFixDialogOpen(true);
  };

  const handleFix = async () => {
    if (!fixTarget || !fixValue) return;
    setFixing(true);

    try {
      // Fetch rows where the field is null
      const { data: rows, error: fetchError } = await (supabase.from as any)(fixTarget.table)
        .select("id, " + fixTarget.field)
        .is(fixTarget.field, null);

      if (fetchError) throw fetchError;

      if (rows && rows.length > 0) {
        // Update in batches of 50
        const batchSize = 50;
        let totalFixed = 0;
        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          const ids = batch.map((r: any) => r.id);
          const { error: updateError } = await (supabase.from as any)(fixTarget.table)
            .update({ [fixTarget.field]: fixValue })
            .in("id", ids);
          if (updateError) throw updateError;
          totalFixed += batch.length;
        }

        setFixedFields(prev => new Set([...prev, `${fixTarget.table}.${fixTarget.field}`]));
        toast.success(`Fixed ${totalFixed} rows`, {
          description: `Set "${fixTarget.field}" to "${fixValue}" in ${fixTarget.table}`,
        });
      } else {
        toast.info("No null rows found — field may only have empty strings");
      }
    } catch (err: any) {
      toast.error("Fix failed", { description: err.message });
    }

    setFixing(false);
    setFixDialogOpen(false);
  };

  // Bulk fix all null fields in a table
  const openBulkFix = (table: string) => {
    setBulkFixTable(table);
    setBulkFixResults([]);
    setBulkFixDialogOpen(true);
  };

  const handleBulkFix = async () => {
    if (!bulkFixTable) return;
    setBulkFixing(true);
    const data = tableData[bulkFixTable];
    if (!data) return;

    const results: { field: string; fixed: number }[] = [];

    for (const [field, rate] of Object.entries(data.nullRates)) {
      if (rate === 0) continue;
      const defaultVal = SMART_DEFAULTS[field];
      if (!defaultVal) continue; // Skip fields we don't have defaults for

      try {
        const { data: rows } = await (supabase.from as any)(bulkFixTable)
          .select("id")
          .is(field, null);

        if (rows && rows.length > 0) {
          const batchSize = 50;
          let totalFixed = 0;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const ids = batch.map((r: any) => r.id);
            await (supabase.from as any)(bulkFixTable)
              .update({ [field]: defaultVal })
              .in("id", ids);
            totalFixed += batch.length;
          }
          results.push({ field, fixed: totalFixed });
          setFixedFields(prev => new Set([...prev, `${bulkFixTable}.${field}`]));
        }
      } catch {
        // skip failed fields
      }
    }

    setBulkFixResults(results);
    setBulkFixing(false);

    const totalFixed = results.reduce((s, r) => s + r.fixed, 0);
    if (totalFixed > 0) {
      toast.success(`Bulk fix complete`, {
        description: `Fixed ${results.length} fields, ${totalFixed} total rows in ${bulkFixTable}`,
      });
    } else {
      toast.info("No fixable null values found");
    }
  };

  const allTables = Object.keys(TABLE_SCHEMAS);
  const filteredTables = allTables.filter((t) => t.includes(search.toLowerCase()));
  const totalRows = Object.values(tableData).reduce((s, t) => s + t.count, 0);
  const totalFields = Object.values(TABLE_SCHEMAS).reduce((s, cols) => s + cols.length, 0);
  const tablesWithData = Object.entries(tableData).filter(([, d]) => d.count > 0).length;
  const emptyTables = allTables.length - tablesWithData;

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
                              const isFixed = fixedFields.has(`${table}.${col}`);
                              return (
                                <div key={col} className={cn(
                                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono group relative",
                                  isFixed ? "bg-emerald-500/10 text-emerald-400" :
                                  nullRate && nullRate >= 80 ? "bg-red-500/10 text-red-400" :
                                  nullRate && nullRate >= 50 ? "bg-amber-500/10 text-amber-400" :
                                  "bg-muted/40 text-muted-foreground"
                                )}>
                                  <span className="truncate">{col}</span>
                                  {isFixed && <Check className="h-3 w-3 text-emerald-400 shrink-0" />}
                                  {nullRate !== undefined && nullRate > 0 && !isFixed && (
                                    <>
                                      <span className="text-[9px] opacity-70 shrink-0">{nullRate}%∅</span>
                                      <button
                                        onClick={(e) => { e.stopPropagation(); openFixDialog(table, col, nullRate); }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0"
                                        title="Fix null values"
                                      >
                                        <Wrench className="h-3 w-3 text-primary hover:text-primary/80" />
                                      </button>
                                    </>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                    Missing Data Analysis
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Fields with NULL values — click Fix to fill with smart defaults</p>
                </div>
              </div>
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
                    const fixableCount = sortedFields.filter(([f]) => SMART_DEFAULTS[f]).length;

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
                            {fixableCount > 0 && (
                              <Button size="sm" variant="outline" className="h-6 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10" onClick={() => openBulkFix(table)}>
                                <Zap className="h-3 w-3" />
                                Fix All ({fixableCount})
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                          {sortedFields.slice(0, 12).map(([field, rate]) => {
                            const isFixed = fixedFields.has(`${table}.${field}`);
                            const hasSmart = !!SMART_DEFAULTS[field];
                            return (
                              <div key={field} className="flex items-center gap-2 group">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-mono text-muted-foreground truncate">{field}</span>
                                    <div className="flex items-center gap-1.5">
                                      {isFixed ? (
                                        <span className="text-[10px] font-medium text-emerald-400 flex items-center gap-0.5">
                                          <Check className="h-3 w-3" /> Fixed
                                        </span>
                                      ) : (
                                        <span className={cn(
                                          "text-[10px] font-medium",
                                          rate >= 80 ? "text-red-400" : rate >= 50 ? "text-amber-400" : "text-muted-foreground"
                                        )}>
                                          {rate}% null
                                        </span>
                                      )}
                                      {!isFixed && hasSmart && (
                                        <button
                                          onClick={() => openFixDialog(table, field, rate)}
                                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                                          title={`Fix with default: "${SMART_DEFAULTS[field]}"`}
                                        >
                                          <Wrench className="h-3 w-3 text-primary hover:text-primary/80" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  <Progress value={isFixed ? 100 : rate} className={cn("h-1.5", isFixed && "[&>div]:bg-emerald-500")} />
                                </div>
                              </div>
                            );
                          })}
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
                        <TableCell><span className="font-mono text-sm text-foreground">{rel.from}</span></TableCell>
                        <TableCell className="text-center"><ArrowRight className="h-3.5 w-3.5 text-muted-foreground mx-auto" /></TableCell>
                        <TableCell><span className="font-mono text-sm text-foreground">{rel.to}</span></TableCell>
                        <TableCell><Badge variant="outline" className="font-mono text-[10px]">{rel.via}</Badge></TableCell>
                        <TableCell>
                          {getModuleForTable(rel.from) && <Badge variant="secondary" className="text-[10px]">{getModuleForTable(rel.from)}</Badge>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

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

      {/* Single Fix Dialog */}
      <Dialog open={fixDialogOpen} onOpenChange={setFixDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-primary" />
              Fix Null Values
            </DialogTitle>
            <DialogDescription>
              Fill null values in <span className="font-mono font-semibold text-foreground">{fixTarget?.table}.{fixTarget?.field}</span> with a default value.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Null rate</span>
              <Badge className={cn(
                "text-xs",
                (fixTarget?.nullRate || 0) >= 80 ? "bg-red-500/15 text-red-400" : "bg-amber-500/15 text-amber-400"
              )}>
                {fixTarget?.nullRate}% null
              </Badge>
            </div>
            <div className="space-y-2">
              <Label>Default value to apply</Label>
              <Input
                value={fixValue}
                onChange={(e) => setFixValue(e.target.value)}
                placeholder="Enter default value..."
              />
              {fixTarget && SMART_DEFAULTS[fixTarget.field] && fixValue !== SMART_DEFAULTS[fixTarget.field] && (
                <button
                  className="text-[11px] text-primary hover:underline flex items-center gap-1"
                  onClick={() => setFixValue(SMART_DEFAULTS[fixTarget.field])}
                >
                  <Sparkles className="h-3 w-3" /> Use smart default: "{SMART_DEFAULTS[fixTarget.field]}"
                </button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFixDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleFix} disabled={fixing || !fixValue}>
              {fixing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
              {fixing ? "Fixing..." : "Apply Fix"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Fix Dialog */}
      <Dialog open={bulkFixDialogOpen} onOpenChange={setBulkFixDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Bulk Fix — {bulkFixTable}
            </DialogTitle>
            <DialogDescription>
              Automatically fill all null fields with smart default values.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {bulkFixTable && tableData[bulkFixTable] && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(tableData[bulkFixTable].nullRates)
                  .sort(([, a], [, b]) => b - a)
                  .map(([field, rate]) => {
                    const smartDefault = SMART_DEFAULTS[field];
                    const isFixed = fixedFields.has(`${bulkFixTable}.${field}`);
                    const result = bulkFixResults.find(r => r.field === field);
                    return (
                      <div key={field} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-foreground">{field}</span>
                          <span className="text-[10px] text-muted-foreground">{rate}% null</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {result ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">
                              <Check className="h-2.5 w-2.5 mr-0.5" /> {result.fixed} fixed
                            </Badge>
                          ) : isFixed ? (
                            <Badge className="bg-emerald-500/15 text-emerald-400 text-[10px]">
                              <Check className="h-2.5 w-2.5 mr-0.5" /> Done
                            </Badge>
                          ) : smartDefault ? (
                            <span className="text-[10px] text-muted-foreground">→ "{smartDefault}"</span>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/50 italic">no default</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkFixDialogOpen(false)}>
              {bulkFixResults.length > 0 ? "Done" : "Cancel"}
            </Button>
            {bulkFixResults.length === 0 && (
              <Button onClick={handleBulkFix} disabled={bulkFixing}>
                {bulkFixing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                {bulkFixing ? "Fixing..." : "Fix All Fields"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
