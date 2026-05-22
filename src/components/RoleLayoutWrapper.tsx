import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRole, type AppModule } from "@/contexts/RoleContext";
import { DashboardLayout } from "@/components/DashboardLayout";

const routeModuleMap: Array<{ prefix: string; module: AppModule }> = [
  { prefix: "/access-control", module: "settings" },
  { prefix: "/settings", module: "settings" },
  { prefix: "/profile", module: "profile" },
  { prefix: "/accounts", module: "accounts-page" },
  { prefix: "/notifications", module: "notifications" },
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
  const { hasAccess, loginSurface } = useRole();

  // Login-surface enforcement first (must run BEFORE module-access redirect
  // to avoid bouncing a pwa-only user to "/" — which they may also lack
  // access to — instead of the mobile shell where they belong).
  //
  // pwa-only  → never see desktop, send to /m
  // web|both  → desktop dashboard, regardless of role. Module access then
  //             gates which routes are reachable inside the desktop shell.
  if (loginSurface === "pwa") {
    return <Navigate to="/m" replace />;
  }

  // Per-module access guard — applies to every desktop route. If the user
  // hits a route they don't have access to, send them to "/" (every role
  // has dashboard access by default).
  const matchedRoute = routeModuleMap.find(({ prefix }) => {
    if (prefix === "/") return location.pathname === "/";
    return location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);
  });
  if (matchedRoute && !hasAccess(matchedRoute.module)) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
