import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Upload, Pencil, CheckCircle2, Bell, BellOff } from 'lucide-react';
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
  const [sharedVideos, setSharedVideos] = useState<any[]>([]);
  const [repostedVideos, setRepostedVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'shared' | 'reposted' | 'liked'>('shared');
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
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
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  
  // Available tags for pet videos - organized by category, sorted alphabetically within each category
  const availableTags = [
    // Dogs - sorted alphabetically
    'Beagle', 'Border Collie', 'Boxer', 'Bulldog', 'Canine', 'Chihuahua', 'Corgi', 'Dachshund',
    'Dog', 'Dogs', 'Doggo', 'Doggy', 'French Bulldog', 'German Shepherd', 'Golden Retriever',
    'Great Dane', 'Labrador', 'Pomeranian', 'Poodle', 'Pup', 'Puppies', 'Puppy', 'Pups',
    'Rottweiler', 'Shih Tzu', 'Siberian Husky', 'Yorkshire Terrier',
    
    // Cats - sorted alphabetically
    'Abyssinian', 'American Shorthair', 'Bengal', 'British Shorthair', 'Cat', 'Cats',
    'Feline', 'Kitten', 'Kittens', 'Kitty', 'Kitties', 'Maine Coon', 'Meow', 'Persian',
    'Purr', 'Ragdoll', 'Russian Blue', 'Scottish Fold', 'Siamese', 'Sphynx', 'Turkish Angora',
    
    // Birds - sorted alphabetically
    'African Grey', 'Bird', 'Birds', 'Budgie', 'Budgies', 'Canary', 'Canaries', 'Chicken',
    'Chickens', 'Cockatiel', 'Cockatiels', 'Cockatoo', 'Cockatoos', 'Conure', 'Conures',
    'Duck', 'Ducks', 'Finch', 'Finches', 'Goose', 'Geese', 'Lovebird', 'Lovebirds',
    'Macaw', 'Macaws', 'Parrot', 'Parrots', 'Pigeon', 'Pigeons', 'Quaker Parrot', 'Rooster',
    'Zebra Finch',
    
    // Small and Fluffy - sorted alphabetically
    'Bunny', 'Bunnies', 'Chinchilla', 'Chinchillas', 'Ferret', 'Ferrets', 'Fluffy',
    'Gerbil', 'Gerbils', 'Guinea Pig', 'Guinea Pigs', 'Hamster', 'Hamsters', 'Hedgehog',
    'Hedgehogs', 'Mouse', 'Mice', 'Rabbit', 'Rabbits', 'Rat', 'Rats', 'Rodent', 'Rodents',
    'Small Animal', 'Small Pets', 'Sugar Glider', 'Sugar Gliders', 'Tiny',
    
    // Underwater/Aquatic - sorted alphabetically
    'Angelfish', 'Aquarium', 'Aquatic', 'Axolotl', 'Axolotls', 'Betta', 'Bettas', 'Cichlid',
    'Cichlids', 'Discus', 'Fish', 'Fishes', 'Freshwater', 'Frog', 'Frogs', 'Goldfish',
    'Guppy', 'Guppies', 'Koi', 'Marine', 'Newt', 'Newts', 'Oscar', 'Oscars', 'Saltwater',
    'Sea Turtle', 'Terrapin', 'Terrapins', 'Tetra', 'Tetras', 'Toad', 'Toads', 'Tortoise',
    'Tortoises', 'Tropical Fish', 'Turtle', 'Turtles', 'Underwater',
    
    // General/Behavioral - sorted alphabetically
    'Adorable', 'Adoption', 'Cute', 'Funny', 'Grooming', 'Pet Care', 'Pet Food', 'Pet Health',
    'Pet Toys', 'Playful', 'Rescue', 'Training', 'Tricks', 'Vet', 'Veterinary'
  ];

  useEffect(() => {
    if (username) {
      loadUserProfile();
    }

    // Listen for video liked/reposted events to refresh profile tabs
    const handleVideoLiked = () => {
      if (isCurrentUser) {
        // Reload liked videos tab
        const loadLikedVideos = async () => {
          if (!user) return;
          try {
            const likedRes = await fetch(`${API_URL}/api/v1/videos/liked/${user.id}`, {
              credentials: 'include',
            });
            if (likedRes?.ok) {
              const likedData = await likedRes.json();
              setLikedVideos(likedData.videos || []);
            }
          } catch (err) {
            // Silently fail
          }
        };
        loadLikedVideos();
      }
    };

    const handleVideoReposted = () => {
      if (isCurrentUser) {
        // Reload reposted videos tab
        const loadRepostedVideos = async () => {
          if (!user) return;
          try {
            const repostedRes = await fetch(`${API_URL}/api/v1/videos/user/${user.id}?type=reposted`, {
              credentials: 'include',
            });
            if (repostedRes?.ok) {
              const repostedData = await repostedRes.json();
              setRepostedVideos(repostedData.videos || []);
            }
          } catch (err) {
            // Silently fail
          }
        };
        loadRepostedVideos();
      }
    };

    window.addEventListener('video-liked', handleVideoLiked);
    window.addEventListener('video-reposted', handleVideoReposted);

    return () => {
      window.removeEventListener('video-liked', handleVideoLiked);
      window.removeEventListener('video-reposted', handleVideoReposted);
    };
  }, [username, isCurrentUser, user]);

  const loadUserProfile = async () => {
    try {
      setError('');
      
      // Get current user to check if viewing own profile
      const token = localStorage.getItem('auth_token');
      let currentUser = null;
      if (token) {
        try {
          const currentUserRes = await fetch(`${API_URL}/api/v1/users/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          });
          if (currentUserRes.ok) {
            currentUser = await currentUserRes.json();
          }
        } catch (err) {
          // Error fetching current user - continue anyway
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

      // Check if viewing own profile
      const isViewingOwnProfile = currentUser?.username === username;
      setIsCurrentUser(isViewingOwnProfile);

      setUser(userData);

      // Load user's shared videos, reposted videos, and liked videos in parallel
      const [sharedRes, repostedRes, likedRes] = await Promise.all([
        fetch(`${API_URL}/api/v1/videos/user/${userData.id}?type=shared`, {
          credentials: 'include',
        }).catch(() => null),
        fetch(`${API_URL}/api/v1/videos/user/${userData.id}?type=reposted`, {
          credentials: 'include',
        }).catch(() => null),
        fetch(`${API_URL}/api/v1/videos/liked/${userData.id}`, {
          credentials: 'include',
        }).catch(() => null)
      ]);

      // Process shared videos
      if (sharedRes?.ok) {
        try {
          const sharedData = await sharedRes.json();
          setSharedVideos(sharedData.videos || []);
        } catch (err) {
          setSharedVideos([]);
        }
      } else {
        setSharedVideos([]);
      }

      // Process reposted videos
      if (repostedRes?.ok) {
        try {
          const repostedData = await repostedRes.json();
          setRepostedVideos(repostedData.videos || []);
        } catch (err) {
          setRepostedVideos([]);
        }
      } else {
        setRepostedVideos([]);
      }

      // Process liked videos (only show on own profile)
      if (isViewingOwnProfile) {
        if (likedRes?.ok) {
          try {
            const likedData = await likedRes.json();
            setLikedVideos(likedData.videos || []);
          } catch (err) {
            console.error('Error parsing liked videos:', err);
            setLikedVideos([]);
          }
        } else {
          // Even if API call fails, initialize empty array so tab shows
          setLikedVideos([]);
        }
      } else {
        setLikedVideos([]);
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

      // Check follow status (only if not viewing own profile and logged in)
      if (token && !isViewingOwnProfile) {
        try {
          const followStatusRes = await fetch(`${API_URL}/api/v1/users/${userData.id}/follow-status`, {
            headers: { 'Authorization': `Bearer ${token}` },
            credentials: 'include',
          });
          if (followStatusRes.ok) {
            const status = await followStatusRes.json();
            setIsFollowing(status.isFollowing);
            
            // If following, check notification preference
            if (status.isFollowing) {
              try {
                const notifPrefRes = await fetch(`${API_URL}/api/v1/users/${userData.id}/notification-preference`, {
                  headers: { 'Authorization': `Bearer ${token}` },
                  credentials: 'include',
                });
                if (notifPrefRes.ok) {
                  const notifPref = await notifPrefRes.json();
                  setNotificationsEnabled(notifPref.notificationsEnabled);
                }
              } catch (err) {
                // Error checking notification preference - default to enabled
                setNotificationsEnabled(true);
              }
            }
          }
        } catch (err) {
          // Error checking follow status
          setIsFollowing(false);
        }
      } else {
        setIsFollowing(false);
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
        // If unfollowing, reset notification preference
        if (isFollowing) {
          setNotificationsEnabled(true);
        } else {
          // If following, set default notification preference to enabled
          try {
            await fetch(`${API_URL}/api/v1/users/${user?.id}/notification-preference`, {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ enabled: true }),
            });
            setNotificationsEnabled(true);
          } catch (err) {
            // Error setting notification preference - continue anyway
          }
        }
        loadUserProfile(); // Reload to update counts
      }
    } catch (err) {
      alert('Failed to update follow status');
    }
  };

  const handleToggleNotifications = async () => {
    if (!isFollowing) return; // Can only toggle if following
    
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const newState = !notificationsEnabled;
      const response = await fetch(`${API_URL}/api/v1/users/${user?.id}/notification-preference`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: newState }),
      });

      if (response.ok) {
        setNotificationsEnabled(newState);
      }
    } catch (err) {
      alert('Failed to update notification preference');
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
        // Show success animation
        setShowSuccessAnimation(true);
        
        // Close modal and reset form after a brief delay
        setTimeout(() => {
          setYoutubeUrl('');
          setTags([]);
          setTagInput('');
          setShareError('');
          setShowShareForm(false);
          setShowSuccessAnimation(false);
          // Reload videos to show the newly shared video
          loadUserProfile();
        }, 1500); // 1.5 second animation
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
                <Link
                  to={`/user/${username}/followers`}
                  style={{
                    textDecoration: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <strong style={{ color: '#ffffff' }}>{followers.length}</strong>
                  <span style={{ color: '#ffffff', marginLeft: '5px' }}>Followers</span>
                </Link>
                <Link
                  to={`/user/${username}/following`}
                  style={{
                    textDecoration: 'none',
                    color: '#ffffff',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                >
                  <strong style={{ color: '#ffffff' }}>{following.length}</strong>
                  <span style={{ color: '#ffffff', marginLeft: '5px' }}>Following</span>
                </Link>
                <div>
                  <strong style={{ color: '#ffffff' }}>{sharedVideos.length + repostedVideos.length}</strong>
                  <span style={{ color: '#ffffff', marginLeft: '5px' }}>Videos</span>
                </div>
              </div>
              {!isCurrentUser && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={handleFollow}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: isFollowing ? 'transparent' : '#ADD8E6',
                      color: isFollowing ? '#ffffff' : '#0F0F0F',
                      border: isFollowing ? '1px solid #ffffff' : 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
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
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                  {isFollowing && (
                    <button
                      onClick={handleToggleNotifications}
                      style={{
                        padding: '10px',
                        backgroundColor: 'transparent',
                        color: notificationsEnabled ? '#ADD8E6' : 'rgba(255, 255, 255, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.borderColor = '#ADD8E6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      }}
                      title={notificationsEnabled ? 'Notifications enabled' : 'Notifications disabled'}
                    >
                      {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
                    </button>
                  )}
                </div>
              )}
                  {isCurrentUser && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setShowShareForm(true)}
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
                        Share Video
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

        {/* Share Video Modal Overlay */}
        {isCurrentUser && showShareForm && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10000,
              padding: '20px'
            }}
            onClick={(e) => {
              // Close modal when clicking on the overlay background
              if (e.target === e.currentTarget) {
                setShowShareForm(false);
                setYoutubeUrl('');
                setTags([]);
                setTagInput('');
                setShareError('');
              }
            }}
          >
            <div
              style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '12px',
                padding: '40px',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#ffffff', margin: 0 }}>Share a YouTube Video</h2>
                <button
                  onClick={() => {
                    setShowShareForm(false);
                    setYoutubeUrl('');
                    setTags([]);
                    setTagInput('');
                    setShareError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#ffffff',
                    fontSize: '24px',
                    cursor: 'pointer',
                    padding: '0',
                    width: '32px',
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  ×
                </button>
              </div>
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
                      outline: 'none',
                      height: '56px',
                      lineHeight: '24px'
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
                    height: tags.length === 0 ? '56px' : 'auto', // Fixed height when empty, auto when tags are present
                    padding: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px',
                    alignItems: tags.length === 0 ? 'center' : 'flex-start', // Center when empty, flex-start when tags present
                    boxSizing: 'border-box'
                  }}
                    onFocus={(e) => {
                      setShowTagSuggestions(true);
                      e.currentTarget.style.borderColor = '#ADD8E6';
                      e.currentTarget.style.borderWidth = '1px';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    }}
                    onBlur={(e) => {
                      // Delay to allow clicking on suggestions
                      setTimeout(() => setShowTagSuggestions(false), 200);
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                      e.currentTarget.style.borderWidth = '1px';
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
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
                          const valueLower = value.toLowerCase().trim();
                          
                          // Filter and score tags for relevance
                          const scoredTags = availableTags
                            .filter(tag => !tags.includes(tag)) // Exclude already added tags
                            .map(tag => {
                              const tagLower = tag.toLowerCase();
                              let score = 0;
                              
                              // Exact prefix match (highest priority)
                              if (tagLower.startsWith(valueLower)) {
                                score = 1000 - tagLower.length; // Shorter tags first for exact matches
                              }
                              // Word prefix match (medium priority)
                              else {
                                const words = tagLower.split(/\s+/);
                                const matchingWordIndex = words.findIndex(word => word.startsWith(valueLower));
                                if (matchingWordIndex !== -1) {
                                  // Prioritize matches in first word, then by position
                                  score = 500 - (matchingWordIndex * 10) - tagLower.length;
                                } else {
                                  return null; // No match
                                }
                              }
                              
                              return { tag, score };
                            })
                            .filter(item => item !== null) // Remove non-matches
                            .sort((a, b) => b!.score - a!.score) // Sort by score descending
                            .map(item => item!.tag)
                            .slice(0, 10); // Limit to 10 results
                          
                          setTagSuggestions(scoredTags);
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
                        padding: '0',
                        lineHeight: '24px',
                        height: '24px'
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
              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', position: 'relative' }}>
                <button
                  type="submit"
                  disabled={sharing || !youtubeUrl.trim() || showSuccessAnimation}
                  style={{
                    padding: '14px 32px',
                    backgroundColor: showSuccessAnimation ? '#4CAF50' : (sharing ? '#ccc' : '#ADD8E6'),
                    color: showSuccessAnimation ? '#fff' : (sharing ? '#666' : '#0F0F0F'),
                    border: 'none',
                    borderRadius: '6px',
                    cursor: (sharing || showSuccessAnimation) ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    if (!sharing && !showSuccessAnimation) {
                      e.currentTarget.style.backgroundColor = '#87CEEB';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = showSuccessAnimation ? '#4CAF50' : (sharing ? '#ccc' : '#ADD8E6');
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {showSuccessAnimation ? (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Shared!</span>
                    </>
                  ) : (
                    sharing ? 'Sharing...' : 'Share Video'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowShareForm(false);
                    setYoutubeUrl('');
                    setTags([]);
                    setTagInput('');
                    setShareError('');
                  }}
                  style={{
                    padding: '14px 32px',
                    backgroundColor: 'transparent',
                    color: '#ffffff',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
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
                  disabled={sharing || showSuccessAnimation}
                >
                  Cancel
                </button>
              </div>
              {/* Success animation overlay */}
              {showSuccessAnimation && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '12px',
                  zIndex: 1,
                  animation: 'fadeIn 0.3s ease'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                    animation: 'scaleIn 0.4s ease'
                  }}>
                    <CheckCircle2 size={48} color="#4CAF50" style={{ animation: 'checkmark 0.5s ease' }} />
                    <p style={{ color: '#fff', fontSize: '18px', fontWeight: '500', margin: 0 }}>
                      Video shared successfully!
                    </p>
                  </div>
                </div>
              )}
            </form>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes scaleIn {
                from { 
                  opacity: 0;
                  transform: scale(0.8);
                }
                to { 
                  opacity: 1;
                  transform: scale(1);
                }
              }
              @keyframes checkmark {
                0% {
                  opacity: 0;
                  transform: scale(0) rotate(-45deg);
                }
                50% {
                  opacity: 1;
                  transform: scale(1.2) rotate(-45deg);
                }
                100% {
                  opacity: 1;
                  transform: scale(1) rotate(0deg);
                }
              }
              @keyframes fadeInScale {
                from {
                  opacity: 0;
                  transform: scale(0);
                }
                to {
                  opacity: 1;
                  transform: scale(1);
                }
              }
            `}</style>
            </div>
          </div>
        )}

        {/* User's Videos with Tabs */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '2px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              onClick={() => setActiveTab('shared')}
              style={{
                padding: '12px 0',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'shared' ? '2px solid #ADD8E6' : '2px solid transparent',
                color: activeTab === 'shared' ? '#ADD8E6' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'shared' ? '600' : '400',
                transition: 'all 0.2s ease',
                marginBottom: '-2px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'shared') {
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'shared') {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }
              }}
            >
              Shared Videos ({sharedVideos.length})
            </button>
            <button
              onClick={() => setActiveTab('reposted')}
              style={{
                padding: '12px 0',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'reposted' ? '2px solid #ADD8E6' : '2px solid transparent',
                color: activeTab === 'reposted' ? '#ADD8E6' : 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: activeTab === 'reposted' ? '600' : '400',
                transition: 'all 0.2s ease',
                marginBottom: '-2px'
              }}
              onMouseEnter={(e) => {
                if (activeTab !== 'reposted') {
                  e.currentTarget.style.color = '#ffffff';
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== 'reposted') {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                }
              }}
            >
              Reposted Videos ({repostedVideos.length})
            </button>
            {isCurrentUser && (
              <button
                onClick={() => setActiveTab('liked')}
                style={{
                  padding: '12px 0',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === 'liked' ? '2px solid #ADD8E6' : '2px solid transparent',
                  color: activeTab === 'liked' ? '#ADD8E6' : 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: activeTab === 'liked' ? '600' : '400',
                  transition: 'all 0.2s ease',
                  marginBottom: '-2px'
                }}
                onMouseEnter={(e) => {
                  if (activeTab !== 'liked') {
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (activeTab !== 'liked') {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  }
                }}
              >
                Liked Videos ({likedVideos.length})
              </button>
            )}
          </div>

          {/* Shared Videos Tab */}
          {activeTab === 'shared' && (
            <>
              {sharedVideos.length === 0 ? (
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
                  {sharedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={{
                        ...video,
                        user: video.user || (user ? {
                          id: user.id,
                          username: user.username,
                          profile_picture_url: user.profile_picture_url
                        } : undefined)
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Liked Videos Tab */}
          {activeTab === 'liked' && (
            <>
              {likedVideos.length === 0 ? (
                <div style={{
                  backgroundColor: 'transparent',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#ffffff' }}>No liked videos yet</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px'
                }}>
                  {likedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={{
                        ...video,
                        user: video.user || (user ? {
                          id: user.id,
                          username: user.username,
                          profile_picture_url: user.profile_picture_url
                        } : undefined)
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* Reposted Videos Tab */}
          {activeTab === 'reposted' && (
            <>
              {repostedVideos.length === 0 ? (
                <div style={{
                  backgroundColor: 'transparent',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center'
                }}>
                  <p style={{ color: '#ffffff' }}>No videos reposted yet</p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px'
                }}>
                  {repostedVideos.map((video) => (
                    <VideoCard
                      key={video.id}
                      video={{
                        ...video,
                        user: video.user || (user ? {
                          id: user.id,
                          username: user.username,
                          profile_picture_url: user.profile_picture_url
                        } : undefined)
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
