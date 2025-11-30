import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GoogleOAuthButton } from './GoogleOAuthButton';
import { Mail, Lock, User, AlertCircle, CheckCircle2, X } from 'lucide-react';
import type { AuthError } from '../../types/auth';

export function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
    const { register, loginWithGoogle } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        displayName: ''
    });
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const passwordRequirements = [
        { label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
        { label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
        { label: 'One lowercase letter', test: (pw: string) => /[a-z]/.test(pw) },
        { label: 'One number', test: (pw: string) => /[0-9]/.test(pw) }
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setFieldErrors({});

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setFieldErrors({ confirmPassword: 'Passwords do not match' });
            return;
        }

        setIsLoading(true);

        try {
            await register({
                email: formData.email,
                phoneNumber: formData.phoneNumber || undefined,
                password: formData.password,
                displayName: formData.displayName
            });
        } catch (err: any) {
            const authError = err.response?.data as AuthError;

            if (authError?.details) {
                const errors: Record<string, string> = {};
                authError.details.forEach(detail => {
                    errors[detail.field] = detail.message;
                });
                setFieldErrors(errors);
            } else {
                setError(authError?.error || 'Registration failed. Please try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md space-y-6">
            <div className="text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Create Account
                </h2>
                <p className="mt-2 text-gray-600">Join SWAZ eLyrics Studio today</p>
            </div>

            <GoogleOAuthButton onClick={loginWithGoogle} text="Sign up with Google" />

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Or sign up with email</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in slide-in-from-top">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                        Display Name
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="displayName"
                            type="text"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            required
                            minLength={2}
                            maxLength={50}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none ${fieldErrors.displayName ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="Your name"
                        />
                    </div>
                    {fieldErrors.displayName && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                            <X className="w-3 h-3" /> {fieldErrors.displayName}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none ${fieldErrors.email ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="you@example.com"
                        />
                    </div>
                    {fieldErrors.email && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                            <X className="w-3 h-3" /> {fieldErrors.email}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                        Phone Number (Optional)
                    </label>
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <input
                            id="phoneNumber"
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none ${fieldErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="+1234567890"
                        />
                    </div>
                    {fieldErrors.phoneNumber && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                            <X className="w-3 h-3" /> {fieldErrors.phoneNumber}
                        </p>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none ${fieldErrors.password ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="••••••••"
                        />
                    </div>

                    {formData.password && (
                        <div className="mt-2 space-y-1">
                            {passwordRequirements.map((req, idx) => {
                                const passed = req.test(formData.password);
                                return (
                                    <div key={idx} className={`flex items-center gap-2 text-sm ${passed ? 'text-green-600' : 'text-gray-500'}`}>
                                        {passed ? <CheckCircle2 className="w-3 h-3" /> : <X className="w-3 h-3" />}
                                        <span>{req.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            id="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all outline-none ${fieldErrors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                                }`}
                            placeholder="••••••••"
                        />
                    </div>
                    {fieldErrors.confirmPassword && (
                        <p className="text-sm text-red-600 flex items-center gap-1">
                            <X className="w-3 h-3" /> {fieldErrors.confirmPassword}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 focus:ring-4 focus:ring-purple-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Creating account...
                        </span>
                    ) : (
                        'Create Account'
                    )}
                </button>
            </form>

            <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button
                    onClick={onSwitchToLogin}
                    className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                >
                    Sign in
                </button>
            </p>
        </div>
    );
}
