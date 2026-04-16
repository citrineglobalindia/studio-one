import { useNavigate, useLocation } from "react-router-dom";
import { Bell, User, MoreHorizontal, X, ChevronRight, Grip, LogOut } from "lucide-react";
import { FloatingAIButton } from "@/components/FloatingAIButton";
import {
  LayoutDashboard, UserPlus, Users, FolderKanban, CalendarDays,
  Zap, CreditCard, Briefcase, MessageSquare, Megaphone, BarChart3,
  Bot, Sparkles, UserCog, UsersRound, ClipboardList, CalendarOff, Wallet, Settings, FileText,
  Camera, Video, Edit3, PhoneCall
} from "lucide-react";
import { useRole, type AppModule, type AppRole } from "@/contexts/RoleContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from "framer-motion";
import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

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

// Role-specific bottom navigation — each role gets exactly 4 tabs + more
const ROLE_TABS: Record<AppRole, AppModule[]> = {
  admin: ["dashboard", "projects", "tasks", "communications"],
  photographer: ["dashboard", "projects", "calendar", "communications"],
  videographer: ["dashboard", "projects", "calendar", "communications"],
  editor: ["dashboard", "tasks", "projects", "communications"],
  telecaller: ["dashboard", "leads", "clients", "communications"],
  vendor: ["dashboard", "projects", "calendar", "communications"],
  hr: ["dashboard", "hr-dashboard", "hr-attendance", "hr-leaves"],
  accounts: ["dashboard", "invoices", "accounts-page", "analytics"],
};

// Role theme accents
const ROLE_THEME: Record<AppRole, { emoji: string; accent: string; gradientFrom: string }> = {
  admin: { emoji: "👑", accent: "from-primary to-primary/60", gradientFrom: "from-primary/15" },
  photographer: { emoji: "📸", accent: "from-blue-500 to-cyan-500", gradientFrom: "from-blue-500/15" },
  videographer: { emoji: "🎬", accent: "from-purple-500 to-fuchsia-500", gradientFrom: "from-purple-500/15" },
  editor: { emoji: "✂️", accent: "from-emerald-500 to-teal-500", gradientFrom: "from-emerald-500/15" },
  telecaller: { emoji: "📞", accent: "from-amber-500 to-orange-500", gradientFrom: "from-amber-500/15" },
  vendor: { emoji: "🤝", accent: "from-indigo-500 to-violet-500", gradientFrom: "from-indigo-500/15" },
  hr: { emoji: "👥", accent: "from-teal-500 to-emerald-500", gradientFrom: "from-teal-500/15" },
  accounts: { emoji: "💰", accent: "from-emerald-500 to-green-500", gradientFrom: "from-emerald-500/15" },
};

export function PWALayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentRole, getAccessibleModules } = useRole();
  const [moreOpen, setMoreOpen] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(0);
  const { signOut } = useAuth();

  const accessible = getAccessibleModules();
  const roleTabs = ROLE_TABS[currentRole].filter((m) => accessible.includes(m));
  const theme = ROLE_THEME[currentRole];

  const moreItems = accessible
    .filter((m) => !roleTabs.includes(m) && m !== "notifications" && m !== "settings" && m !== "profile")
    .map((m) => moduleConfig[m])
    .filter(Boolean);

  const roleLabel = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

  const isActive = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  // Swipe navigation between tabs
  const allNavPaths = [...roleTabs.map((m) => moduleConfig[m].path)];
  const currentTabIndex = allNavPaths.findIndex((p) => isActive(p));

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 50;
    if (Math.abs(info.offset.x) > threshold && Math.abs(info.velocity.x) > 100) {
      if (info.offset.x > 0 && currentTabIndex > 0) {
        setSwipeDirection(-1);
        navigate(allNavPaths[currentTabIndex - 1]);
      } else if (info.offset.x < 0 && currentTabIndex < allNavPaths.length - 1) {
        setSwipeDirection(1);
        navigate(allNavPaths[currentTabIndex + 1]);
      }
    }
  }, [currentTabIndex, allNavPaths, navigate]);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Header - Role-themed */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/40 px-4 h-14 flex items-center justify-between safe-area-top">
        <div className="flex items-center gap-2.5">
          <motion.div
            whileTap={{ scale: 0.9 }}
            className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg"
          >
            <span className="text-primary-foreground font-black text-sm tracking-tight">S</span>
          </motion.div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight tracking-tight">
              Studio<span className="text-primary">Ai</span>
            </p>
            <p className="text-[10px] text-muted-foreground font-medium">{roleLabel}</p>
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

      {/* Swipeable Main Content */}
      <main className="flex-1 overflow-auto pb-24 px-4 py-4">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{
              opacity: 0,
              x: swipeDirection > 0 ? 80 : swipeDirection < 0 ? -80 : 0,
              scale: 0.98,
            }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{
              opacity: 0,
              x: swipeDirection > 0 ? -80 : swipeDirection < 0 ? 80 : 0,
              scale: 0.98,
            }}
            transition={{ type: "spring" as const, stiffness: 350, damping: 35 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            style={{ touchAction: "pan-y" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Full-screen More Menu — Native App Grid */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
            className="fixed inset-0 z-[60] bg-background/98 backdrop-blur-3xl"
          >
            <div className="flex flex-col h-full safe-area-top safe-area-bottom">
              {/* Menu Header */}
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-foreground font-[var(--font-display)]">All Modules</h2>
                  <p className="text-[10px] text-muted-foreground">{roleLabel} · {moreItems.length + roleTabs.length} modules</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.85, rotate: 90 }}
                  onClick={() => setMoreOpen(false)}
                  className="h-10 w-10 rounded-2xl bg-muted/80 flex items-center justify-center"
                >
                  <X className="h-5 w-5 text-foreground" />
                </motion.button>
              </div>

              {/* Scrollable Grid */}
              <div className="flex-1 overflow-auto px-4 pb-6">
                {/* Active Tabs Section */}
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] px-1 mb-3">Main</p>
                <div className="grid grid-cols-4 gap-2 mb-6">
                  {roleTabs.map((mod, i) => {
                    const config = moduleConfig[mod];
                    const active = isActive(config.path);
                    return (
                      <motion.button
                        key={mod}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, type: "spring" as const, stiffness: 300, damping: 25 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => { navigate(config.path); setMoreOpen(false); }}
                        className="flex flex-col items-center gap-1.5 py-3"
                      >
                        <div className={`h-13 w-13 rounded-[18px] flex items-center justify-center bg-gradient-to-br ${config.color} shadow-lg`}>
                          <config.icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-[10px] font-semibold text-foreground text-center leading-tight">{config.label}</span>
                      </motion.button>
                    );
                  })}
                </div>

                {/* More Modules */}
                {moreItems.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] px-1 mb-3">More</p>
                    <div className="grid grid-cols-4 gap-2 mb-6">
                      {moreItems.map((item, i) => {
                        const active = isActive(item.path);
                        return (
                          <motion.button
                            key={item.path}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + i * 0.03, type: "spring" as const, stiffness: 300, damping: 25 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => { navigate(item.path); setMoreOpen(false); }}
                            className="flex flex-col items-center gap-1.5 py-3"
                          >
                            <div className={`h-13 w-13 rounded-[18px] flex items-center justify-center transition-all ${
                              active ? `bg-gradient-to-br ${item.color} shadow-lg` : "bg-muted/80 border border-border/50"
                            }`}>
                              <item.icon className={`h-5 w-5 ${active ? "text-white" : "text-muted-foreground"}`} />
                            </div>
                            <span className={`text-[10px] font-medium leading-tight text-center ${
                              active ? "text-foreground font-semibold" : "text-muted-foreground"
                            }`}>{item.label}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Quick Access List */}
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.2em] px-1 mb-3">Account</p>
                <div className="space-y-1.5">
                  {(["profile", "settings", "notifications"] as AppModule[])
                    .filter((mod) => accessible.includes(mod))
                    .map((mod) => {
                    const config = moduleConfig[mod];
                    return (
                      <motion.button
                        key={mod}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => { navigate(config.path); setMoreOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-muted/40 active:bg-muted transition-colors"
                      >
                        <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center`}>
                          <config.icon className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-sm font-medium text-foreground flex-1 text-left">{config.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                      </motion.button>
                    );
                  })}
                  {/* Logout */}
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { signOut(); setMoreOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-destructive/10 active:bg-destructive/20 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
                      <LogOut className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-destructive flex-1 text-left">Logout</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Tab Navigation - Role-themed Floating Pill */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-2 safe-area-bottom">
        <nav className="bg-card/90 backdrop-blur-xl border border-border/40 rounded-[20px] shadow-2xl shadow-black/25 mx-auto max-w-sm">
          {/* Tab indicator track */}
          <div className="flex items-center justify-around h-[60px] px-1">
            {roleTabs.map((mod) => {
              const config = moduleConfig[mod];
              if (!config) return null;
              const active = isActive(config.path);
              const Icon = config.icon;

              return (
                <motion.button
                  key={mod}
                  whileTap={{ scale: 0.8 }}
                  onClick={() => { setSwipeDirection(0); navigate(config.path); }}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1 relative"
                >
                  {active && (
                    <motion.div
                      layoutId="activeTabPill"
                      className={`absolute inset-x-2 -top-[1px] h-[3px] rounded-full bg-gradient-to-r ${config.color}`}
                      transition={{ type: "spring" as const, stiffness: 500, damping: 35 }}
                    />
                  )}
                  <motion.div
                    animate={active ? { scale: 1.05, y: -2 } : { scale: 1, y: 0 }}
                    transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
                    className={`p-1.5 rounded-xl transition-all duration-200 ${
                      active ? `bg-gradient-to-br ${config.color} shadow-lg` : ""
                    }`}
                  >
                    <Icon className={`h-[18px] w-[18px] transition-colors ${
                      active ? "text-white" : "text-muted-foreground"
                    }`} />
                  </motion.div>
                  <span className={`text-[9px] font-semibold transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground/70"
                  }`}>
                    {config.label}
                  </span>
                </motion.button>
              );
            })}

            {/* More Button */}
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={() => setMoreOpen(true)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1"
            >
              <div className={`p-1.5 rounded-xl transition-all ${moreOpen ? "bg-muted" : ""}`}>
                <Grip className={`h-[18px] w-[18px] ${moreOpen ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-[9px] font-semibold ${moreOpen ? "text-primary" : "text-muted-foreground/70"}`}>
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
