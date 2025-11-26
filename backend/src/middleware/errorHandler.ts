import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '../types';

export const errorHandler = (
  err: Error | any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);
  console.error('Request path:', req.path);
  console.error('Request method:', req.method);

  // Default error
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Something went wrong!';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message || 'Validation error';
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Authentication required';
  } else if (err.code === 'PGRST116' || err.code === 'PGRST205') {
    // Supabase/PostgREST errors
    statusCode = 404;
    message = err.message || 'Resource not found';
  } else if (err.code === '23505') {
    // PostgreSQL unique constraint violation
    statusCode = 409;
    message = 'This resource already exists';
  } else if (err.code === '23503') {
    // PostgreSQL foreign key violation
    statusCode = 400;
    message = 'Invalid reference';
  }

  const errorResponse: ErrorResponse = {
    error: message,
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.path}`,
  });
};

