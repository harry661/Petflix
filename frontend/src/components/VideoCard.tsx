import { useState, useRef, useEffect, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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
    originalUser?: {
      id: string;
      username: string;
      profile_picture_url?: string | null;
    };
    createdAt?: string;
    viewCount?: number | string;
    duration?: string; // Format: "MM:SS" or "H:MM:SS"
  };
}

function VideoCard({ video }: VideoCardProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [canRepost, setCanRepost] = useState<boolean | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Generate YouTube thumbnail URL if not provided
  // Use hqdefault as default (more reliable than maxresdefault)
  const getThumbnailUrl = () => {
    // If thumbnail is explicitly provided and not null/empty, use it
    if (video.thumbnail && video.thumbnail.trim() !== '') {
      return video.thumbnail;
    }
    // Otherwise, try to generate from youtubeVideoId
    if (video.youtubeVideoId && video.youtubeVideoId.trim() !== '') {
      // Validate it's a proper YouTube video ID format (11 characters)
      if (/^[a-zA-Z0-9_-]{11}$/.test(video.youtubeVideoId)) {
        return `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
      }
    }
    return null;
  };
  
  const thumbnailUrl = getThumbnailUrl();

  // Format date - calculate based on calendar days, not 24-hour periods
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return '';
      }
      
      // Get dates at midnight (start of day) to calculate calendar days
      const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const nowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Calculate difference in calendar days
      const diffMs = nowStart.getTime() - dateStart.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      // Handle future dates (shouldn't happen, but just in case)
      if (diffDays < 0) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
      }
      if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `${months} ${months === 1 ? 'month' : 'months'} ago`;
      }
      const years = Math.floor(diffDays / 365);
      return `${years} ${years === 1 ? 'year' : 'years'} ago`;
    } catch (e) {
      console.error('Error formatting date:', e, dateString);
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

  // Check if user can repost this video
  useEffect(() => {
    if (!isAuthenticated || !user || !video.id) {
      setCanRepost(false);
      return;
    }

    // Quick check: if user owns this video, they can't repost
    const displayUser = video.originalUser || video.user;
    if (displayUser?.id === user.id) {
      setCanRepost(false);
      return;
    }

    // Check with backend
    const checkCanRepost = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const token = localStorage.getItem('auth_token');
        
        const response = await fetch(`${API_URL}/api/v1/videos/${video.id}/can-repost`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCanRepost(data.canRepost || false);
        } else {
          setCanRepost(false);
        }
      } catch (err) {
        setCanRepost(false);
      }
    };

    checkCanRepost();
  }, [isAuthenticated, user, video.id, video.user?.id, video.originalUser?.id]);

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
        backgroundColor: 'transparent',
        borderRadius: '8px',
        overflow: 'visible', // Changed to visible so dropdown isn't clipped
        boxShadow: 'none',
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        position: 'relative', // Ensure positioning context
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
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#1a1a1a', overflow: 'hidden', borderRadius: '8px 8px 0 0' }}>
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={video.title}
            loading="lazy"
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
            backgroundColor: '#0F0F0F',
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
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {/* User profile picture - clickable link */}
          {/* For reposted videos, show original user's profile */}
          {(() => {
            const displayUser = video.originalUser || video.user;
            return displayUser?.username ? (
              <Link
                to={`/user/${displayUser.username}`}
                onClick={(e) => e.stopPropagation()}
                style={{
                  textDecoration: 'none',
                  flexShrink: 0
                }}
              >
                {displayUser?.profile_picture_url ? (
                  <img
                    src={displayUser.profile_picture_url}
                    alt={displayUser.username}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  />
                ) : (
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: '#ADD8E6',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    {displayUser?.username?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
              </Link>
            ) : (
              // Fallback if no user
              displayUser?.profile_picture_url ? (
                <img
                  src={displayUser.profile_picture_url}
                  alt={displayUser.username || 'User'}
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
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  {displayUser?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )
            );
          })()}

          {/* Right side: Title, username, views/date */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title row with menu */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
              {/* Title */}
              <h3 style={{
                color: '#ffffff',
                margin: 0,
                fontSize: '14px',
                fontWeight: '500',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                flex: 1,
                minWidth: 0
              }}>
                {video.title}
              </h3>

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
                  color="#ffffff"
                  style={{ cursor: 'pointer' }}
                />
                {showMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '4px',
                    backgroundColor: '#1a1a1a',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    minWidth: '160px',
                    zIndex: 10000, // Higher z-index to ensure it's above everything
                    border: '1px solid rgba(255, 255, 255, 0.2)'
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
                        color: '#ffffff'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement menu actions
                        setShowMenu(false);
                      }}
                    >
                      Add to playlist
                    </button>
                    {canRepost !== false && (
                      <button
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: canRepost === true ? 'pointer' : 'not-allowed',
                          fontSize: '14px',
                          color: canRepost === true ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                          opacity: canRepost === null ? 0.5 : 1
                        }}
                        onMouseEnter={(e) => {
                          if (canRepost === true) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!isAuthenticated) {
                            alert('Please log in to repost videos');
                            setShowMenu(false);
                            return;
                          }

                          if (canRepost !== true) {
                            setShowMenu(false);
                            return;
                          }

                          setSharing(true);
                          try {
                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                            const token = localStorage.getItem('auth_token');
                            
                            const response = await fetch(`${API_URL}/api/v1/videos/${video.id}/repost`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                              },
                            });

                            const data = await response.json();

                            if (response.ok) {
                              alert('Video reposted successfully!');
                              // Optionally reload the page or update UI
                              window.location.reload();
                            } else {
                              alert(data.error || 'Failed to repost video');
                            }
                          } catch (err) {
                            alert('Failed to repost video. Please try again.');
                          } finally {
                            setSharing(false);
                            setShowMenu(false);
                          }
                        }}
                        disabled={sharing || canRepost !== true}
                      >
                        {sharing ? 'Reposting...' : 'Repost'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Username - clickable link */}
            {/* For reposted videos, show original user's username */}
            {(() => {
              const displayUser = video.originalUser || video.user;
              return displayUser?.username && (
                <div style={{ marginBottom: '2px' }}>
                  <Link
                    to={`/user/${displayUser.username}`}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '13px',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      transition: 'color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#ADD8E6'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                  >
                    {displayUser.username}
                  </Link>
                </div>
              );
            })()}

            {/* Views and date */}
            <div>
              <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '13px' }}>
                {formatViews(video.viewCount)} • {formatDate(video.createdAt)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(VideoCard);

