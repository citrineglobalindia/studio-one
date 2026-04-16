-- Allow super admins to delete organizations
CREATE POLICY "Super admins can delete organizations"
ON public.organizations
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

-- Allow super admins to delete subscriptions
CREATE POLICY "Super admins can delete subscriptions"
ON public.subscriptions
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));

-- Allow super admins to delete organization members
CREATE POLICY "Super admins can delete org members"
ON public.organization_members
FOR DELETE
TO authenticated
USING (is_super_admin(auth.uid()));