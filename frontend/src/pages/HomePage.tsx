import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useSearch } from '../context/SearchContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { isSearchOpen, searchQuery, searchResults, isLoading: searchLoading, setSearchQuery, setSearchResults, setIsLoading } = useSearch();
  const [trendingVideos, setTrendingVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🏠 HomePage useEffect - authLoading:', authLoading, 'isAuthenticated:', isAuthenticated, 'user:', user);
    
    // Wait for auth check to complete
    if (authLoading) {
      console.log('⏳ Still loading auth...');
      return;
    }
    
    // If not authenticated, redirect to landing page
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, redirecting to landing page');
      navigate('/', { replace: true });
      return;
    }
    
    // Load videos only if authenticated and not searching
    if (isAuthenticated && user && !isSearchOpen) {
      console.log('✅ Authenticated, loading videos for user:', user.username);
      loadTrendingVideos();
    } else if (isAuthenticated && !user) {
      console.log('⚠️ Authenticated but no user data');
    }
  }, [isAuthenticated, authLoading, user, navigate, isSearchOpen]);

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

  // Determine which videos to show
  const displayVideos = isSearchOpen && searchQuery ? searchResults : trendingVideos;
  const displayLoading = isSearchOpen ? searchLoading : loading;
  const displayTitle = isSearchOpen && searchQuery 
    ? `Search results for "${searchQuery}"` 
    : 'Trending Pet Videos';

  if (authLoading || (displayLoading && !isSearchOpen)) {
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
        {/* Videos Section - Adapts to search or trending */}
        <div>
          <h2 style={{ color: '#36454F', marginBottom: '20px' }}>{displayTitle}</h2>
          
          {displayLoading && isSearchOpen && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: 'white',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#666' }}>Searching...</p>
            </div>
          )}

          {!displayLoading && displayVideos.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              backgroundColor: 'white',
              borderRadius: '8px'
            }}>
              <p style={{ color: '#666' }}>
                {isSearchOpen && searchQuery 
                  ? `No videos found for "${searchQuery}". Try different keywords.`
                  : 'No videos found. Try searching for pet videos!'}
              </p>
            </div>
          )}

          {!displayLoading && displayVideos.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '20px'
            }}>
              {displayVideos.map((video) => (
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

