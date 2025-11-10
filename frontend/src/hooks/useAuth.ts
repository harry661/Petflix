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

    try {
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        setLoading(false);
      } else {
        // Token invalid
        if (response.status === 401 || response.status === 404) {
          localStorage.removeItem('auth_token');
          setUser(null);
          setIsAuthenticated(false);
        }
        setLoading(false);
      }
    } catch (err) {
      console.error('Auth check error:', err);
      // Don't clear token on network errors - might be temporary
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

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

