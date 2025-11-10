# Database Migrations

## Setup Instructions

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: Petflix (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to you
4. Wait for project to be created (takes ~2 minutes)

### Step 2: Run Migration

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click **New Query**
3. Open `backend/migrations/001_initial_schema.sql` from this project
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

### Step 3: Verify Tables

1. Go to **Table Editor** in Supabase dashboard
2. You should see these tables:
   - users
   - videos
   - followers
   - comments
   - playlists
   - playlist_videos
   - video_tags
   - push_subscriptions
   - user_notification_preferences
   - reported_videos

### Step 4: Get API Keys

1. Go to **Project Settings** (gear icon in left sidebar)
2. Click **API** in the settings menu
3. Copy:
   - **Project URL** → `SUPABASE_URL` in `.env`
   - **anon public** key → `SUPABASE_ANON_KEY` in `.env`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` in `.env` (keep this secret!)

### Step 5: Update Environment Variables

Update your `backend/.env` and `frontend/.env` files with the values from Step 4.

## Notes

- The migration includes all tables, indexes, triggers, and constraints
- The schema follows the PRD specifications
- All foreign keys have CASCADE delete for data integrity
- Indexes are created for performance on common queries

