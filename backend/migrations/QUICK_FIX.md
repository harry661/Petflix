# Quick Fix for "Trigger Already Exists" Error

If you're getting an error that triggers already exist, you have two options:

## Option 1: Run the Fix Migration (Recommended)

Run `002_fix_triggers.sql` in your Supabase SQL Editor. This will:
- Drop the existing triggers
- Recreate them properly

## Option 2: Run the Safe Migration

Run `001_initial_schema_safe.sql` instead of the original. This version:
- Uses `DROP TRIGGER IF EXISTS` before creating triggers
- Handles all existing objects gracefully
- Safe to run multiple times

## Option 3: Manual Fix

If you just need to fix the triggers, run this in SQL Editor:

```sql
-- Drop existing triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
DROP TRIGGER IF EXISTS update_playlists_updated_at ON playlists;

-- Recreate triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Verify Tables Exist

After running any fix, verify your tables exist:
1. Go to **Table Editor** in Supabase
2. You should see: users, videos, followers, comments, playlists, etc.

If tables are missing, run `001_initial_schema_safe.sql` to create them.

