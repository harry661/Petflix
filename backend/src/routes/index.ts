import { Router } from 'express';
import { notFoundHandler } from '../middleware/errorHandler';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Petflix API is running' });
});

// API v1 routes
import userRoutes from './userRoutes';

router.use('/api/v1/users', userRoutes);
// router.use('/api/v1/videos', videoRoutes);
// router.use('/api/v1/comments', commentRoutes);
// router.use('/api/v1/playlists', playlistRoutes);
// router.use('/api/v1/push_notifications', pushNotificationRoutes);

// 404 handler for API routes
router.use(notFoundHandler);

export default router;

