-- Allow anonymous uploads to the 'images' bucket for the migration script
-- WARNING: You should disable or delete this policy after migration if you don't want public uploads!
CREATE POLICY "Allow public uploads" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'images');

-- Ensure update/delete is also allowed if we need to overwrite (upsert)
CREATE POLICY "Allow public updates" ON storage.objects
FOR UPDATE USING (bucket_id = 'images');
