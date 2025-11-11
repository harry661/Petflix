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
import { searchYouTubeVideos, getYouTubeVideoDetails, getYouTubeVideoMetadata } from '../services/youtubeService';

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
        createdAt: video.publishedAt, // Use publishedAt as createdAt for YouTube videos
        user: null, // YouTube videos don't have a Petflix user
        source: 'youtube',
      }));
    } catch (error: any) {
      // Silently fail - don't crash the server if YouTube API fails
      // This is expected when quota is exceeded or API key is missing
      if (process.env.NODE_ENV === 'development') {
        console.log('YouTube search unavailable (quota exceeded or API key missing)');
      }
      // Continue with just shared videos
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
          email,
          profile_picture_url
        )
      `)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    const sharedVideosFormatted = (sharedVideos || []).map((video: any) => {
      const userData = Array.isArray(video.users) ? video.users[0] : video.users;
      // Generate thumbnail URL - YouTube thumbnails are generally available for valid video IDs
      // Use hqdefault as it's more reliable than maxresdefault (which may not exist for all videos)
      let thumbnail: string | null = null;
      if (video.youtube_video_id) {
        // Validate video ID format before generating thumbnail URL
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

    // First try oEmbed API (free, no quota)
    const oembedData = await getYouTubeVideoMetadata(youtubeVideoId);
    if (oembedData) {
      videoTitle = videoTitle || oembedData.title;
      videoDescription = videoDescription || oembedData.description;
      videoThumbnail = oembedData.thumbnail;
    } else {
      // Fallback to Data API if available (optional - may hit quota)
      try {
        const youtubeData = await getYouTubeVideoDetails(youtubeVideoId);
        videoTitle = videoTitle || youtubeData.title;
        videoDescription = videoDescription || youtubeData.description;
        videoThumbnail = videoThumbnail || youtubeData.thumbnail;
      } catch (error: any) {
        // Log but don't fail - we can still save the video without metadata
        console.log('YouTube Data API not available (quota exceeded or API key missing). Using provided or default values.');
      }
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
      })
      .select('id, youtube_video_id, title, description, user_id, created_at, updated_at')
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

    // Format videos with thumbnails (generate directly from video IDs)
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
        thumbnail: thumbnail,
        user: userData ? {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profile_picture_url: userData.profile_picture_url,
        } : null,
      };
    });

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
      return {
        id: video.id,
        youtubeVideoId: video.youtube_video_id,
        title: video.title,
        description: video.description,
        userId: video.user_id,
        createdAt: video.created_at,
        updatedAt: video.updated_at,
        thumbnail: thumbnail,
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
  req: Request<{}, VideoSearchResponse | ErrorResponse, {}, { limit?: string; tag?: string }>,
  res: Response
) => {
  try {
    const limit = parseInt(req.query.limit || '12');
    const tagFilter = req.query.tag;

    let query = supabaseAdmin!
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
      `);

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

      if (tagsError || !taggedVideos || taggedVideos.length === 0) {
        // No videos with this tag, return empty
        res.json({ videos: [], total: 0, page: 1, pageSize: limit });
        return;
      }

      const videoIds = taggedVideos.map((tv: any) => tv.video_id);
      query = query.in('id', videoIds);
    }

    const { data: videos, error: dbError } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

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

    res.json({
      videos: videosFormatted,
      total: videosFormatted.length,
      page: 1,
      pageSize: limit,
    });
  } catch (error) {
    console.error('Get recent videos error:', error);
    res.status(500).json({ error: 'Failed to load recent videos' });
  }
};

/**
 * Update a shared video
 * PUT /api/v1/videos/:id
 */
export const updateVideo = async (
  req: Request<{ id: string }, VideoResponse | ErrorResponse, { title?: string; description?: string; tags?: string[] }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { title, description, tags } = req.body;

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
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;

    const { data: updatedVideo, error: updateError } = await supabaseAdmin!
      .from('videos')
      .update(updateData)
      .eq('id', id)
      .select('id, youtube_video_id, title, description, user_id, created_at, updated_at')
      .single();

    if (updateError || !updatedVideo) {
      res.status(500).json({ error: 'Failed to update video' });
      return;
    }

    // Update tags if provided
    if (tags && Array.isArray(tags)) {
      // Delete existing tags
      await supabaseAdmin!
        .from('video_tags_direct')
        .delete()
        .eq('video_id', id);

      // Insert new tags
      if (tags.length > 0) {
        const normalizedTags = tags
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0 && tag.length <= 50)
          .slice(0, 20);

        if (normalizedTags.length > 0) {
          const tagInserts = normalizedTags.map(tag => ({
            video_id: id,
            tag_name: tag,
          }));

          await supabaseAdmin!
            .from('video_tags_direct')
            .insert(tagInserts);
        }
      }
    }

    res.json({
      id: updatedVideo.id,
      youtubeVideoId: updatedVideo.youtube_video_id,
      title: updatedVideo.title,
      description: updatedVideo.description,
      userId: updatedVideo.user_id,
      createdAt: updatedVideo.created_at,
      updatedAt: updatedVideo.updated_at,
    });
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get video tags
 * GET /api/v1/videos/:id/tags
 */
export const getVideoTags = async (
  req: Request<{ id: string }>,
  res: Response<{ tags: string[] } | ErrorResponse>
) => {
  try {
    const { id } = req.params;

    const { data: tags, error } = await supabaseAdmin!
      .from('video_tags_direct')
      .select('tag_name')
      .eq('video_id', id);

    if (error) {
      res.status(500).json({ error: 'Failed to load tags' });
      return;
    }

    res.json({ tags: (tags || []).map(t => t.tag_name) });
  } catch (error) {
    console.error('Get video tags error:', error);
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

