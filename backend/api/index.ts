// Vercel serverless function entry point
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
// On Vercel, environment variables are already in process.env
// dotenv.config() only loads from .env file if it exists (for local dev)
dotenv.config();

// Log environment variable status (without exposing values)
console.log('[API] Environment check:', {
  hasSupabaseUrl: !!process.env.SUPABASE_URL,
  hasSupabaseAnonKey: !!process.env.SUPABASE_ANON_KEY,
  hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  hasJwtSecret: !!process.env.JWT_SECRET,
  nodeEnv: process.env.NODE_ENV || 'not set',
});

import routes from '../src/routes';
import { errorHandler } from '../src/middleware/errorHandler';

const app = express();

// CORS configuration - allow all origins for now to get it working
// In production, you can restrict this to specific frontend URLs
// The cors() middleware automatically handles OPTIONS preflight requests
// Express 5.x doesn't support '*' wildcard in routes, so we rely on cors() for OPTIONS
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (always log for debugging)
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method === 'POST' ? '***' : undefined, // Don't log passwords
    headers: {
      'content-type': req.headers['content-type'],
      'origin': req.headers.origin,
    },
  });
  next();
});

// Routes
app.use('/', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Export handler for Vercel serverless
// For Vercel, we can export the Express app directly
// Vercel automatically converts it to a serverless function handler
// This is the standard and recommended pattern for Express on Vercel
module.exports = app;
