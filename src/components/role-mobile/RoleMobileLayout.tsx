import { ReactNode } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Home, Briefcase, Calendar, Wallet, Settings as Cog, MessageCircle, Film, IndianRupee } from "lucide-react";
import { useRole, ALL_ROLES } from "@/contexts/RoleContext";
import { Button } from "@/components/ui/button";

// Roles that work on assigned events (no generic "Projects" list)
const EVENT_ROLES = new Set(["photographer", "videographer", "vendor"]);

const buildNavItems = (role: string) => {
  // Editor's job is task-based (deliverables) — they don't need Events at all.
  if (role === "editor") {
    return [
      { icon: Home, label: "Home", path: "/m" },
      { icon: Film, label: "Tasks", path: "/m/deliverables" },
      { icon: IndianRupee, label: "Payments", path: "/m/payments" },
      { icon: Wallet, label: "Money", path: "/m/transactions" },
      { icon: Cog, label: "Settings", path: "/m/settings" },
    ];
  }
  const isEventRole = EVENT_ROLES.has(role);
  return [
    { icon: Home, label: "Home", path: "/m" },
    { icon: Briefcase, label: isEventRole ? "Events" : "Projects", path: "/m/projects" },
    { icon: Calendar, label: "Calendar", path: "/m/calendar" },
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
          "radial-gradient(ellipse at top, #dbeafe 0%, #f0f9ff 40%, #ffffff 80%), linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)",
      }}
    >
      {/* Soft ambient color blobs */}
      <div className="pointer-events-none absolute -top-40 -left-32 h-[400px] w-[400px] rounded-full bg-sky-300/40 blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-[420px] w-[420px] rounded-full bg-blue-300/40 blur-[160px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-indigo-200/20 blur-[120px]" />

      <div
        className="relative mx-auto flex h-full w-full max-w-full flex-col overflow-hidden md:h-[calc(100vh-3rem)] md:max-h-[920px] md:w-[420px] md:rounded-[2.5rem] md:border md:border-blue-100 md:shadow-[0_32px_80px_-20px_rgba(59,130,246,0.25)]"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(239,246,255,0.95) 100%)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Header */}
        <header
          className="flex-shrink-0 z-40 px-4 h-16 flex items-center justify-between border-b border-blue-100/80 bg-white/70 backdrop-blur-xl md:rounded-t-[2.5rem]"
        >
          <button
            onClick={() => navigate("/m")}
            className="flex items-center gap-2.5 active:scale-95 transition-transform"
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
              <div className="absolute inset-0 rounded-2xl ring-1 ring-white/40" />
            </motion.div>
            <div className="text-left">
              <p className="text-[15px] font-bold text-slate-900 leading-tight tracking-tight">
                Studio<span className="bg-gradient-to-r from-sky-500 to-blue-600 bg-clip-text text-transparent">Ai</span>
              </p>
              <p className="text-[10px] text-blue-600/80 font-semibold uppercase tracking-[0.16em] leading-tight mt-0.5">
                {roleLabel}
              </p>
            </div>
          </button>

          {/* Header actions: Chat | Notifications | Profile */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 relative"
              onClick={() => navigate("/m/chat")}
              aria-label="Team chat"
            >
              <MessageCircle className="h-[18px] w-[18px]" strokeWidth={2.2} />
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center ring-2 ring-white">
                3
              </span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl text-blue-600 hover:text-blue-700 hover:bg-blue-50 relative"
              onClick={() => navigate("/m/notifications")}
              aria-label="Notifications"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={2.2} />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-sky-500 ring-2 ring-white animate-pulse" />
            </Button>
            <button
              onClick={() => navigate("/m/profile")}
              aria-label="Profile"
              className="h-10 w-10 rounded-xl flex items-center justify-center hover:bg-blue-50 active:scale-95 transition"
            >
              <div
                className="h-8 w-8 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shadow-md shadow-sky-500/30"
                style={{ background: "linear-gradient(135deg, #38bdf8, #2563eb)" }}
              >
                {roleLabel.charAt(0)}
              </div>
            </button>
          </div>
        </header>

        {/* Content — light theme + remap shadcn tokens to a clean white-on-blue palette
            so legacy mobile pages (Profile, Settings, Notifications, etc.) inherit the look. */}
        <main
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain"
          style={{
            // Override shadcn HSL variables for this scope only (light theme)
            ["--background" as any]: "transparent",
            ["--foreground" as any]: "222 47% 11%",          // slate-900
            ["--card" as any]: "0 0% 100% / 0.85",            // white/85
            ["--card-foreground" as any]: "222 47% 11%",
            ["--popover" as any]: "0 0% 100%",
            ["--popover-foreground" as any]: "222 47% 11%",
            ["--primary" as any]: "217 91% 60%",              // blue-500
            ["--primary-foreground" as any]: "0 0% 100%",
            ["--secondary" as any]: "214 95% 93% / 0.6",      // blue-100/60
            ["--secondary-foreground" as any]: "224 76% 33%", // blue-800
            ["--muted" as any]: "214 100% 97% / 0.7",         // blue-50/70
            ["--muted-foreground" as any]: "215 16% 47%",     // slate-500
            ["--accent" as any]: "214 95% 93% / 0.6",         // blue-100/60
            ["--accent-foreground" as any]: "224 76% 33%",
            ["--border" as any]: "214 95% 93% / 0.8",         // blue-100/80
            ["--input" as any]: "214 95% 93% / 0.8",
            ["--ring" as any]: "217 91% 60%",
            color: "hsl(222 47% 11%)",
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

        {/* Bottom Nav */}
        <nav
          className="flex-shrink-0 z-40 h-[72px] flex items-center justify-around px-2 border-t border-blue-100/80 md:rounded-b-[2.5rem]"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(239,246,255,0.95) 100%)",
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
                        background: "linear-gradient(135deg, #38bdf8, #2563eb)",
                        boxShadow: "0 10px 24px -8px rgba(56,189,248,0.6)",
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={20}
                    strokeWidth={active ? 2.5 : 2}
                    className={`relative z-10 transition-colors ${active ? "text-white" : "text-slate-500"}`}
                  />
                  <span
                    className={`relative z-10 text-[10px] font-semibold mt-1 transition-colors ${
                      active ? "text-white" : "text-slate-500"
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
