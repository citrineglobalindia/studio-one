import { useNavigate, useLocation } from "react-router-dom";
import { Bell, User, Search } from "lucide-react";
import { FloatingAIButton } from "@/components/FloatingAIButton";
import {
  LayoutDashboard, UserPlus, Users, FolderKanban, CalendarDays,
  Zap, CreditCard, Briefcase, MessageSquare, Megaphone, BarChart3,
  Bot, Sparkles, UserCog, UsersRound, ClipboardList, CalendarOff, Wallet, Settings, FileText
} from "lucide-react";
import { useRole, type AppModule } from "@/contexts/RoleContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const moduleConfig: Record<AppModule, { icon: typeof LayoutDashboard; label: string; path: string }> = {
  "dashboard": { icon: LayoutDashboard, label: "Home", path: "/" },
  "leads": { icon: UserPlus, label: "Leads", path: "/leads" },
  "clients": { icon: Users, label: "Clients", path: "/clients" },
  "quotations": { icon: FileText, label: "Quotes", path: "/quotations" },
  "projects": { icon: FolderKanban, label: "Projects", path: "/projects" },
  "calendar": { icon: CalendarDays, label: "Calendar", path: "/calendar" },
  "tasks": { icon: Zap, label: "Tasks", path: "/tasks" },
  "team": { icon: UsersRound, label: "Team", path: "/team" },
  "invoices": { icon: CreditCard, label: "Invoices", path: "/invoices" },
  "contracts": { icon: Briefcase, label: "Contracts", path: "/contracts" },
  "communications": { icon: MessageSquare, label: "Chat", path: "/communications" },
  "marketing": { icon: Megaphone, label: "Marketing", path: "/marketing" },
  "analytics": { icon: BarChart3, label: "Analytics", path: "/analytics" },
  "automation": { icon: Zap, label: "Auto", path: "/automation" },
  "ai-assistant": { icon: Bot, label: "AI", path: "/ai-assistant" },
  "ai-selection": { icon: Sparkles, label: "Select", path: "/ai-selection" },
  "hr-dashboard": { icon: UserCog, label: "HR", path: "/hr" },
  "hr-employees": { icon: UsersRound, label: "Staff", path: "/hr/employees" },
  "hr-attendance": { icon: ClipboardList, label: "Attend", path: "/hr/attendance" },
  "hr-leaves": { icon: CalendarOff, label: "Leaves", path: "/hr/leaves" },
  "notifications": { icon: Bell, label: "Alerts", path: "/notifications" },
  "accounts-page": { icon: Wallet, label: "Accounts", path: "/accounts" },
  "profile": { icon: User, label: "Profile", path: "/profile" },
  "settings": { icon: Settings, label: "Settings", path: "/settings" },
};

// Priority modules for bottom tabs (max 5)
const TAB_PRIORITY: AppModule[] = [
  "dashboard", "projects", "tasks", "communications", "hr-attendance",
  "leads", "calendar", "invoices", "hr-dashboard", "analytics"
];

export function PWALayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, getAccessibleModules } = useRole();

  const accessible = getAccessibleModules();

  // Pick up to 4 main tabs + profile
  const mainTabs = TAB_PRIORITY.filter((m) => accessible.includes(m)).slice(0, 4);
  const bottomTabs = [...mainTabs, "profile" as AppModule];

  // More items (accessible but not in bottom tabs)
  const moreItems = accessible
    .filter((m) => !bottomTabs.includes(m) && m !== "notifications" && m !== "settings")
    .map((m) => moduleConfig[m]);

  const roleLabel = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border px-4 h-14 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">{roleLabel.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight">E-DigiVault</p>
            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground relative"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-20 px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {bottomTabs.map((mod) => {
            const config = moduleConfig[mod];
            if (!config) return null;
            const isActive = location.pathname === config.path || (config.path !== "/" && location.pathname.startsWith(config.path));
            const Icon = config.icon;

            return (
              <button
                key={mod}
                onClick={() => navigate(config.path)}
                className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors"
              >
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? "bg-primary/15" : ""}`}>
                  <Icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <span className={`text-[10px] font-medium ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                  {config.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
      <FloatingAIButton />
    </div>
  );
}
