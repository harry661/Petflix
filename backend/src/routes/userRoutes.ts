import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  getUserById,
  updateProfile,
  searchUsers,
} from '../controllers/userController';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
  getFollowStatus,
} from '../controllers/followController';
import {
  toggleUserNotificationPreference,
  getUserNotificationPreference,
} from '../controllers/notificationController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.get('/search', searchUsers);

// Protected routes - must come before /:userId to avoid route conflicts
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateProfile);

// User-specific routes (must come after /me)
router.get('/:userId', getUserById);
router.get('/:userId/followers', getFollowers);
router.get('/:userId/following', getFollowing);
router.get('/:userId/follow-status', optionalAuthenticate, getFollowStatus);
router.post('/:userId/follow', authenticate, followUser);
router.delete('/:userId/unfollow', authenticate, unfollowUser);
router.get('/:userId/notification-preference', authenticate, getUserNotificationPreference);
router.put('/:userId/notification-preference', authenticate, toggleUserNotificationPreference);

export default router;

