# Clear Browser Cache Instructions

## Quick Cache Clear (Recommended)

### Chrome/Edge/Brave:
1. Open DevTools (F12 or Cmd+Option+I on Mac)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**

### Firefox:
1. Open DevTools (F12 or Cmd+Option+I on Mac)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**

### Safari:
1. Open DevTools (Cmd+Option+I)
2. Go to **Network** tab
3. Check **"Disable Caches"**
4. Refresh the page

## Full Cache Clear

### Chrome/Edge:
1. Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
2. Select **"Cached images and files"**
3. Time range: **"All time"**
4. Click **"Clear data"**

### Firefox:
1. Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
2. Select **"Cache"**
3. Time range: **"Everything"**
4. Click **"Clear Now"**

### Safari:
1. Safari → Preferences → Advanced
2. Check **"Show Develop menu"**
3. Develop → **"Empty Caches"**

## Clear LocalStorage (Important for Testing)

1. Open DevTools (F12)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Local Storage** → your site URL
4. Right-click → **Clear** or delete individual items
5. This clears stored auth tokens and other local data

## Test After Clearing

1. Open browser console (F12)
2. Look for: `🔧 API URL Configuration:`
3. Verify it shows the correct URL
4. Try logging in
5. Check Network tab for API requests

## Local Development URLs

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

Make sure both are running!

