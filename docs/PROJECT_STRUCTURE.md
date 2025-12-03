# Petflix Project Structure

## Overview

This is a monorepo structure with separate frontend and backend applications.

```
Petflix/
├── frontend/              # React + Vite + TailwindCSS + Shadcn UI
│   ├── src/
│   │   ├── components/   # React components
│   │   │   └── ui/        # Shadcn UI components (Button, Card, Input, Dialog)
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service functions
│   │   ├── types/         # TypeScript type definitions
│   │   ├── context/       # React context providers
│   │   ├── utils/         # Utility functions
│   │   └── lib/           # Library configurations (utils.ts)
│   ├── public/            # Static assets
│   └── package.json
│
├── backend/               # Express + TypeScript
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── controllers/  # Request controllers
│   │   ├── middleware/   # Express middleware
│   │   ├── models/        # Data models
│   │   ├── services/      # Business logic services
│   │   ├── utils/         # Utility functions
│   │   └── types/         # TypeScript type definitions
│   ├── dist/              # Compiled JavaScript (generated)
│   └── package.json
│
├── .gitignore
├── README.md
├── SETUP.md
└── PROJECT_STRUCTURE.md
```

## Frontend Structure

### Components
- **UI Components** (`src/components/ui/`): Shadcn UI components
  - Button
  - Card
  - Input
  - Dialog

### Pages (to be created)
- Landing page
- Search results page
- Video detail page
- User profile page
- Account settings page
- Shared video feed

### Services (to be created)
- API client for backend communication
- Supabase client
- YouTube API integration

## Backend Structure

### Routes (to be created)
- `/api/v1/users/*` - User management
- `/api/v1/videos/*` - Video operations
- `/api/v1/comments/*` - Comment operations
- `/api/v1/playlists/*` - Playlist operations
- `/api/v1/push_notifications/*` - Push notification subscriptions

### Controllers (to be created)
- User controllers
- Video controllers
- Comment controllers
- Playlist controllers

### Services (to be created)
- Authentication service
- YouTube API service
- Supabase service
- Notification service

## Technology Stack

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **TailwindCSS** - Utility-first CSS
- **Shadcn UI** - Component library
- **Radix UI** - Accessible component primitives

### Backend
- **Express 5** - Web framework
- **TypeScript** - Type safety
- **Node.js** - Runtime
- **Supabase** - Database and auth
- **YouTube Data API v3** - Video data

## Color Palette

- **Cream**: #F0F0DC (background)
- **Charcoal**: #36454F (text)
- **Light Blue**: #ADD8E6 (primary/accent)

## Next Steps

1. Set up Supabase database schema
2. Implement authentication (Supabase Auth)
3. Create API routes and controllers
4. Build frontend pages
5. Implement PWA features
6. Add web push notifications
7. Implement TV casting

