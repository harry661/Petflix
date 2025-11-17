import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import VideoCard from '../components/VideoCard';

import { API_URL } from '../config/api';

export default function FeedPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [videos, setVideos] = useState<any[]>([]);
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
      setVideos(data.videos || []);
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
        <h1 style={{ color: '#ffffff', marginBottom: '30px', fontSize: '32px', fontWeight: '600' }}>Following</h1>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '30px', fontSize: '16px' }}>
          Videos from users you follow
        </p>

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
