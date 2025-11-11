import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });

  const testHealth = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/health`);
      const data = await response.json();
      setTestResult({ success: true, data, status: response.status });
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testRegister = async () => {
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
      const data = await response.json();
      setTestResult({ 
        success: response.ok, 
        data, 
        status: response.status,
        token: data.token ? '✅ Token received!' : '❌ No token'
      });
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
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
      const data = await response.json();
      setTestResult({ 
        success: response.ok, 
        data, 
        status: response.status,
        token: data.token ? '✅ Token received!' : '❌ No token'
      });
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const testGetMe = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setTestResult({ success: false, error: 'No token found. Please login first.' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setTestResult({ success: response.ok, data, status: response.status });
    } catch (error: any) {
      setTestResult({ success: false, error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const clearToken = () => {
    localStorage.removeItem('auth_token');
    setTestResult({ success: true, message: 'Token cleared' });
  };

  return (
    <div style={{ 
      padding: '40px', 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '800px', 
      margin: '0 auto',
      backgroundColor: '#1E1E1E',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#ffffff', fontSize: '32px', marginBottom: '10px' }}>
        🐾 Petflix API Tester
      </h1>
      <p style={{ color: '#ffffff', fontSize: '16px', marginBottom: '30px' }}>
        Test backend endpoints - Focus on functionality
      </p>

      {/* Health Check */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#ffffff', marginTop: 0 }}>1. Health Check</h2>
        <button 
          onClick={testHealth} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#ADD8E6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Testing...' : 'Test /health'}
        </button>
      </div>

      {/* Registration Form */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#ffffff', marginTop: 0 }}>2. Register User</h2>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            placeholder="Username (3-20 chars)"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            style={{ 
              padding: '10px', 
              marginRight: '10px', 
              width: '200px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ 
              padding: '10px', 
              marginRight: '10px', 
              width: '200px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <input
            type="password"
            placeholder="Password (Test1234)"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{ 
              padding: '10px', 
              marginRight: '10px', 
              width: '200px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        <p style={{ fontSize: '12px', color: '#ffffff', marginBottom: '10px' }}>
          Password must be 8+ chars with uppercase, lowercase, and number
        </p>
        <button 
          onClick={testRegister} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#ADD8E6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </div>

      {/* Login */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#ffffff', marginTop: 0 }}>3. Login</h2>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ 
              padding: '10px', 
              marginRight: '10px', 
              width: '200px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{ 
              padding: '10px', 
              marginRight: '10px', 
              width: '200px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>
        <button 
          onClick={testLogin} 
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px',
            backgroundColor: '#ADD8E6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </div>

      {/* Get Current User */}
      <div style={{ 
        marginBottom: '30px', 
        padding: '20px', 
        backgroundColor: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ color: '#ffffff', marginTop: 0 }}>4. Get Current User (Authenticated)</h2>
        <div style={{ marginBottom: '10px' }}>
          <button 
            onClick={testGetMe} 
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px',
              backgroundColor: '#ADD8E6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              marginRight: '10px'
            }}
          >
            {loading ? 'Loading...' : 'Get /me'}
          </button>
          <button 
            onClick={clearToken}
            style={{ 
              padding: '10px 20px', 
              fontSize: '16px',
              backgroundColor: '#f0f0f0',
              color: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Clear Token
          </button>
        </div>
        <p style={{ fontSize: '14px', color: '#ffffff' }}>
          Token Status: {localStorage.getItem('auth_token') ? '✅ Stored' : '❌ Not found'}
        </p>
      </div>

      {/* Results */}
      {testResult && (
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: testResult.success ? '#e8f5e9' : '#ffebee',
          borderRadius: '8px',
          border: `2px solid ${testResult.success ? '#4caf50' : '#f44336'}`
        }}>
          <h3 style={{ 
            marginTop: 0, 
            color: testResult.success ? '#2e7d32' : '#c62828'
          }}>
            {testResult.success ? '✅ Success' : '❌ Error'}
          </h3>
          <pre style={{ 
            overflow: 'auto', 
            fontSize: '12px',
            backgroundColor: 'white',
            padding: '15px',
            borderRadius: '4px',
            maxHeight: '400px'
          }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
