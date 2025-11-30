import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { JWTPayload } from '../types/models.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export class JWTService {
    private static getAccessSecret(): string {
        const secret = process.env.JWT_ACCESS_SECRET;
        if (!secret) {
            throw new Error('JWT_ACCESS_SECRET is not defined in environment variables');
        }
        return secret;
    }

    private static getRefreshSecret(): string {
        const secret = process.env.JWT_REFRESH_SECRET;
        if (!secret) {
            throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
        }
        return secret;
    }

    static generateAccessToken(userId: string, email: string): string {
        const payload: JWTPayload = { userId, email };
        return jwt.sign(payload, this.getAccessSecret(), {
            expiresIn: ACCESS_TOKEN_EXPIRY
        });
    }

    static generateRefreshToken(): string {
        return crypto.randomBytes(40).toString('hex');
    }

    static verifyAccessToken(token: string): JWTPayload {
        try {
            return jwt.verify(token, this.getAccessSecret()) as JWTPayload;
        } catch (error) {
            throw new Error('Invalid or expired access token');
        }
    }

    static hashToken(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    static getRefreshTokenExpiry(): number {
        // 7 days from now
        return Date.now() + 7 * 24 * 60 * 60 * 1000;
    }
}
