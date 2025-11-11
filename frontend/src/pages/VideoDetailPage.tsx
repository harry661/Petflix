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
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#ffffff' }}>Loading video...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#000000', padding: '40px', textAlign: 'center' }}>
        <p style={{ color: '#c62828' }}>{error || 'Video not found'}</p>
      </div>
    );
  }

  const youtubeVideoId = video.youtubeVideoId || id?.replace('youtube_', '');
  const embedUrl = `https://www.youtube.com/embed/${youtubeVideoId}`;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Video Player */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '30px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                  padding: '10px 20px',
                  backgroundColor: '#ADD8E6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Share This Video
              </button>
            )}
          </div>
        </div>

        {/* Comments Section */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
                  padding: '12px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '80px',
                  boxSizing: 'border-box',
                  marginBottom: '10px'
                }}
              />
              <button
                onClick={handleComment}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#ADD8E6',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Post Comment
              </button>
            </div>
          ) : (
            <p style={{ color: '#ffffff', marginBottom: '20px' }}>
              <a href="/login" style={{ color: '#ADD8E6', textDecoration: 'none' }}>
                Log in
              </a> to comment
            </p>
          )}

          {comments.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: '15px',
                    backgroundColor: '#f9f9f9',
                    borderRadius: '6px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <strong style={{ color: '#ffffff' }}>{comment.user?.username || 'Anonymous'}</strong>
                    <span style={{ color: '#999', fontSize: '12px' }}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ color: '#ffffff', margin: 0 }}>{comment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
