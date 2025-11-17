# Monorepo Vercel Deployment - Complete Setup Guide

## Overview

This guide sets up your Petflix app as a **monorepo** on Vercel, where both frontend and backend are deployed from a single project. This eliminates CORS issues and 405 errors because everything runs on the same domain.

## Project Structure

```
Petflix/
├── api/                    # Backend serverless function (root level)
│   └── index.ts           # Express app entry point
├── backend/               # Backend source code
│   ├── src/              # Backend routes, controllers, etc.
│   └── package.json      # Backend dependencies
├── frontend/             # Frontend React app
│   ├── src/             # Frontend source code
│   └── package.json     # Frontend dependencies
└── vercel.json          # Root Vercel configuration
```

## Step-by-Step Setup Instructions

### Step 1: Delete Old Vercel Projects

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Delete your **old frontend project** (if separate)
3. Delete your **old backend project** (if separate)
4. We'll create ONE new project for the monorepo

### Step 2: Create New Monorepo Project in Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `harry661/Petflix`
4. Click **"Import"**

### Step 3: Configure Project Settings

**Important**: Configure these settings BEFORE deploying:

1. **Project Name**: `petflix` (or any name you want)

2. **Framework Preset**: 
   - Select **"Vite"** (or leave as auto-detected)

3. **Root Directory**: 
   - Leave as **"."** (root) - DO NOT set to `frontend` or `backend`
   - This is critical for monorepo!

4. **Build Command**: 
   - Set to: `cd frontend && npm install && npm run build`
   - Or leave empty and Vercel will auto-detect

5. **Output Directory**: 
   - Set to: `frontend/dist`
   - This is where Vercel serves the frontend from

6. **Install Command**: 
   - Set to: `cd frontend && npm install`
   - Or leave empty for auto-detection

7. **Node.js Version**: 
   - Should be **22.x** (matches your backend)

### Step 4: Add Environment Variables

Go to **Settings** → **Environment Variables** and add:

#### Backend Environment Variables (Required)

Add these for **Production** environment:

- `NODE_ENV` = `production`
- `SUPABASE_URL` = Your Supabase project URL
- `SUPABASE_ANON_KEY` = Your Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key
- `JWT_SECRET` = Your JWT secret (generate if needed)
- `YOUTUBE_API_KEY` = Your YouTube API key

**Important**: 
- Set all these for **Production** environment
- You can also set them for **Preview** and **Development** if needed

#### Frontend Environment Variables (Optional)

You **DON'T need** `VITE_API_URL_PROD` anymore! The frontend will automatically use relative URLs (`/api/...`) in production.

However, if you want to test with a different backend, you can still set:
- `VITE_API_URL_PROD` = (only if testing external backend)

### Step 5: Deploy

1. Click **"Deploy"** button
2. Wait 3-5 minutes for first deployment
3. Vercel will:
   - Install frontend dependencies
   - Build frontend
   - Detect the `api/` directory as serverless function
   - Set up routing

### Step 6: Verify Deployment

After deployment completes:

1. **Test Frontend**:
   - Visit your Vercel URL: `https://your-project.vercel.app`
   - Should see your frontend

2. **Test Backend API**:
   - Visit: `https://your-project.vercel.app/api/health`
   - Should return: `{"status":"ok","message":"Petflix API is running",...}`

3. **Test Login**:
   - Try logging in on the frontend
   - Should work without 405 errors!

## How It Works

### Routing

The `vercel.json` at root configures:

1. **API Routes** (`/api/*`):
   - Rewritten to `/api/index` (your Express serverless function)
   - Handles all backend API calls

2. **Frontend Routes** (`/*`):
   - Rewritten to `/index.html`
   - Serves your React app (SPA routing)

### API Calls

In **production** (monorepo):
- Frontend calls: `/api/v1/users/login`
- Goes to: Same domain → `/api/index` function → Express routes

In **local development**:
- Frontend calls: `http://localhost:3000/api/v1/users/login`
- Goes to: Local backend server

## Troubleshooting

### Build Fails

**Error**: "Cannot find module '../backend/src/routes'"

**Fix**: Make sure `api/index.ts` has correct import paths:
```typescript
import routes from '../backend/src/routes';
import { errorHandler } from '../backend/src/middleware/errorHandler';
```

### 405 Error Still Happening

1. **Check Vercel Function Logs**:
   - Go to Deployments → Latest → Functions/Runtime Logs
   - Make a request and check if logs appear

2. **Verify API Function Exists**:
   - Go to Settings → Functions
   - Should see `api/index.ts` listed

3. **Check Root Directory**:
   - Must be **"."** (root), NOT `frontend` or `backend`

### Frontend Not Loading

1. **Check Build Logs**:
   - Verify frontend build succeeded
   - Check for TypeScript errors

2. **Verify Output Directory**:
   - Should be `frontend/dist`
   - Check that `dist` folder exists after build

### API Not Working

1. **Check Environment Variables**:
   - All backend env vars must be set
   - Check for typos

2. **Test API Directly**:
   - Visit: `https://your-project.vercel.app/api/health`
   - Should return JSON, not 404/405

## Benefits of Monorepo Setup

✅ **No CORS issues** - Same domain for frontend and backend
✅ **No 405 errors** - Proper routing configuration
✅ **Simpler deployment** - One project instead of two
✅ **Easier environment variables** - All in one place
✅ **Better performance** - No cross-origin requests

## Local Development

For local development, keep using separate servers:

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend  
cd frontend
npm run dev
```

The frontend will automatically use `http://localhost:3000` in development mode.

## Next Steps

1. ✅ Follow steps above to set up monorepo
2. ✅ Deploy to Vercel
3. ✅ Test all endpoints
4. ✅ Verify login works
5. ✅ Celebrate! 🎉

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check function logs
3. Verify all environment variables are set
4. Test API endpoints directly in browser

