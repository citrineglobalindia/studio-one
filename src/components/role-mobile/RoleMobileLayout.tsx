import { ReactNode } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Home, Briefcase, Calendar, Wallet, Settings as Cog, MessageCircle, Film } from "lucide-react";
import { useRole, ALL_ROLES } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";

// Roles that work on assigned events (no generic "Projects" list)
const EVENT_ROLES = new Set(["photographer", "videographer", "editor", "vendor"]);

const buildNavItems = (role: string) => {
  const isEventRole = EVENT_ROLES.has(role);
  const isEditor = role === "editor";
  return [
    { icon: Home, label: "Home", path: "/m" },
    { icon: Briefcase, label: isEventRole ? "Events" : "Projects", path: "/m/projects" },
    isEditor
      ? { icon: Film, label: "Edits", path: "/m/deliverables" }
      : { icon: Calendar, label: "Calendar", path: "/m/calendar" },
    { icon: Wallet, label: "Money", path: "/m/transactions" },
    { icon: Cog, label: "Settings", path: "/m/settings" },
  ];
};

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

  const roleLabel = ALL_ROLES.find((r) => r.value === currentRole)?.label
    ?? (currentRole.charAt(0).toUpperCase() + currentRole.slice(1));

  const NAV_ITEMS = buildNavItems(currentRole);

  return (
    <div
      className="fixed inset-0 w-full overflow-hidden md:flex md:items-center md:justify-center md:py-6"
      style={{
        background:
          "radial-gradient(ellipse at top, #0c1d3a 0%, #050c1a 60%), linear-gradient(180deg, #050c1a 0%, #020817 100%)",
      }}
    >
      {/* Decorative ambient glows */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[400px] w-[400px] rounded-full bg-sky-500/30 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[420px] w-[420px] rounded-full bg-blue-700/40 blur-[160px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-indigo-600/10 blur-[120px]" />

      <div
        className="relative mx-auto flex h-full w-full max-w-full flex-col overflow-hidden md:h-[calc(100vh-3rem)] md:max-h-[920px] md:w-[420px] md:rounded-[2.5rem] md:border md:border-white/10 md:shadow-[0_32px_80px_-20px_rgba(0,0,0,0.7)]"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.85) 0%, rgba(2,8,23,0.95) 100%)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Header */}
        <header className="flex-shrink-0 z-40 px-5 h-16 flex items-center justify-between border-b border-white/5 bg-white/[0.02] backdrop-blur-xl md:rounded-t-[2.5rem]">
          <button
            onClick={() => navigate("/m")}
            className="flex items-center gap-3 active:scale-95 transition-transform"
            aria-label="Studio home"
          >
            <motion.div
              whileTap={{ scale: 0.92 }}
              className="relative h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/40"
              style={{
                background: "linear-gradient(135deg, #0ea5e9 0%, #2563eb 60%, #4f46e5 100%)",
              }}
            >
              <span className="text-white font-black text-base tracking-tight">S</span>
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/30" />
            </motion.div>
            <div className="text-left">
              <p className="text-base font-bold text-white leading-tight tracking-tight">
                Studio<span className="bg-gradient-to-r from-sky-300 to-blue-400 bg-clip-text text-transparent">Ai</span>
              </p>
              <p className="text-[10px] text-sky-300/70 font-semibold uppercase tracking-[0.18em] leading-tight mt-0.5">
                {roleLabel}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-sky-200 hover:text-white hover:bg-white/10 relative"
              onClick={() => navigate("/m/notifications")}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-sky-400 ring-2 ring-slate-950 animate-pulse" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-sky-200 hover:text-white hover:bg-white/10"
              onClick={() => navigate("/m/profile")}
              aria-label="Profile"
            >
              <div
                className="h-7 w-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white"
                style={{ background: "linear-gradient(135deg, #38bdf8, #2563eb)" }}
              >
                {roleLabel.charAt(0)}
              </div>
            </Button>
          </div>
        </header>

        {/* Content — scrollable. Force dark theme + remap shadcn tokens to a
            blue-glass palette so every legacy mobile page (Profile, Settings,
            Notifications, etc.) inherits the new look without per-file edits. */}
        <main
          className="dark flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{
            // Override shadcn HSL variables for this scope only
            ["--background" as any]: "transparent",
            ["--foreground" as any]: "210 40% 98%",
            ["--card" as any]: "215 60% 12% / 0.4",
            ["--card-foreground" as any]: "210 40% 98%",
            ["--popover" as any]: "215 50% 14%",
            ["--popover-foreground" as any]: "210 40% 98%",
            ["--primary" as any]: "199 89% 60%",
            ["--primary-foreground" as any]: "210 40% 98%",
            ["--secondary" as any]: "215 40% 18% / 0.5",
            ["--secondary-foreground" as any]: "210 40% 92%",
            ["--muted" as any]: "215 30% 20% / 0.4",
            ["--muted-foreground" as any]: "215 20% 70%",
            ["--accent" as any]: "215 40% 22% / 0.5",
            ["--accent-foreground" as any]: "210 40% 98%",
            ["--border" as any]: "215 30% 30% / 0.3",
            ["--input" as any]: "215 40% 18% / 0.4",
            ["--ring" as any]: "199 89% 60%",
            color: "hsl(210 40% 98%)",
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="pb-6"
            >
              {children ?? <Outlet />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Chat FAB */}
        <button
          onClick={() => navigate("/m/chat")}
          aria-label="Team chat"
          className="absolute right-5 bottom-[88px] z-40 h-14 w-14 rounded-2xl flex items-center justify-center active:scale-95 transition-transform shadow-2xl shadow-sky-500/50"
          style={{
            background: "linear-gradient(135deg, #38bdf8 0%, #2563eb 60%, #4f46e5 100%)",
          }}
        >
          <MessageCircle className="h-6 w-6 text-white" />
          <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-slate-950">
            3
          </span>
        </button>

        {/* Bottom Nav */}
        <nav
          className="flex-shrink-0 z-40 h-[72px] flex items-center justify-around px-2 border-t border-white/5 md:rounded-b-[2.5rem]"
          style={{
            background: "linear-gradient(180deg, rgba(15,23,42,0.7) 0%, rgba(2,8,23,0.95) 100%)",
            backdropFilter: "blur(20px)",
          }}
        >
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center h-full relative"
              >
                <motion.div whileTap={{ scale: 0.85 }} className="relative flex flex-col items-center">
                  {active && (
                    <motion.div
                      layoutId="role-nav-bg"
                      className="absolute -inset-x-4 -inset-y-2 rounded-2xl"
                      style={{
                        background: "linear-gradient(135deg, rgba(56,189,248,0.25), rgba(37,99,235,0.25))",
                        boxShadow: "0 8px 24px -8px rgba(56,189,248,0.5)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 1.8}
                    className={`relative z-10 transition-colors ${active ? "text-sky-300" : "text-slate-400"}`}
                  />
                  <span
                    className={`relative z-10 text-[10px] font-semibold mt-1 transition-colors ${
                      active ? "text-sky-200" : "text-slate-500"
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
