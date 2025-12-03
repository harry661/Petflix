# Frontend Environment Variable Fix

## The Problem

Your frontend is trying to call: `${API_URL}/api/v1/users/login`

But `API_URL` comes from `VITE_API_URL_PROD` environment variable. If this is:
- ❌ **NOT SET** → Falls back to `http://localhost:3000` (won't work in production)
- ❌ **Set to frontend URL** → Requests go to frontend, get 405 error
- ❌ **Set incorrectly** → Wrong URL, requests fail

## The Solution

### Step 1: Get Your Backend URL

1. Go to your **Backend Vercel Project** dashboard
2. Click on **Deployments** tab
3. Find the latest successful deployment
4. Copy the URL (e.g., `https://petflix-backend-xxxxx.vercel.app`)
   - **DO NOT** include trailing slash
   - **DO NOT** include `/api` or any path

### Step 2: Set Environment Variable in Frontend

1. Go to your **Frontend Vercel Project** dashboard
2. Click **Settings** → **Environment Variables**
3. Click **Add New**
4. Enter:
   - **Key**: `VITE_API_URL_PROD`
   - **Value**: Your backend URL (from Step 1)
   - **Environment**: ✅ **Production** (check this!)
5. Click **Save**

### Step 3: Redeploy Frontend

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on latest deployment
3. Click **Redeploy**
4. Wait for deployment to complete

## Verify It's Working

1. Open your deployed frontend in browser
2. Open **DevTools** → **Console** tab
3. Look for this log:
   ```
   🔧 API URL Configuration: {
     VITE_API_URL_PROD: "https://your-backend.vercel.app",
     ...
     normalized: "https://your-backend.vercel.app"
   }
   ```
4. The `normalized` value should be your **backend URL**, NOT:
   - ❌ `http://localhost:3000`
   - ❌ Your frontend URL
   - ❌ `NOT SET`

## Example

**Backend URL**: `https://petflix-backend.vercel.app`

**Frontend Environment Variable**:
- Key: `VITE_API_URL_PROD`
- Value: `https://petflix-backend.vercel.app`
- Environment: Production

**Result**: Frontend will call `https://petflix-backend.vercel.app/api/v1/users/login` ✅

## Common Mistakes

1. **Setting to frontend URL**: 
   - ❌ `https://petflix-frontend.vercel.app`
   - ✅ `https://petflix-backend.vercel.app`

2. **Including trailing slash**:
   - ❌ `https://petflix-backend.vercel.app/`
   - ✅ `https://petflix-backend.vercel.app`

3. **Including `/api` path**:
   - ❌ `https://petflix-backend.vercel.app/api`
   - ✅ `https://petflix-backend.vercel.app`

4. **Setting for wrong environment**:
   - Make sure it's set for **Production** environment
   - Preview/Development environments use different variables

5. **Not redeploying after setting**:
   - Environment variables only take effect after redeployment
   - Must redeploy frontend after adding/changing variables

## After Fixing

Once `VITE_API_URL_PROD` is set correctly and frontend is redeployed:

1. ✅ Login should work (no more 405 error)
2. ✅ Console will show correct backend URL
3. ✅ All API calls will go to backend

This is **99% likely** the issue causing your 405 errors!

