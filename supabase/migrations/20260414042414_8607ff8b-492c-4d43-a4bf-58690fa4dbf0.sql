
-- Employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'photographer',
  department TEXT DEFAULT 'production',
  type TEXT NOT NULL DEFAULT 'in-office',
  status TEXT NOT NULL DEFAULT 'active',
  join_date DATE DEFAULT CURRENT_DATE,
  salary NUMERIC DEFAULT 0,
  aadhaar TEXT,
  pan TEXT,
  bank_name TEXT,
  bank_account TEXT,
  bank_ifsc TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view employees" ON public.employees FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can create employees" ON public.employees FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can update employees" ON public.employees FOR UPDATE TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can delete employees" ON public.employees FOR DELETE TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Super admins can view all employees" ON public.employees FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  total_hours NUMERIC DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'no-show',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view attendance" ON public.attendance FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can create attendance" ON public.attendance FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can update attendance" ON public.attendance FOR UPDATE TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can delete attendance" ON public.attendance FOR DELETE TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Super admins can view all attendance" ON public.attendance FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Leaves table
CREATE TABLE public.leaves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  leave_type TEXT NOT NULL DEFAULT 'Casual Leave',
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  days INTEGER NOT NULL DEFAULT 1,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  applied_on DATE NOT NULL DEFAULT CURRENT_DATE,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view leaves" ON public.leaves FOR SELECT TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can create leaves" ON public.leaves FOR INSERT TO authenticated WITH CHECK (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can update leaves" ON public.leaves FOR UPDATE TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org members can delete leaves" ON public.leaves FOR DELETE TO authenticated USING (is_org_member(auth.uid(), organization_id));
CREATE POLICY "Super admins can view all leaves" ON public.leaves FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));

CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON public.leaves FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
