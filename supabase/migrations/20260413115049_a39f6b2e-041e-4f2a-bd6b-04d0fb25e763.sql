
-- =====================
-- INVOICES TABLE
-- =====================
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  project_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage',
  discount_value NUMERIC DEFAULT 0,
  tax_percent NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  due_date DATE,
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view invoices" ON public.invoices FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can create invoices" ON public.invoices FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can update invoices" ON public.invoices FOR UPDATE TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can delete invoices" ON public.invoices FOR DELETE TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Super admins can view all invoices" ON public.invoices FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================
-- QUOTATIONS TABLE
-- =====================
CREATE TABLE public.quotations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  quotation_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  project_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  discount_type TEXT DEFAULT 'percentage',
  discount_value NUMERIC DEFAULT 0,
  tax_percent NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  valid_until DATE,
  terms TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view quotations" ON public.quotations FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can create quotations" ON public.quotations FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can update quotations" ON public.quotations FOR UPDATE TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can delete quotations" ON public.quotations FOR DELETE TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Super admins can view all quotations" ON public.quotations FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON public.quotations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
