import { Router } from 'express';
import {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
} from '../controllers/playlistController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';

const router = Router();

// Protected routes
router.post('/', authenticate, createPlaylist);
router.get('/', authenticate, getUserPlaylists);
router.get('/:id', optionalAuthenticate, getPlaylistById);
router.post('/:id/videos', authenticate, addVideoToPlaylist);
router.delete('/:id/videos/:videoId', authenticate, removeVideoFromPlaylist);
router.delete('/:id', authenticate, deletePlaylist);

export default router;

