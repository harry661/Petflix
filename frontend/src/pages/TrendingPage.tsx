import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import { Dog, Cat, Bird, Rabbit, Fish } from 'lucide-react';

import { API_URL } from '../config/api';

export default function TrendingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag') || '';
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadTrendingVideos = useCallback(async (reset: boolean = false, currentOffset?: number) => {
    try {
      if (reset) {
        setLoading(true);
        setVideos([]);
        setOffset(0);
        currentOffset = 0;
      } else {
        setLoadingMore(true);
        currentOffset = currentOffset ?? offset;
      }
      setError('');
      
      const limit = 20; // Load 20 videos at a time
      
      // Build URL with tag filter and pagination
      let url = `${API_URL}/api/v1/videos/recent?limit=${limit}&offset=${currentOffset}`;
      if (tagFilter) {
        url += `&tag=${encodeURIComponent(tagFilter)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const newVideos = data.videos || [];
        
        if (reset) {
          setVideos(newVideos);
          setOffset(newVideos.length);
        } else {
          setVideos(prev => [...prev, ...newVideos]);
          setOffset(prev => prev + newVideos.length);
        }
        
        setHasMore(data.hasMore !== false && newVideos.length === limit);
      } else {
        setError('Failed to load trending videos');
      }
    } catch (err: any) {
      setError('Failed to load trending videos. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tagFilter, offset]);

  // Reset and load when filter changes
  useEffect(() => {
    loadTrendingVideos(true);
  }, [tagFilter]); // Only depend on tagFilter, not the function

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadTrendingVideos(false);
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadingMore, loadTrendingVideos]);

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
        padding: '40px'
      }}>
      <div className="page-content-container" style={{ 
        maxWidth: '100%',
        margin: '0 auto',
        padding: '0 40px'
      }}>
        <h1 style={{ color: '#ffffff', marginBottom: '30px' }}>
          {tagFilter 
            ? `${tagFilter.charAt(0).toUpperCase() + tagFilter.slice(1)} Trending Videos`
            : 'Trending Pet Videos'}
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
                  padding: '16px 20px',
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
                  height: '80px',
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

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            color: '#ff6b6b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px'
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {loading && videos.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px'
          }}>
            <p style={{ color: '#ffffff' }}>Loading trending videos...</p>
          </div>
        )}
        
        {!loading && videos.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px'
          }}>
            <p style={{ color: '#ffffff' }}>
              No trending videos found. Try selecting a different filter.
            </p>
          </div>
        )}

        {videos.length > 0 && (
          <>
            <div className="video-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={observerTarget} style={{ height: '20px', marginTop: '20px' }}>
              {loadingMore && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: '#ffffff'
                }}>
                  <p>Loading more videos...</p>
                </div>
              )}
              {!hasMore && videos.length > 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'rgba(255, 255, 255, 0.7)'
                }}>
                  <p>You've reached the end of trending videos!</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      </div>
    </>
  );
}
