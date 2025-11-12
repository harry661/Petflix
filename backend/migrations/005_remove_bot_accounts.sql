-- Remove bot accounts and their videos
-- This script identifies and removes bot accounts based on common patterns

-- First, let's see what we're dealing with (for reference)
-- SELECT id, username, email, created_at FROM users ORDER BY created_at;

-- Delete videos from bot accounts
-- Bot accounts are typically identified by:
-- 1. Generic usernames (bot, test, user1, etc.)
-- 2. Pattern-based emails (test@, bot@, etc.)
-- 3. Accounts created in bulk (same timestamp patterns)
-- 4. No profile pictures and generic bios

DELETE FROM video_tags_direct
WHERE video_id IN (
  SELECT v.id 
  FROM videos v
  JOIN users u ON v.user_id = u.id
  WHERE 
    -- Generic bot usernames
    LOWER(u.username) LIKE '%bot%' OR
    LOWER(u.username) LIKE '%test%' OR
    LOWER(u.username) LIKE 'user%' OR
    LOWER(u.username) LIKE 'demo%' OR
    LOWER(u.username) LIKE 'sample%' OR
    -- Generic emails
    LOWER(u.email) LIKE '%bot%@%' OR
    LOWER(u.email) LIKE '%test%@%' OR
    LOWER(u.email) LIKE 'user%@%' OR
    -- Pattern matching for generated accounts
    u.username ~ '^[a-z]+[0-9]+$' OR
    u.email ~ '^[a-z]+[0-9]+@'
);

-- Delete comments from bot accounts
DELETE FROM comments
WHERE user_id IN (
  SELECT id FROM users
  WHERE 
    LOWER(username) LIKE '%bot%' OR
    LOWER(username) LIKE '%test%' OR
    LOWER(username) LIKE 'user%' OR
    LOWER(username) LIKE 'demo%' OR
    LOWER(username) LIKE 'sample%' OR
    LOWER(email) LIKE '%bot%@%' OR
    LOWER(email) LIKE '%test%@%' OR
    LOWER(email) LIKE 'user%@%' OR
    username ~ '^[a-z]+[0-9]+$' OR
    email ~ '^[a-z]+[0-9]+@'
);

-- Delete videos from bot accounts
DELETE FROM videos
WHERE user_id IN (
  SELECT id FROM users
  WHERE 
    LOWER(username) LIKE '%bot%' OR
    LOWER(username) LIKE '%test%' OR
    LOWER(username) LIKE 'user%' OR
    LOWER(username) LIKE 'demo%' OR
    LOWER(username) LIKE 'sample%' OR
    LOWER(email) LIKE '%bot%@%' OR
    LOWER(email) LIKE '%test%@%' OR
    LOWER(email) LIKE 'user%@%' OR
    username ~ '^[a-z]+[0-9]+$' OR
    email ~ '^[a-z]+[0-9]+@'
);

-- Delete followers/following relationships for bot accounts
DELETE FROM followers
WHERE follower_id IN (
  SELECT id FROM users
  WHERE 
    LOWER(username) LIKE '%bot%' OR
    LOWER(username) LIKE '%test%' OR
    LOWER(username) LIKE 'user%' OR
    LOWER(username) LIKE 'demo%' OR
    LOWER(username) LIKE 'sample%' OR
    LOWER(email) LIKE '%bot%@%' OR
    LOWER(email) LIKE '%test%@%' OR
    LOWER(email) LIKE 'user%@%' OR
    username ~ '^[a-z]+[0-9]+$' OR
    email ~ '^[a-z]+[0-9]+@'
) OR following_id IN (
  SELECT id FROM users
  WHERE 
    LOWER(username) LIKE '%bot%' OR
    LOWER(username) LIKE '%test%' OR
    LOWER(username) LIKE 'user%' OR
    LOWER(username) LIKE 'demo%' OR
    LOWER(username) LIKE 'sample%' OR
    LOWER(email) LIKE '%bot%@%' OR
    LOWER(email) LIKE '%test%@%' OR
    LOWER(email) LIKE 'user%@%' OR
    username ~ '^[a-z]+[0-9]+$' OR
    email ~ '^[a-z]+[0-9]+@'
);

-- Delete playlists from bot accounts
DELETE FROM playlist_videos
WHERE playlist_id IN (
  SELECT id FROM playlists
  WHERE user_id IN (
    SELECT id FROM users
    WHERE 
      LOWER(username) LIKE '%bot%' OR
      LOWER(username) LIKE '%test%' OR
      LOWER(username) LIKE 'user%' OR
      LOWER(username) LIKE 'demo%' OR
      LOWER(username) LIKE 'sample%' OR
      LOWER(email) LIKE '%bot%@%' OR
      LOWER(email) LIKE '%test%@%' OR
      LOWER(email) LIKE 'user%@%' OR
      username ~ '^[a-z]+[0-9]+$' OR
      email ~ '^[a-z]+[0-9]+@'
  )
);

DELETE FROM video_tags
WHERE playlist_id IN (
  SELECT id FROM playlists
  WHERE user_id IN (
    SELECT id FROM users
    WHERE 
      LOWER(username) LIKE '%bot%' OR
      LOWER(username) LIKE '%test%' OR
      LOWER(username) LIKE 'user%' OR
      LOWER(username) LIKE 'demo%' OR
      LOWER(username) LIKE 'sample%' OR
      LOWER(email) LIKE '%bot%@%' OR
      LOWER(email) LIKE '%test%@%' OR
      LOWER(email) LIKE 'user%@%' OR
      username ~ '^[a-z]+[0-9]+$' OR
      email ~ '^[a-z]+[0-9]+@'
  )
);

DELETE FROM playlists
WHERE user_id IN (
  SELECT id FROM users
  WHERE 
    LOWER(username) LIKE '%bot%' OR
    LOWER(username) LIKE '%test%' OR
    LOWER(username) LIKE 'user%' OR
    LOWER(username) LIKE 'demo%' OR
    LOWER(username) LIKE 'sample%' OR
    LOWER(email) LIKE '%bot%@%' OR
    LOWER(email) LIKE '%test%@%' OR
    LOWER(email) LIKE 'user%@%' OR
    username ~ '^[a-z]+[0-9]+$' OR
    email ~ '^[a-z]+[0-9]+@'
);

-- Finally, delete the bot accounts themselves
DELETE FROM users
WHERE 
  LOWER(username) LIKE '%bot%' OR
  LOWER(username) LIKE '%test%' OR
  LOWER(username) LIKE 'user%' OR
  LOWER(username) LIKE 'demo%' OR
  LOWER(username) LIKE 'sample%' OR
  LOWER(email) LIKE '%bot%@%' OR
  LOWER(email) LIKE '%test%@%' OR
  LOWER(email) LIKE 'user%@%' OR
  username ~ '^[a-z]+[0-9]+$' OR
  email ~ '^[a-z]+[0-9]+@';

