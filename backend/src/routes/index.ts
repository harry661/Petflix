import { Router } from 'express';
import { notFoundHandler } from '../middleware/errorHandler';

const router = Router();

// Root route
router.get('/', (req, res) => {
  res.json({ message: 'Petflix API v1', endpoints: '/api/v1' });
});

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Petflix API is running' });
});

// API v1 routes
import userRoutes from './userRoutes';
import videoRoutes from './videoRoutes';

router.use('/api/v1/users', userRoutes);
router.use('/api/v1/videos', videoRoutes);
import commentRoutes from './commentRoutes';
router.use('/api/v1/comments', commentRoutes);
// router.use('/api/v1/playlists', playlistRoutes);
// router.use('/api/v1/push_notifications', pushNotificationRoutes);

// 404 handler for API routes
router.use(notFoundHandler);

export default router;

