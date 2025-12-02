# Data Model: Multi-User Authentication

## Entities

### User
Represents a registered user of the application.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `email` | String | Yes | User's email address (Unique) |
| `display_name` | String | Yes | User's full name or display name |
| `password_hash` | String | No | Bcrypt hash (Required for Local auth) |
| `auth_provider` | Enum | Yes | 'local' or 'google' |
| `google_id` | String | No | Google OAuth ID (Required for Google auth) |
| `avatar_url` | String | No | URL to user's profile picture |
| `created_at` | Timestamp | Yes | Account creation time |
| `last_login` | Timestamp | No | Last successful login time |

### RefreshToken
Used for maintaining long-lived sessions.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | UUID | Yes | Unique identifier |
| `user_id` | UUID | Yes | Reference to User |
| `token_hash` | String | Yes | Hashed refresh token |
| `expires_at` | Timestamp | Yes | Expiration time |

## API Contracts

### POST /api/auth/register
Register a new local user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "user": {
    "id": "uuid...",
    "email": "user@example.com",
    "displayName": "John Doe",
    "authProvider": "local"
  }
}
```

### POST /api/auth/login
Authenticate a local user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user": {
    "id": "uuid...",
    "email": "user@example.com",
    "displayName": "John Doe",
    "authProvider": "local"
  }
}
```

### GET /api/auth/google
Initiates Google OAuth flow. Redirects to Google.

### GET /api/auth/me
Get current authenticated user profile.

**Response (200 OK):**
```json
{
  "id": "uuid...",
  "email": "user@example.com",
  "displayName": "John Doe",
  "avatarUrl": "..."
}
```
