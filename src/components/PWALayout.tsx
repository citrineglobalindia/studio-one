import { useNavigate, useLocation } from "react-router-dom";
import { Bell, User, Search, MoreHorizontal, X, ChevronRight } from "lucide-react";
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
import { useState } from "react";

const moduleConfig: Record<AppModule, { icon: typeof LayoutDashboard; label: string; path: string; color: string }> = {
  "dashboard": { icon: LayoutDashboard, label: "Home", path: "/", color: "from-amber-500 to-orange-500" },
  "leads": { icon: UserPlus, label: "Leads", path: "/leads", color: "from-emerald-500 to-teal-500" },
  "clients": { icon: Users, label: "Clients", path: "/clients", color: "from-blue-500 to-cyan-500" },
  "quotations": { icon: FileText, label: "Quotes", path: "/quotations", color: "from-violet-500 to-purple-500" },
  "projects": { icon: FolderKanban, label: "Projects", path: "/projects", color: "from-pink-500 to-rose-500" },
  "calendar": { icon: CalendarDays, label: "Calendar", path: "/calendar", color: "from-sky-500 to-blue-500" },
  "tasks": { icon: Zap, label: "Tasks", path: "/tasks", color: "from-yellow-500 to-amber-500" },
  "team": { icon: UsersRound, label: "Team", path: "/team", color: "from-indigo-500 to-violet-500" },
  "invoices": { icon: CreditCard, label: "Invoices", path: "/invoices", color: "from-emerald-500 to-green-500" },
  "contracts": { icon: Briefcase, label: "Contracts", path: "/contracts", color: "from-slate-500 to-gray-500" },
  "communications": { icon: MessageSquare, label: "Chat", path: "/communications", color: "from-blue-500 to-indigo-500" },
  "marketing": { icon: Megaphone, label: "Marketing", path: "/marketing", color: "from-fuchsia-500 to-pink-500" },
  "analytics": { icon: BarChart3, label: "Analytics", path: "/analytics", color: "from-cyan-500 to-teal-500" },
  "automation": { icon: Zap, label: "Auto", path: "/automation", color: "from-orange-500 to-red-500" },
  "ai-assistant": { icon: Bot, label: "AI", path: "/ai-assistant", color: "from-violet-500 to-fuchsia-500" },
  "ai-selection": { icon: Sparkles, label: "Select", path: "/ai-selection", color: "from-amber-500 to-yellow-500" },
  "hr-dashboard": { icon: UserCog, label: "HR", path: "/hr", color: "from-teal-500 to-emerald-500" },
  "hr-employees": { icon: UsersRound, label: "Staff", path: "/hr/employees", color: "from-blue-500 to-sky-500" },
  "hr-attendance": { icon: ClipboardList, label: "Attend", path: "/hr/attendance", color: "from-green-500 to-emerald-500" },
  "hr-leaves": { icon: CalendarOff, label: "Leaves", path: "/hr/leaves", color: "from-red-500 to-rose-500" },
  "notifications": { icon: Bell, label: "Alerts", path: "/notifications", color: "from-amber-500 to-orange-500" },
  "accounts-page": { icon: Wallet, label: "Accounts", path: "/accounts", color: "from-emerald-500 to-teal-500" },
  "profile": { icon: User, label: "Profile", path: "/profile", color: "from-indigo-500 to-blue-500" },
  "settings": { icon: Settings, label: "Settings", path: "/settings", color: "from-gray-500 to-slate-500" },
};

const TAB_PRIORITY: AppModule[] = [
  "dashboard", "projects", "tasks", "communications", "hr-attendance",
  "leads", "calendar", "invoices", "hr-dashboard", "analytics"
];

export function PWALayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, getAccessibleModules } = useRole();
  const [moreOpen, setMoreOpen] = useState(false);

  const accessible = getAccessibleModules();
  const mainTabs = TAB_PRIORITY.filter((m) => accessible.includes(m)).slice(0, 3);
  const bottomTabs = mainTabs;

  const moreItems = accessible
    .filter((m) => !bottomTabs.includes(m) && m !== "notifications" && m !== "settings" && m !== "profile")
    .map((m) => moduleConfig[m])
    .filter(Boolean);

  const roleLabel = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Header - Glassmorphic */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 px-4 h-14 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-[10px] font-bold text-primary-foreground tracking-tight">EDV</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground leading-tight font-[var(--font-display)]">E-DigiVault</p>
            <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <ThemeSwitcher />
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground relative"
            onClick={() => navigate("/notifications")}
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-24 px-4 py-4">
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

      {/* Full-screen More Menu Overlay */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-2xl"
          >
            <div className="flex flex-col h-full safe-area-top safe-area-bottom">
              {/* Menu Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border/30">
                <h2 className="text-lg font-semibold text-foreground font-[var(--font-display)]">All Modules</h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMoreOpen(false)}
                  className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center"
                >
                  <X className="h-5 w-5 text-foreground" />
                </motion.button>
              </div>

              {/* Menu Grid */}
              <div className="flex-1 overflow-auto px-5 py-5">
                <div className="grid grid-cols-4 gap-3">
                  {moreItems.map((item, i) => {
                    const active = isActive(item.path);
                    return (
                      <motion.button
                        key={item.path}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03, type: "spring", stiffness: 300, damping: 25 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          navigate(item.path);
                          setMoreOpen(false);
                        }}
                        className="flex flex-col items-center gap-1.5 py-3"
                      >
                        <div
                          className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${
                            active
                              ? `bg-gradient-to-br ${item.color} shadow-lg`
                              : "bg-muted/80"
                          }`}
                        >
                          <item.icon className={`h-5 w-5 ${active ? "text-white" : "text-muted-foreground"}`} />
                        </div>
                        <span className={`text-[10px] font-medium leading-tight text-center ${
                          active ? "text-foreground" : "text-muted-foreground"
                        }`}>
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Quick Actions */}
                <div className="mt-6 space-y-2">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider px-1 mb-3">Quick Access</p>
                  {[
                    moduleConfig["profile"],
                    moduleConfig["settings"],
                    moduleConfig["notifications"],
                  ].filter(Boolean).map((item) => (
                    <motion.button
                      key={item.path}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        navigate(item.path);
                        setMoreOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center`}>
                        <item.icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm font-medium text-foreground flex-1 text-left">{item.label}</span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </motion.button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Tab Navigation - Floating Pill */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-3 safe-area-bottom">
        <nav className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-black/20 mx-auto max-w-sm">
          <div className="flex items-center justify-around h-16 px-2">
            {bottomTabs.map((mod) => {
              const config = moduleConfig[mod];
              if (!config) return null;
              const active = isActive(config.path);
              const Icon = config.icon;

              return (
                <motion.button
                  key={mod}
                  whileTap={{ scale: 0.85 }}
                  onClick={() => navigate(config.path)}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative"
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className={`absolute -top-0.5 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-gradient-to-r ${config.color}`}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <div className={`p-1.5 rounded-xl transition-all ${
                    active ? `bg-gradient-to-br ${config.color} shadow-lg` : ""
                  }`}>
                    <Icon className={`h-5 w-5 transition-colors ${
                      active ? "text-white" : "text-muted-foreground"
                    }`} />
                  </div>
                  <span className={`text-[10px] font-medium transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}>
                    {config.label}
                  </span>
                </motion.button>
              );
            })}

            {/* More Button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
            >
              <div className={`p-1.5 rounded-xl transition-all ${moreOpen ? "bg-primary/15" : ""}`}>
                <MoreHorizontal className={`h-5 w-5 ${moreOpen ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-[10px] font-medium ${moreOpen ? "text-primary" : "text-muted-foreground"}`}>
                More
              </span>
            </motion.button>
          </div>
        </nav>
      </div>

      <FloatingAIButton />
    </div>
  );
}
