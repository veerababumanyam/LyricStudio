import { Router } from 'express';
import passport from 'passport';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
    registerValidation,
    loginValidation,
    handleValidationErrors
} from '../middleware/validation.middleware.js';

const router = Router();

// Local authentication
router.post(
    '/register',
    registerValidation,
    handleValidationErrors,
    AuthController.register
);

router.post(
    '/login',
    loginValidation,
    handleValidationErrors,
    AuthController.login
);

// Google OAuth
router.get(
    '/google',
    passport.authenticate('google', {
        scope: ['profile', 'email'],
        session: false
    })
);

router.get(
    '/google/callback',
    passport.authenticate('google', {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}?error=oauth_failed`
    }),
    AuthController.googleCallback
);

// Token management
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Protected routes
router.get('/me', authenticate, AuthController.getCurrentUser);

export default router;
