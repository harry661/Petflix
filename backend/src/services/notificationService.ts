import { supabaseAdmin } from '../config/supabase';
import { sendPushNotification } from './pushNotificationService';

/**
 * Create a notification for a user and send push notification if enabled
 */
export const createNotification = async (
  userId: string,
  type: 'video_shared' | 'comment' | 'follow' | 'like',
  title: string,
  message: string,
  relatedUserId?: string,
  relatedVideoId?: string
): Promise<void> => {
  try {
    // Create notification in database
    await supabaseAdmin!
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_user_id: relatedUserId || null,
        related_video_id: relatedVideoId || null,
        read: false,
      });

    // Send push notification (fire and forget, don't block)
    const frontendUrl = process.env.FRONTEND_URL || 'https://petflix-weld.vercel.app';
    const notificationUrl = relatedVideoId 
      ? `${frontendUrl}/video/${relatedVideoId}`
      : relatedUserId
      ? `${frontendUrl}/profile/${relatedUserId}`
      : frontendUrl;

    sendPushNotification(userId, {
      title,
      body: message,
      icon: `${frontendUrl}/vite.svg`,
      badge: `${frontendUrl}/vite.svg`,
      tag: type,
      url: notificationUrl,
      data: {
        type,
        relatedUserId: relatedUserId || null,
        relatedVideoId: relatedVideoId || null,
      },
    }).catch((err) => {
      // Silently fail - push notifications are non-critical
      console.error('[Notification] Error sending push notification:', err);
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    // Don't throw - notifications are non-critical
  }
};

/**
 * Create notifications for followers when a user shares a video
 */
export const notifyFollowersOfVideoShare = async (
  videoOwnerId: string,
  videoId: string,
  videoTitle: string
): Promise<void> => {
  try {
    // Get all followers of the video owner
    const { data: followers, error: followersError } = await supabaseAdmin!
      .from('followers')
      .select('follower_id')
      .eq('following_id', videoOwnerId);

    if (followersError || !followers || followers.length === 0) {
      return; // No followers or error
    }

    // Get notification preferences for each follower
    const followerIds = followers.map((f: any) => f.follower_id);
    
    // Get users who have notifications enabled for this user
    const { data: preferences } = await supabaseAdmin!
      .from('user_follow_notification_preferences')
      .select('user_id')
      .eq('following_user_id', videoOwnerId)
      .eq('notifications_enabled', true);

    const enabledFollowerIds = preferences 
      ? preferences.map((p: any) => p.user_id)
      : [];

    // Get the video owner's username for the notification
    const { data: ownerData } = await supabaseAdmin!
      .from('users')
      .select('username')
      .eq('id', videoOwnerId)
      .single();

    const ownerUsername = ownerData?.username || 'Someone';

    // Create notifications for followers who have notifications enabled
    // If no preference exists, default to enabled (so include all followers)
    const followersToNotify = enabledFollowerIds.length > 0
      ? followerIds.filter((id: string) => enabledFollowerIds.includes(id))
      : followerIds; // Default to enabled if no preferences set

    if (followersToNotify.length === 0) {
      return;
    }

    // Create notifications in batch
    const notifications = followersToNotify.map((followerId: string) => ({
      user_id: followerId,
      type: 'video_shared' as const,
      title: `${ownerUsername} shared a new video`,
      message: videoTitle.length > 60 ? `${videoTitle.substring(0, 60)}...` : videoTitle,
      related_user_id: videoOwnerId,
      related_video_id: videoId,
      read: false,
    }));

    // Insert in batches of 100 to avoid query size limits
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      await supabaseAdmin!
        .from('notifications')
        .insert(batch);
    }

    // Send push notifications to all followers (fire and forget)
    const frontendUrl = process.env.FRONTEND_URL || 'https://petflix-weld.vercel.app';
    const notificationUrl = `${frontendUrl}/video/${videoId}`;
    
    const pushPromises = followersToNotify.map((followerId: string) =>
      sendPushNotification(followerId, {
        title: `${ownerUsername} shared a new video`,
        body: videoTitle.length > 60 ? `${videoTitle.substring(0, 60)}...` : videoTitle,
        icon: `${frontendUrl}/vite.svg`,
        badge: `${frontendUrl}/vite.svg`,
        tag: 'video_shared',
        url: notificationUrl,
        data: {
          type: 'video_shared',
          relatedUserId: videoOwnerId,
          relatedVideoId: videoId,
        },
      }).catch((err) => {
        // Silently fail - push notifications are non-critical
        console.error(`[Notification] Error sending push to follower ${followerId}:`, err);
      })
    );

    // Don't await - let push notifications send in background
    Promise.allSettled(pushPromises).catch(() => {
      // Ignore errors
    });
  } catch (error) {
    console.error('Error notifying followers of video share:', error);
    // Don't throw - notifications are non-critical
  }
};

/**
 * Create a notification when someone follows you
 */
export const notifyUserOfNewFollower = async (
  followedUserId: string,
  followerId: string
): Promise<void> => {
  try {
    // Get the follower's username and profile picture
    const { data: followerData, error: followerError } = await supabaseAdmin!
      .from('users')
      .select('username, profile_picture_url')
      .eq('id', followerId)
      .single();

    if (followerError || !followerData) {
      console.error('Error fetching follower data:', followerError);
      return;
    }

    const followerUsername = followerData.username || 'Someone';

    // Create the notification
    const { error: notifError } = await supabaseAdmin!
      .from('notifications')
      .insert({
        user_id: followedUserId,
        type: 'follow',
        title: `${followerUsername} started following you`,
        message: `${followerUsername} is now following you. Check out their profile!`,
        related_user_id: followerId,
        read: false,
      });

    if (notifError) {
      console.error('Error creating follow notification:', notifError);
    } else {
      console.log(`✅ Created follow notification for user ${followedUserId} from ${followerUsername}`);
      
      // Send push notification (fire and forget)
      const frontendUrl = process.env.FRONTEND_URL || 'https://petflix-weld.vercel.app';
      sendPushNotification(followedUserId, {
        title: `${followerUsername} started following you`,
        body: `${followerUsername} is now following you. Check out their profile!`,
        icon: `${frontendUrl}/vite.svg`,
        badge: `${frontendUrl}/vite.svg`,
        tag: 'follow',
        url: `${frontendUrl}/profile/${followerId}`,
        data: {
          type: 'follow',
          relatedUserId: followerId,
        },
      }).catch((err) => {
        // Silently fail - push notifications are non-critical
        console.error('[Notification] Error sending push notification:', err);
      });
    }
  } catch (error) {
    console.error('Error notifying user of new follower:', error);
    // Don't throw - notifications are non-critical
  }
};

