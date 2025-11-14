# Environment Variables Checklist

## URLs and Keys You Need to Collect

### 1. Frontend Vercel URL
**Where to get it:**
- Deploy your frontend to Vercel first
- After deployment, you'll get a URL like: `https://petflix.vercel.app`
- **Copy this URL** - you'll need it for backend CORS configuration

**Example:** `https://petflix.vercel.app`

---

### 2. Backend Vercel URL
**Where to get it:**
- Deploy your backend to Vercel (separate project)
- After deployment, you'll get a URL like: `https://petflix-backend.vercel.app`
- **Copy this URL** - you'll need it for frontend API configuration

**Example:** `https://petflix-backend.vercel.app`

---

### 3. Supabase Project URL
**Where to get it:**
1. Go to https://supabase.com
2. Sign in to your account
3. Select your Petflix project
4. Go to **Settings** → **API**
5. Copy the **Project URL**

**Example:** `https://xxxxxxxxxxxxx.supabase.co`

---

### 4. Supabase Service Role Key
**Where to get it:**
1. In Supabase, go to **Settings** → **API**
2. Scroll down to **Project API keys**
3. Copy the **service_role** key (NOT the anon key)
4. ⚠️ **Keep this secret** - it has admin access

**Example:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

### 5. YouTube API Key
**Where to get it:**
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable **YouTube Data API v3**
4. Go to **Credentials** → **Create Credentials** → **API Key**
5. Copy the API key

**Example:** `AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 6. JWT Secret
**Generate it:**
Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output - this is your JWT secret.

**Example:** `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

---

## Configuration Steps

### Step 1: Deploy Frontend to Vercel
1. Go to https://vercel.com
2. Create new project → Import `harry661/Petflix`
3. Set **Root Directory** to `frontend`
4. Deploy
5. **Copy the frontend URL** (e.g., `https://petflix.vercel.app`)

### Step 2: Deploy Backend to Vercel
1. Create a **NEW** Vercel project
2. Import the same repository: `harry661/Petflix`
3. Set **Root Directory** to `backend`
4. Add these environment variables:
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = (from Step 3 above)
   - `SUPABASE_SERVICE_ROLE_KEY` = (from Step 4 above)
   - `JWT_SECRET` = (from Step 6 above)
   - `YOUTUBE_API_KEY` = (from Step 5 above)
   - `CORS_ORIGIN` = (your frontend URL from Step 1)
5. Deploy
6. **Copy the backend URL** (e.g., `https://petflix-backend.vercel.app`)

### Step 3: Update Frontend Environment Variables
1. Go to your **frontend** Vercel project
2. Settings → Environment Variables
3. Add/Update:
   - `VITE_API_URL_PROD` = (your backend URL from Step 2)
   - Make sure it's set for **Production** environment
4. Redeploy frontend

---

## Quick Reference Table

| Variable | Where to Get It | Example Value |
|----------|----------------|---------------|
| **Frontend URL** | Vercel (after frontend deploy) | `https://petflix.vercel.app` |
| **Backend URL** | Vercel (after backend deploy) | `https://petflix-backend.vercel.app` |
| **Supabase URL** | Supabase Dashboard → Settings → API | `https://xxx.supabase.co` |
| **Supabase Service Key** | Supabase Dashboard → Settings → API | `eyJhbGciOiJIUzI1NiIs...` |
| **YouTube API Key** | Google Cloud Console | `AIzaSyBxxxxxxxxxxxxx` |
| **JWT Secret** | Generate with Node.js command | `a1b2c3d4e5f6...` |

---

## Environment Variables Summary

### Frontend Vercel Project (Production)
```
VITE_API_URL_PROD = https://petflix-backend.vercel.app
```

### Backend Vercel Project (Production)
```
NODE_ENV = production
SUPABASE_URL = https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIs...
JWT_SECRET = a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
YOUTUBE_API_KEY = AIzaSyBxxxxxxxxxxxxx
CORS_ORIGIN = https://petflix.vercel.app
```

---

## Testing Checklist

After setup, test these:
- [ ] Frontend loads at your Vercel URL
- [ ] Backend health check: `https://your-backend.vercel.app/health`
- [ ] Frontend can login/register (tests backend connection)
- [ ] No CORS errors in browser console

---

## Need Help?

If you're missing any of these:
- **Supabase**: Sign up at https://supabase.com (free tier available)
- **YouTube API**: Get it from Google Cloud Console (free quota available)
- **Vercel URLs**: Deploy first, then copy the URLs from the dashboard

