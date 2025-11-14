// Centralized API URL configuration
// Checks for environment-specific variables first, then falls back to default
const getApiUrl = () => {
  const url = 
    import.meta.env.VITE_API_URL_PROD ||
    import.meta.env.VITE_API_URL_STAGING ||
    import.meta.env.VITE_API_URL_DEV ||
    'http://localhost:3000';
  
  // Normalize URL: remove trailing slash and ensure it's a valid URL
  let normalizedUrl = url.trim();
  if (normalizedUrl.endsWith('/')) {
    normalizedUrl = normalizedUrl.slice(0, -1);
  }
  
  // Log in both dev and production to help debug
  console.log('🔧 API URL Configuration:', {
    VITE_API_URL_PROD: import.meta.env.VITE_API_URL_PROD || 'NOT SET',
    VITE_API_URL_STAGING: import.meta.env.VITE_API_URL_STAGING || 'NOT SET',
    VITE_API_URL_DEV: import.meta.env.VITE_API_URL_DEV || 'NOT SET',
    raw: url,
    normalized: normalizedUrl,
  });
  
  return normalizedUrl;
};

export const API_URL = getApiUrl();

