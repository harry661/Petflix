import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';
import PawLogo from '../assets/Paw.svg';
import PetflixLogo from '../assets/PETFLIX.svg';

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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        backgroundColor: '#36454F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p style={{ color: '#ffffff' }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundImage: 'url(/landing-background.png)',
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
        left: '20px',
        zIndex: 2,
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <img src={PawLogo} alt="Petflix" style={{ width: '32px', height: '28px' }} />
        <img src={PetflixLogo} alt="Petflix" style={{ height: '20px', width: 'auto' }} />
      </div>

      {/* Centered Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          padding: '48px',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          maxWidth: '450px',
          width: '100%',
          backdropFilter: 'blur(10px)'
        }}>
          {/* Title */}
          <h1 style={{
            fontSize: '32px',
            color: '#fff',
            marginTop: 0,
            marginBottom: '32px',
            fontWeight: 'bold'
          }}>
            {isLogin ? 'Sign In' : 'Sign Up'}
          </h1>

        {error && (
          <div style={{
            backgroundColor: 'rgba(198, 40, 40, 0.2)',
            color: '#ff6b6b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
            border: '1px solid rgba(198, 40, 40, 0.4)'
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
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ADD8E6';
                  e.target.style.borderWidth = '1px';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.borderWidth = '1px';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
              />
            </div>
          )}
          <style>{`
            input::placeholder {
              color: rgba(255, 255, 255, 0.6) !important;
            }
            input {
              color: #fff !important;
            }
            input:-webkit-autofill,
            input:-webkit-autofill:hover,
            input:-webkit-autofill:focus {
              -webkit-text-fill-color: #fff !important;
              -webkit-box-shadow: 0 0 0px 1000px rgba(255, 255, 255, 0.08) inset !important;
              transition: background-color 5000s ease-in-out 0s;
            }
          `}</style>

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
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ADD8E6';
                e.target.style.borderWidth = '1px';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.borderWidth = '1px';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
            />
          </div>

          <div style={{ marginBottom: '16px', position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '16px',
                paddingRight: '48px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '4px',
                fontSize: '16px',
                boxSizing: 'border-box',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#fff',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ADD8E6';
                e.target.style.borderWidth = '1px';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.borderWidth = '1px';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ADD8E6'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLogin && (
            <div style={{ marginBottom: '16px', position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  paddingRight: '48px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ADD8E6';
                  e.target.style.borderWidth = '1px';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.borderWidth = '1px';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ADD8E6'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: '#ADD8E6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginBottom: '16px',
              transition: 'opacity 0.2s, transform 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'scale(1.01)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = loading ? 0.6 : 1;
              e.currentTarget.style.transform = 'scale(1)';
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
                  color: 'rgba(255, 255, 255, 0.8)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ marginRight: '8px', cursor: 'pointer' }}
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
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
                >
                  Forgot password?
                </Link>
              </div>

              <div style={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.8)',
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
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  Sign up now
                </button>
              </div>
            </>
          )}

          {!isLogin && (
            <div style={{
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.8)',
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
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                Sign in
              </button>
            </div>
          )}

          {!isLogin && (
            <p style={{
              textAlign: 'center',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.6)',
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
