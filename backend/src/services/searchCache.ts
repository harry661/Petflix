/**
 * Simple in-memory cache for YouTube search results
 * Helps reduce API quota usage by caching search results
 */

interface CachedSearchResult {
  videos: any[];
  timestamp: number;
  query: string;
}

// Cache with 1 hour TTL (3600000 ms)
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, CachedSearchResult>();

/**
 * Get cached search results
 */
export const getCachedSearch = (query: string): any[] | null => {
  const cacheKey = query.toLowerCase().trim();
  const cached = cache.get(cacheKey);
  
  if (!cached) {
    return null;
  }
  
  // Check if cache is still valid
  const age = Date.now() - cached.timestamp;
  if (age > CACHE_TTL) {
    cache.delete(cacheKey);
    return null;
  }
  
  return cached.videos;
};

/**
 * Cache search results
 */
export const setCachedSearch = (query: string, videos: any[]): void => {
  const cacheKey = query.toLowerCase().trim();
  cache.set(cacheKey, {
    videos,
    timestamp: Date.now(),
    query: cacheKey,
  });
  
  // Clean up old cache entries periodically (keep cache size reasonable)
  if (cache.size > 100) {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > CACHE_TTL) {
        cache.delete(key);
      }
    }
  }
};

/**
 * Clear cache (useful for testing or manual cache invalidation)
 */
export const clearCache = (): void => {
  cache.clear();
};

/**
 * Get cache stats (for monitoring)
 */
export const getCacheStats = () => {
  const now = Date.now();
  let validEntries = 0;
  let expiredEntries = 0;
  
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      expiredEntries++;
    } else {
      validEntries++;
    }
  }
  
  return {
    totalEntries: cache.size,
    validEntries,
    expiredEntries,
  };
};

