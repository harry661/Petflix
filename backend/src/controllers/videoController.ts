import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate } from '../middleware/auth';
import { notifyFollowersOfVideoShare, createNotification } from '../services/notificationService';
import {
  VideoCreationRequest,
  VideoResponse,
  VideoDetailsResponse,
  VideoSearchResponse,
  ErrorResponse,
} from '../types';
// YouTube URL validation is handled in youtubeService
import { getYouTubeVideoMetadata, getYouTubeVideoDetails, searchYouTubeVideos } from '../services/youtubeService';
import { getCachedSearch, setCachedSearch } from '../services/searchCache';

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

    // Combine Petflix videos with YouTube search results
    let allVideos = sharedVideosFormatted;
    let youtubeVideos: any[] = [];
    
    // Only search YouTube if:
    // 1. We have fewer results than requested (need more content)
    // 2. OR if no Petflix results at all (user searching for something new)
    const needsMoreResults = allVideos.length < limit;
    const hasNoResults = allVideos.length === 0;
    
    // Log YouTube API key status for debugging
    console.log('[Search] YouTube API key status:', {
      hasKey: !!process.env.YOUTUBE_API_KEY,
      keyPrefix: process.env.YOUTUBE_API_KEY ? process.env.YOUTUBE_API_KEY.substring(0, 10) + '...' : 'NOT SET',
      petflixResults: allVideos.length,
      requestedLimit: limit,
      needsMoreResults,
      hasNoResults,
    });
    
    if (!process.env.YOUTUBE_API_KEY) {
      console.log('[Search] ⚠️ YouTube API key not configured - skipping YouTube search');
    }
    
    if ((needsMoreResults || hasNoResults) && process.env.YOUTUBE_API_KEY) {
      console.log(`[Search] ✅ Attempting YouTube search - needsMoreResults: ${needsMoreResults}, hasNoResults: ${hasNoResults}, query: "${query}"`);
      try {
        // Check cache first to avoid API calls
        const cachedResults = getCachedSearch(query);
        
        if (cachedResults) {
          console.log(`[Search] Using cached YouTube results for: "${query}"`);
          youtubeVideos = cachedResults;
        } else {
          // Calculate how many YouTube results we need
          const youtubeLimit = Math.min(limit - allVideos.length, 10); // Max 10 from YouTube per search
          
          if (youtubeLimit > 0) {
            console.log(`[Search] Searching YouTube for: "${query}" (need ${youtubeLimit} more results)`);
            
            const youtubeResults = await searchYouTubeVideos(query, youtubeLimit);
            
            // Format YouTube videos to match our video format
            youtubeVideos = youtubeResults.videos.map((video: any) => ({
              id: null, // YouTube videos don't have Petflix IDs
              youtubeVideoId: video.id,
              title: video.title,
              description: video.description || '',
              userId: null,
              createdAt: video.publishedAt,
              updatedAt: video.publishedAt,
              viewCount: parseInt(video.viewCount || '0'),
              tags: [], // YouTube videos don't have tags in our system
              user: null, // YouTube videos aren't shared by Petflix users
              originalUser: null,
              thumbnail: video.thumbnail,
              source: 'youtube', // Mark as YouTube source
              channelTitle: video.channelTitle,
              likeCount: parseInt(video.likeCount || '0'),
              commentCount: parseInt(video.commentCount || '0'),
            }));
            
            // Cache the results
            setCachedSearch(query, youtubeVideos);
            console.log(`[Search] Cached ${youtubeVideos.length} YouTube results for: "${query}"`);
          }
        }
      } catch (youtubeError: any) {
        // Log detailed error information
        console.error('[Search] YouTube search error:', {
          message: youtubeError.message,
          stack: youtubeError.stack,
          error: youtubeError,
        });
        
        // Check if it's a quota error
        const isQuotaError = youtubeError.message?.includes('quota') || 
                           youtubeError.message?.includes('quotaExceeded') ||
                           youtubeError.message?.includes('quota exceeded');
        
        if (isQuotaError) {
          console.warn('[Search] ⚠️ YouTube API quota exceeded - using database results only');
          console.warn('[Search] Quota resets at midnight Pacific Time');
        } else {
          // Log other errors for debugging
          console.error('[Search] YouTube API error (non-quota):', youtubeError.message);
          console.error('[Search] This could be: API key issue, network error, or API configuration problem');
        }
        
        // Continue with just database results
        youtubeVideos = []; // Ensure it's empty array
      }
    }
    
    // Combine results: Petflix videos first, then YouTube videos
    // This prioritizes content already shared on the platform
    allVideos = [...allVideos, ...youtubeVideos];
    
    // Limit to requested page size
    allVideos = allVideos.slice(0, limit);

    res.json({
      videos: allVideos,
      total: allVideos.length,
      page,
      pageSize: limit,
      sources: {
        petflix: sharedVideosFormatted.length,
        youtube: youtubeVideos.length,
      },
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

    // Check if video already shared by this user (only check for shared videos, not reposts)
    // A shared video has original_user_id IS NULL
    // Users can share a video even if they've reposted it - they're different actions
    const { data: existingVideo } = await supabaseAdmin!
      .from('videos')
      .select('id')
      .eq('youtube_video_id', youtubeVideoId)
      .eq('user_id', req.user.userId)
      .is('original_user_id', null) // Only check for existing shared videos
      .maybeSingle();

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
    
    // Check if this is a reposted video
    const isReposted = !!video.original_user_id;
    
    // For reposted YouTube videos, fetch YouTube metadata to show original uploader
    let authorName: string | undefined;
    let authorUrl: string | undefined;
    let source: 'petflix' | 'youtube' = 'petflix';
    
    if (video.youtube_video_id && isReposted) {
      // This is a reposted YouTube video - fetch original YouTube uploader info
      try {
        const metadata = await getYouTubeVideoMetadata(video.youtube_video_id);
        if (metadata?.authorName) {
          authorName = metadata.authorName;
          authorUrl = metadata.authorUrl;
          source = 'youtube';
        }
      } catch (err) {
        // Silently fail - will show Petflix user instead
      }
    }
    
    // Get like status if user is authenticated
    let isLiked = false;
    if (req.user) {
      const { data: like, error: likeError } = await supabaseAdmin!
        .from('likes')
        .select('id')
        .eq('user_id', req.user.userId)
        .eq('video_id', id)
        .maybeSingle();
      
      // Only set isLiked if we found a like (ignore "not found" errors)
      if (likeError && likeError.code !== 'PGRST116') {
        console.error('Error checking like status:', likeError);
      }
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
      // For reposted videos, userId should be the original sharer, not the reposter
      userId: isReposted ? (originalUserData?.id || video.user_id) : video.user_id,
      createdAt: displayDate, // Use YouTube publish date if available
      updatedAt: video.updated_at,
      likeCount: likeCount,
      isLiked: isLiked,
      source: source,
      authorName: authorName,
      authorUrl: authorUrl,
      // For reposted videos, user should be null (we show originalUser or YouTube uploader instead)
      // For non-reposted videos, user is the sharer
      user: isReposted ? undefined : (userData ? {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        profile_picture_url: userData.profile_picture_url || null,
        bio: (userData as any).bio || null,
        created_at: (userData as any).created_at || video.created_at,
        updated_at: (userData as any).updated_at || video.updated_at,
      } : undefined),
      // For reposted YouTube videos, originalUser is undefined (we show YouTube uploader via authorName)
      // For reposted Petflix videos, originalUser is the original Petflix sharer
      originalUser: (source === 'youtube' && authorName) ? undefined : (originalUserData ? {
        id: originalUserData.id,
        username: originalUserData.username,
        email: originalUserData.email,
        profile_picture_url: originalUserData.profile_picture_url || null,
        bio: (originalUserData as any).bio || null,
        created_at: (originalUserData as any).created_at || video.created_at,
        updated_at: (originalUserData as any).updated_at || video.updated_at,
      } : undefined),
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

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      // Return empty history instead of error - feature is non-critical
      res.json({ history: [] });
      return;
    }

    const { data: history, error } = await supabaseAdmin
      .from('search_history')
      .select('id, query, created_at')
      .eq('user_id', req.user.userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      // Check if it's a table doesn't exist error (42P01 in PostgreSQL)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('Search history table does not exist, returning empty history');
        // Return empty history instead of error - feature is non-critical
        res.json({ history: [] });
        return;
      }
      console.error('Error fetching search history:', error);
      // Return empty history instead of error - feature is non-critical
      res.json({ history: [] });
      return;
    }

    res.json({
      history: history || [],
    });
  } catch (error: any) {
    console.error('Get search history error:', error);
    // Return empty history instead of error - feature is non-critical
    res.json({ history: [] });
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

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not available');
      // Return success even if we can't clear - feature is non-critical
      res.json({ message: 'Search history cleared' });
      return;
    }

    const { error } = await supabaseAdmin
      .from('search_history')
      .delete()
      .eq('user_id', req.user.userId);

    if (error) {
      // Check if it's a table doesn't exist error (42P01 in PostgreSQL)
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('Search history table does not exist, returning success');
        // Return success even if table doesn't exist - feature is non-critical
        res.json({ message: 'Search history cleared' });
        return;
      }
      console.error('Error clearing search history:', error);
      // Return success even if we can't clear - feature is non-critical
      res.json({ message: 'Search history cleared' });
      return;
    }

    res.json({ message: 'Search history cleared' });
  } catch (error: any) {
    console.error('Clear search history error:', error);
    // Return success even if there's an error - feature is non-critical
    res.json({ message: 'Search history cleared' });
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
    // IMPORTANT: Include original_user_id and original_user to show original uploader for reposted videos
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

    // Get tags for all videos in one query
    const videoIds = (videos || []).map((v: any) => v.id);
    let videoTagsMap: { [key: string]: string[] } = {};
    
    if (videoIds.length > 0) {
      const { data: videoTags, error: tagsError } = await supabaseAdmin!
        .from('video_tags_direct')
        .select('video_id, tag_name')
        .in('video_id', videoIds);

      if (!tagsError && videoTags) {
        videoTags.forEach((vt: any) => {
          if (!videoTagsMap[vt.video_id]) {
            videoTagsMap[vt.video_id] = [];
          }
          videoTagsMap[vt.video_id].push(vt.tag_name);
        });
      }
    }

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

      // For reposted videos, user should be null (we show originalUser instead)
      // For non-reposted videos, user is the sharer
      const isReposted = !!video.original_user_id;
      
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
        // For reposted videos, set user to null so frontend shows originalUser
        // For non-reposted videos, user is the sharer
        user: isReposted ? null : (userData ? {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profile_picture_url: userData.profile_picture_url,
        } : null),
        // Always set originalUser for reposted videos so frontend can show original uploader
        originalUser: originalUserData ? {
          id: originalUserData.id,
          username: originalUserData.username,
          email: originalUserData.email,
          profile_picture_url: originalUserData.profile_picture_url,
        } : null,
        tags: videoTagsMap[video.id] || [],
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
    // For reposted YouTube videos, fetch YouTube metadata to show original uploader
    const videosFormatted = await Promise.all((videos || []).map(async (video: any) => {
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

      // For reposted YouTube videos, fetch YouTube metadata to show original uploader
      let authorName: string | undefined;
      let authorUrl: string | undefined;
      let source: 'petflix' | 'youtube' = 'petflix';
      
      if (video.youtube_video_id && video.original_user_id) {
        // This is a reposted YouTube video - fetch original YouTube uploader info
        try {
          const metadata = await getYouTubeVideoMetadata(video.youtube_video_id);
          if (metadata?.authorName) {
            authorName = metadata.authorName;
            authorUrl = metadata.authorUrl;
            source = 'youtube';
          }
        } catch (err) {
          // Silently fail - will show Petflix user instead
        }
      }

      // For reposted videos, we want to show the original uploader, not the reposter
      // user_id is the reposter, original_user_id is the original Petflix sharer
      // For YouTube videos, we show the original YouTube uploader
      const isReposted = !!video.original_user_id;
      
      return {
        id: video.id,
        youtubeVideoId: video.youtube_video_id,
        title: video.title,
        description: video.description,
        // For reposted videos, userId should be the original sharer, not the reposter
        userId: isReposted ? (originalUserData?.id || video.user_id) : video.user_id,
        createdAt: displayDate,
        updatedAt: video.updated_at,
        viewCount: video.view_count || 0,
        thumbnail: thumbnail,
        source: source,
        authorName: authorName,
        authorUrl: authorUrl,
        // For reposted videos, user should be null (we show originalUser or YouTube uploader instead)
        // For non-reposted videos, user is the sharer
        user: isReposted ? null : (userData ? {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profile_picture_url: userData.profile_picture_url,
        } : null),
        // For reposted YouTube videos, originalUser is null (we show YouTube uploader via authorName)
        // For reposted Petflix videos, originalUser is the original Petflix sharer
        originalUser: (source === 'youtube' && authorName) ? null : (originalUserData ? {
          id: originalUserData.id,
          username: originalUserData.username,
          email: originalUserData.email,
          profile_picture_url: originalUserData.profile_picture_url,
        } : null),
      };
    }));

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
      // For reposted videos, user should be null (we show originalUser instead)
      // For non-reposted videos, user is the sharer
      const isReposted = !!video.original_user_id;
      
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
        // For reposted videos, set user to null so frontend shows originalUser
        // For non-reposted videos, user is the sharer
        user: isReposted ? null : (userData ? {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profile_picture_url: userData.profile_picture_url,
        } : null),
        // Always set originalUser for reposted videos so frontend can show original uploader
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

    // Deduplicate by YouTube video ID (keep the first occurrence - most popular/recent)
    const seenYouTubeIds = new Set<string>();
    const deduplicated: any[] = [];
    
    for (const video of videosFormatted) {
      if (video.youtubeVideoId) {
        // If we've seen this YouTube video ID before, skip it
        if (seenYouTubeIds.has(video.youtubeVideoId)) {
          continue;
        }
        seenYouTubeIds.add(video.youtubeVideoId);
      }
      deduplicated.push(video);
    }

    // Only show videos shared by Petflix users (no YouTube API calls)
    // Videos are already sorted by view count and recency from the database query
    const allVideos = deduplicated;

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

    // Check if this is a YouTube video ID (starts with "youtube_")
    const isYouTubeVideo = id.startsWith('youtube_');
    const youtubeVideoId = isYouTubeVideo ? id.replace('youtube_', '') : null;

    let videoId: string | null = null;
    let videoData: any = null;

    if (isYouTubeVideo) {
      // For YouTube videos, we can like them directly without a Petflix video entry
      // Check if already liked by YouTube ID
      const { data: existingLike, error: checkError } = await supabaseAdmin!
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('youtube_video_id', youtubeVideoId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing like:', checkError);
      }

      if (existingLike) {
        res.status(409).json({ error: 'Video already liked' });
        return;
      }

      // Create like with YouTube video ID
      const { error: likeError } = await supabaseAdmin!
        .from('likes')
        .insert({
          user_id: userId,
          video_id: null,
          youtube_video_id: youtubeVideoId,
        })
        .select();

      if (likeError) {
        console.error('Error liking YouTube video:', JSON.stringify(likeError, null, 2));
        res.status(500).json({ 
          error: 'Failed to like video',
          details: likeError.message || likeError.code || 'Unknown error'
        });
        return;
      }

      res.status(201).json({ message: 'Video liked successfully' });
      return;
    }

    // For Petflix videos, check if video exists
    const { data: video, error: videoError } = await supabaseAdmin!
      .from('videos')
      .select('id, user_id, title')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    videoId = video.id;
    videoData = video;

    // Check if already liked (use maybeSingle to avoid error if not found)
    const { data: existingLike, error: checkError } = await supabaseAdmin!
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('video_id', videoId)
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
    const { error: likeError, data: likeData } = await supabaseAdmin!
      .from('likes')
      .insert({
        user_id: userId,
        video_id: videoId,
        youtube_video_id: null,
      })
      .select();

    if (likeError) {
      console.error('Error liking video:', JSON.stringify(likeError, null, 2));
      console.error('User ID:', userId);
      console.error('Video ID:', id);
      res.status(500).json({ 
        error: 'Failed to like video',
        details: likeError.message || likeError.code || 'Unknown error'
      });
      return;
    }

    // Notify video owner if they're not the one liking (async, don't wait)
    if (videoData && videoData.user_id !== userId) {
      const { data: likerData } = await supabaseAdmin!
        .from('users')
        .select('username')
        .eq('id', userId)
        .single();

      const likerUsername = likerData?.username || 'Someone';
      const videoTitle = videoData.title || 'your video';

      // Create notification (fire and forget)
      createNotification(
        videoData.user_id,
        'like',
        `${likerUsername} liked your video`,
        `${likerUsername} liked "${videoTitle}"`,
        userId,
        id
      ).catch((err) => {
        console.error('Error creating like notification:', err);
        // Non-critical error, don't affect response
      });
    }

    res.json({ message: 'Video liked successfully' });
  } catch (error: any) {
    console.error('Like video error:', error);
    console.error('Error stack:', error?.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error?.message || 'Unknown error'
    });
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

    // Check if this is a YouTube video ID (starts with "youtube_")
    const isYouTubeVideo = id.startsWith('youtube_');
    const youtubeVideoId = isYouTubeVideo ? id.replace('youtube_', '') : null;

    if (isYouTubeVideo) {
      // Delete like by YouTube video ID
      const { error: unlikeError } = await supabaseAdmin!
        .from('likes')
        .delete()
        .eq('user_id', userId)
        .eq('youtube_video_id', youtubeVideoId);

      if (unlikeError) {
        console.error('Error unliking YouTube video:', unlikeError);
        res.status(500).json({ error: 'Failed to unlike video' });
        return;
      }

      res.json({ message: 'Video unliked successfully' });
      return;
    }

    // Delete like by Petflix video ID (trigger will update like_count)
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

    // Check if this is a YouTube video ID (starts with "youtube_")
    const isYouTubeVideo = id.startsWith('youtube_');
    const youtubeVideoId = isYouTubeVideo ? id.replace('youtube_', '') : null;

    let like: any = null;
    let likeCount = 0;

    if (isYouTubeVideo) {
      // Check if user has liked the YouTube video
      const { data: youtubeLike } = await supabaseAdmin!
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('youtube_video_id', youtubeVideoId)
        .maybeSingle();

      like = youtubeLike;

      // Get like count for YouTube video
      const { count } = await supabaseAdmin!
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('youtube_video_id', youtubeVideoId);
      
      likeCount = count || 0;
    } else {
      // Check if user has liked the Petflix video
      const { data: petflixLike } = await supabaseAdmin!
        .from('likes')
        .select('id')
        .eq('user_id', userId)
        .eq('video_id', id)
        .maybeSingle();

      like = petflixLike;

      // Get like count for Petflix video
      const { count } = await supabaseAdmin!
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', id);
      
      likeCount = count || 0;
    }

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

    // Check if this is a YouTube video ID (starts with "youtube_" or is a YouTube video ID format)
    // Note: YouTube video IDs are exactly 11 characters, but we should be careful not to match UUIDs
    // UUIDs are 36 characters, so 11-character IDs are likely YouTube IDs
    // However, we should also check if it's a valid UUID format first
    const isYouTubeId = id.startsWith('youtube_') || (/^[a-zA-Z0-9_-]{11}$/.test(id) && !id.includes('-') && id.length === 11);
    
    let originalVideo: any;
    let originalUserId: string;
    let youtubeVideoId: string;
    let videoTitle: string;
    let videoDescription: string;
    let videoViewCount: number = 0;

    if (isYouTubeId) {
      // Handle direct YouTube video repost
      youtubeVideoId = id.startsWith('youtube_') ? id.replace('youtube_', '') : id;
      
      // Find if this YouTube video is already shared by someone (prefer someone else, but allow own share)
      // Get all shared videos for this YouTube video, ordered by creation date
      const { data: existingSharedVideos } = await supabaseAdmin!
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
        .eq('youtube_video_id', youtubeVideoId)
        .is('original_user_id', null) // Only check for shared videos, not reposts
        .order('created_at', { ascending: true }); // Get the first person who shared it

      if (existingSharedVideos && existingSharedVideos.length > 0) {
        // Find the first video shared by someone else (not current user)
        const otherUserShare = existingSharedVideos.find(v => v.user_id !== req.user.userId);
        
        if (otherUserShare) {
          // Video is already shared by someone else, repost that video
          originalVideo = otherUserShare;
          originalUserId = otherUserShare.user_id;
        } else {
          // Only the current user has shared it - we can't repost our own video
          res.status(400).json({ 
            error: 'You cannot repost a video that you have already shared. If you want to repost it, please wait for someone else to share it first.' 
          });
          return;
        }
        
        youtubeVideoId = originalVideo.youtube_video_id;
        videoTitle = originalVideo.title;
        videoDescription = originalVideo.description;
        videoViewCount = originalVideo.view_count || 0;
      } else {
        // Video not shared yet - we can't repost it without an original sharer
        res.status(400).json({ 
          error: 'This video has not been shared to Petflix yet. Please share it first, or wait for someone else to share it.' 
        });
        return;
      }
    } else {
      // Handle repost of existing Petflix video
      const { data: videoData, error: videoError } = await supabaseAdmin!
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

      if (videoError || !videoData) {
        res.status(404).json({ error: 'Video not found' });
        return;
      }

      originalVideo = videoData;
      youtubeVideoId = videoData.youtube_video_id;
      videoTitle = videoData.title;
      videoDescription = videoData.description;
      videoViewCount = videoData.view_count || 0;
      
      // Determine the original sharer (if already a repost, use original_user_id, otherwise use user_id)
      originalUserId = videoData.original_user_id || videoData.user_id;
    }

    // Prevent reposting your own videos
    if (originalUserId === req.user.userId) {
      res.status(400).json({ error: 'You cannot repost your own video' });
      return;
    }

    // Check if user has already reposted this video (only check for reposts, not shared videos)
    // A repost has original_user_id set (IS NOT NULL)
    const { data: existingRepost, error: existingError } = await supabaseAdmin!
      .from('videos')
      .select('id')
      .eq('youtube_video_id', originalVideo.youtube_video_id)
      .eq('user_id', req.user.userId)
      .not('original_user_id', 'is', null) // Only check for existing reposts
      .maybeSingle();

    // Only log errors other than "not found"
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing repost:', existingError);
    }

    if (existingRepost) {
      res.status(409).json({ error: 'You have already reposted this video' });
      return;
    }
    
    // Note: If user has already shared this video (original_user_id IS NULL), 
    // they can still repost it - it will create a new entry in "reposted videos"

    // Create reposted video entry
    const { data: newVideo, error: insertError } = await supabaseAdmin!
      .from('videos')
      .insert({
        youtube_video_id: youtubeVideoId,
        title: videoTitle,
        description: videoDescription,
        user_id: req.user.userId, // Current user is reposting
        original_user_id: originalUserId, // Credit the original sharer
        view_count: videoViewCount,
      })
      .select('id, youtube_video_id, title, description, user_id, original_user_id, created_at, updated_at, view_count')
      .single();

    if (insertError || !newVideo) {
      console.error('Error creating repost:', JSON.stringify(insertError, null, 2));
      console.error('User ID:', req.user.userId);
      console.error('Original Video ID:', id);
      console.error('Original User ID:', originalUserId);
      
      // Check if error is due to missing column
      if (insertError?.message?.includes('original_user_id') || insertError?.code === '42703') {
        res.status(500).json({ 
          error: 'Database migration required',
          details: 'The original_user_id column is missing. Please run migration 011_add_original_user_id.sql in Supabase.'
        });
        return;
      }
      
      res.status(500).json({ 
        error: 'Failed to repost video',
        details: insertError?.message || insertError?.code || 'Unknown error'
      });
      return;
    }

    // Copy tags from original video (use originalVideo.id if it exists, otherwise use the found video's id)
    const sourceVideoId = originalVideo?.id || id;
    const { data: originalTags } = await supabaseAdmin!
      .from('video_tags_direct')
      .select('tag_name')
      .eq('video_id', sourceVideoId);

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

    // Check if user has already reposted this video (only check for reposts, not shared videos)
    // A repost has original_user_id set (IS NOT NULL)
    // Users can repost videos they've already shared - it will create a new entry in "reposted videos"
    const { data: existingRepost, error: existingError } = await supabaseAdmin!
      .from('videos')
      .select('id')
      .eq('youtube_video_id', video.youtube_video_id)
      .eq('user_id', req.user.userId)
      .not('original_user_id', 'is', null) // Only check for existing reposts
      .maybeSingle();

    // Only log errors other than "not found"
    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing repost:', existingError);
    }

    if (existingRepost) {
      res.json({ canRepost: false, reason: 'You have already reposted this video' });
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

    // Get all likes (both Petflix videos and YouTube videos)
    const { data: likes, error: likesError } = await supabaseAdmin!
      .from('likes')
      .select('video_id, youtube_video_id, created_at')
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

    // Separate Petflix video likes and YouTube video likes
    const petflixVideoIds = likes.filter(like => like.video_id).map(like => like.video_id);
    const youtubeVideoIds = likes.filter(like => like.youtube_video_id).map(like => like.youtube_video_id);

    const allVideos: any[] = [];

    // Get Petflix videos
    if (petflixVideoIds.length > 0) {
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
        .in('id', petflixVideoIds);

      if (!videosError && videos) {
        // Format Petflix videos
        videos.forEach((video: any) => {
          let thumbnail: string | null = null;
          if (video.youtube_video_id) {
            if (/^[a-zA-Z0-9_-]{11}$/.test(video.youtube_video_id)) {
              thumbnail = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
            }
          }

          const userData = Array.isArray(video.users) ? video.users[0] : video.users;
          const originalUserData = video.original_user_id 
            ? (Array.isArray(video.original_user) ? video.original_user[0] : video.original_user)
            : null;

          // Find the like date for this video
          const likeData = likes.find(l => l.video_id === video.id);

          allVideos.push({
            id: video.id,
            youtubeVideoId: video.youtube_video_id,
            title: video.title,
            description: video.description,
            userId: video.user_id,
            createdAt: video.created_at,
            likedAt: likeData?.created_at || video.created_at,
            updatedAt: video.updated_at,
            viewCount: video.view_count || 0,
            thumbnail: thumbnail,
            source: 'petflix',
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
          });
        });
      }
    }

    // Get YouTube videos metadata (videos liked directly without being shared)
    if (youtubeVideoIds.length > 0) {
      // Fetch metadata for YouTube videos in parallel (limit to avoid too many requests)
      const youtubeVideoPromises = youtubeVideoIds.slice(0, 50).map(async (youtubeVideoId: string) => {
        try {
          const metadata = await getYouTubeVideoMetadata(youtubeVideoId);
          if (!metadata) return null;

          // Find the like date for this video
          const likeData = likes.find(l => l.youtube_video_id === youtubeVideoId);

          return {
            id: null, // No Petflix ID - this is a directly liked YouTube video
            youtubeVideoId: youtubeVideoId,
            title: metadata.title,
            description: metadata.description || '',
            userId: null, // Not shared by any Petflix user
            createdAt: likeData?.created_at || new Date().toISOString(),
            likedAt: likeData?.created_at || new Date().toISOString(),
            updatedAt: likeData?.created_at || new Date().toISOString(),
            viewCount: 0, // We don't have view count for directly liked videos
            thumbnail: metadata.thumbnail || `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
            source: 'youtube',
            // Use author information from oEmbed
            authorName: metadata.authorName || 'YouTube',
            authorUrl: metadata.authorUrl || `https://www.youtube.com/watch?v=${youtubeVideoId}`,
            user: null, // No Petflix user - show original YouTube uploader
            originalUser: null,
          };
        } catch (err) {
          console.error(`Error fetching metadata for YouTube video ${youtubeVideoId}:`, err);
          return null;
        }
      });

      const youtubeVideos = await Promise.all(youtubeVideoPromises);
      allVideos.push(...youtubeVideos.filter(v => v !== null));
    }

    // Sort by liked date (most recent first)
    allVideos.sort((a, b) => {
      const dateA = new Date(a.likedAt || a.createdAt).getTime();
      const dateB = new Date(b.likedAt || b.createdAt).getTime();
      return dateB - dateA;
    });

    res.json({ videos: allVideos });
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

    // Check if this is a YouTube video ID (starts with "youtube_")
    const isYouTubeVideo = id.startsWith('youtube_');
    const youtubeVideoId = isYouTubeVideo ? id.replace('youtube_', '') : null;

    if (isYouTubeVideo) {
      // For YouTube videos, check if user already reported
      const { data: existingReport } = await supabaseAdmin!
        .from('reported_videos')
        .select('id')
        .eq('youtube_video_id', youtubeVideoId)
        .eq('reported_by_user_id', req.user.userId)
        .maybeSingle();

      if (existingReport) {
        res.status(409).json({ error: 'You have already reported this video' });
        return;
      }

      // Create report for YouTube video
      const { error: reportError } = await supabaseAdmin!
        .from('reported_videos')
        .insert({
          video_id: null,
          youtube_video_id: youtubeVideoId,
          reported_by_user_id: req.user.userId,
          reason: reason.trim(),
          status: 'pending',
        });

      if (reportError) {
        console.error('Error creating YouTube video report:', reportError);
        res.status(500).json({ error: 'Failed to submit report' });
        return;
      }

      res.status(201).json({ message: 'Video reported successfully' });
      return;
    }

    // For Petflix videos, check if video exists
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

/**
 * Get most popular video this week (by view count, created within last 7 days)
 * GET /api/v1/videos/most-popular-this-week
 */
export const getMostPopularVideoThisWeek = async (req: Request, res: Response) => {
  try {
    // Calculate date 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get the most popular video from the last 7 days
    const { data: videos, error } = await supabaseAdmin!
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
      .gte('created_at', sevenDaysAgo.toISOString())
      .is('original_user_id', null) // Only original shares, not reposts
      .order('view_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching most popular video this week:', error);
      res.status(500).json({ error: 'Failed to load most popular video' });
      return;
    }

    if (!videos || videos.length === 0) {
      res.status(404).json({ error: 'No videos found this week' });
      return;
    }

    // Get tags for the video
    const video = videos[0];
    const { data: tags } = await supabaseAdmin!
      .from('video_tags_direct')
      .select('tag_name')
      .eq('video_id', video.id);

    res.json({
      video: {
        ...video,
        tags: tags?.map((t: any) => t.tag_name) || [],
      },
    });
  } catch (error) {
    console.error('Get most popular video this week error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

