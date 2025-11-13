import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
    description?: string;
    visibility: 'public' | 'private';
    createdAt: string;
    updatedAt: string;
  };
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const navigate = useNavigate();
  const [videoCount, setVideoCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlaylistDetails();
  }, [playlist.id]);

  const loadPlaylistDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_URL}/api/v1/playlists/${playlist.id}`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setVideoCount(data.videos?.length || 0);
        const thumbs = (data.videos || [])
          .slice(0, 4)
          .map((v: any) => {
            if (v.youtubeVideoId) {
              return `https://img.youtube.com/vi/${v.youtubeVideoId}/hqdefault.jpg`;
            }
            return null;
          })
          .filter(Boolean);
        setThumbnails(thumbs);
      }
    } catch (err) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Thumbnail grid */}
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        backgroundColor: '#1a1a1a',
        display: 'grid',
        gridTemplateColumns: thumbnails.length > 1 ? '1fr 1fr' : '1fr',
        gridTemplateRows: thumbnails.length > 2 ? '1fr 1fr' : '1fr',
        gap: '2px'
      }}>
        {loading ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '14px'
          }}>
            Loading...
          </div>
        ) : thumbnails.length > 0 ? (
          thumbnails.map((thumb, idx) => (
            <img
              key={idx}
              src={thumb}
              alt=""
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          ))
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '14px'
          }}>
            No videos
          </div>
        )}
      </div>
      {/* Playlist info */}
      <div style={{ padding: '12px' }}>
        <h3 style={{
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: '600',
          margin: '0 0 4px 0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {playlist.name}
        </h3>
        <p style={{
          color: 'rgba(255, 255, 255, 0.6)',
          fontSize: '14px',
          margin: 0
        }}>
          {loading ? '...' : `${videoCount} ${videoCount === 1 ? 'video' : 'videos'}`}
        </p>
      </div>
    </div>
  );
}

