# Petflix Project Structure

## Overview

Petflix is a monorepo containing a React frontend and Express backend, deployed together on Vercel.

## Directory Structure

```
Petflix/
├── frontend/              # React + Vite frontend application
│   ├── src/               # Source code
│   ├── public/           # Static assets
│   ├── dist/             # Build output (gitignored)
│   └── package.json      # Frontend dependencies
│
├── backend/              # Express API server
│   ├── src/              # Source code
│   │   ├── config/       # Configuration (Supabase, etc.)
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API route definitions
│   │   ├── services/     # Business logic services
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   ├── api/              # Vercel serverless function entry point
│   │   └── index.ts      # Express app exported for Vercel
│   ├── migrations/       # Database migration SQL files
│   ├── scripts/          # Utility scripts (VAPID keys, storage setup, etc.)
│   ├── dist/             # Compiled JavaScript (gitignored)
│   └── package.json      # Backend dependencies
│
├── docs/                  # All project documentation
│   ├── setup/            # Setup and configuration guides
│   ├── deployment/       # Deployment guides
│   ├── features/        # Feature documentation
│   ├── troubleshooting/ # Troubleshooting guides
│   ├── migrations/      # Migration guides
│   └── api/             # API documentation
│
├── scripts/              # Root-level utility scripts
│   ├── start-frontend.sh
│   ├── start-backend.sh
│   ├── setup-env.sh
│   └── test-email.sh
│
├── vercel.json           # Vercel deployment configuration
└── README.md             # Main project README
```

## Key Points

### Backend Structure
- **`backend/src/`**: Main application code
- **`backend/api/index.ts`**: Vercel serverless function entry point (imports from `src/`)
- **`backend/migrations/`**: SQL migration files (numbered sequentially)
- **`backend/scripts/`**: Utility TypeScript scripts

### API Entry Point
The `backend/api/index.ts` file is the Vercel serverless function entry point. It:
- Imports routes from `../src/routes`
- Sets up Express middleware (CORS, JSON parsing, error handling)
- Exports the Express app for Vercel

### Vercel Configuration
- **Function Location**: `backend/api/index.ts`
- **Rewrite Rule**: `/api/*` → `/api/index` (handled by the Express app)
- **Build**: Frontend builds to `frontend/dist`
- **Install**: Installs dependencies for both frontend and backend

### Dependencies
- **Frontend**: Managed in `frontend/package.json`
- **Backend**: Managed in `backend/package.json` (includes API entry point dependencies)

## Development

### Local Development
```bash
# Frontend (from frontend/)
npm run dev

# Backend (from backend/)
npm run dev
```

### Scripts
Utility scripts are in the root `scripts/` folder for easy access:
- `start-frontend.sh`: Start frontend dev server
- `start-backend.sh`: Start backend dev server
- `setup-env.sh`: Environment variable setup helper

## Deployment

The project is configured for Vercel monorepo deployment:
1. Frontend builds to `frontend/dist`
2. Backend API function is at `backend/api/index.ts`
3. All `/api/*` requests are routed to the backend function
4. All other requests serve the frontend SPA
