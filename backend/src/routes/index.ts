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

// Debug route to check routing
router.all('/debug-route', (req, res) => {
  res.json({
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url,
    baseUrl: req.baseUrl,
    route: req.route?.path,
  });
});

// Test routes (development only)
import testRoutes from './testRoutes';
router.use('/test', testRoutes);

// API v1 routes
import userRoutes from './userRoutes';
import videoRoutes from './videoRoutes';

router.use('/api/v1/users', userRoutes);
router.use('/api/v1/videos', videoRoutes);
import commentRoutes from './commentRoutes';
router.use('/api/v1/comments', commentRoutes);
import playlistRoutes from './playlistRoutes';
router.use('/api/v1/playlists', playlistRoutes);
import notificationRoutes from './notificationRoutes';
router.use('/api/v1/notifications', notificationRoutes);
// router.use('/api/v1/push_notifications', pushNotificationRoutes);

// Debug: Log all unmatched routes before 404
router.use((req, res, next) => {
  console.log('⚠️ Unmatched route:', {
    method: req.method,
    path: req.path,
    originalUrl: req.originalUrl,
    url: req.url,
    baseUrl: req.baseUrl,
  });
  next();
});

// 404 handler for API routes
router.use(notFoundHandler);

export default router;

