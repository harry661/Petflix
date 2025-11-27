import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSearch } from '../context/SearchContext';
import VideoCard from '../components/VideoCard';
import { VideoGridSkeleton } from '../components/LoadingSkeleton';
import { Dog, Cat, Bird, Rabbit, Fish } from 'lucide-react';

import { API_URL } from '../config/api';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false); // Separate loading state for filter changes
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null);
  const carouselIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pet genres for "Pet of the Week"
  const petGenres = ['dogs', 'cats', 'birds', 'small and fluffy', 'underwater'];
  
  // Banner carousel items
  const bannerItems = [
    {
      id: 'pet-of-the-week',
      title: 'Pet of the Week',
      buttonText: 'See Videos',
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
      buttonText: 'See Profile',
      backgroundImage: '/rising-star.png'
    }
  ];

  // Handle hero carousel button clicks
  const handleHeroButtonClick = async (itemId: string) => {
    if (itemId === 'pet-of-the-week') {
      // Randomly select a pet genre and navigate to filtered popular videos
      const randomGenre = petGenres[Math.floor(Math.random() * petGenres.length)];
      navigate(`/popular?tag=${encodeURIComponent(randomGenre)}`);
    } else if (itemId === 'clip-of-the-week') {
      // Fetch most popular video this week and navigate to it
      try {
        const response = await fetch(`${API_URL}/api/v1/videos/most-popular-this-week`);
        if (response.ok) {
          const data = await response.json();
          if (data.video && data.video.id) {
            navigate(`/video/${data.video.id}`);
          } else {
            // Fallback to trending page if no video found
            navigate('/trending');
          }
        } else {
          // Fallback to trending page on error
          navigate('/trending');
        }
      } catch (error) {
        console.error('Error fetching most popular video:', error);
        // Fallback to trending page on error
        navigate('/trending');
      }
    } else if (itemId === 'rising-star') {
      // Fetch most popular user this week and navigate to their profile
      try {
        const response = await fetch(`${API_URL}/api/v1/users/most-popular-this-week`);
        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.username) {
            navigate(`/user/${data.user.username}`);
          } else {
            // Fallback to trending page if no user found
            navigate('/trending');
          }
        } else {
          // Fallback to trending page on error
          navigate('/trending');
        }
      } catch (error) {
        console.error('Error fetching most popular user:', error);
        // Fallback to trending page on error
        navigate('/trending');
      }
    }
  };

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
    
    // Load trending videos and recommendations on mount
    if (isAuthenticated && user) {
      loadTrendingVideos();
      loadRecommendedVideos();
    }
    
    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [isAuthenticated, authLoading, user, navigate]);
  
  // Auto-rotate banner carousel
  useEffect(() => {
    if (bannerItems.length > 1) {
      carouselIntervalRef.current = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % bannerItems.length);
      }, 5000); // Change every 5 seconds
    }

    return () => {
      if (carouselIntervalRef.current) {
        clearInterval(carouselIntervalRef.current);
      }
    };
  }, [bannerItems.length]);


  const loadTrendingVideos = async (filter?: string | null, isFilterChange: boolean = false) => {
    try {
      // Use filterLoading for filter changes, loading for initial load
      if (isFilterChange) {
        setFilterLoading(true);
      } else {
        setLoading(true);
      }
      
      // Build URL with tag filter if selected
      // Limit to 10 videos for 2 rows on home page (5 per row on larger screens)
      let url = `${API_URL}/api/v1/videos/recent?limit=10`;
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
      
      // No fallback to YouTube search - only show Petflix users' shared/reposted videos
      // If no results, set empty array
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
    if (isAuthenticated && user) {
      // Only trigger filter change if we already have videos loaded (not initial load)
      if (trendingVideos.length > 0 || selectedFilter !== null) {
        loadTrendingVideos(selectedFilter, true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFilter]);

  const loadRecommendedVideos = async () => {
    try {
      setRecommendedLoading(true);
      const token = localStorage.getItem('auth_token');
      
      // First, try to get user's liked videos to understand their preferences
      let preferredTags: string[] = [];
      
      if (token && user) {
        try {
          const likedResponse = await fetch(`${API_URL}/api/v1/videos/liked/${user.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include',
          });
          
          if (likedResponse.ok) {
            const likedData = await likedResponse.json();
            const likedVideos = likedData.videos || [];
            
            // Extract tags from liked videos
            likedVideos.forEach((video: any) => {
              if (video.tags && Array.isArray(video.tags)) {
                preferredTags.push(...video.tags);
              }
            });
            
            // Get unique tags and take top 3 most common
            const tagCounts: { [key: string]: number } = {};
            preferredTags.forEach(tag => {
              tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
            
            const sortedTags = Object.entries(tagCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([tag]) => tag);
            
            preferredTags = sortedTags;
          }
        } catch (err) {
          // Silently fail - will fall back to popular videos
        }
      }
      
      // If we have preferred tags, search for videos with those tags
      if (preferredTags.length > 0) {
        // Try to get videos with preferred tags
        const tagQuery = preferredTags.slice(0, 1).join(' '); // Use most preferred tag
        const searchResponse = await fetch(`${API_URL}/api/v1/videos/search?q=${encodeURIComponent(tagQuery)}&limit=20`);
        
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.videos && searchData.videos.length > 0) {
            // Filter out videos that are already in trending (to avoid duplicates)
            // Handle both Petflix videos (with id) and YouTube videos (with youtubeVideoId)
            const trendingVideoIds = new Set(trendingVideos.map(v => v.id).filter(id => id != null));
            const trendingYouTubeIds = new Set(trendingVideos.map(v => v.youtubeVideoId).filter(id => id != null));
            const filtered = searchData.videos.filter((v: any) => {
              // Skip if it's a Petflix video that's already in trending
              if (v.id && trendingVideoIds.has(v.id)) return false;
              // Skip if it's a YouTube video that's already in trending
              if (v.youtubeVideoId && trendingYouTubeIds.has(v.youtubeVideoId)) return false;
              return true;
            });
            setRecommendedVideos(filtered.slice(0, 10));
            setRecommendedLoading(false);
            return;
          }
        }
      }
      
      // Fallback: Get popular/recent videos (excluding already shown trending videos)
      const recentResponse = await fetch(`${API_URL}/api/v1/videos/recent?limit=20`);
      if (recentResponse.ok) {
        const recentData = await recentResponse.json();
        const allRecentVideos = recentData.videos || [];
        
        // Filter out videos that are already in trending (to avoid duplicates)
        // Handle both Petflix videos (with id) and YouTube videos (with youtubeVideoId)
        const trendingVideoIds = new Set(trendingVideos.map(v => v.id).filter(id => id != null));
        const trendingYouTubeIds = new Set(trendingVideos.map(v => v.youtubeVideoId).filter(id => id != null));
        const filtered = allRecentVideos.filter((v: any) => {
          // Skip if it's a Petflix video that's already in trending
          if (v.id && trendingVideoIds.has(v.id)) return false;
          // Skip if it's a YouTube video that's already in trending
          if (v.youtubeVideoId && trendingYouTubeIds.has(v.youtubeVideoId)) return false;
          return true;
        });
        
        setRecommendedVideos(filtered.slice(0, 10));
      } else {
        setRecommendedVideos([]);
      }
    } catch (err) {
      // Error loading recommended videos - set empty array
      setRecommendedVideos([]);
    } finally {
      setRecommendedLoading(false);
    }
  };


  // Helper function to convert filter to singular display name
  const getFilterDisplayName = (filter: string | null): string => {
    if (!filter) return 'Trending Pet Videos';
    
    const filterMap: { [key: string]: string } = {
      'dogs': 'Dog',
      'cats': 'Cat',
      'birds': 'Bird',
      'small and fluffy': 'Small and Fluffy',
      'underwater': 'Underwater'
    };
    
    return filterMap[filter.toLowerCase()] || filter.charAt(0).toUpperCase() + filter.slice(1);
  };

  // Determine which videos to show (don't show search results inline - use dropdown only)
  const displayVideos = trendingVideos;
  const displayLoading = loading;
  const displayTitle = selectedFilter 
    ? `${getFilterDisplayName(selectedFilter)} Videos`
    : 'Trending Pet Videos';
  
  const filters = ['Dogs', 'Cats', 'Birds', 'Small and fluffy', 'Underwater'];
  
  // Map filter names to icons
  const filterIcons: { [key: string]: React.ReactNode } = {
    'Dogs': <Dog size={24} />,
    'Cats': <Cat size={24} />,
    'Birds': <Bird size={24} />,
    'Small and fluffy': <Rabbit size={24} />,
    'Underwater': <Fish size={24} />
  };
  

      // Only show full page loading on initial load, not filter changes
      if (authLoading || (loading && !filterLoading)) {
        return (
          <div style={{
            minHeight: '100vh',
            backgroundColor: '#0F0F0F',
            padding: '40px'
          }}>
            <div className="content-container" style={{ 
              maxWidth: '100%',
              margin: '0 auto', 
              padding: '0 40px',
            }}>
              <VideoGridSkeleton count={10} />
            </div>
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
            max-width: 90vw !important;
            margin-left: auto !important;
            margin-right: auto !important;
            display: flex !important;
            flex-direction: row !important;
            justify-content: flex-start !important;
            align-items: stretch !important;
            gap: 8px !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
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
            height: 120px !important;
            min-height: 120px !important;
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
                      onClick={() => handleHeroButtonClick(item.id)}
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
      <div className="filter-container" style={{
            marginBottom: '30px',
            marginTop: '-100px', // Pull up to overlap with banner fade area
            display: 'flex',
            gap: '8px',
            position: 'relative',
            zIndex: 2, // Above banner
            width: '100%'
          }}>
            {filters.map((filter) => {
              const icon = filterIcons[filter];
              const isSelected = selectedFilter === filter;
              return (
                <button
                  key={filter}
                  className="filter-button"
                  onClick={() => setSelectedFilter(isSelected ? null : filter)}
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
        
        {/* Videos Section */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#ffffff', margin: 0 }}>{displayTitle}</h2>
            {!selectedFilter && (
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
          
          {!displayLoading && displayVideos.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#ffffff' }}>
                No videos found. Try searching for pet videos!
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
                  <VideoCard key={video.id || `youtube_${video.youtubeVideoId}`} video={video} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recommended for You Section */}
        <div style={{ marginTop: '60px', marginBottom: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#ffffff', margin: 0 }}>Recommended for you</h2>
          </div>
          
          {recommendedLoading && recommendedVideos.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#ffffff' }}>Loading recommendations...</p>
            </div>
          )}

          {!recommendedLoading && recommendedVideos.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: '#1a1a1a',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#ffffff' }}>
                No recommendations available. Start liking videos to get personalized recommendations!
              </p>
            </div>
          )}

          {!recommendedLoading && recommendedVideos.length > 0 && (
            <div className="video-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {recommendedVideos.map((video) => (
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
