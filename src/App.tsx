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

import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";

// Landing pages (public marketing)
import LandingLayout from "./pages/landing/LandingLayout";
import LandingHome from "./pages/landing/Home";
import LandingFeatures from "./pages/landing/Features";
import LandingPricing from "./pages/landing/Pricing";
import LandingTestimonials from "./pages/landing/Testimonials";
import LandingAbout from "./pages/landing/About";
import LandingContact from "./pages/landing/Contact";

// Legal
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";

// Core (kept)
import TeamPage from "./pages/TeamPage";
import ClientsPage from "./pages/ClientsPage";
import AddClientPage from "./pages/AddClientPage";
import ClientDetailPage from "./pages/ClientDetailPage";
import LeadsPage from "./pages/LeadsPage";
import EditingPage from "./pages/EditingPage";
import EventReportsPage from "./pages/EventReportsPage";
import EquipmentPage from "./pages/EquipmentPage";
import ProductivityPage from "./pages/ProductivityPage";
import PaymentsPage from "./pages/PaymentsPage";
import EditorLogsPage from "./pages/EditorLogsPage";
import DayDetailPage from "./pages/DayDetailPage";
import CalendarPage from "./pages/CalendarPage";
import AccountsPage from "./pages/AccountsPage";
import ExpensesPage from "./pages/ExpensesPage";
import LedgerPage from "./pages/LedgerPage";
import PnLPage from "./pages/PnLPage";
import ClientPnlPage from "./pages/ClientPnlPage";
import ServicesPage from "./pages/ServicesPage";
import HREmployeesPage from "./pages/hr/HREmployeesPage";
import HRSalaryPage from "./pages/hr/HRSalaryPage";
import HRPayslipsPage from "./pages/hr/HRPayslipsPage";
import HRAttendancePage from "./pages/hr/HRAttendancePage";
import HRLeavesPage from "./pages/hr/HRLeavesPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AccessControlPage from "./pages/AccessControlPage";
import OnboardingPage from "./pages/OnboardingPage";

// Super Admin
import SuperAdminPage from "./pages/SuperAdminPage";
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
        <Route path="/team" element={<TeamPage />} />
        <Route path="/clients" element={<ClientsPage />} />
        <Route path="/clients/new" element={<AddClientPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/editing" element={<EditingPage />} />
        <Route path="/editor-logs" element={<EditorLogsPage />} />
        <Route path="/event-reports" element={<EventReportsPage />} />
        <Route path="/equipment" element={<EquipmentPage />} />
        <Route path="/productivity" element={<ProductivityPage />} />
        <Route path="/day/:date" element={<DayDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/payments" element={<PaymentsPage />} />
        <Route path="/expenses" element={<ExpensesPage />} />
        <Route path="/ledger" element={<LedgerPage />} />
        <Route path="/pnl" element={<PnLPage />} />
        <Route path="/client-pnl" element={<ClientPnlPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/accounts/expenses" element={<Navigate to="/expenses" replace />} />
        <Route path="/accounts/ledger" element={<Navigate to="/ledger" replace />} />
        <Route path="/accounts/pnl" element={<Navigate to="/pnl" replace />} />
        <Route path="/accounts/payments" element={<Navigate to="/payments" replace />} />
        <Route path="/hr" element={<HREmployeesPage />} />
        <Route path="/hr/salary" element={<HRSalaryPage />} />
        <Route path="/hr/payslips" element={<HRPayslipsPage />} />
        <Route path="/hr/attendance" element={<HRAttendancePage />} />
        <Route path="/hr/leaves" element={<HRLeavesPage />} />
        <Route path="/members" element={<Navigate to="/team" replace />} />
        <Route path="/access-control" element={<AccessControlPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Super Admin (separate layout inside the page) */}
      <Route path="/super-admin" element={<SuperAdminPage />}>
        <Route index element={<SADashboard />} />
        <Route path="dashboard" element={<SADashboard />} />
        <Route path="studios" element={<SAStudios />} />
        <Route path="modules" element={<SAModules />} />
        <Route path="subscriptions" element={<SASubscriptions />} />
        <Route path="users" element={<SAUsers />} />
        <Route path="enquiries" element={<SAEnquiries />} />
        <Route path="activity" element={<SAActivity />} />
        <Route path="reports" element={<SAReports />} />
        <Route path="notifications" element={<SANotifications />} />
        <Route path="settings" element={<SASettings />} />
        <Route path="system" element={<SASystemControl />} />
        <Route path="*" element={<SAPlaceholder />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppContent() {
  return (
    <Routes>
      {/* Public landing */}
      <Route path="/landing" element={<LandingLayout />}>
        <Route index element={<LandingHome />} />
        <Route path="features" element={<LandingFeatures />} />
        <Route path="pricing" element={<LandingPricing />} />
        <Route path="testimonials" element={<LandingTestimonials />} />
        <Route path="about" element={<LandingAbout />} />
        <Route path="contact" element={<LandingContact />} />
      </Route>

      {/* Auth */}
      <Route path="/auth" element={<AuthPage />} />

      {/* Legal */}
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/terms" element={<TermsPage />} />

      {/* Everything else inside auth/role wrapper */}
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <OrgProvider>
              <RoleProvider>
                <AppContent />
              </RoleProvider>
            </OrgProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
