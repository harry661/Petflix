import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSearch } from '../context/SearchContext';
import VideoCard from '../components/VideoCard';

import { API_URL } from '../config/api';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isSearchOpen, searchQuery, searchResults, isLoading: searchLoading } = useSearch();
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false); // Separate loading state for filter changes
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const carouselIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
        if (bannerItems.length > 1 && !isSearchOpen) {
          carouselIntervalRef.current = setInterval(() => {
            setCurrentBannerIndex((prev) => (prev + 1) % bannerItems.length);
          }, 5000); // Change every 5 seconds
          
          return () => {
            if (carouselIntervalRef.current) {
              clearInterval(carouselIntervalRef.current);
            }
          };
        }
      }, [bannerItems.length, isSearchOpen]);


  const loadTrendingVideos = async (filter?: string | null, isFilterChange: boolean = false) => {
    try {
      // Use filterLoading for filter changes, loading for initial load
      if (isFilterChange) {
        setFilterLoading(true);
      } else {
        setLoading(true);
      }
      
      // Build URL with tag filter if selected
      // Limit to 8 videos for 2 rows on home page
      let url = `${API_URL}/api/v1/videos/recent?limit=8`;
      if (filter) {
        url += `&tag=${encodeURIComponent(filter)}`;
      }
      
      // Get recent videos (with tag filter if selected)
      const recentResponse = await fetch(url);
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        if (recentData.videos && recentData.videos.length > 0) {
          setTrendingVideos(recentData.videos);
          if (isFilterChange) {
            setFilterLoading(false);
          } else {
            setLoading(false);
          }
          return;
        }
      }
      
      // Fallback: try to search for trending pet videos (only if no filter is selected)
      if (!filter) {
        const searchResponse = await fetch(`${API_URL}/api/v1/videos/search?q=${encodeURIComponent('cats dogs pets')}&limit=12`);
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.videos && searchData.videos.length > 0) {
            setTrendingVideos(searchData.videos);
            if (isFilterChange) {
              setFilterLoading(false);
            } else {
              setLoading(false);
            }
            return;
          }
        }
      }
      
      // If still no results, set empty array
      setTrendingVideos([]);
    } catch (err) {
      // Error loading trending videos - set empty array
      setTrendingVideos([]);
    } finally {
      if (isFilterChange) {
        setFilterLoading(false);
      } else {
        setLoading(false);
      }
    }
  };
  
  // Reload videos when filter changes (use filterLoading, not loading)
  useEffect(() => {
    if (isAuthenticated && user && !isSearchOpen) {
      // Only trigger filter change if we already have videos loaded (not initial load)
      if (trendingVideos.length > 0 || selectedFilter !== null) {
        loadTrendingVideos(selectedFilter, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

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
  

      // Only show full page loading on initial load, not filter changes
      if (authLoading || (loading && !isSearchOpen && !filterLoading)) {
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
      <style>{`
        @media (min-width: 1200px) {
          .banner-container {
            height: 700px !important;
          }
          .content-container {
            max-width: 90vw !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 40px !important;
            padding-right: 40px !important;
          }
          .filter-container {
            width: 100vw !important;
            max-width: 100vw !important;
            margin-left: calc(-50vw + 50%) !important;
            margin-right: calc(-50vw + 50%) !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: flex-start !important;
            align-items: stretch !important;
            gap: 8px !important;
            padding-left: calc((100vw - 90vw) / 2 + 40px) !important;
            padding-right: calc((100vw - 90vw) / 2 + 40px) !important;
            box-sizing: border-box !important;
          }
          .banner-content {
            left: 0 !important;
            right: 0 !important;
            transform: none !important;
            padding-left: 5vw !important;
            box-sizing: border-box !important;
          }
          .banner-indicators {
            left: 0 !important;
            right: 0 !important;
            transform: none !important;
            padding-right: 5vw !important;
            box-sizing: border-box !important;
          }
          .filter-button {
            flex: 1 1 0% !important;
            min-width: 0 !important;
            max-width: none !important;
            height: auto !important;
          }
        }
        @media (min-width: 1600px) {
          .banner-container {
            height: 800px !important;
          }
          .filter-button {
            max-width: none !important;
          }
        }
        @media (min-width: 1920px) {
          .banner-container {
            height: 900px !important;
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
      {/* Hero Section - Banner Carousel (Full Width, Behind Navbar) */}
      {!isSearchOpen && (
        <div className="banner-container" style={{
          position: 'relative',
          width: '100vw',
          height: '600px', // Base height
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
                
                {/* Title and CTA Button - Fills viewport with padding */}
                <div className="banner-content" style={{
                  position: 'absolute',
                  bottom: '200px', // Positioned above the fade area
                  left: 0,
                  right: 0,
                  zIndex: 2,
                  maxWidth: 'none',
                  width: '100%',
                  paddingLeft: '5vw'
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
                        // Navigate to trending page for featured content
                        navigate('/trending');
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
            
            {/* Carousel indicators - Fills viewport with padding */}
            <div className="banner-indicators" style={{
              position: 'absolute',
              bottom: '200px', // Aligned with button level
              left: 0,
              right: 0,
              display: 'flex',
              gap: '8px',
              zIndex: 3,
              alignItems: 'center',
              justifyContent: 'flex-end',
              width: '100%',
              paddingRight: '5vw'
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
        <div className="content-container" style={{ 
          maxWidth: '100%',
          margin: '0 auto', 
          padding: '0 40px',
          position: 'relative'
        }}>
        {/* Filter Buttons - Positioned over banner fade */}
        {!isSearchOpen && (
          <div className="filter-container" style={{
            marginBottom: '30px',
            marginTop: '-100px', // Pull up to overlap with banner fade area
            display: 'flex',
            gap: '8px',
            position: 'relative',
            zIndex: 2 // Above banner
          }}>
            {filters.map((filter) => {
              const imageUrl = filterImages[filter];
              return (
                <button
                  key={filter}
                  className="filter-button"
                  onClick={() => setSelectedFilter(selectedFilter === filter ? null : filter)}
                  style={{
                    flexGrow: 1,
                    flexShrink: 1,
                    flexBasis: 0,
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#ffffff', margin: 0 }}>{displayTitle}</h2>
            {!isSearchOpen && !selectedFilter && (
              <Link
                to="/trending"
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  cursor: 'pointer',
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
                See more
              </Link>
            )}
          </div>
          
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
            <div style={{ position: 'relative' }}>
              {/* Subtle loading indicator for filter changes */}
              {filterLoading && (
                <div style={{
                  position: 'absolute',
                  top: '-40px',
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  zIndex: 10
                }}>
                  <p style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '14px',
                    margin: 0
                  }}>Loading...</p>
                </div>
              )}
              <div className="video-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
                opacity: filterLoading ? 0.6 : 1,
                transition: 'opacity 0.2s ease'
              }}>
                {displayVideos.map((video) => (
                  <VideoCard key={video.id} video={video} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
