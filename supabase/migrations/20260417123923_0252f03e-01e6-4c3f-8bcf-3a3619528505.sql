CREATE TABLE IF NOT EXISTS public.lead_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  title text NOT NULL,
  notes text,
  reminder_type text NOT NULL DEFAULT 'follow-up',
  scheduled_at timestamptz NOT NULL,
  meeting_link text,
  location text,
  status text NOT NULL DEFAULT 'pending',
  created_by uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_reminders_lead ON public.lead_reminders(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_reminders_org_scheduled ON public.lead_reminders(organization_id, scheduled_at);

ALTER TABLE public.lead_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view lead reminders"
  ON public.lead_reminders FOR SELECT TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE POLICY "Org members can insert lead reminders"
  ON public.lead_reminders FOR INSERT TO authenticated
  WITH CHECK (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE POLICY "Org members can update lead reminders"
  ON public.lead_reminders FOR UPDATE TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE POLICY "Org members can delete lead reminders"
  ON public.lead_reminders FOR DELETE TO authenticated
  USING (is_org_member(auth.uid(), organization_id) OR is_super_admin(auth.uid()));

CREATE TRIGGER update_lead_reminders_updated_at
  BEFORE UPDATE ON public.lead_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();