import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  getUserById,
  updateProfile,
} from '../controllers/userController';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate, getCurrentUser);
router.put('/me', authenticate, updateProfile);
router.get('/:userId', getUserById);

export default router;

