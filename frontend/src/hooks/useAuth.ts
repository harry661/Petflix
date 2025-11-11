import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface User {
  id: string;
  username: string;
  email: string;
  profile_picture_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    // Set loading to true when checking
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Token invalid
        if (response.status === 401 || response.status === 404) {
          localStorage.removeItem('auth_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (err) {
      // Don't clear token on network errors - might be temporary
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuth();
    };

    // Listen for custom auth event
    window.addEventListener('auth-changed', handleAuthChange);
    // Listen for storage changes (cross-tab)
    window.addEventListener('storage', handleAuthChange);
    
    // Poll for token changes (only check if token was added/removed, not user state)
    // Reduced polling frequency to 5 seconds to improve performance
    let lastToken = localStorage.getItem('auth_token');
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('auth_token');
      // Only re-check if token was added or removed
      if (!!currentToken !== !!lastToken) {
        lastToken = currentToken;
        checkAuth();
      }
    }, 5000); // Increased to 5 seconds to reduce overhead

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run once on mount

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth-changed'));
  };

  return {
    isAuthenticated,
    user,
    loading,
    checkAuth,
    logout,
  };
}

