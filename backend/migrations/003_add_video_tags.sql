-- Add video tags table for direct video tagging (separate from playlist tags)
-- This allows users to tag videos when sharing them for filtering purposes

CREATE TABLE IF NOT EXISTS video_tags_direct (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    tag_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, tag_name) -- Prevent duplicate tags on same video
);

-- Create index for faster tag-based queries
CREATE INDEX IF NOT EXISTS idx_video_tags_direct_video_id ON video_tags_direct(video_id);
CREATE INDEX IF NOT EXISTS idx_video_tags_direct_tag_name ON video_tags_direct(tag_name);

