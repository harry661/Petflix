# Backend Setup Verification

## Current Configuration

✅ **Root Directory**: `backend` (set in Vercel project settings)
✅ **Function Location**: `backend/api/index.ts`
✅ **Vercel Config**: `backend/vercel.json`

## What Should Work After Deployment

### 1. Test Simple Endpoint
```bash
curl https://your-backend.vercel.app/test-simple
```
**Expected**: `{"success":true,"message":"Function is working!",...}`

### 2. Test Health Check
```bash
curl https://your-backend.vercel.app/health
```
**Expected**: `{"status":"ok","message":"Petflix API is running",...}`

### 3. Test Root
```bash
curl https://your-backend.vercel.app/
```
**Expected**: `{"message":"Petflix API v1","endpoints":"/api/v1",...}`

### 4. Test Login Endpoint
```bash
curl -X POST https://your-backend.vercel.app/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```
**Expected**: Either `{"error":"Invalid credentials"}` (401) or success (200)
**NOT Expected**: 405 Method Not Allowed

## If Still Getting 405

1. **Check Vercel Deployment Logs**:
   - Go to Backend Project → Deployments → Latest
   - Check Build Logs for errors
   - Check Function Logs (Runtime Logs) when making requests

2. **Verify Function is Created**:
   - In Vercel Dashboard → Backend Project → Settings → Functions
   - You should see `api/index.ts` listed as a serverless function

3. **Check Environment Variables**:
   - All required env vars are set
   - No typos in variable names

4. **Test Direct Function Access**:
   - Try: `https://your-backend.vercel.app/api/index`
   - This should invoke the function directly (bypassing rewrite)

## Current vercel.json Configuration

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index"
    }
  ]
}
```

This means:
- All requests (`/(.*)`) are rewritten to `/api/index`
- Vercel will look for `api/index.ts` in the backend directory
- The function should handle all routes through Express routing

## Function Export

The function exports the Express app directly:
```typescript
module.exports = app;
```

This is the standard pattern for Express on Vercel.

