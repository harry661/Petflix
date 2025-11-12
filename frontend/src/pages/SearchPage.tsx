import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowUpDown } from 'lucide-react';
import VideoCard from '../components/VideoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'relevance');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
  }, [searchParams]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F0F',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
        <h1 style={{ color: '#ffffff', marginBottom: '30px', fontSize: '32px', fontWeight: '600' }}>Search Pet Videos</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search for pet videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
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
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                e.target.style.borderWidth = '1px';
                e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
              }}
            />
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
  );
}
