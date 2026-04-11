import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RoleProvider, useRole } from "@/contexts/RoleContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { OrgProvider } from "@/contexts/OrgContext";
import { RoleLayoutWrapper } from "@/components/RoleLayoutWrapper";
import NotFound from "./pages/NotFound.tsx";
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";

import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TeamPage from "./pages/TeamPage";
import InvoicesPage from "./pages/InvoicesPage";
import LeadsPage from "./pages/LeadsPage";
import CalendarPage from "./pages/CalendarPage";
import ClientsPage from "./pages/ClientsPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import QuotationsPage from "./pages/QuotationsPage";
import ContractsPage from "./pages/ContractsPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import AISelectionPage from "./pages/AISelectionPage";
import TasksPage from "./pages/TasksPage";
import EventsPage from "./pages/EventsPage";
import AlbumsPage from "./pages/AlbumsPage";
import EventDayPage from "./pages/EventDayPage";
import CommunicationsPage from "./pages/CommunicationsPage";
import MarketingPage from "./pages/MarketingPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AutomationPage from "./pages/AutomationPage";
import GalleryPage from "./pages/GalleryPage";
import PortalPage from "./pages/PortalPage";

import SettingsPage from "./pages/SettingsPage";
import HRDashboard from "./pages/hr/HRDashboard";
import HREmployees from "./pages/hr/HREmployees";
import HRAttendance from "./pages/hr/HRAttendance";
import HRLeaves from "./pages/hr/HRLeaves";
import NotificationsPage from "./pages/NotificationsPage";
import AccountsPage from "./pages/AccountsPage";
import LiveClientsPage from "./pages/LiveClientsPage";
import ProfilePage from "./pages/ProfilePage";
import AccessControlPage from "./pages/AccessControlPage";
import SuperAdminPage from "./pages/SuperAdminPage";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const { roleLoading } = useRole();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-black text-sm">S</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/landing" replace />;

  return (
    <Routes>
      <Route element={<RoleLayoutWrapper />}>
        <Route path="/" element={<Index />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/quotations" element={<QuotationsPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/projects/:projectId/event-day" element={<EventDayPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/albums" element={<AlbumsPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/invoices" element={<InvoicesPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/communications" element={<CommunicationsPage />} />
        <Route path="/marketing" element={<MarketingPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/automation" element={<AutomationPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/portal" element={<PortalPage />} />
        <Route path="/ai-assistant" element={<AIAssistantPage />} />
        <Route path="/ai-selection" element={<AISelectionPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/access-control" element={<AccessControlPage />} />
        <Route path="/hr" element={<HRDashboard />} />
        <Route path="/hr/employees" element={<HREmployees />} />
        <Route path="/hr/attendance" element={<HRAttendance />} />
        <Route path="/hr/leaves" element={<HRLeaves />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/live-clients" element={<LiveClientsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <OrgProvider>
          <RoleProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/landing" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthRoute />} />
                  <Route path="/super-admin" element={<SuperAdminPage />} />
                  <Route path="/*" element={<ProtectedRoutes />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </RoleProvider>
        </OrgProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
