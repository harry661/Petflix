import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    
    loadTrendingVideos();
  }, [isAuthenticated, authLoading]);

  const loadTrendingVideos = async () => {
    try {
      // Search for trending pet videos
      const response = await fetch(`${API_URL}/api/v1/videos/search?q=cats dogs pets&limit=12`);
      if (response.ok) {
        const data = await response.json();
        setTrendingVideos(data.videos || []);
      }
    } catch (err) {
      console.error('Error loading trending videos:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
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
        <div style={{ marginBottom: '40px', textAlign: 'center' }}>
          <h1 style={{ color: '#36454F', fontSize: '36px', marginBottom: '10px' }}>
            Welcome back, {user?.username}! 🐾
          </h1>
          <p style={{ color: '#666', fontSize: '18px' }}>
            Discover amazing pet videos from the community
          </p>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '40px'
        }}>
          <div
            onClick={() => navigate('/search')}
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔍</div>
            <h3 style={{ color: '#36454F', marginTop: 0 }}>Search Videos</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Find pet videos by keywords</p>
          </div>

          <div
            onClick={() => navigate('/feed')}
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📰</div>
            <h3 style={{ color: '#36454F', marginTop: 0 }}>Your Feed</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>Videos from users you follow</p>
          </div>

          <div
            onClick={() => navigate(`/user/${user?.username}`)}
            style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>👤</div>
            <h3 style={{ color: '#36454F', marginTop: 0 }}>Your Profile</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>View and edit your profile</p>
          </div>
        </div>

        {/* Trending Videos */}
        <div>
          <h2 style={{ color: '#36454F', marginBottom: '20px' }}>Trending Pet Videos</h2>
          {trendingVideos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: 'white',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#666' }}>No videos found. Try searching for pet videos!</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {trendingVideos.map((video) => (
                <div
                  key={video.id}
                  style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/video/${video.id}`)}
                >
                  {video.thumbnail && (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ padding: '15px' }}>
                    <h3 style={{ color: '#36454F', marginTop: 0, fontSize: '16px' }}>
                      {video.title}
                    </h3>
                    {video.description && (
                      <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                        {video.description.substring(0, 100)}...
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

