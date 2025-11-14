# Backend Deployment to Render (FREE)

## Render Free Tier
- **750 hours/month** (enough for 24/7 operation)
- **512MB RAM**
- **Free SSL**
- **Auto-deploy from GitHub**

## Quick Setup Steps

1. **Go to Render**: https://render.com
2. **Sign up** with your GitHub account (FREE)
3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub account
   - Select repository: `harry661/Petflix`
   - Click "Connect"

4. **Configure Service**:
   - **Name**: `petflix-backend` (or any name you like)
   - **Region**: Choose closest to you (US/EU)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free** (select this!)

5. **Add Environment Variables**:
   Click "Advanced" → "Add Environment Variable" and add:
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
   - `JWT_SECRET` = Generate a random string (see below)
   - `YOUTUBE_API_KEY` = Your YouTube API key
   - `CORS_ORIGIN` = Your Vercel frontend URL (e.g., `https://petflix.vercel.app`)
   - `PORT` = `10000` (Render sets this automatically, but include it)

6. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - Wait 5-10 minutes for first deployment

7. **Get Your Backend URL**:
   - After deployment, Render gives you a URL like: `https://petflix-backend.onrender.com`
   - Copy this URL

8. **Update Vercel Environment Variable**:
   - Go to Vercel → Your Project → Settings → Environment Variables
   - Update `VITE_API_URL_PROD` with your Render backend URL
   - Make sure it's set for **Production** environment
   - Redeploy your Vercel frontend

## Generate JWT Secret

Run this in your terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `JWT_SECRET`.

## CORS Configuration

Your `CORS_ORIGIN` should include:
- Your Vercel production URL: `https://petflix.vercel.app`
- Your Vercel preview URLs: `https://petflix-*.vercel.app` (wildcard)

Or set it to: `https://petflix.vercel.app,https://petflix-*.vercel.app`

## Important Notes

- **Free tier spins down after 15 minutes of inactivity** - first request after spin-down takes ~30 seconds
- For production, consider upgrading to paid tier ($7/month) for always-on
- Render free tier is perfect for development and testing

## After Deployment

1. Test backend: Visit `https://your-backend.onrender.com` (should show error or API response)
2. Update Vercel `VITE_API_URL_PROD` with Render URL
3. Redeploy frontend
4. Test login/registration

## Troubleshooting

- **Build fails**: Check build logs in Render dashboard
- **App crashes**: Check runtime logs in Render dashboard
- **CORS errors**: Make sure `CORS_ORIGIN` includes your Vercel URL
- **Slow first request**: Normal on free tier (15 min spin-down)
