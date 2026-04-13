
-- Add new columns to albums table
ALTER TABLE public.albums
  ADD COLUMN organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  ADD COLUMN client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  ADD COLUMN event_name TEXT,
  ADD COLUMN event_date DATE,
  ADD COLUMN printer_name TEXT,
  ADD COLUMN printer_contact TEXT,
  ADD COLUMN printing_cost NUMERIC DEFAULT 0,
  ADD COLUMN album_size TEXT DEFAULT '12x36',
  ADD COLUMN cover_type TEXT DEFAULT 'Hard Cover',
  ADD COLUMN paper_type TEXT DEFAULT 'Glossy';

-- Drop old permissive policies
DROP POLICY IF EXISTS "Anyone can view albums" ON public.albums;
DROP POLICY IF EXISTS "Anyone can create albums" ON public.albums;
DROP POLICY IF EXISTS "Anyone can update albums" ON public.albums;
DROP POLICY IF EXISTS "Anyone can delete albums" ON public.albums;
DROP POLICY IF EXISTS "Anon can view albums" ON public.albums;
DROP POLICY IF EXISTS "Anon can create albums" ON public.albums;
DROP POLICY IF EXISTS "Anon can update albums" ON public.albums;
DROP POLICY IF EXISTS "Anon can delete albums" ON public.albums;

-- New org-scoped RLS policies
CREATE POLICY "Org members can view albums"
  ON public.albums FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR organization_id IS NULL);

CREATE POLICY "Org members can create albums"
  ON public.albums FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) OR organization_id IS NULL);

CREATE POLICY "Org members can update albums"
  ON public.albums FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR organization_id IS NULL);

CREATE POLICY "Org members can delete albums"
  ON public.albums FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR organization_id IS NULL);

CREATE POLICY "Super admins can view all albums"
  ON public.albums FOR SELECT TO authenticated
  USING (is_super_admin(auth.uid()));

-- Index for performance
CREATE INDEX idx_albums_organization_id ON public.albums(organization_id);
CREATE INDEX idx_albums_client_id ON public.albums(client_id);
