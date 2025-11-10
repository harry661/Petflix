import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  getUserById,
  updateProfile,
} from '../controllers/userController';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
} from '../controllers/followController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/:userId', getUserById);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/:userId/follow-status', optionalAuthenticate, getFollowStatus);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateProfile);
router.post('/:userId/follow', authenticate, followUser);
router.delete('/:userId/unfollow', authenticate, unfollowUser);

export default router;

