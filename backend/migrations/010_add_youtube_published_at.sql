-- Migration to add YouTube published date to videos table
-- Run this in your Supabase SQL Editor

-- Add youtube_published_at column to store when the video was originally published on YouTube
ALTER TABLE videos ADD COLUMN IF NOT EXISTS youtube_published_at TIMESTAMP;

-- Create index for sorting by YouTube publish date
CREATE INDEX IF NOT EXISTS idx_videos_youtube_published_at ON videos(youtube_published_at DESC);

-- For existing videos, we can't backfill without hitting YouTube API quota
-- New videos will have this field populated when shared

