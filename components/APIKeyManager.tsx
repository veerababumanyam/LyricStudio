/**
 * API Key Manager Component
 * 
 * Allows users to safely configure their Google Gemini API key
 * with validation and security warnings
 */

import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, XCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { secureStorage } from '../utils/secure-storage';
import { validateApiKey } from '../utils/validation';
import { GoogleGenAI } from '@google/genai';

export const APIKeyManager: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
    const [apiKey, setApiKey] = useState('');
    const [existingKey, setExistingKey] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{
        isValid: boolean;
        message: string;
    } | null>(null);

    useEffect(() => {
        checkExistingKey();
    }, []);

    const checkExistingKey = async () => {
        const key = await secureStorage.getItem<string>('user_api_key');
        if (key) {
            setExistingKey('•'.repeat(20) + key.slice(-4)); // Show last 4 chars
        }
    };

    const handleValidate = async () => {
        setIsValidating(true);
        setValidationResult(null);

        try {
            // 1. Format validation
            const validation = validateApiKey(apiKey);
            if (!validation.isValid) {
                setValidationResult({
                    isValid: false,
                    message: validation.error || 'Invalid API key format'
                });
                return;
            }

            // 2. Test API call
            const testModel = import.meta.env.VITE_GOOGLE_GENAI_MODEL || 'gemini-2.0-flash-exp';
            const ai = new GoogleGenAI({ apiKey: validation.sanitized! });
            await ai.models.generateContent({
                model: testModel,
                contents: 'Hello',
                config: { maxOutputTokens: 10 }
            });

            setValidationResult({
                isValid: true,
                message: 'API key is valid and working!'
            });

        } catch (error: any) {
            setValidationResult({
                isValid: false,
                message: error.message?.includes('403') || error.message?.includes('API')
                    ? 'API key is invalid or unauthorized'
                    : `Connection failed: ${error.message}`
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleSave = async () => {
        const validation = validateApiKey(apiKey);
        if (!validation.isValid) {
            setValidationResult({ isValid: false, message: validation.error! });
            return;
        }

        await secureStorage.setItem('user_api_key', validation.sanitized!);

        setValidationResult({
            isValid: true,
            message: 'API key saved securely!'
        });

        setTimeout(() => {
            onClose?.();
        }, 1500);
    };

    const handleRemove = async () => {
        if (confirm('Are you sure you want to remove your API key?')) {
            await secureStorage.removeItem('user_api_key');
            setExistingKey(null);
            setApiKey('');
            setValidationResult(null);
        }
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                    <Key className="w-6 h-6 text-red-500" />
                    Google Gemini API Key
                </h2>
                <p className="text-sm text-gray-400 mt-2">
                    SWAZ eLyrics requires your own API key to function. Your key is encrypted and stored locally.
                </p>
            </div>

            {/* Security Warning */}
            <div className="rounded-lg p-4 space-y-2" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)' }}>
                <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2 text-sm">
                        <p className="font-semibold text-red-500">Important Security Information</p>
                        <ul className="list-disc list-inside space-y-1 text-gray-400">
                            <li>Your API key is stored <strong className="text-gray-200">locally in your browser</strong> using encryption</li>
                            <li>It is <strong className="text-gray-200">never sent to SWAZ servers</strong> (we don't have servers!)</li>
                            <li>Keys communicate directly with Google's AI services</li>
                            <li>Free tier includes generous quota, but monitor usage</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Get API Key Link */}
            <div className="rounded-lg p-4" style={{ backgroundColor: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                <p className="text-sm mb-3 text-gray-300">Don't have an API key yet?</p>
                <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
                >
                    Get Free API Key from Google
                    <ExternalLink className="w-4 h-4" />
                </a>
            </div>

            {/* Existing Key Status */}
            {existingKey && (
                <div className="flex items-center justify-between p-3 bg-success/10 border border-success/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-success" />
                        <span className="text-sm">
                            Current key: <code className="text-xs">{existingKey}</code>
                        </span>
                    </div>
                    <button
                        onClick={handleRemove}
                        className="text-sm text-destructive hover:underline"
                    >
                        Remove
                    </button>
                </div>
            )}

            {/* API Key Input */}
            <div className="space-y-3">
                <label className="block">
                    <span className="text-sm font-medium text-white">API Key</span>
                    <input
                        type="password"
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            setValidationResult(null);
                        }}
                        placeholder="AIza..."
                        className="mt-1 w-full px-4 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                        style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A', borderColor: 'rgba(255, 255, 255, 0.2)' }}
                    />
                </label>

                <div className="flex gap-2">
                    <button
                        onClick={handleValidate}
                        disabled={!apiKey || isValidating}
                        className="flex-1 px-4 py-2 border-2 border-red-500 text-red-500 rounded-md hover:bg-red-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        {isValidating ? 'Testing...' : 'Test API Key'}
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={!apiKey || (validationResult && !validationResult.isValid)}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                    >
                        Save Securely
                    </button>
                </div>
            </div>

            {/* Validation Result */}
            {validationResult && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${validationResult.isValid
                    ? 'bg-success/10 border border-success/30'
                    : 'bg-destructive/10 border border-destructive/30'
                    }`}>
                    {validationResult.isValid ? (
                        <CheckCircle className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                    ) : (
                        <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    <p className={`text-sm ${validationResult.isValid ? 'text-success' : 'text-destructive'
                        }`}>
                        {validationResult.message}
                    </p>
                </div>
            )}

            {/* Help Text */}
            <div className="text-xs text-gray-400 space-y-1">
                <p><strong className="text-gray-300">Tip:</strong> The free tier includes:</p>
                <ul className="list-disc list-inside pl-2 space-y-0.5">
                    <li>15 requests per minute</li>
                    <li>1 million tokens per day</li>
                    <li>Enough for ~100 song generations daily</li>
                </ul>
            </div>
        </div>
    );
};
