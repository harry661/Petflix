# Backend Deployment to Vercel (FREE)

## Vercel Free Tier
- **100GB bandwidth/month**
- **100 serverless function invocations/day** (unlimited on Hobby plan)
- **Free SSL**
- **Auto-deploy from GitHub**
- **Perfect for Express backends as serverless functions**

## Quick Setup Steps

1. **Go to Vercel**: https://vercel.com
2. **Sign up/Login** with your GitHub account
3. **Create New Project**:
   - Click "Add New..." → "Project"
   - Import your GitHub repository: `harry661/Petflix`
   - Click "Import"

4. **Configure Backend Project**:
   - **Project Name**: `petflix-backend` (or any name)
   - **Framework Preset**: Other (or leave as auto-detected)
   - **Root Directory**: `backend` (IMPORTANT: Click "Edit" and set to `backend`)
   - **Build Command**: `npm run build` (or leave empty, Vercel will auto-detect)
   - **Output Directory**: Leave empty (not needed for serverless)
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   Click "Environment Variables" and add:
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
   - `JWT_SECRET` = Generate a random string (see below)
   - `YOUTUBE_API_KEY` = Your YouTube API key
   - `CORS_ORIGIN` = Your frontend Vercel URL (e.g., `https://petflix.vercel.app`)
   - `PORT` = Leave empty (Vercel handles this automatically)

6. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy automatically
   - Wait 2-3 minutes for first deployment

7. **Get Your Backend URL**:
   - After deployment, Vercel gives you a URL like: `https://petflix-backend.vercel.app`
   - Copy this URL

8. **Update Frontend Environment Variable**:
   - Go to your **frontend** Vercel project → Settings → Environment Variables
   - Update `VITE_API_URL_PROD` with your backend Vercel URL
   - Make sure it's set for **Production** environment
   - Redeploy your frontend

## Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET`.

## CORS Configuration

Your `CORS_ORIGIN` should include:
- Your frontend Vercel production URL: `https://petflix.vercel.app`
- Your frontend Vercel preview URLs: `https://petflix-*.vercel.app` (wildcard)

Or set it to: `https://petflix.vercel.app,https://petflix-*.vercel.app`

## Important Notes

- **Serverless Functions**: Vercel converts your Express app to serverless functions
- **Cold Starts**: First request after inactivity may take 1-2 seconds (normal for serverless)
- **Free Tier Limits**: 100 function invocations/day on free tier (unlimited on Hobby plan)
- **Both Frontend and Backend**: You can host both on Vercel for free!

## After Deployment

1. Test backend: Visit `https://your-backend.vercel.app/api/v1/health` (or any API endpoint)
2. Update frontend `VITE_API_URL_PROD` with backend Vercel URL
3. Redeploy frontend
4. Test login/registration

## Troubleshooting

- **Build fails**: Check build logs in Vercel dashboard
- **Function errors**: Check function logs in Vercel dashboard
- **CORS errors**: Make sure `CORS_ORIGIN` includes your frontend Vercel URL
- **Cold start delay**: Normal for serverless (1-2 seconds on first request)
