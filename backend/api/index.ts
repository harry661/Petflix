// Vercel serverless function entry point
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import routes from '../src/routes';
import { errorHandler } from '../src/middleware/errorHandler';

const app = express();

// Get CORS origin from environment - support multiple origins
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const allowedOrigins = CORS_ORIGIN.split(',').map(origin => origin.trim());

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      // For development, allow all origins
      if (process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
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

