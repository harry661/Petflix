-- Migration to enable Row Level Security (RLS) on all public tables
-- and fix function search_path security issues
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tags_direct ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follow_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS TABLE POLICIES
-- ============================================================================

-- Allow public read access to user profiles (for displaying usernames, profile pictures)
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own account (handled by backend during registration)
CREATE POLICY "Users can insert own account"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- VIDEOS TABLE POLICIES
-- ============================================================================

-- Allow public read access to all videos
CREATE POLICY "Videos are viewable by everyone"
  ON videos FOR SELECT
  USING (true);

-- Authenticated users can insert videos (they share)
CREATE POLICY "Authenticated users can share videos"
  ON videos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own videos
CREATE POLICY "Users can update own videos"
  ON videos FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own videos
CREATE POLICY "Users can delete own videos"
  ON videos FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FOLLOWERS TABLE POLICIES
-- ============================================================================

-- Users can view all follow relationships (public data)
CREATE POLICY "Follow relationships are viewable by everyone"
  ON followers FOR SELECT
  USING (true);

-- Users can follow other users
CREATE POLICY "Users can follow others"
  ON followers FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Users can unfollow (delete their own follow relationships)
CREATE POLICY "Users can unfollow"
  ON followers FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================================================
-- COMMENTS TABLE POLICIES
-- ============================================================================

-- Allow public read access to comments
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (true);

-- Authenticated users can post comments
CREATE POLICY "Authenticated users can post comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PLAYLISTS TABLE POLICIES
-- ============================================================================

-- Users can view their own playlists and public playlists
CREATE POLICY "Playlists are viewable by owner and public"
  ON playlists FOR SELECT
  USING (
    auth.uid() = user_id OR 
    visibility = 'public'
  );

-- Users can create their own playlists
CREATE POLICY "Users can create own playlists"
  ON playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own playlists
CREATE POLICY "Users can update own playlists"
  ON playlists FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own playlists
CREATE POLICY "Users can delete own playlists"
  ON playlists FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PLAYLIST_VIDEOS TABLE POLICIES
-- ============================================================================

-- Users can view videos in their own playlists and public playlists
CREATE POLICY "Playlist videos are viewable by playlist owner and public playlists"
  ON playlist_videos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_videos.playlist_id 
      AND (playlists.user_id = auth.uid() OR playlists.visibility = 'public')
    )
  );

-- Users can add videos to their own playlists
CREATE POLICY "Users can add videos to own playlists"
  ON playlist_videos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_videos.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- Users can remove videos from their own playlists
CREATE POLICY "Users can remove videos from own playlists"
  ON playlist_videos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_videos.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VIDEO_TAGS TABLE POLICIES
-- ============================================================================

-- Users can view tags in their own playlists and public playlists
CREATE POLICY "Video tags are viewable by playlist owner and public playlists"
  ON video_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = video_tags.playlist_id 
      AND (playlists.user_id = auth.uid() OR playlists.visibility = 'public')
    )
  );

-- Users can add tags to videos in their own playlists
CREATE POLICY "Users can add tags to own playlist videos"
  ON video_tags FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = video_tags.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- Users can delete tags from their own playlists
CREATE POLICY "Users can delete tags from own playlists"
  ON video_tags FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = video_tags.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- ============================================================================
-- VIDEO_TAGS_DIRECT TABLE POLICIES
-- ============================================================================

-- Allow public read access to video tags (for filtering)
CREATE POLICY "Video tags direct are viewable by everyone"
  ON video_tags_direct FOR SELECT
  USING (true);

-- Authenticated users can add tags to videos they shared
CREATE POLICY "Users can add tags to own videos"
  ON video_tags_direct FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM videos 
      WHERE videos.id = video_tags_direct.video_id 
      AND videos.user_id = auth.uid()
    )
  );

-- Users can delete tags from their own videos
CREATE POLICY "Users can delete tags from own videos"
  ON video_tags_direct FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM videos 
      WHERE videos.id = video_tags_direct.video_id 
      AND videos.user_id = auth.uid()
    )
  );

-- ============================================================================
-- LIKES TABLE POLICIES
-- ============================================================================

-- Allow public read access to likes (for displaying like counts)
CREATE POLICY "Likes are viewable by everyone"
  ON likes FOR SELECT
  USING (true);

-- Authenticated users can like videos
CREATE POLICY "Authenticated users can like videos"
  ON likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can unlike (delete their own likes)
CREATE POLICY "Users can unlike videos"
  ON likes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATIONS TABLE POLICIES
-- ============================================================================

-- Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Backend can insert notifications (service role)
-- Note: Service role bypasses RLS, so this is handled by backend

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER_NOTIFICATION_PREFERENCES TABLE POLICIES
-- ============================================================================

-- Users can view their own notification preferences
CREATE POLICY "Users can view own notification preferences"
  ON user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert own notification preferences"
  ON user_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own notification preferences
CREATE POLICY "Users can update own notification preferences"
  ON user_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- USER_FOLLOW_NOTIFICATION_PREFERENCES TABLE POLICIES
-- ============================================================================

-- Users can view their own follow notification preferences
CREATE POLICY "Users can view own follow notification preferences"
  ON user_follow_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own follow notification preferences
CREATE POLICY "Users can insert own follow notification preferences"
  ON user_follow_notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own follow notification preferences
CREATE POLICY "Users can update own follow notification preferences"
  ON user_follow_notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PUSH_SUBSCRIPTIONS TABLE POLICIES
-- ============================================================================

-- Users can only view their own push subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own push subscriptions
CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own push subscriptions
CREATE POLICY "Users can update own push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own push subscriptions
CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- REPORTED_VIDEOS TABLE POLICIES
-- ============================================================================

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON reported_videos FOR SELECT
  USING (auth.uid() = reported_by_user_id);

-- Authenticated users can report videos
CREATE POLICY "Authenticated users can report videos"
  ON reported_videos FOR INSERT
  WITH CHECK (auth.uid() = reported_by_user_id);

-- ============================================================================
-- FIX FUNCTION SEARCH_PATH SECURITY ISSUES
-- ============================================================================

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

-- Fix update_video_like_count function
CREATE OR REPLACE FUNCTION update_video_like_count()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE videos SET like_count = like_count + 1 WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE videos SET like_count = GREATEST(0, like_count - 1) WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

