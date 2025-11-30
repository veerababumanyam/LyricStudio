import { Request, Response } from 'express';
import { UserRepository } from '../database/repositories/UserRepository.js';
import { TokenRepository } from '../database/repositories/TokenRepository.js';
import { PasswordService } from '../services/auth/password.service.js';
import { JWTService } from '../services/auth/jwt.service.js';
import type { User } from '../types/models.js';

interface AuthResponse {
    user: {
        id: string;
        email: string;
        displayName: string;
        avatarUrl?: string;
        authProvider: 'local' | 'google';
        emailVerified: boolean;
    };
}

export class AuthController {
    static async register(req: Request, res: Response) {
        try {
            const { email, password, displayName, phoneNumber } = req.body;

            // Check if user already exists
            const existingUser = UserRepository.findByEmail(email);
            if (existingUser) {
                return res.status(409).json({ error: 'Email already registered' });
            }

            // Validate password strength
            const passwordValidation = PasswordService.validatePasswordStrength(password);
            if (!passwordValidation.valid) {
                return res.status(400).json({
                    error: 'Password does not meet requirements',
                    details: passwordValidation.errors
                });
            }

            // Hash password
            const passwordHash = await PasswordService.hashPassword(password);

            // Create user
            const user = UserRepository.createUser({
                email,
                phone_number: phoneNumber,
                password_hash: passwordHash,
                display_name: displayName,
                auth_provider: 'local',
                email_verified: 0
            });

            // Generate tokens
            const { accessToken, refreshToken, refreshTokenExpiry } =
                await AuthController.generateTokens(user);

            // Set cookies
            AuthController.setAuthCookies(res, accessToken, refreshToken, refreshTokenExpiry);

            res.status(201).json({
                user: UserRepository.toResponse(user)
            } as AuthResponse);
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    static async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;

            // Find user
            const user = UserRepository.findByEmail(email);
            if (!user) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Check if user uses local authentication
            if (user.auth_provider !== 'local' || !user.password_hash) {
                return res.status(401).json({
                    error: 'Please sign in with Google',
                    hint: 'This account was created with Google OAuth'
                });
            }

            // Verify password
            const isPasswordValid = await PasswordService.comparePassword(
                password,
                user.password_hash
            );

            if (!isPasswordValid) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            // Update last login
            UserRepository.updateLastLogin(user.id);

            // Generate tokens
            const { accessToken, refreshToken, refreshTokenExpiry } =
                await AuthController.generateTokens(user);

            // Set cookies
            AuthController.setAuthCookies(res, accessToken, refreshToken, refreshTokenExpiry);

            res.json({
                user: UserRepository.toResponse(user)
            } as AuthResponse);
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    static async googleCallback(req: Request, res: Response) {
        try {
            const user = req.user as User;

            if (!user) {
                return res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
            }

            // Update last login
            UserRepository.updateLastLogin(user.id);

            // Generate tokens
            const { accessToken, refreshToken, refreshTokenExpiry } =
                await AuthController.generateTokens(user);

            // Set cookies
            AuthController.setAuthCookies(res, accessToken, refreshToken, refreshTokenExpiry);

            // Redirect to frontend
            res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
        } catch (error) {
            console.error('Google OAuth callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL}?error=oauth_failed`);
        }
    }

    static async refresh(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            if (!refreshToken) {
                return res.status(401).json({ error: 'No refresh token provided' });
            }

            // Hash and find token
            const tokenHash = JWTService.hashToken(refreshToken);
            const storedToken = TokenRepository.findByTokenHash(tokenHash);

            if (!storedToken) {
                return res.status(401).json({ error: 'Invalid or expired refresh token' });
            }

            // Find user
            const user = UserRepository.findById(storedToken.user_id);
            if (!user) {
                return res.status(401).json({ error: 'User not found' });
            }

            // Delete old refresh token
            TokenRepository.deleteToken(storedToken.id);

            // Generate new tokens (token rotation)
            const { accessToken, refreshToken: newRefreshToken, refreshTokenExpiry } =
                await AuthController.generateTokens(user);

            // Set new cookies
            AuthController.setAuthCookies(res, accessToken, newRefreshToken, refreshTokenExpiry);

            res.json({
                user: UserRepository.toResponse(user)
            } as AuthResponse);
        } catch (error) {
            console.error('Token refresh error:', error);
            res.status(500).json({ error: 'Token refresh failed' });
        }
    }

    static async logout(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies?.refreshToken;

            if (refreshToken) {
                const tokenHash = JWTService.hashToken(refreshToken);
                const storedToken = TokenRepository.findByTokenHash(tokenHash);

                if (storedToken) {
                    TokenRepository.deleteToken(storedToken.id);
                }
            }

            // Clear cookies
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');

            res.json({ message: 'Logged out successfully' });
        } catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Logout failed' });
        }
    }

    static async getCurrentUser(req: Request, res: Response) {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Not authenticated' });
            }

            res.json({
                user: UserRepository.toResponse(req.user)
            } as AuthResponse);
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({ error: 'Failed to get user' });
        }
    }

    // Helper methods
    private static async generateTokens(user: User) {
        const accessToken = JWTService.generateAccessToken(user.id, user.email);
        const refreshToken = JWTService.generateRefreshToken();
        const refreshTokenExpiry = JWTService.getRefreshTokenExpiry();

        // Store refresh token hash
        const tokenHash = JWTService.hashToken(refreshToken);
        TokenRepository.createRefreshToken(user.id, tokenHash, refreshTokenExpiry);

        return { accessToken, refreshToken, refreshTokenExpiry };
    }

    private static setAuthCookies(
        res: Response,
        accessToken: string,
        refreshToken: string,
        refreshTokenExpiry: number
    ) {
        const isProduction = process.env.NODE_ENV === 'production';
        const cookieDomain = process.env.COOKIE_DOMAIN || 'localhost';
        const cookieSecure = process.env.COOKIE_SECURE === 'true';

        // Access token cookie (15 minutes)
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: cookieSecure,
            sameSite: isProduction ? 'strict' : 'lax',
            domain: cookieDomain,
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        // Refresh token cookie (7 days)
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: cookieSecure,
            sameSite: isProduction ? 'strict' : 'lax',
            domain: cookieDomain,
            maxAge: refreshTokenExpiry - Date.now()
        });
    }
}
