import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api/auth.api';
import type { User, LoginCredentials, RegisterData } from '../types/auth';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    loginWithGoogle: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const userData = await authAPI.getCurrentUser();
            setUser(userData);
        } catch (error) {
            setUser(null);
        }
    }, []);

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userData = await authAPI.getCurrentUser();
                setUser(userData);
            } catch {
                // Not authenticated
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const userData = await authAPI.login(credentials);
        setUser(userData);
    };

    const register = async (data: RegisterData) => {
        const userData = await authAPI.register(data);
        setUser(userData);
    };

    const logout = async () => {
        await authAPI.logout();
        setUser(null);
    };

    const loginWithGoogle = () => {
        authAPI.loginWithGoogle();
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                register,
                logout,
                loginWithGoogle,
                refreshUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
