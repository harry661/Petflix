# Vercel Deployment Guide

This guide will help you deploy Petflix to Vercel with Development and Staging environments.

## Prerequisites

1. Vercel account (sign up at https://vercel.com)
2. GitHub repository (your code should be pushed to GitHub)
3. Backend API URL (backend needs to be deployed separately - see Backend Deployment section)

## Frontend Deployment

### Step 1: Install Vercel CLI (Optional)

```bash
npm i -g vercel
```

### Step 2: Deploy via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Set Environment Variables

For each environment (Development and Staging), set these environment variables in Vercel:

#### Required Environment Variables

```
VITE_API_URL=<your-backend-api-url>
```

#### Optional Environment Variables

```
VITE_YOUTUBE_API_KEY=<your-youtube-api-key>
```

### Step 4: Create Environments

1. **Development Environment**:
   - Go to Project Settings → Environments
   - Create a new environment called "Development"
   - Set `VITE_API_URL` to your development backend URL (e.g., `http://localhost:3000` or your dev backend URL)

2. **Staging Environment**:
   - Create a new environment called "Staging"
   - Set `VITE_API_URL` to your staging backend URL
   - Assign this environment to a specific branch (e.g., `staging` branch)

3. **Production Environment**:
   - Uses the default environment variables
   - Set `VITE_API_URL` to your production backend URL

### Step 5: Configure Branch Deployments

1. Go to Project Settings → Git
2. Configure branch deployments:
   - **Development**: Deploy from `develop` or `dev` branch
   - **Staging**: Deploy from `staging` branch
   - **Production**: Deploy from `main` branch

## Backend Deployment

The backend needs to be deployed separately. Options:

### Option 1: Railway (Recommended for Node.js)

1. Sign up at https://railway.app
2. Create a new project
3. Connect your GitHub repository
4. Set root directory to `backend`
5. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `YOUTUBE_API_KEY`
   - `CORS_ORIGIN` (set to your Vercel frontend URL)
   - `PORT` (Railway sets this automatically)

### Option 2: Render

1. Sign up at https://render.com
2. Create a new Web Service
3. Connect your GitHub repository
4. Set root directory to `backend`
5. Build command: `npm install && npm run build`
6. Start command: `npm start`
7. Add environment variables (same as Railway)

### Option 3: Keep Backend on Local Server

If you want to keep the backend running locally:
- Use a service like ngrok to expose your local backend
- Update `VITE_API_URL` in Vercel to point to the ngrok URL

## Environment URLs

After deployment, you'll have:

- **Development**: `https://petflix-dev.vercel.app` (or your custom domain)
- **Staging**: `https://petflix-staging.vercel.app` (or your custom domain)
- **Production**: `https://petflix.vercel.app` (or your custom domain)

## Updating Environment Variables

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add or update variables for each environment
4. Redeploy the project for changes to take effect

## Troubleshooting

### Build Fails

- Check that all dependencies are in `package.json`
- Verify build command is correct
- Check Vercel build logs for specific errors

### API Calls Fail

- Verify `VITE_API_URL` is set correctly
- Check CORS settings on backend
- Ensure backend is accessible from Vercel's servers

### Environment Variables Not Working

- Make sure variables are prefixed with `VITE_` for Vite to expose them
- Redeploy after adding/updating environment variables
- Check that variables are set for the correct environment

## Next Steps

1. Set up custom domains (optional)
2. Configure preview deployments for pull requests
3. Set up monitoring and analytics
4. Configure automatic deployments from Git branches

