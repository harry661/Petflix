# Run Security Migration

Supabase Security Advisor has identified that Row Level Security (RLS) is not enabled on your public tables, and there are function search_path security issues.

## Security Issues Found:

1. **RLS Disabled** on these tables:
   - users
   - videos
   - followers
   - comments
   - playlists
   - playlist_videos
   - video_tags
   - video_tags_direct
   - push_subscriptions
   - user_notification_preferences
   - user_follow_notification_preferences
   - notifications
   - reported_videos
   - likes

2. **Function Search Path Issues**:
   - update_updated_at_column
   - update_video_like_count

## Steps to Fix:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `013_enable_rls_and_fix_security.sql`
4. Run the migration

## Important Notes:

- **This migration enables RLS but your backend will still work** because it uses the service role key which bypasses RLS
- **RLS protects against direct database access** from the frontend or unauthorized users
- **All policies allow public read access** to videos, users, comments, etc. (for displaying content)
- **Write operations require authentication** and users can only modify their own data
- **The function search_path fixes** prevent potential security vulnerabilities in PostgreSQL functions

## After Running:

After running this migration, the Supabase Security Advisor should show all security issues as resolved. The platform will continue to function normally, but with better security protections in place.

