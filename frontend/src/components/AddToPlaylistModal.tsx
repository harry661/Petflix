import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { X, Plus, Check, ExternalLink } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface Playlist {
  id: string;
  name: string;
  description?: string;
  visibility: 'public' | 'private';
  createdAt: string;
  updatedAt: string;
}

interface AddToPlaylistModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddToPlaylistModal({
  videoId,
  isOpen,
  onClose,
  onSuccess,
}: AddToPlaylistModalProps) {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [error, setError] = useState('');
  const [videoInPlaylists, setVideoInPlaylists] = useState<Set<string>>(new Set());
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadPlaylists();
    }
  }, [isOpen, isAuthenticated]);

  const loadPlaylists = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/playlists`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
        
        // Check which playlists already contain this video
        const playlistIds = new Set<string>();
        for (const playlist of data.playlists || []) {
          try {
            const playlistRes = await fetch(`${API_URL}/api/v1/playlists/${playlist.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            if (playlistRes.ok) {
              const playlistData = await playlistRes.json();
              const hasVideo = playlistData.videos?.some((v: any) => v.id === videoId);
              if (hasVideo) {
                playlistIds.add(playlist.id);
              }
            }
          } catch (err) {
            // Silently fail for individual playlist checks
          }
        }
        setVideoInPlaylists(playlistIds);
      }
    } catch (err) {
      console.error('Error loading playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      setError('Playlist name is required');
      return;
    }

    setCreating(true);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Please log in to create playlists');
        setCreating(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newPlaylistName.trim(),
          description: newPlaylistDescription.trim() || undefined,
          visibility: 'private',
        }),
      });

      if (response.ok) {
        const newPlaylist = await response.json();
        setPlaylists([newPlaylist, ...playlists]);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setShowCreateForm(false);
        
        // Automatically add video to the new playlist
        await handleAddToPlaylist(newPlaylist.id);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create playlist');
      }
    } catch (err) {
      setError('Failed to create playlist. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (videoInPlaylists.has(playlistId)) {
      // Video already in playlist, remove it
      await handleRemoveFromPlaylist(playlistId);
      return;
    }

    setAddingToPlaylist(playlistId);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Please log in to add videos to playlists');
        setAddingToPlaylist(null);
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/playlists/${playlistId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId }),
      });

      if (response.ok) {
        setVideoInPlaylists(new Set([...videoInPlaylists, playlistId]));
        if (onSuccess) {
          onSuccess();
        }
      } else {
        const data = await response.json();
        // If already in playlist (409), just update state
        if (response.status === 409) {
          setVideoInPlaylists(new Set([...videoInPlaylists, playlistId]));
        } else {
          setError(data.error || 'Failed to add video to playlist');
        }
      }
    } catch (err) {
      setError('Failed to add video to playlist. Please try again.');
    } finally {
      setAddingToPlaylist(null);
    }
  };

  const handleRemoveFromPlaylist = async (playlistId: string) => {
    setAddingToPlaylist(playlistId);
    setError('');
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setAddingToPlaylist(null);
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/playlists/${playlistId}/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const newSet = new Set(videoInPlaylists);
        newSet.delete(playlistId);
        setVideoInPlaylists(newSet);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      setError('Failed to remove video from playlist. Please try again.');
    } finally {
      setAddingToPlaylist(null);
    }
  };

  if (!isOpen) return null;

  return (
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
        zIndex: 100002,
        animation: 'fadeIn 0.3s ease'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        style={{
          backgroundColor: '#1a1a1a',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          animation: 'scaleIn 0.4s ease'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px'
        }}>
          <h2 style={{
            color: '#ffffff',
            fontSize: '20px',
            fontWeight: '600',
            margin: 0
          }}>
            Add to playlist
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 107, 107, 0.2)',
            color: '#ff6b6b',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        {/* Create new playlist form */}
        {showCreateForm ? (
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px'
          }}>
            <h3 style={{
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              Create new playlist
            </h3>
            <input
              type="text"
              placeholder="Playlist name"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              maxLength={100}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ADD8E6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            />
            <textarea
              placeholder="Description (optional)"
              value={newPlaylistDescription}
              onChange={(e) => setNewPlaylistDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#ADD8E6';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              }}
            />
            <div style={{
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={handleCreatePlaylist}
                disabled={creating || !newPlaylistName.trim()}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: creating || !newPlaylistName.trim() ? 'rgba(173, 216, 230, 0.5)' : '#ADD8E6',
                  color: '#0F0F0F',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: creating || !newPlaylistName.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPlaylistName('');
                  setNewPlaylistDescription('');
                  setError('');
                }}
                style={{
                  padding: '10px 16px',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              backgroundColor: 'transparent',
              color: '#ADD8E6',
              border: '1px dashed rgba(173, 216, 230, 0.5)',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ADD8E6';
              e.currentTarget.style.backgroundColor = 'rgba(173, 216, 230, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(173, 216, 230, 0.5)';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <Plus size={18} />
            Create new playlist
          </button>
        )}

        {/* Playlists list */}
        {loading ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            Loading playlists...
          </div>
        ) : playlists.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'rgba(255, 255, 255, 0.7)'
          }}>
            No playlists yet. Create one to get started!
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {playlists.map((playlist) => {
              const isInPlaylist = videoInPlaylists.has(playlist.id);
              const isAdding = addingToPlaylist === playlist.id;
              
              return (
                <div
                  key={playlist.id}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: isInPlaylist ? 'rgba(173, 216, 230, 0.1)' : 'transparent',
                    border: isInPlaylist ? '1px solid #ADD8E6' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s ease',
                    opacity: isAdding ? 0.6 : 1
                  }}
                >
                  <button
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={isAdding}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'none',
                      border: 'none',
                      cursor: isAdding ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      padding: 0
                    }}
                  >
                    <div style={{
                      width: '24px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {isInPlaylist ? (
                        <Check size={20} color="#ADD8E6" />
                      ) : (
                        <div style={{
                          width: '20px',
                          height: '20px',
                          border: '2px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '4px'
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: '500',
                        marginBottom: '2px'
                      }}>
                        {playlist.name}
                      </div>
                      {playlist.description && (
                        <div style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '12px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {playlist.description}
                        </div>
                      )}
                    </div>
                    {isAdding && (
                      <div style={{
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '12px',
                        flexShrink: 0
                      }}>
                        {isInPlaylist ? 'Removing...' : 'Adding...'}
                      </div>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/playlist/${playlist.id}`);
                      onClose();
                    }}
                    style={{
                      padding: '6px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.7)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      flexShrink: 0
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.color = '#ADD8E6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                    }}
                    title="View playlist"
                  >
                    <ExternalLink size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}

