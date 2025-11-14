# Deployment Checklist

## Pre-Deployment

- [ ] Push all code to GitHub
- [ ] Test frontend build locally: `cd frontend && npm run build`
- [ ] Verify all environment variables are documented
- [ ] Backend is deployed and accessible

## Vercel Frontend Deployment

### Initial Setup

- [ ] Sign up/login to Vercel (https://vercel.com)
- [ ] Install Vercel CLI: `npm i -g vercel` (optional)
- [ ] Import GitHub repository in Vercel dashboard

### Project Configuration

- [ ] Set Root Directory: `frontend`
- [ ] Framework Preset: Vite (auto-detected)
- [ ] Build Command: `npm run build` (auto-detected)
- [ ] Output Directory: `dist` (auto-detected)
- [ ] Install Command: `npm install` (auto-detected)

### Environment Variables Setup

#### Development Environment

- [ ] Create "Development" environment
- [ ] Set `VITE_API_URL` = Development backend URL
- [ ] Set `VITE_YOUTUBE_API_KEY` (if needed)
- [ ] Assign to `develop` or `dev` branch

#### Staging Environment

- [ ] Create "Staging" environment
- [ ] Set `VITE_API_URL` = Staging backend URL
- [ ] Set `VITE_YOUTUBE_API_KEY` (if needed)
- [ ] Assign to `staging` branch

#### Production Environment

- [ ] Set `VITE_API_URL` = Production backend URL
- [ ] Set `VITE_YOUTUBE_API_KEY` (if needed)
- [ ] Assign to `main` branch

### Branch Configuration

- [ ] Configure branch deployments:
  - Development → `develop` or `dev` branch
  - Staging → `staging` branch
  - Production → `main` branch

### Post-Deployment

- [ ] Test Development deployment
- [ ] Test Staging deployment
- [ ] Test Production deployment
- [ ] Verify API connections work
- [ ] Test authentication flow
- [ ] Test video playback
- [ ] Test all major features

## Backend Deployment

Choose one option:

### Option A: Railway

- [ ] Sign up at https://railway.app
- [ ] Create new project
- [ ] Connect GitHub repository
- [ ] Set root directory: `backend`
- [ ] Add environment variables:
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `JWT_SECRET`
  - [ ] `YOUTUBE_API_KEY`
  - [ ] `CORS_ORIGIN` (Vercel frontend URLs)
  - [ ] `PORT` (auto-set by Railway)
- [ ] Deploy and get backend URL
- [ ] Update Vercel `VITE_API_URL` with backend URL

### Option B: Render

- [ ] Sign up at https://render.com
- [ ] Create Web Service
- [ ] Connect GitHub repository
- [ ] Set root directory: `backend`
- [ ] Build command: `npm install && npm run build`
- [ ] Start command: `npm start`
- [ ] Add environment variables (same as Railway)
- [ ] Deploy and get backend URL
- [ ] Update Vercel `VITE_API_URL` with backend URL

### Option C: Keep Local (Development Only)

- [ ] Use ngrok or similar to expose local backend
- [ ] Update `VITE_API_URL` in Vercel to ngrok URL
- [ ] Note: Only for development, not production

## Environment URLs

After deployment, document your URLs:

- Development Frontend: `https://petflix-dev.vercel.app`
- Staging Frontend: `https://petflix-staging.vercel.app`
- Production Frontend: `https://petflix.vercel.app`
- Backend API: `https://your-backend-url.com`

## Quick Deploy Commands

### Via CLI (Optional)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to development
cd frontend
vercel --env=development

# Deploy to staging
vercel --env=staging --prod=false

# Deploy to production
vercel --prod
```

## Troubleshooting

- [ ] Check Vercel build logs if deployment fails
- [ ] Verify environment variables are set correctly
- [ ] Check backend CORS settings allow Vercel domains
- [ ] Test API connectivity from deployed frontend
- [ ] Check browser console for errors

