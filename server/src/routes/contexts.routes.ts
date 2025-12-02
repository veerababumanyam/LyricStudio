import { Router } from 'express';
import { ContextsController } from '../controllers/contexts.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Contexts routes
router.get('/', ContextsController.getAllContexts);
router.get('/:id', ContextsController.getContext);
router.post('/', ContextsController.createContext);
router.put('/:id', ContextsController.updateContext);
router.delete('/:id', ContextsController.deleteContext);

// Bulk operations (for migration)
router.post('/bulk', ContextsController.bulkCreateContexts);

export default router;
