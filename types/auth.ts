export interface User {
    id: string;
    email: string;
    phoneNumber?: string;
    displayName: string;
    avatarUrl?: string;
    authProvider: 'local' | 'google';
    emailVerified: boolean;
    createdAt: number;
    lastLogin?: number;
}

export interface AuthResponse {
    user: User;
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    email: string;
    phoneNumber?: string;
    password: string;
    displayName: string;
}

export interface AuthError {
    error: string;
    details?: Array<{ field: string; message: string }>;
    hint?: string;
}
