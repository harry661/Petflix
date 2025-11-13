import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Edit2, Trash2, Save, X, Heart, Flag, Repeat2, CheckCircle2, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import VideoCard from '../components/VideoCard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const REPORT_REASONS = [
  'Inappropriate content',
  'Spam or misleading',
  'Violence or harmful content',
  'Copyright infringement',
  'Other'
];

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated: authIsAuthenticated, user } = useAuth();
  const [video, setVideo] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  const [isEditingVideo, setIsEditingVideo] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reporting, setReporting] = useState(false);
  const isAuthenticated = authIsAuthenticated;

  useEffect(() => {
    if (id) {
      loadVideo();
      loadComments();
      loadRecommendedVideos();
    }
  }, [id]);

  const loadRecommendedVideos = async () => {
    try {
      // Get recent videos as recommendations (excluding current video)
      const response = await fetch(`${API_URL}/api/v1/videos/recent?limit=10`);
      if (response.ok) {
        const data = await response.json();
        // Filter out the current video
        const filtered = (data.videos || []).filter((v: any) => v.id !== id);
        setRecommendedVideos(filtered.slice(0, 8)); // Show up to 8 recommendations
      }
    } catch (err) {
      // Silently fail - recommendations are optional
    }
  };

  const loadVideo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/videos/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setVideo(data);
        setIsLiked(data.isLiked || false);
        setLikeCount(data.likeCount || 0);
        setEditTitle(data.title || '');
        setEditDescription(data.description || '');
        
        // Check if user has reposted this video
        if (isAuthenticated && user) {
          const token = localStorage.getItem('auth_token');
          if (token) {
            try {
              const canRepostRes = await fetch(`${API_URL}/api/v1/videos/${id}/can-repost`, {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (canRepostRes.ok) {
                const canRepostData = await canRepostRes.json();
                // If canRepost is false and reason indicates already shared/reposted, user has reposted it
                const hasReposted = canRepostData.canRepost === false && 
                  (canRepostData.reason?.includes('already shared') || 
                   canRepostData.reason?.includes('already reposted'));
                setIsReposted(hasReposted);
              }
            } catch (err) {
              // Silently fail - repost status is non-critical
            }
          }
        }
      } else {
        setError(data.error || 'Video not found');
      }
    } catch (err: any) {
      setError('Failed to load video');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/comments/${id}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      // Comments might not be implemented yet
    }
  };

  const handleEditComment = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/comments/${commentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ text: editingCommentText }),
      });

      if (response.ok) {
        await loadComments();
        setEditingCommentId(null);
        setEditingCommentText('');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update comment');
      }
    } catch (err) {
      alert('Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/comments/${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        await loadComments();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete comment');
      }
    } catch (err) {
      alert('Failed to delete comment');
    }
  };

  const handleLike = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    console.log('Like button clicked', { isAuthenticated, id, isLiked });
    
    if (!isAuthenticated) {
      // Graceful prompt for unauthenticated users
      const shouldLogin = window.confirm('Please log in to like videos. Would you like to go to the login page?');
      if (shouldLogin) {
        window.location.href = '/';
      }
      return;
    }

    if (!id) {
      console.error('No video ID');
      return;
    }

    setLiking(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLiking(false);
      return;
    }

    try {
      const endpoint = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/api/v1/videos/${id}/like`, {
        method: endpoint,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Optimistic UI update
        setIsLiked(!isLiked);
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1);
        
        // Dispatch event to notify profile page to refresh
        window.dispatchEvent(new CustomEvent('video-liked', { 
          detail: { videoId: id, isLiked: !isLiked } 
        }));
      } else {
        // Try to parse error response
        let errorMessage = 'Failed to like video';
        try {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
          
          // If already liked (409), just update state - don't show error
          if (response.status === 409) {
            setIsLiked(true);
            // Refresh like count
            try {
              const statusRes = await fetch(`${API_URL}/api/v1/videos/${id}/like-status`, {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                setLikeCount(statusData.likeCount || 0);
              }
            } catch (statusErr) {
              // Silently fail status check
            }
            return; // Exit early for 409 errors
          }
        } catch (parseErr) {
          // If JSON parsing fails, use default message
        }
        console.error('Like error:', errorMessage, 'Status:', response.status);
      }
    } catch (err) {
      console.error('Like error:', err);
      // Don't show alert for network errors
    } finally {
      setLiking(false);
    }
  };

  const handleEditVideo = () => {
    setIsEditingVideo(true);
    setEditTitle(video.title || '');
    setEditDescription(video.description || '');
  };

  const handleCancelEditVideo = () => {
    setIsEditingVideo(false);
    setEditTitle(video.title || '');
    setEditDescription(video.description || '');
  };

  const handleSaveVideo = async () => {
    if (!id) return;

    setSavingVideo(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setSavingVideo(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/videos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setVideo(data);
        setIsEditingVideo(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update video');
      }
    } catch (err) {
      alert('Failed to update video');
    } finally {
      setSavingVideo(false);
    }
  };

  const handleReportVideo = async () => {
    if (!isAuthenticated) {
      alert('Please log in to report videos');
      return;
    }

    if (!reportReason) {
      alert('Please select a reason for reporting');
      return;
    }

    if (!id) return;

    setReporting(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setReporting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/v1/videos/${id}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: reportReason,
          description: reportDescription.trim() || null,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Video reported successfully');
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
      } else {
        alert(data.error || 'Failed to report video');
      }
    } catch (err) {
      alert('Failed to report video');
    } finally {
      setReporting(false);
    }
  };

  const [reposting, setReposting] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [showRepostSuccess, setShowRepostSuccess] = useState(false);
  const [showRepostError, setShowRepostError] = useState(false);
  const [repostErrorMessage, setRepostErrorMessage] = useState('');


  const handleRepost = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please log in to repost videos');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      return;
    }

    setReposting(true);
    try {
      const response = await fetch(`${API_URL}/api/v1/videos/${id}/repost`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Optimistic UI update
        setIsReposted(true);
        
        // Dispatch event to notify profile page to refresh
        window.dispatchEvent(new CustomEvent('video-reposted', { 
          detail: { videoId: id, video: data } 
        }));
        
        // Show success animation
        setShowRepostSuccess(true);
        // Auto-hide after 2 seconds
        setTimeout(() => {
          setShowRepostSuccess(false);
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
      setReposting(false);
    }
  };

  const handleComment = async () => {
    if (!isAuthenticated) {
      alert('Please log in to comment');
      return;
    }

    if (!newComment.trim()) {
      alert('Please enter a comment');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/v1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId: id,
          text: newComment,
        }),
      });

      if (response.ok) {
        setNewComment('');
        loadComments();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to post comment');
      }
    } catch (err) {
      alert('Failed to post comment');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0F0F0F', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ffffff' }}>Loading video...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#0F0F0F', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#c62828' }}>{error || 'Video not found'}</p>
      </div>
    );
  }

  return (
    <>
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
            animation: 'fadeIn 0.3s ease',
            pointerEvents: 'auto'
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
            onClick={(e) => e.stopPropagation()}
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
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              The video has been added to your profile
            </p>
            <button
              onClick={() => setShowRepostSuccess(false)}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ADD8E6',
                color: '#0F0F0F',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#87CEEB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ADD8E6';
              }}
            >
              Close
            </button>
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
      
      {(() => {
        const youtubeVideoId = video.youtubeVideoId || id?.replace('youtube_', '');
        const embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}`;
        
        return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F0F',
      padding: 0
    }}>
      <div style={{ 
        maxWidth: '100%',
        margin: '0 auto',
        padding: '40px',
        display: 'flex',
        gap: '24px',
        alignItems: 'flex-start'
      }}>
        {/* Left Column - Video Player, Title, Description, Comments */}
        <div style={{ flex: '1 1 65%', minWidth: 0 }}>
          {/* Video Player */}
          <div style={{
            backgroundColor: 'transparent',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <div style={{
              position: 'relative',
              paddingBottom: '56.25%',
              height: 0,
              overflow: 'hidden',
              borderRadius: '8px',
              backgroundColor: '#000'
            }}>
              <iframe
                src={embedUrl}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none'
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>

          {/* Video Info */}
          <div style={{ marginBottom: '30px' }}>
            {isEditingVideo ? (
              <div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    maxLength={255}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      fontSize: '16px',
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
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}>
                    Description
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      fontSize: '14px',
                      minHeight: '120px',
                      boxSizing: 'border-box',
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      color: '#fff',
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit'
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
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={handleSaveVideo}
                    disabled={savingVideo || !editTitle.trim()}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: '#ADD8E6',
                      color: '#0F0F0F',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: savingVideo || !editTitle.trim() ? 'not-allowed' : 'pointer',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      opacity: savingVideo || !editTitle.trim() ? 0.6 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!savingVideo && editTitle.trim()) {
                        e.currentTarget.style.backgroundColor = '#87CEEB';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ADD8E6';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Save size={16} />
                    {savingVideo ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancelEditVideo}
                    disabled={savingVideo}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '6px',
                      cursor: savingVideo ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (!savingVideo) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h1 style={{ color: '#ffffff', marginTop: 0, marginBottom: 0, fontSize: '20px', lineHeight: '1.4', flex: 1 }}>
                    {video.title}
                  </h1>
                  {user && video.userId === user.id && (
                    <button
                      onClick={handleEditVideo}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.7)',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'color 0.2s',
                        marginLeft: '12px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ADD8E6'}
                      onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                      title="Edit video"
                    >
                      <Edit2 size={16} />
                    </button>
                  )}
                </div>

                {(video.user || video.originalUser) && (() => {
                  const displayUser = video.originalUser || video.user;
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                      <Link
                        to={`/user/${displayUser.username}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textDecoration: 'none',
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontSize: '14px',
                          transition: 'opacity 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                      >
                        {displayUser.profile_picture_url ? (
                          <img
                            src={displayUser.profile_picture_url}
                            alt={displayUser.username}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              cursor: 'pointer'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: '#ADD8E6',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}>
                            {displayUser.username?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                        <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                          Shared by <strong style={{ color: '#ffffff' }}>{displayUser.username}</strong>
                        </span>
                      </Link>
                    </div>
                  );
                })()}

                {video.description && (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <p style={{ color: '#ffffff', margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px', lineHeight: '1.6' }}>
                      {video.description}
                    </p>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(e);
                }}
                disabled={liking || !isAuthenticated}
                style={{
                  padding: '14px 24px',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  cursor: isAuthenticated && !liking ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: isAuthenticated && !liking ? 1 : 0.6,
                  willChange: 'background-color, transform' // Optimize for smooth transitions
                }}
                onMouseEnter={(e) => {
                  if (isAuthenticated && !liking) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title={isAuthenticated ? (isLiked ? 'Unlike video' : 'Like video') : 'Log in to like videos'}
              >
                <Heart size={18} fill={isLiked ? '#ADD8E6' : 'none'} color={isLiked ? '#ADD8E6' : '#ffffff'} />
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>
              {isAuthenticated && (
                <>
                  {user && video.userId !== user.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRepost(e);
                      }}
                      disabled={reposting || !isAuthenticated || isReposted}
                      style={{
                        padding: '14px 24px',
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '6px',
                        cursor: isAuthenticated && !reposting && !isReposted ? 'pointer' : 'not-allowed',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease',
                        opacity: isAuthenticated && !reposting ? 1 : 0.6,
                        willChange: 'background-color, transform' // Optimize for smooth transitions
                      }}
                      onMouseEnter={(e) => {
                        if (isAuthenticated && !reposting && !isReposted) {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.transform = 'scale(1.02)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title={isReposted ? 'Video reposted' : (isAuthenticated ? 'Repost video' : 'Log in to repost videos')}
                    >
                      <Repeat2 size={18} fill={isReposted ? '#ADD8E6' : 'none'} color={isReposted ? '#ADD8E6' : '#ffffff'} />
                    </button>
                  )}
                  {user && video.userId !== user.id && (
                    <button
                      onClick={() => setShowReportModal(true)}
                      style={{
                        padding: '14px 24px',
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Report video"
                    >
                      <Flag size={18} />
                      Report
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div style={{
            backgroundColor: 'transparent',
            borderRadius: '8px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h2 style={{ color: '#ffffff', marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>Comments</h2>

          {isAuthenticated ? (
            <div style={{ marginBottom: '30px' }}>
              <textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={1000}
                style={{
                  width: '100%',
                  padding: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '4px',
                  fontSize: '16px',
                  minHeight: '120px',
                  boxSizing: 'border-box',
                  marginBottom: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
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
                onClick={handleComment}
                style={{
                  padding: '14px 32px',
                  backgroundColor: '#ADD8E6',
                  color: '#0F0F0F',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#87CEEB';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ADD8E6';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                Post Comment
              </button>
            </div>
          ) : (
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px' }}>
              <a href="/" style={{ color: '#ADD8E6', textDecoration: 'none' }}>
                Log in
              </a> to comment
            </p>
          )}

          {comments.length === 0 ? (
            <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '40px' }}>
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {comments.map((comment) => {
                const isOwnComment = user && comment.userId === user.id;
                const isEditing = editingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    style={{
                      padding: '20px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                      <strong style={{ color: '#ffffff', fontSize: '16px' }}>{comment.user?.username || 'Anonymous'}</strong>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                        {isOwnComment && !isEditing && (
                          <>
                            <button
                              onClick={() => handleEditComment(comment)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.7)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#ADD8E6'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                              title="Edit comment"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.7)',
                                cursor: 'pointer',
                                padding: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#ff6b6b'}
                              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}
                              title="Delete comment"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    {isEditing ? (
                      <div>
                        <textarea
                          value={editingCommentText}
                          onChange={(e) => setEditingCommentText(e.target.value)}
                          maxLength={1000}
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minHeight: '80px',
                            boxSizing: 'border-box',
                            marginBottom: '12px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            color: '#fff',
                            outline: 'none',
                            resize: 'vertical',
                            fontFamily: 'inherit'
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
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ADD8E6',
                              color: '#0F0F0F',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 'bold',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#87CEEB';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#ADD8E6';
                            }}
                          >
                            <Save size={14} />
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: 'transparent',
                              color: '#ffffff',
                              border: '1px solid rgba(255, 255, 255, 0.3)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <X size={14} />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p style={{ color: '#ffffff', margin: 0, lineHeight: '1.6' }}>{comment.text}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        </div>

        {/* Right Column - Recommended Videos */}
        <div style={{ flex: '0 0 400px', minWidth: 0 }}>
          <h3 style={{ color: '#ffffff', marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: '500' }}>
            Recommended
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {recommendedVideos.length > 0 ? (
              recommendedVideos.map((recVideo) => (
                <VideoCard key={recVideo.id} video={recVideo} />
              ))
            ) : (
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                Loading recommendations...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
        );
      })()}
    </>
  );
}
