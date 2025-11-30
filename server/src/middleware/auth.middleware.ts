import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/auth/jwt.service.js';
import { UserRepository } from '../database/repositories/UserRepository.js';
import type { User } from '../types/models.js';

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
    try {
        // Try to get token from cookie first, then Authorization header
        let token = req.cookies?.accessToken;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (!token) {
            return res.status(401).json({ error: 'No authentication token provided' });
        }

        const payload = JWTService.verifyAccessToken(token);
        const user = UserRepository.findById(payload.userId);

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
    try {
        let token = req.cookies?.accessToken;

        if (!token) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith('Bearer ')) {
                token = authHeader.substring(7);
            }
        }

        if (token) {
            const payload = JWTService.verifyAccessToken(token);
            const user = UserRepository.findById(payload.userId);
            if (user) {
                req.user = user;
            }
        }
    } catch {
        // Ignore errors for optional auth
    }

    next();
}
