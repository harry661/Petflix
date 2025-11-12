-- Migration to add notifications system
-- Run this in your Supabase SQL Editor

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('video_shared', 'comment', 'follow', 'like')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- User who triggered the notification
    related_video_id UUID REFERENCES videos(id) ON DELETE CASCADE, -- Video related to notification (if applicable)
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User-specific notification preferences (per user they follow)
CREATE TABLE IF NOT EXISTS user_follow_notification_preferences (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, following_user_id),
    CHECK (user_id != following_user_id) -- Prevent self-notification preferences
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_follow_notification_preferences_user_id ON user_follow_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_follow_notification_preferences_following_user_id ON user_follow_notification_preferences(following_user_id);

-- Trigger to update updated_at for user_follow_notification_preferences
CREATE TRIGGER update_user_follow_notification_preferences_updated_at 
    BEFORE UPDATE ON user_follow_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

