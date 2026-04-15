
CREATE TABLE public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action TEXT NOT NULL,
  actor_id UUID NOT NULL,
  target_id TEXT,
  target_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (is_super_admin(auth.uid()));

CREATE POLICY "Super admins can create audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (is_super_admin(auth.uid()));

CREATE INDEX idx_audit_logs_action ON public.audit_logs (action);
CREATE INDEX idx_audit_logs_actor ON public.audit_logs (actor_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs (created_at DESC);
