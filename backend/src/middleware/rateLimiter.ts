import { Request, Response, NextFunction } from 'express';

/**
 * Simple in-memory rate limiter
 * For production, consider using Redis or a dedicated rate limiting service
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware
 * Configurable per endpoint with generous defaults to avoid breaking anything
 */
export const rateLimiter = (options: {
  windowMs?: number; // Time window in milliseconds
  max?: number; // Maximum requests per window
  keyGenerator?: (req: Request) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
} = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default (generous)
    max = 100, // 100 requests per window (generous)
    keyGenerator = (req: Request) => {
      // Default: use IP address + user ID if authenticated
      const ip = req.ip || req.socket.remoteAddress || 'unknown';
      const userId = (req as any).user?.userId || '';
      return `${ip}:${userId}`;
    },
    skipSuccessfulRequests = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyGenerator(req);
    const now = Date.now();

    // Initialize or reset if window expired
    if (!store[key] || store[key].resetTime < now) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Check if limit exceeded
    if (store[key].count >= max) {
      const retryAfter = Math.ceil((store[key].resetTime - now) / 1000);
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${retryAfter} seconds.`,
        retryAfter,
      });
      return;
    }

    // Increment counter
    store[key].count++;

    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', max.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - store[key].count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());

    // Track response status if needed
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function (body) {
        if (res.statusCode < 400) {
          store[key].count = Math.max(0, store[key].count - 1);
        }
        return originalSend.call(this, body);
      };
    }

    next();
  };
};

/**
 * Strict rate limiter for authentication endpoints
 */
export const authRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes (stricter for auth)
});

/**
 * Standard rate limiter for general API endpoints
 */
export const apiRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes (generous)
});

/**
 * Lenient rate limiter for read operations
 */
export const readRateLimiter = rateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute (very generous for reads)
});

