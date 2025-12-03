# Run Repost Migration

If you're getting errors when trying to repost videos, you may need to run the migration that adds the `original_user_id` column.

## Steps:

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `011_add_original_user_id.sql`
4. Run the migration

This migration adds the `original_user_id` column to the `videos` table, which is used to track who originally shared a video when it's reposted.

