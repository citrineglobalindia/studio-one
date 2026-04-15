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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
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

// Map sidebar items to their AppModule keys for access filtering
type SidebarItem = { title: string; url: string; icon: typeof LayoutDashboard; module: AppModule };

const salesItems: SidebarItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, module: "dashboard" },
  { title: "Leads", url: "/leads", icon: UserPlus, module: "leads" },
  { title: "Clients", url: "/clients", icon: Users, module: "clients" },
  { title: "Quotations", url: "/quotations", icon: FileText, module: "quotations" },
];

const operationsItems: SidebarItem[] = [
  { title: "Live Clients", url: "/live-clients", icon: Activity, module: "projects" },
  { title: "Projects", url: "/projects", icon: FolderKanban, module: "projects" },
  { title: "Events", url: "/events", icon: CalendarCheck, module: "calendar" },
  { title: "Albums", url: "/albums", icon: BookImage, module: "projects" },
  { title: "Calendar", url: "/calendar", icon: CalendarDays, module: "calendar" },
  { title: "Tasks", url: "/tasks", icon: Zap, module: "tasks" },
  { title: "Team", url: "/team", icon: UsersRound, module: "team" },
];

const financeItems: SidebarItem[] = [
  { title: "Accounts", url: "/accounts", icon: Wallet, module: "accounts-page" },
  { title: "Invoices", url: "/invoices", icon: CreditCard, module: "invoices" },
  { title: "Contracts", url: "/contracts", icon: Briefcase, module: "contracts" },
];

const growthItems: SidebarItem[] = [
  { title: "Communications", url: "/communications", icon: MessageSquare, module: "communications" },
  { title: "Marketing", url: "/marketing", icon: Megaphone, module: "marketing" },
  { title: "Analytics", url: "/analytics", icon: BarChart3, module: "analytics" },
  { title: "Automation", url: "/automation", icon: Zap, module: "automation" },
];

const aiItems: SidebarItem[] = [
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot, module: "ai-assistant" },
  { title: "Smart Selection", url: "/ai-selection", icon: Sparkles, module: "ai-selection" },
];

const hrItems: SidebarItem[] = [
  { title: "HR Dashboard", url: "/hr", icon: UserCog, module: "hr-dashboard" },
  { title: "Employees", url: "/hr/employees", icon: UsersRound, module: "hr-employees" },
  { title: "Attendance", url: "/hr/attendance", icon: ClipboardList, module: "hr-attendance" },
  { title: "Leaves", url: "/hr/leaves", icon: CalendarOff, module: "hr-leaves" },
];

const systemItems: SidebarItem[] = [
  { title: "Notifications", url: "/notifications", icon: Bell, module: "notifications" },
  { title: "Access Control", url: "/access-control", icon: Shield, module: "settings" },
];

const groups = [
  { label: "Sales CRM", items: salesItems },
  { label: "Operations", items: operationsItems },
  { label: "Finance", items: financeItems },
  { label: "Growth", items: growthItems },
  { label: "HR Module", items: hrItems },
  { label: "AI & Smart Tools", items: aiItems },
  { label: "System", items: systemItems },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { hasAccess, isAdmin } = useRole();

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-black text-xs tracking-tight">S</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">
                Studio<span className="text-primary">Ai</span>
              </h1>
              <p className="text-[10px] text-muted-foreground">Photography Studio</p>
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
                <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-4 mb-1">
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
                          activeClassName="bg-sidebar-accent text-primary font-medium"
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
                    activeClassName="bg-sidebar-accent text-primary font-medium"
                  >
                    <UserCog className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Profile</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
                    activeClassName="bg-sidebar-accent text-primary font-medium"
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Settings</span>}
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
