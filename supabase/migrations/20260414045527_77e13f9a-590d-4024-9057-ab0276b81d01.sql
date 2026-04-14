
-- Table to store per-studio module restrictions (managed by super admin)
CREATE TABLE public.studio_module_restrictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  restricted_modules TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);

-- Enable RLS
ALTER TABLE public.studio_module_restrictions ENABLE ROW LEVEL SECURITY;

-- Super admins can do everything
CREATE POLICY "Super admins can view all restrictions"
  ON public.studio_module_restrictions FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create restrictions"
  ON public.studio_module_restrictions FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update restrictions"
  ON public.studio_module_restrictions FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete restrictions"
  ON public.studio_module_restrictions FOR DELETE
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Org members can view their own restrictions (to enforce in UI)
CREATE POLICY "Org members can view own restrictions"
  ON public.studio_module_restrictions FOR SELECT
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id));

-- Trigger for updated_at
CREATE TRIGGER update_studio_module_restrictions_updated_at
  BEFORE UPDATE ON public.studio_module_restrictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
