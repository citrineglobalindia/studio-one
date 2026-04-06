
-- Allow owners to SELECT their org (needed for INSERT...RETURNING)
CREATE POLICY "Owners can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());
