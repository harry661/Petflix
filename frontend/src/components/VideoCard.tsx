import { useState, useRef, useEffect, memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { MoreVertical, CheckCircle2, Trash2, XCircle } from 'lucide-react';
import AddToPlaylistModal from './AddToPlaylistModal';
import { API_URL } from '../config/api';

interface VideoCardProps {
  video: {
    id: string;
    youtubeVideoId?: string;
    title: string;
    description?: string;
    thumbnail?: string;
    userId?: string; // User who shared/reposted this video
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
  const [deleting, setDeleting] = useState(false);
  const [canRepost, setCanRepost] = useState<boolean | null>(null);
  const [showRepostSuccess, setShowRepostSuccess] = useState(false);
  const [showRepostError, setShowRepostError] = useState(false);
  const [repostErrorMessage, setRepostErrorMessage] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if current user owns this video (can delete it)
  // video.userId is the person who shared/reposted it - if it matches current user, they can delete
  // Note: We only check video.userId, not originalUser, because you can only delete videos YOU shared/reposted
  // CRITICAL: This must be a boolean, not a truthy check, to ensure proper rendering
  const canDelete = !!(isAuthenticated && user && video.userId === user.id);

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
    // Reset canRepost state
    setCanRepost(null);
    
    if (!isAuthenticated || !user || !video.id) {
      setCanRepost(false);
      return;
    }

    // CRITICAL: If user owns this video (as sharer OR original sharer), they CANNOT repost it
    // This must match the backend logic: checks both video.user_id and original_user_id
    // Also matches canDelete logic exactly
    // Check this FIRST before making any API calls
    // IMPORTANT: canDelete checks video.userId === user.id, so if canDelete is true, canRepost must be false
    if (video.userId === user.id) {
      // User owns this video (shared or reposted it) - cannot repost, can only delete
      setCanRepost(false);
      return;
    }
    
    // Also check if user is the original sharer (for reposted videos)
    if (video.originalUser?.id === user.id) {
      // User is the original sharer - cannot repost their own content
      setCanRepost(false);
      return;
    }

    // Only check with backend if user doesn't own the video
    const checkCanRepost = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          setCanRepost(false);
          return;
        }
        
        const response = await fetch(`${API_URL}/api/v1/videos/${video.id}/can-repost`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setCanRepost(data.canRepost === true);
        } else {
          setCanRepost(false);
        }
      } catch (err) {
        setCanRepost(false);
      }
    };

    checkCanRepost();
  }, [isAuthenticated, user?.id, video.id, video.userId, video.originalUser?.id]);

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

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    setDeleting(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch(`${API_URL}/api/v1/videos/${video.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Show success animation
        setShowDeleteSuccess(true);
        // Auto-hide after 2 seconds and reload
        setTimeout(() => {
          setShowDeleteSuccess(false);
          window.location.reload();
        }, 2000);
      } else {
        alert(data.error || 'Failed to remove video');
        setDeleting(false);
      }
    } catch (err) {
      alert('Failed to remove video. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Add to Playlist Modal */}
      {isAuthenticated && (
        <AddToPlaylistModal
          videoId={video.id}
          isOpen={showAddToPlaylistModal}
          onClose={() => setShowAddToPlaylistModal(false)}
          onSuccess={() => {
            // Optionally refresh or show success message
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100001,
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={(e) => {
            // Close on click outside
            if (e.target === e.currentTarget) {
              setShowDeleteConfirm(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'scaleIn 0.4s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 107, 107, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trash2 size={24} color="#ff6b6b" />
              </div>
              <h3 style={{
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '600',
                margin: 0
              }}>
                Remove Video
              </h3>
            </div>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              Are you sure you want to remove this video? This action cannot be undone.
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: deleting ? 'rgba(255, 107, 107, 0.5)' : '#ff6b6b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.backgroundColor = '#ff5252';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!deleting) {
                    e.currentTarget.style.backgroundColor = '#ff6b6b';
                  }
                }}
              >
                {deleting ? 'Removing...' : 'Remove'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Animation Overlay */}
      {showDeleteSuccess && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={(e) => {
            // Close on click outside
            if (e.target === e.currentTarget) {
              setShowDeleteSuccess(false);
            }
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '40px',
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'scaleIn 0.4s ease',
              minWidth: '300px'
            }}
          >
            <CheckCircle2 
              size={64} 
              color="#4CAF50" 
              style={{ animation: 'checkmark 0.5s ease' }} 
            />
            <p style={{ 
              color: '#fff', 
              fontSize: '20px', 
              fontWeight: '600', 
              margin: 0,
              textAlign: 'center'
            }}>
              Video removed successfully!
            </p>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '14px', 
              margin: 0,
              textAlign: 'center'
            }}>
              The video has been removed from your profile
            </p>
          </div>
        </div>
      )}

      {/* Repost Error Modal */}
      {showRepostError && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100001,
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={(e) => {
            // Close on click outside
            if (e.target === e.currentTarget) {
              setShowRepostError(false);
            }
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'scaleIn 0.4s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 107, 107, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <XCircle size={24} color="#ff6b6b" />
              </div>
              <h3 style={{
                color: '#ffffff',
                fontSize: '20px',
                fontWeight: '600',
                margin: 0
              }}>
                Cannot Repost Video
              </h3>
            </div>
            
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '24px'
            }}>
              {repostErrorMessage}
            </p>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowRepostError(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ff6b6b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff5252';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ff6b6b';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Repost Success Animation Overlay */}
      {showRepostSuccess && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
            animation: 'fadeIn 0.3s ease'
          }}
          onClick={(e) => {
            // Close on click outside
            if (e.target === e.currentTarget) {
              setShowRepostSuccess(false);
            }
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
              padding: '40px',
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'scaleIn 0.4s ease',
              minWidth: '300px'
            }}
          >
            <CheckCircle2 
              size={64} 
              color="#4CAF50" 
              style={{ animation: 'checkmark 0.5s ease' }} 
            />
            <p style={{ 
              color: '#fff', 
              fontSize: '20px', 
              fontWeight: '600', 
              margin: 0,
              textAlign: 'center'
            }}>
              Video reposted successfully!
            </p>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: '14px', 
              margin: 0,
              textAlign: 'center'
            }}>
              The video has been added to your profile
            </p>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.8);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes checkmark {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-45deg);
          }
          50% {
            opacity: 1;
            transform: scale(1.2) rotate(-45deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
      `}</style>
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
                        if (!isAuthenticated) {
                          alert('Please log in to add videos to playlists');
                          setShowMenu(false);
                          return;
                        }
                        setShowAddToPlaylistModal(true);
                        setShowMenu(false);
                      }}
                    >
                      Add to playlist
                    </button>
                    {/* Show Repost button ONLY if user doesn't own the video AND can repost */}
                    {/* IMPORTANT: canDelete must be false AND canRepost must be true */}
                    {/* Never show Repost if canDelete is true (user owns the video) */}
                    {!canDelete && canRepost === true && (
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
                            const token = localStorage.getItem('auth_token');
                            
                            const response = await fetch(`${API_URL}/api/v1/videos/${video.id}/repost`, {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                              },
                            });

                            const data = await response.json();

                            if (response.ok) {
                              // Show success animation
                              setShowRepostSuccess(true);
                              // Auto-hide after 2 seconds and reload
                              setTimeout(() => {
                                setShowRepostSuccess(false);
                                window.location.reload();
                              }, 2000);
                            } else {
                              // Show styled error modal
                              setRepostErrorMessage(data.error || 'Failed to repost video');
                              setShowRepostError(true);
                            }
                          } catch (err) {
                            // Show styled error modal
                            setRepostErrorMessage('Failed to repost video. Please try again.');
                            setShowRepostError(true);
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
                    {/* Show Remove button ONLY if user owns the video (shared or reposted it) */}
                    {/* IMPORTANT: canDelete must be true - this means video.userId === user.id */}
                    {/* If canDelete is true, canRepost should be false, so Remove shows instead of Repost */}
                    {canDelete && (
                      <button
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: deleting ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          color: deleting ? 'rgba(255, 255, 255, 0.5)' : '#ff6b6b'
                        }}
                        onMouseEnter={(e) => {
                          if (!deleting) {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isAuthenticated || !user) {
                            setShowMenu(false);
                            return;
                          }
                          // Show confirmation dialog
                          setShowDeleteConfirm(true);
                          setShowMenu(false);
                        }}
                        disabled={deleting}
                      >
                        {deleting ? 'Removing...' : 'Remove'}
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
    </>
  );
}

// Memoize component to prevent unnecessary re-renders
export default memo(VideoCard);

