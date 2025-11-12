import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';

/**
 * Get user's notifications
 * GET /api/v1/notifications
 */
export const getNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userId = req.user.userId;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    let query = supabaseAdmin!
      .from('notifications')
      .select(`
        id,
        type,
        title,
        message,
        read,
        created_at,
        related_user_id,
        related_video_id,
        related_user:related_user_id (
          id,
          username,
          profile_picture_url
        ),
        related_video:related_video_id (
          id,
          youtube_video_id,
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Failed to fetch notifications' });
      return;
    }

    // Get unread count
    const { count: unreadCount } = await supabaseAdmin!
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    res.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Mark notification as read
 * PUT /api/v1/notifications/:notificationId/read
 */
export const markNotificationAsRead = async (
  req: Request<{ notificationId: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { notificationId } = req.params;
    const userId = req.user.userId;

    // Verify notification belongs to user
    const { data: notification, error: fetchError } = await supabaseAdmin!
      .from('notifications')
      .select('id, user_id')
      .eq('id', notificationId)
      .single();

    if (fetchError || !notification) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    if (notification.user_id !== userId) {
      res.status(403).json({ error: 'Unauthorized' });
      return;
    }

    const { error: updateError } = await supabaseAdmin!
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (updateError) {
      console.error('Error marking notification as read:', updateError);
      res.status(500).json({ error: 'Failed to mark notification as read' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Mark all notifications as read
 * PUT /api/v1/notifications/read-all
 */
export const markAllNotificationsAsRead = async (
  req: Request,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const userId = req.user.userId;

    const { error } = await supabaseAdmin!
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Failed to mark all notifications as read' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Toggle notification preference for a specific user
 * PUT /api/v1/users/:userId/notification-preference
 */
export const toggleUserNotificationPreference = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { userId } = req.params;
    const currentUserId = req.user.userId;
    const { enabled } = req.body;

    if (currentUserId === userId) {
      res.status(400).json({ error: 'Cannot set notification preference for yourself' });
      return;
    }

    // Check if user is following this user
    const { data: followCheck } = await supabaseAdmin!
      .from('followers')
      .select('*')
      .eq('follower_id', currentUserId)
      .eq('following_id', userId)
      .single();

    if (!followCheck) {
      res.status(400).json({ error: 'You must follow this user to set notification preferences' });
      return;
    }

    // Upsert notification preference
    const { data, error } = await supabaseAdmin!
      .from('user_follow_notification_preferences')
      .upsert({
        user_id: currentUserId,
        following_user_id: userId,
        notifications_enabled: enabled !== undefined ? enabled : true,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,following_user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preference:', error);
      res.status(500).json({ error: 'Failed to update notification preference' });
      return;
    }

    res.json({
      userId: data.user_id,
      followingUserId: data.following_user_id,
      notificationsEnabled: data.notifications_enabled,
    });
  } catch (error) {
    console.error('Toggle notification preference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get notification preference for a specific user
 * GET /api/v1/users/:userId/notification-preference
 */
export const getUserNotificationPreference = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { userId } = req.params;
    const currentUserId = req.user.userId;

    const { data, error } = await supabaseAdmin!
      .from('user_follow_notification_preferences')
      .select('notifications_enabled')
      .eq('user_id', currentUserId)
      .eq('following_user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching notification preference:', error);
      res.status(500).json({ error: 'Failed to fetch notification preference' });
      return;
    }

    // Default to true if no preference exists
    res.json({
      notificationsEnabled: data?.notifications_enabled ?? true,
    });
  } catch (error) {
    console.error('Get notification preference error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

