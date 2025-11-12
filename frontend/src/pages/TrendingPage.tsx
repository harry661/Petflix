import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TrendingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag') || '';
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadTrendingVideos();
  }, [tagFilter]);

  const loadTrendingVideos = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build URL with tag filter if selected
      let url = `${API_URL}/api/v1/videos/recent?limit=50`;
      if (tagFilter) {
        url += `&tag=${encodeURIComponent(tagFilter)}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      } else {
        setError('Failed to load trending videos');
      }
    } catch (err: any) {
      setError('Failed to load trending videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filters = ['Dogs', 'Cats', 'Birds', 'Small and fluffy', 'Underwater'];
  
  // Map filter names to image filenames
  const filterImages: { [key: string]: string } = {
    'Dogs': '/dogs-filter.png',
    'Cats': '/cats-filter.png',
    'Birds': '/birds-filter.png',
    'Small and fluffy': '/smalls-filter.png',
    'Underwater': '/aquatic-filter.png'
  };

  const handleFilterClick = (filter: string) => {
    if (tagFilter === filter.toLowerCase()) {
      setSearchParams({});
    } else {
      setSearchParams({ tag: filter.toLowerCase() });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F0F',
      padding: '40px'
    }}>
      <div style={{ 
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
            const imageUrl = filterImages[filter];
            const isSelected = tagFilter === filter.toLowerCase();
            return (
              <button
                key={filter}
                onClick={() => handleFilterClick(filter)}
                style={{
                  flex: 1,
                  padding: 0,
                  borderRadius: '8px',
                  border: isSelected ? '3px solid #ADD8E6' : '3px solid transparent',
                  backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                  backgroundColor: imageUrl ? 'transparent' : (isSelected ? '#ADD8E6' : '#f5f5f5'),
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 4px 12px rgba(173, 216, 230, 0.5)' : '0 2px 8px rgba(0,0,0,0.2)',
                  minWidth: 0,
                  aspectRatio: '298 / 166',
                  width: '100%',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                  }
                }}
              >
                {/* Subtle overlay when selected */}
                {isSelected && (
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
        {loading && (
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

        {!loading && videos.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {videos.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

