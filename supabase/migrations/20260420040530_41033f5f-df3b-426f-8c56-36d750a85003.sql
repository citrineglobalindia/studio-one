-- Storage bucket for event-day media
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-day-media', 'event-day-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Org members can read event-day media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'event-day-media');

CREATE POLICY "Authenticated can upload event-day media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'event-day-media');

CREATE POLICY "Authenticated can update event-day media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'event-day-media');

CREATE POLICY "Authenticated can delete event-day media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'event-day-media');

-- Event check-ins: one row per (event, team_member)
CREATE TABLE public.event_check_ins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  event_id uuid NOT NULL,
  team_member_id uuid NOT NULL,
  user_id uuid,
  status text NOT NULL DEFAULT 'not-arrived',
  arrival_time timestamptz,
  arrival_photo_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (event_id, team_member_id)
);

ALTER TABLE public.event_check_ins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view check-ins"
  ON public.event_check_ins FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE POLICY "Org members can insert check-ins"
  ON public.event_check_ins FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE POLICY "Org members can update check-ins"
  ON public.event_check_ins FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE POLICY "Org members can delete check-ins"
  ON public.event_check_ins FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE TRIGGER trg_event_check_ins_updated
  BEFORE UPDATE ON public.event_check_ins
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Event activity log: append-only stream for photos / notes / status events
CREATE TABLE public.event_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  event_id uuid NOT NULL,
  team_member_id uuid,
  user_id uuid,
  actor_name text,
  activity_type text NOT NULL, -- 'status' | 'photo' | 'note'
  status text,
  photo_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.event_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view activity"
  ON public.event_activity FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE POLICY "Org members can insert activity"
  ON public.event_activity FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE INDEX idx_event_activity_org_time ON public.event_activity (organization_id, created_at DESC);
CREATE INDEX idx_event_activity_event ON public.event_activity (event_id, created_at DESC);
CREATE INDEX idx_event_check_ins_event ON public.event_check_ins (event_id);
CREATE INDEX idx_event_team_assignments_member ON public.event_team_assignments (team_member_id);
CREATE INDEX idx_team_members_user ON public.team_members (user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_check_ins;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_activity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.deliverables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_team_assignments;

ALTER TABLE public.event_check_ins REPLICA IDENTITY FULL;
ALTER TABLE public.event_activity REPLICA IDENTITY FULL;
ALTER TABLE public.deliverables REPLICA IDENTITY FULL;
ALTER TABLE public.expenses REPLICA IDENTITY FULL;