-- Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text;

-- Add missing columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS gst_number text;

-- Create studio_role_module_access table
CREATE TABLE IF NOT EXISTS public.studio_role_module_access (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL,
  allowed_modules text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, role)
);

ALTER TABLE public.studio_role_module_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view role module access"
  ON public.studio_role_module_access FOR SELECT
  TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE POLICY "Org owners/admins or super admins can insert role module access"
  ON public.studio_role_module_access FOR INSERT
  TO authenticated
  WITH CHECK (
    is_super_admin(auth.uid())
    OR get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner','admin'])
  );

CREATE POLICY "Org owners/admins or super admins can update role module access"
  ON public.studio_role_module_access FOR UPDATE
  TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR get_org_role(auth.uid(), organization_id) = ANY (ARRAY['owner','admin'])
  );

CREATE POLICY "Org owners or super admins can delete role module access"
  ON public.studio_role_module_access FOR DELETE
  TO authenticated
  USING (
    is_super_admin(auth.uid())
    OR get_org_role(auth.uid(), organization_id) = 'owner'
  );

CREATE TRIGGER update_studio_role_module_access_updated_at
  BEFORE UPDATE ON public.studio_role_module_access
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();