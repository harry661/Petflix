import { Router } from 'express';
import {
  searchVideos,
  shareVideo,
  getVideoById,
  getFeed,
  deleteVideo,
} from '../controllers/videoController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/search', optionalAuthenticate, searchVideos);
router.get('/:id', optionalAuthenticate, getVideoById);

// Protected routes
router.post('/', authenticate, shareVideo);
router.get('/feed', authenticate, getFeed);
router.delete('/:id', authenticate, deleteVideo);

export default router;

