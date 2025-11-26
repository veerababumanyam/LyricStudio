/**
 * Quota Tracker Component
 * 
 * Displays real-time API usage and rate limit status
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, Clock, Zap } from 'lucide-react';
import { getAllRateLimitStatus } from '../utils/rate-limiter';

export const QuotaTracker: React.FC = () => {
    const [status, setStatus] = useState(getAllRateLimitStatus());
    const [visible, setVisible] = useState(false);

    // Update status every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const newStatus = getAllRateLimitStatus();
            setStatus(newStatus);

            // Show if any limit is near capacity
            const anyNearLimit = Object.values(newStatus).some(s => s.isNearLimit);
            setVisible(anyNearLimit);
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    if (!visible && Object.values(status).every(s => s.remaining === s.canRequest)) {
        return null; // Don't show if no activity
    }

    const activeAgents = Object.entries(status).filter(([_, s]) => s.remaining < 10);

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
            <div className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        <h3 className="text-sm font-semibold">API Usage</h3>
                    </div>
                    <button
                        onClick={() => setVisible(false)}
                        className="text-muted hover:text-foreground"
                    >
                        ×
                    </button>
                </div>

                {activeAgents.length === 0 ? (
                    <p className="text-xs text-muted">All clear - quotas normal</p>
                ) : (
                    <div className="space-y-2">
                        {activeAgents.slice(0, 3).map(([agent, agentStatus]) => (
                            <div key={agent} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="capitalize text-secondary">{agent}</span>
                                    <span className={`font-medium ${agentStatus.isNearLimit ? 'text-destructive' : 'text-muted'
                                        }`}>
                                        {agentStatus.remaining} left
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${agentStatus.isNearLimit ? 'bg-destructive' : 'bg-primary'
                                            }`}
                                        style={{
                                            width: `${(agentStatus.remaining / 10) * 100}%`
                                        }}
                                    />
                                </div>

                                {!agentStatus.canRequest && agentStatus.resetIn > 0 && (
                                    <div className="flex items-center gap-1 text-xs text-muted">
                                        <Clock className="w-3 h-3" />
                                        <span>
                                            Resets in {Math.ceil(agentStatus.resetIn / 1000)}s
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {Object.values(status).some(s => !s.canRequest) && (
                    <div className="flex items-start gap-2 p-2 bg-destructive/10 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-destructive">
                            Rate limit reached. This prevents quota exhaustion and keeps costs low.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
