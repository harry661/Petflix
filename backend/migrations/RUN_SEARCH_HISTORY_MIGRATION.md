# Run Search History Migration

## Issue
The `search_history` table is missing from the database, causing search history functionality to fail.

## Error Message
```
Could not find the table 'public.search_history' in the schema cache
```

## Quick Steps

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Click on **SQL Editor** in the left sidebar

2. **Create New Query**
   - Click **New Query** button

3. **Copy Migration SQL**
   - Open `backend/migrations/008_add_search_history.sql`
   - Copy the entire contents

4. **Paste and Run**
   - Paste into the SQL Editor
   - Click **Run** (or press Cmd/Ctrl + Enter)

5. **Verify Success**
   - You should see "Success" message
   - Go to **Table Editor** and verify you see the `search_history` table

## What This Migration Does

- Creates `search_history` table to store user search queries
- Adds indexes for performance (user_id, created_at)
- Sets up foreign key relationship with users table (CASCADE delete)

## After Running

Once this migration is complete, the search history feature will work properly. Users will be able to:
- See their search history
- Clear their search history
- Have their searches automatically saved

