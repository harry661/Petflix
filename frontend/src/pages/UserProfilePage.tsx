import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    if (username) {
      loadUserProfile();
    }
  }, [username]);

  const loadUserProfile = async () => {
    try {
      // Get current user to check if viewing own profile
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const currentUserRes = await fetch(`${API_URL}/api/v1/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (currentUserRes.ok) {
            const currentUser = await currentUserRes.json();
            setIsCurrentUser(currentUser.username === username);
          }
        } catch (err) {
          // Not logged in or error
        }
      }

      // Search for user by username (we'll need to implement this endpoint)
      // For now, we'll need to get user ID first
      const response = await fetch(`${API_URL}/api/v1/users/search?username=${username}`);
      let userData;
      
      if (response.ok) {
        const data = await response.json();
        userData = data.users?.[0];
      }

      if (!userData) {
        setError('User not found');
        setLoading(false);
        return;
      }

      setUser(userData);

      // Load user's videos
      const videosRes = await fetch(`${API_URL}/api/v1/videos/user/${userData.id}`);
      if (videosRes.ok) {
        const videosData = await videosRes.json();
        setVideos(videosData.videos || []);
      }

      // Load followers
      const followersRes = await fetch(`${API_URL}/api/v1/users/${userData.id}/followers`);
      if (followersRes.ok) {
        const followersData = await followersRes.json();
        setFollowers(followersData.users || []);
      }

      // Load following
      const followingRes = await fetch(`${API_URL}/api/v1/users/${userData.id}/following`);
      if (followingRes.ok) {
        const followingData = await followingRes.json();
        setFollowing(followingData.users || []);
      }

      // Check follow status
      if (token && !isCurrentUser) {
        const followStatusRes = await fetch(`${API_URL}/api/v1/users/${userData.id}/follow-status`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (followStatusRes.ok) {
          const status = await followStatusRes.json();
          setIsFollowing(status.isFollowing);
        }
      }
    } catch (err: any) {
      setError('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      const method = isFollowing ? 'DELETE' : 'POST';
      
      const response = await fetch(`${API_URL}/api/v1/users/${user?.id}/${endpoint}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setIsFollowing(!isFollowing);
        loadUserProfile(); // Reload to update counts
      }
    } catch (err) {
      alert('Failed to update follow status');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F0F0DC', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#666' }}>Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F0F0DC', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#c62828' }}>{error || 'User not found'}</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F0F0DC',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Profile Header */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '40px',
          marginBottom: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px', marginBottom: '20px' }}>
            {user.profile_picture_url ? (
              <img
                src={user.profile_picture_url}
                alt={user.username}
                style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                backgroundColor: '#ADD8E6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                color: '#36454F'
              }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ color: '#36454F', marginTop: 0, marginBottom: '10px' }}>
                {user.username}
              </h1>
              {user.bio && (
                <p style={{ color: '#666', marginBottom: '20px' }}>{user.bio}</p>
              )}
              <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
                <div>
                  <strong style={{ color: '#36454F' }}>{followers.length}</strong>
                  <span style={{ color: '#666', marginLeft: '5px' }}>Followers</span>
                </div>
                <div>
                  <strong style={{ color: '#36454F' }}>{following.length}</strong>
                  <span style={{ color: '#666', marginLeft: '5px' }}>Following</span>
                </div>
                <div>
                  <strong style={{ color: '#36454F' }}>{videos.length}</strong>
                  <span style={{ color: '#666', marginLeft: '5px' }}>Videos</span>
                </div>
              </div>
              {!isCurrentUser && (
                <button
                  onClick={handleFollow}
                  style={{
                    padding: '10px 30px',
                    backgroundColor: isFollowing ? '#f0f0f0' : '#ADD8E6',
                    color: '#36454F',
                    border: isFollowing ? '1px solid #ccc' : 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
              )}
              {isCurrentUser && (
                <button
                  onClick={() => navigate('/settings')}
                  style={{
                    padding: '10px 30px',
                    backgroundColor: '#ADD8E6',
                    color: '#36454F',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* User's Videos */}
        <div>
          <h2 style={{ color: '#36454F', marginBottom: '20px' }}>Shared Videos</h2>
          {videos.length === 0 ? (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#666' }}>No videos shared yet</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {videos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/video/${video.id}`)}
                >
                  {video.thumbnail && (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '15px' }}>
                    <h3 style={{ color: '#36454F', marginTop: 0, fontSize: '16px' }}>
                      {video.title}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
