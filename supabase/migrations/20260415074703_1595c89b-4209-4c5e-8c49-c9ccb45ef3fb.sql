
CREATE POLICY "Super admins can update any organization"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (is_super_admin(auth.uid()));
