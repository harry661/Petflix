# Vercel Environment Variables Guide

This guide will walk you through setting up environment variables in Vercel for Development, Staging, and Production environments.

## Step-by-Step Instructions

### Step 1: Go to Your Project Settings

1. Log in to [Vercel](https://vercel.com)
2. Click on your **Petflix project** (or create a new project if you haven't yet)
3. Click on the **Settings** tab at the top
4. In the left sidebar, click on **Environment Variables**

### Step 2: Add Environment Variables

You'll see a form with:
- **Key**: The name of the variable
- **Value**: The actual value
- **Environment**: Which environments this applies to (Development, Preview, Production)

#### Required Environment Variable

**VITE_API_URL** - Your backend API URL

1. Click **Add New**
2. Enter:
   - **Key**: `VITE_API_URL`
   - **Value**: Your backend URL (see examples below)
   - **Environment**: Select the appropriate environment(s)

#### Optional Environment Variable

**VITE_YOUTUBE_API_KEY** - Your YouTube API key (if you're using it)

1. Click **Add New** again
2. Enter:
   - **Key**: `VITE_YOUTUBE_API_KEY`
   - **Value**: Your YouTube API key
   - **Environment**: Select all environments that need it

### Step 3: Set Values for Each Environment

You'll need to add the same variable **multiple times** for different environments with different values:

#### For Development Environment:
1. Add `VITE_API_URL`
   - **Value**: `http://localhost:3000` (or your dev backend URL)
   - **Environment**: ✅ Development only

#### For Staging Environment:
1. Add `VITE_API_URL` again (it's a separate entry)
   - **Value**: `https://your-staging-backend.railway.app` (or your staging backend URL)
   - **Environment**: ✅ Preview only (or create a custom staging environment)

#### For Production Environment:
1. Add `VITE_API_URL` again
   - **Value**: `https://your-production-backend.railway.app` (or your production backend URL)
   - **Environment**: ✅ Production only

### Step 4: Understanding Environment Types

- **Development**: Used when you run `vercel dev` locally
- **Preview**: Used for preview deployments (pull requests, branches)
- **Production**: Used for production deployments (main branch)

### Step 5: After Adding Variables

1. **Redeploy your project** for changes to take effect:
   - Go to the **Deployments** tab
   - Click the **⋯** (three dots) on your latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger a new deployment

## Example Setup

Here's what your environment variables might look like:

```
Development:
  VITE_API_URL = http://localhost:3000
  VITE_YOUTUBE_API_KEY = your-dev-key (optional)

Staging (Preview):
  VITE_API_URL = https://petflix-backend-staging.railway.app
  VITE_YOUTUBE_API_KEY = your-staging-key (optional)

Production:
  VITE_API_URL = https://petflix-backend.railway.app
  VITE_YOUTUBE_API_KEY = your-production-key (optional)
```

## Important Notes

1. **VITE_ Prefix**: All environment variables that should be accessible in your React/Vite app MUST start with `VITE_`. This is a Vite security feature.

2. **Case Sensitive**: Variable names are case-sensitive. Use exactly `VITE_API_URL`, not `vite_api_url`.

3. **No Quotes Needed**: Don't put quotes around the values in Vercel. Just enter the value directly.

4. **Secrets**: Vercel automatically hides the values in the UI (shows as dots) for security.

5. **Redeploy Required**: After adding/changing environment variables, you MUST redeploy for changes to take effect.

## Troubleshooting

### Variable Not Working?
- ✅ Make sure it starts with `VITE_`
- ✅ Redeploy after adding/changing
- ✅ Check the correct environment is selected
- ✅ Verify the value is correct (no extra spaces)

### How to Check if Variables Are Loaded
1. In your deployed app, open browser DevTools (F12)
2. Go to Console
3. Type: `console.log(import.meta.env.VITE_API_URL)`
4. You should see your API URL (or undefined if not set)

### Can't See Variables in Code?
Remember: Only variables starting with `VITE_` are exposed to your frontend code. This is intentional for security.

## Quick Checklist

- [ ] Added `VITE_API_URL` for Development
- [ ] Added `VITE_API_URL` for Preview/Staging
- [ ] Added `VITE_API_URL` for Production
- [ ] Added `VITE_YOUTUBE_API_KEY` (if needed) for each environment
- [ ] Redeployed the project
- [ ] Tested that the app can connect to the backend

## Next Steps

After setting up environment variables:
1. Deploy your backend (Railway, Render, etc.)
2. Get your backend URLs
3. Add them to Vercel environment variables
4. Redeploy frontend
5. Test each environment

