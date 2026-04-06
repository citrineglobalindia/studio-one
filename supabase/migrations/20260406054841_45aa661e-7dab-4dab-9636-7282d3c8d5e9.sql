
-- Create storage bucket for expense receipts
INSERT INTO storage.buckets (id, name, public) VALUES ('expense-receipts', 'expense-receipts', true);

-- RLS policies for expense receipts bucket
CREATE POLICY "Anyone can view receipts" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'expense-receipts');
CREATE POLICY "Anyone can upload receipts" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'expense-receipts');
CREATE POLICY "Anyone can update receipts" ON storage.objects FOR UPDATE TO anon, authenticated USING (bucket_id = 'expense-receipts');
CREATE POLICY "Anyone can delete receipts" ON storage.objects FOR DELETE TO anon, authenticated USING (bucket_id = 'expense-receipts');
