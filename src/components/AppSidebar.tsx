import {
  Shield,
  Users,
  UserPlus,
  FolderKanban,
  CalendarDays,
  CalendarCheck,
  FileText,
  CreditCard,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Settings,
  Zap,
  Megaphone,
  UsersRound,
  Briefcase,
  BookImage,
  Activity,
  Bot,
  Sparkles,
  Bell,
  Wallet,
  UserCog,
  ClipboardList,
  CalendarOff,
  LogOut,
  Package,
  Receipt, Scissors,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useRole, type AppModule } from "@/contexts/RoleContext";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

// Map sidebar items to their AppModule keys for access filtering
type SidebarItem = { title: string; url: string; icon: typeof LayoutDashboard; module: AppModule };

const salesItems: SidebarItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, module: "dashboard" },
  { title: "Leads", url: "/leads", icon: UserPlus, module: "leads" },
  { title: "Clients", url: "/clients", icon: Users, module: "clients" },
  { title: "Calendar", url: "/calendar", icon: CalendarDays, module: "calendar" },
];

const operationsItems: SidebarItem[] = [
  { title: "Editing", url: "/editing", icon: Scissors, module: "projects" },
];

const financeItems: SidebarItem[] = [
  { title: "Accounts", url: "/accounts", icon: Wallet, module: "accounts-page" },
];

const hrItems: SidebarItem[] = [
  { title: "HR", url: "/hr", icon: Users, module: "hr-employees" },
];

const systemItems: SidebarItem[] = [
  { title: "Users", url: "/team", icon: UsersRound, module: "team" },
  { title: "Access Control", url: "/access-control", icon: Shield, module: "settings" },
  { title: "Settings", url: "/settings", icon: Settings, module: "settings" },
];

const groups = [
  { label: "Sales CRM", items: salesItems },
  { label: "Operations", items: operationsItems },
  { label: "Finance", items: financeItems },
  { label: "HR", items: hrItems },
  { label: "Core", items: systemItems },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { hasAccess } = useRole();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-primary-foreground font-bold text-sm tracking-tight">S</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-foreground tracking-tight">
                Studio<span className="text-primary">Ai</span>
              </h1>
              <p className="text-[10px] text-muted-foreground truncate">Photography studio</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        {groups.map((group) => {
          // Filter items by role access
          const visibleItems = group.items.filter((item) => hasAccess(item.module));
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              {!collapsed && (
                <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground/50 px-3 mb-1 font-medium">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => (
                    <SidebarMenuItem key={item.title + item.url}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
                          activeClassName="bg-primary/[0.08] text-primary border-l-2 border-primary"
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
                    activeClassName="bg-primary/[0.08] text-primary border-l-2 border-primary"
                  >
                    <UserCog className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Profile</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors w-full"
                  >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Logout</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
