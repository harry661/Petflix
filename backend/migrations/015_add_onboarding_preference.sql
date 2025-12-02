-- Add show_onboarding field to user_notification_preferences
-- This allows users to opt out of seeing the onboarding modal

ALTER TABLE user_notification_preferences
ADD COLUMN IF NOT EXISTS show_onboarding BOOLEAN NOT NULL DEFAULT true;

-- Add comment
COMMENT ON COLUMN user_notification_preferences.show_onboarding IS 'Whether to show the onboarding modal when user logs in';

