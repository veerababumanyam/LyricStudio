import { Router } from 'express';
import { SongsController } from '../controllers/songs.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Songs routes
router.get('/', SongsController.getAllSongs);
router.get('/:id', SongsController.getSong);
router.post('/', SongsController.createSong);
router.put('/:id', SongsController.updateSong);
router.delete('/:id', SongsController.deleteSong);

// Bulk operations (for migration)
router.post('/bulk', SongsController.bulkCreateSongs);

export default router;
