import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useRole, type AppModule } from "@/contexts/RoleContext";
import { DashboardLayout } from "@/components/DashboardLayout";

// Only the modules that still exist as pages
const routeModuleMap: Array<{ prefix: string; module: AppModule }> = [
  { prefix: "/access-control", module: "settings" },
  { prefix: "/settings", module: "settings" },
  { prefix: "/profile", module: "profile" },
  { prefix: "/team", module: "team" },
  { prefix: "/", module: "dashboard" },
];

export function RoleLayoutWrapper() {
  const location = useLocation();
  const { hasAccess, roleLoading } = useRole();

  // NOTE: mobile PWA shell (/m) was removed during the clean-slate rework.
  // Until it's rebuilt, every authenticated user lands on the web shell
  // regardless of login_surface. Re-introduce the /m redirect once a
  // mobile route exists again.

  const matchedRoute = routeModuleMap.find(({ prefix }) => {
    if (prefix === "/") return location.pathname === "/";
    return location.pathname === prefix || location.pathname.startsWith(`${prefix}/`);
  });
  if (matchedRoute && !roleLoading && !hasAccess(matchedRoute.module)) {
    return <Navigate to="/" replace />;
  }

  return (
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  );
}
