# Profile Picture Upload Setup

This document explains how to set up the profile picture file upload feature.

## Overview

The profile picture upload feature allows users to upload their own image files directly, rather than pasting URLs. Images are:
- Validated (type, size)
- Processed and resized (400x400px, optimized)
- Stored in Supabase Storage
- Automatically cleaned up when replaced

## Prerequisites

1. Supabase project with Storage enabled
2. Backend dependencies installed (`multer`, `sharp`)
3. Frontend updated with file input component

## Setup Steps

### 1. Create Supabase Storage Bucket

1. Go to your **Supabase Dashboard**
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name**: `profile-pictures`
   - **Public bucket**: ✅ **YES** (checked) - Required for public image URLs
   - **File size limit**: `5MB` (or your preferred limit)
   - **Allowed MIME types**: `image/jpeg, image/png, image/gif, image/webp`
5. Click **"Create bucket"**

### 2. Set Up Storage Policies

Run the SQL from `backend/migrations/014_setup_profile_pictures_storage.sql` in your Supabase SQL Editor:

```sql
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
```

### 3. Verify Environment Variables

Ensure these environment variables are set in your backend (Vercel):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (required for server-side uploads)

### 4. Test the Feature

1. Go to Account Settings → Profile tab
2. Click the camera icon on your profile picture
3. Click "Choose Image File"
4. Select an image file (JPEG, PNG, GIF, or WebP, max 5MB)
5. Click "Upload"
6. Verify the image appears correctly

## Technical Details

### Backend Endpoint

- **Route**: `POST /api/v1/users/me/profile-picture`
- **Authentication**: Required (Bearer token)
- **Content-Type**: `multipart/form-data`
- **Field name**: `profilePicture`

### Image Processing

- **Resize**: 400x400px (cover, centered)
- **Format**: Converted to JPEG (quality: 85)
- **Storage**: Supabase Storage bucket `profile-pictures`
- **File naming**: `{userId}/{timestamp}-{random}.jpg`

### File Validation

- **Allowed types**: JPEG, PNG, GIF, WebP
- **Max size**: 5MB
- **Validation**: Both frontend and backend

### Old Image Cleanup

When a user uploads a new profile picture:
- The old image (if stored in our bucket) is automatically deleted
- External URLs (e.g., Unsplash) are not deleted

## Troubleshooting

### "Storage bucket not configured" Error

- Verify the bucket `profile-pictures` exists in Supabase Storage
- Check that the bucket is set to **Public**
- Ensure storage policies are set up correctly

### "Failed to upload image" Error

- Check Supabase Storage quota/limits
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check backend logs for detailed error messages

### Image Not Displaying

- Verify the bucket is **Public**
- Check the public URL is accessible
- Verify CORS settings in Supabase (if needed)

## Migration from URL Input

The old URL input method is still supported via the `PUT /api/v1/users/me` endpoint. Users can still paste URLs if they prefer, but the primary method is now file upload.

