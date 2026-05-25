import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOrg } from "@/contexts/OrgContext";
import { motion, AnimatePresence } from "framer-motion";

const getInitials = (value: string) => {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  return initials || "SU";
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { organization } = useOrg();
  const profileInitials = getInitials(organization?.name || "Studio User");

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sticky polished header */}
          <header className="sticky top-0 z-30 h-14 flex items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
              {organization?.name && (
                <div className="hidden md:flex items-center gap-2 min-w-0">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground/40" />
                  <p className="text-xs text-muted-foreground truncate">{organization.name}</p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <RoleSwitcher />
              <ThemeSwitcher />
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground rounded-full"
                onClick={() => navigate("/profile")}
                title="Profile"
              >
                <span className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/20 flex items-center justify-center text-[11px] font-semibold text-primary">{profileInitials}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                onClick={async () => { await signOut(); navigate("/auth"); }}
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>

          {/* Routed content with page transitions */}
          <main className="flex-1 overflow-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="min-h-full"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
