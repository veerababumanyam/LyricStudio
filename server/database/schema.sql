-- Users table with support for both local and OAuth authentication
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT,
  password_hash TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  auth_provider TEXT NOT NULL CHECK(auth_provider IN ('local', 'google')),
  google_id TEXT UNIQUE,
  email_verified INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  last_login INTEGER
);

-- Refresh tokens for session management
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User preferences (migrated from localStorage)
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  api_key_encrypted TEXT,
  language_primary TEXT,
  language_secondary TEXT,
  font_size INTEGER DEFAULT 16,
  theme_id TEXT DEFAULT 'default',
  custom_themes TEXT, -- JSON array of custom themes
  selected_model TEXT,
  context_selection TEXT, -- JSON object {contextId, subContextId}
  context_order TEXT, -- JSON array of context IDs
  preferences_json TEXT, -- Additional preferences as JSON
  created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Saved songs library (migrated from localStorage)
CREATE TABLE IF NOT EXISTS saved_songs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  suno_content TEXT,
  suno_style_prompt TEXT,
  language TEXT,
  theme TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User profiles for lyric generation (migrated from localStorage)
CREATE TABLE IF NOT EXISTS user_profiles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  language_profile TEXT NOT NULL, -- JSON object for LanguageProfile
  generation_settings TEXT NOT NULL, -- JSON object for GenerationSettings
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Custom contexts (migrated from localStorage)
CREATE TABLE IF NOT EXISTS custom_contexts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  sub_contexts TEXT NOT NULL, -- JSON array of SubContext objects
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_saved_songs_user_id ON saved_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_songs_created_at ON saved_songs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_contexts_user_id ON custom_contexts(user_id);
