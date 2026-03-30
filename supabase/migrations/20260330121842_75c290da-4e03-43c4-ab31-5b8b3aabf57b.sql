
-- Allow anyone to upload to cv-uploads storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-uploads', 'cv-uploads', true) ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies for cv-uploads
CREATE POLICY "Anyone can upload to cv-uploads" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'cv-uploads');
CREATE POLICY "Anyone can update cv-uploads" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'cv-uploads') WITH CHECK (bucket_id = 'cv-uploads');
CREATE POLICY "Anyone can read cv-uploads" ON storage.objects FOR SELECT TO public USING (bucket_id = 'cv-uploads');
