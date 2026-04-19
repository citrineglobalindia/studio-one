import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRole, type AppModule } from "@/contexts/RoleContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { RoleMobileLayout } from "@/components/role-mobile/RoleMobileLayout";

const routeModuleMap: Array<{ prefix: string; module: AppModule }> = [
  { prefix: "/access-control", module: "settings" },
  { prefix: "/settings", module: "settings" },
  { prefix: "/profile", module: "profile" },
  { prefix: "/accounts", module: "accounts-page" },
  { prefix: "/notifications", module: "notifications" },
  { prefix: "/ai-selection", module: "ai-selection" },
  { prefix: "/ai-assistant", module: "ai-assistant" },
  { prefix: "/automation", module: "automation" },
  { prefix: "/analytics", module: "analytics" },
  { prefix: "/marketing", module: "marketing" },
  { prefix: "/communications", module: "communications" },
  { prefix: "/contracts", module: "contracts" },
  { prefix: "/invoices", module: "invoices" },
  { prefix: "/team", module: "team" },
  { prefix: "/albums", module: "projects" },
  { prefix: "/live-clients", module: "projects" },
  { prefix: "/events", module: "calendar" },
  { prefix: "/process-planner", module: "projects" },
  { prefix: "/tasks", module: "tasks" },
  { prefix: "/calendar", module: "calendar" },
  { prefix: "/projects", module: "projects" },
  { prefix: "/quotations", module: "quotations" },
  { prefix: "/clients", module: "clients" },
  { prefix: "/leads", module: "leads" },
  { prefix: "/hr/leaves", module: "hr-leaves" },
  { prefix: "/hr/attendance", module: "hr-attendance" },
  { prefix: "/hr/employees", module: "hr-employees" },
  { prefix: "/hr", module: "hr-dashboard" },
  { prefix: "/", module: "dashboard" },
];

export function RoleLayoutWrapper() {
  const location = useLocation();
  const { isAdmin, hasAccess } = useRole();

  const matchedRoute = routeModuleMap.find(({ prefix }) => {
    if (prefix === "/") return location.pathname === "/";
    return location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);
  });

  if (matchedRoute && !hasAccess(matchedRoute.module)) {
    return <Navigate to="/" replace />;
  }

  if (isAdmin) {
    return (
      <DashboardLayout>
        <Outlet />
      </DashboardLayout>
    );
  }

  return (
    <PWALayout>
      <Outlet />
    </PWALayout>
  );
}
