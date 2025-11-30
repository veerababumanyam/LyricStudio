export interface User {
    id: string;
    email: string;
    phone_number?: string;
    password_hash?: string;
    display_name: string;
    avatar_url?: string;
    auth_provider: 'local' | 'google';
    google_id?: string;
    email_verified: number;
    created_at: number;
    updated_at: number;
    last_login?: number;
}

export interface RefreshToken {
    id: string;
    user_id: string;
    token_hash: string;
    expires_at: number;
    created_at: number;
}

export interface UserPreferences {
    user_id: string;
    api_key_encrypted?: string;
    language_primary?: string;
    language_secondary?: string;
    preferences_json?: string;
}

export interface CreateUserData {
    email: string;
    phone_number?: string;
    password_hash?: string;
    display_name: string;
    avatar_url?: string;
    auth_provider: 'local' | 'google';
    google_id?: string;
    email_verified?: number;
}

export interface UpdateUserData {
    display_name?: string;
    avatar_url?: string;
    email_verified?: number;
    last_login?: number;
}

export interface UserResponse {
    id: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
    authProvider: 'local' | 'google';
    emailVerified: boolean;
    createdAt: number;
    lastLogin?: number;
}

export interface JWTPayload {
    userId: string;
    email: string;
}
