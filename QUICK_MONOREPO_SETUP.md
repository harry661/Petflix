# Quick Monorepo Setup - Vercel

## ✅ What's Been Done

1. ✅ Created root `vercel.json` for monorepo
2. ✅ Created `api/index.ts` at root (backend serverless function)
3. ✅ Updated frontend to use relative URLs in production
4. ✅ All code committed and pushed

## 🚀 Deploy to Vercel (5 Steps)

### Step 1: Delete Old Projects (if they exist)
- Go to Vercel Dashboard
- Delete old frontend project
- Delete old backend project

### Step 2: Create New Project
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import: `harry661/Petflix`
4. Click **"Import"**

### Step 3: Configure Settings
**Before clicking Deploy**, configure:

- **Root Directory**: Leave as **"."** (root) - CRITICAL!
- **Framework**: Vite (auto-detected)
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/dist`
- **Install Command**: `cd frontend && npm install`

### Step 4: Add Environment Variables
Go to **Settings** → **Environment Variables**, add for **Production**:

- `NODE_ENV` = `production`
- `SUPABASE_URL` = (your Supabase URL)
- `SUPABASE_ANON_KEY` = (your anon key)
- `SUPABASE_SERVICE_ROLE_KEY` = (your service role key)
- `JWT_SECRET` = (your JWT secret)
- `YOUTUBE_API_KEY` = (your YouTube key)

**Note**: You DON'T need `VITE_API_URL_PROD` anymore!

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait 3-5 minutes
3. Done! 🎉

## 🧪 Test After Deployment

1. **Frontend**: `https://your-project.vercel.app`
2. **API Health**: `https://your-project.vercel.app/api/health`
3. **Login**: Should work without 405 errors!

## 📋 How It Works

- **Frontend**: Served from `frontend/dist`
- **API Routes** (`/api/*`): Routed to `api/index.ts` (Express)
- **Everything on same domain**: No CORS, no 405 errors!

See `MONOREPO_VERCEL_SETUP.md` for detailed instructions.

