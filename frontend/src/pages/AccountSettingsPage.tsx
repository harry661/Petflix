import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Save, LogOut, User, Mail, Lock, Bell, Trash2, Eye, EyeOff, Camera, Edit, X } from 'lucide-react';
import ProfilePicture from '../components/ProfilePicture';

import { API_URL } from '../config/api';

type TabType = 'profile' | 'security';

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user: authUser, loading: authLoading, logout, refreshUser } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [formData, setFormData] = useState({
    profile_picture_url: '',
    bio: '',
  });
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
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
  const [pushSubscriptionStatus, setPushSubscriptionStatus] = useState<{
    subscribed: boolean;
    subscriptionCount: number;
    supported: boolean;
  }>({
    subscribed: false,
    subscriptionCount: 0,
    supported: false,
  });
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    
    // Don't reload if we just saved - use the data from the save response
    if (!justSaved) {
      loadUser();
    }
    checkPushSupport();
    if (isAuthenticated) {
      loadPushSubscriptionStatus();
      loadNotificationPreferences();
    }
  }, [isAuthenticated, authLoading, navigate, justSaved]);

  const loadUser = async () => {
    // Use context's refreshUser to get fresh data and update cache
    const userData = await refreshUser();
    if (userData) {
      setUser(userData);
      setFormData({
        profile_picture_url: userData.profile_picture_url || '',
        bio: userData.bio || '',
      });
      loadNotificationPreferences();
    }
    setLoading(false);
  };

  const checkPushSupport = () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setPushSubscriptionStatus(prev => ({ ...prev, supported }));
  };

  const loadPushSubscriptionStatus = async () => {
    if (!isAuthenticated) return;
    
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/push_notifications/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPushSubscriptionStatus(prev => ({
          ...prev,
          subscribed: data.subscribed,
          subscriptionCount: data.subscriptionCount || 0,
        }));
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleSubscribeToPush = async () => {
    if (!pushSubscriptionStatus.supported) {
      alert('Push notifications are not supported in your browser.');
      return;
    }

    setSubscribing(true);
    setError('');
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setSubscribing(false);
      return;
    }

    try {
      // Get VAPID public key
      const keyResponse = await fetch(`${API_URL}/api/v1/push_notifications/vapid-key`);
      if (!keyResponse.ok) {
        alert('Push notifications are not configured on the server.');
        setSubscribing(false);
        return;
      }
      const { publicKey } = await keyResponse.json();

      // Convert base64url to Uint8Array
      const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
          .replace(/\-/g, '+')
          .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      };

      // Request notification permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Notification permission denied.');
        setSubscribing(false);
        return;
      }

      // Register service worker
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      // Convert keys to base64
      const p256dh = subscription.getKey('p256dh');
      const auth = subscription.getKey('auth');
      
      if (!p256dh || !auth) {
        throw new Error('Failed to get subscription keys');
      }

      // Send subscription to backend
      const response = await fetch(`${API_URL}/api/v1/push_notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
            auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
          },
        }),
      });

      if (response.ok) {
        await loadPushSubscriptionStatus();
        setSuccess('Successfully subscribed to push notifications!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to subscribe to push notifications');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe to push notifications');
    } finally {
      setSubscribing(false);
    }
  };

  const handleUnsubscribeFromPush = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setSubscribing(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/api/v1/push_notifications`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Unsubscribe from service worker
        try {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await subscription.unsubscribe();
          }
        } catch (swErr) {
          // Service worker unsubscribe failed, but backend unsubscribe succeeded
        }

        await loadPushSubscriptionStatus();
        setSuccess('Successfully unsubscribed from push notifications');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to unsubscribe from push notifications');
      }
    } catch (err) {
      setError('Failed to unsubscribe from push notifications');
    } finally {
      setSubscribing(false);
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

  const handleSaveProfile = async () => {
    await handleSaveProfileWithData(formData);
  };

  const handleSaveProfileWithData = async (dataToSave: { profile_picture_url: string; bio: string }) => {
    setError('');
    setSuccess('');
    setSaving(true);

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          profile_picture_url: dataToSave.profile_picture_url?.trim() || null,
          bio: dataToSave.bio || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update local state with the saved data
        setUser(data);
        // Update formData to match the saved data
        setFormData({
          profile_picture_url: data.profile_picture_url || '',
          bio: data.bio || '',
        });
        setSuccess('Profile updated successfully!');
        // Prevent reloading user data immediately after save
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1000); // Allow reloads after 1 second
        // Refresh context cache with new data
        await refreshUser();
        setTimeout(() => setSuccess(''), 3000);
        setEditingField(null);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEditField = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValues({ ...editValues, [field]: currentValue });
    if (field === 'profile_picture_url') {
      setPreviewUrl(null);
      setSelectedFile(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProfilePicture = async () => {
    if (!selectedFile) {
      setError('Please select an image file.');
      return;
    }

    setUploadingPicture(true);
    setError('');

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required');
        setUploadingPicture(false);
        return;
      }

      const formData = new FormData();
      formData.append('profilePicture', selectedFile);

      const response = await fetch(`${API_URL}/api/v1/users/me/profile-picture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to upload profile picture');
        setUploadingPicture(false);
        return;
      }

      // Update user data with new profile picture URL
      setUser((prev: any) => ({
        ...prev,
        profile_picture_url: data.profile_picture_url,
      }));
      setFormData((prev) => ({
        ...prev,
        profile_picture_url: data.profile_picture_url || '',
      }));

      // Update auth context if available
      window.dispatchEvent(new Event('auth-changed'));

      setSuccess('Profile picture uploaded successfully!');
      setEditingField(null);
      setPreviewUrl(null);
      setSelectedFile(null);
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setError('Failed to upload profile picture. Please try again.');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValues({});
  };

  const validateUrl = (url: string): { valid: boolean; error?: string; warning?: string } => {
    if (!url || url.trim() === '') return { valid: true }; // Empty is valid (will be null)
    
    try {
      const urlObj = new URL(url.trim());
      
      // Check if it's http or https
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        return { valid: false, error: 'URL must start with http:// or https://' };
      }
      
      // Check for common non-image URLs (search pages, HTML pages)
      const pathname = urlObj.pathname.toLowerCase();
      const hostname = urlObj.hostname.toLowerCase();
      
      // Detect Unsplash Plus premium URLs (may require authentication)
      if (hostname.includes('plus.unsplash.com')) {
        return { 
          valid: false, 
          error: 'Unsplash Plus URLs may not work as direct image links. Try using a regular Unsplash image: 1) Go to unsplash.com, 2) Search for your image, 3) Click on it, 4) Right-click the image and select "Copy image address" to get a URL starting with images.unsplash.com' 
        };
      }
      
      // Detect Unsplash search pages
      if (hostname.includes('unsplash.com') && pathname.includes('/s/')) {
        return { 
          valid: false, 
          error: 'This is a search page, not an image. Right-click on an image and select "Copy image address" to get the direct image URL.' 
        };
      }
      
      // Detect other common search/HTML pages
      if (pathname.includes('/search') || pathname.includes('/s/') || pathname.includes('/photos/') && !pathname.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        return { 
          valid: false, 
          error: 'This appears to be a search or gallery page, not a direct image URL. Please use a direct link to an image file.' 
        };
      }
      
      // Check for common image file extensions (optional but helpful)
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      const hasImageExtension = imageExtensions.some(ext => pathname.endsWith(ext));
      
      // Warn about CDN URLs that might have hotlink protection
      const cdnDomains = ['supertails.com', 'shopify.com', 'cdn.shopify.com'];
      if (cdnDomains.some(domain => hostname.includes(domain))) {
        return {
          valid: true, // Allow it, but it might not work due to hotlink protection
          warning: 'This CDN URL may have hotlink protection and might not display. Consider using an image hosting service like imgur.com, imgbb.com, or postimg.cc that allows hotlinking.'
        };
      }
      
      // If it doesn't have an image extension, warn but don't block (some CDNs use query params)
      if (!hasImageExtension && !urlObj.search) {
        // This is just a warning, not an error - some image URLs don't have extensions
      }
      
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid URL format' };
    }
  };

  const handleSaveField = async (field: string) => {
    setError('');
    setSuccess('');
    
    if (field === 'profile_picture_url') {
      const urlValue = editValues[field] || '';
      
      // Validate URL if provided
      if (urlValue.trim()) {
        const validation = validateUrl(urlValue.trim());
        if (!validation.valid) {
          setError(validation.error || 'Please enter a valid image URL');
          return;
        }
        
        // Show warning if URL might have issues but don't block
        if (validation.warning) {
          setError(validation.warning);
          // Still allow saving, but user is warned
        }
      }
      
      // Update formData and save
      const updatedFormData = { ...formData, profile_picture_url: urlValue.trim() || '' };
      setFormData(updatedFormData);
      await handleSaveProfileWithData(updatedFormData);
    } else if (field === 'bio') {
      const bioValue = editValues[field] || '';
      
      // Update formData and save with the new bio value
      const updatedFormData = { ...formData, bio: bioValue };
      setFormData(updatedFormData);
      await handleSaveProfileWithData(updatedFormData);
    } else if (field === 'username' || field === 'email') {
      // Handle username and email updates
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const value = editValues[field] || '';
      
      // Basic validation
      if (!value.trim()) {
        setError(`${field === 'username' ? 'Username' : 'Email'} cannot be empty`);
        return;
      }

      if (field === 'email') {
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) {
          setError('Please enter a valid email address');
          return;
        }
      }

      if (field === 'username') {
        // Username validation
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(value.trim())) {
          setError('Username must be 3-20 characters and contain only letters, numbers, and underscores');
          return;
        }
      }

      setSaving(true);

      try {
        const response = await fetch(`${API_URL}/api/v1/users/me`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            [field]: value.trim(),
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Update local user state
          setUser((prev: any) => ({
            ...prev,
            [field]: data[field],
          }));
          setSuccess(`${field === 'username' ? 'Username' : 'Email'} updated successfully! An email confirmation has been sent.`);
          setTimeout(() => setSuccess(''), 5000);
          setEditingField(null);
          setEditValues({});
          // Refresh context cache with new data
          await refreshUser();
        } else {
          setError(data.error || `Failed to update ${field}`);
        }
      } catch (err: any) {
        setError(`Failed to update ${field}. Please try again.`);
      } finally {
        setSaving(false);
      }
    } else {
      setEditingField(null);
      setEditValues({});
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

    const newState = !notificationPreferences.enabled;
    setSubscribing(true);
    setError('');

    try {
      // Update global notification preference
      const prefResponse = await fetch(`${API_URL}/api/v1/users/me/notification-preference`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled: newState }),
      });

      if (!prefResponse.ok) {
        const errorData = await prefResponse.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update notification preferences');
      }

      const prefData = await prefResponse.json();
      setNotificationPreferences({ enabled: prefData.notificationsEnabled });

      // If enabling and push is supported, subscribe to push notifications
      if (newState && pushSubscriptionStatus.supported && !pushSubscriptionStatus.subscribed) {
        try {
          // Get VAPID public key
          const keyResponse = await fetch(`${API_URL}/api/v1/push_notifications/vapid-key`);
          if (keyResponse.ok) {
            const { publicKey } = await keyResponse.json();

            // Convert base64url to Uint8Array
            const urlBase64ToUint8Array = (base64String: string) => {
              const padding = '='.repeat((4 - base64String.length % 4) % 4);
              const base64 = (base64String + padding)
                .replace(/\-/g, '+')
                .replace(/_/g, '/');
              const rawData = window.atob(base64);
              const outputArray = new Uint8Array(rawData.length);
              for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
              }
              return outputArray;
            };

            const applicationServerKey = urlBase64ToUint8Array(publicKey);

            // Request notification permission
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
              throw new Error('Notification permission denied');
            }

            // Get service worker registration
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey,
            });

            const p256dh = subscription.getKey('p256dh');
            const auth = subscription.getKey('auth');
            
            if (!p256dh || !auth) {
              throw new Error('Failed to get subscription keys');
            }

            // Send subscription to backend
            const pushResponse = await fetch(`${API_URL}/api/v1/push_notifications`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({
                endpoint: subscription.endpoint,
                keys: {
                  p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
                  auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
                },
              }),
            });

            if (pushResponse.ok) {
              await loadPushSubscriptionStatus();
            }
          }
        } catch (pushErr: any) {
          // Push subscription failed, but global preference was updated
          console.error('Failed to subscribe to push notifications:', pushErr);
        }
      }

      // If disabling, unsubscribe from push notifications
      if (!newState && pushSubscriptionStatus.subscribed) {
        try {
          const unsubscribeResponse = await fetch(`${API_URL}/api/v1/push_notifications`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (unsubscribeResponse.ok) {
            // Unsubscribe from service worker
            try {
              const registration = await navigator.serviceWorker.ready;
              const subscription = await registration.pushManager.getSubscription();
              if (subscription) {
                await subscription.unsubscribe();
              }
            } catch (swErr) {
              // Service worker unsubscribe failed, but backend unsubscribe succeeded
            }

            await loadPushSubscriptionStatus();
          }
        } catch (unsubErr) {
          // Unsubscribe failed, but global preference was updated
          console.error('Failed to unsubscribe from push notifications:', unsubErr);
        }
      }

      setSuccess(`Notifications ${newState ? 'enabled' : 'disabled'}`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update notifications');
    } finally {
      setSubscribing(false);
    }
  };

  const handleDeleteAccount = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
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

  const renderField = (label: string, field: string, value: string, type: 'text' | 'textarea' = 'text') => {
    const isEditing = editingField === field;
    
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            {label}
          </label>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              {type === 'textarea' ? (
                <textarea
                  value={editValues[field] !== undefined ? editValues[field] : value}
                  onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                  maxLength={255}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    minHeight: '80px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    outline: 'none',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                  autoFocus
                />
              ) : (
                <input
                  type="text"
                  value={editValues[field] !== undefined ? editValues[field] : value}
                  onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                  style={{
                    flex: 1,
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#fff',
                    outline: 'none'
                  }}
                  autoFocus
                />
              )}
              <button
                type="button"
                onClick={() => handleSaveField(field)}
                disabled={saving}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ADD8E6',
                  color: '#0F0F0F',
                  border: 'none',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.6 : 1
                }}
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                style={{
                  padding: '8px 16px',
                  backgroundColor: 'transparent',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div style={{
              color: '#ffffff',
              fontSize: '16px',
              minHeight: '24px'
            }}>
              {value || <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Not set</span>}
            </div>
          )}
        </div>
        {!isEditing && (
          <button
            onClick={() => handleEditField(field, value)}
            style={{
              marginLeft: '20px',
              padding: '8px 16px',
              backgroundColor: 'transparent',
              color: '#ADD8E6',
              border: '1px solid #ADD8E6',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(173, 216, 230, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Edit size={14} />
            Edit
          </button>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @media (min-width: 1200px) {
          .settings-container {
            max-width: 90vw !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 40px !important;
            padding-right: 40px !important;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        padding: '40px 0'
      }}>
        <div className="settings-container" style={{
          maxWidth: '100%',
          margin: '0 auto',
          padding: '0 40px'
        }}>
          <h1 style={{
            color: '#ffffff',
            marginBottom: '32px',
            fontSize: '32px',
            fontWeight: '600'
          }}>
            Settings
          </h1>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '32px',
            borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '32px'
          }}>
            <button
              onClick={() => setActiveTab('profile')}
              style={{
                padding: '12px 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: activeTab === 'profile' ? '#ADD8E6' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px',
                fontWeight: activeTab === 'profile' ? '600' : '400',
                cursor: 'pointer',
                borderBottom: activeTab === 'profile' ? '2px solid #ADD8E6' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s ease'
              }}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('security')}
              style={{
                padding: '12px 0',
                backgroundColor: 'transparent',
                border: 'none',
                color: activeTab === 'security' ? '#ADD8E6' : 'rgba(255, 255, 255, 0.7)',
                fontSize: '16px',
                fontWeight: activeTab === 'security' ? '600' : '400',
                cursor: 'pointer',
                borderBottom: activeTab === 'security' ? '2px solid #ADD8E6' : '2px solid transparent',
                marginBottom: '-2px',
                transition: 'all 0.2s ease'
              }}
            >
              Login & Security
            </button>
          </div>

          {/* Success Message */}
          {success && (
            <div style={{
              backgroundColor: 'rgba(76, 175, 80, 0.2)',
              color: '#4CAF50',
              padding: '12px 16px',
              borderRadius: '6px',
              marginBottom: '24px',
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
              marginBottom: '24px',
              fontSize: '14px',
              border: '1px solid rgba(198, 40, 40, 0.4)'
            }}>
              {error}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              {/* Profile Picture */}
              <div style={{
                marginBottom: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{ position: 'relative' }}>
                  <ProfilePicture
                    src={previewUrl || user.profile_picture_url}
                    alt={user.username}
                    size={120}
                    style={{ border: '3px solid rgba(255, 255, 255, 0.2)' }}
                    fallbackChar={user.username.charAt(0).toUpperCase()}
                  />
                  {!editingField && (
                    <button
                      onClick={() => {
                        setEditingField('profile_picture_url');
                        setPreviewUrl(null);
                        setSelectedFile(null);
                      }}
                      style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '0',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#ADD8E6',
                        color: '#0F0F0F',
                        border: '3px solid #0F0F0F',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#87CEEB';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#ADD8E6';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Camera size={18} />
                    </button>
                  )}
                </div>
                {editingField === 'profile_picture_url' && (
                  <div style={{
                    width: '100%',
                    maxWidth: '500px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <label
                        htmlFor="profile-picture-upload"
                        style={{
                          display: 'inline-block',
                          padding: '12px 20px',
                          backgroundColor: 'rgba(173, 216, 230, 0.2)',
                          color: '#ADD8E6',
                          border: '2px dashed rgba(173, 216, 230, 0.5)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          fontSize: '14px',
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(173, 216, 230, 0.3)';
                          e.currentTarget.style.borderColor = '#ADD8E6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(173, 216, 230, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(173, 216, 230, 0.5)';
                        }}
                      >
                        {selectedFile ? `Selected: ${selectedFile.name}` : 'Choose Image File'}
                      </label>
                      <input
                        id="profile-picture-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                        onChange={handleFileSelect}
                        style={{ display: 'none' }}
                      />
                      {selectedFile && (
                        <p style={{
                          margin: 0,
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.7)',
                          textAlign: 'center'
                        }}>
                          File size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      )}
                      <p style={{
                        margin: 0,
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontStyle: 'italic',
                        lineHeight: '1.4',
                        textAlign: 'center'
                      }}>
                        Supported formats: JPEG, PNG, GIF, WebP (max 5MB)
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={handleUploadProfilePicture}
                        disabled={uploadingPicture || !selectedFile}
                        style={{
                          padding: '12px 20px',
                          backgroundColor: '#ADD8E6',
                          color: '#0F0F0F',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: (uploadingPicture || !selectedFile) ? 'not-allowed' : 'pointer',
                          opacity: (uploadingPicture || !selectedFile) ? 0.6 : 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {uploadingPicture ? 'Uploading...' : 'Upload'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingField(null);
                          setPreviewUrl(null);
                          setSelectedFile(null);
                          setError('');
                        }}
                        disabled={uploadingPicture}
                        style={{
                          padding: '12px 20px',
                          backgroundColor: 'transparent',
                          color: '#fff',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: uploadingPicture ? 'not-allowed' : 'pointer',
                          opacity: uploadingPicture ? 0.6 : 1,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio Field */}
              {renderField('About', 'bio', formData.bio || '', 'textarea')}

              {/* Personal Info Section */}
              <div style={{
                marginTop: '40px',
                paddingTop: '40px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <h2 style={{
                  color: '#ffffff',
                  marginBottom: '24px',
                  fontSize: '20px',
                  fontWeight: '600'
                }}>
                  Personal Info
                </h2>
                {renderField('Name', 'username', user.username)}
                {renderField('Email', 'email', user.email)}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 0',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <div style={{ flex: 1 }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      Member Since
                    </label>
                    <div style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '16px'
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
            </div>
          )}

          {/* Login & Security Tab */}
          {activeTab === 'security' && (
            <div>
              {/* Change Password Section */}
              <div style={{ marginBottom: '40px' }}>
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
                        autoComplete="current-password"
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
                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
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
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}
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
                        autoComplete="new-password"
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
                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
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
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}
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
                        autoComplete="new-password"
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
                          e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
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
                          color: 'rgba(255, 255, 255, 0.7)'
                        }}
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
                      gap: '8px'
                    }}
                  >
                    <Lock size={18} />
                    {changingPassword ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>

              {/* Notifications */}
              <div style={{ marginBottom: '40px' }}>
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
                  Notifications
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
                      {pushSubscriptionStatus.supported
                        ? notificationPreferences.enabled && pushSubscriptionStatus.subscribed
                          ? `Receive notifications when users you follow share videos (Push enabled on ${pushSubscriptionStatus.subscriptionCount} device${pushSubscriptionStatus.subscriptionCount !== 1 ? 's' : ''})`
                          : 'Receive notifications when users you follow share videos'
                        : 'Receive notifications when users you follow share videos'}
                    </p>
                  </div>
                  <button
                    onClick={handleToggleNotifications}
                    disabled={subscribing}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: notificationPreferences.enabled ? '#ADD8E6' : 'transparent',
                      color: notificationPreferences.enabled ? '#0F0F0F' : '#ffffff',
                      border: notificationPreferences.enabled ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      cursor: subscribing ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: subscribing ? 0.6 : 1
                    }}
                  >
                    {subscribing
                      ? 'Processing...'
                      : notificationPreferences.enabled
                      ? 'Enabled'
                      : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div style={{
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
                    Once you delete your account, there is no going back. This will permanently delete your account and all associated data.
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
                          cursor: 'pointer'
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
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Logout */}
              <div style={{
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
          )}
        </div>
      </div>
    </>
  );
}
