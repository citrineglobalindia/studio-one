
DROP POLICY "Org members can create clients" ON public.clients;
CREATE POLICY "Org members or super admins can create clients"
  ON public.clients FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

DROP POLICY "Org members can update clients" ON public.clients;
CREATE POLICY "Org members or super admins can update clients"
  ON public.clients FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

DROP POLICY "Org members can delete clients" ON public.clients;
CREATE POLICY "Org members or super admins can delete clients"
  ON public.clients FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));
