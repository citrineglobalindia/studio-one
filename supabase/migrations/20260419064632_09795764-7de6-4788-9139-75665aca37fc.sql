-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  client_id uuid,
  project_id uuid,
  name text NOT NULL,
  event_type text,
  event_date date NOT NULL,
  start_time time,
  end_time time,
  venue text,
  notes text,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view events" ON public.events
  FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));
CREATE POLICY "Org members can create events" ON public.events
  FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));
CREATE POLICY "Org members can update events" ON public.events
  FOR UPDATE TO authenticated USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));
CREATE POLICY "Org members can delete events" ON public.events
  FOR DELETE TO authenticated USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event team assignments
CREATE TABLE IF NOT EXISTS public.event_team_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_member_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, team_member_id)
);

ALTER TABLE public.event_team_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view event team" ON public.event_team_assignments
  FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));
CREATE POLICY "Org members can create event team" ON public.event_team_assignments
  FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));
CREATE POLICY "Org members can delete event team" ON public.event_team_assignments
  FOR DELETE TO authenticated USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));