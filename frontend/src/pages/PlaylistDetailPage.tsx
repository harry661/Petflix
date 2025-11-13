import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Play, Shuffle, MoreVertical, Trash2, X } from 'lucide-react';
import VideoCard from '../components/VideoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [playlist, setPlaylist] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [removingVideoId, setRemovingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadPlaylist();
    }
  }, [id, isAuthenticated]);

  const loadPlaylist = async () => {
    if (!id) return;
    
    setLoading(true);
    setError('');
    
    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/playlists/${id}`, {
        headers,
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylist(data);
        setVideos(data.videos || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Playlist not found');
      }
    } catch (err: any) {
      setError('Failed to load playlist');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!id || !isAuthenticated || !user) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/playlists/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        navigate('/user/' + user.username);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete playlist');
      }
    } catch (err) {
      alert('Failed to delete playlist. Please try again.');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!id || !isAuthenticated || !user) return;

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    setRemovingVideoId(videoId);
    try {
      const response = await fetch(`${API_URL}/api/v1/playlists/${id}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Remove video from local state
        setVideos(videos.filter(v => v.id !== videoId));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to remove video from playlist');
      }
    } catch (err) {
      alert('Failed to remove video. Please try again.');
    } finally {
      setRemovingVideoId(null);
    }
  };

  const getThumbnailUrl = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  };

  const createThumbnailCollage = () => {
    if (videos.length === 0) {
      return null;
    }

    const firstFour = videos.slice(0, 4);
    if (firstFour.length === 1) {
      const video = firstFour[0];
      const thumbnail = video.thumbnail || getThumbnailUrl(video.youtubeVideoId || '');
      return (
        <div style={{
          width: '100%',
          aspectRatio: '16/9',
          borderRadius: '12px',
          overflow: 'hidden',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          position: 'relative'
        }}>
          <img
            src={thumbnail}
            alt={video.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
            }}
          />
        </div>
      );
    }

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gridTemplateRows: 'repeat(2, 1fr)',
        gap: '4px',
        width: '100%',
        aspectRatio: '16/9',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.1)'
      }}>
        {firstFour.map((video, index) => {
          const thumbnail = video.thumbnail || getThumbnailUrl(video.youtubeVideoId || '');
          return (
            <div key={video.id || index} style={{ position: 'relative', overflow: 'hidden' }}>
              <img
                src={thumbnail}
                alt={video.title}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const getTotalViews = () => {
    return videos.reduce((sum, video) => {
      const views = typeof video.viewCount === 'string' ? parseInt(video.viewCount) : (video.viewCount || 0);
      return sum + views;
    }, 0);
  };

  const isOwner = isAuthenticated && user && playlist && playlist.userId === user.id;

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff'
      }}>
        Loading playlist...
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F0F0F',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ffffff',
        padding: '40px'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>{error || 'Playlist not found'}</h1>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#ADD8E6',
            color: '#0F0F0F',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F0F',
      padding: '40px 0',
      color: '#ffffff'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 40px',
        display: 'flex',
        gap: '40px',
        alignItems: 'flex-start'
      }}>
        {/* Left Panel - Playlist Info */}
        <div style={{
          width: '33%',
          minWidth: '300px',
          backgroundColor: 'rgba(139, 69, 19, 0.3)',
          background: 'linear-gradient(180deg, rgba(139, 69, 19, 0.4) 0%, rgba(139, 69, 19, 0.2) 50%, rgba(0, 0, 0, 0.3) 100%)',
          borderRadius: '16px',
          padding: '24px',
          position: 'sticky',
          top: '100px',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto'
        }}>
          {/* Thumbnail Collage */}
          <div style={{ marginBottom: '24px' }}>
            {createThumbnailCollage() || (
              <div style={{
                width: '100%',
                aspectRatio: '16/9',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                No videos
              </div>
            )}
          </div>

          {/* Title */}
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            margin: '0 0 12px 0',
            color: '#ffffff',
            lineHeight: '1.2'
          }}>
            {playlist.name}
          </h1>

          {/* Creator Info */}
          {playlist.user && (
            <div style={{ marginBottom: '16px' }}>
              <Link
                to={`/user/${playlist.user.username}`}
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  textDecoration: 'none',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: 'fit-content'
                }}
                onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}
              >
                {playlist.user.profile_picture_url && (
                  <img
                    src={playlist.user.profile_picture_url}
                    alt={playlist.user.username}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                )}
                <span>{playlist.user.username}</span>
              </Link>
            </div>
          )}

          {/* Stats */}
          <div style={{
            marginBottom: '20px',
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '14px'
          }}>
            <div>{videos.length} {videos.length === 1 ? 'video' : 'videos'}</div>
            <div>{getTotalViews().toLocaleString()} views</div>
            <div>Last updated {formatDate(playlist.updatedAt)}</div>
          </div>

          {/* Description */}
          {playlist.description && (
            <div style={{
              marginBottom: '20px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {playlist.description}
            </div>
          )}

          {/* Menu Button */}
          {isOwner && (
            <div style={{ position: 'relative', marginBottom: '20px' }}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <MoreVertical size={20} />
              </button>
              {showMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  backgroundColor: '#1a1a1a',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  padding: '8px 0',
                  minWidth: '180px',
                  zIndex: 1000,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
                }}>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '8px 16px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#ff6b6b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <Trash2 size={16} />
                    Delete Playlist
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {videos.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => {
                  if (videos.length > 0) {
                    navigate(`/video/${videos[0].id}`);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  color: '#0F0F0F',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: videos.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (videos.length > 0) {
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (videos.length > 0) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                  }
                }}
                disabled={videos.length === 0}
              >
                <Play size={20} fill="#0F0F0F" />
                Play all
              </button>
              <button
                onClick={() => {
                  if (videos.length > 0) {
                    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
                    navigate(`/video/${randomVideo.id}`);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: videos.length > 0 ? 'pointer' : 'not-allowed',
                  fontWeight: '600',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (videos.length > 0) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (videos.length > 0) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  }
                }}
                disabled={videos.length === 0}
              >
                <Shuffle size={20} />
                Shuffle
              </button>
            </div>
          )}
        </div>

        {/* Right Panel - Video List */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {videos.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '80px 20px',
              color: 'rgba(255, 255, 255, 0.7)'
            }}>
              <p style={{ fontSize: '18px', marginBottom: '8px' }}>This playlist is empty</p>
              <p style={{ fontSize: '14px' }}>Add videos to get started!</p>
            </div>
          ) : (
            <div>
              {videos.map((video, index) => (
                <div
                  key={video.id}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '16px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onClick={() => navigate(`/video/${video.id}`)}
                >
                  {/* Thumbnail */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={video.thumbnail || getThumbnailUrl(video.youtubeVideoId || '')}
                      alt={video.title}
                      style={{
                        width: '200px',
                        aspectRatio: '16/9',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg`;
                      }}
                    />
                    {video.duration && (
                      <div style={{
                        position: 'absolute',
                        bottom: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        color: '#ffffff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {video.duration}
                      </div>
                    )}
                  </div>

                  {/* Video Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      margin: '0 0 8px 0',
                      color: '#ffffff',
                      lineHeight: '1.4',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {video.title}
                    </h3>
                    <div style={{
                      fontSize: '14px',
                      color: 'rgba(255, 255, 255, 0.7)',
                      marginBottom: '4px'
                    }}>
                      {video.user?.username || 'Unknown'} {video.originalUser && video.originalUser.id !== video.userId && `· Reposted from ${video.originalUser.username}`}
                    </div>
                    <div style={{
                      fontSize: '13px',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {typeof video.viewCount === 'number' ? video.viewCount.toLocaleString() : (video.viewCount || '0')} views · {video.createdAt ? formatDate(video.createdAt) : 'Unknown date'}
                    </div>
                  </div>

                  {/* Remove Button (Owner only) */}
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Remove this video from the playlist?')) {
                          handleRemoveVideo(video.id);
                        }
                      }}
                      disabled={removingVideoId === video.id}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.5)',
                        cursor: removingVideoId === video.id ? 'not-allowed' : 'pointer',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => {
                        if (removingVideoId !== video.id) {
                          e.currentTarget.style.color = '#ff6b6b';
                          e.currentTarget.style.backgroundColor = 'rgba(255, 107, 107, 0.1)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (removingVideoId !== video.id) {
                          e.currentTarget.style.color = 'rgba(255, 255, 255, 0.5)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      {removingVideoId === video.id ? (
                        <div style={{ width: '16px', height: '16px', border: '2px solid rgba(255, 255, 255, 0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      ) : (
                        <X size={20} />
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
            zIndex: 100002
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '32px',
              maxWidth: '400px',
              width: '90%',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ color: '#ffffff', margin: '0 0 16px 0', fontSize: '20px', fontWeight: '600' }}>
              Delete Playlist
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', margin: '0 0 24px 0', fontSize: '14px', lineHeight: '1.5' }}>
              Are you sure you want to delete "{playlist.name}"? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePlaylist}
                disabled={deleting}
                style={{
                  padding: '10px 20px',
                  backgroundColor: deleting ? 'rgba(255, 107, 107, 0.5)' : '#ff6b6b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: deleting ? 'not-allowed' : 'pointer',
                  fontWeight: '600'
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
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

