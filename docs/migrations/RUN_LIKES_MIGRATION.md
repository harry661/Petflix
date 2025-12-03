# Run Likes Migration

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click on **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New Query** button

3. **Copy Migration SQL**
   - Open `backend/migrations/007_add_likes.sql`
   - Copy the entire contents

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

5. **Verify Success**
   - You should see "Success" message
   - Go to **Table Editor** and verify you see the `likes` table
   - Check that `videos` table has a `like_count` column

## What This Migration Does

- Creates `likes` table to store user likes on videos
- Adds `like_count` column to `videos` table
- Creates indexes for performance
- Sets up trigger to automatically update like counts
- Prevents duplicate likes (UNIQUE constraint on user_id + video_id)

## After Running

Once this migration is complete, the like button should work properly!

