import webpush from 'web-push';
import { supabaseAdmin } from '../config/supabase';

// VAPID keys should be set in environment variables
// If not set, we'll generate a warning but won't crash
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@petflix.app';

// Set VAPID details if keys are available
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
} else {
  console.warn('[Push Notifications] VAPID keys not configured. Push notifications will not work.');
  console.warn('[Push Notifications] Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY environment variables.');
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  tag?: string;
  url?: string;
}

/**
 * Send push notification to a user
 */
export const sendPushNotification = async (
  userId: string,
  payload: PushNotificationPayload
): Promise<void> => {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('[Push Notifications] Cannot send notification: VAPID keys not configured');
    return;
  }

  try {
    // Get all push subscriptions for the user
    const { data: subscriptions, error } = await supabaseAdmin!
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId);

    if (error) {
      console.error('[Push Notifications] Error fetching subscriptions:', error);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      // User has no subscriptions, silently return
      return;
    }

    // Check if user has notifications enabled
    const { data: preferences } = await supabaseAdmin!
      .from('user_notification_preferences')
      .select('notifications_enabled')
      .eq('user_id', userId)
      .single();

    if (preferences && !preferences.notifications_enabled) {
      // User has disabled notifications
      return;
    }

    // Prepare notification payload
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/vite.svg',
      badge: payload.badge || '/vite.svg',
      data: {
        ...payload.data,
        url: payload.url,
      },
      tag: payload.tag || 'default',
    });

    // Send to all subscriptions
    const sendPromises = subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          notificationPayload
        );
      } catch (error: any) {
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          console.log('[Push Notifications] Removing invalid subscription:', subscription.endpoint);
          await supabaseAdmin!
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', subscription.endpoint);
        } else {
          console.error('[Push Notifications] Error sending notification:', error);
        }
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    console.error('[Push Notifications] Error in sendPushNotification:', error);
  }
};

/**
 * Send push notification to multiple users
 */
export const sendPushNotificationToUsers = async (
  userIds: string[],
  payload: PushNotificationPayload
): Promise<void> => {
  const sendPromises = userIds.map((userId) => sendPushNotification(userId, payload));
  await Promise.allSettled(sendPromises);
};

/**
 * Get VAPID public key (for frontend)
 */
export const getVAPIDPublicKey = (): string => {
  return VAPID_PUBLIC_KEY;
};

