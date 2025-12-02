import 'dotenv/config'; // Load environment variables first
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import { initDatabase } from './database/db.js';
import { configureGoogleOAuth } from './services/auth/oauth.service.js';
import { EncryptionService } from './services/encryption.service.js';
import authRoutes from './routes/auth.routes.js';
import preferencesRoutes from './routes/preferences.routes.js';
import songsRoutes from './routes/songs.routes.js';
import profilesRoutes from './routes/profiles.routes.js';
import contextsRoutes from './routes/contexts.routes.js';

// Debug: Check if secrets are loaded
const checkSecret = (name: string, value?: string) => {
    console.log(`🔐 ${name}: ${value ? 'Loaded ✅' : 'Missing ❌'}`);
};

checkSecret('JWT_ACCESS_SECRET', process.env.JWT_ACCESS_SECRET);
checkSecret('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);
checkSecret('ENCRYPTION_MASTER_KEY', process.env.ENCRYPTION_MASTER_KEY);

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS configuration
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Passport initialization
app.use(passport.initialize());

// Initialize database
try {
    initDatabase();
} catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
}

// Initialize encryption service
try {
    EncryptionService.initialize(process.env.ENCRYPTION_MASTER_KEY);
} catch (error) {
    console.error('❌ Failed to initialize encryption service:', error);
    process.exit(1);
}

// Configure OAuth
configureGoogleOAuth();

// Health check route
app.get('/health', (_req: Request, res: Response) => {
    try {
        const db = initDatabase();
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
        res.json({ 
            status: 'ok', 
            timestamp: new Date().toISOString(),
            database: 'connected',
            userCount: userCount.count
        });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).json({ 
            status: 'error', 
            error: String(error) 
        });
    }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/songs', songsRoutes);
app.use('/api/profiles', profilesRoutes);
app.use('/api/contexts', contextsRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);

    res.status(500).json({
        error: process.env.NODE_ENV === 'development'
            ? err.message
            : 'Internal server error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 API Documentation: http://localhost:${PORT}/health`);
    console.log(`🎨 Frontend: ${FRONTEND_URL}\n`);
});

export default app;
