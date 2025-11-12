import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All notification routes require authentication
router.get('/', authenticate, getNotifications);
router.put('/:notificationId/read', authenticate, markNotificationAsRead);
router.put('/read-all', authenticate, markAllNotificationsAsRead);

export default router;

