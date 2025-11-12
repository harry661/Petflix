import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function TrendingPage() {
  const [searchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag');
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
      let url = `${API_URL}/api/v1/videos/recent?limit=50`; // Load more videos for full page
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

  const displayTitle = tagFilter 
    ? `${tagFilter.charAt(0).toUpperCase() + tagFilter.slice(1)} Videos`
    : 'Trending Pet Videos';

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
        <h1 style={{ color: '#ffffff', marginBottom: '30px' }}>{displayTitle}</h1>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(198, 40, 40, 0.2)',
            color: '#ff6b6b',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid rgba(198, 40, 40, 0.5)'
          }}>
            {error}
          </div>
        )}

        {/* Loading State */}
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

        {/* Empty State */}
        {!loading && videos.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: '#1a1a1a',
            borderRadius: '8px'
          }}>
            <p style={{ color: '#ffffff' }}>
              No trending videos found. Try different filters or check back later!
            </p>
          </div>
        )}

        {/* Videos Grid */}
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

