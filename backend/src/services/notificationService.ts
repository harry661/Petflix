import { supabaseAdmin } from '../config/supabase';

/**
 * Create a notification for a user
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
    // Get the follower's username
    const { data: followerData } = await supabaseAdmin!
      .from('users')
      .select('username')
      .eq('id', followerId)
      .single();

    const followerUsername = followerData?.username || 'Someone';

    await createNotification(
      followedUserId,
      'follow',
      `${followerUsername} started following you`,
      `${followerUsername} is now following you`,
      followerId
    );
  } catch (error) {
    console.error('Error notifying user of new follower:', error);
    // Don't throw - notifications are non-critical
  }
};

