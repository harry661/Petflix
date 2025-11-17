import { useNavigate } from 'react-router-dom';
import { Lock, Calendar } from 'lucide-react';

interface PlaylistCardProps {
  playlist: {
    id: string;
    name: string;
    description?: string | null;
    visibility: 'public' | 'private';
    updated_at: string;
    videoCount?: number;
    thumbnails?: string[];
  };
}

export default function PlaylistCard({ playlist }: PlaylistCardProps) {
  const navigate = useNavigate();

  // Format date - calculate based on calendar days
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      const diffMs = nowStart.getTime() - dateStart.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Recently';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      }
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return months === 1 ? '1 month ago' : `${months} months ago`;
      }
      const years = Math.floor(diffDays / 365);
      return years === 1 ? '1 year ago' : `${years} years ago`;
    } catch {
      return 'Recently';
    }
  };

  const videoCount = playlist.videoCount || 0;
  const thumbnails = playlist.thumbnails || [];

  return (
    <div
      onClick={() => navigate(`/playlist/${playlist.id}`)}
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Thumbnail Preview */}
      <div style={{
        position: 'relative',
        width: '100%',
        paddingTop: '56.25%', // 16:9 aspect ratio
        backgroundColor: '#1a1a1a',
        overflow: 'hidden'
      }}>
        {thumbnails.length > 0 ? (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'grid',
            gridTemplateColumns: thumbnails.length === 1 ? '1fr' : '1fr 1fr',
            gridTemplateRows: thumbnails.length <= 2 ? '1fr' : '1fr 1fr',
            gap: '2px'
          }}>
            {thumbnails.map((thumbnail, index) => (
              <img
                key={index}
                src={thumbnail}
                alt=""
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ))}
          </div>
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#0F0F0F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.3)',
            fontSize: '14px'
          }}>
            No videos
          </div>
        )}
        
        {/* Video Count Badge */}
        {videoCount > 0 && (
          <div style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#ffffff',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600',
            backdropFilter: 'blur(4px)'
          }}>
            {videoCount} {videoCount === 1 ? 'video' : 'videos'}
          </div>
        )}
      </div>

      {/* Playlist Info */}
      <div style={{
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <h3 style={{
          color: '#ffffff',
          margin: 0,
          fontSize: '18px',
          fontWeight: '600',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {playlist.name}
        </h3>
        
        {playlist.description && (
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            margin: 0,
            fontSize: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4'
          }}>
            {playlist.description}
          </p>
        )}

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '4px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '12px'
          }}>
            {playlist.visibility === 'private' ? (
              <>
                <Lock size={12} />
                <span>Private</span>
              </>
            ) : (
              <span>Public</span>
            )}
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: '12px'
          }}>
            <Calendar size={12} />
            <span>Updated {formatDate(playlist.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

