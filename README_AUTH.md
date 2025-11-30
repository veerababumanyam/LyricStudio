# Authentication Setup Guide

## Overview

SWAZ eLyrics Studio now includes a full-stack authentication system with:
- ✅ **Local Authentication** (email/password)
- ✅ **Google OAuth 2.0** integration
- ✅ **SQLite Database** for user management (10k+ users supported)
- ✅ **JWT Tokens** with refresh token rotation
- ✅ **Secure password hashing** with bcrypt
- ✅ **httpOnly cookies** for XSS protection

---

## Quick Start

### 1. Install Dependencies

Both frontend and backend dependencies are already installed if you see this file.

To reinstall:
```bash
# Frontend
npm install

# Backend
cd server && npm install
```

### 2. Configure Google OAuth (Optional)

> [!IMPORTANT]
> **Google OAuth is optional**. The app works with local email/password authentication out of the box. Set this up only if you want "Sign in with Google" functionality.

#### Get Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Application type: **Web application**
7. Add authorized redirect URI: `http://localhost:3001/api/auth/google/callback`
8. Click **Create** and save your **Client ID** and **Client Secret**

#### Update Backend .env:

Open `server/.env` and update:
```env
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
```

The JWT secrets and other configuration are already set with secure random values.

### 3. Start Development Servers

#### Option A: Run both servers together (Recommended)
```bash
npm run dev:all
```

This starts:
- Frontend on **http://localhost:3000**
- Backend on **http://localhost:3001**

#### Option B: Run servers separately

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

---

## Testing the Authentication System

### 1. Test Local Registration

1. Open http://localhost:3000
2. You should see a login/register option
3. Click "Register" or "Create account"
4. Fill in:
   - Display Name: Your Name
   - Email: test@example.com
   - Password: Test123$ (must have uppercase, lowercase, number)
5. Click "Create Account"
6. You should be automatically logged in

### 2. Test Local Login

1. Logout
2. Click "Sign In"
3. Enter your credentials
4. You should be logged back in

### 3. Test Google OAuth (if configured)

1. Click "Continue with Google"
2. Select your Google account
3. Grant permissions
4. You'll be redirected back and logged in

### 4. Test Token Refresh

1. Login and wait 15 minutes (or modify JWT expiry in `server/src/services/auth/jwt.service.ts`)
2. Make a request - token should auto-refresh seamlessly

### 5. Test Protected Routes

Protected routes automatically redirect to login if not authenticated.

---

## Database

The SQLite database is created automatically at: `server/database/swaz.db`

### View Database Contents:

```bash
sqlite3 server/database/swaz.db

# Run SQL queries:
SELECT * FROM users;
SELECT * FROM refresh_tokens;
.exit
```

### Reset Database:

```bash
rm server/database/swaz.db
# Database will be recreated on next server start
```

---

## Integration with Existing Code

### Add Authentication to Your Components

```typescript
import { useAuth } from './contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please login</div>;
  }

  return (
    <div>
      <p>Welcome, {user.displayName}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protect Routes

```typescript
import { ProtectedRoute } from './components/auth/ProtectedRoute';

<ProtectedRoute>
  <Studio />
</ProtectedRoute>
```

### Show Auth Modal

```typescript
import { AuthModal } from './components/auth/AuthModal';
import { useState } from 'react';

function App() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <button onClick={() => setShowAuth(true)}>Login</button>
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)}
        defaultTab="login"
      />
    </>
  );
}
```

---

## API Endpoints

All endpoints are prefixed with `/api/auth`:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Create new account |
| POST | `/login` | Login with email/password |
| GET | `/google` | Initiate Google OAuth flow |
| GET | `/google/callback` | OAuth callback (automatic) |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Logout and revoke tokens |
| GET | `/me` | Get current user info |

### Example API Usage:

```typescript
import { authAPI } from './services/api/auth.api';

// Register
const user = await authAPI.register({
  email: 'test@example.com',
  password: 'Test123$',
  displayName: 'Test User'
});

// Login
const user = await authAPI.login({
  email: 'test@example.com',
  password: 'Test123$'
});

// Get current user
const user = await authAPI.getCurrentUser();

// Logout
await authAPI.logout();
```

---

## Security Features

✅ **Password Hashing**: bcrypt with 10 salt rounds  
✅ **JWT Tokens**: Signed with secure secrets  
✅ **httpOnly Cookies**: Prevents XSS attacks  
✅ **CORS Protection**: Only allows frontend origin  
✅ **Helmet.js**: Security headers  
✅ **SQL Injection Protection**: Parameterized queries  
✅ **Token Refresh Rotation**: Old refresh tokens are invalidated  
✅ **Password Requirements**: Min 8 chars, uppercase, lowercase, number  

---

## Troubleshooting

### Backend Won't Start

**Error**: `Cannot find module 'express'`
- **Solution**: Run `cd server && npm install`

**Error**: `JWT_ACCESS_SECRET is not defined`
- **Solution**: Check `server/.env` exists and has JWT secrets

### Google OAuth Not Working

**Error**: Redirect mismatch
- **Solution**: Add `http://localhost:3001/api/auth/google/callback` to Google Console authorized redirect URIs

**Error**: Google OAuth returns to error page
- **Solution**: Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `server/.env`

### Frontend API Errors

**Error**: `Cannot connect to localhost:3001`
- **Solution**: Make sure backend server is running (`npm run dev:server` or `npm run dev:all`)

**Error**: CORS error
- **Solution**: Check `FRONTEND_URL` in `server/.env` matches your frontend URL

### Database Issues

**Error**: Database locked
- **Solution**: Close any other processes using the database, or restart the server

**Error**: Migration failed
- **Solution**: Delete `server/database/swaz.db` and restart server

---

## Production Deployment

### Environment Variables

Update `server/.env` for production:

```env
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
COOKIE_SECURE=true
COOKIE_DOMAIN=your-domain.com
PORT=3001
```

### Build for Production

```bash
# Build frontend
npm run build

# Build backend
npm run build:server

# Start backend
cd server && npm start
```

### Database Backup

```bash
# Backup database
cp server/database/swaz.db server/database/swaz.db.backup

# Restore database
cp server/database/swaz.db.backup server/database/swaz.db
```

---

## Support

For issues or questions:
1. Check this documentation
2. Review the implementation plan at `/.gemini/antigravity/brain/.../implementation_plan.md`
3. Review backend logs (server console output)
4. Check database contents with sqlite3

---

**Made with ❤️ for SWAZ eLyrics Studio**
