import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoCard from '../components/VideoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setSearchParams({ q: searchQuery });

    try {
      // Search via backend API (will implement YouTube integration)
      const response = await fetch(`${API_URL}/api/v1/videos/search?q=${encodeURIComponent(searchQuery)}`);
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

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#36454F',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ color: '#ffffff', marginBottom: '30px' }}>Search Pet Videos</h1>

        {/* Search Bar */}
        <form onSubmit={handleSearch} style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Search for pet videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '12px',
                fontSize: '16px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 30px',
                backgroundColor: '#ADD8E6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div style={{
            backgroundColor: '#ffebee',
            color: '#c62828',
            padding: '12px',
            borderRadius: '6px',
            marginBottom: '20px'
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
