import { ReactNode } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Home, Briefcase, Calendar, Wallet, Settings as Cog, MessageCircle } from "lucide-react";
import { useRole } from "@/contexts/RoleContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { Button } from "@/components/ui/button";

const NAV_ITEMS = [
  { icon: Home, label: "Home", path: "/m" },
  { icon: Briefcase, label: "Projects", path: "/m/projects" },
  { icon: Calendar, label: "Calendar", path: "/m/calendar" },
  { icon: Wallet, label: "Money", path: "/m/transactions" },
  { icon: Cog, label: "Settings", path: "/m/settings" },
];

interface Props {
  children?: ReactNode;
}

export function RoleMobileLayout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentRole } = useRole();

  const isActive = (path: string) => {
    if (path === "/m") return location.pathname === "/m";
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const roleLabel = currentRole.charAt(0).toUpperCase() + currentRole.slice(1);

  return (
    <div className="min-h-screen w-full bg-muted/30 md:flex md:items-center md:justify-center md:py-6">
      <div className="relative mx-auto flex min-h-screen w-full max-w-full flex-col overflow-hidden bg-background md:min-h-[calc(100vh-3rem)] md:max-h-[920px] md:w-[420px] md:rounded-[2.5rem] md:border md:border-border/60 md:shadow-2xl">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-xl border-b border-border/40 px-4 h-14 flex items-center justify-between md:rounded-t-[2.5rem]">
          <button
            onClick={() => navigate("/m")}
            className="flex items-center gap-2.5"
          >
            <motion.div
              whileTap={{ scale: 0.92 }}
              className="h-9 w-9 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg"
            >
              <span className="text-primary-foreground font-black text-sm tracking-tight">S</span>
            </motion.div>
            <div className="text-left">
              <p className="text-sm font-bold text-foreground leading-tight tracking-tight">
                Studio<span className="text-primary">Ai</span>
              </p>
              <p className="text-[10px] text-muted-foreground font-medium leading-tight">{roleLabel}</p>
            </div>
          </button>
          <div className="flex items-center gap-0.5">
            <ThemeSwitcher />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-muted-foreground relative"
              onClick={() => navigate("/m/notifications")}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
            </Button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto pb-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {children ?? <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Chat FAB */}
        <button
          onClick={() => navigate("/m/chat")}
          aria-label="Team chat"
          className="absolute right-4 bottom-24 z-40 h-13 w-13 h-[52px] w-[52px] rounded-2xl bg-primary text-primary-foreground shadow-xl flex items-center justify-center active:scale-95 transition-transform"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground flex items-center justify-center">
            3
          </span>
        </button>

        {/* Bottom Nav */}
        <nav className="absolute bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border/50 h-[68px] flex items-center justify-around px-2 md:rounded-b-[2.5rem]">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 h-full relative"
              >
                <motion.div whileTap={{ scale: 0.85 }} className="relative flex flex-col items-center">
                  {active && (
                    <motion.div
                      layoutId="role-nav-bg"
                      className="absolute -inset-x-3 -inset-y-1.5 bg-primary/15 rounded-xl"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.4 : 1.8}
                    className={`relative z-10 ${active ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <span
                    className={`relative z-10 text-[9px] font-semibold mt-0.5 ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
