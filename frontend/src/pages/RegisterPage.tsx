import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

      // Handle non-OK responses
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

      // Parse successful response
      let data;
      try {
        data = await response.json();
      } catch (e) {
        setError('Invalid response from server. Please try again.');
        setLoading(false);
        return;
      }

      // Validate response has token
      if (!data.token) {
        setError('Registration successful but no token received. Please try logging in.');
        setLoading(false);
        return;
      }

      // Store token
      localStorage.setItem('auth_token', data.token);
      console.log('✅ Token stored, redirecting to home...');
      
      // Show welcome message
      alert('Welcome to Petflix! Your account has been created successfully.');
      
      // Force full page reload to ensure all state resets and useAuth runs
      window.location.href = '/home';
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.name === 'TypeError') {
        setError(`Cannot connect to server at ${API_URL}. Please make sure the backend is running.`);
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
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
        backgroundColor: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        maxWidth: '500px',
        width: '100%'
      }}>
        <h1 style={{ color: '#ffffff', marginTop: 0, textAlign: 'center' }}>
          Create Account
        </h1>
        <p style={{ color: '#ffffff', textAlign: 'center', marginBottom: '30px' }}>
          Join Petflix to discover and share pet videos
        </p>

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
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ffffff', fontWeight: 'bold' }}>
              Username
            </label>
            <input
              type="text"
              placeholder="Choose a username (3-20 characters)"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              minLength={3}
              maxLength={20}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ffffff', fontWeight: 'bold' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ffffff', fontWeight: 'bold' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={8}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
            <p style={{ fontSize: '12px', color: '#ffffff', marginTop: '5px' }}>
              Must contain uppercase, lowercase, and number
            </p>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ffffff', fontWeight: 'bold' }}>
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: '#ADD8E6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginBottom: '20px'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

          <p style={{ textAlign: 'center', color: '#ffffff', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#ADD8E6', textDecoration: 'none', fontWeight: 'bold' }}>
              Sign in
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '12px', color: '#999', marginTop: '20px' }}>
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </div>
    </div>
  );
}
