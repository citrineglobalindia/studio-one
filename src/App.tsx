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
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";

import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TeamPage from "./pages/TeamPage";
import InvoicesPage from "./pages/InvoicesPage";
import LeadsPage from "./pages/LeadsPage";
import CallLogsPage from "./pages/CallLogsPage";
import VendorOrdersPage from "./pages/VendorOrdersPage";
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
import ProcessPlannerPage from "./pages/ProcessPlannerPage";
import SuperAdminPage from "./pages/SuperAdminPage";

// Role mobile pages
import { RoleMobileLayout } from "@/components/role-mobile/RoleMobileLayout";
import RoleDashboardPage from "./pages/role-mobile/RoleDashboardPage";
import RoleProjectsPage from "./pages/role-mobile/RoleProjectsPage";
import RoleCalendarPage from "./pages/role-mobile/RoleCalendarPage";
import RoleTransactionsPage from "./pages/role-mobile/RoleTransactionsPage";
import RoleAttendancePage from "./pages/role-mobile/RoleAttendancePage";
import RoleChatPage from "./pages/role-mobile/RoleChatPage";
import RoleProfilePage from "./pages/role-mobile/RoleProfilePage";
import RoleSettingsPage from "./pages/role-mobile/RoleSettingsPage";
import RoleExpensePage from "./pages/role-mobile/RoleExpensePage";
import RoleNotificationsPage from "./pages/role-mobile/RoleNotificationsPage";
import AboutAppPage from "./pages/role-mobile/AboutAppPage";
import AppearancePage from "./pages/role-mobile/AppearancePage";
import FeedbackPage from "./pages/role-mobile/FeedbackPage";
import HelpPage from "./pages/role-mobile/HelpPage";
import PrivacyPolicyMobilePage from "./pages/role-mobile/PrivacyPolicyMobilePage";

// Super Admin sub-pages
import SADashboard from "./pages/superadmin/SADashboard";
import SAStudios from "./pages/superadmin/SAStudios";
import SAModules from "./pages/superadmin/SAModules";
import SASubscriptions from "./pages/superadmin/SASubscriptions";
import SAUsers from "./pages/superadmin/SAUsers";
import SAActivity from "./pages/superadmin/SAActivity";
import SAReports from "./pages/superadmin/SAReports";
import SANotifications from "./pages/superadmin/SANotifications";
import SASettings from "./pages/superadmin/SASettings";
import SASystemControl from "./pages/superadmin/SASystemControl";
import SAEnquiries from "./pages/superadmin/SAEnquiries";
import SAPlaceholder from "./pages/superadmin/SAPlaceholder";

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
        <Route path="/call-logs" element={<CallLogsPage />} />
        <Route path="/vendor-orders" element={<VendorOrdersPage />} />
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
        <Route path="/process-planner" element={<ProcessPlannerPage />} />
      </Route>
      <Route path="/m" element={<RoleMobileLayout />}>
        <Route index element={<RoleDashboardPage />} />
        <Route path="projects" element={<RoleProjectsPage />} />
        <Route path="projects/:projectId/event-day" element={<EventDayPage />} />
        <Route path="calendar" element={<RoleCalendarPage />} />
        <Route path="transactions" element={<RoleTransactionsPage />} />
        <Route path="expenses" element={<RoleExpensePage />} />
        <Route path="attendance" element={<RoleAttendancePage />} />
        <Route path="chat" element={<RoleChatPage />} />
        <Route path="profile" element={<RoleProfilePage />} />
        <Route path="notifications" element={<RoleNotificationsPage />} />
        <Route path="settings" element={<RoleSettingsPage />} />
        <Route path="settings/about" element={<AboutAppPage />} />
        <Route path="settings/appearance" element={<AppearancePage />} />
        <Route path="settings/feedback" element={<FeedbackPage />} />
        <Route path="settings/help" element={<HelpPage />} />
        <Route path="settings/privacy" element={<PrivacyPolicyMobilePage />} />
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
                  <Route path="/privacy" element={<PrivacyPolicyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/auth" element={<AuthRoute />} />
                  {/* Super Admin with nested routes */}
                  <Route path="/super-admin" element={<SuperAdminPage />}>
                    <Route index element={<SADashboard />} />
                    <Route path="studios" element={<SAStudios />} />
                    <Route path="enquiries" element={<SAEnquiries />} />
                    <Route path="modules" element={<SAModules />} />
                    <Route path="subscriptions" element={<SASubscriptions />} />
                    <Route path="users" element={<SAUsers />} />
                    <Route path="activity" element={<SAActivity />} />
                    <Route path="reports" element={<SAReports />} />
                    <Route path="notifications" element={<SANotifications />} />
                    <Route path="system" element={<SASystemControl />} />
                    <Route path="settings" element={<SASettings />} />
                  </Route>
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
