# Push Notifications Setup Guide

## Issue
Push notifications are not working because VAPID keys are not configured on the server.

## Solution

### Step 1: Generate VAPID Keys

Run the following command from the project root:

```bash
cd backend
npx ts-node scripts/generate-vapid-keys.ts
```

This will generate and display your VAPID keys.

### Step 2: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following three variables:

   - **Variable Name:** `VAPID_PUBLIC_KEY`
     - **Value:** (The public key from Step 1)
     - **Environment:** Production, Preview, Development (select all)

   - **Variable Name:** `VAPID_PRIVATE_KEY`
     - **Value:** (The private key from Step 1)
     - **Environment:** Production, Preview, Development (select all)

   - **Variable Name:** `VAPID_SUBJECT`
     - **Value:** `mailto:admin@petflix.app` (or your email)
     - **Environment:** Production, Preview, Development (select all)

### Step 3: Redeploy

After adding the environment variables, you need to redeploy your application:

1. Go to your Vercel project dashboard
2. Click on the **Deployments** tab
3. Click the **⋯** (three dots) menu on the latest deployment
4. Select **Redeploy**

Or trigger a new deployment by pushing a commit to your repository.

### Step 4: Test Push Notifications

1. Open your deployed application
2. Go to **Account Settings**
3. Enable push notifications
4. Grant notification permissions when prompted
5. Test by having someone follow you or like your video

## What are VAPID Keys?

VAPID (Voluntary Application Server Identification) keys are used to identify your application server to push notification services (like Chrome's FCM). They ensure that only your server can send push notifications to your users.

## Security Note

⚠️ **IMPORTANT:** Never commit `VAPID_PRIVATE_KEY` to your git repository. Keep it secret and only store it in environment variables.

## Troubleshooting

### Still seeing "Push notifications are not configured on the server"?

1. **Check environment variables are set:**
   - Verify all three variables are added in Vercel
   - Make sure they're enabled for the correct environments

2. **Verify deployment:**
   - Check that you've redeployed after adding the variables
   - Look at the deployment logs to ensure the variables are loaded

3. **Check backend logs:**
   - Look for warnings like: `[Push Notifications] VAPID keys not configured`
   - If you see this, the keys aren't being loaded properly

4. **Test the endpoint:**
   - Visit: `https://your-app.vercel.app/api/v1/push_notifications/vapid-key`
   - Should return: `{"publicKey":"..."}`
   - If it returns 503, the keys aren't configured

## Current Status

✅ **Backend Implementation:** Complete
- Push notification endpoints are implemented
- Service worker integration is ready
- Database tables exist for subscriptions

❌ **Configuration:** Missing
- VAPID keys need to be generated and added to Vercel

Once you complete the steps above, push notifications will work!

