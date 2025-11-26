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
     * Record a request attempt (call for both successful and failed API calls)
     * This ensures failed requests also count against rate limits
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

// Global rate limiter to protect the shared API key quota
// Free tier is ~15 RPM. We set it slightly lower to be safe.
export const globalLimiter = new RateLimiter({ maxRequests: 12, windowMs: 60 * 1000 });

// Agent-specific rate limiters
export const rateLimiters = {
    // Most agents: 8 requests per minute
    default: new RateLimiter({ maxRequests: 8, windowMs: 60 * 1000 }),

    // Chat agent: 10 requests per minute
    chat: new RateLimiter({ maxRequests: 10, windowMs: 60 * 1000 }),

    // Heavy agents: Lower limits
    lyricist: new RateLimiter({ maxRequests: 3, windowMs: 60 * 1000 }),
    art: new RateLimiter({ maxRequests: 2, windowMs: 60 * 1000 }),

    // Research: Medium limit
    research: new RateLimiter({ maxRequests: 5, windowMs: 60 * 1000 })
};

/**
 * Check rate limit before making request
 * Throws error if limit exceeded
 */
export const checkRateLimit = (agentType: keyof typeof rateLimiters = 'default'): void => {
    // 1. Check Global Limit first
    const globalStatus = globalLimiter.getStatus();
    
    console.log(`[RATE LIMIT CHECK] Agent: ${agentType}`);
    console.log(`  Global: ${globalStatus.remaining}/${globalLimiter['config'].maxRequests} remaining, resetIn: ${Math.ceil(globalStatus.resetIn / 1000)}s`);
    
    if (!globalStatus.canRequest) {
        const seconds = Math.ceil(globalStatus.resetIn / 1000);
        console.error(`[RATE LIMIT] ❌ BLOCKED - Global limit exceeded! Wait ${seconds}s`);
        console.error(`[RATE LIMIT] Global timestamps:`, globalLimiter['requestTimestamps']);
        throw new Error(
            `System busy (Global Limit). Please wait ${seconds} seconds.`
        );
    }

    // 2. Check Agent Specific Limit
    const limiter = rateLimiters[agentType] || rateLimiters.default;
    const status = limiter.getStatus();
    
    console.log(`  Agent (${agentType}): ${status.remaining}/${limiter['config'].maxRequests} remaining, resetIn: ${Math.ceil(status.resetIn / 1000)}s`);

    if (!status.canRequest) {
        const seconds = Math.ceil(status.resetIn / 1000);
        console.error(`[RATE LIMIT] ❌ BLOCKED - Agent limit exceeded for ${agentType}! Wait ${seconds}s`);
        console.error(`[RATE LIMIT] Agent timestamps:`, limiter['requestTimestamps']);
        throw new Error(
            `Rate limit exceeded for ${agentType}. Please wait ${seconds} seconds.`
        );
    }

    // Warn if near limit
    if (status.isNearLimit || globalStatus.isNearLimit) {
        console.warn(
            `[RATE LIMIT] ⚠️ Approaching limit. Global: ${globalStatus.remaining}, Agent: ${status.remaining}`
        );
    }
};

/**
 * Record request attempt (both successful and failed)
 * Failed requests also consume rate limit quota on the server side
 */
export const recordRequest = (agentType: keyof typeof rateLimiters = 'default'): void => {
    const timestamp = Date.now();
    console.log(`[RATE LIMIT] 📝 Recording request for ${agentType} at ${new Date(timestamp).toISOString()}`);
    
    // Record in global limiter
    globalLimiter.recordRequest();
    
    // Record in agent specific limiter
    const limiter = rateLimiters[agentType] || rateLimiters.default;
    limiter.recordRequest();
    
    const globalStatus = globalLimiter.getStatus();
    const agentStatus = limiter.getStatus();
    console.log(`[RATE LIMIT] After recording - Global: ${globalStatus.remaining} remaining, Agent: ${agentStatus.remaining} remaining`);
};

/**
 * Get status for all rate limiters (for UI display)
 */
export const getAllRateLimitStatus = () => {
    const allStatus = Object.entries(rateLimiters).reduce((acc, [key, limiter]) => {
        acc[key] = limiter.getStatus();
        return acc;
    }, {} as Record<string, ReturnType<RateLimiter['getStatus']>>);
    
    allStatus['global'] = globalLimiter.getStatus();
    return allStatus;
};
