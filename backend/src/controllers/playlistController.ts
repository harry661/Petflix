import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import {
  PlaylistCreationRequest,
  PlaylistResponse,
  PlaylistDetailsResponse,
  PlaylistVideoRequest,
  ErrorResponse,
} from '../types';

/**
 * Create a playlist
 * POST /api/v1/playlists
 */
export const createPlaylist = async (
  req: Request<{}, PlaylistResponse | ErrorResponse, PlaylistCreationRequest>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { name, description, visibility = 'public' } = req.body;

    if (!name || name.trim() === '') {
      res.status(400).json({ error: 'Playlist name is required' });
      return;
    }

    if (name.length > 100) {
      res.status(400).json({ error: 'Playlist name must be 100 characters or less' });
      return;
    }

    // Create playlist
    const { data: newPlaylist, error: insertError } = await supabaseAdmin!
      .from('playlists')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        user_id: req.user.userId,
        visibility: visibility,
      })
      .select('id, name, description, user_id, visibility, created_at, updated_at')
      .single();

    if (insertError || !newPlaylist) {
      console.error('Error creating playlist:', insertError);
      res.status(500).json({ error: 'Failed to create playlist' });
      return;
    }

    res.status(201).json({
      id: newPlaylist.id,
      name: newPlaylist.name,
      description: newPlaylist.description,
      userId: newPlaylist.user_id,
      visibility: newPlaylist.visibility as 'public' | 'private',
      createdAt: newPlaylist.created_at,
      updatedAt: newPlaylist.updated_at,
    });
  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's playlists
 * GET /api/v1/playlists
 */
export const getUserPlaylists = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { data: playlists, error } = await supabaseAdmin!
      .from('playlists')
      .select('id, name, description, user_id, visibility, created_at, updated_at')
      .eq('user_id', req.user.userId)
      .order('updated_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to load playlists' });
      return;
    }

    // Get video counts and first video thumbnails for each playlist
    const playlistsWithDetails = await Promise.all(
      (playlists || []).map(async (playlist) => {
        // Get video count
        const { count: videoCount } = await supabaseAdmin!
          .from('playlist_videos')
          .select('*', { count: 'exact', head: true })
          .eq('playlist_id', playlist.id);

        // Get first 4 videos for thumbnail preview
        const { data: firstVideos } = await supabaseAdmin!
          .from('playlist_videos')
          .select(`
            videos:video_id (
              youtube_video_id
            )
          `)
          .eq('playlist_id', playlist.id)
          .order('created_at', { ascending: true })
          .limit(4);

        // Extract thumbnails from first videos
        const thumbnails: string[] = [];
        if (firstVideos) {
          firstVideos.forEach((pv: any) => {
            const video = Array.isArray(pv.videos) ? pv.videos[0] : pv.videos;
            if (video?.youtube_video_id && /^[a-zA-Z0-9_-]{11}$/.test(video.youtube_video_id)) {
              thumbnails.push(`https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`);
            }
          });
        }

        return {
          ...playlist,
          videoCount: videoCount || 0,
          thumbnails: thumbnails.slice(0, 4), // Max 4 thumbnails
        };
      })
    );

    res.json({ playlists: playlistsWithDetails });
  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get playlist by ID
 * GET /api/v1/playlists/:id
 */
export const getPlaylistById = async (
  req: Request<{ id: string }>,
  res: Response<PlaylistDetailsResponse | ErrorResponse>
) => {
  try {
    const { id } = req.params;

    // Get playlist
    const { data: playlist, error: playlistError } = await supabaseAdmin!
      .from('playlists')
      .select(`
        id,
        name,
        description,
        user_id,
        visibility,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          email,
          profile_picture_url
        )
      `)
      .eq('id', id)
      .single();

    if (playlistError || !playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    // Check visibility
    if (playlist.visibility === 'private' && (!req.user || req.user.userId !== playlist.user_id)) {
      res.status(403).json({ error: 'This playlist is private' });
      return;
    }

    // Get videos in playlist
    const { data: playlistVideos, error: videosError } = await supabaseAdmin!
      .from('playlist_videos')
      .select(`
        video_id,
        created_at,
        videos:video_id (
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
        )
      `)
      .eq('playlist_id', id)
      .order('created_at', { ascending: true });

    // Format videos with thumbnails and user info
    const videos = (playlistVideos || [])
      .map((pv: any) => {
        const video = pv.videos;
        if (!video) return null;

        // Generate thumbnail URL directly from YouTube video ID
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

        return {
          id: video.id,
          youtubeVideoId: video.youtube_video_id,
          title: video.title,
          description: video.description,
          userId: video.user_id,
          createdAt: video.created_at,
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
      })
      .filter(Boolean);

    const userData = Array.isArray(playlist.users) ? playlist.users[0] : playlist.users;
    res.json({
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      userId: playlist.user_id,
      visibility: playlist.visibility as 'public' | 'private',
      createdAt: playlist.created_at,
      updatedAt: playlist.updated_at,
      user: userData ? {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        profile_picture_url: userData.profile_picture_url || null,
        bio: (userData as any).bio || null,
        created_at: (userData as any).created_at || playlist.created_at,
        updated_at: (userData as any).updated_at || playlist.updated_at,
      } : undefined,
      videos,
    } as PlaylistDetailsResponse);
  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Add video to playlist
 * POST /api/v1/playlists/:id/videos
 */
export const addVideoToPlaylist = async (
  req: Request<{ id: string }, PlaylistResponse | ErrorResponse, PlaylistVideoRequest>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { videoId } = req.body;

    if (!videoId) {
      res.status(400).json({ error: 'Video ID is required' });
      return;
    }

    // Verify playlist exists and user owns it
    const { data: playlist, error: playlistError } = await supabaseAdmin!
      .from('playlists')
      .select('user_id')
      .eq('id', id)
      .single();

    if (playlistError || !playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.user_id !== req.user.userId) {
      res.status(403).json({ error: 'You can only add videos to your own playlists' });
      return;
    }

    // Check if video already in playlist
    const { data: existing } = await supabaseAdmin!
      .from('playlist_videos')
      .select('*')
      .eq('playlist_id', id)
      .eq('video_id', videoId)
      .single();

    if (existing) {
      res.status(409).json({ error: 'Video is already in this playlist' });
      return;
    }

    // Add video to playlist
    const { error: insertError } = await supabaseAdmin!
      .from('playlist_videos')
      .insert({
        playlist_id: id,
        video_id: videoId,
      });

    if (insertError) {
      console.error('Error adding video to playlist:', insertError);
      res.status(500).json({ error: 'Failed to add video to playlist' });
      return;
    }

    res.status(201).json({ message: 'Video added to playlist successfully' });
  } catch (error) {
    console.error('Add video to playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Remove video from playlist
 * DELETE /api/v1/playlists/:id/videos/:videoId
 */
export const removeVideoFromPlaylist = async (
  req: Request<{ id: string; videoId: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id, videoId } = req.params;

    // Verify playlist exists and user owns it
    const { data: playlist, error: playlistError } = await supabaseAdmin!
      .from('playlists')
      .select('user_id')
      .eq('id', id)
      .single();

    if (playlistError || !playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.user_id !== req.user.userId) {
      res.status(403).json({ error: 'You can only remove videos from your own playlists' });
      return;
    }

    // Remove video from playlist
    const { error: deleteError } = await supabaseAdmin!
      .from('playlist_videos')
      .delete()
      .eq('playlist_id', id)
      .eq('video_id', videoId);

    if (deleteError) {
      res.status(500).json({ error: 'Failed to remove video from playlist' });
      return;
    }

    res.json({ message: 'Video removed from playlist successfully' });
  } catch (error) {
    console.error('Remove video from playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete playlist
 * DELETE /api/v1/playlists/:id
 */
export const deletePlaylist = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Verify playlist exists and user owns it
    const { data: playlist, error: playlistError } = await supabaseAdmin!
      .from('playlists')
      .select('user_id')
      .eq('id', id)
      .single();

    if (playlistError || !playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.user_id !== req.user.userId) {
      res.status(403).json({ error: 'You can only delete your own playlists' });
      return;
    }

    // Delete playlist (cascade will delete playlist_videos)
    const { error: deleteError } = await supabaseAdmin!
      .from('playlists')
      .delete()
      .eq('id', id);

    if (deleteError) {
      res.status(500).json({ error: 'Failed to delete playlist' });
      return;
    }

    res.json({ message: 'Playlist deleted successfully' });
  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

