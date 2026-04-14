import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "vendor" | "editor" | "telecaller" | "videographer" | "photographer" | "hr" | "accounts";

export const ALL_ROLES: { value: AppRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "vendor", label: "Vendor" },
  { value: "editor", label: "Editor" },
  { value: "telecaller", label: "Telecaller" },
  { value: "videographer", label: "Videographer" },
  { value: "photographer", label: "Photographer" },
  { value: "hr", label: "HR" },
  { value: "accounts", label: "Accounts" },
];

export type AppModule =
  | "dashboard" | "leads" | "clients" | "quotations"
  | "projects" | "calendar" | "tasks" | "team"
  | "invoices" | "contracts"
  | "communications" | "marketing" | "analytics" | "automation"
  | "ai-assistant" | "ai-selection"
  | "hr-dashboard" | "hr-employees" | "hr-attendance" | "hr-leaves"
  | "notifications" | "accounts-page" | "profile" | "settings";

export const ALL_MODULES: { value: AppModule; label: string; group: string }[] = [
  { value: "dashboard", label: "Dashboard", group: "Sales CRM" },
  { value: "leads", label: "Leads", group: "Sales CRM" },
  { value: "clients", label: "Clients", group: "Sales CRM" },
  { value: "quotations", label: "Quotations", group: "Sales CRM" },
  { value: "projects", label: "Projects", group: "Operations" },
  { value: "calendar", label: "Calendar", group: "Operations" },
  { value: "tasks", label: "Tasks", group: "Operations" },
  { value: "team", label: "Team", group: "Operations" },
  { value: "invoices", label: "Invoices", group: "Finance" },
  { value: "contracts", label: "Contracts", group: "Finance" },
  { value: "communications", label: "Communications", group: "Growth" },
  { value: "marketing", label: "Marketing", group: "Growth" },
  { value: "analytics", label: "Analytics", group: "Growth" },
  { value: "automation", label: "Automation", group: "Growth" },
  { value: "ai-assistant", label: "AI Assistant", group: "AI & Smart Tools" },
  { value: "ai-selection", label: "Smart Selection", group: "AI & Smart Tools" },
  { value: "hr-dashboard", label: "HR Dashboard", group: "HR Module" },
  { value: "hr-employees", label: "Employees", group: "HR Module" },
  { value: "hr-attendance", label: "Attendance", group: "HR Module" },
  { value: "hr-leaves", label: "Leaves", group: "HR Module" },
  { value: "notifications", label: "Notifications", group: "System" },
  { value: "accounts-page", label: "Accounts", group: "System" },
  { value: "profile", label: "Profile", group: "System" },
  { value: "settings", label: "Settings", group: "System" },
];

// Default access: each role gets specific modules
const DEFAULT_ACCESS: Record<AppRole, AppModule[]> = {
  admin: ALL_MODULES.map((m) => m.value),
  vendor: ["dashboard", "projects", "calendar", "tasks", "communications", "notifications", "profile"],
  editor: ["dashboard", "projects", "tasks", "communications", "notifications", "profile"],
  telecaller: ["dashboard", "leads", "clients", "communications", "calendar", "notifications", "profile"],
  videographer: ["dashboard", "projects", "calendar", "tasks", "communications", "hr-attendance", "hr-leaves", "notifications", "profile"],
  photographer: ["dashboard", "projects", "calendar", "tasks", "communications", "hr-attendance", "hr-leaves", "notifications", "profile"],
  hr: ["dashboard", "hr-dashboard", "hr-employees", "hr-attendance", "hr-leaves", "team", "notifications", "profile"],
  accounts: ["dashboard", "invoices", "contracts", "accounts-page", "analytics", "notifications", "profile"],
};

interface RoleContextType {
  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;
  roleAccess: Record<AppRole, AppModule[]>;
  setRoleAccess: React.Dispatch<React.SetStateAction<Record<AppRole, AppModule[]>>>;
  hasAccess: (module: AppModule) => boolean;
  getAccessibleModules: () => AppModule[];
  isAdmin: boolean;
  roleLoading: boolean;
  studioRestrictedModules: string[];
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentRole, setCurrentRole] = useState<AppRole>("admin");
  const [roleAccess, setRoleAccess] = useState<Record<AppRole, AppModule[]>>(DEFAULT_ACCESS);
  const [roleLoading, setRoleLoading] = useState(true);
  const [studioRestrictedModules, setStudioRestrictedModules] = useState<string[]>([]);

  // Fetch role from profile when user changes
  useEffect(() => {
    if (!user) {
      setCurrentRole("admin");
      setStudioRestrictedModules([]);
      setRoleLoading(false);
      return;
    }

    const fetchRoleAndRestrictions = async () => {
      setRoleLoading(true);

      // Fetch role
      const { data: profileData } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (profileData?.role) {
        const validRoles: AppRole[] = ["admin", "vendor", "editor", "telecaller", "videographer", "photographer", "hr", "accounts"];
        if (validRoles.includes(profileData.role as AppRole)) {
          setCurrentRole(profileData.role as AppRole);
        }
      }

      // Fetch studio module restrictions via org membership
      try {
        const { data: membership } = await supabase
          .from("organization_members")
          .select("organization_id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (membership?.organization_id) {
          const { data: restrictions } = await supabase
            .from("studio_module_restrictions")
            .select("restricted_modules")
            .eq("organization_id", membership.organization_id)
            .maybeSingle();

          setStudioRestrictedModules(restrictions?.restricted_modules || []);
        } else {
          setStudioRestrictedModules([]);
        }
      } catch {
        setStudioRestrictedModules([]);
      }

      setRoleLoading(false);
    };

    fetchRoleAndRestrictions();
  }, [user]);

  const hasAccess = useCallback(
    (module: AppModule) => {
      // If module is restricted by super admin for this studio, deny
      if (studioRestrictedModules.includes(module)) return false;
      if (currentRole === "admin") return true;
      return roleAccess[currentRole]?.includes(module) ?? false;
    },
    [currentRole, roleAccess, studioRestrictedModules]
  );

  const getAccessibleModules = useCallback(
    () => {
      const roleModules = roleAccess[currentRole] ?? [];
      return roleModules.filter((m) => !studioRestrictedModules.includes(m));
    },
    [currentRole, roleAccess, studioRestrictedModules]
  );

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        setCurrentRole,
        roleAccess,
        setRoleAccess,
        hasAccess,
        getAccessibleModules,
        isAdmin: currentRole === "admin",
        roleLoading,
        studioRestrictedModules,
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
