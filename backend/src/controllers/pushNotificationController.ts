import { Request, Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticate } from '../middleware/auth';
import { ErrorResponse } from '../types';
import webpush from 'web-push';

interface PushSubscriptionRequest {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Subscribe to push notifications
 * POST /api/v1/push_notifications
 */
export const subscribeToPush = async (
  req: Request<{}, { message: string } | ErrorResponse, PushSubscriptionRequest>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { endpoint, keys } = req.body;

    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      res.status(400).json({ error: 'Invalid push subscription data' });
      return;
    }

    // Check if subscription already exists
    const { data: existing } = await supabaseAdmin!
      .from('push_subscriptions')
      .select('endpoint')
      .eq('user_id', req.user.userId)
      .eq('endpoint', endpoint)
      .single();

    if (existing) {
      // Update existing subscription
      const { error } = await supabaseAdmin!
        .from('push_subscriptions')
        .update({
          p256dh: keys.p256dh,
          auth: keys.auth,
        })
        .eq('user_id', req.user.userId)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('Error updating push subscription:', error);
        res.status(500).json({ error: 'Failed to update push subscription' });
        return;
      }
    } else {
      // Insert new subscription
      const { error } = await supabaseAdmin!
        .from('push_subscriptions')
        .insert({
          user_id: req.user.userId,
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        });

      if (error) {
        console.error('Error creating push subscription:', error);
        res.status(500).json({ error: 'Failed to create push subscription' });
        return;
      }
    }

    res.json({ message: 'Successfully subscribed to push notifications' });
  } catch (error) {
    console.error('Subscribe to push error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Unsubscribe from push notifications
 * DELETE /api/v1/push_notifications
 */
export const unsubscribeFromPush = async (
  req: Request<{}, { message: string } | ErrorResponse, {}, { endpoint?: string }>,
  res: Response
) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { endpoint } = req.query;

    if (endpoint) {
      // Delete specific subscription
      const { error } = await supabaseAdmin!
        .from('push_subscriptions')
        .delete()
        .eq('user_id', req.user.userId)
        .eq('endpoint', endpoint);

      if (error) {
        console.error('Error deleting push subscription:', error);
        res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
        return;
      }
    } else {
      // Delete all subscriptions for user
      const { error } = await supabaseAdmin!
        .from('push_subscriptions')
        .delete()
        .eq('user_id', req.user.userId);

      if (error) {
        console.error('Error deleting push subscriptions:', error);
        res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
        return;
      }
    }

    res.json({ message: 'Successfully unsubscribed from push notifications' });
  } catch (error) {
    console.error('Unsubscribe from push error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get user's push subscription status
 * GET /api/v1/push_notifications/status
 */
export const getPushSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const { data: subscriptions, error } = await supabaseAdmin!
      .from('push_subscriptions')
      .select('endpoint, created_at')
      .eq('user_id', req.user.userId);

    if (error) {
      console.error('Error fetching push subscriptions:', error);
      res.status(500).json({ error: 'Failed to fetch push subscription status' });
      return;
    }

    res.json({
      subscribed: (subscriptions?.length || 0) > 0,
      subscriptionCount: subscriptions?.length || 0,
      subscriptions: subscriptions || [],
    });
  } catch (error) {
    console.error('Get push subscription status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

