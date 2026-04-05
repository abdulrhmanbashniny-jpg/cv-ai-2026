
-- Make cv-uploads bucket private
UPDATE storage.buckets SET public = false WHERE id = 'cv-uploads';

-- Only service_role can read files
CREATE POLICY "Only service role can read cv-uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cv-uploads' AND (select auth.role()) = 'service_role');
