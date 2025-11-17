import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { API_URL } from '../config/api';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      } else {
        setError(data.error || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      setError('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '450px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <CheckCircle2 size={64} color="#4CAF50" style={{ marginBottom: '24px' }} />
          <h1 style={{
            color: '#ffffff',
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '16px'
          }}>
            Password Reset Successful!
          </h1>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            Your password has been successfully reset. Redirecting to login...
          </p>
          <Link
            to="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: '#ADD8E6',
              color: '#0F0F0F',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#87CEEB';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ADD8E6';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F0F',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        borderRadius: '16px',
        padding: '40px',
        maxWidth: '450px',
        width: '100%',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          Reset Password
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          marginBottom: '32px'
        }}>
          Enter your new password below.
        </p>

        {error && (
          <div style={{
            backgroundColor: 'rgba(198, 40, 40, 0.1)',
            border: '1px solid rgba(198, 40, 40, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#c62828', margin: 0, fontSize: '14px' }}>{error}</p>
          </div>
        )}

        {!token && (
          <div style={{
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px'
          }}>
            <p style={{ color: '#FF9800', margin: 0, fontSize: '14px' }}>
              Invalid reset link. Please request a new password reset.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={20}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                autoComplete="new-password"
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  paddingRight: '48px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ADD8E6';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
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
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px', marginTop: '4px', marginBottom: 0 }}>
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Confirm New Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={20}
                style={{
                  position: 'absolute',
                  left: '16px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                required
                minLength={8}
                style={{
                  width: '100%',
                  padding: '16px 16px 16px 48px',
                  paddingRight: '48px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ADD8E6';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
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
                  color: 'rgba(255, 255, 255, 0.7)'
                }}
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !token || !password || !confirmPassword}
            style={{
              width: '100%',
              padding: '16px',
              backgroundColor: loading || !token || !password || !confirmPassword ? 'rgba(173, 216, 230, 0.5)' : '#ADD8E6',
              color: '#0F0F0F',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading || !token || !password || !confirmPassword ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              marginBottom: '20px'
            }}
            onMouseEnter={(e) => {
              if (!loading && token && password && confirmPassword) {
                e.currentTarget.style.backgroundColor = '#87CEEB';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && token && password && confirmPassword) {
                e.currentTarget.style.backgroundColor = '#ADD8E6';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: 0 }}>
            <Link
              to="/forgot-password"
              style={{
                color: '#ADD8E6',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Request a new reset link
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

