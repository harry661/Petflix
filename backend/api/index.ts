// Vercel serverless function entry point
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import routes from '../src/routes';
import { errorHandler } from '../src/middleware/errorHandler';

const app = express();

// CORS configuration - allow all origins for now to get it working
// In production, you can restrict this to specific frontend URLs
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Handle OPTIONS preflight requests explicitly
app.options('*', (req: Request, res: Response) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

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

// Catch-all handler for unmatched routes (before error handler)
// This ensures all methods are handled, not just specific routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  // If we get here, the route wasn't matched
  // Let the 404 handler deal with it
  next();
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Export handler for Vercel serverless
// Vercel automatically detects Express apps in the api/ directory
// and converts them to serverless functions
// Export the app - this is the standard pattern for Express on Vercel
module.exports = app;

