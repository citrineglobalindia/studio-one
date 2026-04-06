
-- 1. Create tables first (no RLS yet)
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  owner_id UUID NOT NULL,
  city TEXT,
  phone TEXT,
  website TEXT,
  instagram TEXT,
  team_size TEXT DEFAULT 'solo',
  specialties TEXT[] DEFAULT '{}',
  primary_color TEXT DEFAULT '#C4973B',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.organization_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  invited_email TEXT,
  invited_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  price NUMERIC NOT NULL DEFAULT 0,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  max_clients INTEGER DEFAULT 10,
  max_projects INTEGER DEFAULT 5,
  max_team_members INTEGER DEFAULT 1,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'trial',
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  current_period_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. Security definer functions (tables exist now)
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_org_role(_user_id UUID, _org_id UUID)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.organization_members
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1
$$;

-- 4. RLS Policies
CREATE POLICY "Members can view their organization"
ON public.organizations FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), id));

CREATE POLICY "Owners can update their organization"
ON public.organizations FOR UPDATE TO authenticated
USING (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create organizations"
ON public.organizations FOR INSERT TO authenticated
WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Members can view org members"
ON public.organization_members FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Owners and admins can add members"
ON public.organization_members FOR INSERT TO authenticated
WITH CHECK (
  public.get_org_role(auth.uid(), organization_id) IN ('owner', 'admin')
  OR user_id = auth.uid()
);

CREATE POLICY "Owners can remove members"
ON public.organization_members FOR DELETE TO authenticated
USING (public.get_org_role(auth.uid(), organization_id) = 'owner');

CREATE POLICY "Anyone can view plans"
ON public.subscription_plans FOR SELECT
USING (true);

CREATE POLICY "Org members can view subscription"
ON public.subscriptions FOR SELECT TO authenticated
USING (public.is_org_member(auth.uid(), organization_id));

CREATE POLICY "Owners can update subscription"
ON public.subscriptions FOR UPDATE TO authenticated
USING (public.get_org_role(auth.uid(), organization_id) = 'owner');

CREATE POLICY "Owners can create subscriptions"
ON public.subscriptions FOR INSERT TO authenticated
WITH CHECK (public.get_org_role(auth.uid(), organization_id) IN ('owner', 'admin'));

-- 5. Triggers
CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Seed plans
INSERT INTO public.subscription_plans (name, slug, price, billing_period, max_clients, max_projects, max_team_members, features, sort_order)
VALUES
  ('Starter', 'starter', 0, 'monthly', 10, 5, 1, '["Basic CRM", "Lead management", "5 projects", "Email support"]'::jsonb, 1),
  ('Professional', 'professional', 2999, 'monthly', -1, -1, 10, '["Unlimited clients", "Full CRM & automation", "Unlimited projects", "AI assistant", "Contracts & invoicing", "Priority support"]'::jsonb, 2),
  ('Enterprise', 'enterprise', 7999, 'monthly', -1, -1, -1, '["Everything in Pro", "Unlimited team", "White-label branding", "API access", "Custom integrations", "Dedicated account manager", "SSO & security"]'::jsonb, 3);
