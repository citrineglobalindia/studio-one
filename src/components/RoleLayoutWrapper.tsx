import { Outlet } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { PWALayout } from "@/components/PWALayout";

export function RoleLayoutWrapper() {
  const { isAdmin } = useRole();

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
