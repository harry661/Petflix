# Vercel Environment Variables Troubleshooting

## Issue: "Can't use the key name"

### Possible Causes & Solutions

#### 1. Variable Already Exists
**Problem**: You're trying to add a variable that already exists.

**Solution**: 
- Look for existing `VITE_API_URL` in your environment variables list
- If it exists, click on it to **edit** instead of adding new
- Or delete the old one and add a new one

#### 2. Invalid Characters
**Problem**: Key names can only contain:
- Letters (A-Z, a-z)
- Numbers (0-9)
- Underscores (_)

**Solution**: 
- ✅ Good: `VITE_API_URL`, `VITE_YOUTUBE_API_KEY`
- ❌ Bad: `VITE-API-URL` (hyphens), `VITE.API.URL` (dots), `VITE API URL` (spaces)

#### 3. Reserved Names
**Problem**: Some names are reserved by Vercel (unlikely for `VITE_*` names).

**Solution**: 
- `VITE_API_URL` and `VITE_YOUTUBE_API_KEY` are NOT reserved
- If you get a "reserved" error, try a different name like `VITE_BACKEND_URL`

#### 4. Wrong Location
**Problem**: You might be in the wrong section.

**Solution**: 
- Make sure you're in: **Project Settings** → **Environment Variables**
- NOT in: Team Settings, Account Settings, or Build Settings

#### 5. Typo or Formatting
**Problem**: Copy-paste might have extra characters.

**Solution**:
- Type the key name manually: `VITE_API_URL`
- Make sure there are no spaces before/after
- Check for hidden characters

## Alternative Key Names

If `VITE_API_URL` doesn't work, try these alternatives:

1. `VITE_BACKEND_URL`
2. `VITE_API_BASE_URL`
3. `VITE_SERVER_URL`
4. `VITE_REST_API_URL`

Then update your code to use the new name:

```typescript
// In your code, change from:
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// To:
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
```

## Step-by-Step Fix

1. **Check existing variables**:
   - Go to Settings → Environment Variables
   - Scroll through the list
   - Look for any `VITE_*` variables

2. **Delete if exists**:
   - Click on the variable
   - Click "Remove" or delete icon
   - Confirm deletion

3. **Add fresh**:
   - Click "Add New"
   - Type key manually: `VITE_API_URL`
   - Add value
   - Select environment
   - Click "Save"

4. **If still doesn't work**:
   - Try alternative name: `VITE_BACKEND_URL`
   - Update code to match (see above)

## Quick Test

To verify your variable name is valid:
- ✅ Contains only letters, numbers, underscores
- ✅ Starts with `VITE_` (for Vite apps)
- ✅ No spaces or special characters
- ✅ Not already in the list

## Still Having Issues?

Share:
1. The exact error message you see
2. What key name you're trying to use
3. Whether the variable already exists in the list

