import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpDown, X, Clock } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import { useAuth } from '../hooks/useAuth';

import { API_URL } from '../config/api';

export default function SearchPage() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const handleSearch = async (e?: React.FormEvent, newSort?: string) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    const currentSort = newSort || sortBy;
    setLoading(true);
    setError('');
    setSearchParams({ q: searchQuery, sort: currentSort });

    try {
      const response = await fetch(`${API_URL}/api/v1/videos/search?q=${encodeURIComponent(searchQuery)}&sort=${currentSort}`);
      const data = await response.json();
      
      if (response.ok) {
        setResults(data.videos || []);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err: any) {
      setError('Failed to search videos. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const query = searchParams.get('q');
    const sort = searchParams.get('sort') || 'relevance';
    if (query) {
      setSearchQuery(query);
      setSortBy(sort);
      handleSearch(undefined, sort);
    }
    loadSearchHistory();
  }, [searchParams, isAuthenticated]);

  const loadSearchHistory = async () => {
    if (!isAuthenticated) {
      setSearchHistory([]);
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/videos/search-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data.history || []);
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleClearHistory = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/videos/search-history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSearchHistory([]);
      }
    } catch (err) {
      // Silently fail
    }
  };

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
    setSearchParams({ q: query, sort: sortBy });
    handleSearch(undefined, sortBy);
    setShowHistory(false);
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
      `}</style>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        padding: '20px'
      }}>
      <div className="page-content-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
        <h1 style={{ color: '#ffffff', marginBottom: '30px', fontSize: '32px', fontWeight: '600' }}>Search Pet Videos</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                placeholder="Search for pet videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ADD8E6';
                  e.target.style.borderWidth = '1px';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  setShowHistory(true);
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.borderWidth = '1px';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  // Delay hiding history to allow clicks
                  setTimeout(() => setShowHistory(false), 200);
                }}
              />
              {/* Search History Dropdown */}
              {showHistory && isAuthenticated && searchHistory.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.95)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                  zIndex: 1000,
                  maxHeight: '300px',
                  overflowY: 'auto'
                }}>
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '12px', fontWeight: '600' }}>
                      Recent Searches
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearHistory();
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.5)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="Clear history"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {searchHistory.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleHistoryClick(item)}
                      style={{
                        padding: '12px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Clock size={16} color="rgba(255, 255, 255, 0.5)" />
                      <span style={{ color: '#ffffff', fontSize: '14px', flex: 1 }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 30px',
                backgroundColor: '#ADD8E6',
                color: '#0F0F0F',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = '#87CEEB';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ADD8E6';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Sort Options */}
        {results.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0, fontSize: '14px' }}>
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ArrowUpDown size={16} color="rgba(255, 255, 255, 0.7)" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  handleSearch(undefined, e.target.value);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ADD8E6';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                <option value="relevance">Relevance</option>
                <option value="recency">Most Recent</option>
                <option value="views">Most Views</option>
                <option value="engagement">Most Liked</option>
              </select>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(198, 40, 40, 0.2)',
            color: '#ff6b6b',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            border: '1px solid rgba(198, 40, 40, 0.4)'
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {loading && <p style={{ color: '#ffffff' }}>Searching...</p>}
        
        {!loading && results.length === 0 && searchQuery && (
          <p style={{ color: '#ffffff', textAlign: 'center', padding: '40px' }}>
            No results found. Try different keywords.
          </p>
        )}

        {!loading && results.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {results.map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}

        {!searchQuery && (
          <div style={{ textAlign: 'center', padding: '60px', color: '#ffffff' }}>
            <p style={{ fontSize: '18px', marginBottom: '20px' }}>
              Enter keywords to search for pet videos
            </p>
            <p style={{ fontSize: '14px' }}>
              Try searching for: "funny cats", "dog tricks", "pet care", etc.
            </p>
          </div>
        )}
      </div>
      </div>
    </>
  );
}
