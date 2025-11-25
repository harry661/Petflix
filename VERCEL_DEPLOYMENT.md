# Vercel Deployment Settings

## Disable Auto-Deployment

To stop automatic deployments on Vercel and save build requests:

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your Petflix project
3. Go to **Settings** → **Git**
4. Under **Deploy Hooks**, you can:
   - **Disable automatic deployments** by unchecking "Automatically deploy from Git"
   - Or configure **Ignored Build Step** to prevent deployments on certain commits

Alternatively, you can add a build command that checks for a specific condition:

```json
// In vercel.json, you can add:
{
  "buildCommand": "echo 'Skipping build' && exit 1"
}
```

**Recommended approach**: Disable automatic deployments in the Vercel dashboard settings and only deploy manually when needed.
