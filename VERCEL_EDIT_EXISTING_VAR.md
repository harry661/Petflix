# How to Edit Existing Environment Variable in Vercel

## The Problem
You're seeing: "A variable with the name 'VITE_API_URL' already exists"

This means the variable is already in your Vercel project. You need to **edit** it, not add a new one.

## Solution: Edit the Existing Variable

### Step 1: Find the Existing Variable
1. Go to your Vercel project
2. Click **Settings** → **Environment Variables**
3. Scroll through the list to find `VITE_API_URL`
4. You should see it listed with its current value (hidden as dots)

### Step 2: Edit the Variable
1. Click on the `VITE_API_URL` variable in the list
2. You'll see options to:
   - **Edit** the value
   - **Change** which environments it applies to
   - **Delete** it (if needed)

### Step 3: Update for Different Environments

**Option A: Edit the existing one** (if it has the same value for all environments)
- Click on `VITE_API_URL`
- Change the value
- Update which environments it applies to
- Save

**Option B: Add separate entries for each environment** (recommended)
Since you need different values for dev/staging/prod:

1. **Delete the existing one** (if it's set for all environments):
   - Click on `VITE_API_URL`
   - Click "Remove" or delete icon
   - Confirm deletion

2. **Add it 3 times** (once for each environment):
   
   **First entry - Development:**
   - Click "Add New"
   - Key: `VITE_API_URL`
   - Value: `http://localhost:3000` (or your dev backend)
   - Environments: ✅ Development only
   - Save
   
   **Second entry - Preview (Staging):**
   - Click "Add New" again
   - Key: `VITE_API_URL` (same name!)
   - Value: `https://your-staging-backend.railway.app`
   - Environments: ✅ Preview only
   - Save
   
   **Third entry - Production:**
   - Click "Add New" again
   - Key: `VITE_API_URL` (same name!)
   - Value: `https://your-production-backend.railway.app`
   - Environments: ✅ Production only
   - Save

### Step 4: Redeploy
After editing, redeploy your project:
- Go to **Deployments** tab
- Click **⋯** on latest deployment
- Click **Redeploy**

## Visual Guide

In Vercel, you'll see something like:

```
Environment Variables
┌─────────────────────────────────────────┐
│ VITE_API_URL                    [Edit]  │
│ •••••••••••••••••••••••••••••••••••••• │
│ Production, Preview, Development        │
└─────────────────────────────────────────┘
```

Click **[Edit]** to modify it, or delete and recreate with separate entries for each environment.

## Quick Fix Summary

1. ✅ Go to Settings → Environment Variables
2. ✅ Find `VITE_API_URL` in the list
3. ✅ Click on it to edit OR delete and recreate
4. ✅ Add separate entries for Development, Preview, and Production
5. ✅ Redeploy

