import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TeamPage from "./pages/TeamPage";
import InvoicesPage from "./pages/InvoicesPage";
import { UserPlus, Users, FileText, CalendarDays, Zap, CreditCard, Briefcase, Image, BookImage, MessageSquare, Megaphone, BarChart3, Bot, Sparkles, Settings } from "lucide-react";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/leads" element={<PlaceholderPage title="Lead Management" description="Capture and nurture leads from Instagram, WhatsApp, calls and website forms." icon={UserPlus} />} />
          <Route path="/clients" element={<PlaceholderPage title="Client Management" description="Manage client profiles, communication history and lifetime value." icon={Users} />} />
          <Route path="/quotations" element={<PlaceholderPage title="Quotations & Packages" description="Create photography packages, send quotations and track approvals." icon={FileText} />} />
          <Route path="/projects" element={<ProjectsPage />} />
          <Route path="/projects/:id" element={<ProjectDetailPage />} />
          <Route path="/calendar" element={<PlaceholderPage title="Calendar" description="Schedule and manage shoots, team assignments and availability." icon={CalendarDays} />} />
          <Route path="/tasks" element={<PlaceholderPage title="Tasks" description="Assign and track tasks for photographers, editors and team members." icon={Zap} />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/invoices" element={<PlaceholderPage title="Invoices & Payments" description="Track advance, milestone and final payments with auto reminders." icon={CreditCard} />} />
          <Route path="/contracts" element={<PlaceholderPage title="Contracts" description="Create, send and manage contracts with digital signatures." icon={Briefcase} />} />
          <Route path="/gallery" element={<PlaceholderPage title="Gallery & Delivery" description="Upload photos, manage client selections and share download links." icon={Image} />} />
          <Route path="/albums" element={<PlaceholderPage title="Albums" description="Album selection, design approval and printing workflow." icon={BookImage} />} />
          <Route path="/portal" element={<PlaceholderPage title="Client Portal" description="Client-facing portal for projects, gallery, invoices and contracts." icon={Users} />} />
          <Route path="/communications" element={<PlaceholderPage title="Communication Hub" description="WhatsApp, email and SMS in one central inbox." icon={MessageSquare} />} />
          <Route path="/marketing" element={<PlaceholderPage title="Marketing & Campaigns" description="Email campaigns, festival offers and lead retargeting." icon={Megaphone} />} />
          <Route path="/analytics" element={<PlaceholderPage title="Analytics & Reports" description="Revenue dashboard, conversion rates and business insights." icon={BarChart3} />} />
          <Route path="/automation" element={<PlaceholderPage title="Workflow Automation" description="Auto triggers for follow-ups, reminders and feedback requests." icon={Zap} />} />
          <Route path="/ai-assistant" element={<PlaceholderPage title="AI Assistant" description="Auto-reply to leads, suggest pricing and generate captions." icon={Bot} />} />
          <Route path="/ai-selection" element={<PlaceholderPage title="Smart Photo Selection" description="AI-powered face recognition, best-shot suggestions and duplicate removal." icon={Sparkles} />} />
          <Route path="/settings" element={<PlaceholderPage title="Settings" description="Manage your studio profile, team roles and integrations." icon={Settings} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
