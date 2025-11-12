import { Router } from 'express';
import {
  createComment,
  getCommentsByVideo,
  updateComment,
  deleteComment,
} from '../controllers/commentController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/:videoId', optionalAuthenticate, getCommentsByVideo);

// Protected routes
router.post('/', authenticate, createComment);
router.put('/:id', authenticate, updateComment);
router.delete('/:id', authenticate, deleteComment);

export default router;

