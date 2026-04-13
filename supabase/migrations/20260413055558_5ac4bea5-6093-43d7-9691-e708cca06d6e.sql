
-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  partner_name TEXT,
  email TEXT,
  phone TEXT,
  city TEXT,
  event_type TEXT DEFAULT 'Wedding',
  event_date DATE,
  delivery_date DATE,
  source TEXT DEFAULT 'Website',
  status TEXT NOT NULL DEFAULT 'active',
  budget NUMERIC DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  source TEXT NOT NULL DEFAULT 'Website',
  event_type TEXT DEFAULT 'Wedding',
  event_date DATE,
  city TEXT,
  budget NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'new',
  assigned_to TEXT,
  follow_up_date DATE,
  notes TEXT,
  converted_client_id UUID REFERENCES public.clients(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Clients RLS policies
CREATE POLICY "Org members can view clients"
  ON public.clients FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create clients"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can delete clients"
  ON public.clients FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Super admins can view all clients"
  ON public.clients FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

-- Leads RLS policies
CREATE POLICY "Org members can view leads"
  ON public.leads FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can create leads"
  ON public.leads FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can update leads"
  ON public.leads FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Org members can delete leads"
  ON public.leads FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

CREATE POLICY "Super admins can view all leads"
  ON public.leads FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_clients_organization_id ON public.clients(organization_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_leads_organization_id ON public.leads(organization_id);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_converted_client_id ON public.leads(converted_client_id);
