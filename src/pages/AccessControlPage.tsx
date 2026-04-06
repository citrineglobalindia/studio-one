import React, { useState, useMemo } from "react";
import { useRole, ALL_ROLES, ALL_MODULES, type AppRole, type AppModule } from "@/contexts/RoleContext";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Save, Search, Users, Pencil, Phone, Camera, Video,
  UserCog, Calculator, LayoutGrid, Table2, RotateCcw, CheckCheck,
  XCircle, ChevronDown, ChevronRight, Sparkles, Lock, Unlock,
  BarChart3, Megaphone, Bot, Heart, Settings, Bell, FolderKanban,
  Receipt, FileText, CalendarDays, ListTodo, UsersRound,
  MessageSquare, Zap, BrainCircuit, ClipboardList, UserCheck,
  Clock, Palmtree, Plus, SlidersHorizontal, MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

const ROLE_META: Record<string, { icon: React.ElementType; color: string; description: string }> = {
  vendor: { icon: Users, color: "text-blue-400", description: "External vendors & partners" },
  editor: { icon: Pencil, color: "text-purple-400", description: "Photo & video editors" },
  telecaller: { icon: Phone, color: "text-green-400", description: "Lead callers & follow-ups" },
  videographer: { icon: Video, color: "text-rose-400", description: "Video shoot & production" },
  photographer: { icon: Camera, color: "text-amber-400", description: "Photography team" },
  hr: { icon: UserCog, color: "text-cyan-400", description: "Human resources management" },
  accounts: { icon: Calculator, color: "text-emerald-400", description: "Finance & accounting" },
};

const GROUP_ICONS: Record<string, React.ElementType> = {
  "Sales CRM": Megaphone,
  Operations: FolderKanban,
  Finance: Receipt,
  Growth: BarChart3,
  "AI & Smart Tools": Bot,
  "HR Module": Heart,
  System: Settings,
};

const MODULE_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutGrid,
  leads: ClipboardList,
  clients: UsersRound,
  quotations: FileText,
  projects: FolderKanban,
  calendar: CalendarDays,
  tasks: ListTodo,
  team: Users,
  invoices: Receipt,
  contracts: FileText,
  communications: MessageSquare,
  marketing: Megaphone,
  analytics: BarChart3,
  automation: Zap,
  "ai-assistant": BrainCircuit,
  "ai-selection": Sparkles,
  "hr-dashboard": UserCog,
  "hr-employees": UserCheck,
  "hr-attendance": Clock,
  "hr-leaves": Palmtree,
  notifications: Bell,
  "accounts-page": Calculator,
  profile: Users,
  settings: Settings,
};

type ViewMode = "cards" | "matrix";

export default function AccessControlPage() {
  const { roleAccess, setRoleAccess } = useRole();
  const [selectedRole, setSelectedRole] = useState<AppRole>("vendor");
  const [localAccess, setLocalAccess] = useState(roleAccess);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("cards");
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [hasChanges, setHasChanges] = useState(false);
  const [advancedEditRole, setAdvancedEditRole] = useState<AppRole | null>(null);

  const nonAdminRoles = ALL_ROLES.filter((r) => r.value !== "admin");
  const groups = [...new Set(ALL_MODULES.map((m) => m.group))];

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return ALL_MODULES;
    const q = searchQuery.toLowerCase();
    return ALL_MODULES.filter(
      (m) => m.label.toLowerCase().includes(q) || m.group.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const currentModules = localAccess[selectedRole] ?? [];
  const totalModules = ALL_MODULES.length;
  const enabledCount = currentModules.length;
  const percentage = Math.round((enabledCount / totalModules) * 100);

  const toggleModule = (mod: AppModule) => {
    setLocalAccess((prev) => {
      const current = prev[selectedRole] ?? [];
      const updated = current.includes(mod)
        ? current.filter((m) => m !== mod)
        : [...current, mod];
      return { ...prev, [selectedRole]: updated };
    });
    setHasChanges(true);
  };

  const toggleGroup = (group: string, enable: boolean) => {
    const groupModules = ALL_MODULES.filter((m) => m.group === group).map((m) => m.value);
    setLocalAccess((prev) => {
      const current = prev[selectedRole] ?? [];
      const updated = enable
        ? [...new Set([...current, ...groupModules])]
        : current.filter((m) => !groupModules.includes(m));
      return { ...prev, [selectedRole]: updated };
    });
    setHasChanges(true);
  };

  const enableAll = () => {
    setLocalAccess((prev) => ({
      ...prev,
      [selectedRole]: ALL_MODULES.map((m) => m.value),
    }));
    setHasChanges(true);
  };

  const disableAll = () => {
    setLocalAccess((prev) => ({ ...prev, [selectedRole]: [] }));
    setHasChanges(true);
  };

  const resetToDefault = () => {
    const defaultAccess = {
      vendor: ["dashboard", "projects", "calendar", "tasks", "communications", "notifications", "profile"],
      editor: ["dashboard", "projects", "tasks", "communications", "notifications", "profile"],
      telecaller: ["dashboard", "leads", "clients", "communications", "calendar", "notifications", "profile"],
      videographer: ["dashboard", "projects", "calendar", "tasks", "communications", "hr-attendance", "hr-leaves", "notifications", "profile"],
      photographer: ["dashboard", "projects", "calendar", "tasks", "communications", "hr-attendance", "hr-leaves", "notifications", "profile"],
      hr: ["dashboard", "hr-dashboard", "hr-employees", "hr-attendance", "hr-leaves", "team", "notifications", "profile"],
      accounts: ["dashboard", "invoices", "contracts", "accounts-page", "analytics", "notifications", "profile"],
    } as Record<string, AppModule[]>;
    setLocalAccess((prev) => ({
      ...prev,
      [selectedRole]: defaultAccess[selectedRole] ?? [],
    }));
    setHasChanges(true);
  };

  const enableAllForRole = (role: AppRole) => {
    setLocalAccess((prev) => ({
      ...prev,
      [role]: ALL_MODULES.map((m) => m.value),
    }));
    setHasChanges(true);
    toast.success(`All modules enabled for ${ALL_ROLES.find((r) => r.value === role)?.label}`);
  };

  const disableAllForRole = (role: AppRole) => {
    setLocalAccess((prev) => ({ ...prev, [role]: [] }));
    setHasChanges(true);
    toast.success(`All modules disabled for ${ALL_ROLES.find((r) => r.value === role)?.label}`);
  };

  const toggleModuleForRole = (role: AppRole, mod: AppModule) => {
    setLocalAccess((prev) => {
      const current = prev[role] ?? [];
      const updated = current.includes(mod)
        ? current.filter((m) => m !== mod)
        : [...current, mod];
      return { ...prev, [role]: updated };
    });
    setHasChanges(true);
  };

  const toggleGroupForRole = (role: AppRole, group: string) => {
    const groupModules = ALL_MODULES.filter((m) => m.group === group).map((m) => m.value);
    const current = localAccess[role] ?? [];
    const allEnabled = groupModules.every((m) => current.includes(m));
    setLocalAccess((prev) => {
      const updated = allEnabled
        ? current.filter((m) => !groupModules.includes(m))
        : [...new Set([...current, ...groupModules])];
      return { ...prev, [role]: updated };
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    setRoleAccess(localAccess);
    setHasChanges(false);
    toast.success(`Access permissions saved for ${ALL_ROLES.find((r) => r.value === selectedRole)?.label}`);
  };

  const toggleCollapse = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      next.has(group) ? next.delete(group) : next.add(group);
      return next;
    });
  };

  const isGroupFullyEnabled = (group: string) => {
    const groupModules = ALL_MODULES.filter((m) => m.group === group).map((m) => m.value);
    return groupModules.every((m) => currentModules.includes(m));
  };

  const isGroupPartial = (group: string) => {
    const groupModules = ALL_MODULES.filter((m) => m.group === group).map((m) => m.value);
    const enabled = groupModules.filter((m) => currentModules.includes(m)).length;
    return enabled > 0 && enabled < groupModules.length;
  };

  const roleMeta = ROLE_META[selectedRole];
  const RoleIcon = roleMeta?.icon ?? Shield;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ═══ HEADER ═══ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Access Control</h1>
            <p className="text-sm text-muted-foreground">Configure module permissions for each team role</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("cards")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                viewMode === "cards" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5 inline mr-1" /> Cards
            </button>
            <button
              onClick={() => setViewMode("matrix")}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                viewMode === "matrix" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Table2 className="h-3.5 w-3.5 inline mr-1" /> Matrix
            </button>
          </div>
          <AnimatePresence>
            {hasChanges && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <Button onClick={handleSave} className="gap-2 shadow-lg shadow-primary/20">
                  <Save className="h-4 w-4" /> Save Changes
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ═══ ROLE SELECTOR ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {nonAdminRoles.map((r) => {
          const meta = ROLE_META[r.value];
          const Icon = meta?.icon ?? Shield;
          const isSelected = selectedRole === r.value;
          const count = (localAccess[r.value] ?? []).length;
          return (
            <motion.div
              key={r.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200",
                isSelected
                  ? "bg-gradient-to-b from-primary/15 to-primary/5 border-primary/40 shadow-lg shadow-primary/10"
                  : "bg-card border-border hover:border-primary/20 hover:bg-muted/50"
              )}
            >
              {/* Dropdown menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="absolute top-2 right-2 h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted/80 transition-colors z-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => { enableAllForRole(r.value); setSelectedRole(r.value); }}>
                    <CheckCheck className="h-3.5 w-3.5 mr-2 text-green-500" />
                    Enable All Modules
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { disableAllForRole(r.value); setSelectedRole(r.value); }}>
                    <XCircle className="h-3.5 w-3.5 mr-2 text-destructive" />
                    Disable All Modules
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setAdvancedEditRole(r.value)}>
                    <SlidersHorizontal className="h-3.5 w-3.5 mr-2 text-primary" />
                    Advanced Edit
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => setSelectedRole(r.value)}
                className="flex flex-col items-center gap-2 w-full"
              >
                <div className={cn(
                  "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                  isSelected ? "bg-primary/20" : "bg-muted"
                )}>
                  <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : meta?.color || "text-muted-foreground")} />
                </div>
                <span className={cn("text-xs font-semibold", isSelected ? "text-foreground" : "text-muted-foreground")}>
                  {r.label}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] px-1.5",
                    isSelected ? "border-primary/40 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {count}/{totalModules}
                </Badge>
              </button>
              {isSelected && (
                <motion.div
                  layoutId="roleIndicator"
                  className="absolute -bottom-px left-3 right-3 h-0.5 bg-primary rounded-full"
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ═══ SELECTED ROLE INFO BAR ═══ */}
      <Card className="border-primary/10 bg-gradient-to-r from-card to-muted/30">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-muted")}>
                <RoleIcon className={cn("h-5 w-5", roleMeta?.color || "text-primary")} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-display font-bold text-foreground">
                    {ALL_ROLES.find((r) => r.value === selectedRole)?.label}
                  </h2>
                  <Badge variant="secondary" className="text-[10px]">
                    {enabledCount} of {totalModules} modules
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{roleMeta?.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 w-full sm:w-auto">
              {/* Progress ring */}
              <div className="relative h-10 w-10 flex-shrink-0">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
                  <circle
                    cx="18" cy="18" r="15" fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="3"
                    strokeDasharray={`${percentage * 0.942} 100`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-foreground">
                  {percentage}%
                </span>
              </div>

              <div className="flex gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 px-2.5" onClick={enableAll}>
                      <CheckCheck className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Enable All</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 px-2.5" onClick={disableAll}>
                      <XCircle className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Disable All</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="outline" className="h-8 px-2.5" onClick={resetToDefault}>
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Reset to Default</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══ SEARCH ═══ */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search modules..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-card"
        />
      </div>

      {/* ═══ CARD VIEW ═══ */}
      {viewMode === "cards" && (
        <div className="space-y-4">
          {groups.map((group) => {
            const modules = filteredModules.filter((m) => m.group === group);
            if (modules.length === 0) return null;
            const GroupIcon = GROUP_ICONS[group] ?? Settings;
            const collapsed = collapsedGroups.has(group);
            const fullyEnabled = isGroupFullyEnabled(group);
            const partial = isGroupPartial(group);
            const groupEnabledCount = ALL_MODULES.filter(
              (m) => m.group === group && currentModules.includes(m.value)
            ).length;
            const groupTotal = ALL_MODULES.filter((m) => m.group === group).length;

            return (
              <motion.div
                key={group}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                {/* Group header */}
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleCollapse(group)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <GroupIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{group}</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {groupEnabledCount} of {groupTotal} enabled
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleGroup(group, !fullyEnabled); }}
                          className={cn(
                            "h-7 px-2.5 rounded-md text-[10px] font-medium border transition-all flex items-center gap-1",
                            fullyEnabled
                              ? "bg-primary/10 border-primary/30 text-primary"
                              : partial
                              ? "bg-muted border-border text-muted-foreground"
                              : "bg-muted border-border text-muted-foreground"
                          )}
                        >
                          {fullyEnabled ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                          {fullyEnabled ? "All On" : partial ? "Partial" : "All Off"}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>{fullyEnabled ? "Disable all in group" : "Enable all in group"}</TooltipContent>
                    </Tooltip>
                    {collapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Module cards */}
                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 p-4 pt-0">
                        {modules.map((mod) => {
                          const enabled = currentModules.includes(mod.value);
                          const ModIcon = MODULE_ICONS[mod.value] ?? Settings;
                          return (
                            <motion.div
                              key={mod.value}
                              whileHover={{ scale: 1.01 }}
                              onClick={() => toggleModule(mod.value)}
                              className={cn(
                                "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200",
                                enabled
                                  ? "bg-primary/5 border-primary/25 hover:border-primary/40"
                                  : "bg-muted/20 border-border/50 hover:border-border opacity-60 hover:opacity-80"
                              )}
                            >
                              <div className={cn(
                                "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                enabled ? "bg-primary/15" : "bg-muted/50"
                              )}>
                                <ModIcon className={cn("h-4 w-4", enabled ? "text-primary" : "text-muted-foreground")} />
                              </div>
                              <span className={cn(
                                "text-sm font-medium flex-1",
                                enabled ? "text-foreground" : "text-muted-foreground"
                              )}>
                                {mod.label}
                              </span>
                              <Switch
                                checked={enabled}
                                onCheckedChange={() => toggleModule(mod.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══ MATRIX VIEW ═══ */}
      {viewMode === "matrix" && (
        <div className="bg-card rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-3 font-semibold text-foreground sticky left-0 bg-card z-10 min-w-[160px]">Module</th>
                {nonAdminRoles.map((r) => {
                  const meta = ROLE_META[r.value];
                  const Icon = meta?.icon ?? Shield;
                  return (
                    <th key={r.value} className="p-3 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-1">
                        <Icon className={cn("h-4 w-4", meta?.color || "text-muted-foreground")} />
                        <span className="text-[10px] font-medium text-muted-foreground">{r.label}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => {
                const modules = filteredModules.filter((m) => m.group === group);
                if (modules.length === 0) return null;
                return (
                  <React.Fragment key={group}>
                    <tr>
                      <td colSpan={nonAdminRoles.length + 1} className="px-3 pt-4 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{group}</span>
                      </td>
                    </tr>
                    {modules.map((mod) => {
                      const ModIcon = MODULE_ICONS[mod.value] ?? Settings;
                      return (
                        <tr key={mod.value} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                          <td className="p-3 sticky left-0 bg-card">
                            <div className="flex items-center gap-2">
                              <ModIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm text-foreground">{mod.label}</span>
                            </div>
                          </td>
                          {nonAdminRoles.map((r) => {
                            const enabled = (localAccess[r.value] ?? []).includes(mod.value);
                            return (
                              <td key={r.value} className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedRole(r.value);
                                    setLocalAccess((prev) => {
                                      const current = prev[r.value] ?? [];
                                      const updated = current.includes(mod.value)
                                        ? current.filter((m) => m !== mod.value)
                                        : [...current, mod.value];
                                      return { ...prev, [r.value]: updated };
                                    });
                                    setHasChanges(true);
                                  }}
                                  className={cn(
                                    "h-7 w-7 rounded-md inline-flex items-center justify-center transition-all",
                                    enabled
                                      ? "bg-primary/20 text-primary hover:bg-primary/30"
                                      : "bg-muted/30 text-muted-foreground/30 hover:bg-muted/50 hover:text-muted-foreground"
                                  )}
                                >
                                  {enabled ? (
                                    <CheckCheck className="h-3.5 w-3.5" />
                                  ) : (
                                    <XCircle className="h-3 w-3" />
                                  )}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ═══ ADVANCED EDIT DIALOG ═══ */}
      <Dialog open={!!advancedEditRole} onOpenChange={(open) => !open && setAdvancedEditRole(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {advancedEditRole && ROLE_META[advancedEditRole] && (
                <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center bg-primary/15")}>
                  {React.createElement(ROLE_META[advancedEditRole]?.icon ?? Shield, {
                    className: cn("h-5 w-5", ROLE_META[advancedEditRole]?.color),
                  })}
                </div>
              )}
              <div>
                <span className="text-lg font-bold">
                  Advanced Edit — {ALL_ROLES.find((r) => r.value === advancedEditRole)?.label}
                </span>
                <p className="text-xs text-muted-foreground font-normal mt-0.5">
                  {advancedEditRole && ROLE_META[advancedEditRole]?.description}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          {advancedEditRole && (
            <div className="space-y-4 mt-2">
              {/* Quick actions */}
              <div className="flex items-center gap-2 pb-3 border-b border-border">
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => enableAllForRole(advancedEditRole)}>
                  <CheckCheck className="h-3.5 w-3.5" /> Enable All
                </Button>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => disableAllForRole(advancedEditRole)}>
                  <XCircle className="h-3.5 w-3.5" /> Disable All
                </Button>
                <div className="ml-auto text-xs text-muted-foreground">
                  {(localAccess[advancedEditRole] ?? []).length}/{totalModules} enabled
                </div>
              </div>

              {/* Group-by-group module list */}
              {groups.map((group) => {
                const modules = ALL_MODULES.filter((m) => m.group === group);
                const currentRoleModules = localAccess[advancedEditRole] ?? [];
                const groupModuleValues = modules.map((m) => m.value);
                const allGroupEnabled = groupModuleValues.every((m) => currentRoleModules.includes(m));
                const someGroupEnabled = groupModuleValues.some((m) => currentRoleModules.includes(m));
                const GroupIcon = GROUP_ICONS[group] ?? Settings;

                return (
                  <div key={group} className="rounded-lg border border-border overflow-hidden">
                    <div
                      className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => toggleGroupForRole(advancedEditRole, group)}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                          <GroupIcon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="text-sm font-semibold text-foreground">{group}</span>
                        <Badge variant="secondary" className="text-[10px]">
                          {groupModuleValues.filter((m) => currentRoleModules.includes(m)).length}/{modules.length}
                        </Badge>
                      </div>
                      <Checkbox
                        checked={allGroupEnabled}
                        className={someGroupEnabled && !allGroupEnabled ? "opacity-60" : ""}
                        onCheckedChange={() => toggleGroupForRole(advancedEditRole, group)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="divide-y divide-border/50">
                      {modules.map((mod) => {
                        const enabled = currentRoleModules.includes(mod.value);
                        const ModIcon = MODULE_ICONS[mod.value] ?? Settings;
                        return (
                          <div
                            key={mod.value}
                            className={cn(
                              "flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors",
                              enabled ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30"
                            )}
                            onClick={() => toggleModuleForRole(advancedEditRole, mod.value)}
                          >
                            <div className="flex items-center gap-3">
                              <ModIcon className={cn("h-4 w-4", enabled ? "text-primary" : "text-muted-foreground")} />
                              <span className={cn("text-sm", enabled ? "text-foreground font-medium" : "text-muted-foreground")}>
                                {mod.label}
                              </span>
                            </div>
                            <Checkbox
                              checked={enabled}
                              onCheckedChange={() => toggleModuleForRole(advancedEditRole, mod.value)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
