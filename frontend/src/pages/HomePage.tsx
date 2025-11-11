import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSearch } from '../context/SearchContext';
import VideoCard from '../components/VideoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isSearchOpen, searchQuery, searchResults, isLoading: searchLoading, setSearchQuery, setSearchResults, setIsLoading } = useSearch();
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuredVideos, setFeaturedVideos] = useState<any[]>([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Wait for auth check to complete
    if (authLoading) {
      return;
    }
    
    // If not authenticated, redirect to landing page
    if (!isAuthenticated) {
      navigate('/', { replace: true });
      return;
    }
    
    // Load videos only if authenticated and not searching
    if (isAuthenticated && user && !isSearchOpen) {
      loadTrendingVideos();
      loadFeaturedVideos();
    }
    
    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [isAuthenticated, authLoading, user, navigate, isSearchOpen]);
  
  // Auto-rotate banner carousel
  useEffect(() => {
    if (featuredVideos.length > 1) {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % featuredVideos.length);
      }, 5000); // Change every 5 seconds
      
      return () => {
        if (carouselIntervalRef.current) {
          clearInterval(carouselIntervalRef.current);
        }
      };
    }
  }, [featuredVideos.length]);

  const loadFeaturedVideos = async () => {
    try {
      // Get featured videos for banner carousel (top 5 most recent)
      const response = await fetch(`${API_URL}/api/v1/videos/recent?limit=5`);
      if (response.ok) {
        const data = await response.json();
        if (data.videos && data.videos.length > 0) {
          setFeaturedVideos(data.videos);
        }
      }
    } catch (err) {
      // Silently fail - banner is optional
    }
  };

  const loadTrendingVideos = async (filter?: string | null) => {
    try {
      setLoading(true);
      let query = 'cats dogs pets';
      
      // Apply filter if selected
      if (filter) {
        const filterMap: { [key: string]: string } = {
          'cats': 'cats',
          'dogs': 'dogs',
          'birds': 'birds',
          'small and fluffy': 'hamsters rabbits guinea pigs small pets',
          'underwater': 'fish aquarium underwater marine'
        };
        query = filterMap[filter.toLowerCase()] || query;
      }
      
      // First try to get recent videos (all shared videos, most recent first)
      const recentResponse = await fetch(`${API_URL}/api/v1/videos/recent?limit=12`);
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        if (recentData.videos && recentData.videos.length > 0) {
          // Filter videos if a filter is selected
          let filteredVideos = recentData.videos;
          if (filter) {
            const filterLower = filter.toLowerCase();
            filteredVideos = recentData.videos.filter((video: any) => {
              const title = (video.title || '').toLowerCase();
              const description = (video.description || '').toLowerCase();
              const searchText = title + ' ' + description;
              
              if (filterLower === 'cats') return searchText.includes('cat');
              if (filterLower === 'dogs') return searchText.includes('dog');
              if (filterLower === 'birds') return searchText.includes('bird') || searchText.includes('parrot') || searchText.includes('cockatiel');
              if (filterLower === 'small and fluffy') return searchText.includes('hamster') || searchText.includes('rabbit') || searchText.includes('guinea pig') || searchText.includes('small');
              if (filterLower === 'underwater') return searchText.includes('fish') || searchText.includes('aquarium') || searchText.includes('underwater');
              return true;
            });
          }
          
          if (filteredVideos.length > 0) {
            setTrendingVideos(filteredVideos);
            setLoading(false);
            return;
          }
        }
      }
      
      // Fallback: try to search for trending pet videos
      const searchResponse = await fetch(`${API_URL}/api/v1/videos/search?q=${encodeURIComponent(query)}&limit=12`);
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.videos && searchData.videos.length > 0) {
          setTrendingVideos(searchData.videos);
          setLoading(false);
          return;
        }
      }
      
      // If still no results, set empty array
      setTrendingVideos([]);
    } catch (err) {
      // Error loading trending videos - set empty array
      setTrendingVideos([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Reload videos when filter changes
  useEffect(() => {
    if (isAuthenticated && user && !isSearchOpen) {
      loadTrendingVideos(selectedFilter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter, isAuthenticated, user, isSearchOpen]);

  // Determine which videos to show
  const displayVideos = isSearchOpen && searchQuery ? searchResults : trendingVideos;
  const displayLoading = isSearchOpen ? searchLoading : loading;
  const displayTitle = isSearchOpen && searchQuery 
    ? `Search results for "${searchQuery}"` 
    : selectedFilter 
      ? `${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Videos`
      : 'Trending Pet Videos';
  
  const filters = ['Cats', 'Dogs', 'Birds', 'Small and fluffy', 'Underwater'];
  
  const getBannerThumbnail = (video: any) => {
    if (video.thumbnail) return video.thumbnail;
    if (video.youtubeVideoId) {
      return `https://img.youtube.com/vi/${video.youtubeVideoId}/maxresdefault.jpg`;
    }
    return null;
  };

  if (authLoading || (displayLoading && !isSearchOpen)) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F0F0DC',
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#666' }}>Loading...</p>
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
        {/* Hero Section - Banner Carousel */}
        {!isSearchOpen && featuredVideos.length > 0 && (
          <div style={{
            marginBottom: '40px',
            position: 'relative',
            width: '100%',
            height: '400px',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
          }}>
            {featuredVideos.map((video, index) => {
              const thumbnail = getBannerThumbnail(video);
              return (
                <div
                  key={video.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: index === currentBannerIndex ? 1 : 0,
                    transition: 'opacity 1s ease-in-out',
                    backgroundImage: thumbnail ? `url(${thumbnail})` : 'linear-gradient(135deg, #ADD8E6 0%, #87CEEB 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/video/${video.id}`)}
                >
                  {/* Dark overlay for text readability */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)'
                  }} />
                  
                  {/* Video title overlay */}
                  <div style={{
                    position: 'absolute',
                    bottom: '40px',
                    left: '40px',
                    right: '40px',
                    zIndex: 2
                  }}>
                    <h2 style={{
                      color: '#fff',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      marginBottom: '10px',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      {video.title || 'Featured Video'}
                    </h2>
                    {video.user?.username && (
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontSize: '18px',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                      }}>
                        by {video.user.username}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Carousel indicators */}
            <div style={{
              position: 'absolute',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '8px',
              zIndex: 3
            }}>
              {featuredVideos.map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentBannerIndex(index);
                    if (carouselIntervalRef.current) {
                      clearInterval(carouselIntervalRef.current);
                    }
                  }}
                  style={{
                    width: index === currentBannerIndex ? '24px' : '8px',
                    height: '8px',
                    borderRadius: '4px',
                    border: 'none',
                    backgroundColor: index === currentBannerIndex ? '#ADD8E6' : 'rgba(255, 255, 255, 0.5)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Filter Buttons */}
        {!isSearchOpen && (
          <div style={{
            marginBottom: '30px',
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: '1px solid',
                  borderColor: selectedFilter === filter ? '#ADD8E6' : 'rgba(255, 255, 255, 0.3)',
                  backgroundColor: selectedFilter === filter ? '#ADD8E6' : 'rgba(255, 255, 255, 0.1)',
                  color: selectedFilter === filter ? '#36454F' : '#fff',
                  fontSize: '14px',
                  fontWeight: selectedFilter === filter ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backdropFilter: 'blur(10px)'
                }}
                onMouseEnter={(e) => {
                  if (selectedFilter !== filter) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedFilter !== filter) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  }
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        )}
        
        {/* Videos Section - Adapts to search or trending */}
        <div>
          <h2 style={{ color: '#36454F', marginBottom: '20px' }}>{displayTitle}</h2>
          
          {displayLoading && isSearchOpen && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: 'white',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#666' }}>Searching...</p>
            </div>
          )}

          {!displayLoading && displayVideos.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: 'white',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#666' }}>
                {isSearchOpen && searchQuery 
                  ? `No videos found for "${searchQuery}". Try different keywords.`
                  : 'No videos found. Try searching for pet videos!'}
              </p>
            </div>
          )}

          {!displayLoading && displayVideos.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '20px'
            }}>
              {displayVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

