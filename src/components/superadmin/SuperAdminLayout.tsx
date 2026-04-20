import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Crown,
  LayoutDashboard,
  Building2,
  Settings2,
  Shield,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  CreditCard,
  Activity,
  Bell,
  FileText,
  Blocks,
  Database,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/super-admin" },
  { label: "Studios", icon: Building2, path: "/super-admin/studios" },
  { label: "Enquiries", icon: Inbox, path: "/super-admin/enquiries" },
  { label: "Module Control", icon: Blocks, path: "/super-admin/modules" },
  { label: "Subscriptions", icon: CreditCard, path: "/super-admin/subscriptions" },
  { label: "All Users", icon: Users, path: "/super-admin/users" },
  { label: "Activity Log", icon: Activity, path: "/super-admin/activity" },
  { label: "Reports", icon: FileText, path: "/super-admin/reports" },
  { label: "Notifications", icon: Bell, path: "/super-admin/notifications" },
  { label: "System Control", icon: Database, path: "/super-admin/system" },
  { label: "Platform Settings", icon: Settings2, path: "/super-admin/settings" },
];

export function SuperAdminLayout() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card/80 backdrop-blur-sm transition-all duration-300 sticky top-0 h-screen z-40",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-border min-h-[64px]">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
            <Crown className="h-5 w-5 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-sm font-bold text-foreground truncate">Super Admin</h1>
              <p className="text-[10px] text-muted-foreground truncate">Platform Console</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== "/super-admin" && location.pathname.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="h-4.5 w-4.5 shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-border space-y-1">
          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
            title={collapsed ? "My Dashboard" : undefined}
          >
            <Shield className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>My Dashboard</span>}
          </button>
          <button
            onClick={() => { signOut(); navigate("/landing"); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
            title={collapsed ? "Sign Out" : undefined}
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && <span>Sign Out</span>}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
