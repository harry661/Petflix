import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import {
  CommentCreationRequest,
  CommentResponse,
  CommentListResponse,
  ErrorResponse,
} from '../types';
import { sanitizeInput } from '../middleware/validation';
import { createNotification } from '../services/notificationService';

/**
 * Create a comment
 * POST /api/v1/comments
 */
export const createComment = async (
  req: Request<{}, CommentResponse | ErrorResponse, CommentCreationRequest>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { videoId, text, parentCommentId } = req.body;

    if (!videoId || !text || text.trim() === '') {
      res.status(400).json({ error: 'Video ID and comment text are required' });
      return;
    }

    if (text.length > 1000) {
      res.status(400).json({ error: 'Comment must be 1000 characters or less' });
      return;
    }

    // Sanitize comment text
    const sanitizedText = sanitizeInput(text);

    // Check if this is a YouTube video ID (starts with "youtube_")
    const isYouTubeVideo = videoId.startsWith('youtube_');
    const youtubeVideoId = isYouTubeVideo ? videoId.replace('youtube_', '') : null;

    let petflixVideoId: string | null = null;
    let videoData: any = null;

    if (isYouTubeVideo) {
      // For YouTube videos, create comment directly with YouTube video ID
      const { data: newComment, error: insertError } = await supabaseAdmin!
        .from('comments')
        .insert({
          video_id: null,
          youtube_video_id: youtubeVideoId,
          user_id: req.user.userId,
          text: sanitizedText,
          parent_comment_id: parentCommentId || null,
        })
        .select('id, video_id, youtube_video_id, user_id, text, parent_comment_id, created_at, updated_at')
        .single();

      if (insertError || !newComment) {
        console.error('Error creating comment on YouTube video:', insertError);
        res.status(500).json({ error: 'Failed to create comment' });
        return;
      }

      // For YouTube videos, we can't notify the owner since there's no Petflix user
      // Just return the comment
      res.status(201).json({
        id: newComment.id,
        videoId: newComment.video_id,
        youtubeVideoId: newComment.youtube_video_id,
        userId: newComment.user_id,
        text: newComment.text,
        parentCommentId: newComment.parent_comment_id,
        createdAt: newComment.created_at,
        updatedAt: newComment.updated_at,
      });
      return;
    }

    // For Petflix videos, get video owner info for notification
    const { data: video } = await supabaseAdmin!
      .from('videos')
      .select('user_id, title')
      .eq('id', videoId)
      .single();

    if (!video) {
      res.status(404).json({ error: 'Video not found' });
      return;
    }

    petflixVideoId = videoId;
    videoData = video;

    // Create comment
    const { data: newComment, error: insertError } = await supabaseAdmin!
      .from('comments')
      .insert({
        video_id: petflixVideoId,
        youtube_video_id: null,
        user_id: req.user.userId,
        text: sanitizedText,
        parent_comment_id: parentCommentId || null,
      })
      .select('id, video_id, user_id, text, parent_comment_id, created_at, updated_at')
      .single();

    if (insertError || !newComment) {
      console.error('Error creating comment:', insertError);
      res.status(500).json({ error: 'Failed to create comment' });
      return;
    }

    const { data: commenterData } = await supabaseAdmin!
      .from('users')
      .select('username')
      .eq('id', req.user!.userId)
      .single();

    // Notify video owner if they're not the one commenting (async, don't wait)
    if (videoData && videoData.user_id !== req.user!.userId) {
      const commenterUsername = commenterData?.username || 'Someone';
      const videoTitle = videoData.title || 'your video';
      const commentPreview = sanitizedText.length > 60 
        ? `${sanitizedText.substring(0, 60)}...` 
        : sanitizedText;

      createNotification(
        videoData.user_id,
        'comment',
        `${commenterUsername} commented on your video`,
        commentPreview,
        req.user!.userId,
        videoId
      ).catch((err) => {
        console.error('Error creating comment notification:', err);
        // Non-critical error, don't affect response
      });
    }

    res.status(201).json({
      id: newComment.id,
      videoId: newComment.video_id,
      userId: newComment.user_id,
      text: newComment.text,
      parentCommentId: newComment.parent_comment_id,
      createdAt: newComment.created_at,
      updatedAt: newComment.updated_at,
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get comments for a video
 * GET /api/v1/comments/:videoId
 */
export const getCommentsByVideo = async (
  req: Request<{ videoId: string }>,
  res: Response<CommentListResponse | ErrorResponse>
) => {
  try {
    const { videoId } = req.params;

    // Check if this is a YouTube video ID (starts with "youtube_")
    const isYouTubeVideo = videoId.startsWith('youtube_');
    const youtubeVideoId = isYouTubeVideo ? videoId.replace('youtube_', '') : null;

    let query = supabaseAdmin!
      .from('comments')
      .select(`
        id,
        video_id,
        youtube_video_id,
        user_id,
        text,
        parent_comment_id,
        created_at,
        updated_at,
        users:user_id (
          id,
          username,
          profile_picture_url
        )
      `);

    if (isYouTubeVideo) {
      query = query.eq('youtube_video_id', youtubeVideoId);
    } else {
      query = query.eq('video_id', videoId);
    }

    const { data: comments, error } = await query.order('created_at', { ascending: true });

    if (error) {
      res.status(500).json({ error: 'Failed to load comments' });
      return;
    }

    const formattedComments = (comments || []).map((comment: any) => ({
      id: comment.id,
      videoId: comment.video_id,
      youtubeVideoId: comment.youtube_video_id,
      userId: comment.user_id,
      text: comment.text,
      parentCommentId: comment.parent_comment_id,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      user: comment.users,
    }));

    res.json({ comments: formattedComments });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Update a comment
 * PUT /api/v1/comments/:id
 */
export const updateComment = async (
  req: Request<{ id: string }, CommentResponse | ErrorResponse, { text: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      res.status(400).json({ error: 'Comment text is required' });
      return;
    }

    if (text.length > 1000) {
      res.status(400).json({ error: 'Comment must be 1000 characters or less' });
      return;
    }

    // Verify user owns the comment
    const { data: comment, error: commentError } = await supabaseAdmin!
      .from('comments')
      .select('user_id')
      .eq('id', id)
      .single();

    if (commentError || !comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.user_id !== req.user.userId) {
      res.status(403).json({ error: 'You can only edit your own comments' });
      return;
    }

    // Sanitize comment text
    const sanitizedText = sanitizeInput(text);

    // Update comment
    const { data: updatedComment, error: updateError } = await supabaseAdmin!
      .from('comments')
      .update({
        text: sanitizedText,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, video_id, user_id, text, parent_comment_id, created_at, updated_at')
      .single();

    if (updateError || !updatedComment) {
      console.error('Error updating comment:', updateError);
      res.status(500).json({ error: 'Failed to update comment' });
      return;
    }

    res.json({
      id: updatedComment.id,
      videoId: updatedComment.video_id,
      userId: updatedComment.user_id,
      text: updatedComment.text,
      parentCommentId: updatedComment.parent_comment_id,
      createdAt: updatedComment.created_at,
      updatedAt: updatedComment.updated_at,
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a comment
 * DELETE /api/v1/comments/:id
 */
export const deleteComment = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { id } = req.params;

    // Verify user owns the comment
    const { data: comment, error: commentError } = await supabaseAdmin!
      .from('comments')
      .select('user_id')
      .eq('id', id)
      .single();

    if (commentError || !comment) {
      res.status(404).json({ error: 'Comment not found' });
      return;
    }

    if (comment.user_id !== req.user.userId) {
      res.status(403).json({ error: 'You can only delete your own comments' });
      return;
    }

    // Delete comment
    const { error: deleteError } = await supabaseAdmin!
      .from('comments')
      .delete()
      .eq('id', id);

    if (deleteError) {
      res.status(500).json({ error: 'Failed to delete comment' });
      return;
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

