import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate } from '../middleware/auth';
import { notifyFollowersOfVideoShare } from '../services/notificationService';
import {
  VideoCreationRequest,
  VideoResponse,
  VideoDetailsResponse,
  VideoSearchResponse,
  ErrorResponse,
} from '../types';
// YouTube URL validation is handled in youtubeService
import { getYouTubeVideoMetadata, getYouTubeVideoDetails } from '../services/youtubeService';

/**
 * Search for videos (YouTube + Petflix shared videos)
 * GET /api/v1/videos/search
 */
export const searchVideos = async (
  req: Request<{}, VideoSearchResponse | ErrorResponse, {}, { q?: string; page?: string; limit?: string; sort?: string }>,
  res: Response
) => {
  try {
    const query = req.query.q;
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const sort = req.query.sort || 'relevance'; // relevance, recency, views, engagement

    if (!query || query.trim() === '') {
      res.status(400).json({ error: 'Search query is required' });
      return;
    }

    // Save search to history if user is authenticated
    if (req.user) {
      try {
        await supabaseAdmin!
          .from('search_history')
          .insert({
            user_id: req.user.userId,
            query: query.trim(),
          });
      } catch (historyError) {
        // Silently fail - search history is non-critical
        console.log('Failed to save search history:', historyError);
      }
    }

    // Only search videos shared by Petflix users (no YouTube API calls)

    // Search shared videos in database by title, description, AND tags
    // First, get video IDs that match the query in tags
    const { data: matchingTags, error: tagsError } = await supabaseAdmin!
      .from('video_tags_direct')
      .select('video_id')
      .ilike('tag_name', `%${query}%`);

    const tagMatchedVideoIds = matchingTags ? matchingTags.map((t: any) => t.video_id) : [];

    // Determine sort order based on sort parameter
    let orderBy = 'created_at';
    let ascending = false;
    
    if (sort === 'recency') {
      orderBy = 'created_at';
      ascending = false;
    } else if (sort === 'views') {
      orderBy = 'view_count';
      ascending = false;
    } else if (sort === 'engagement') {
      // Note: like_count column may not exist if migration 007_add_likes.sql hasn't been run
      // For now, fall back to view_count for engagement sorting
      orderBy = 'view_count';
      ascending = false;
    }
    // 'relevance' keeps default (tag matches first, then by created_at)

    // Build query for videos matching title/description OR tags
    let videoQuery = supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        original_user_id,
        created_at,
        updated_at,
        view_count,
        users:user_id (
          id,
          username,
          email,
          profile_picture_url
        ),
        original_user:original_user_id (
          id,
          username,
          email,
          profile_picture_url
        )
      `)
      .is('original_user_id', null) // Only show original shares, not reposts
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    // If there are tag matches, include them using a union approach
    // We'll combine results after fetching
    const { data: titleDescVideos, error: titleDescError } = await videoQuery
      .order(orderBy, { ascending })
      .limit(limit * 2); // Get more to account for deduplication

    // Get videos by tag match if there are any
    let tagVideos: any[] = [];
    if (tagMatchedVideoIds.length > 0) {
      const { data: tagMatchedVideos, error: tagVideosError } = await supabaseAdmin!
        .from('videos')
        .select(`
          id,
          youtube_video_id,
          title,
          description,
          user_id,
          original_user_id,
          created_at,
          updated_at,
          view_count,
          users:user_id (
            id,
            username,
            email,
            profile_picture_url
          ),
          original_user:original_user_id (
            id,
            username,
            email,
            profile_picture_url
          )
        `)
        .in('id', tagMatchedVideoIds)
        .is('original_user_id', null) // Only show original shares, not reposts
        .order(orderBy, { ascending })
        .limit(limit * 2);

      if (!tagVideosError && tagMatchedVideos) {
        tagVideos = tagMatchedVideos;
      }
    }

    // Combine and deduplicate videos
    const videoMap = new Map();
    
    // Add tag-matched videos first (higher priority for relevance)
    tagVideos.forEach((video: any) => {
      videoMap.set(video.id, video);
    });
    
    // Add title/description matches (won't overwrite tag matches)
    (titleDescVideos || []).forEach((video: any) => {
      if (!videoMap.has(video.id)) {
        videoMap.set(video.id, video);
      }
    });

    let sharedVideos = Array.from(videoMap.values());
    
    // Sort combined results if not relevance (relevance keeps tag matches first)
    if (sort !== 'relevance') {
      sharedVideos.sort((a: any, b: any) => {
        if (sort === 'recency') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        } else if (sort === 'views') {
          return (b.view_count || 0) - (a.view_count || 0);
        } else if (sort === 'engagement') {
          // Note: like_count may not exist - use view_count as fallback
          return (b.view_count || 0) - (a.view_count || 0);
        }
        return 0;
      });
    }
    
    sharedVideos = sharedVideos.slice(0, limit);

    // Refresh view counts for videos with 0 views (async, don't wait)
    sharedVideos.forEach((video: any) => {
      if ((video.view_count || 0) === 0 && video.youtube_video_id) {
        refreshVideoViewCount(video.id, video.youtube_video_id).catch((err: any) => {
          // Non-critical, don't affect response
        });
      }
    });

    // Get tags for all videos in one query
    const videoIds = sharedVideos.map((v: any) => v.id);
    let videoTagsMap: { [key: string]: string[] } = {};
    
    if (videoIds.length > 0) {
      const { data: allTags } = await supabaseAdmin!
        .from('video_tags_direct')
        .select('video_id, tag_name')
        .in('video_id', videoIds);
      
      if (allTags) {
        allTags.forEach((tagRow: any) => {
          if (!videoTagsMap[tagRow.video_id]) {
            videoTagsMap[tagRow.video_id] = [];
          }
          videoTagsMap[tagRow.video_id].push(tagRow.tag_name);
        });
      }
    }

    const sharedVideosFormatted = sharedVideos.map((video: any) => {
      const userData = Array.isArray(video.users) ? video.users[0] : video.users;
      const originalUserData = video.original_user_id 
        ? (Array.isArray(video.original_user) ? video.original_user[0] : video.original_user)
        : null;
      // Generate thumbnail URL - YouTube thumbnails are generally available for valid video IDs
      // Use hqdefault as it's more reliable than maxresdefault (which may not exist for all videos)
      let thumbnail: string | null = null;
      if (video.youtube_video_id) {
        // Validate video ID format before generating thumbnail URL
        if (/^[a-zA-Z0-9_-]{11}$/.test(video.youtube_video_id)) {
          thumbnail = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
        }
      }
      // Use created_at as display date
      const displayDate = video.created_at;

      return {
        id: video.id,
        youtubeVideoId: video.youtube_video_id,
        title: video.title,
        description: video.description,
        userId: video.user_id,
        createdAt: displayDate,
        updatedAt: video.updated_at,
        viewCount: video.view_count || 0,
        tags: videoTagsMap[video.id] || [],
        user: userData ? {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profile_picture_url: userData.profile_picture_url,
        } : null,
        originalUser: originalUserData ? {
          id: originalUserData.id,
          username: originalUserData.username,
          email: originalUserData.email,
          profile_picture_url: originalUserData.profile_picture_url,
        } : null,
        thumbnail: thumbnail,
        source: 'petflix',
      };
    });

    // Only show videos shared by Petflix users (no YouTube videos)
    const allVideos = sharedVideosFormatted;

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

    const { youtubeVideoId, title, description, tags } = req.body;

    if (!youtubeVideoId) {
      res.status(400).json({ error: 'YouTube video ID is required' });
      return;
    }

    // Validate video ID format (basic check)
    if (!/^[a-zA-Z0-9_-]{11}$/.test(youtubeVideoId)) {
      res.status(400).json({ error: 'Invalid YouTube video ID format' });
      return;
    }

    // Try to get video metadata (prefer oEmbed - free, no quota)
    // Fallback to Data API if available, then use provided/default values
    let videoTitle = title;
    let videoDescription = description;
    let videoThumbnail: string | undefined;

    // Use oEmbed API (free, no quota) to get basic metadata
    // We don't use YouTube Data API for embeds - embeds work without it
    const oembedData = await getYouTubeVideoMetadata(youtubeVideoId);
    if (oembedData) {
      videoTitle = videoTitle || oembedData.title;
      videoDescription = videoDescription || oembedData.description;
      videoThumbnail = oembedData.thumbnail;
    }

    // Fetch view count from YouTube Data API (optional - may hit quota)
    // This is the only use of Data API - just for accurate view counts
    let videoViewCount: number = 0;
    try {
      const youtubeData = await getYouTubeVideoDetails(youtubeVideoId);
      if (youtubeData.viewCount) {
        videoViewCount = parseInt(youtubeData.viewCount) || 0;
      }
      // Also use YouTube title/description if oEmbed didn't provide them
      if (!videoTitle && youtubeData.title) {
        videoTitle = youtubeData.title;
      }
      if (!videoDescription && youtubeData.description) {
        videoDescription = youtubeData.description;
      }
    } catch (error: any) {
      // Log but don't fail - we can still save the video without view count
      // This is expected when quota is exceeded or API key is missing
      console.log('YouTube Data API not available for view count (quota exceeded or API key missing). Using 0 as default.');
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
    // Use metadata from oEmbed/API, provided values, or defaults
    const finalTitle = videoTitle || `YouTube Video ${youtubeVideoId}`;
    const finalDescription = videoDescription || '';

    const { data: newVideo, error: insertError } = await supabaseAdmin!
      .from('videos')
      .insert({
        youtube_video_id: youtubeVideoId,
        title: finalTitle,
        description: finalDescription,
        user_id: req.user.userId,
        view_count: videoViewCount, // Use actual YouTube view count if available
      })
      .select('id, youtube_video_id, title, description, user_id, created_at, updated_at, view_count')
      .single();

    if (insertError || !newVideo) {
      console.error('Error creating video:', insertError);
      res.status(500).json({ error: 'Failed to share video' });
      return;
    }

    // Insert tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Normalize tags: trim, remove empty, limit length
      const normalizedTags = tags
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && tag.length <= 50)
        .slice(0, 20); // Limit to 20 tags per video

      if (normalizedTags.length > 0) {
        const tagInserts = normalizedTags.map(tag => ({
          video_id: newVideo.id,
          tag_name: tag,
        }));

        const { error: tagsError } = await supabaseAdmin!
          .from('video_tags_direct')
          .insert(tagInserts);

        if (tagsError) {
          console.error('Error inserting tags:', tagsError);
          // Don't fail the request if tags fail - video is already created
        }
      }
    }

    // Notify followers that this user shared a new video (async, don't wait)
    notifyFollowersOfVideoShare(
      req.user!.userId,
      newVideo.id,
      finalTitle
    ).catch((err: any) => {
      console.error('Error notifying followers:', err);
      // Non-critical error, don't affect response
    });

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

    // All videos should be in the database (user-shared videos only)
    // No direct YouTube video access
    // Get from database
    // Note: like_count column may not exist if migration 007_add_likes.sql hasn't been run
    const { data: video, error } = await supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        original_user_id,
        created_at,
        updated_at,
        view_count,
        users:user_id (
          id,
          username,
          email,
          profile_picture_url,
          bio
        ),
        original_user:original_user_id (
          id,
          username,
          email,
          profile_picture_url,
          bio
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching video:', JSON.stringify(error, null, 2));
      console.error('Video ID:', id);
      // Check if it's a "not found" error (PGRST116) or something else
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Video not found' });
      } else {
        console.error('Database error fetching video - code:', error.code, 'message:', error.message);
        res.status(500).json({ error: 'Failed to load video', details: error.message });
      }
      return;
    }

    if (!video) {
      console.log(`Video with ID ${id} not found in database`);
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // If view count is 0, try to refresh it from YouTube (async, don't wait)
    if (video.view_count === 0 && video.youtube_video_id) {
      refreshVideoViewCount(video.id, video.youtube_video_id).catch((err: any) => {
        console.log('Failed to refresh view count:', err.message);
        // Non-critical, don't affect response
      });
    }

    const userData = Array.isArray(video.users) ? video.users[0] : video.users;
    const originalUserData = video.original_user_id 
      ? (Array.isArray(video.original_user) ? video.original_user[0] : video.original_user)
      : null;
    
    // Get like status if user is authenticated
    let isLiked = false;
    if (req.user) {
      const { data: like } = await supabaseAdmin!
        .from('likes')
        .select('id')
        .eq('user_id', req.user.userId)
        .eq('video_id', id)
        .single();
      isLiked = !!like;
    }

    // Get like count
    let likeCount = 0;
    try {
      const { count } = await supabaseAdmin!
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', id);
      likeCount = count || 0;
    } catch (countError: any) {
      console.log('Could not fetch like count:', countError.message);
    }

    // Use YouTube published date if available, otherwise use created_at (when shared on Petflix)
    const displayDate = (video as any).youtube_published_at || video.created_at;

    res.json({
      id: video.id,
      youtubeVideoId: video.youtube_video_id,
      title: video.title,
      description: video.description,
      userId: video.user_id,
      createdAt: displayDate, // Use YouTube publish date if available
      updatedAt: video.updated_at,
      likeCount: likeCount,
      isLiked: isLiked,
      user: userData ? {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        profile_picture_url: userData.profile_picture_url || null,
        bio: (userData as any).bio || null,
        created_at: (userData as any).created_at || video.created_at,
        updated_at: (userData as any).updated_at || video.updated_at,
      } : undefined,
      originalUser: originalUserData ? {
        id: originalUserData.id,
        username: originalUserData.username,
        email: originalUserData.email,
        profile_picture_url: originalUserData.profile_picture_url || null,
        bio: (originalUserData as any).bio || null,
        created_at: (originalUserData as any).created_at || video.created_at,
        updated_at: (originalUserData as any).updated_at || video.updated_at,
      } : undefined,
    } as VideoDetailsResponse);
  } catch (error: any) {
    console.error('Get video error:', error);
    console.error('Error stack:', error?.stack);
    res.status(500).json({ error: 'Internal server error', details: error?.message });
  }
};

/**
 * Get user's search history
 * GET /api/v1/videos/search-history
 */
export const getSearchHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const limit = parseInt((req.query.limit as string) || '20');

    const { data: history, error } = await supabaseAdmin!
      .from('search_history')
      .select('id, query, created_at')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching search history:', error);
      res.status(500).json({ error: 'Failed to load search history' });
      return;
    }

    res.json({
      history: history || [],
    });
  } catch (error) {
    console.error('Get search history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Clear user's search history
 * DELETE /api/v1/videos/search-history
 */
export const clearSearchHistory = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { error } = await supabaseAdmin!
      .from('search_history')
      .delete()
      .eq('user_id', req.user.userId);

    if (error) {
      console.error('Error clearing search history:', error);
      res.status(500).json({ error: 'Failed to clear search history' });
      return;
    }

    res.json({ message: 'Search history cleared' });
  } catch (error) {
    console.error('Clear search history error:', error);
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
      console.error('Error fetching following users:', followingError);
      res.status(500).json({ error: 'Failed to load feed' });
      return;
    }

    console.log(`User ${req.user.userId} is following ${following?.length || 0} users`);

    if (!following || following.length === 0) {
      console.log('No users being followed, returning empty feed');
      res.json({ videos: [] });
      return;
    }

    const followingIds = following.map(f => f.following_id);
    console.log('Following user IDs:', followingIds);

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
        view_count,
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
      console.error('Error fetching videos from followed users:', videosError);
      res.status(500).json({ error: 'Failed to load feed' });
      return;
    }

    console.log(`Found ${videos?.length || 0} videos from followed users`);

    // Refresh view counts for videos with 0 views (async, don't wait)
    (videos || []).forEach((video: any) => {
      if ((video.view_count || 0) === 0 && video.youtube_video_id) {
        refreshVideoViewCount(video.id, video.youtube_video_id).catch((err: any) => {
          // Non-critical, don't affect response
        });
      }
    });

    // Format videos with thumbnails (generate directly from video IDs)
    const videosFormatted = (videos || []).map((video: any) => {
      const userData = Array.isArray(video.users) ? video.users[0] : video.users;
      const originalUserData = video.original_user_id 
        ? (Array.isArray(video.original_user) ? video.original_user[0] : video.original_user)
        : null;
      // Generate thumbnail URL directly from YouTube video ID
      let thumbnail: string | null = null;
      if (video.youtube_video_id) {
        if (/^[a-zA-Z0-9_-]{11}$/.test(video.youtube_video_id)) {
          thumbnail = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
        }
      }
      // Use created_at as display date
      const displayDate = video.created_at;

      return {
        id: video.id,
        youtubeVideoId: video.youtube_video_id,
        title: video.title,
        description: video.description,
        userId: video.user_id,
        createdAt: displayDate,
        updatedAt: video.updated_at,
        viewCount: video.view_count || 0,
        thumbnail: thumbnail,
        user: userData ? {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profile_picture_url: userData.profile_picture_url,
        } : null,
        originalUser: originalUserData ? {
          id: originalUserData.id,
          username: originalUserData.username,
          email: originalUserData.email,
          profile_picture_url: originalUserData.profile_picture_url,
        } : null,
      };
    });

    console.log(`Returning ${videosFormatted.length} formatted videos`);
    res.json({
      videos: videosFormatted,
    });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get videos by user
 * GET /api/v1/videos/user/:userId?type=shared|reposted
 */
export const getVideosByUser = async (
  req: Request<{ userId: string }, any, {}, { type?: string }>,
  res: Response
) => {
  try {
    const { userId } = req.params;
    const type = req.query.type || 'shared'; // 'shared' or 'reposted'

    let query = supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        original_user_id,
        created_at,
        updated_at,
        view_count,
        users:user_id (
          id,
          username,
          email,
          profile_picture_url
        ),
        original_user:original_user_id (
          id,
          username,
          email,
          profile_picture_url
        )
      `)
      .eq('user_id', userId);

    // Filter by type: 'shared' = original videos (no original_user_id), 'reposted' = reposted videos (has original_user_id)
    if (type === 'reposted') {
      query = query.not('original_user_id', 'is', null);
    } else {
      // Default to 'shared' - videos where user_id is the original sharer
      query = query.is('original_user_id', null);
    }

    const { data: videos, error } = await query.order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to load videos' });
      return;
    }

    // Refresh view counts for videos with 0 views (async, don't wait)
    (videos || []).forEach((video: any) => {
      if (video.view_count === 0 && video.youtube_video_id) {
        refreshVideoViewCount(video.id, video.youtube_video_id).catch((err: any) => {
          // Non-critical, don't affect response
        });
      }
    });

    // Format videos with thumbnails (generate directly from video IDs, don't use API)
    const videosFormatted = (videos || []).map((video: any) => {
      // Generate thumbnail URL directly from YouTube video ID
      // This is more reliable than using the API which may hit quota limits
      let thumbnail: string | null = null;
      if (video.youtube_video_id) {
        // Validate video ID format before generating thumbnail URL
        if (/^[a-zA-Z0-9_-]{11}$/.test(video.youtube_video_id)) {
          thumbnail = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
        }
      }
      // Use created_at as display date
      const displayDate = video.created_at;

      const userData = Array.isArray(video.users) ? video.users[0] : video.users;
      const originalUserData = video.original_user_id 
        ? (Array.isArray(video.original_user) ? video.original_user[0] : video.original_user)
        : null;

      return {
        id: video.id,
        youtubeVideoId: video.youtube_video_id,
        title: video.title,
        description: video.description,
        userId: video.user_id,
        createdAt: displayDate,
        updatedAt: video.updated_at,
        viewCount: video.view_count || 0,
        thumbnail: thumbnail,
        user: userData ? {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profile_picture_url: userData.profile_picture_url,
        } : null,
        originalUser: originalUserData ? {
          id: originalUserData.id,
          username: originalUserData.username,
          email: originalUserData.email,
          profile_picture_url: originalUserData.profile_picture_url,
        } : null,
      };
    });

    res.json({ videos: videosFormatted });
  } catch (error) {
    console.error('Get videos by user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get recent/trending videos (all shared videos, most recent first)
 * GET /api/v1/videos/recent
 */
export const getRecentVideos = async (
  req: Request<{}, VideoSearchResponse | ErrorResponse, {}, { limit?: string; tag?: string; offset?: string }>,
  res: Response
) => {
  try {
    const limit = parseInt(req.query.limit || '12');
    const offset = parseInt(req.query.offset || '0');
    const tagFilter = req.query.tag;

    let query = supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        original_user_id,
        created_at,
        updated_at,
        view_count,
        users:user_id (
          id,
          username,
          email,
          profile_picture_url
        ),
        original_user:original_user_id (
          id,
          username,
          email,
          profile_picture_url
        )
      `)
      .is('original_user_id', null); // Only show original shares, not reposts

    // If tag filter is provided, join with video_tags_direct and filter
    if (tagFilter && tagFilter.trim()) {
      // Map filter names to tag names - comprehensive mapping
      const tagMap: { [key: string]: string[] } = {
        'dogs': [
          'Dog', 'Dogs', 'Puppy', 'Puppies', 'Pup', 'Pups', 'Canine', 'Doggy', 'Doggo',
          'Golden Retriever', 'Labrador', 'German Shepherd', 'Bulldog', 'Beagle', 'Poodle', 'Rottweiler',
          'Yorkshire Terrier', 'Dachshund', 'Siberian Husky', 'Great Dane', 'Boxer', 'Shih Tzu',
          'Border Collie', 'Australian Shepherd', 'Corgi', 'Chihuahua', 'Pomeranian', 'French Bulldog'
        ],
        'cats': [
          'Cat', 'Cats', 'Kitten', 'Kittens', 'Kitty', 'Kitties', 'Feline', 'Meow', 'Purr',
          'Persian', 'Maine Coon', 'British Shorthair', 'Ragdoll', 'Siamese', 'Bengal', 'Sphynx',
          'Scottish Fold', 'American Shorthair', 'Russian Blue', 'Abyssinian', 'Turkish Angora'
        ],
        'birds': [
          'Bird', 'Birds', 'Parrot', 'Parrots', 'Cockatiel', 'Cockatiels', 'Canary', 'Canaries',
          'Finch', 'Finches', 'Budgie', 'Budgies', 'Lovebird', 'Lovebirds', 'Macaw', 'Macaws',
          'Cockatoo', 'Cockatoos', 'African Grey', 'Conure', 'Conures', 'Quaker Parrot', 'Zebra Finch',
          'Chicken', 'Chickens', 'Rooster', 'Duck', 'Ducks', 'Goose', 'Geese', 'Pigeon', 'Pigeons'
        ],
        'small and fluffy': [
          'Hamster', 'Hamsters', 'Rabbit', 'Rabbits', 'Bunny', 'Bunnies', 'Guinea Pig', 'Guinea Pigs',
          'Mouse', 'Mice', 'Rat', 'Rats', 'Gerbil', 'Gerbils', 'Chinchilla', 'Chinchillas',
          'Ferret', 'Ferrets', 'Hedgehog', 'Hedgehogs', 'Sugar Glider', 'Sugar Gliders',
          'Small Pets', 'Fluffy', 'Tiny', 'Small Animal', 'Rodent', 'Rodents'
        ],
        'underwater': [
          'Fish', 'Fishes', 'Goldfish', 'Betta', 'Bettas', 'Guppy', 'Guppies', 'Angelfish',
          'Tetra', 'Tetras', 'Cichlid', 'Cichlids', 'Discus', 'Oscar', 'Oscars', 'Koi',
          'Aquarium', 'Aquatic', 'Underwater', 'Marine', 'Tropical Fish', 'Saltwater', 'Freshwater',
          'Turtle', 'Turtles', 'Tortoise', 'Tortoises', 'Sea Turtle', 'Terrapin', 'Terrapins',
          'Frog', 'Frogs', 'Toad', 'Toads', 'Axolotl', 'Axolotls', 'Newt', 'Newts'
        ]
      };

      const filterLower = tagFilter.toLowerCase();
      const tagNames = tagMap[filterLower] || [tagFilter]; // Use provided tag if not in map

      // Get video IDs that have matching tags
      const { data: taggedVideos, error: tagsError } = await supabaseAdmin!
        .from('video_tags_direct')
        .select('video_id')
        .in('tag_name', tagNames);

      // If there are tagged videos, filter by them
      // If not, we'll still try to get YouTube results
      if (taggedVideos && taggedVideos.length > 0) {
        const videoIds = taggedVideos.map((tv: any) => tv.video_id);
        query = query.in('id', videoIds);
      } else {
        // No tagged videos in database, but we'll still try YouTube
        // Set query to return no results from database (we'll rely on YouTube)
        query = query.eq('id', '00000000-0000-0000-0000-000000000000'); // Impossible ID to return empty
      }
    }

    // Order by popularity: view count (descending) first, then recency (created_at descending)
    // This ensures popular videos appear first, with newer popular videos prioritized
    const { data: videos, error: dbError } = await query
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1); // Use range for pagination

    if (dbError) {
      res.status(500).json({ error: 'Failed to load videos' });
      return;
    }

    // Get tags for all videos in one query
    const videoIds = (videos || []).map((v: any) => v.id);
    let videoTagsMap: { [key: string]: string[] } = {};
    
    if (videoIds.length > 0) {
      const { data: allTags } = await supabaseAdmin!
        .from('video_tags_direct')
        .select('video_id, tag_name')
        .in('video_id', videoIds);
      
      if (allTags) {
        allTags.forEach((tagRow: any) => {
          if (!videoTagsMap[tagRow.video_id]) {
            videoTagsMap[tagRow.video_id] = [];
          }
          videoTagsMap[tagRow.video_id].push(tagRow.tag_name);
        });
      }
    }

    // Refresh view counts for videos with 0 views (async, don't wait)
    (videos || []).forEach((video: any) => {
      if (video.view_count === 0 && video.youtube_video_id) {
        refreshVideoViewCount(video.id, video.youtube_video_id).catch((err: any) => {
          // Non-critical, don't affect response
        });
      }
    });

    const videosFormatted = (videos || []).map((video: any) => {
      const userData = Array.isArray(video.users) ? video.users[0] : video.users;
      // Generate thumbnail URL directly from YouTube video ID
      let thumbnail: string | null = null;
      if (video.youtube_video_id) {
        if (/^[a-zA-Z0-9_-]{11}$/.test(video.youtube_video_id)) {
          thumbnail = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
        }
      }
      return {
        id: video.id,
        youtubeVideoId: video.youtube_video_id,
        title: video.title,
        description: video.description,
        userId: video.user_id,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
        viewCount: video.view_count || 0,
        tags: videoTagsMap[video.id] || [],
        user: userData ? {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profile_picture_url: userData.profile_picture_url,
        } : null,
        thumbnail: thumbnail,
        source: 'petflix',
      };
    });

    // Only show videos shared by Petflix users (no YouTube API calls)
    // Videos are already sorted by view count and recency from the database query
    const allVideos = videosFormatted;

    res.json({
      videos: allVideos,
      total: allVideos.length,
      page: Math.floor(offset / limit) + 1,
      pageSize: limit,
      hasMore: allVideos.length === limit, // Indicate if there might be more results
    });
  } catch (error) {
    console.error('Get recent videos error:', error);
    res.status(500).json({ error: 'Failed to load recent videos' });
  }
};

/**
 * Like a video
 * POST /api/v1/videos/:id/like
 */
export const likeVideo = async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Check if video exists
    const { data: video, error: videoError } = await supabaseAdmin!
      .from('videos')
      .select('id')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Check if already liked (use maybeSingle to avoid error if not found)
    const { data: existingLike, error: checkError } = await supabaseAdmin!
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', id)
      .maybeSingle();

    // If there's an error other than "not found", log it but continue
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing like:', checkError);
    }

    if (existingLike) {
      res.status(409).json({ error: 'Video already liked' });
      return;
    }

    // Create like (trigger will update like_count)
    const { error: likeError } = await supabaseAdmin!
      .from('likes')
      .insert({
        user_id: userId,
        video_id: id,
      });

    if (likeError) {
      console.error('Error liking video:', likeError);
      res.status(500).json({ error: 'Failed to like video' });
      return;
    }

    res.json({ message: 'Video liked successfully' });
  } catch (error) {
    console.error('Like video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Unlike a video
 * DELETE /api/v1/videos/:id/like
 */
export const unlikeVideo = async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Delete like (trigger will update like_count)
    const { error: unlikeError } = await supabaseAdmin!
      .from('likes')
      .delete()
      .eq('user_id', userId)
      .eq('video_id', id);

    if (unlikeError) {
      console.error('Error unliking video:', unlikeError);
      res.status(500).json({ error: 'Failed to unlike video' });
      return;
    }

    res.json({ message: 'Video unliked successfully' });
  } catch (error) {
    console.error('Unlike video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check if user has liked a video
 * GET /api/v1/videos/:id/like-status
 */
export const getLikeStatus = async (req: Request<{ id: string }>, res: Response) => {
  try {
    if (!req.user) {
      res.json({ isLiked: false, likeCount: 0 });
      return;
    }

    const { id } = req.params;
    const userId = req.user.userId;

    // Check if user has liked the video
    const { data: like } = await supabaseAdmin!
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', id)
      .single();

    // Get like count
    const { count: likeCount } = await supabaseAdmin!
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('video_id', id);

    res.json({
      isLiked: !!like,
      likeCount: likeCount || 0,
    });
  } catch (error) {
    console.error('Get like status error:', error);
    res.json({ isLiked: false, likeCount: 0 });
  }
};

/**
 * Update a video (title and description)
 * PUT /api/v1/videos/:id
 */
export const updateVideo = async (
  req: Request<{ id: string }, VideoResponse | ErrorResponse, { title?: string; description?: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { title, description } = req.body;

    // Verify user owns the video
    const { data: video, error: videoError } = await supabaseAdmin!
      .from('videos')
      .select('user_id, title, description')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    if (video.user_id !== req.user.userId) {
      res.status(403).json({ error: 'You can only edit your own videos' });
      return;
    }

    // Update video
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) {
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description || null;
    }

    const { data: updatedVideo, error: updateError } = await supabaseAdmin!
      .from('videos')
      .update(updateData)
      .eq('id', id)
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        created_at,
        updated_at,
        like_count,
        users:user_id (
          id,
          username,
          email,
          profile_picture_url
        )
      `)
      .single();

    if (updateError || !updatedVideo) {
      console.error('Error updating video:', updateError);
      res.status(500).json({ error: 'Failed to update video' });
      return;
    }

    const userData = Array.isArray(updatedVideo.users) ? updatedVideo.users[0] : updatedVideo.users;

    res.json({
      id: updatedVideo.id,
      youtubeVideoId: updatedVideo.youtube_video_id,
      title: updatedVideo.title,
      description: updatedVideo.description,
      userId: updatedVideo.user_id,
      createdAt: updatedVideo.created_at,
      updatedAt: updatedVideo.updated_at,
      likeCount: updatedVideo.like_count || 0,
      user: userData ? {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        profile_picture_url: userData.profile_picture_url,
      } : null,
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Helper function to refresh view count from YouTube
 * This is called asynchronously when needed
 */
const refreshVideoViewCount = async (videoId: string, youtubeVideoId: string): Promise<void> => {
  try {
    const youtubeData = await getYouTubeVideoDetails(youtubeVideoId);
    if (youtubeData.viewCount) {
      const viewCount = parseInt(youtubeData.viewCount) || 0;
      await supabaseAdmin!
        .from('videos')
        .update({ view_count: viewCount })
        .eq('id', videoId);
      console.log(`Updated view count for video ${videoId} to ${viewCount}`);
    }
  } catch (error: any) {
    // Silently fail - this is a background operation
    console.log(`Could not refresh view count for video ${videoId}: ${error.message}`);
  }
};

/**
 * Refresh view counts for all videos with 0 views
 * POST /api/v1/videos/refresh-view-counts
 */
export const refreshAllViewCounts = async (req: Request, res: Response) => {
  try {
    // Get all videos with 0 views
    const { data: videos, error } = await supabaseAdmin!
      .from('videos')
      .select('id, youtube_video_id')
      .eq('view_count', 0)
      .not('youtube_video_id', 'is', null)
      .limit(100); // Process in batches to avoid rate limits

    if (error) {
      res.status(500).json({ error: 'Failed to fetch videos' });
      return;
    }

    if (!videos || videos.length === 0) {
      res.json({ message: 'No videos with 0 views to refresh', updated: 0 });
      return;
    }

    // Update view counts (process in background, don't wait)
    let updated = 0;
    const updatePromises = videos.map(async (video: any) => {
      try {
        const youtubeData = await getYouTubeVideoDetails(video.youtube_video_id);
        if (youtubeData.viewCount) {
          const viewCount = parseInt(youtubeData.viewCount) || 0;
          await supabaseAdmin!
            .from('videos')
            .update({ view_count: viewCount })
            .eq('id', video.id);
          updated++;
        }
        // Add small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        console.log(`Failed to update view count for video ${video.id}: ${error.message}`);
      }
    });

    // Wait for all updates to complete
    await Promise.all(updatePromises);

    res.json({ 
      message: `Refreshed view counts for ${updated} videos`,
      updated,
      total: videos.length
    });
  } catch (error) {
    console.error('Refresh view counts error:', error);
    res.status(500).json({ error: 'Failed to refresh view counts' });
  }
};

/**
 * Repost/Share a video (credits original user)
 * POST /api/v1/videos/:id/repost
 */
export const repostVideo = async (
  req: Request<{ id: string }, VideoResponse | ErrorResponse>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Get the original video
    const { data: originalVideo, error: videoError } = await supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        view_count,
        original_user_id
      `)
      .eq('id', id)
      .single();

    if (videoError || !originalVideo) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Determine the original sharer (if already a repost, use original_user_id, otherwise use user_id)
    const originalUserId = originalVideo.original_user_id || originalVideo.user_id;

    // Prevent reposting your own videos
    if (originalUserId === req.user.userId) {
      res.status(400).json({ error: 'You cannot repost your own video' });
      return;
    }

    // Check if user has already reposted this video
    const { data: existingRepost } = await supabaseAdmin!
      .from('videos')
      .select('id')
      .eq('youtube_video_id', originalVideo.youtube_video_id)
      .eq('user_id', req.user.userId)
      .single();

    if (existingRepost) {
      res.status(409).json({ error: 'You have already shared this video' });
      return;
    }

    // Create reposted video entry
    const { data: newVideo, error: insertError } = await supabaseAdmin!
      .from('videos')
      .insert({
        youtube_video_id: originalVideo.youtube_video_id,
        title: originalVideo.title,
        description: originalVideo.description,
        user_id: req.user.userId, // Current user is reposting
        original_user_id: originalUserId, // Credit the original sharer
        view_count: originalVideo.view_count || 0,
      })
      .select('id, youtube_video_id, title, description, user_id, original_user_id, created_at, updated_at, view_count')
      .single();

    if (insertError || !newVideo) {
      console.error('Error creating repost:', insertError);
      res.status(500).json({ error: 'Failed to repost video' });
      return;
    }

    // Copy tags from original video
    const { data: originalTags } = await supabaseAdmin!
      .from('video_tags_direct')
      .select('tag_name')
      .eq('video_id', id);

    if (originalTags && originalTags.length > 0) {
      const tagInserts = originalTags.map(tag => ({
        video_id: newVideo.id,
        tag_name: tag.tag_name,
      }));

      const { error: tagsError } = await supabaseAdmin!
        .from('video_tags_direct')
        .insert(tagInserts);

      if (tagsError) {
        console.error('Error copying tags:', tagsError);
        // Don't fail the request if tags fail
      }
    }

    // Notify followers that this user reposted a video (async, don't wait)
    notifyFollowersOfVideoShare(
      req.user!.userId,
      newVideo.id,
      originalVideo.title
    ).catch((err: any) => {
      console.error('Error notifying followers:', err);
      // Non-critical error, don't affect response
    });

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
    console.error('Repost video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check if user can repost a video
 * GET /api/v1/videos/:id/can-repost
 */
export const canRepostVideo = async (
  req: Request<{ id: string }, { canRepost: boolean; reason?: string } | ErrorResponse>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Get the video
    const { data: video, error: videoError } = await supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        user_id,
        original_user_id
      `)
      .eq('id', id)
      .single();

    if (videoError || !video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Determine the original sharer
    const originalUserId = video.original_user_id || video.user_id;

    // Check if user owns this video (either as original sharer or reposter)
    if (video.user_id === req.user.userId || originalUserId === req.user.userId) {
      res.json({ canRepost: false, reason: 'You cannot repost your own video' });
      return;
    }

    // Check if user has already shared or reposted this video
    const { data: existingVideo } = await supabaseAdmin!
      .from('videos')
      .select('id')
      .eq('youtube_video_id', video.youtube_video_id)
      .eq('user_id', req.user.userId)
      .single();

    if (existingVideo) {
      res.json({ canRepost: false, reason: 'You have already shared this video' });
      return;
    }

    res.json({ canRepost: true });
  } catch (error) {
    console.error('Can repost video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get videos liked by a user
 * GET /api/v1/videos/liked/:userId
 */
export const getLikedVideos = async (
  req: Request<{ userId: string }, any, {}, {}>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    // Get all video IDs that this user has liked
    const { data: likes, error: likesError } = await supabaseAdmin!
      .from('likes')
      .select('video_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (likesError) {
      res.status(500).json({ error: 'Failed to load liked videos' });
      return;
    }

    if (!likes || likes.length === 0) {
      res.json({ videos: [] });
      return;
    }

    const videoIds = likes.map(like => like.video_id);

    // Get the actual video data
    const { data: videos, error: videosError } = await supabaseAdmin!
      .from('videos')
      .select(`
        id,
        youtube_video_id,
        title,
        description,
        user_id,
        original_user_id,
        created_at,
        updated_at,
        view_count,
        users:user_id (
          id,
          username,
          email,
          profile_picture_url
        ),
        original_user:original_user_id (
          id,
          username,
          email,
          profile_picture_url
        )
      `)
      .in('id', videoIds)
      .order('created_at', { ascending: false });

    if (videosError) {
      res.status(500).json({ error: 'Failed to load liked videos' });
      return;
    }

    // Refresh view counts for videos with 0 views (async, don't wait)
    (videos || []).forEach((video: any) => {
      if (video.view_count === 0 && video.youtube_video_id) {
        refreshVideoViewCount(video.id, video.youtube_video_id).catch((err: any) => {
          // Non-critical, don't affect response
        });
      }
    });

    // Format videos with thumbnails
    const videosFormatted = (videos || []).map((video: any) => {
      let thumbnail: string | null = null;
      if (video.youtube_video_id) {
        if (/^[a-zA-Z0-9_-]{11}$/.test(video.youtube_video_id)) {
          thumbnail = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
        }
      }
      const displayDate = video.created_at;

      const userData = Array.isArray(video.users) ? video.users[0] : video.users;
      const originalUserData = video.original_user_id 
        ? (Array.isArray(video.original_user) ? video.original_user[0] : video.original_user)
        : null;

      return {
        id: video.id,
        youtubeVideoId: video.youtube_video_id,
        title: video.title,
        description: video.description,
        userId: video.user_id,
        createdAt: displayDate,
        updatedAt: video.updated_at,
        viewCount: video.view_count || 0,
        thumbnail: thumbnail,
        user: userData ? {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profile_picture_url: userData.profile_picture_url,
        } : null,
        originalUser: originalUserData ? {
          id: originalUserData.id,
          username: originalUserData.username,
          email: originalUserData.email,
          profile_picture_url: originalUserData.profile_picture_url,
        } : null,
      };
    });

    res.json({ videos: videosFormatted });
  } catch (error) {
    console.error('Get liked videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Report a video
 * POST /api/v1/videos/:id/report
 */
export const reportVideo = async (
  req: Request<{ id: string }, { message: string } | ErrorResponse, { reason: string; description?: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { reason, description } = req.body;

    if (!reason || reason.trim() === '') {
      res.status(400).json({ error: 'Report reason is required' });
      return;
    }

    // Check if video exists
    const { data: video, error: videoError } = await supabaseAdmin!
      .from('videos')
      .select('id')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    // Check if user already reported this video
    const { data: existingReport } = await supabaseAdmin!
      .from('video_reports')
      .select('id')
      .eq('video_id', id)
      .eq('reporter_id', req.user.userId)
      .single();

    if (existingReport) {
      res.status(409).json({ error: 'You have already reported this video' });
      return;
    }

    // Create report
    const { error: reportError } = await supabaseAdmin!
      .from('video_reports')
      .insert({
        video_id: id,
        reporter_id: req.user.userId,
        reason: reason.trim(),
        description: description?.trim() || null,
        status: 'pending',
      });

    if (reportError) {
      console.error('Error creating report:', reportError);
      res.status(500).json({ error: 'Failed to submit report' });
      return;
    }

    res.json({ message: 'Video reported successfully. Thank you for helping keep Petflix safe.' });
  } catch (error) {
    console.error('Report video error:', error);
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

