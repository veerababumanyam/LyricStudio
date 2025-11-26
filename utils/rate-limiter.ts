/**
 * Rate Limiter Utility
 * 
 * Implements client-side rate limiting to prevent quota exhaustion
 * and provide better UX feedback when limits are reached.
 */

export interface RateLimitConfig {
    maxRequests: number;
    windowMs: number;
    burstAllowance?: number; // Allow bursts up to this many requests
}

export class RateLimiter {
    private requestTimestamps: number[] = [];
    private config: RateLimitConfig;

    constructor(config: RateLimitConfig) {
        this.config = {
            burstAllowance: config.maxRequests,
            ...config
        };
    }

    /**
     * Check if a request can be made
     */
    canMakeRequest(): boolean {
        const now = Date.now();

        // Remove timestamps outside the current window
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < this.config.windowMs
        );

        return this.requestTimestamps.length < this.config.maxRequests;
    }

    /**
     * Record a request (call after successful API call)
     */
    recordRequest(): void {
        this.requestTimestamps.push(Date.now());
    }

    /**
     * Get remaining requests in current window
     */
    getRemainingRequests(): number {
        const now = Date.now();
        this.requestTimestamps = this.requestTimestamps.filter(
            timestamp => now - timestamp < this.config.windowMs
        );

        return Math.max(0, this.config.maxRequests - this.requestTimestamps.length);
    }

    /**
     * Get time until next request is available (in ms)
     */
    getTimeUntilReset(): number {
        if (this.canMakeRequest()) return 0;

        const now = Date.now();
        const oldestTimestamp = this.requestTimestamps[0];

        if (!oldestTimestamp) return 0;

        return Math.max(0, this.config.windowMs - (now - oldestTimestamp));
    }

    /**
     * Reset the rate limiter
     */
    reset(): void {
        this.requestTimestamps = [];
    }

    /**
     * Get rate limiting status
     */
    getStatus(): {
        canRequest: boolean;
        remaining: number;
        resetIn: number;
        isNearLimit: boolean;
    } {
        const remaining = this.getRemainingRequests();
        const resetIn = this.getTimeUntilReset();

        return {
            canRequest: this.canMakeRequest(),
            remaining,
            resetIn,
            isNearLimit: remaining <= (this.config.maxRequests * 0.2) // < 20% remaining
        };
    }
}

// Agent-specific rate limiters
export const rateLimiters = {
    // Most agents: 10 requests per minute
    default: new RateLimiter({ maxRequests: 10, windowMs: 60 * 1000 }),

    // Chat agent: Higher limit for conversational flow
    chat: new RateLimiter({ maxRequests: 20, windowMs: 60 * 1000 }),

    // Heavy agents: Lower limits
    lyricist: new RateLimiter({ maxRequests: 5, windowMs: 60 * 1000 }),
    art: new RateLimiter({ maxRequests: 3, windowMs: 60 * 1000 }),

    // Research: Medium limit
    research: new RateLimiter({ maxRequests: 8, windowMs: 60 * 1000 })
};

/**
 * Check rate limit before making request
 * Throws error if limit exceeded
 */
export const checkRateLimit = (agentType: keyof typeof rateLimiters = 'default'): void => {
    const limiter = rateLimiters[agentType] || rateLimiters.default;
    const status = limiter.getStatus();

    if (!status.canRequest) {
        const seconds = Math.ceil(status.resetIn / 1000);
        throw new Error(
            `Rate limit exceeded. Please wait ${seconds} seconds before making another request.`
        );
    }

    // Warn if near limit
    if (status.isNearLimit) {
        console.warn(
            `Approaching rate limit: ${status.remaining} requests remaining. ` +
            `Resets in ${Math.ceil(status.resetIn / 1000)}s`
        );
    }
};

/**
 * Record successful request
 */
export const recordRequest = (agentType: keyof typeof rateLimiters = 'default'): void => {
    const limiter = rateLimiters[agentType] || rateLimiters.default;
    limiter.recordRequest();
};

/**
 * Get status for all rate limiters (for UI display)
 */
export const getAllRateLimitStatus = () => {
    return Object.entries(rateLimiters).reduce((acc, [key, limiter]) => {
        acc[key] = limiter.getStatus();
        return acc;
    }, {} as Record<string, ReturnType<RateLimiter['getStatus']>>);
};
