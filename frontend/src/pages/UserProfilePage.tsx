import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, Pencil } from 'lucide-react';
import VideoCard from '../components/VideoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Utility function to extract YouTube video ID from URL (supports regular videos and Shorts)
const extractYouTubeVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
};

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
  const [showShareForm, setShowShareForm] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  
  // Available tags for pet videos
  const availableTags = [
    'Dog', 'Dogs', 'Puppy', 'Puppies',
    'Cat', 'Cats', 'Kitten', 'Kittens',
    'Bird', 'Birds', 'Parrot', 'Cockatiel', 'Canary',
    'Hamster', 'Hamsters', 'Rabbit', 'Rabbits', 'Guinea Pig', 'Guinea Pigs',
    'Fish', 'Aquatic', 'Underwater', 'Marine',
    'Small Pets', 'Fluffy', 'Cute', 'Funny',
    'Training', 'Tricks', 'Playful', 'Adorable',
    'Rescue', 'Adoption', 'Pet Care', 'Pet Health'
  ];

  useEffect(() => {
    if (username) {
      loadUserProfile();
    }
  }, [username]);

  const loadUserProfile = async () => {
    try {
      setError('');
      
      // Get current user to check if viewing own profile
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const currentUserRes = await fetch(`${API_URL}/api/v1/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          });
          if (currentUserRes.ok) {
            const currentUser = await currentUserRes.json();
            setIsCurrentUser(currentUser.username === username);
          }
        } catch (err) {
          // Error fetching current user - continue anyway
          // Not logged in or error - continue anyway
        }
      }

      // Search for user by username
      let response;
      try {
        response = await fetch(`${API_URL}/api/v1/users/search?username=${encodeURIComponent(username || '')}`, {
          credentials: 'include',
        });
      } catch (err: any) {
        // Network error searching for user
        setError('Could not connect to the server. Please make sure the backend is running.');
        setLoading(false);
        return;
      }
      
      let userData;
      
      if (response.ok) {
        const data = await response.json();
        userData = data.users?.[0];
      } else {
        // Error response
        setError(`Failed to load user profile (${response.status})`);
        setLoading(false);
        return;
      }

      if (!userData) {
        setError('User not found');
        setLoading(false);
        return;
      }

      setUser(userData);

      // Load user's videos
      try {
        const videosRes = await fetch(`${API_URL}/api/v1/videos/user/${userData.id}`, {
          credentials: 'include',
        });
        if (videosRes.ok) {
          const videosData = await videosRes.json();
          setVideos(videosData.videos || []);
        }
      } catch (err) {
        // Error loading videos
      }

      // Load followers
      try {
        const followersRes = await fetch(`${API_URL}/api/v1/users/${userData.id}/followers`, {
          credentials: 'include',
        });
        if (followersRes.ok) {
          const followersData = await followersRes.json();
          setFollowers(followersData.users || []);
        }
      } catch (err) {
        // Error loading followers
      }

      // Load following
      try {
        const followingRes = await fetch(`${API_URL}/api/v1/users/${userData.id}/following`, {
          credentials: 'include',
        });
        if (followingRes.ok) {
          const followingData = await followingRes.json();
          setFollowing(followingData.users || []);
        }
      } catch (err) {
        // Error loading following
      }

      // Check follow status
      if (token && !isCurrentUser) {
        try {
          const followStatusRes = await fetch(`${API_URL}/api/v1/users/${userData.id}/follow-status`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          });
          if (followStatusRes.ok) {
            const status = await followStatusRes.json();
            setIsFollowing(status.isFollowing);
          }
        } catch (err) {
          // Error checking follow status
        }
      }
    } catch (err: any) {
      // Error loading user profile
      setError(err.message || 'Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/');
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

  const handleShareVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    setShareError('');
    
    if (!youtubeUrl.trim()) {
      setShareError('Please enter a YouTube URL');
      return;
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      setShareError('Invalid YouTube URL. Please use a valid YouTube link.');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/');
      return;
    }

    setSharing(true);
    try {
      // The backend will fetch video details from YouTube automatically
      const response = await fetch(`${API_URL}/api/v1/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          youtubeVideoId: videoId,
          title: '', // Backend will fetch from YouTube if empty
          description: '', // Backend will fetch from YouTube if empty
          tags: tags, // Include tags
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setYoutubeUrl('');
        setShowShareForm(false);
        setShareError('');
        // Reload videos to show the newly shared video
        loadUserProfile();
        alert('Video shared successfully!');
      } else {
        setShareError(data.error || 'Failed to share video');
      }
    } catch (err) {
      setShareError('Failed to share video. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0F0F0F', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ffffff' }}>Loading profile...</p>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0F0F0F', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#c62828' }}>{error || 'User not found'}</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F0F',
      padding: 0
    }}>
      <div style={{ 
        maxWidth: '100%',
        margin: '0 auto',
        padding: '0 40px'
      }}>
        {/* Profile Header */}
        <div style={{
          backgroundColor: 'transparent',
          borderRadius: '12px',
          padding: '40px 0',
          marginBottom: '30px'
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
                color: '#ffffff'
              }}>
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ flex: 1 }}>
              <h1 style={{ color: '#ffffff', marginTop: 0, marginBottom: '10px' }}>
                {user.username}
              </h1>
              {user.bio && (
                <p style={{ color: '#ffffff', marginBottom: '20px' }}>{user.bio}</p>
              )}
              <div style={{ display: 'flex', gap: '30px', marginBottom: '20px' }}>
                <div>
                  <strong style={{ color: '#ffffff' }}>{followers.length}</strong>
                  <span style={{ color: '#ffffff', marginLeft: '5px' }}>Followers</span>
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>{following.length}</strong>
                  <span style={{ color: '#ffffff', marginLeft: '5px' }}>Following</span>
                </div>
                <div>
                  <strong style={{ color: '#ffffff' }}>{videos.length}</strong>
                  <span style={{ color: '#ffffff', marginLeft: '5px' }}>Videos</span>
                </div>
              </div>
              {!isCurrentUser && (
                <button
                  onClick={handleFollow}
                  style={{
                    padding: '10px 30px',
                    backgroundColor: isFollowing ? '#f0f0f0' : '#ADD8E6',
                    color: '#ffffff',
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
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowShareForm(!showShareForm)}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#ADD8E6',
                      color: '#0F0F0F',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <Upload size={18} />
                    {showShareForm ? 'Cancel' : 'Share Video'}
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      border: '1px solid #ffffff',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Pencil size={18} />
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Share Video Form */}
        {isCurrentUser && showShareForm && (
          <div style={{
            backgroundColor: 'transparent',
            borderRadius: '12px',
            padding: '30px 0',
            marginBottom: '30px'
          }}>
            <h2 style={{ color: '#ffffff', marginTop: 0, marginBottom: '20px' }}>Share a YouTube Video</h2>
            <form onSubmit={handleShareVideo}>
              <div style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                {/* YouTube URL Field */}
                <div style={{ flex: 1, marginBottom: '15px' }}>
                  <label style={{ display: 'block', color: '#ffffff', marginBottom: '8px', fontWeight: 'bold' }}>
                    YouTube URL
                  </label>
                  <input
                    type="text"
                    value={youtubeUrl}
                    onChange={(e) => {
                      setYoutubeUrl(e.target.value);
                      setShareError('');
                    }}
                    placeholder="https://www.youtube.com/watch?v=..."
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
                    disabled={sharing}
                  />
                  {shareError && (
                    <p style={{ color: '#ff6b6b', marginTop: '8px', fontSize: '14px' }}>{shareError}</p>
                  )}
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px', fontSize: '14px' }}>
                    Paste a YouTube video URL to share it with the community
                  </p>
                </div>

                {/* Tags Input Field */}
                <div style={{ flex: 1, marginBottom: '15px', position: 'relative' }}>
                  <label style={{ display: 'block', color: '#ffffff', marginBottom: '8px', fontWeight: 'bold' }}>
                    Tags
                  </label>
                  <div style={{
                    width: '100%',
                    minHeight: '56px',
                    padding: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: 'flex-start'
                  }}
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={(e) => {
                    // Delay to allow clicking on suggestions
                    setTimeout(() => setShowTagSuggestions(false), 200);
                  }}
                  >
                    {tags.map((tag, index) => (
                      <div
                        key={index}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          backgroundColor: '#ADD8E6',
                          color: '#0F0F0F',
                          borderRadius: '20px',
                          fontSize: '14px',
                          fontWeight: '500'
                        }}
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setTags(tags.filter((_, i) => i !== index));
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#0F0F0F',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '16px',
                            lineHeight: 1
                          }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTagInput(value);
                        if (value.trim()) {
                          // Filter suggestions based on input
                          const filtered = availableTags.filter(tag =>
                            tag.toLowerCase().includes(value.toLowerCase()) &&
                            !tags.includes(tag)
                          );
                          setTagSuggestions(filtered.slice(0, 10));
                          setShowTagSuggestions(true);
                        } else {
                          setTagSuggestions([]);
                          setShowTagSuggestions(false);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && tagInput.trim()) {
                          e.preventDefault();
                          const newTag = tagInput.trim();
                          if (!tags.includes(newTag)) {
                            setTags([...tags, newTag]);
                            setTagInput('');
                            setShowTagSuggestions(false);
                          }
                        } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
                          setTags(tags.slice(0, -1));
                        }
                      }}
                      placeholder={tags.length === 0 ? "Type to add tags..." : ""}
                      style={{
                        flex: 1,
                        minWidth: '120px',
                        border: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent',
                        color: '#fff',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                    />
                  </div>
                  {showTagSuggestions && tagSuggestions.length > 0 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: 'rgba(0, 0, 0, 0.95)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: '4px',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                    }}>
                      {tagSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => {
                            if (!tags.includes(suggestion)) {
                              setTags([...tags, suggestion]);
                              setTagInput('');
                              setShowTagSuggestions(false);
                            }
                          }}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: '#fff',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                  <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginTop: '8px', fontSize: '14px' }}>
                    Add tags to help others find your video
                  </p>
                </div>
              </div>
              <button
                type="submit"
                disabled={sharing || !youtubeUrl.trim()}
                style={{
                  padding: '14px 32px',
                  backgroundColor: sharing ? '#ccc' : '#ADD8E6',
                  color: sharing ? '#666' : '#0F0F0F',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: sharing ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!sharing) {
                    e.currentTarget.style.backgroundColor = '#87CEEB';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = sharing ? '#ccc' : '#ADD8E6';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                {sharing ? 'Sharing...' : 'Share Video'}
              </button>
            </form>
          </div>
        )}

        {/* User's Videos */}
        <div>
          <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>Shared Videos</h2>
          {videos.length === 0 ? (
            <div style={{
              backgroundColor: 'transparent',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#ffffff' }}>No videos shared yet</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={{
                    ...video,
                    user: user ? {
                      id: user.id,
                      username: user.username,
                      profile_picture_url: user.profile_picture_url
                    } : undefined
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
