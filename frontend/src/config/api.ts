// Centralized API URL configuration
// Checks for environment-specific variables first, then falls back to default
const getApiUrl = () => {
  return (
    import.meta.env.VITE_API_URL_PROD ||
    import.meta.env.VITE_API_URL_STAGING ||
    import.meta.env.VITE_API_URL_DEV ||
    'http://localhost:3000'
  );
};

export const API_URL = getApiUrl();

