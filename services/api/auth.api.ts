import axios, { AxiosInstance } from 'axios';
import type { User, AuthResponse, LoginCredentials, RegisterData } from '../../types/auth';

class AuthAPI {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: '/api/auth',
            withCredentials: true,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Response interceptor for handling token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If token expired and we haven't tried refreshing yet
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;

                    try {
                        await this.refreshToken();
                        return this.client(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed, redirect to login
                        window.location.href = '/?login=required';
                        return Promise.reject(refreshError);
                    }
                }

                return Promise.reject(error);
            }
        );
    }

    async register(data: RegisterData): Promise<User> {
        const response = await this.client.post<AuthResponse>('/register', data);
        return response.data.user;
    }

    async login(credentials: LoginCredentials): Promise<User> {
        const response = await this.client.post<AuthResponse>('/login', credentials);
        return response.data.user;
    }

    async logout(): Promise<void> {
        await this.client.post('/logout');
    }

    async getCurrentUser(): Promise<User> {
        const response = await this.client.get<AuthResponse>('/me');
        return response.data.user;
    }

    async refreshToken(): Promise<User> {
        const response = await this.client.post<AuthResponse>('/refresh');
        return response.data.user;
    }

    loginWithGoogle(): void {
        window.location.href = '/api/auth/google';
    }
}

export const authAPI = new AuthAPI();
