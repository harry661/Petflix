# Backend Deployment to Railway

## Quick Setup Steps

1. **Go to Railway**: https://railway.app
2. **Sign up/Login** with your GitHub account
3. **Create New Project** → "Deploy from GitHub repo"
4. **Select Repository**: `harry661/Petflix`
5. **Configure Service**:
   - **Root Directory**: Set to `backend`
   - Railway will auto-detect Node.js

6. **Add Environment Variables** in Railway:
   - `SUPABASE_URL` - Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `JWT_SECRET` - A random secret string (generate one)
   - `YOUTUBE_API_KEY` - Your YouTube API key
   - `CORS_ORIGIN` - Your Vercel frontend URL (e.g., `https://petflix.vercel.app`)
   - `NODE_ENV` - Set to `production`
   - `PORT` - Railway sets this automatically, don't override

7. **Deploy**: Railway will automatically build and deploy

8. **Get Your Backend URL**: 
   - After deployment, Railway will give you a URL like `https://your-app-name.up.railway.app`
   - Copy this URL

9. **Update Vercel Environment Variable**:
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Update `VITE_API_URL_PROD` with your Railway backend URL
   - Redeploy your Vercel frontend

## Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## CORS Configuration

Make sure `CORS_ORIGIN` in Railway includes:
- Your Vercel production URL
- Your Vercel preview URLs (if using staging)
- Format: `https://petflix.vercel.app,https://petflix-git-*.vercel.app`

## After Deployment

1. Test the backend: Visit `https://your-backend-url.up.railway.app/health` (if you have a health endpoint)
2. Update Vercel `VITE_API_URL_PROD` with the Railway URL
3. Redeploy frontend
4. Test login/registration

