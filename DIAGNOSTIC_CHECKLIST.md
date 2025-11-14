# 405 Error Diagnostic Checklist

## Critical: Verify Vercel Project Settings

### Step 1: Check Backend Project Root Directory
**THIS IS THE MOST COMMON CAUSE OF 405 ERRORS**

1. Go to your **Backend Vercel Project** dashboard
2. Click **Settings** → **General**
3. Look for **Root Directory**
4. **MUST BE SET TO**: `backend`
   - If it's empty or set to something else, click "Edit" and change it to `backend`
   - This tells Vercel where to find your `api/` folder
5. **Save** and **Redeploy**

### Step 2: Verify Function Location
Your serverless function should be at:
```
backend/api/index.ts
```

Verify this file exists in your repository.

### Step 3: Test Function Directly
After redeploying, test these URLs in your browser or with curl:

1. **Simple Test** (should work with ANY method):
   ```
   https://your-backend.vercel.app/test-simple
   ```
   Expected: `{"success":true,"message":"Function is working!",...}`

2. **Health Check**:
   ```
   https://your-backend.vercel.app/health
   ```
   Expected: `{"status":"ok","message":"Petflix API is running",...}`

3. **Root**:
   ```
   https://your-backend.vercel.app/
   ```
   Expected: `{"message":"Petflix API v1",...}`

**If ANY of these return 405 or don't work, the function isn't being invoked.**

### Step 4: Check Vercel Build Logs
1. Go to **Deployments** tab
2. Click on latest deployment
3. Check **Build Logs**:
   - Look for errors
   - Verify TypeScript compilation succeeded
   - Check for "Function" or "Serverless Function" messages

### Step 5: Check Vercel Function Logs
1. Go to **Deployments** tab
2. Click on latest deployment
3. Click **Functions** tab (or **Runtime Logs**)
4. Try making a request to `/test-simple`
5. **You should see logs** if the function is being invoked
   - If you see NO logs, the function isn't being called
   - This confirms it's a routing/configuration issue

### Step 6: Verify vercel.json Location
Your `vercel.json` should be at:
```
backend/vercel.json
```

Content should be:
```json
{
  "functions": {
    "api/index.ts": {
      "includeFiles": "**"
    }
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.ts"
    }
  ]
}
```

### Step 7: Check Frontend API URL
1. Go to your **Frontend Vercel Project** → **Settings** → **Environment Variables**
2. Verify `VITE_API_URL_PROD` is set to your **Backend** Vercel URL
3. Should be: `https://your-backend.vercel.app` (no trailing slash)
4. Make sure it's set for **Production** environment
5. **Redeploy frontend** after changing

### Step 8: Test from Browser Console
Open your frontend in browser, open console, and run:
```javascript
// Check what API URL is being used
console.log('API URL:', import.meta.env.VITE_API_URL_PROD);

// Test the backend directly
fetch('https://your-backend.vercel.app/test-simple')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

## Common Issues and Solutions

### Issue 1: Root Directory Not Set
**Symptom**: All requests return 405, no function logs

**Solution**: 
- Set Root Directory to `backend` in Vercel project settings
- Redeploy

### Issue 2: Function Not Found
**Symptom**: Build succeeds but function doesn't exist

**Solution**:
- Verify `backend/api/index.ts` exists
- Check that Root Directory is set correctly
- Verify file is committed to git

### Issue 3: Build Failing
**Symptom**: Deployment fails

**Solution**:
- Check Build Logs for TypeScript errors
- Verify `npm run build` works locally
- Check `tsconfig.json` includes `api/**/*`

### Issue 4: Wrong Project
**Symptom**: Changes don't take effect

**Solution**:
- Make sure you're deploying the **Backend** project, not Frontend
- Check you're looking at the right project in Vercel dashboard

### Issue 5: Frontend Using Wrong URL
**Symptom**: Requests go to wrong server

**Solution**:
- Check browser console for API URL
- Verify `VITE_API_URL_PROD` in frontend Vercel project
- Make sure frontend is redeployed after changing env vars

## Quick Diagnostic Commands

Replace `YOUR_BACKEND_URL` with your actual backend Vercel URL:

```bash
# Test 1: Simple endpoint (should work)
curl https://YOUR_BACKEND_URL/test-simple

# Test 2: Health check
curl https://YOUR_BACKEND_URL/health

# Test 3: Root
curl https://YOUR_BACKEND_URL/

# Test 4: Login endpoint (should get 401, not 405)
curl -X POST https://YOUR_BACKEND_URL/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

**Expected Results**:
- Test 1-3: Should return JSON (200 status)
- Test 4: Should return `{"error":"Invalid credentials"}` (401 status)
- **If any return 405, the function isn't being invoked**

## What to Report

If you've checked all of the above and still getting 405:

1. **Root Directory setting** (from Step 1)
2. **Build Logs** (screenshot or copy)
3. **Function Logs** (when making a request - should show logs or be empty)
4. **Test results** from Step 3 (what each URL returns)
5. **Frontend API URL** (from browser console)

This will help identify the exact issue.

