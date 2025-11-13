-- Migration to add original_user_id for reposted/shared videos
-- Run this in your Supabase SQL Editor

-- Add original_user_id column to track who originally shared the video
-- NULL means the user_id is the original sharer, non-NULL means it's a repost
ALTER TABLE videos ADD COLUMN IF NOT EXISTS original_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_videos_original_user_id ON videos(original_user_id);

-- Add comment to explain the field
COMMENT ON COLUMN videos.original_user_id IS 'If set, this video was reposted/shared by user_id, originally shared by original_user_id. If NULL, user_id is the original sharer.';

