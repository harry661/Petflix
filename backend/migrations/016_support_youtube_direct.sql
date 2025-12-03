-- Migration to support YouTube videos directly without requiring them to be shared
-- This allows likes, comments, and reports to work on YouTube videos without creating a video entry

-- Modify likes table to support YouTube videos
ALTER TABLE likes 
  ALTER COLUMN video_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS youtube_video_id VARCHAR(255);

-- Add constraint: either video_id or youtube_video_id must be set
ALTER TABLE likes 
  ADD CONSTRAINT likes_video_or_youtube_check 
  CHECK ((video_id IS NOT NULL) OR (youtube_video_id IS NOT NULL));

-- Add unique constraint for YouTube video likes
CREATE UNIQUE INDEX IF NOT EXISTS idx_likes_user_youtube_video 
  ON likes(user_id, youtube_video_id) 
  WHERE youtube_video_id IS NOT NULL;

-- Modify comments table to support YouTube videos
ALTER TABLE comments 
  ALTER COLUMN video_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS youtube_video_id VARCHAR(255);

-- Add constraint: either video_id or youtube_video_id must be set
ALTER TABLE comments 
  ADD CONSTRAINT comments_video_or_youtube_check 
  CHECK ((video_id IS NOT NULL) OR (youtube_video_id IS NOT NULL));

-- Add index for YouTube video comments
CREATE INDEX IF NOT EXISTS idx_comments_youtube_video_id 
  ON comments(youtube_video_id) 
  WHERE youtube_video_id IS NOT NULL;

-- Modify reported_videos table to support YouTube videos
ALTER TABLE reported_videos 
  ALTER COLUMN video_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS youtube_video_id VARCHAR(255);

-- Add constraint: either video_id or youtube_video_id must be set
ALTER TABLE reported_videos 
  ADD CONSTRAINT reported_videos_video_or_youtube_check 
  CHECK ((video_id IS NOT NULL) OR (youtube_video_id IS NOT NULL));

-- Add unique constraint for YouTube video reports
CREATE UNIQUE INDEX IF NOT EXISTS idx_reported_videos_user_youtube_video 
  ON reported_videos(reported_by_user_id, youtube_video_id) 
  WHERE youtube_video_id IS NOT NULL;

-- Note: We can't modify the foreign key constraint directly, so we'll need to handle this in the application
-- The foreign key will still exist but will allow NULL values now

