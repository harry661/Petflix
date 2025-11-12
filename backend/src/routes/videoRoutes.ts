import { Router } from 'express';
import {
  searchVideos,
  shareVideo,
  getVideoById,
  getFeed,
  getVideosByUser,
  getRecentVideos,
  likeVideo,
  unlikeVideo,
  getLikeStatus,
  getSearchHistory,
  clearSearchHistory,
  deleteVideo,
} from '../controllers/videoController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/search', optionalAuthenticate, searchVideos);
router.get('/recent', optionalAuthenticate, getRecentVideos);
router.get('/user/:userId', optionalAuthenticate, getVideosByUser);

// Protected routes
router.post('/', authenticate, shareVideo);
router.get('/feed', authenticate, getFeed); // Must come before /:id route
router.get('/search-history', authenticate, getSearchHistory);
router.delete('/search-history', authenticate, clearSearchHistory);
router.post('/:id/like', authenticate, likeVideo);
router.delete('/:id/like', authenticate, unlikeVideo);
router.get('/:id/like-status', optionalAuthenticate, getLikeStatus);
router.delete('/:id', authenticate, deleteVideo);

// This must come last to avoid matching /feed, /search, etc. as video IDs
router.get('/:id', optionalAuthenticate, getVideoById);

export default router;

