# Troubleshooting 405 Method Not Allowed on Vercel

## Symptoms
- 405 Method Not Allowed error
- No response body in network logs
- Request doesn't reach Express (no logs in Vercel function logs)

## Root Cause
When Vercel returns 405 with no response body, it means **Vercel itself is rejecting the request** before it reaches your serverless function. This indicates a configuration issue.

## Checklist: Verify Vercel Project Settings

### 1. Backend Project Root Directory
**CRITICAL**: The backend must have its own Vercel project with root directory set correctly.

1. Go to your **Backend Vercel Project** dashboard
2. Click **Settings** → **General**
3. Verify **Root Directory** is set to: `backend`
   - If it's not set, click "Edit" and set it to `backend`
   - This tells Vercel where to find your `api/` folder

### 2. Verify Function Location
Your serverless function should be at:
```
backend/api/index.ts
```

Vercel automatically detects files in the `api/` directory as serverless functions.

### 3. Check Build Configuration
1. Go to **Settings** → **General**
2. Verify:
   - **Framework Preset**: Other (or auto-detected)
   - **Build Command**: `npm run build` (or leave empty - Vercel auto-detects)
   - **Output Directory**: Leave **EMPTY** (not needed for serverless)
   - **Install Command**: `npm install`

### 4. Verify vercel.json Location
Your `vercel.json` should be in the **backend** directory:
```
backend/vercel.json
```

Content should be:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.ts"
    }
  ]
}
```

### 5. Check Deployment Logs
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Check **Build Logs** for errors
4. Check **Function Logs** (Runtime Logs) to see if requests are reaching your function

### 6. Test Function Directly
Try accessing these URLs directly in your browser:

1. **Health Check**: `https://your-backend.vercel.app/health`
   - Should return: `{"status":"ok","message":"Petflix API is running"}`

2. **Root**: `https://your-backend.vercel.app/`
   - Should return: `{"message":"Petflix API v1","endpoints":"/api/v1"}`

3. **Debug Route**: `https://your-backend.vercel.app/debug-route`
   - Should return routing information

If these don't work, the function isn't being invoked at all.

## Common Issues and Fixes

### Issue 1: Root Directory Not Set
**Symptom**: Vercel can't find `api/index.ts`

**Fix**:
1. Go to Backend Project → Settings → General
2. Set Root Directory to: `backend`
3. Redeploy

### Issue 2: Function Not in api/ Directory
**Symptom**: Vercel doesn't recognize it as a serverless function

**Fix**: Ensure your function is at `backend/api/index.ts`

### Issue 3: Build Failing
**Symptom**: Deployment fails or function doesn't exist

**Fix**:
1. Check Build Logs for TypeScript errors
2. Ensure `npm run build` completes successfully
3. Verify `tsconfig.json` includes `api/**/*` in `include` array

### Issue 4: Wrong Project
**Symptom**: Changes don't take effect

**Fix**: Make sure you're deploying the **Backend** project, not the Frontend project

## Testing Steps

1. **Deploy Backend**:
   ```bash
   cd backend
   git add -A
   git commit -m "Fix serverless function"
   git push origin main
   ```

2. **Wait for Vercel to Deploy** (2-3 minutes)

3. **Test Health Endpoint**:
   ```bash
   curl https://your-backend.vercel.app/health
   ```
   Should return: `{"status":"ok","message":"Petflix API is running"}`

4. **Test Login Endpoint**:
   ```bash
   curl -X POST https://your-backend.vercel.app/api/v1/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"test"}'
   ```
   Should return either:
   - Success: `{"token":"...","user":{...}}`
   - Error: `{"error":"Invalid credentials"}` (not 405!)

5. **Check Function Logs**:
   - Go to Vercel Dashboard → Your Backend Project → Logs
   - You should see request logs if the function is being invoked

## If Still Getting 405

If you're still getting 405 after checking all of the above:

1. **Verify Frontend API URL**:
   - Check that `VITE_API_URL_PROD` in your **Frontend** Vercel project points to your **Backend** Vercel URL
   - Should be: `https://your-backend.vercel.app` (no trailing slash)

2. **Check CORS**:
   - Backend should allow your frontend origin
   - Current code allows all origins (`origin: true`)

3. **Check Network Tab**:
   - What exact URL is the frontend calling?
   - Should be: `https://your-backend.vercel.app/api/v1/users/login`
   - If it's different, that's the issue

4. **Check Vercel Function Logs**:
   - If you see NO logs when making a request, the function isn't being invoked
   - This means Vercel routing isn't working
   - Check Root Directory setting again

## Quick Verification Command

Run this to verify your backend is working:
```bash
# Replace with your actual backend URL
BACKEND_URL="https://your-backend.vercel.app"

# Test health
curl $BACKEND_URL/health

# Test root
curl $BACKEND_URL/

# Test login (should get 401, not 405)
curl -X POST $BACKEND_URL/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test","password":"test"}'
```

If any of these return 405, the function isn't being invoked - check Root Directory setting.

