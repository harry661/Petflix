import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import VideoCard from '../components/VideoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function FeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) {
      return; // Still checking auth
    }
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadFeed();
  }, [isAuthenticated, authLoading]);

  const loadFeed = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/videos/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setVideos(data.videos || []);
      } else {
        setError(data.error || 'Failed to load feed');
      }
    } catch (err: any) {
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#1E1E1E',
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
        backgroundColor: '#1E1E1E',
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#c62828' }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1E1E1E',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#ffffff', marginBottom: '30px' }}>Your Feed</h1>
        <p style={{ color: '#ffffff', marginBottom: '30px' }}>
          Videos from users you follow
        </p>

        {videos.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ color: '#ffffff', fontSize: '24px', marginBottom: '15px' }}>
              Welcome to Petflix! 🐾
            </h2>
            <p style={{ color: '#ffffff', fontSize: '18px', marginBottom: '20px' }}>
              Your feed is empty
            </p>
            <p style={{ color: '#999', fontSize: '14px', marginBottom: '30px' }}>
              Follow other users to see their shared videos here, or start by searching for pet videos!
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <a
                href="/search"
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ADD8E6',
                  color: '#ffffff',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold'
                }}
              >
                Search Videos
              </a>
            </div>
          </div>
        ) : (
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
