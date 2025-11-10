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
        token: data.token ? 'Token received!' : 'No token'
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
        token: data.token ? 'Token received!' : 'No token'
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

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Petflix API Tester</h1>
      <p>Test backend endpoints</p>

      <div style={{ marginBottom: '20px' }}>
        <h2>Health Check</h2>
        <button onClick={testHealth} disabled={loading} style={{ padding: '10px 20px' }}>
          {loading ? 'Testing...' : 'Test /health'}
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Register User</h2>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Username"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            style={{ padding: '8px', marginRight: '10px', width: '200px' }}
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ padding: '8px', marginRight: '10px', width: '200px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{ padding: '8px', marginRight: '10px', width: '200px' }}
          />
        </div>
        <button onClick={testRegister} disabled={loading} style={{ padding: '10px 20px' }}>
          Register
        </button>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2>Login</h2>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ padding: '8px', marginRight: '10px', width: '200px' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            style={{ padding: '8px', marginRight: '10px', width: '200px' }}
          />
        </div>
        <button onClick={testLogin} disabled={loading} style={{ padding: '10px 20px' }}>
          Login
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Get Current User</h2>
        <button onClick={testGetMe} disabled={loading} style={{ padding: '10px 20px' }}>
          Get /me
        </button>
        <p>Token: {localStorage.getItem('auth_token') ? '✅ Stored' : '❌ Not found'}</p>
      </div>

      {testResult && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
          <h3>{testResult.success ? '✅ Success' : '❌ Error'}</h3>
          <pre style={{ overflow: 'auto', fontSize: '12px' }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
