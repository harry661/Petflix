# Quick Setup: Profile Pictures Storage Bucket

## Step-by-Step Instructions

### 1. Go to Supabase Dashboard
1. Open your browser and go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your Petflix project

### 2. Navigate to Storage
1. In the left sidebar, click **"Storage"** (it has a folder icon)
2. You should see a list of buckets (or an empty list if none exist)

### 3. Create the Bucket
1. Click the **"New bucket"** button (usually at the top right)
2. A dialog will appear with bucket configuration options

### 4. Configure the Bucket
Fill in the following:

- **Name**: `profile-pictures` (exactly this name, lowercase with hyphen)
- **Public bucket**: ✅ **Check this box** (IMPORTANT - this makes images publicly accessible)
- **File size limit**: `5242880` (5MB in bytes) or just enter `5` if it accepts MB
- **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp` (optional, but recommended)

### 5. Create the Bucket
1. Click **"Create bucket"** or **"Save"**
2. You should see the bucket appear in your list

### 6. Set Up Storage Policies (Optional but Recommended)

Since we're using the service role key on the backend, the policies are mainly for security. However, you can set them up for additional protection:

1. Click on the **"profile-pictures"** bucket
2. Go to the **"Policies"** tab
3. Click **"New policy"** or run the SQL from `backend/migrations/014_setup_profile_pictures_storage.sql`

**OR** run this SQL in the Supabase SQL Editor:

```sql
-- Allow authenticated users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to profile pictures
CREATE POLICY "Public can view profile pictures"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
```

### 7. Verify It Works
1. Go back to your Petflix app
2. Try uploading a profile picture again
3. The error should be gone!

## Troubleshooting

### "Bucket not found" error persists
- Double-check the bucket name is exactly `profile-pictures` (lowercase, with hyphen)
- Make sure you're in the correct Supabase project
- Refresh your app and try again

### "Permission denied" error
- Make sure the bucket is set to **Public**
- Check that `SUPABASE_SERVICE_ROLE_KEY` is set in your Vercel environment variables

### Images not displaying
- Verify the bucket is **Public**
- Check the public URL in the browser - it should be accessible without authentication

## Visual Guide

The bucket creation dialog should look like this:

```
┌─────────────────────────────────────┐
│ Create a new bucket                 │
├─────────────────────────────────────┤
│ Name: [profile-pictures        ]    │
│                                     │
│ ☑ Public bucket                    │
│                                     │
│ File size limit: [5242880      ]    │
│ Allowed MIME types:                │
│ [image/jpeg,image/png...]           │
│                                     │
│         [Cancel]  [Create bucket]   │
└─────────────────────────────────────┘
```

## Need Help?

If you're still having issues:
1. Check the Supabase Storage documentation: https://supabase.com/docs/guides/storage
2. Verify your Supabase project has Storage enabled
3. Check your Vercel logs for more detailed error messages

