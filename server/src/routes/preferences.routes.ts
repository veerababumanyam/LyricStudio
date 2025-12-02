import { Router } from 'express';
import { PreferencesController } from '../controllers/preferences.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Preferences routes
router.get('/', PreferencesController.getPreferences);
router.put('/', PreferencesController.updatePreferences);

// API key routes
router.post('/api-key', PreferencesController.setApiKey);
router.get('/api-key', PreferencesController.getApiKey);
router.delete('/api-key', PreferencesController.deleteApiKey);

export default router;
