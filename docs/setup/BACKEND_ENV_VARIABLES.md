# Backend Environment Variables for Vercel

## Required Environment Variables

Add these in your **Backend Vercel Project** → Settings → Environment Variables:

### 1. NODE_ENV
```
Key: NODE_ENV
Value: production
```

### 2. SUPABASE_URL
```
Key: SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co
```
**Where to get it:**
- Go to Supabase Dashboard → Your Project → Settings → API
- Copy the "Project URL"

### 3. SUPABASE_ANON_KEY
```
Key: SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**Where to get it:**
- Same page as above (Supabase Dashboard → Settings → API)
- Copy the "anon public" key

### 4. SUPABASE_SERVICE_ROLE_KEY
```
Key: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**Where to get it:**
- Same page as above (Supabase Dashboard → Settings → API)
- Copy the "service_role" key (⚠️ Keep this secret!)

### 5. YOUTUBE_API_KEY
```
Key: YOUTUBE_API_KEY
Value: AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
**Where to get it:**
- Go to Google Cloud Console → Credentials
- Create API Key (enable YouTube Data API v3 first)

### 6. JWT_SECRET
```
Key: JWT_SECRET
Value: [Generate a random string - see below]
```
**How to generate:**
Run this command in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and use it as the value.

### 7. CORS_ORIGIN
```
Key: CORS_ORIGIN
Value: https://petflix.vercel.app
```
**Important:** Replace `https://petflix.vercel.app` with your actual **frontend Vercel URL**

**Where to get it:**
- Deploy your frontend to Vercel first
- Copy the URL Vercel gives you (e.g., `https://petflix.vercel.app`)

### 8. PORT (Optional - Vercel sets this automatically)
```
Key: PORT
Value: [Leave empty or don't set - Vercel handles this]
```

---

## Quick Setup Checklist

1. [ ] Get Supabase URL from Supabase Dashboard
2. [ ] Get Supabase Anon Key from Supabase Dashboard
3. [ ] Get Supabase Service Role Key from Supabase Dashboard
4. [ ] Get YouTube API Key from Google Cloud Console
5. [ ] Generate JWT Secret using Node.js command
6. [ ] Deploy frontend to Vercel and get frontend URL
7. [ ] Set CORS_ORIGIN to your frontend URL
8. [ ] Add all variables to Backend Vercel project
9. [ ] Deploy backend

---

## Example Configuration

Once you have all values, your Vercel environment variables should look like:

```
NODE_ENV = production
SUPABASE_URL = https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
YOUTUBE_API_KEY = AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
JWT_SECRET = a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
CORS_ORIGIN = https://petflix.vercel.app
```

---

## Notes

- **PORT**: Don't set this - Vercel automatically provides it
- **CORS_ORIGIN**: Must match your frontend Vercel URL exactly
- **JWT_SECRET**: Generate a new one for production (don't use the default)
- **Service Role Key**: Keep this secret - it has admin access to your database

