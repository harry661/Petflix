import { Router } from 'express';
import {
  searchVideos,
  shareVideo,
  getVideoById,
  getFeed,
  getVideosByUser,
  getRecentVideos,
  updateVideo,
  getVideoTags,
  deleteVideo,
} from '../controllers/videoController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/search', optionalAuthenticate, searchVideos);
router.get('/recent', optionalAuthenticate, getRecentVideos);
router.get('/user/:userId', optionalAuthenticate, getVideosByUser);
router.get('/:id', optionalAuthenticate, getVideoById);

// Protected routes
router.post('/', authenticate, shareVideo);
router.get('/feed', authenticate, getFeed);
router.put('/:id', authenticate, updateVideo);
router.get('/:id/tags', optionalAuthenticate, getVideoTags);
router.delete('/:id', authenticate, deleteVideo);

export default router;

