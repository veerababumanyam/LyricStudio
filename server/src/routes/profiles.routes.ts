import { Router } from 'express';
import { ProfilesController } from '../controllers/profiles.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Profiles routes
router.get('/', ProfilesController.getAllProfiles);
router.get('/:id', ProfilesController.getProfile);
router.post('/', ProfilesController.createProfile);
router.put('/:id', ProfilesController.updateProfile);
router.delete('/:id', ProfilesController.deleteProfile);

// Bulk operations (for migration)
router.post('/bulk', ProfilesController.bulkCreateProfiles);

export default router;
