-- Migration to remove UNIQUE constraint on youtube_video_id
-- This allows multiple users to share the same YouTube video
-- Run this in your Supabase SQL Editor

-- Drop the unique constraint on youtube_video_id
-- We'll create a composite unique constraint on (user_id, youtube_video_id) instead
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_youtube_video_id_key;

-- Create a composite unique constraint: a user can only share the same YouTube video once
-- But different users can share the same YouTube video
CREATE UNIQUE INDEX IF NOT EXISTS videos_user_youtube_unique 
ON videos(user_id, youtube_video_id);

