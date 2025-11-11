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
    console.log('🔍 Checking auth, token exists:', !!token);
    
    if (!token) {
      console.log('❌ No token found');
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }

    // Set loading to true when checking
    setLoading(true);

    try {
      console.log('📡 Fetching user data...');
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('✅ User authenticated:', userData.username);
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        console.log('❌ Auth failed:', response.status);
        // Token invalid
        if (response.status === 401 || response.status === 404) {
          localStorage.removeItem('auth_token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (err) {
      console.error('❌ Auth check error:', err);
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
      console.log('🔄 Auth changed event received, re-checking...');
      checkAuth();
    };

    // Listen for custom auth event
    window.addEventListener('auth-changed', handleAuthChange);
    // Listen for storage changes (cross-tab)
    window.addEventListener('storage', handleAuthChange);
    
    // Poll for token changes (only check if token was added/removed, not user state)
    let lastToken = localStorage.getItem('auth_token');
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('auth_token');
      // Only re-check if token was added or removed
      if (!!currentToken !== !!lastToken) {
        console.log('🔄 Token presence changed, re-checking...');
        lastToken = currentToken;
        checkAuth();
      }
    }, 2000); // Reduced frequency to 2 seconds

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

