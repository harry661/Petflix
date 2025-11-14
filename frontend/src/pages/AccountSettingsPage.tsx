import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Save, LogOut, User, Mail, Lock, Bell, Trash2, Eye, EyeOff } from 'lucide-react';

import { API_URL } from '../config/api';

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser, loading: authLoading, logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    profile_picture_url: '',
    bio: '',
    username: '',
    email: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [notificationPreferences, setNotificationPreferences] = useState({
    enabled: true,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    loadUser();
  }, [isAuthenticated, authLoading, navigate]);

  const loadUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/', { replace: true });
      return;
    }
    
    if (authUser) {
      setUser(authUser);
      setFormData({
        profile_picture_url: authUser.profile_picture_url || '',
        bio: authUser.bio || '',
        username: authUser.username || '',
        email: authUser.email || '',
      });
      loadNotificationPreferences();
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
          username: userData.username || '',
          email: userData.email || '',
        });
        loadNotificationPreferences();
      } else {
        if (response.status === 401) {
          localStorage.removeItem('auth_token');
          window.dispatchEvent(new Event('auth-changed'));
          navigate('/', { replace: true });
          return;
        }
        setError('Failed to load user data');
      }
    } catch (err: any) {
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationPreferences = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/users/me/notification-preference`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const notifData = await response.json();
        setNotificationPreferences({ enabled: notifData.notificationsEnabled ?? true });
      }
    } catch (err) {
      // Error loading preferences - use defaults
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
        setSuccess('Profile updated successfully!');
        // Update auth context
        window.dispatchEvent(new Event('auth-changed'));
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      // Note: This endpoint may need to be implemented in the backend
      const response = await fetch(`${API_URL}/api/v1/users/me/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully!');
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err: any) {
      setError('Failed to change password. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleToggleNotifications = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const newState = !notificationPreferences.enabled;
      const response = await fetch(`${API_URL}/api/v1/users/me/notification-preference`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: newState }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationPreferences({ enabled: data.notificationsEnabled });
        setSuccess(`Notifications ${data.notificationsEnabled ? 'enabled' : 'disabled'}`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to update notification preferences');
      }
    } catch (err) {
      setError('Failed to update notification preferences');
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      // Note: This endpoint may need to be implemented in the backend
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        logout();
        navigate('/', { replace: true });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete account');
      }
    } catch (err) {
      setError('Failed to delete account');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0F0F0F', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ffffff' }}>Loading your settings...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0F0F0F', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#c62828', marginBottom: '20px' }}>
          {error || 'Unable to load your account. Please try logging in again.'}
        </p>
        <button
          onClick={() => navigate('/', { replace: true })}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ADD8E6',
            color: '#0F0F0F',
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
      backgroundColor: '#0F0F0F',
      padding: '40px'
    }}>
      <div style={{
        maxWidth: '100%',
        margin: '0 auto',
        padding: '0 40px'
      }}>
        <h1 style={{
          color: '#ffffff',
          marginBottom: '40px',
          fontSize: '32px',
          fontWeight: '600'
        }}>
          Account Settings
        </h1>

        {/* Success Message */}
        {success && (
          <div style={{
            backgroundColor: 'rgba(76, 175, 80, 0.2)',
            color: '#4CAF50',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
            border: '1px solid rgba(76, 175, 80, 0.4)'
          }}>
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(198, 40, 40, 0.2)',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '14px',
            border: '1px solid rgba(198, 40, 40, 0.4)'
          }}>
            {error}
          </div>
        )}

        {/* Profile Information Section */}
        <div style={{
          backgroundColor: 'transparent',
          borderRadius: '8px',
          padding: '0',
          marginBottom: '40px'
        }}>
          <h2 style={{
            color: '#ffffff',
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <User size={20} />
            Profile Information
          </h2>

          <form onSubmit={handleSave}>
            {/* Profile Picture */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Profile Picture URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={formData.profile_picture_url}
                onChange={(e) => setFormData({ ...formData, profile_picture_url: e.target.value })}
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
              {formData.profile_picture_url && (
                <div style={{ marginTop: '12px' }}>
                  <img
                    src={formData.profile_picture_url}
                    alt="Preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Bio
              </label>
              <textarea
                placeholder="Tell us about yourself..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                maxLength={255}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  fontSize: '16px',
                  minHeight: '100px',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  outline: 'none',
                  resize: 'vertical'
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
              <p style={{
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.6)',
                marginTop: '8px',
                marginBottom: 0
              }}>
                {formData.bio.length}/255 characters
              </p>
            </div>

            {/* Save Button */}
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ADD8E6',
                color: '#0F0F0F',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!saving) {
                  e.currentTarget.style.backgroundColor = '#87CEEB';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ADD8E6';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Account Information Section */}
        <div style={{
          backgroundColor: 'transparent',
          borderRadius: '8px',
          padding: '0',
          marginBottom: '40px'
        }}>
          <h2 style={{
            color: '#ffffff',
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Mail size={20} />
            Account Information
          </h2>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px'
              }}>
                Username
              </label>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '16px'
              }}>
                {user.username}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px'
              }}>
                Email
              </label>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontSize: '16px'
              }}>
                {user.email}
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px'
              }}>
                Member Since
              </label>
              <div style={{
                padding: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '4px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '14px'
              }}>
                {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Section */}
        <div style={{
          backgroundColor: 'transparent',
          borderRadius: '8px',
          padding: '0',
          marginBottom: '40px'
        }}>
          <h2 style={{
            color: '#ffffff',
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Lock size={20} />
            Change Password
          </h2>

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Current Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
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
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
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
                  {showPasswords.current ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
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
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  placeholder="Enter new password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
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
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
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
                  {showPasswords.new ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
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
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
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
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
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
                  {showPasswords.confirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword}
              style={{
                padding: '12px 24px',
                backgroundColor: '#ADD8E6',
                color: '#0F0F0F',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: changingPassword ? 'not-allowed' : 'pointer',
                opacity: changingPassword ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!changingPassword) {
                  e.currentTarget.style.backgroundColor = '#87CEEB';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ADD8E6';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Lock size={18} />
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>

        {/* Notification Preferences Section */}
        <div style={{
          backgroundColor: 'transparent',
          borderRadius: '8px',
          padding: '0',
          marginBottom: '40px'
        }}>
          <h2 style={{
            color: '#ffffff',
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Bell size={20} />
            Notification Preferences
          </h2>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div>
              <h3 style={{
                color: '#ffffff',
                margin: 0,
                marginBottom: '4px',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                Enable Notifications
              </h3>
              <p style={{
                color: 'rgba(255, 255, 255, 0.7)',
                margin: 0,
                fontSize: '14px'
              }}>
                Receive notifications when users you follow share videos or when someone follows you
              </p>
            </div>
            <button
              onClick={handleToggleNotifications}
              style={{
                padding: '10px 20px',
                backgroundColor: notificationPreferences.enabled ? '#ADD8E6' : 'transparent',
                color: notificationPreferences.enabled ? '#0F0F0F' : '#ffffff',
                border: notificationPreferences.enabled ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                if (!notificationPreferences.enabled) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                } else {
                  e.currentTarget.style.backgroundColor = '#87CEEB';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = notificationPreferences.enabled ? '#ADD8E6' : 'transparent';
              }}
            >
              <Bell size={16} />
              {notificationPreferences.enabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{
          backgroundColor: 'transparent',
          borderRadius: '8px',
          padding: '0',
          marginBottom: '40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '40px'
        }}>
          <h2 style={{
            color: '#ff6b6b',
            marginBottom: '24px',
            fontSize: '20px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Trash2 size={20} />
            Danger Zone
          </h2>

          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(255, 107, 107, 0.3)'
          }}>
            <h3 style={{
              color: '#ffffff',
              margin: 0,
              marginBottom: '8px',
              fontSize: '16px',
              fontWeight: '500'
            }}>
              Delete Account
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.7)',
              margin: 0,
              marginBottom: '16px',
              fontSize: '14px'
            }}>
              Once you delete your account, there is no going back. This will permanently delete your account, videos, comments, and all associated data.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#ff6b6b',
                  border: '1px solid #ff6b6b',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Delete Account
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <p style={{
                  color: '#ffffff',
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  Are you sure? This cannot be undone.
                </p>
                <button
                  onClick={handleDeleteAccount}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#ff6b6b',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff5252';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff6b6b';
                  }}
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Logout Button */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '40px',
          paddingTop: '40px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <button
            onClick={() => {
              logout();
              navigate('/', { replace: true });
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
