# Petflix

A responsive web application, enhanced by PWA functionality, designed to provide users with a dedicated platform to discover, share, and engage with pet videos sourced from YouTube.

## Tech Stack

- **Frontend**: React, TailwindCSS, Shadcn UI
- **Backend**: Express (Node.js)
- **Database**: Supabase (PostgreSQL)
- **API**: YouTube Data API v3
- **Deployment**: Vercel (Frontend), Vercel/Other (Backend)

## Project Structure

```
Petflix/
├── frontend/          # React application
├── backend/           # Express API server
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Supabase account
- YouTube API key
- Git

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   ```

3. Set up environment variables:

   **Backend** (`backend/.env`):
   ```env
   PORT=3000
   NODE_ENV=development
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   YOUTUBE_API_KEY=your_youtube_api_key
   JWT_SECRET=your_jwt_secret_key
   CORS_ORIGIN=http://localhost:5173
   ```

   **Frontend** (`frontend/.env`):
   ```env
   VITE_API_URL=http://localhost:3000
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_YOUTUBE_API_KEY=your_youtube_api_key
   ```

4. Run development servers:
   ```bash
   # Frontend (from frontend/)
   npm run dev
   
   # Backend (from backend/)
   npm run dev
   ```

## Development

- Frontend runs on: http://localhost:5173 (Vite default)
- Backend runs on: http://localhost:3000

## Features

- User account management (registration, login, profiles)
- YouTube video search and discovery
- Share YouTube videos
- Follow other users
- Comment on videos
- Create and manage playlists
- PWA functionality with offline support
- Web push notifications
- TV casting (Chromecast/AirPlay)

## License

MIT

