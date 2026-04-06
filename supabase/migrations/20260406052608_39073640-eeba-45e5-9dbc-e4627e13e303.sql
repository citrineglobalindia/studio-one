
-- Create albums table
CREATE TABLE public.albums (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_name TEXT NOT NULL,
  project_name TEXT NOT NULL,
  album_type TEXT NOT NULL DEFAULT 'flush-mount',
  status TEXT NOT NULL DEFAULT 'uploaded',
  notes TEXT,
  pdf_file_name TEXT,
  pdf_file_path TEXT,
  pdf_file_size BIGINT,
  pages INTEGER DEFAULT 0,
  designer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view albums
CREATE POLICY "Anyone can view albums" ON public.albums FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to create albums
CREATE POLICY "Anyone can create albums" ON public.albums FOR INSERT TO authenticated WITH CHECK (true);

-- Allow all authenticated users to update albums
CREATE POLICY "Anyone can update albums" ON public.albums FOR UPDATE TO authenticated USING (true);

-- Allow all authenticated users to delete albums
CREATE POLICY "Anyone can delete albums" ON public.albums FOR DELETE TO authenticated USING (true);

-- Also allow anonymous access for demo/dev (no auth set up yet)
CREATE POLICY "Anon can view albums" ON public.albums FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can create albums" ON public.albums FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Anon can update albums" ON public.albums FOR UPDATE TO anon USING (true);
CREATE POLICY "Anon can delete albums" ON public.albums FOR DELETE TO anon USING (true);

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_albums_updated_at
  BEFORE UPDATE ON public.albums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for album PDFs
INSERT INTO storage.buckets (id, name, public) VALUES ('album-pdfs', 'album-pdfs', true);

-- Storage policies
CREATE POLICY "Anyone can view album PDFs" ON storage.objects FOR SELECT USING (bucket_id = 'album-pdfs');
CREATE POLICY "Anyone can upload album PDFs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'album-pdfs');
CREATE POLICY "Anyone can update album PDFs" ON storage.objects FOR UPDATE USING (bucket_id = 'album-pdfs');
CREATE POLICY "Anyone can delete album PDFs" ON storage.objects FOR DELETE USING (bucket_id = 'album-pdfs');
