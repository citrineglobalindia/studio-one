ALTER TABLE public.projects
  ADD COLUMN card_number text DEFAULT NULL,
  ADD COLUMN raw_data_size text DEFAULT NULL,
  ADD COLUMN backup_number text DEFAULT NULL,
  ADD COLUMN delivery_hdd text DEFAULT NULL;