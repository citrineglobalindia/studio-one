import {
  Camera,
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
  HardDrive,
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

const salesItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Leads", url: "/leads", icon: UserPlus },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Quotations", url: "/quotations", icon: FileText },
];

const operationsItems = [
  { title: "Projects", url: "/projects", icon: FolderKanban },
  { title: "Events", url: "/events", icon: CalendarCheck },
  { title: "Albums", url: "/albums", icon: BookImage },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Tasks", url: "/tasks", icon: Zap },
  { title: "Team", url: "/team", icon: UsersRound },
];

const financeItems = [
  { title: "Accounts", url: "/accounts", icon: Wallet },
  { title: "Invoices", url: "/invoices", icon: CreditCard },
  { title: "Quotations", url: "/quotations", icon: FileText },
  { title: "Contracts", url: "/contracts", icon: Briefcase },
];


const aiItems = [
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "Smart Selection", url: "/ai-selection", icon: Sparkles },
];

const hrItems = [
  { title: "HR Dashboard", url: "/hr", icon: UserCog },
  { title: "Employees", url: "/hr/employees", icon: UsersRound },
  { title: "Attendance", url: "/hr/attendance", icon: ClipboardList },
  { title: "Leaves", url: "/hr/leaves", icon: CalendarOff },
];

const systemItems = [
  { title: "Notifications", url: "/notifications", icon: Bell },
  { title: "Access Control", url: "/access-control", icon: Shield },
];

const groups = [
  { label: "Sales CRM", items: salesItems },
  { label: "Operations", items: operationsItems },
  { label: "Finance", items: financeItems },
  
  { label: "HR Module", items: hrItems },
  { label: "AI & Smart Tools", items: aiItems },
  { label: "System", items: systemItems },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

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
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            {!collapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 px-4 mb-1">
                {group.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
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
        ))}

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
