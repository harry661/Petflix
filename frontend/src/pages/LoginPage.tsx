import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function LoginPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

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

      // Handle non-OK responses
      if (!response.ok) {
        let errorMessage = 'Login failed. Please check your credentials.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response isn't JSON, use status text
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
        setError('Login successful but no token received. Please try again.');
        setLoading(false);
        return;
      }

      // Store token
      localStorage.setItem('auth_token', data.token);
      
      // Trigger custom event so Navigation updates immediately
      const authEvent = new Event('auth-changed');
      window.dispatchEvent(authEvent);
      
      // Force a page reload to ensure all state updates
      window.location.href = '/home';
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError') || err.name === 'TypeError') {
        setError(`Cannot connect to server at ${API_URL}. Please make sure the backend is running.`);
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F0F0DC',
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
        <h1 style={{ color: '#36454F', marginTop: 0, textAlign: 'center' }}>
          Welcome Back
        </h1>
        <p style={{ color: '#666', textAlign: 'center', marginBottom: '30px' }}>
          Sign in to your Petflix account
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
            <label style={{ display: 'block', marginBottom: '8px', color: '#36454F', fontWeight: 'bold' }}>
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
            <label style={{ display: 'block', marginBottom: '8px', color: '#36454F', fontWeight: 'bold' }}>
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
              color: '#36454F',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginBottom: '20px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#ADD8E6', textDecoration: 'none', fontWeight: 'bold' }}>
              Create account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
