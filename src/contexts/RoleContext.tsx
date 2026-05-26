import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "admin"
  | "administrator"
  | "accounts"
  | "telecaller"
  | "editor"
  | "videographer"
  | "photographer"
  | "videographer_vendor"
  | "photographer_vendor";

export const ALL_ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "administrator", label: "Administrator" },
  { value: "accounts", label: "Accounts" },
  { value: "telecaller", label: "Sales" },
  { value: "editor", label: "Editor" },
  { value: "photographer", label: "Photographer (Office)" },
  { value: "videographer", label: "Videographer (Office)" },
  { value: "photographer_vendor", label: "Photographer (Vendor)" },
  { value: "videographer_vendor", label: "Videographer (Vendor)" },
];

// Role creation hierarchy:
//   Admin    -> can create Administrator + Accounts (the "leadership" tier)
//   Administrator -> can create everyone else (Sales, Office photo/video/editor, Vendor photo/video)
//   Anyone else -> cannot create users
export const ROLES_ADMIN_CAN_CREATE: AppRole[] = ["administrator", "accounts"];
export const ROLES_ADMINISTRATOR_CAN_CREATE: AppRole[] = [
  "telecaller", "editor",
  "photographer", "videographer",
  "photographer_vendor", "videographer_vendor",
];

export function getCreatableRoles(creator: AppRole | null | undefined): AppRole[] {
  if (creator === "admin") return ROLES_ADMIN_CAN_CREATE;
  if (creator === "administrator") return ROLES_ADMINISTRATOR_CAN_CREATE;
  return [];
}

export function canCreateRole(creator: AppRole | null | undefined, target: AppRole): boolean {
  return getCreatableRoles(creator).includes(target);
}

export type AppModule =
  | "dashboard" | "leads" | "clients" | "quotations"
  | "projects" | "live-clients" | "albums" | "events" | "calendar" | "tasks" | "process-planner"
  | "team"
  | "invoices" | "contracts" | "payment-requests" | "salary"
  | "hr-employees" | "hr-attendance" | "hr-leaves"
  | "notifications" | "accounts-page" | "profile" | "settings";

export const ALL_MODULES: { value: AppModule; label: string; group: string }[] = [
  { value: "dashboard", label: "Dashboard", group: "Sales CRM" },
  { value: "leads", label: "Leads", group: "Sales CRM" },
  { value: "clients", label: "Clients", group: "Sales CRM" },
  { value: "quotations", label: "Quotations", group: "Sales CRM" },
  { value: "live-clients", label: "Live Clients", group: "Operations" },
  { value: "projects", label: "Projects", group: "Operations" },
  { value: "events", label: "Events", group: "Operations" },
  { value: "albums", label: "Albums", group: "Operations" },
  { value: "calendar", label: "Calendar", group: "Operations" },
  { value: "tasks", label: "Tasks", group: "Operations" },
  { value: "process-planner", label: "Process Planner", group: "Operations" },
  { value: "team", label: "Users", group: "Operations" },
  { value: "invoices", label: "Invoices", group: "Finance" },
  { value: "contracts", label: "Contracts", group: "Finance" },
  { value: "payment-requests", label: "Expense", group: "Finance" },
  { value: "accounts-page", label: "Accounts", group: "Finance" },
  { value: "salary", label: "Salary", group: "Finance" },
  { value: "hr-employees", label: "Employees", group: "HR Module" },
  { value: "hr-attendance", label: "Attendance", group: "HR Module" },
  { value: "hr-leaves", label: "Leaves", group: "HR Module" },
  { value: "notifications", label: "Notifications", group: "System" },
  { value: "profile", label: "Profile", group: "System" },
  { value: "settings", label: "Settings", group: "System" },
];

// Accounts/finance-only modules (Administrator does NOT get these by default)
const ACCOUNTS_ONLY_MODULES: AppModule[] = [
  "invoices", "contracts", "payment-requests", "accounts-page", "salary",
];

const DEFAULT_ACCESS: Record<AppRole, AppModule[]> = {
  admin: ALL_MODULES.map((m) => m.value),
  // Administrator: all modules except finance/accounts modules. Admin can further restrict.
  administrator: ALL_MODULES
    .map((m) => m.value)
    .filter((m) => !ACCOUNTS_ONLY_MODULES.includes(m)),
  editor: ["dashboard", "projects", "tasks", "albums", "hr-attendance", "hr-leaves", "payment-requests", "notifications", "profile"],
  // Sales (telecaller): leads + own attendance/leaves/expense
  telecaller: ["dashboard", "leads", "calendar", "hr-attendance", "hr-leaves", "payment-requests", "notifications", "profile"],
  videographer: ["dashboard", "projects", "events", "calendar", "tasks", "hr-attendance", "hr-leaves", "payment-requests", "notifications", "profile"],
  photographer: ["dashboard", "projects", "events", "calendar", "tasks", "hr-attendance", "hr-leaves", "payment-requests", "notifications", "profile"],
  // Vendors can still raise expenses (per-event payouts) but no internal HR
  photographer_vendor: ["dashboard", "events", "calendar", "payment-requests", "notifications", "profile"],
  videographer_vendor: ["dashboard", "events", "calendar", "payment-requests", "notifications", "profile"],
  accounts: ["dashboard", "quotations", "invoices", "contracts", "payment-requests", "accounts-page", "salary", "hr-attendance", "hr-employees", "hr-leaves", "notifications", "profile"],
};

/** Where this user is allowed to sign in: web dashboard, mobile PWA, or both. */
export type LoginSurface = "web" | "pwa" | "both";

interface RoleContextType {
  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;
  roleAccess: Record<AppRole, AppModule[]>;
  setRoleAccess: React.Dispatch<React.SetStateAction<Record<AppRole, AppModule[]>>>;
  /** Persists the access map to Supabase. Returns on success, throws on failure. */
  saveRoleAccess: (next: Record<AppRole, AppModule[]>) => Promise<void>;
  hasAccess: (module: AppModule) => boolean;
  getAccessibleModules: () => AppModule[];
  isAdmin: boolean;
  roleLoading: boolean;
  studioRestrictedModules: string[];
  studioDisabledRoles: string[];
  organizationId: string | null;
  /**
   * The login surface the admin granted this user inside the active studio.
   * Used by RoleLayoutWrapper to redirect web-only users away from /m and
   * pwa-only users back to /m. Defaults to "both" for super admins.
   */
  loginSurface: LoginSurface;
  /** True if the membership row says this user is the studio owner. */
  isOwner: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

const VALID_ROLES: AppRole[] = [
  "admin", "administrator", "accounts", "telecaller", "editor",
  "videographer", "photographer", "videographer_vendor", "photographer_vendor",
];

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentRole, setCurrentRoleState] = useState<AppRole>("admin");
  const [roleAccess, setRoleAccess] = useState<Record<AppRole, AppModule[]>>(DEFAULT_ACCESS);
  const [roleLoading, setRoleLoading] = useState(true);
  const [studioRestrictedModules, setStudioRestrictedModules] = useState<string[]>([]);
  const [studioDisabledRoles, setStudioDisabledRoles] = useState<string[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loginSurface, setLoginSurface] = useState<LoginSurface>("both");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (!user) {
      setCurrentRoleState("admin");
      setStudioRestrictedModules([]);
      setStudioDisabledRoles([]);
      setRoleAccess(DEFAULT_ACCESS);
      setOrganizationId(null);
      setLoginSurface("both");
      setIsOwner(false);
      setRoleLoading(false);
      return;
    }

    const fetchRoleAndRestrictions = async () => {
      setRoleLoading(true);

      let nextRole: AppRole = "admin";
      const impersonatedOrgId = typeof window !== "undefined"
        ? localStorage.getItem("sa_impersonate_org")
        : null;

      // Current user's saved role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileData?.role) {
        if (VALID_ROLES.includes(profileData.role as AppRole)) {
          nextRole = profileData.role as AppRole;
        }
      }

      try {
        // Resolve which organization we should load rules for
        let targetOrgId: string | null = null;

        if (impersonatedOrgId) {
          const { data: isSuperAdmin } = await supabase.rpc("is_super_admin", {
            _user_id: user.id,
          });
          if (isSuperAdmin) targetOrgId = impersonatedOrgId;
        }

        if (!targetOrgId) {
          const { data: membership } = await supabase
            .from("organization_members")
            .select("organization_id, role, login_surface")
            .eq("user_id", user.id)
            .limit(1)
            .maybeSingle();
          targetOrgId = membership?.organization_id ?? null;

          // Capture the user's surface + owner-flag for the org we just resolved.
          // (For super admins impersonating, default to "both" so they can roam.)
          if (membership) {
            setLoginSurface(((membership.login_surface as LoginSurface) || "both"));
            setIsOwner(membership.role === "owner");
          } else {
            setLoginSurface("both");
            setIsOwner(false);
          }
        } else {
          // Super admin impersonating — give them full surface access
          setLoginSurface("both");
          setIsOwner(false);
        }

        setOrganizationId(targetOrgId);

        if (targetOrgId) {
          const [moduleRestrictionsRes, roleRestrictionsRes, accessRes] = await Promise.all([
            supabase
              .from("studio_module_restrictions")
              .select("restricted_modules")
              .eq("organization_id", targetOrgId)
              .maybeSingle(),
            supabase
              .from("studio_role_restrictions")
              .select("disabled_roles")
              .eq("organization_id", targetOrgId)
              .maybeSingle(),
            // Per-role module access map for this studio
            supabase
              .from("studio_role_module_access")
              .select("role, allowed_modules")
              .eq("organization_id", targetOrgId),
          ]);

          const disabledRoles = roleRestrictionsRes.data?.disabled_roles || [];
          setStudioRestrictedModules(moduleRestrictionsRes.data?.restricted_modules || []);
          setStudioDisabledRoles(disabledRoles);

          // Build roleAccess map: start from defaults, override with DB rows
          const loadedAccess: Record<AppRole, AppModule[]> = { ...DEFAULT_ACCESS };
          for (const row of accessRes.data || []) {
            if (row?.role && VALID_ROLES.includes(row.role as AppRole)) {
              loadedAccess[row.role as AppRole] = ((row.allowed_modules as string[]) || []) as AppModule[];
            }
          }
          setRoleAccess(loadedAccess);

          if (nextRole !== "admin" && disabledRoles.includes(nextRole)) {
            nextRole = "admin";
          }
        } else {
          setStudioRestrictedModules([]);
          setStudioDisabledRoles([]);
          setRoleAccess(DEFAULT_ACCESS);
        }
      } catch {
        setStudioRestrictedModules([]);
        setStudioDisabledRoles([]);
        setRoleAccess(DEFAULT_ACCESS);
      }

      setCurrentRoleState(nextRole);
      setRoleLoading(false);
    };

    fetchRoleAndRestrictions();
  }, [user]);

  const setCurrentRole = useCallback((role: AppRole) => {
    if (role !== "admin" && studioDisabledRoles.includes(role)) {
      return;
    }
    setCurrentRoleState(role);
  }, [studioDisabledRoles]);

  // Persist to Supabase. Writes one row per non-admin role (admin always has full access).
  const saveRoleAccess = useCallback(
    async (next: Record<AppRole, AppModule[]>) => {
      if (!organizationId) {
        throw new Error("No organization loaded — cannot save access rules.");
      }

      const rows = ALL_ROLES
        .filter((r) => r.value !== "admin")
        .map((r) => ({
          organization_id: organizationId,
          role: r.value,
          allowed_modules: next[r.value] ?? [],
        }));

      const { error } = await supabase
        .from("studio_role_module_access")
        .upsert(rows, { onConflict: "organization_id,role" });

      if (error) throw error;

      // Only mutate local state after DB write succeeded
      setRoleAccess(next);
    },
    [organizationId]
  );

  const hasAccess = useCallback(
    (module: AppModule) => {
      if (currentRole !== "admin" && studioDisabledRoles.includes(currentRole)) return false;
      if (studioRestrictedModules.includes(module)) return false;
      if (currentRole === "admin") return true;
      return roleAccess[currentRole]?.includes(module) ?? false;
    },
    [currentRole, roleAccess, studioRestrictedModules, studioDisabledRoles]
  );

  const getAccessibleModules = useCallback(() => {
    if (currentRole !== "admin" && studioDisabledRoles.includes(currentRole)) {
      return [];
    }

    const roleModules = currentRole === "admin"
      ? ALL_MODULES.map((m) => m.value)
      : roleAccess[currentRole] ?? [];

    return roleModules.filter((m) => !studioRestrictedModules.includes(m));
  }, [currentRole, roleAccess, studioRestrictedModules, studioDisabledRoles]);

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        roleAccess,
        setRoleAccess,
        saveRoleAccess,
        hasAccess,
        getAccessibleModules,
        isAdmin: currentRole === "admin",
        roleLoading,
        studioRestrictedModules,
        studioDisabledRoles,
        organizationId,
        loginSurface,
        isOwner,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}
