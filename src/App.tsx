import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { RoleProvider } from "@/contexts/RoleContext";
import { RoleLayoutWrapper } from "@/components/RoleLayoutWrapper";
import NotFound from "./pages/NotFound.tsx";
import Index from "./pages/Index.tsx";
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
import ProfilePage from "./pages/ProfilePage";
import AccessControlPage from "./pages/AccessControlPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <RoleProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
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
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </RoleProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
