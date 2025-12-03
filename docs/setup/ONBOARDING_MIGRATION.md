# Onboarding Feature - Migration Required

## Issue
The onboarding modal is showing 500 errors because the `show_onboarding` column doesn't exist in the `user_notification_preferences` table yet.

## Solution

You need to run the migration `015_add_onboarding_preference.sql` on your Supabase database.

### Option 1: Run via Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `backend/migrations/015_add_onboarding_preference.sql`:

```sql
-- Add show_onboarding field to user_notification_preferences
-- This allows users to opt out of seeing the onboarding modal

ALTER TABLE user_notification_preferences
ADD COLUMN IF NOT EXISTS show_onboarding BOOLEAN NOT NULL DEFAULT true;

-- Add comment
COMMENT ON COLUMN user_notification_preferences.show_onboarding IS 'Whether to show the onboarding modal when user logs in';
```

4. Click **Run** to execute the migration

### Option 2: Run via Supabase CLI

If you have Supabase CLI set up:

```bash
supabase db push
```

Or manually:

```bash
psql -h your-db-host -U postgres -d postgres -f backend/migrations/015_add_onboarding_preference.sql
```

## After Migration

Once the migration is run:
- The 500 errors will stop
- The onboarding preference will be saved correctly
- Users who check "Don't show this again" won't see the modal on subsequent logins

## Current Behavior

Until the migration is run:
- The backend will gracefully handle the missing column
- The onboarding modal will still appear (defaults to showing)
- The "Don't show again" preference won't persist (but won't cause errors)

