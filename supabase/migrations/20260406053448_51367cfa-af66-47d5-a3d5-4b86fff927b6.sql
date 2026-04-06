
-- Create expenses table for expense tracking with approval workflow
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  event_name TEXT,
  project_name TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  submitted_by TEXT NOT NULL DEFAULT 'Staff',
  paid_to TEXT,
  receipt_url TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  approval_status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Open RLS policies for demo
CREATE POLICY "Anyone can view expenses" ON public.expenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can create expenses" ON public.expenses FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone can update expenses" ON public.expenses FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Anyone can delete expenses" ON public.expenses FOR DELETE TO authenticated USING (true);

CREATE POLICY "Anon can view expenses" ON public.expenses FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can create expenses" ON public.expenses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update expenses" ON public.expenses FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete expenses" ON public.expenses FOR DELETE TO anon USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
BEFORE UPDATE ON public.expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
