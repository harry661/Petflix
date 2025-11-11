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
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const carouselIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Banner carousel items
  const bannerItems = [
    {
      id: 'pet-of-the-week',
      title: 'Pet of the Week',
      buttonText: 'See Winner',
      backgroundImage: '/pet-of-the-week.png'
    },
    {
      id: 'clip-of-the-week',
      title: 'Clip of the Week',
      buttonText: 'Watch Now',
      backgroundImage: '/clip-of-the-week.png'
    },
    {
      id: 'rising-star',
      title: 'Rising Star',
      buttonText: 'See Winner',
      backgroundImage: '/rising-star.png'
    }
  ];

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
        }
        
        return () => {
          if (carouselIntervalRef.current) {
            clearInterval(carouselIntervalRef.current);
          }
        };
      }, [isAuthenticated, authLoading, user, navigate, isSearchOpen]);
      
      // Auto-rotate banner carousel
      useEffect(() => {
        if (bannerItems.length > 1) {
          carouselIntervalRef.current = setInterval(() => {
            setCurrentBannerIndex((prev) => (prev + 1) % bannerItems.length);
          }, 5000); // Change every 5 seconds
          
          return () => {
            if (carouselIntervalRef.current) {
              clearInterval(carouselIntervalRef.current);
            }
          };
        }
      }, [bannerItems.length]);


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
  
  const filters = ['Dogs', 'Cats', 'Birds', 'Small and fluffy', 'Underwater'];
  
  // Map filter names to image filenames
  const filterImages: { [key: string]: string } = {
    'Dogs': '/dogs-filter.png',
    'Cats': '/cats-filter.png',
    'Birds': '/birds-filter.png',
    'Small and fluffy': '/smalls-filter.png',
    'Underwater': '/aquatic-filter.png'
  };
  

      if (authLoading || (displayLoading && !isSearchOpen)) {
        return (
          <div style={{
            minHeight: '100vh',
            backgroundColor: '#0F0F0F',
            padding: '40px',
            textAlign: 'center'
          }}>
            <p style={{ color: '#ffffff' }}>Loading...</p>
          </div>
        );
      }

  return (
    <>
      {/* Hero Section - Banner Carousel (Full Width, Behind Navbar) */}
      {!isSearchOpen && (
        <div style={{
          position: 'relative',
          width: '100vw',
          height: '600px', // Increased to accommodate filter buttons overlap
          overflow: 'hidden',
          marginLeft: 'calc(-50vw + 50%)',
          marginTop: '-70px', // Negative margin to pull banner up behind navbar
          marginBottom: 0,
          zIndex: 0
        }}>
            {bannerItems.map((item, index) => (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: index === currentBannerIndex ? 1 : 0,
                  transition: 'opacity 1s ease-in-out',
                  backgroundImage: item.backgroundImage ? `url(${item.backgroundImage})` : 'linear-gradient(135deg, #1E1E1E 0%, #0F0F0F 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {/* Dark overlay for text readability */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0) 100%)'
                }} />
                
                {/* Progressive fade/blur overlay at bottom for filter buttons */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '200px', // Height of fade area
                  background: 'linear-gradient(to top, rgba(15, 15, 15, 1) 0%, rgba(15, 15, 15, 0.8) 30%, rgba(15, 15, 15, 0) 100%)',
                  backdropFilter: 'blur(0px)',
                  WebkitBackdropFilter: 'blur(0px)',
                  maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)',
                  WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)'
                }} />
                
                {/* Title and CTA Button */}
                <div style={{
                  position: 'absolute',
                  bottom: '200px', // Positioned above the fade area
                  left: '60px',
                  zIndex: 2,
                  maxWidth: '600px'
                }}>
                  <h1 style={{
                    color: '#fff',
                    fontSize: '64px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    textShadow: '2px 2px 8px rgba(0,0,0,0.8)',
                    lineHeight: '1.1'
                  }}>
                    {item.title}
                  </h1>
                  <button
                    onClick={() => {
                      // TODO: Navigate to appropriate page based on item.id
                      console.log(`Navigate to ${item.id}`);
                    }}
                    style={{
                      padding: '14px 32px',
                      backgroundColor: '#ADD8E6',
                      color: '#0F0F0F',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#87CEEB';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ADD8E6';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    {item.buttonText}
                  </button>
                </div>
              </div>
            ))}
            
            {/* Carousel indicators */}
            <div style={{
              position: 'absolute',
              bottom: '200px', // Aligned with button level
              right: '40px',
              display: 'flex',
              gap: '8px',
              zIndex: 3,
              alignItems: 'center'
            }}>
              {bannerItems.map((_, index) => (
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
      
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        paddingTop: 0
      }}>
        <div style={{ 
          maxWidth: '100%',
          margin: '0 auto', 
          padding: '0 40px',
          position: 'relative'
        }}>
        {/* Filter Buttons - Positioned over banner fade */}
        {!isSearchOpen && (
          <div style={{
            marginBottom: '30px',
            marginTop: '-100px', // Pull up to overlap with banner fade area
            display: 'flex',
            gap: '8px',
            width: '100%',
            position: 'relative',
            zIndex: 2 // Above banner
          }}>
            {filters.map((filter) => {
              const imageUrl = filterImages[filter];
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
                  style={{
                    flex: 1,
                    padding: 0,
                    borderRadius: '8px',
                    border: selectedFilter === filter ? '3px solid #ADD8E6' : '3px solid transparent',
                    backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                    backgroundColor: imageUrl ? 'transparent' : (selectedFilter === filter ? '#ADD8E6' : '#f5f5f5'),
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: selectedFilter === filter ? '0 4px 12px rgba(173, 216, 230, 0.5)' : '0 2px 8px rgba(0,0,0,0.2)',
                    minWidth: 0,
                    aspectRatio: '298 / 166',
                    width: '100%',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedFilter !== filter) {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedFilter !== filter) {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                    }
                  }}
                >
                  {/* Subtle overlay when selected */}
                  {selectedFilter === filter && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(173, 216, 230, 0.15)',
                      pointerEvents: 'none'
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        )}
        
        {/* Videos Section - Adapts to search or trending */}
        <div>
          <h2 style={{ color: '#ffffff', marginBottom: '20px' }}>{displayTitle}</h2>
          
          {displayLoading && isSearchOpen && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#ffffff' }}>Searching...</p>
            </div>
          )}

          {!displayLoading && displayVideos.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#ffffff' }}>
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
    </>
  );
}

