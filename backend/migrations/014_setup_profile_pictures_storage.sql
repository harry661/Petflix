-- Migration to set up Supabase Storage for profile pictures
-- This SQL should be run in the Supabase SQL Editor
-- The Storage bucket must be created manually in the Supabase Dashboard

-- Note: Storage buckets cannot be created via SQL
-- You must create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: "profile-pictures"
-- 4. Public bucket: YES (checked)
-- 5. File size limit: 5MB (or your preferred limit)
-- 6. Allowed MIME types: image/jpeg, image/png, image/gif, image/webp
-- 7. Click "Create bucket"

-- Storage policies (run these after creating the bucket)
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

