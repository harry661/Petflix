import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function FeedPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Please log in to view your feed');
      setLoading(false);
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
        backgroundColor: '#F0F0DC',
        padding: '40px',
        textAlign: 'center'
      }}>
        <p style={{ color: '#666' }}>Loading your feed...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F0F0DC',
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
      backgroundColor: '#F0F0DC',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#36454F', marginBottom: '30px' }}>Your Feed</h1>
        <p style={{ color: '#666', marginBottom: '30px' }}>
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
            <h2 style={{ color: '#36454F', fontSize: '24px', marginBottom: '15px' }}>
              Welcome to Petflix! 🐾
            </h2>
            <p style={{ color: '#666', fontSize: '18px', marginBottom: '20px' }}>
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
                  color: '#36454F',
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
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {videos.map((video) => (
              <div
                key={video.id}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => window.location.href = `/video/${video.id}`}
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
                  {video.user && (
                    <p style={{ color: '#999', fontSize: '12px', marginTop: '5px' }}>
                      Shared by {video.user.username}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
