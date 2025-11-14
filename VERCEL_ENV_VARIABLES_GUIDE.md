# Vercel Environment Variables Guide

This guide will walk you through setting up environment variables in Vercel for Development, Staging, and Production environments.

## Step-by-Step Instructions

### Step 1: Go to Your Project Settings

1. Log in to [Vercel](https://vercel.com)
2. Click on your **Petflix Frontend project**
3. Click on the **Settings** tab at the top
4. In the left sidebar, click on **Environment Variables**

### Step 2: Add Environment Variables

You'll see a form with:
- **Key**: The name of the variable
- **Value**: The actual value
- **Environment**: Which environments this applies to (Development, Preview, Production)

#### Required Environment Variables for Frontend

**VITE_API_URL_PROD** - Your production backend API URL
**VITE_API_URL_STAGING** - Your staging backend API URL (optional, for preview deployments)
**VITE_API_URL_DEV** - Your development backend API URL (optional, for local dev)

1. Click **Add New**
2. Enter:
   - **Key**: `VITE_API_URL_PROD`
   - **Value**: Your production backend URL (e.g., `https://petflix-backend.vercel.app`)
   - **Environment**: ✅ Production only
3. Click **Add New** again
4. Enter:
   - **Key**: `VITE_API_URL_STAGING`
   - **Value**: Your staging backend URL (can be same as production, or a separate deployment)
   - **Environment**: ✅ Preview only
5. Click **Add New** again
6. Enter:
   - **Key**: `VITE_API_URL_DEV`
   - **Value**: `http://localhost:3000` (for local development)
   - **Environment**: ✅ Development only

### Step 3: Get Your Backend URL

1. Go to your **Backend Vercel project**
2. In the **Deployments** tab, find your latest successful deployment
3. Copy the deployment URL (e.g., `https://petflix-backend-xxxxx.vercel.app`)
4. Or use your custom domain if you've set one up

**Note**: The backend URL should be the full URL without a trailing slash, like:
- ✅ `https://petflix-backend.vercel.app`
- ❌ `https://petflix-backend.vercel.app/`
- ❌ `petflix-backend.vercel.app`

### Step 4: After Adding Variables

1. **Redeploy your frontend project** for changes to take effect:
   - Go to the **Deployments** tab
   - Click the **⋯** (three dots) on your latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger a new deployment

## Example Setup

Here's what your environment variables should look like:

```
Production:
  VITE_API_URL_PROD = https://petflix-backend.vercel.app

Preview/Staging:
  VITE_API_URL_STAGING = https://petflix-backend.vercel.app

Development:
  VITE_API_URL_DEV = http://localhost:3000
```

## Important Notes

1. **VITE_ Prefix**: All environment variables that should be accessible in your React/Vite app MUST start with `VITE_`. This is a Vite security feature.

2. **Case Sensitive**: Variable names are case-sensitive. Use exactly `VITE_API_URL_PROD`, not `vite_api_url_prod`.

3. **No Quotes Needed**: Don't put quotes around the values in Vercel. Just enter the value directly.

4. **Secrets**: Vercel automatically hides the values in the UI (shows as dots) for security.

5. **Redeploy Required**: After adding/changing environment variables, you MUST redeploy for changes to take effect.

6. **Fallback Order**: The frontend checks variables in this order:
   - `VITE_API_URL_PROD` (for production)
   - `VITE_API_URL_STAGING` (for preview/staging)
   - `VITE_API_URL_DEV` (for development)
   - Falls back to `http://localhost:3000` if none are set

## Troubleshooting

### Variable Not Working?
- ✅ Make sure it starts with `VITE_`
- ✅ Redeploy after adding/changing
- ✅ Check the correct environment is selected
- ✅ Verify the value is correct (no extra spaces, no trailing slash)
- ✅ Make sure your backend URL is accessible (test it in a browser)

### How to Check if Variables Are Loaded
1. In your deployed app, open browser DevTools (F12)
2. Go to Console
3. Type: `console.log(import.meta.env.VITE_API_URL_PROD)`
4. You should see your API URL (or undefined if not set)

### Can't Connect to Backend?
1. Check that your backend is deployed and running
2. Test the backend URL directly: `https://your-backend.vercel.app/api/v1/health`
3. Check CORS settings in your backend (should allow your frontend domain)
4. Check browser console for CORS errors

## Quick Checklist

- [ ] Deployed backend to Vercel
- [ ] Got backend URL from Vercel
- [ ] Added `VITE_API_URL_PROD` for Production
- [ ] Added `VITE_API_URL_STAGING` for Preview/Staging
- [ ] Added `VITE_API_URL_DEV` for Development
- [ ] Redeployed the frontend project
- [ ] Tested that the app can connect to the backend

## Next Steps

After setting up environment variables:
1. ✅ Backend is deployed on Vercel
2. ✅ Frontend environment variables are set
3. ✅ Redeploy frontend
4. ✅ Test login and API calls
5. ✅ Verify everything works end-to-end
