import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMetaTags } from '../hooks/useMetaTags';
import { Edit2, Trash2, Save, X as CloseIcon, Heart, Flag, Repeat2, Share2, Facebook, ChevronDown, Link2, ListPlus } from 'lucide-react';
import { Link } from 'react-router-dom';
import VideoCard from '../components/VideoCard';
import Dropdown from '../components/Dropdown';
import AddToPlaylistModal from '../components/AddToPlaylistModal';
import ProfilePicture from '../components/ProfilePicture';

import { API_URL } from '../config/api';

export default function VideoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated: authIsAuthenticated, user } = useAuth();
  const [video, setVideo] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<any[]>([]);
  const [upNextVideos, setUpNextVideos] = useState<any[]>([]);
  const [currentPlaylist, setCurrentPlaylist] = useState<any>(null);
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
  const [reportSuccess, setReportSuccess] = useState(false);
  const [showShareDropdown, setShowShareDropdown] = useState(false);
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false);
  const isAuthenticated = authIsAuthenticated;

  useEffect(() => {
    if (id) {
      // Check if this is a YouTube video (id starts with "youtube_")
      if (id.startsWith('youtube_')) {
        loadYouTubeVideo(id.replace('youtube_', ''));
      } else {
        loadVideo();
        loadComments();
        checkPlaylistContext();
      }
    }
  }, [id]);

  const checkPlaylistContext = () => {
    try {
      const playlistData = sessionStorage.getItem('currentPlaylist');
      if (playlistData) {
        const playlist = JSON.parse(playlistData);
        const currentIndex = playlist.videoIds.findIndex((vidId: string) => vidId === id);
        
        if (currentIndex !== -1) {
          // We're playing from a playlist
          setCurrentPlaylist(playlist);
          // Get up next videos (remaining videos in playlist)
          const remainingVideos = playlist.videoIds.slice(currentIndex + 1);
          loadUpNextVideos(remainingVideos);
        } else {
          // Not in playlist, show recommendations
          setCurrentPlaylist(null);
          loadRecommendedVideos();
        }
      } else {
        // No playlist context, show recommendations
        setCurrentPlaylist(null);
        loadRecommendedVideos();
      }
    } catch (err) {
      // Error parsing playlist data, show recommendations
      setCurrentPlaylist(null);
      loadRecommendedVideos();
    }
  };

  const loadUpNextVideos = async (videoIds: string[]) => {
    if (videoIds.length === 0) {
      setUpNextVideos([]);
      return;
    }

    try {
      // Load videos in parallel
      const videoPromises = videoIds.slice(0, 8).map(async (videoId: string) => {
        try {
          const response = await fetch(`${API_URL}/api/v1/videos/${videoId}`);
          if (response.ok) {
            return await response.json();
          }
          return null;
        } catch {
          return null;
        }
      });

      const videos = await Promise.all(videoPromises);
      setUpNextVideos(videos.filter(v => v !== null));
    } catch (err) {
      setUpNextVideos([]);
    }
  };

  // Update meta tags for video page
  useMetaTags({
    title: video?.title,
    description: video?.description || `Watch ${video?.title} on Petflix`,
    image: video?.thumbnail || (video?.youtubeVideoId ? `https://img.youtube.com/vi/${video.youtubeVideoId}/hqdefault.jpg` : undefined),
    url: video ? `/video/${id}` : undefined
  });

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

  // Helper function to ensure YouTube video is shared to Petflix (for likes/comments/reposts)
  const ensureYouTubeVideoShared = async (youtubeVideoId: string): Promise<string | null> => {
    if (!isAuthenticated || !user) {
      return null;
    }

    const token = localStorage.getItem('auth_token');
    if (!token) {
      return null;
    }

    try {
      // Check if video is already shared by current user
      const checkResponse = await fetch(`${API_URL}/api/v1/videos/user/${user.id}?type=shared`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        const existingVideo = checkData.videos?.find((v: any) => v.youtubeVideoId === youtubeVideoId);
        if (existingVideo) {
          return existingVideo.id;
        }
      }

      // Video not shared yet, share it automatically
      const shareResponse = await fetch(`${API_URL}/api/v1/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          youtubeVideoId: youtubeVideoId,
        }),
      });

      if (shareResponse.ok) {
        const shareData = await shareResponse.json();
        return shareData.id;
      } else {
        // If sharing fails (e.g., already shared by someone else), try to find existing video
        const searchResponse = await fetch(`${API_URL}/api/v1/videos/search?q=${encodeURIComponent(youtubeVideoId)}&limit=1`);
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          const foundVideo = searchData.videos?.find((v: any) => v.youtubeVideoId === youtubeVideoId);
          if (foundVideo && foundVideo.id) {
            return foundVideo.id;
          }
        }
      }
    } catch (err) {
      console.error('Error ensuring YouTube video is shared:', err);
    }

    return null;
  };

  const loadYouTubeVideo = async (youtubeVideoId: string) => {
    try {
      setLoading(true);
      setError('');
      
      // First, check if this video is already shared in Petflix
      if (isAuthenticated && user) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            // Check if video exists in Petflix
            const checkResponse = await fetch(`${API_URL}/api/v1/videos/search?q=${encodeURIComponent(youtubeVideoId)}&limit=1`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              const existingVideo = checkData.videos?.find((v: any) => v.youtubeVideoId === youtubeVideoId);
              if (existingVideo && existingVideo.id) {
                // Video already exists in Petflix, load it normally
                window.location.href = `/video/${existingVideo.id}`;
                return;
              }
            }
          } catch (err) {
            // Continue with YouTube loading if check fails
          }
        }
      }
      
      // Use YouTube oEmbed API (free, no quota) to get video metadata
      const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeVideoId}&format=json`;
      const oembedResponse = await fetch(oembedUrl);
      
      if (!oembedResponse.ok) {
        setError('Failed to load YouTube video');
        return;
      }
      
      const oembedData = await oembedResponse.json();
      
      // Format video data to match Petflix video structure
      const videoData = {
        id: null,
        youtubeVideoId: youtubeVideoId,
        title: oembedData.title,
        description: '', // oEmbed doesn't provide description
        thumbnail: oembedData.thumbnail_url,
        userId: null,
        user: null,
        originalUser: null,
        createdAt: new Date().toISOString(), // oEmbed doesn't provide publish date
        viewCount: 0, // oEmbed doesn't provide view count
        source: 'youtube',
        authorName: oembedData.author_name,
        authorUrl: oembedData.author_url,
      };
      
      setVideo(videoData);
      
      // Check like status if authenticated (video might be shared by someone else)
      if (isAuthenticated && user) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            // Try to find if video is shared and get like status
            const searchResponse = await fetch(`${API_URL}/api/v1/videos/search?q=${encodeURIComponent(youtubeVideoId)}&limit=1`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const foundVideo = searchData.videos?.find((v: any) => v.youtubeVideoId === youtubeVideoId);
              if (foundVideo && foundVideo.id) {
                // Video exists, get like status
                const likeStatusResponse = await fetch(`${API_URL}/api/v1/videos/${foundVideo.id}/like-status`, {
                  headers: { 'Authorization': `Bearer ${token}` },
                });
                if (likeStatusResponse.ok) {
                  const likeStatus = await likeStatusResponse.json();
                  setIsLiked(likeStatus.isLiked || false);
                  setLikeCount(likeStatus.likeCount || 0);
                }
              }
            }
          } catch (err) {
            // Silently fail
          }
        }
      } else {
        setIsLiked(false);
        setLikeCount(0);
      }
      
      setEditTitle(videoData.title);
      setEditDescription(videoData.description);
      setIsReposted(false);
      
      // Load comments if video is shared
      if (isAuthenticated && user) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          try {
            const searchResponse = await fetch(`${API_URL}/api/v1/videos/search?q=${encodeURIComponent(youtubeVideoId)}&limit=1`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              const foundVideo = searchData.videos?.find((v: any) => v.youtubeVideoId === youtubeVideoId);
              if (foundVideo && foundVideo.id) {
                // Video exists, load comments
                loadCommentsForVideo(foundVideo.id);
                return;
              }
            }
          } catch (err) {
            // Silently fail
          }
        }
      }
      
      // No comments if video not shared
      setComments([]);
      
      // Load recommended videos for YouTube videos too
      loadRecommendedVideos();
    } catch (err: any) {
      console.error('Error loading YouTube video:', err);
      setError('Failed to load YouTube video');
    } finally {
      setLoading(false);
    }
  };

  const loadCommentsForVideo = async (videoId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/v1/comments/${videoId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      // Silently fail
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
        // Default to false (unhighlighted) unless we confirm it's reposted
        setIsReposted(false);
        
        if (isAuthenticated && user) {
          const token = localStorage.getItem('auth_token');
          if (token) {
            try {
              // Check if user has already reposted this video by checking their reposted videos
              const repostedRes = await fetch(`${API_URL}/api/v1/videos/user/${user.id}?type=reposted`, {
                headers: { 'Authorization': `Bearer ${token}` },
              });
              
              if (repostedRes.ok) {
                const repostedData = await repostedRes.json();
                // Check if any reposted video matches this video's youtube_video_id or original user
                const hasReposted = repostedData.videos?.some((v: any) => 
                  v.youtubeVideoId === data.youtubeVideoId ||
                  (v.originalUser && v.originalUser.id === data.userId)
                );
                setIsReposted(hasReposted || false);
              }
            } catch (err) {
              // Silently fail - repost status is non-critical, keep default false
              setIsReposted(false);
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
    
    // Handle like/unlike action
    
    if (!isAuthenticated) {
      // Graceful prompt for unauthenticated users
      const shouldLogin = window.confirm('Please log in to like videos. Would you like to go to the login page?');
      if (shouldLogin) {
        window.location.href = '/';
      }
      return;
    }

    setLiking(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setLiking(false);
      return;
    }

    try {
      // If this is a YouTube video (no Petflix ID), share it first
      let videoId = id;
      if (video?.source === 'youtube' && video?.youtubeVideoId && !videoId) {
        const sharedId = await ensureYouTubeVideoShared(video.youtubeVideoId);
        if (sharedId) {
          videoId = sharedId;
          // Update the URL and reload to show the Petflix version
          window.location.href = `/video/${sharedId}`;
          return;
        } else {
          alert('Failed to share video. Please try again.');
          setLiking(false);
          return;
        }
      }

      if (!videoId) {
        setLiking(false);
        return;
      }

      const endpoint = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`${API_URL}/api/v1/videos/${videoId}/like`, {
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
          detail: { videoId: videoId, isLiked: !isLiked } 
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
              const statusRes = await fetch(`${API_URL}/api/v1/videos/${videoId}/like-status`, {
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
        // Like error handled below
      }
    } catch (err) {
      // Error handled by UI state
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
    if (!reportReason.trim()) {
      return;
    }

    setReporting(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setReporting(false);
      return;
    }

    try {
      // If this is a YouTube video (no Petflix ID), share it first
      let videoId = id;
      if (video?.source === 'youtube' && video?.youtubeVideoId && !videoId) {
        const sharedId = await ensureYouTubeVideoShared(video.youtubeVideoId);
        if (sharedId) {
          videoId = sharedId;
          // Update the URL and reload to show the Petflix version
          window.location.href = `/video/${sharedId}`;
          return;
        } else {
          alert('Failed to share video. Please try again.');
          setReporting(false);
          return;
        }
      }

      if (!videoId) {
        setReporting(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/videos/${videoId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          reason: reportReason.trim(),
          description: reportDescription.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReportSuccess(true);
        setShowReportModal(false);
        setReportReason('');
        setReportDescription('');
        setTimeout(() => setReportSuccess(false), 3000);
      } else {
        alert(data.error || 'Failed to report video');
      }
    } catch (err) {
      alert('Failed to report video. Please try again.');
    } finally {
      setReporting(false);
    }
  };

  const handleFacebookShare = () => {
    if (!id || !video) return;
    const fullUrl = typeof window !== 'undefined' ? window.location.origin + `/video/${id}` : `/video/${id}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    setShowShareDropdown(false);
  };

  const handleXShare = () => {
    if (!id || !video) return;
    const fullUrl = typeof window !== 'undefined' ? window.location.origin + `/video/${id}` : `/video/${id}`;
    const xUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=${encodeURIComponent(video.title)}`;
    window.open(xUrl, '_blank', 'width=600,height=400');
    setShowShareDropdown(false);
  };

  const handleCopyLink = async () => {
    if (!id) return;
    const fullUrl = typeof window !== 'undefined' ? window.location.origin + `/video/${id}` : `/video/${id}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setShowShareDropdown(false);
      // Show a brief success message
      const successMsg = document.createElement('div');
      successMsg.textContent = 'Link copied to clipboard!';
      successMsg.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        backgroundColor: rgba(76, 175, 80, 0.9);
        color: #ffffff;
        padding: 16px 24px;
        borderRadius: 8px;
        boxShadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        zIndex: 100003;
        animation: slideIn 0.3s ease;
        maxWidth: 400px;
        fontSize: 14px;
        fontWeight: 500;
      `;
      document.body.appendChild(successMsg);
      setTimeout(() => {
        successMsg.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => document.body.removeChild(successMsg), 300);
      }, 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = fullUrl;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setShowShareDropdown(false);
        alert('Link copied to clipboard!');
      } catch (err) {
        alert('Failed to copy link');
      }
      document.body.removeChild(textArea);
    }
  };

  const [reposting, setReposting] = useState(false);
  const [isReposted, setIsReposted] = useState(false);

  const handleRepost = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    
    if (!isAuthenticated) {
      const shouldLogin = window.confirm('Please log in to repost videos. Would you like to go to the login page?');
      if (shouldLogin) {
        window.location.href = '/';
      }
      return;
    }

    setReposting(true);
    const token = localStorage.getItem('auth_token');
    if (!token) {
      setReposting(false);
      return;
    }

    try {
      // If this is a YouTube video (no Petflix ID), share it first
      let videoId = id;
      if (video?.source === 'youtube' && video?.youtubeVideoId && !videoId) {
        const sharedId = await ensureYouTubeVideoShared(video.youtubeVideoId);
        if (sharedId) {
          videoId = sharedId;
          // Update the URL and reload to show the Petflix version
          window.location.href = `/video/${sharedId}`;
          return;
        } else {
          alert('Failed to share video. Please try again.');
          setReposting(false);
          return;
        }
      }

      if (!videoId) {
        setReposting(false);
        return;
      }

      if (isReposted) {
        // If already reposted, find and delete the reposted video
        // We need to find the video entry where user_id = current user and youtube_video_id matches
        if (!user) return;
        
        const response = await fetch(`${API_URL}/api/v1/videos/user/${user.id}?type=reposted`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const repostedVideo = data.videos?.find((v: any) => 
            v.youtubeVideoId === video.youtubeVideoId || 
            (v.originalUser && v.originalUser.id === video.userId)
          );
          
          if (repostedVideo) {
            const deleteResponse = await fetch(`${API_URL}/api/v1/videos/${repostedVideo.id}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (deleteResponse.ok) {
              setIsReposted(false);
              window.dispatchEvent(new CustomEvent('video-reposted', { 
                detail: { videoId: videoId, isReposted: false } 
              }));
            }
          }
        }
      } else {
        // Create a repost
        const response = await fetch(`${API_URL}/api/v1/videos/${videoId}/repost`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          setIsReposted(true);
          window.dispatchEvent(new CustomEvent('video-reposted', { 
            detail: { videoId: videoId, isReposted: true } 
          }));
        } else {
          // Silently handle 409 (already reposted) - just update state
          if (response.status === 409) {
            setIsReposted(true);
          }
        }
      }
    } catch (err) {
      // Repost error handled by UI
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
      // If this is a YouTube video (no Petflix ID), share it first
      let videoId = id;
      if (video?.source === 'youtube' && video?.youtubeVideoId && !videoId) {
        const sharedId = await ensureYouTubeVideoShared(video.youtubeVideoId);
        if (sharedId) {
          videoId = sharedId;
          // Update the URL and reload to show the Petflix version
          window.location.href = `/video/${sharedId}`;
          return;
        } else {
          alert('Failed to share video. Please try again.');
          return;
        }
      }

      if (!videoId) {
        alert('Video ID not available');
        return;
      }

      const response = await fetch(`${API_URL}/api/v1/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          videoId: videoId,
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
            @keyframes slideIn {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            @keyframes fadeOut {
              from {
                opacity: 1;
              }
              to {
                opacity: 0;
              }
            }
            @media (min-width: 1200px) {
          .page-content-container {
            max-width: 90vw !important;
            margin-left: auto !important;
            margin-right: auto !important;
            padding-left: 40px !important;
            padding-right: 40px !important;
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
      <div className="page-content-container" style={{ 
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
                    <CloseIcon size={16} />
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

                {(() => {
                  // For YouTube videos, show channel info
                  if (video.source === 'youtube' && video.authorName) {
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <a
                          href={video.authorUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
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
                          <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 0, 0, 0.8)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            flexShrink: 0
                          }}>
                            YT
                          </div>
                          <span>{video.authorName}</span>
                          <span style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>• YouTube</span>
                        </a>
                      </div>
                    );
                  }
                  
                  // For Petflix videos, show user info
                  if (video.user || video.originalUser) {
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
                          <ProfilePicture
                            src={displayUser.profile_picture_url}
                          alt={displayUser.username}
                          size={24}
                          fallbackChar={displayUser.username?.charAt(0).toUpperCase() || 'U'}
                          style={{ cursor: 'pointer' }}
                        />
                          <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            Shared by <strong style={{ color: '#ffffff' }}>{displayUser.username}</strong>
                          </span>
                        </Link>
                      </div>
                    );
                  }
                  return null;
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
                      disabled={reposting || !isAuthenticated}
                      style={{
                        padding: '14px 24px',
                        backgroundColor: 'transparent',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        borderRadius: '6px',
                        cursor: isAuthenticated && !reposting ? 'pointer' : 'not-allowed',
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
                        if (isAuthenticated && !reposting) {
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
                  <div style={{ position: 'relative' }}>
                    <button
                      onClick={() => setShowShareDropdown(!showShareDropdown)}
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
                      title="Share video"
                    >
                      <Share2 size={18} />
                      Share
                      <ChevronDown size={16} style={{ 
                        transition: 'transform 0.2s ease',
                        transform: showShareDropdown ? 'rotate(180deg)' : 'rotate(0deg)'
                      }} />
                    </button>
                    {showShareDropdown && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '100%',
                          left: 0,
                          marginTop: '8px',
                          backgroundColor: '#1a1a1a',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
                          zIndex: 1000,
                          minWidth: '180px',
                          overflow: 'hidden',
                          animation: 'slideIn 0.2s ease'
                        }}
                        onMouseLeave={() => setShowShareDropdown(false)}
                      >
                        <button
                          onClick={handleFacebookShare}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: 'transparent',
                            color: '#ffffff',
                            border: 'none',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(24, 119, 242, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Facebook size={18} color="#1877F2" />
                          Facebook
                        </button>
                        <button
                          onClick={handleXShare}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: 'transparent',
                            color: '#ffffff',
                            border: 'none',
                            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <span style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#ffffff',
                            width: '18px',
                            height: '18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            𝕏
                          </span>
                          X
                        </button>
                        <button
                          onClick={handleCopyLink}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            backgroundColor: 'transparent',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '14px',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                            textAlign: 'left'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Link2 size={18} color="#ffffff" />
                          Copy Link
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (!isAuthenticated) return;
                      
                      // If this is a YouTube video (no Petflix ID), share it first
                      if (video?.source === 'youtube' && video?.youtubeVideoId && !video.id) {
                        const sharedId = await ensureYouTubeVideoShared(video.youtubeVideoId);
                        if (sharedId) {
                          // Update the URL and reload to show the Petflix version
                          window.location.href = `/video/${sharedId}`;
                          return;
                        } else {
                          alert('Failed to share video. Please try again.');
                          return;
                        }
                      }
                      
                      setShowAddToPlaylistModal(true);
                    }}
                    disabled={!isAuthenticated}
                    style={{
                      padding: '14px 24px',
                      backgroundColor: 'transparent',
                      color: '#ffffff',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '6px',
                      cursor: isAuthenticated ? 'pointer' : 'not-allowed',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'all 0.2s ease',
                      opacity: isAuthenticated ? 1 : 0.6
                    }}
                    onMouseEnter={(e) => {
                      if (isAuthenticated) {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'scale(1.02)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                    title={isAuthenticated ? 'Add to playlist' : 'Log in to add videos to playlists'}
                  >
                    <ListPlus size={18} />
                    Add to Playlist
                  </button>
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
                            <CloseIcon size={14} />
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

        {/* Right Column - Up Next or Recommended Videos */}
        <div style={{ flex: '0 0 400px', minWidth: 0 }}>
          <h3 style={{ color: '#ffffff', marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: '500' }}>
            {currentPlaylist ? 'Up next' : 'Recommended'}
          </h3>
          {currentPlaylist && (
            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: 'rgba(173, 216, 230, 0.1)', borderRadius: '8px', border: '1px solid rgba(173, 216, 230, 0.2)' }}>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', margin: '0 0 4px 0', fontWeight: '500' }}>
                {currentPlaylist.playlistName}
              </p>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '12px', margin: 0 }}>
                {upNextVideos.length} {upNextVideos.length === 1 ? 'video' : 'videos'} remaining
              </p>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(currentPlaylist ? upNextVideos : recommendedVideos).length > 0 ? (
              (currentPlaylist ? upNextVideos : recommendedVideos).map((recVideo, index) => (
                <VideoCard 
                  key={recVideo.id} 
                  video={recVideo}
                  onVideoClick={currentPlaylist ? (videoId) => {
                    // Update playlist context with new current index
                    const currentIndex = currentPlaylist.videoIds.findIndex((vidId: string) => vidId === videoId);
                    if (currentIndex !== -1) {
                      const updatedPlaylist = {
                        ...currentPlaylist,
                        currentIndex
                      };
                      sessionStorage.setItem('currentPlaylist', JSON.stringify(updatedPlaylist));
                    }
                    navigate(`/video/${videoId}`);
                  } : undefined}
                />
              ))
            ) : (
              <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px' }}>
                {currentPlaylist ? 'No more videos in playlist' : 'Loading recommendations...'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
        );
      })()}

      {/* Report Modal */}
      {showReportModal && (
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
              setShowReportModal(false);
              setReportReason('');
              setReportDescription('');
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
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              animation: 'scaleIn 0.4s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ color: '#ffffff', margin: 0, fontSize: '20px', fontWeight: '600' }}>
                Report Video
              </h2>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CloseIcon size={24} />
              </button>
            </div>

            <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px', fontSize: '14px' }}>
              Help us keep Petflix safe by reporting content that violates our community guidelines.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Reason for reporting *
              </label>
              <Dropdown
                value={reportReason}
                onChange={setReportReason}
                placeholder="Select a reason"
                options={[
                  { value: 'Inappropriate content', label: 'Inappropriate content' },
                  { value: 'Spam or misleading', label: 'Spam or misleading' },
                  { value: 'Harassment or bullying', label: 'Harassment or bullying' },
                  { value: 'Violence or dangerous acts', label: 'Violence or dangerous acts' },
                  { value: 'Copyright infringement', label: 'Copyright infringement' },
                  { value: 'Other', label: 'Other' }
                ]}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Additional details (optional)
              </label>
              <textarea
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                placeholder="Provide more information about why you're reporting this video..."
                maxLength={500}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  minHeight: '100px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: '#fff',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#ADD8E6';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                  e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                }}
              />
              <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', marginTop: '4px', marginBottom: 0 }}>
                {reportDescription.length}/500 characters
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportReason('');
                  setReportDescription('');
                }}
                disabled={reporting}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: reporting ? 'not-allowed' : 'pointer',
                  opacity: reporting ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReportVideo}
                disabled={reporting || !reportReason.trim()}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#ff6b6b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: (reporting || !reportReason.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (reporting || !reportReason.trim()) ? 0.6 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (!reporting && reportReason.trim()) {
                    e.currentTarget.style.backgroundColor = '#ff5252';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!reporting && reportReason.trim()) {
                    e.currentTarget.style.backgroundColor = '#ff6b6b';
                  }
                }}
              >
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Success Message */}
      {reportSuccess && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: 'rgba(76, 175, 80, 0.9)',
            color: '#ffffff',
            padding: '16px 24px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            zIndex: 100003,
            animation: 'slideIn 0.3s ease',
            maxWidth: '400px'
          }}
        >
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>
            Thank you for your report. We'll review it shortly.
          </p>
        </div>
      )}

      {/* Add to Playlist Modal */}
      {video && video.id && (
        <AddToPlaylistModal
          videoId={video.id}
          isOpen={showAddToPlaylistModal}
          onClose={() => setShowAddToPlaylistModal(false)}
        />
      )}
    </>
  );
}
