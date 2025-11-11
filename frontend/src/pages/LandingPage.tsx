import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    // If user is already logged in, redirect to home
    if (!authLoading && isAuthenticated) {
      navigate('/home');
    }
  }, [isAuthenticated, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      // Login flow
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`${API_URL}/api/v1/users/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Login failed. Please check your credentials.';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText || 'Unknown error'}`;
          }
          setError(errorMessage);
          setLoading(false);
          return;
        }

        let data;
        try {
          data = await response.json();
        } catch (e) {
          setError('Invalid response from server. Please try again.');
          setLoading(false);
          return;
        }

        if (!data.token) {
          setError('Login successful but no token received. Please try again.');
          setLoading(false);
          return;
        }

        console.log('✅ Login successful, token received:', data.token.substring(0, 20) + '...');
        console.log('👤 User data:', data.user);
        localStorage.setItem('auth_token', data.token);
        console.log('💾 Token stored in localStorage');
        
        // Dispatch event to notify auth state change
        window.dispatchEvent(new Event('auth-changed'));
        console.log('📢 Auth-changed event dispatched');
        
        // Give auth hook a moment to update, then navigate
        setTimeout(() => {
          console.log('🚀 Navigating to /home');
          navigate('/home', { replace: true });
        }, 200);
      } catch (err: any) {
        console.error('Login error:', err);
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.name === 'TypeError') {
          setError(`Cannot connect to server at ${API_URL}. Please make sure the backend is running.`);
        } else {
          setError(err.message || 'Login failed. Please try again.');
        }
        setLoading(false);
      }
    } else {
      // Registration flow
      if (!formData.username || !formData.email || !formData.password) {
        setError('All fields are required');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      setLoading(true);

      try {
        const response = await fetch(`${API_URL}/api/v1/users/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        });

        if (!response.ok) {
          let errorMessage = 'Registration failed';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            errorMessage = `Server error: ${response.status} ${response.statusText || 'Unknown error'}`;
          }
          setError(errorMessage);
          setLoading(false);
          return;
        }

        let data;
        try {
          data = await response.json();
        } catch (e) {
          setError('Invalid response from server. Please try again.');
          setLoading(false);
          return;
        }

        if (!data.token) {
          setError('Registration successful but no token received. Please try logging in.');
          setLoading(false);
          return;
        }

        console.log('✅ Registration successful, token received:', data.token.substring(0, 20) + '...');
        console.log('👤 User data:', data.user);
        localStorage.setItem('auth_token', data.token);
        console.log('💾 Token stored in localStorage');
        
        // Dispatch event to notify auth state change
        window.dispatchEvent(new Event('auth-changed'));
        console.log('📢 Auth-changed event dispatched');
        
        alert('Welcome to Petflix! Your account has been created successfully.');
        
        // Give auth hook a moment to update, then navigate
        setTimeout(() => {
          console.log('🚀 Navigating to /home');
          navigate('/home', { replace: true });
        }, 200);
      } catch (err: any) {
        console.error('Registration error:', err);
        if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.name === 'TypeError') {
          setError(`Cannot connect to server at ${API_URL}. Please make sure the backend is running.`);
        } else {
          setError(err.message || 'Registration failed. Please try again.');
        }
        setLoading(false);
      }
    }
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F0F0DC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: '#666' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/landing-background.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Dark overlay for better text readability */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 0
      }} />
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Petflix Logo - Top Left */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: '#36454F',
          margin: 0
        }}>
          🐾 Petflix
        </h1>
      </div>

      {/* Centered Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '48px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          maxWidth: '450px',
          width: '100%'
        }}>
          {/* Title */}
          <h1 style={{
            fontSize: '32px',
            color: '#36454F',
            marginTop: 0,
            marginBottom: '32px',
            fontWeight: 'bold'
          }}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h1>

        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                minLength={3}
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: '#fff'
                }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <input
              type="email"
              placeholder="Email address"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
                backgroundColor: '#fff'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <input
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '16px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
                backgroundColor: '#fff'
              }}
            />
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '16px' }}>
              <input
                type="password"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: '#fff'
                }}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#ADD8E6',
              color: '#36454F',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginBottom: '16px'
            }}
          >
            {loading ? (isLogin ? 'Signing in...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>

          {isLogin && (
            <>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                fontSize: '14px'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#666',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ marginRight: '8px' }}
                  />
                  Remember me
                </label>
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Implement forgot password
                    alert('Forgot password feature coming soon');
                  }}
                  style={{
                    color: '#ADD8E6',
                    textDecoration: 'none'
                  }}
                >
                  Forgot password?
                </Link>
              </div>

              <div style={{
                textAlign: 'center',
                color: '#666',
                fontSize: '14px'
              }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setError('');
                    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ADD8E6',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    padding: 0
                  }}
                >
                  Sign up now
                </button>
              </div>
            </>
          )}

          {!isLogin && (
            <div style={{
              textAlign: 'center',
              color: '#666',
              fontSize: '14px',
              marginTop: '16px'
            }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setFormData({ username: '', email: '', password: '', confirmPassword: '' });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ADD8E6',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '14px',
                  padding: 0
                }}
              >
                Sign in
              </button>
            </div>
          )}

          {!isLogin && (
            <p style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#999',
              marginTop: '24px'
            }}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          )}
        </form>
        </div>
      </div>
      </div>
    </div>
  );
}
