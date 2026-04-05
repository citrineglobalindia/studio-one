import {
  Camera,
  Users,
  UserPlus,
  FolderKanban,
  CalendarDays,
  FileText,
  CreditCard,
  Image,
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
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

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
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Tasks", url: "/tasks", icon: Zap },
  { title: "Team", url: "/team", icon: UsersRound },
];

const financeItems = [
  { title: "Invoices", url: "/invoices", icon: CreditCard },
  { title: "Contracts", url: "/contracts", icon: Briefcase },
];

const deliveryItems = [
  { title: "Gallery", url: "/gallery", icon: Image },
  { title: "Albums", url: "/albums", icon: BookImage },
  { title: "Client Portal", url: "/portal", icon: Users },
];

const growthItems = [
  { title: "Communications", url: "/communications", icon: MessageSquare },
  { title: "Marketing", url: "/marketing", icon: Megaphone },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Automation", url: "/automation", icon: Zap },
];

const aiItems = [
  { title: "AI Assistant", url: "/ai-assistant", icon: Bot },
  { title: "Smart Selection", url: "/ai-selection", icon: Sparkles },
];

const groups = [
  { label: "Sales CRM", items: salesItems },
  { label: "Operations", items: operationsItems },
  { label: "Finance", items: financeItems },
  { label: "Delivery", items: deliveryItems },
  { label: "Growth", items: growthItems },
  { label: "AI & Smart Tools", items: aiItems },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-display text-sm font-semibold text-foreground">FrameCRM</h1>
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
                    to="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors"
                    activeClassName="bg-sidebar-accent text-primary font-medium"
                  >
                    <Settings className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Settings</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
