import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (id) {
      loadVideo();
      loadComments();
      setIsAuthenticated(!!localStorage.getItem('auth_token'));
    }
  }, [id]);

  const loadVideo = async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/videos/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setVideo(data);
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

  const handleShare = async () => {
    if (!isAuthenticated) {
      alert('Please log in to share videos');
      return;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const youtubeVideoId = video.youtubeVideoId || id?.replace('youtube_', '');
      const response = await fetch(`${API_URL}/api/v1/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          youtubeVideoId,
          title: video.title,
          description: video.description,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        alert('Video shared successfully!');
      } else {
        alert(data.error || 'Failed to share video');
      }
    } catch (err) {
      alert('Failed to share video');
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
        padding: '0 40px'
      }}>
        {/* Video Player */}
        <div style={{
          backgroundColor: 'transparent',
          borderRadius: '8px',
          padding: '40px 0',
          marginBottom: '30px'
        }}>
          <div style={{
            position: 'relative',
            paddingBottom: '56.25%',
            height: 0,
            overflow: 'hidden',
            borderRadius: '8px',
            marginBottom: '20px'
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

          <h1 style={{ color: '#ffffff', marginTop: 0, marginBottom: '10px' }}>
            {video.title}
          </h1>

          {video.user && (
            <p style={{ color: '#ffffff', marginBottom: '20px' }}>
              Shared by <strong>{video.user.username}</strong>
            </p>
          )}

          {video.description && (
            <p style={{ color: '#ffffff', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
              {video.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            {isAuthenticated && (
              <button
                onClick={handleShare}
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
                Share This Video
              </button>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div style={{
          backgroundColor: 'transparent',
          borderRadius: '8px',
          padding: '40px 0'
        }}>
          <h2 style={{ color: '#ffffff', marginTop: 0 }}>Comments</h2>

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
              {comments.map((comment) => (
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
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: '#ffffff', margin: 0, lineHeight: '1.6' }}>{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
