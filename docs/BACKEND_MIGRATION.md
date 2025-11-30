# Backend Migration Guide

This document describes the migration of user data from localStorage to the backend database.

## Overview

All user-related data has been migrated from client-side localStorage to a secure backend database with the following benefits:

- ✅ **Multi-device sync** - Access your data from any device
- ✅ **Secure storage** - API keys encrypted server-side with AES-256-GCM
- ✅ **Data persistence** - No data loss when clearing browser cache
- ✅ **Backup & recovery** - Centralized data management
- ✅ **Offline support** - Cached locally for offline access

## What Was Migrated

### 1. API Keys
- **Before**: Encrypted in localStorage with device-specific key
- **After**: Encrypted in database with user-specific server key
- **Endpoints**: 
  - `POST /api/preferences/api-key` - Store API key
  - `GET /api/preferences/api-key` - Retrieve API key
  - `DELETE /api/preferences/api-key` - Remove API key

### 2. User Preferences
- **Before**: Stored in `swaz_appearance` localStorage key
- **After**: Stored in `user_preferences` table
- **Data**: 
  - Font size
  - Theme ID
  - Custom themes
  - Selected model
  - Context selection
  - Context order
  - Language preferences
- **Endpoints**: 
  - `GET /api/preferences` - Get all preferences
  - `PUT /api/preferences` - Update preferences

### 3. Saved Songs
- **Before**: Stored in `swaz_saved_songs` localStorage key
- **After**: Stored in `saved_songs` table
- **Endpoints**: 
  - `GET /api/songs` - List all songs (with pagination)
  - `GET /api/songs/:id` - Get specific song
  - `POST /api/songs` - Create new song
  - `PUT /api/songs/:id` - Update song
  - `DELETE /api/songs/:id` - Delete song
  - `POST /api/songs/bulk` - Bulk create (for migration)

### 4. User Profiles
- **Before**: Stored in `geetgatha_profiles` localStorage key
- **After**: Stored in `user_profiles` table
- **Endpoints**: 
  - `GET /api/profiles` - List all profiles
  - `GET /api/profiles/:id` - Get specific profile
  - `POST /api/profiles` - Create new profile
  - `PUT /api/profiles/:id` - Update profile
  - `DELETE /api/profiles/:id` - Delete profile
  - `POST /api/profiles/bulk` - Bulk create (for migration)

### 5. Custom Contexts
- **Before**: Stored in `swaz_custom_contexts` localStorage key
- **After**: Stored in `custom_contexts` table
- **Endpoints**: 
  - `GET /api/contexts` - List all contexts
  - `GET /api/contexts/:id` - Get specific context
  - `POST /api/contexts` - Create new context
  - `PUT /api/contexts/:id` - Update context
  - `DELETE /api/contexts/:id` - Delete context
  - `POST /api/contexts/bulk` - Bulk create (for migration)

## Backend Architecture

### Database Schema

```sql
-- User preferences with appearance and settings
user_preferences (
  user_id, api_key_encrypted, language_primary, language_secondary,
  font_size, theme_id, custom_themes, selected_model,
  context_selection, context_order, preferences_json,
  created_at, updated_at
)

-- Saved songs library
saved_songs (
  id, user_id, title, content, suno_content, suno_style_prompt,
  language, theme, created_at, updated_at
)

-- User profiles for lyric generation
user_profiles (
  id, user_id, name, language_profile, generation_settings,
  created_at, updated_at
)

-- Custom contexts
custom_contexts (
  id, user_id, name, description, icon, sub_contexts,
  created_at, updated_at
)
```

### Security

#### API Key Encryption
- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Master Key**: Stored in `ENCRYPTION_MASTER_KEY` environment variable
- **User Keys**: Derived from master key + user ID
- **Format**: `salt:iv:authTag:ciphertext` (base64 encoded)

#### Authentication
- All endpoints require authentication via JWT tokens
- Access tokens: 15-minute expiry
- Refresh tokens: 7-day expiry, stored hashed in database
- Tokens delivered via httpOnly cookies or Authorization header

## Frontend Integration

### API Clients

```typescript
import { preferencesAPI } from './services/api/preferences.api';
import { songsAPI } from './services/api/songs.api';
import { profilesAPI } from './services/api/profiles.api';
import { contextsAPI } from './services/api/contexts.api';

// Example usage
const preferences = await preferencesAPI.getPreferences();
const songs = await songsAPI.getAllSongs();
const profiles = await profilesAPI.getAllProfiles();
const contexts = await contextsAPI.getAllContexts();
```

### Migration Utility

```typescript
import { 
  checkMigrationStatus, 
  migrateToBackend,
  syncFromBackend 
} from './utils/migrate-to-backend';

// Check if migration is needed
const status = await checkMigrationStatus();

// Perform migration
if (status.needsMigration) {
  const result = await migrateToBackend((progress) => {
    console.log(`${progress.step}: ${progress.percentage}%`);
  });
  
  if (result.success) {
    console.log('Migration complete!');
  } else {
    console.error('Migration errors:', result.errors);
  }
}

// Sync data from backend to localStorage cache
await syncFromBackend();
```

### Migration Modal Component

```typescript
import { MigrationModal } from './components/MigrationModal';

// Show migration modal to user on first login
<MigrationModal 
  isOpen={showMigration}
  onClose={() => setShowMigration(false)}
  onComplete={() => {
    console.log('Migration completed by user');
  }}
/>
```

## Setup Instructions

### Backend Setup

1. **Install dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Set environment variables** in `server/.env`:
   ```env
   ENCRYPTION_MASTER_KEY=<64-char-hex-string>
   ```
   Generate a key with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Initialize database**:
   The schema is automatically created from `server/database/schema.sql` on first run.

4. **Start server**:
   ```bash
   npm run dev
   ```

### Frontend Setup

No additional setup needed. The migration utility and API clients are ready to use.

## Migration Flow

### Automatic Migration

1. User logs in or registers
2. System checks for existing localStorage data via `checkMigrationStatus()`
3. If data exists, show `MigrationModal` to user
4. User chooses to migrate or skip
5. If migrated, data is uploaded to backend via bulk endpoints
6. Migration marked as complete in localStorage

### Manual Migration

Users can trigger migration manually via settings:

```typescript
const result = await migrateToBackend();
if (result.success) {
  alert('Migration successful!');
}
```

## Component Updates

### Components to Update

The following components need to be updated to use backend APIs instead of localStorage:

1. **APIKeyManager.tsx** - Use `preferencesAPI` for API key storage
2. **SettingsModal.tsx** - Use `preferencesAPI` for appearance settings
3. **Studio.tsx** - Use `songsAPI` for saved songs
4. **ContextManager.tsx** - Use `contextsAPI` for custom contexts
5. Profile management (if exists) - Use `profilesAPI`

### Example Update Pattern

**Before** (localStorage):
```typescript
const apiKey = await secureStorage.getItem('user_api_key');
await secureStorage.setItem('user_api_key', newKey);
```

**After** (backend API):
```typescript
const apiKey = await preferencesAPI.getApiKey();
await preferencesAPI.setApiKey(newKey);
```

## Offline Support

Data is cached in localStorage for offline access:

1. **Read pattern**: Try backend first, fallback to localStorage cache
2. **Write pattern**: Write to backend, update localStorage cache on success
3. **Sync on reconnect**: Call `syncFromBackend()` when connection restored

## Testing

### Backend Tests

```bash
cd server
npm test
```

### Frontend Migration Test

```typescript
// Test migration
import { checkMigrationStatus, migrateToBackend } from './utils/migrate-to-backend';

const status = await checkMigrationStatus();
console.log('Migration status:', status);

if (status.needsMigration) {
  const result = await migrateToBackend();
  console.log('Migration result:', result);
}
```

## Rollback Plan

If issues occur, users can still access localStorage data:

1. The migration does NOT delete localStorage data by default
2. Call `clearLocalStorageAfterMigration()` only after confirming success
3. Users can re-trigger migration if needed
4. Backend data can be exported and re-imported

## Security Considerations

1. **Never log API keys** - Encrypted at rest and in transit
2. **HTTPS required** - Use SSL in production
3. **Master key security** - Store `ENCRYPTION_MASTER_KEY` securely, rotate periodically
4. **Rate limiting** - Implement rate limiting on API endpoints (TODO)
5. **Input validation** - All inputs validated server-side

## Performance

- **Caching**: localStorage used as read-through cache
- **Pagination**: Songs endpoint supports limit/offset
- **Bulk operations**: Dedicated endpoints for migration
- **Indexes**: Database indexes on user_id and created_at fields

## Future Enhancements

- [ ] Add rate limiting middleware
- [ ] Implement conflict resolution for multi-device edits
- [ ] Add data export/import functionality
- [ ] Implement real-time sync with WebSockets
- [ ] Add versioning for preferences schema
- [ ] Implement soft deletes with trash/restore

## Troubleshooting

### Migration fails
- Check network connectivity
- Verify authentication token is valid
- Check browser console for errors
- Review backend logs

### API key decryption fails
- Verify `ENCRYPTION_MASTER_KEY` is set correctly
- Check if key was rotated (old data won't decrypt with new key)
- User may need to re-enter API key

### Data not syncing
- Check if user is authenticated
- Verify backend server is running
- Check CORS configuration
- Review network requests in browser DevTools

## Support

For issues or questions:
1. Check backend logs: `server/logs/`
2. Check browser console for errors
3. Review API responses in Network tab
4. File an issue with reproduction steps
