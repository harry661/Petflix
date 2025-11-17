import { useState, useEffect } from 'react';
import { Plus, X, CheckCircle2 } from 'lucide-react';

import { API_URL } from '../config/api';

interface AddToPlaylistModalProps {
  videoId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AddToPlaylistModal({ videoId, isOpen, onClose, onSuccess }: AddToPlaylistModalProps) {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successPlaylistName, setSuccessPlaylistName] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadPlaylists();
    } else {
      setShowCreateForm(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setError('');
      setShowSuccess(false);
      setSuccessPlaylistName('');
    }
  }, [isOpen]);

  const loadPlaylists = async () => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/playlists`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists(data.playlists || []);
      }
    } catch (err) {
      console.error('Error loading playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string, playlistName?: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Please log in to add videos to playlists');
      return;
    }

    setAddingToPlaylist(playlistId);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/v1/playlists/${playlistId}/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ videoId }),
      });

      if (response.ok) {
        const playlist = playlists.find(p => p.id === playlistId);
        setSuccessPlaylistName(playlistName || playlist?.name || 'playlist');
        setShowSuccess(true);
        if (onSuccess) onSuccess();
        // Auto-close after 2 seconds
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2000);
      } else {
        const data = await response.json();
        if (response.status === 409) {
          setError('Video is already in this playlist');
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

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) {
      setError('Playlist name is required');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      setError('Please log in to create playlists');
      return;
    }

    setCreating(true);
    setError('');

    try {
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
        const data = await response.json();
        await handleAddToPlaylist(data.id, newPlaylistName.trim());
        await loadPlaylists();
        setShowCreateForm(false);
        setNewPlaylistName('');
        setNewPlaylistDescription('');
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

  if (!isOpen) return null;

  // Show success screen
  if (showSuccess) {
    return (
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
          zIndex: 100001,
          animation: 'fadeIn 0.3s ease'
        }}
        onClick={(e) => {
          // Close on click outside
          if (e.target === e.currentTarget) {
            setShowSuccess(false);
            onClose();
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
            Added to playlist!
          </p>
          <p style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '14px', 
            margin: 0,
            textAlign: 'center'
          }}>
            The video has been added to "{successPlaylistName}"
          </p>
        </div>
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
      </div>
    );
  }

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
        zIndex: 100001,
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
          padding: '32px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#ffffff', margin: 0, fontSize: '24px', fontWeight: '600' }}>
            Add to Playlist
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
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <X size={24} />
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 107, 107, 0.2)',
            border: '1px solid rgba(255, 107, 107, 0.5)',
            borderRadius: '8px',
            padding: '12px',
            marginBottom: '20px',
            color: '#ff6b6b'
          }}>
            {error}
          </div>
        )}

        {!showCreateForm ? (
          <>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#ffffff' }}>
                Loading playlists...
              </div>
            ) : (
              <>
                {playlists.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    <p>You don't have any playlists yet.</p>
                    <p style={{ marginTop: '8px' }}>Create one to get started!</p>
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ color: '#ffffff', marginBottom: '12px', fontSize: '16px', fontWeight: '500' }}>
                      Select a playlist:
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
                      {playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          onClick={() => handleAddToPlaylist(playlist.id)}
                          disabled={addingToPlaylist === playlist.id}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: addingToPlaylist === playlist.id 
                              ? 'rgba(173, 216, 230, 0.2)' 
                              : 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            color: '#ffffff',
                            textAlign: 'left',
                            cursor: addingToPlaylist === playlist.id ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s ease',
                            opacity: addingToPlaylist === playlist.id ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (addingToPlaylist !== playlist.id) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                              e.currentTarget.style.borderColor = '#ADD8E6';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (addingToPlaylist !== playlist.id) {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }
                          }}
                        >
                          <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                            {playlist.name}
                          </div>
                          {playlist.description && (
                            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                              {playlist.description}
                            </div>
                          )}
                          {addingToPlaylist === playlist.id && (
                            <div style={{ fontSize: '12px', color: '#ADD8E6', marginTop: '4px' }}>
                              Adding...
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={() => setShowCreateForm(true)}
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: '#ADD8E6',
                color: '#0F0F0F',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#87CEEB'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ADD8E6'}
            >
              <Plus size={20} />
              Create New Playlist
            </button>
          </>
        ) : (
          <form onSubmit={handleCreatePlaylist}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#ffffff', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Playlist Name *
              </label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
                maxLength={100}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ADD8E6';
                  e.target.style.borderWidth = '1px';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#ffffff', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                Description (optional)
              </label>
              <textarea
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                placeholder="Enter playlist description"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ADD8E6';
                  e.target.style.borderWidth = '1px';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewPlaylistName('');
                  setNewPlaylistDescription('');
                  setError('');
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
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
                type="submit"
                disabled={creating || !newPlaylistName.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: creating || !newPlaylistName.trim() ? 'rgba(173, 216, 230, 0.5)' : '#ADD8E6',
                  color: '#0F0F0F',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: creating || !newPlaylistName.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!creating && newPlaylistName.trim()) {
                    e.currentTarget.style.backgroundColor = '#87CEEB';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!creating && newPlaylistName.trim()) {
                    e.currentTarget.style.backgroundColor = '#ADD8E6';
                  }
                }}
              >
                {creating ? 'Creating...' : 'Create & Add'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
