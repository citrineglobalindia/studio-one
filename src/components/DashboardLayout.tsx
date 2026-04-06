import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Bell, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { RoleSwitcher } from "@/components/RoleSwitcher";
import { FloatingAIButton } from "@/components/FloatingAIButton";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search leads, clients, projects..."
                  className="h-9 w-64 rounded-md bg-muted border-none pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RoleSwitcher />
              <ThemeSwitcher />
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative" onClick={() => navigate("/notifications")}>
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => navigate("/profile")}>
                <span className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">AS</span>
              </Button>
              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={async () => { await signOut(); navigate("/auth"); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
        <FloatingAIButton />
      </div>
    </SidebarProvider>
  );
}
