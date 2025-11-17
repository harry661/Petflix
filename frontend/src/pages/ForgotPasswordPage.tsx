import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/v1/users/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
        <Link
          to="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: 'rgba(255, 255, 255, 0.7)',
            textDecoration: 'none',
            marginBottom: '24px',
            fontSize: '14px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ADD8E6'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
        >
          <ArrowLeft size={16} />
          Back to login
        </Link>

        <h1 style={{
          color: '#ffffff',
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          Forgot Password?
        </h1>
        <p style={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          marginBottom: '32px'
        }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {success ? (
          <div style={{
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            border: '1px solid rgba(76, 175, 80, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px'
          }}>
            <p style={{
              color: '#4CAF50',
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              If an account with that email exists, a password reset link has been sent. Please check your email.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
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

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
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
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  style={{
                    width: '100%',
                    padding: '16px 16px 16px 48px',
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
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              style={{
                width: '100%',
                padding: '16px',
                backgroundColor: loading || !email.trim() ? 'rgba(173, 216, 230, 0.5)' : '#ADD8E6',
                color: '#0F0F0F',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading || !email.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                marginBottom: '20px'
              }}
              onMouseEnter={(e) => {
                if (!loading && email.trim()) {
                  e.currentTarget.style.backgroundColor = '#87CEEB';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading && email.trim()) {
                  e.currentTarget.style.backgroundColor = '#ADD8E6';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div style={{
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', margin: 0 }}>
            Remember your password?{' '}
            <Link
              to="/"
              style={{
                color: '#ADD8E6',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

