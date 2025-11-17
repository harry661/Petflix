// Centralized API URL configuration
// For monorepo deployment: use relative URLs (same domain)
// For local dev: use localhost
const getApiUrl = () => {
  // In production (monorepo), API is on same domain at /api
  // In local dev, use localhost:3000
  const isProduction = import.meta.env.PROD;
  const isLocalDev = import.meta.env.DEV;
  
  // Check for explicit override (for testing different backends)
  const explicitUrl = 
    import.meta.env.VITE_API_URL_PROD ||
    import.meta.env.VITE_API_URL_STAGING ||
    import.meta.env.VITE_API_URL_DEV;
  
  let url: string;
  
  if (explicitUrl) {
    // Use explicit URL if provided (for testing)
    url = explicitUrl;
  } else if (isLocalDev) {
    // Local development: use localhost
    url = 'http://localhost:3000';
  } else {
    // Production (monorepo): use relative URL (same domain)
    url = '';
  }
  
  // Normalize URL: remove trailing slash
  let normalizedUrl = url.trim();
  if (normalizedUrl.endsWith('/')) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }
  
  // Log configuration for debugging
  console.log('🔧 API URL Configuration:', {
    isProduction,
    isLocalDev,
    explicitUrl: explicitUrl || 'NOT SET',
    computed: normalizedUrl || '(relative - same domain)',
    final: normalizedUrl || window.location.origin,
  });
  
  return normalizedUrl;
};

export const API_URL = getApiUrl();

