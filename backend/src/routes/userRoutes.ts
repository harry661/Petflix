import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  getUserById,
  updateProfile,
  searchUsers,
  changePassword,
  deleteAccount,
  getGlobalNotificationPreference,
  updateGlobalNotificationPreference,
  forgotPassword,
  resetPassword,
  getMostPopularUserThisWeek,
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
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// Public routes with rate limiting for auth endpoints
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.get('/search', searchUsers);
router.get('/most-popular-this-week', getMostPopularUserThisWeek);

// Protected routes - must come before /:userId to avoid route conflicts
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateProfile);
router.put('/me/password', authenticate, changePassword);
router.delete('/me', authenticate, deleteAccount);

// Profile picture upload route
import { uploadProfilePicture, uploadMiddleware } from '../controllers/uploadController';
router.post('/me/profile-picture', authenticate, uploadMiddleware, uploadProfilePicture);
router.get('/me/notification-preference', authenticate, getGlobalNotificationPreference);
router.put('/me/notification-preference', authenticate, updateGlobalNotificationPreference);

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

