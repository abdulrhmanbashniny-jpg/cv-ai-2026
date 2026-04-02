
DROP POLICY IF EXISTS "Anyone can upload to cv-uploads" ON storage.objects;
CREATE POLICY "Anyone can upload to cv-uploads"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'cv-uploads');
