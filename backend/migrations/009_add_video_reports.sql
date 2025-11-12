-- Migration to add video reporting functionality
-- Run this in your Supabase SQL Editor

-- Video reports table
CREATE TABLE IF NOT EXISTS video_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, reporter_id) -- Prevent duplicate reports from same user on same video
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_video_reports_video_id ON video_reports(video_id);
CREATE INDEX IF NOT EXISTS idx_video_reports_reporter_id ON video_reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_video_reports_status ON video_reports(status);
CREATE INDEX IF NOT EXISTS idx_video_reports_created_at ON video_reports(created_at DESC);

-- Update updated_at trigger
CREATE OR REPLACE FUNCTION update_video_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_video_reports_updated_at
    BEFORE UPDATE ON video_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_video_reports_updated_at();

