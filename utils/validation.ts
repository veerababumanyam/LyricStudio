import { GeminiError } from "../utils";

/**
 * Input Validator
 * 
 * Provides comprehensive input validation and sanitization
 * to prevent prompt injection and other security issues.
 */

export interface ValidationResult {
    isValid: boolean;
    sanitized?: string;
    error?: string;
    warnings?: string[];
}

/**
 * Dangerous keywords that might indicate prompt injection
 */
const DANGEROUS_KEYWORDS = [
    'ignore previous instructions',
    'ignore above',
    'disregard',
    'forget everything',
    'new instructions',
    'system prompt',
    'reset instructions',
    'override instructions',
    'system:',
    'admin:',
    'sudo',
    'execute:',
    'eval(',
    'function(',
    '<script',
    'javascript:',
    'onerror=',
    'onload='
];

/**
 * Validate and sanitize user input for AI requests
 */
export const sanitizeUserInput = (input: string): ValidationResult => {
    const warnings: string[] = [];

    // 1. Basic validation
    if (!input || typeof input !== 'string') {
        return {
            isValid: false,
            error: 'Input must be a non-empty string'
        };
    }

    // 2. Length validation
    const MAX_LENGTH = 2000;
    if (input.length > MAX_LENGTH) {
        return {
            isValid: false,
            error: `Input is too long. Maximum ${MAX_LENGTH} characters allowed (current: ${input.length})`
        };
    }

    // 3. Minimum length
    const MIN_LENGTH = 3;
    if (input.trim().length < MIN_LENGTH) {
        return {
            isValid: false,
            error: `Input is too short. Minimum ${MIN_LENGTH} characters required`
        };
    }

    // 4. Check for dangerous keywords (case-insensitive)
    const lowerInput = input.toLowerCase();
    const foundDangerousKeywords = DANGEROUS_KEYWORDS.filter(keyword =>
        lowerInput.includes(keyword.toLowerCase())
    );

    if (foundDangerousKeywords.length > 0) {
        return {
            isValid: false,
            error: `Input contains suspicious patterns that may indicate a security issue. ` +
                `Please rephrase your request.`
        };
    }

    // 5. Check for excessive special characters (potential injection)
    const specialCharCount = (input.match(/[{}[\]<>\\\/;`$]/g) || []).length;
    const specialCharRatio = specialCharCount / input.length;

    if (specialCharRatio > 0.15) {
        warnings.push('Input contains many special characters');
    }

    // 6. Check for repeated characters (potential spam)
    const hasExcessiveRepetition = /(.)\1{20,}/.test(input);
    if (hasExcessiveRepetition) {
        return {
            isValid: false,
            error: 'Input contains excessive character repetition'
        };
    }

    // 7. Sanitize for JSON embedding
    let sanitized = input
        .replace(/\\/g, '\\\\')  // Escape backslashes
        .replace(/"/g, '\\"')    // Escape quotes
        .replace(/\n/g, '\\n')   // Preserve newlines
        .replace(/\r/g, '\\r')   // Preserve carriage returns
        .replace(/\t/g, '\\t');  // Preserve tabs

    // 8. Remove null bytes and control characters (except newlines/tabs)
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    return {
        isValid: true,
        sanitized,
        warnings: warnings.length > 0 ? warnings : undefined
    };
};

/**
 * Validate API key format
 */
export const validateApiKey = (key: string): ValidationResult => {
    if (!key || typeof key !== 'string') {
        return {
            isValid: false,
            error: 'API key is required'
        };
    }

    // Trim whitespace
    const trimmed = key.trim();

    // Google API keys typically start with "AIza" and are 39 characters
    if (!trimmed.startsWith('AIza')) {
        return {
            isValid: false,
            error: 'Invalid API key format. Google Gemini keys should start with "AIza"'
        };
    }

    if (trimmed.length < 30) {
        return {
            isValid: false,
            error: 'API key is too short'
        };
    }

    return {
        isValid: true,
        sanitized: trimmed
    };
};

/**
 * Sanitize filename for saved songs
 */
export const sanitizeFilename = (filename: string): string => {
    return filename
        .replace(/[^a-zA-Z0-9\s\-_]/g, '') // Remove special chars
        .replace(/\s+/g, '_')               // Spaces to underscores
        .substring(0, 100)                  // Max 100 chars
        .trim();
};

/**
 * Validate generation settings to prevent injection via config
 */
export const validateGenerationSettings = (settings: any): ValidationResult => {
    const warnings: string[] = [];

    // Check all string fields
    const stringFields = [
        'category', 'ceremony', 'theme', 'customTheme',
        'mood', 'customMood', 'style', 'customStyle',
        'rhymeScheme', 'customRhymeScheme', 'singerConfig'
    ];

    for (const field of stringFields) {
        if (settings[field] && typeof settings[field] === 'string') {
            if (settings[field].length > 100) {
                warnings.push(`${field} is very long (${settings[field].length} chars)`);
            }

            // Check for injection patterns in custom fields
            if (field.startsWith('custom')) {
                const result = sanitizeUserInput(settings[field]);
                if (!result.isValid) {
                    return {
                        isValid: false,
                        error: `Invalid ${field}: ${result.error}`
                    };
                }
            }
        }
    }

    return {
        isValid: true,
        warnings: warnings.length > 0 ? warnings : undefined
    };
};

/**
 * Create a safe error message for display
 * Removes any sensitive information
 */
export const sanitizeErrorMessage = (error: any): string => {
    const message = error?.message || String(error || 'Unknown error');

    // Remove potential API keys or tokens
    const sanitized = message
        .replace(/AIza[a-zA-Z0-9_-]{35}/g, 'API_KEY_REDACTED')
        .replace(/Bearer\s+[a-zA-Z0-9_-]+/g, 'TOKEN_REDACTED')
        .replace(/[a-f0-9]{32,}/g, 'HASH_REDACTED');

    return sanitized;
};

/**
 * Comprehensive input validation for agent calls
 */
export const validateAgentInput = (input: string): void => {
    const result = sanitizeUserInput(input);

    if (!result.isValid) {
        throw new GeminiError(
            result.error || 'Invalid input',
            'PARSING'
        );
    }

    if (result.warnings && result.warnings.length > 0) {
        console.warn('Input validation warnings:', result.warnings);
    }
};
