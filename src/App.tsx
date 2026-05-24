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
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import AccessControlPage from "./pages/AccessControlPage";
import OnboardingPage from "./pages/OnboardingPage";
import PlaceholderPage from "./pages/PlaceholderPage";

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
        <Route path="/members" element={<Navigate to="/team" replace />} />
        <Route path="/access-control" element={<AccessControlPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Route>

      {/* Super Admin (separate layout inside the page) */}
      <Route path="/superadmin" element={<SuperAdminPage />}>
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
