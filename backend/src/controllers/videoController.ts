import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate } from '../middleware/auth';
import {
  VideoCreationRequest,
  VideoResponse,
  VideoDetailsResponse,
  VideoSearchResponse,
  ErrorResponse,
} from '../types';
// YouTube URL validation is handled in youtubeService
import { searchYouTubeVideos, getYouTubeVideoDetails } from '../services/youtubeService';

/**
 * Search for videos (YouTube + Petflix shared videos)
 * GET /api/v1/videos/search
 */
export const searchVideos = async (
  req: Request<{}, VideoSearchResponse | ErrorResponse, {}, { q?: string; page?: string; limit?: string }>,
  res: Response
) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');

    if (!query || query.trim() === '') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    // Search YouTube videos
    let youtubeVideos: any[] = [];
    try {
      const youtubeResults = await searchYouTubeVideos(query, limit);
      youtubeVideos = youtubeResults.videos.map(video => ({
        id: `youtube_${video.id}`,
        youtubeVideoId: video.id,
        title: video.title,
        description: video.description,
        thumbnail: video.thumbnail,
        channelTitle: video.channelTitle,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt,
        source: 'youtube',
      }));
    } catch (error) {
      console.error('YouTube search error:', error);
      // Continue even if YouTube search fails
    }

    // Search shared videos in database
    const { data: sharedVideos, error: dbError } = await supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          email
        )
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    const sharedVideosFormatted = (sharedVideos || []).map((video: any) => ({
      id: video.id,
      youtubeVideoId: video.youtube_video_id,
      title: video.title,
      description: video.description,
      userId: video.user_id,
      createdAt: video.created_at,
      updatedAt: video.updated_at,
      user: video.users,
      source: 'petflix',
    }));

    // Combine results (Petflix videos first, then YouTube)
    const allVideos = [...sharedVideosFormatted, ...youtubeVideos];

    res.json({
      videos: allVideos,
      total: allVideos.length,
      page,
      pageSize: limit,
    });
  } catch (error) {
    console.error('Search videos error:', error);
    res.status(500).json({ error: 'Failed to search videos' });
  }
};

/**
 * Share a YouTube video
 * POST /api/v1/videos
 */
export const shareVideo = async (
  req: Request<{}, VideoResponse | ErrorResponse, VideoCreationRequest>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { youtubeVideoId, title, description } = req.body;

    if (!youtubeVideoId || !title) {
      res.status(400).json({ error: 'YouTube video ID and title are required' });
      return;
    }

    // Get video details from YouTube to verify it exists
    let youtubeData;
    try {
      youtubeData = await getYouTubeVideoDetails(youtubeVideoId);
    } catch (error) {
      res.status(400).json({ error: 'Invalid YouTube video ID or video not found' });
      return;
    }

    // Check if video already shared by this user
    const { data: existingVideo } = await supabaseAdmin!
      .from('videos')
      .select('id')
      .eq('youtube_video_id', youtubeVideoId)
      .eq('user_id', req.user.userId)
      .single();

    if (existingVideo) {
      res.status(409).json({ error: 'You have already shared this video' });
      return;
    }

    // Create video record
    const { data: newVideo, error: insertError } = await supabaseAdmin!
      .from('videos')
      .insert({
        youtube_video_id: youtubeVideoId,
        title: title || youtubeData.title,
        description: description || youtubeData.description,
        user_id: req.user.userId,
      })
      .select('id, youtube_video_id, title, description, user_id, created_at, updated_at')
      .single();

    if (insertError || !newVideo) {
      console.error('Error creating video:', insertError);
      res.status(500).json({ error: 'Failed to share video' });
      return;
    }

    res.status(201).json({
      id: newVideo.id,
      youtubeVideoId: newVideo.youtube_video_id,
      title: newVideo.title,
      description: newVideo.description,
      userId: newVideo.user_id,
      createdAt: newVideo.created_at,
      updatedAt: newVideo.updated_at,
    });
  } catch (error) {
    console.error('Share video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get video details
 * GET /api/v1/videos/:id
 */
export const getVideoById = async (
  req: Request<{ id: string }>,
  res: Response<VideoDetailsResponse | ErrorResponse>
) => {
  try {
    const { id } = req.params;

    // Check if it's a YouTube video ID (starts with youtube_)
    if (id.startsWith('youtube_')) {
      const youtubeId = id.replace('youtube_', '');
      const youtubeData = await getYouTubeVideoDetails(youtubeId);
      
      res.json({
        id: `youtube_${youtubeData.id}`,
        youtubeVideoId: youtubeData.id,
        title: youtubeData.title,
        description: youtubeData.description,
        userId: '',
        createdAt: youtubeData.publishedAt,
        updatedAt: youtubeData.publishedAt,
        user: undefined,
      } as VideoDetailsResponse);
      return;
    }

    // Get from database
    const { data: video, error } = await supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          email,
          profile_picture_url,
          bio
        )
      `)
      .eq('id', id)
      .single();

    if (error || !video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    const userData = Array.isArray(video.users) ? video.users[0] : video.users;
    res.json({
      id: video.id,
      youtubeVideoId: video.youtube_video_id,
      title: video.title,
      description: video.description,
      userId: video.user_id,
      createdAt: video.created_at,
      updatedAt: video.updated_at,
      user: userData ? {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        profile_picture_url: userData.profile_picture_url || null,
        bio: (userData as any).bio || null,
        created_at: (userData as any).created_at || video.created_at,
        updated_at: (userData as any).updated_at || video.updated_at,
      } : undefined,
    } as VideoDetailsResponse);
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's feed (videos from followed users)
 * GET /api/v1/videos/feed
 */
export const getFeed = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get users that the current user follows
    const { data: following, error: followingError } = await supabaseAdmin!
      .from('followers')
      .select('following_id')
      .eq('follower_id', req.user.userId);

    if (followingError) {
      res.status(500).json({ error: 'Failed to load feed' });
      return;
    }

    if (!following || following.length === 0) {
      res.json({ videos: [] });
      return;
    }

    const followingIds = following.map(f => f.following_id);

    // Get videos from followed users
    const { data: videos, error: videosError } = await supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          email,
          profile_picture_url
        )
      `)
      .in('user_id', followingIds)
      .order('created_at', { ascending: false })
      .limit(50);

    if (videosError) {
      res.status(500).json({ error: 'Failed to load feed' });
      return;
    }

    res.json({
      videos: videos || [],
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get videos by user
 * GET /api/v1/videos/user/:userId
 */
export const getVideosByUser = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const { data: videos, error } = await supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        created_at,
        updated_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to load videos' });
      return;
    }

    // Get YouTube thumbnails for videos
    const videosWithThumbnails = await Promise.all(
      (videos || []).map(async (video) => {
        try {
          const youtubeData = await getYouTubeVideoDetails(video.youtube_video_id);
          return {
            ...video,
            thumbnail: youtubeData.thumbnail,
          };
        } catch (err) {
          return video;
        }
      })
    );

    res.json({ videos: videosWithThumbnails });
  } catch (error) {
    console.error('Get videos by user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a shared video
 * DELETE /api/v1/videos/:id
 */
export const deleteVideo = async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Verify user owns the video
    const { data: video, error: videoError } = await supabaseAdmin!
      .from('videos')
      .select('user_id')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    if (video.user_id !== req.user.userId) {
      res.status(403).json({ error: 'You can only delete your own videos' });
      return;
    }

    // Delete video
    const { error: deleteError } = await supabaseAdmin!
      .from('videos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      res.status(500).json({ error: 'Failed to delete video' });
      return;
    }

    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

