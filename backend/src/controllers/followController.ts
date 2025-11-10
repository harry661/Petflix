import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { FollowResponse, ErrorResponse } from '../types';

/**
 * Follow a user
 * POST /api/v1/users/:userId/follow
 */
export const followUser = async (
  req: Request<{ userId: string }>,
  res: Response<FollowResponse | ErrorResponse>
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { userId } = req.params;
    const followerId = req.user.userId;

    // Prevent self-following
    if (followerId === userId) {
      res.status(400).json({ error: 'You cannot follow yourself' });
      return;
    }

    // Check if already following
    const { data: existing } = await supabaseAdmin!
      .from('followers')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', userId)
      .single();

    if (existing) {
      res.status(409).json({ error: 'You are already following this user' });
      return;
    }

    // Create follow relationship
    const { data: follow, error } = await supabaseAdmin!
      .from('followers')
      .insert({
        follower_id: followerId,
        following_id: userId,
      })
      .select('follower_id, following_id, created_at')
      .single();

    if (error) {
      console.error('Error following user:', error);
      res.status(500).json({ error: 'Failed to follow user' });
      return;
    }

    res.status(201).json({
      followerId: follow.follower_id,
      followingId: follow.following_id,
      createdAt: follow.created_at,
    });
  } catch (error) {
    console.error('Follow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Unfollow a user
 * DELETE /api/v1/users/:userId/unfollow
 */
export const unfollowUser = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { userId } = req.params;
    const followerId = req.user.userId;

    // Delete follow relationship
    const { error } = await supabaseAdmin!
      .from('followers')
      .delete()
      .eq('follower_id', followerId)
      .eq('following_id', userId);

    if (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ error: 'Failed to unfollow user' });
      return;
    }

    res.json({ followerId, followingId: userId, createdAt: new Date().toISOString() });
  } catch (error) {
    console.error('Unfollow user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's followers
 * GET /api/v1/users/:userId/followers
 */
export const getFollowers = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const { data: followers, error } = await supabaseAdmin!
      .from('followers')
      .select(`
        follower_id,
        created_at,
        users:follower_id (
          id,
          username,
          email,
          profile_picture_url,
          bio
        )
      `)
      .eq('following_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to load followers' });
      return;
    }

    res.json({
      users: (followers || []).map((f: any) => f.users),
    });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get users that a user is following
 * GET /api/v1/users/:userId/following
 */
export const getFollowing = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    const { userId } = req.params;

    const { data: following, error } = await supabaseAdmin!
      .from('followers')
      .select(`
        following_id,
        created_at,
        users:following_id (
          id,
          username,
          email,
          profile_picture_url,
          bio
        )
      `)
      .eq('follower_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: 'Failed to load following' });
      return;
    }

    res.json({
      users: (following || []).map((f: any) => f.users),
    });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Check if current user is following a user
 * GET /api/v1/users/:userId/follow-status
 */
export const getFollowStatus = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.json({ isFollowing: false });
      return;
    }

    const { userId } = req.params;
    const followerId = req.user.userId;

    const { data, error } = await supabaseAdmin!
      .from('followers')
      .select('*')
      .eq('follower_id', followerId)
      .eq('following_id', userId)
      .single();

    res.json({ isFollowing: !!data && !error });
  } catch (error) {
    res.json({ isFollowing: false });
  }
};

