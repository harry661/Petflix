# Petflix Setup Guide

## Prerequisites

- Node.js 18+ (Note: Some packages may require Node 20+, but the project should work with 18+)
- npm, yarn, or pnpm
- Git
- Supabase account (free tier is fine)
- YouTube Data API v3 key

## Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Note down:
   - Project URL (SUPABASE_URL)
   - Anon/public key (SUPABASE_ANON_KEY)
   - Service role key (SUPABASE_SERVICE_ROLE_KEY) - Keep this secret!

## Step 2: YouTube API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key

## Step 3: Environment Variables

### Backend (`backend/.env`)

Create `backend/.env` file:

```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
YOUTUBE_API_KEY=your_youtube_api_key_here
JWT_SECRET=generate_a_random_secret_string_here
CORS_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)

Create `frontend/.env` file:

```env
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
```

## Step 4: Install Dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

## Step 5: Run Development Servers

Open two terminal windows:

**Terminal 1 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend will run on http://localhost:5173

**Terminal 2 - Backend:**
```bash
cd backend
npm run dev
```
Backend will run on http://localhost:3000

## Step 6: Database Setup

Once Supabase is set up, you'll need to create the database tables. SQL migrations will be provided in the `backend/migrations/` directory (to be created).

## Troubleshooting

### Node Version Warnings
If you see engine warnings, the project should still work. Consider upgrading to Node 20+ for best compatibility.

### Port Already in Use
If port 3000 or 5173 is in use, change the PORT in `.env` files.

### CORS Issues
Ensure `CORS_ORIGIN` in backend `.env` matches your frontend URL.

## Next Steps

1. Set up database schema in Supabase
2. Implement authentication
3. Set up API routes
4. Build frontend pages
5. Implement PWA features

