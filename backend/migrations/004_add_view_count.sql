-- Add view_count column to videos table for tracking popularity
ALTER TABLE videos ADD COLUMN IF NOT EXISTS view_count BIGINT DEFAULT 0;

-- Create an index for faster sorting by view count
CREATE INDEX IF NOT EXISTS idx_videos_view_count ON videos(view_count DESC);

-- Create a composite index for sorting by view count and recency
CREATE INDEX IF NOT EXISTS idx_videos_popularity ON videos(view_count DESC, created_at DESC);

