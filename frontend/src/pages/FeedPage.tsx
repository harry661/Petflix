import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import VideoCard from '../components/VideoCard';
import { Dog, Cat, Bird, Rabbit, Fish } from 'lucide-react';

import { API_URL } from '../config/api';

export default function FeedPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag') || '';
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return; // Still checking auth
    }
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadFeed();
  }, [isAuthenticated, authLoading, navigate]);

  const loadFeed = async () => {
    setLoading(true);
    setError('');
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/videos/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.error || 'Failed to load feed');
        setLoading(false);
        return;
      }

      const data = await response.json();
      const feedVideos = data.videos || [];
      setAllVideos(feedVideos);
      setVideos(feedVideos);
    } catch (err: any) {
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Filter videos by selected tag
  useEffect(() => {
    if (!tagFilter) {
      setVideos(allVideos);
      return;
    }

    // Filter videos that have the selected tag
    const filterLower = tagFilter.toLowerCase();
    const tagMap: { [key: string]: string[] } = {
      'dogs': ['Dog', 'Dogs', 'Puppy', 'Puppies', 'Canine', 'Canines'],
      'cats': ['Cat', 'Cats', 'Kitten', 'Kittens', 'Feline', 'Felines'],
      'birds': ['Bird', 'Birds', 'Parrot', 'Parrots', 'Canary', 'Canaries', 'Finch', 'Finches'],
      'small and fluffy': ['Rabbit', 'Rabbits', 'Hamster', 'Hamsters', 'Guinea Pig', 'Guinea Pigs', 'Rodent', 'Rodents'],
      'underwater': ['Fish', 'Fishes', 'Goldfish', 'Betta', 'Bettas', 'Guppy', 'Guppies', 'Angelfish', 'Tetra', 'Tetras', 'Cichlid', 'Cichlids', 'Discus', 'Oscar', 'Oscars', 'Koi', 'Aquarium', 'Aquatic', 'Underwater', 'Marine', 'Tropical Fish', 'Saltwater', 'Freshwater', 'Turtle', 'Turtles', 'Tortoise', 'Tortoises', 'Sea Turtle', 'Terrapin', 'Terrapins', 'Frog', 'Frogs', 'Toad', 'Toads', 'Axolotl', 'Axolotls', 'Newt', 'Newts']
    };

    const tagNames = tagMap[filterLower] || [tagFilter];

    // Filter videos that have matching tags
    const filtered = allVideos.filter((video) => {
      if (!video.tags || !Array.isArray(video.tags)) {
        return false;
      }
      return video.tags.some((tag: string) => 
        tagNames.some((tagName) => tag.toLowerCase() === tagName.toLowerCase())
      );
    });

    setVideos(filtered);
  }, [tagFilter, allVideos]);

  const filters = ['Dogs', 'Cats', 'Birds', 'Small and fluffy', 'Underwater'];
  
  // Map filter names to icons
  const filterIcons: { [key: string]: React.ReactNode } = {
    'Dogs': <Dog size={24} />,
    'Cats': <Cat size={24} />,
    'Birds': <Bird size={24} />,
    'Small and fluffy': <Rabbit size={24} />,
    'Underwater': <Fish size={24} />
  };

  const handleFilterClick = (filter: string) => {
    if (tagFilter === filter.toLowerCase()) {
      setSearchParams({});
    } else {
      setSearchParams({ tag: filter.toLowerCase() });
    }
  };

  const getFilterDisplayName = (filter: string): string => {
    const filterMap: { [key: string]: string } = {
      'dogs': 'Dog',
      'cats': 'Cat',
      'birds': 'Bird',
      'small and fluffy': 'Small and Fluffy',
      'underwater': 'Underwater'
    };
    
    return filterMap[filter.toLowerCase()] || filter.charAt(0).toUpperCase() + filter.slice(1);
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#ffffff' }}>Loading your feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        padding: '40px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
          <h1 style={{ color: '#ffffff', marginBottom: '30px', fontSize: '32px', fontWeight: '600' }}>Following</h1>
          <div style={{
            padding: '20px',
            backgroundColor: 'rgba(198, 40, 40, 0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(198, 40, 40, 0.4)'
          }}>
            <p style={{ color: '#ff6b6b', margin: 0 }}>{error}</p>
          </div>
        </div>
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
        .video-grid {
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
        }
        @media (min-width: 1400px) {
          .video-grid {
            grid-template-columns: repeat(5, 1fr) !important;
            max-width: 100% !important;
            margin: 0 !important;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        padding: '20px'
      }}>
      <div className="page-content-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
        <h1 style={{ color: '#ffffff', marginBottom: '30px', fontSize: '32px', fontWeight: '600' }}>
          {tagFilter 
            ? `Following ${getFilterDisplayName(tagFilter)} Videos`
            : 'Following'}
        </h1>

        {/* Filter Buttons */}
        <div style={{
          marginBottom: '30px',
          display: 'flex',
          gap: '8px',
          width: '100%'
        }}>
          {filters.map((filter) => {
            const icon = filterIcons[filter];
            const isSelected = tagFilter === filter.toLowerCase();
            return (
              <button
                key={filter}
                onClick={() => handleFilterClick(filter)}
                style={{
                  flexGrow: 1,
                  flexShrink: 1,
                  flexBasis: 0,
                  padding: '24px 20px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #ADD8E6' : '2px solid rgba(255, 255, 255, 0.2)',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: isSelected 
                    ? '0 4px 16px rgba(173, 216, 230, 0.4), inset 0 0 0 1px rgba(173, 216, 230, 0.2)' 
                    : '0 2px 8px rgba(0, 0, 0, 0.3)',
                  minWidth: 0,
                  height: '120px',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  color: '#ffffff'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.3)';
                  }
                }}
              >
                {/* Background blur effect layer */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: isSelected ? 'rgba(173, 216, 230, 0.1)' : 'transparent',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  pointerEvents: 'none'
                }} />
                
                {/* Content */}
                <div style={{
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%'
                }}>
                  <div style={{
                    color: isSelected ? '#ADD8E6' : '#ffffff',
                    transition: 'color 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {icon}
                  </div>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: isSelected ? '600' : '500',
                    color: isSelected ? '#ADD8E6' : '#ffffff',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    lineHeight: '1.2'
                  }}>
                    {filter}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {videos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'transparent',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{ color: '#ffffff', fontSize: '24px', marginBottom: '15px', fontWeight: '600' }}>
              No videos yet
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '16px', marginBottom: '20px' }}>
              Your following feed is empty
            </p>
            <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', marginBottom: '30px' }}>
              Follow other users to see their shared videos here, or start by searching for pet videos!
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button
                onClick={() => navigate('/search')}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ADD8E6',
                  color: '#0F0F0F',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#87CEEB';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ADD8E6';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Search Videos
              </button>
            </div>
          </div>
        ) : (
          <div className="video-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '20px'
          }}>
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
