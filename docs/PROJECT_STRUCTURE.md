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
│   ├── api/              # Vercel serverless function implementation
│   │   └── index.ts      # Express app (actual implementation)
├── api/                  # Vercel serverless function entry point (root)
│   └── index.ts          # Re-exports from backend/api/index.ts
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
- **`backend/api/index.ts`**: The actual Express app implementation
  - Imports routes from `../src/routes`
  - Sets up Express middleware (CORS, JSON parsing, error handling)
  - Exports the Express app using `module.exports`
- **`api/index.ts`** (root): Thin wrapper that re-exports from `backend/api/index.ts`
  - Required by Vercel (serverless functions must be in root `api/` directory)
  - Simply imports and re-exports the backend implementation

### Vercel Configuration
- **Function Location**: `api/index.ts` (root) - re-exports from `backend/api/index.ts`
- **Include Files**: `backend/**` (all backend files are included in the function)
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
