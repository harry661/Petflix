// Centralized API URL configuration
// Checks for environment-specific variables first, then falls back to default
const getApiUrl = () => {
  const url = 
    import.meta.env.VITE_API_URL_PROD ||
    import.meta.env.VITE_API_URL_STAGING ||
    import.meta.env.VITE_API_URL_DEV ||
    'http://localhost:3000';
  
  // Log in development to help debug
  if (import.meta.env.DEV) {
    console.log('🔧 API URL Configuration:', {
      VITE_API_URL_PROD: import.meta.env.VITE_API_URL_PROD || 'NOT SET',
      VITE_API_URL_STAGING: import.meta.env.VITE_API_URL_STAGING || 'NOT SET',
      VITE_API_URL_DEV: import.meta.env.VITE_API_URL_DEV || 'NOT SET',
      resolved: url,
    });
  }
  
  return url;
};

export const API_URL = getApiUrl();

