import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { API_URL } from '../config/api';

export interface User {
  id: string;
  username: string;
  email: string;
  profile_picture_url?: string | null;
  bio?: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Cache configuration
const CACHE_TTL = 30000; // 30 seconds - user data doesn't change frequently
const POLL_INTERVAL = 60000; // 60 seconds - check for token changes less frequently

// Global cache to prevent duplicate requests
let userCache: { data: User | null; timestamp: number } | null = null;
let pendingRequest: Promise<User | null> | null = null;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const lastTokenRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  const fetchUser = useCallback(async (forceRefresh = false): Promise<User | null> => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      return null;
    }

    // Check cache first (unless forcing refresh)
    if (!forceRefresh && userCache) {
      const cacheAge = Date.now() - userCache.timestamp;
      if (cacheAge < CACHE_TTL) {
        return userCache.data;
      }
    }

    // If there's already a pending request, wait for it
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request
    pendingRequest = (async () => {
      try {
        const response = await fetch(`${API_URL}/api/v1/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const userData = await response.json();
          // Update cache
          userCache = { data: userData, timestamp: Date.now() };
          return userData;
        } else {
          if (response.status === 401 || response.status === 404) {
            localStorage.removeItem('auth_token');
            userCache = null;
            return null;
          }
          return null;
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        return null;
      } finally {
        pendingRequest = null;
      }
    })();

    return pendingRequest;
  }, []);

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const userData = await fetchUser(true); // Force refresh
    if (mountedRef.current) {
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    }
    return userData;
  }, [fetchUser]);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    
    if (!token) {
      if (mountedRef.current) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    const userData = await fetchUser();
    
    if (mountedRef.current) {
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    }
  }, [fetchUser]);

  useEffect(() => {
    mountedRef.current = true;
    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      userCache = null; // Clear cache on auth change
      checkAuth();
    };

    window.addEventListener('auth-changed', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    // Poll for token changes (less frequently)
    lastTokenRef.current = localStorage.getItem('auth_token');
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('auth_token');
      // Only re-check if token was added or removed
      if (!!currentToken !== !!lastTokenRef.current) {
        lastTokenRef.current = currentToken;
        userCache = null; // Clear cache on token change
        checkAuth();
      }
    }, POLL_INTERVAL);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('auth-changed', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
      clearInterval(interval);
    };
  }, [checkAuth]);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    userCache = null;
    setUser(null);
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth-changed'));
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

