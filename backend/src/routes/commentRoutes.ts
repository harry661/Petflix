import { Router } from 'express';
import {
  createComment,
  getCommentsByVideo,
  deleteComment,
} from '../controllers/commentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/:videoId', optionalAuthenticate, getCommentsByVideo);

// Protected routes
router.post('/', authenticate, createComment);
router.delete('/:id', authenticate, deleteComment);

export default router;

