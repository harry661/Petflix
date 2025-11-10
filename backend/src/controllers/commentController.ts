import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import {
  CommentCreationRequest,
  CommentResponse,
  CommentListResponse,
  ErrorResponse,
} from '../types';
import { sanitizeInput } from '../middleware/validation';

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

    // Create comment
    const { data: newComment, error: insertError } = await supabaseAdmin!
      .from('comments')
      .insert({
        video_id: videoId,
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

    const { data: comments, error } = await supabaseAdmin!
      .from('comments')
      .select(`
        id,
        video_id,
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
      `)
      .eq('video_id', videoId)
      .order('created_at', { ascending: true });

    if (error) {
      res.status(500).json({ error: 'Failed to load comments' });
      return;
    }

    const formattedComments = (comments || []).map((comment: any) => ({
      id: comment.id,
      videoId: comment.video_id,
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

