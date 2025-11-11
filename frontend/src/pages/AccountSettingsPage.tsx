import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    profile_picture_url: '',
    bio: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (isAuthenticated === undefined) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    loadUser();
  }, [isAuthenticated, navigate]);

  const loadUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    
    // Use auth user if available, otherwise fetch
    if (authUser) {
      setUser(authUser);
      setFormData({
        profile_picture_url: authUser.profile_picture_url || '',
        bio: authUser.bio || '',
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setFormData({
          profile_picture_url: userData.profile_picture_url || '',
          bio: userData.bio || '',
        });
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load user:', response.status, errorData);
        
        if (response.status === 401) {
          // Token invalid or expired
          localStorage.removeItem('auth_token');
          window.dispatchEvent(new Event('auth-changed'));
          navigate('/', { replace: true });
          return;
        } else if (response.status === 404) {
          // User not found - token might be valid but user deleted
          setError('Your account was not found. Please log in again.');
          localStorage.removeItem('auth_token');
          window.dispatchEvent(new Event('auth-changed'));
        } else {
          setError(errorData.error || 'Failed to load user data. Please try again.');
        }
      }
    } catch (err: any) {
      console.error('Error loading user:', err);
      setError('Failed to load user data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile_picture_url: formData.profile_picture_url || null,
          bio: formData.bio || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data);
        alert('Profile updated successfully!');
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F0F0DC', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Loading your settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F0F0DC', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#c62828', marginBottom: '20px' }}>
          {error || 'Unable to load your account. Please try logging in again.'}
        </p>
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ADD8E6',
            color: '#36454F',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F0F0DC',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ color: '#36454F', marginBottom: '30px' }}>Account Settings</h1>

        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          {error && (
            <div style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSave}>
            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#36454F', fontWeight: 'bold' }}>
                Profile Picture URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.profile_picture_url}
                onChange={(e) => setFormData({ ...formData, profile_picture_url: e.target.value })}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
              />
              {formData.profile_picture_url && (
                <img
                  src={formData.profile_picture_url}
                  alt="Preview"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginTop: '10px'
                  }}
                />
              )}
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#36454F', fontWeight: 'bold' }}>
                Bio
              </label>
              <textarea
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                maxLength={255}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '16px',
                  minHeight: '100px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
              <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                {formData.bio.length}/255 characters
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#ADD8E6',
                  color: '#36454F',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#f0f0f0',
                  color: '#36454F',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '16px',
                  cursor: 'pointer'
                }}
              >
                Logout
              </button>
            </div>
          </form>

          {user && (
            <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
              <h3 style={{ color: '#36454F' }}>Account Information</h3>
              <p style={{ color: '#666' }}><strong>Username:</strong> {user.username}</p>
              <p style={{ color: '#666' }}><strong>Email:</strong> {user.email}</p>
              <p style={{ color: '#666', fontSize: '12px' }}>
                Member since: {new Date(user.created_at).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
