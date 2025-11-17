import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import {
  subscribeToPush,
  unsubscribeFromPush,
  getPushSubscriptionStatus,
} from '../controllers/pushNotificationController';
import { getVAPIDPublicKey } from '../services/pushNotificationService';

const router = Router();

// Get VAPID public key (public endpoint)
router.get('/vapid-key', (req, res) => {
  const publicKey = getVAPIDPublicKey();
  if (!publicKey) {
    res.status(503).json({ error: 'Push notifications not configured' });
    return;
  }
  res.json({ publicKey });
});

// Protected routes
router.post('/', authenticate, subscribeToPush);
router.delete('/', authenticate, unsubscribeFromPush);
router.get('/status', authenticate, getPushSubscriptionStatus);

export default router;

