
-- Create super_admins table
CREATE TABLE public.super_admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Security definer function to check super admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = _user_id
  )
$$;

-- Only super admins can view the super_admins table
CREATE POLICY "Super admins can view super_admins"
ON public.super_admins FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Allow super admins to also view ALL organizations (add permissive policy)
CREATE POLICY "Super admins can view all organizations"
ON public.organizations FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Allow super admins to view ALL subscriptions
CREATE POLICY "Super admins can view all subscriptions"
ON public.subscriptions FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Allow super admins to view ALL org members
CREATE POLICY "Super admins can view all org members"
ON public.organization_members FOR SELECT TO authenticated
USING (is_super_admin(auth.uid()));

-- Seed current admin user as super admin
INSERT INTO public.super_admins (user_id)
VALUES ('f13e96ca-097a-4184-ade2-3e06f54fb12a');
