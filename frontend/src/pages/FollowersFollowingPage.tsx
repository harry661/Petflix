import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { UserPlus, UserMinus } from 'lucide-react';
import ProfilePicture from '../components/ProfilePicture';

import { API_URL } from '../config/api';

export default function FollowersFollowingPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user: currentUser } = useAuth();
  
  // Determine active tab from URL path
  const getActiveTabFromPath = (): 'followers' | 'following' => {
    if (location.pathname.includes('/following')) return 'following';
    return 'followers';
  };
  
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>(getActiveTabFromPath());
  const [users, setUsers] = useState<any[]>([]);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followStatuses, setFollowStatuses] = useState<{ [userId: string]: boolean }>({});
  const [isCurrentUserProfile, setIsCurrentUserProfile] = useState(false);

  useEffect(() => {
    const newTab = getActiveTabFromPath();
    if (newTab !== activeTab) {
      setActiveTab(newTab);
    }
  }, [location.pathname, activeTab]);

  useEffect(() => {
    if (username) {
      loadProfileUser();
    }
  }, [username]);

  useEffect(() => {
    if (profileUser && activeTab) {
      loadUsers();
    }
  }, [profileUser, activeTab]);

  const loadProfileUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/users/search?username=${encodeURIComponent(username || '')}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.users?.[0];
        if (userData) {
          setProfileUser(userData);
          // Check if viewing own profile
          if (isAuthenticated && currentUser) {
            setIsCurrentUserProfile(currentUser.username === username);
          }
        } else {
          setError('User not found');
        }
      } else {
        setError('Failed to load user profile');
      }
    } catch (err: any) {
      setError('Failed to load user profile');
    }
  };

  const loadUsers = async () => {
    if (!profileUser) return;

    try {
      setLoading(true);
      setError('');

      const endpoint = activeTab === 'followers' ? 'followers' : 'following';
      const response = await fetch(`${API_URL}/api/v1/users/${profileUser.id}/${endpoint}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);

        // Load follow statuses for each user (if logged in and not viewing own profile)
        if (isAuthenticated && currentUser && !isCurrentUserProfile) {
          const token = localStorage.getItem('auth_token');
          if (token) {
            const statusPromises = (data.users || []).map(async (user: any) => {
              try {
                const statusRes = await fetch(`${API_URL}/api/v1/users/${user.id}/follow-status`, {
                  headers: { 'Authorization': `Bearer ${token}` },
                  credentials: 'include',
                });
                if (statusRes.ok) {
                  const status = await statusRes.json();
                  return { userId: user.id, isFollowing: status.isFollowing };
                }
              } catch (err) {
                // Ignore errors
              }
              return { userId: user.id, isFollowing: false };
            });

            const statuses = await Promise.all(statusPromises);
            const statusMap: { [userId: string]: boolean } = {};
            statuses.forEach(({ userId, isFollowing }) => {
              statusMap[userId] = isFollowing;
            });
            setFollowStatuses(statusMap);
          }
        }
      } else {
        setError('Failed to load users');
      }
    } catch (err: any) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId: string, currentlyFollowing: boolean) => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const endpoint = currentlyFollowing ? 'unfollow' : 'follow';
      const method = currentlyFollowing ? 'DELETE' : 'POST';

      const response = await fetch(`${API_URL}/api/v1/users/${userId}/${endpoint}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        // Update follow status
        setFollowStatuses(prev => ({
          ...prev,
          [userId]: !currentlyFollowing
        }));
        // Reload users to update counts
        loadUsers();
      }
    } catch (err) {
      // Error handling
    }
  };

  const handleTabChange = (tab: 'followers' | 'following') => {
    setActiveTab(tab);
    navigate(`/user/${username}/${tab}`, { replace: true });
  };

  if (loading && !profileUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0F0F0F', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ffffff' }}>Loading...</p>
      </div>
    );
  }

  if (error && !profileUser) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0F0F0F', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#c62828' }}>{error}</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media (min-width: 1200px) {
          .page-content-container {
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
        padding: '40px'
      }}>
      <div className="page-content-container" style={{
        maxWidth: '100%',
        margin: '0 auto',
        padding: '0 40px'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '30px' }}>
          <Link
            to={`/user/${username}`}
            style={{
              color: '#ADD8E6',
              textDecoration: 'none',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'inline-block'
            }}
            onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
          >
            ← Back to {profileUser?.username || 'Profile'}
          </Link>
          <h1 style={{ color: '#ffffff', marginTop: '10px', marginBottom: '30px' }}>
            {profileUser?.username || 'User'}'s {activeTab === 'followers' ? 'Followers' : 'Following'}
          </h1>

          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: '0',
            borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
            marginBottom: '30px'
          }}>
            <button
              onClick={() => handleTabChange('following')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: activeTab === 'following' ? '#ADD8E6' : 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                borderBottom: activeTab === 'following' ? '2px solid #ADD8E6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'following' ? '600' : '400',
                marginBottom: '-2px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'following') {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'following') {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }
              }}
            >
              Following
            </button>
            <button
              onClick={() => handleTabChange('followers')}
              style={{
                padding: '12px 24px',
                backgroundColor: 'transparent',
                color: activeTab === 'followers' ? '#ADD8E6' : 'rgba(255, 255, 255, 0.6)',
                border: 'none',
                borderBottom: activeTab === 'followers' ? '2px solid #ADD8E6' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'followers' ? '600' : '400',
                marginBottom: '-2px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'followers') {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'followers') {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)';
                }
              }}
            >
              Followers
            </button>
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#ffffff' }}>Loading...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#c62828' }}>{error}</p>
          </div>
        ) : users.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px'
          }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              No {activeTab === 'followers' ? 'followers' : 'following'} yet
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {users.map((user) => {
              const isFollowing = followStatuses[user.id] || false;
              const isOwnProfile = isAuthenticated && currentUser?.id === user.id;

              return (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '8px',
                    transition: 'background-color 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#252525'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1a1a1a'}
                >
                  <Link
                    to={`/user/${user.username}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      textDecoration: 'none',
                      flex: 1,
                      minWidth: 0
                    }}
                  >
                    {/* Profile Picture */}
                    <ProfilePicture
                      src={user.profile_picture_url}
                      alt={user.username}
                      size={56}
                      fallbackChar={user.username?.charAt(0).toUpperCase() || 'U'}
                      style={{ flexShrink: 0 }}
                    />

                    {/* User Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h3 style={{
                        color: '#ffffff',
                        margin: 0,
                        fontSize: '16px',
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {user.username}
                      </h3>
                      {user.bio && (
                        <p style={{
                          color: 'rgba(255, 255, 255, 0.7)',
                          margin: 0,
                          fontSize: '14px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Follow Button (only show if not own profile and logged in) */}
                  {!isOwnProfile && isAuthenticated && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleFollow(user.id, isFollowing);
                      }}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: isFollowing ? 'transparent' : '#ADD8E6',
                        color: isFollowing ? '#ffffff' : '#0F0F0F',
                        border: isFollowing ? '1px solid #ffffff' : 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        if (isFollowing) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        } else {
                          e.currentTarget.style.backgroundColor = '#87CEEB';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isFollowing ? 'transparent' : '#ADD8E6';
                      }}
                    >
                      {isFollowing ? (
                        <>
                          <UserMinus size={16} />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus size={16} />
                          Follow
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
    </>
  );
}

