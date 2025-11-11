import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreVertical } from 'lucide-react';

interface VideoCardProps {
  video: {
    id: string;
    youtubeVideoId?: string;
    title: string;
    description?: string;
    thumbnail?: string;
    user?: {
      id: string;
      username: string;
      profile_picture_url?: string | null;
    };
    createdAt?: string;
    viewCount?: number | string;
    duration?: string; // Format: "MM:SS" or "H:MM:SS"
  };
}

export default function VideoCard({ video }: VideoCardProps) {
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Generate YouTube thumbnail URL if not provided
  // Try multiple thumbnail quality options
  const getThumbnailUrl = () => {
    if (video.thumbnail) return video.thumbnail;
    if (video.youtubeVideoId) {
      // Try maxresdefault first, fallback to hqdefault, then mqdefault
      return `https://img.youtube.com/vi/${video.youtubeVideoId}/maxresdefault.jpg`;
    }
    return null;
  };
  
  const thumbnailUrl = getThumbnailUrl();

  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (e) {
      return '';
    }
  };

  // Format view count
  const formatViews = (views?: number | string) => {
    if (!views) return '0 views';
    const numViews = typeof views === 'string' ? parseInt(views) : views;
    if (numViews < 1000) return `${numViews} views`;
    if (numViews < 1000000) return `${(numViews / 1000).toFixed(1)}K views`;
    return `${(numViews / 1000000).toFixed(1)}M views`;
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on the menu
    if ((e.target as HTMLElement).closest('.video-menu')) {
      return;
    }
    navigate(`/video/${video.id}`);
  };

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      onClick={handleCardClick}
    >
      {/* Thumbnail with duration overlay */}
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000' }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Fallback to lower quality thumbnail if image fails to load
              const target = e.target as HTMLImageElement;
              if (video.youtubeVideoId) {
                // Try different quality levels
                const currentSrc = target.src;
                if (currentSrc.includes('maxresdefault')) {
                  target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
                } else if (currentSrc.includes('hqdefault')) {
                  target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/mqdefault.jpg`;
                } else if (currentSrc.includes('mqdefault')) {
                  target.src = `https://img.youtube.com/vi/${video.youtubeVideoId}/default.jpg`;
                } else {
                  // Last resort - show placeholder
                  target.style.display = 'none';
                }
              } else {
                target.style.display = 'none';
              }
            }}
          />
        ) : (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#36454F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '14px'
          }}>
            No thumbnail
          </div>
        )}
        {/* Duration badge */}
        {video.duration && (
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: '#fff',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {video.duration}
          </div>
        )}
      </div>

      {/* Video Info */}
      <div style={{ padding: '12px' }}>
        {/* Title row with profile picture and menu */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
          {/* User profile picture */}
          {video.user?.profile_picture_url ? (
            <img
              src={video.user.profile_picture_url}
              alt={video.user.username}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
                flexShrink: 0
              }}
            />
          ) : (
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#ADD8E6',
              color: '#36454F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              flexShrink: 0
            }}>
              {video.user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}

          {/* Title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              color: '#36454F',
              margin: 0,
              fontSize: '14px',
              fontWeight: '500',
              lineHeight: '1.4',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {video.title}
            </h3>
          </div>

          {/* Action menu (3 dots) */}
          <div
            ref={menuRef}
            className="video-menu"
            style={{ position: 'relative', flexShrink: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical
              size={20}
              color="#666"
              style={{ cursor: 'pointer' }}
            />
            {showMenu && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                backgroundColor: 'white',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                minWidth: '160px',
                zIndex: 1000,
                border: '1px solid #e0e0e0'
              }}>
                <button
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#36454F'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement menu actions
                    setShowMenu(false);
                  }}
                >
                  Add to playlist
                </button>
                <button
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#36454F'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement menu actions
                    setShowMenu(false);
                  }}
                >
                  Share
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Username */}
        {video.user?.username && (
          <div style={{ marginLeft: '48px', marginBottom: '4px' }}>
            <span style={{ color: '#666', fontSize: '13px' }}>
              {video.user.username}
            </span>
          </div>
        )}

        {/* Views and date */}
        <div style={{ marginLeft: '48px' }}>
          <span style={{ color: '#666', fontSize: '13px' }}>
            {formatViews(video.viewCount)} • {formatDate(video.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}

