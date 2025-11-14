// Vercel serverless function entry point
import express, { Request, Response } from 'express';
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (always log for debugging)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`, {
    query: req.query,
    body: req.method === 'POST' ? '***' : undefined, // Don't log passwords
  });
  next();
});

// Routes
app.use('/', routes);

// Error handling middleware (must be last)
app.use(errorHandler);

// Export handler for Vercel serverless
// For CommonJS compilation, we need to use module.exports
module.exports = app;

