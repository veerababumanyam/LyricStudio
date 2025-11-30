import { getDatabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import type { RefreshToken } from '../../types/models.js';

export class TokenRepository {
    static createRefreshToken(userId: string, tokenHash: string, expiresAt: number): RefreshToken {
        const db = getDatabase();
        const id = uuidv4();
        const now = Date.now();

        const stmt = db.prepare(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

        stmt.run(id, userId, tokenHash, expiresAt, now);

        return {
            id,
            user_id: userId,
            token_hash: tokenHash,
            expires_at: expiresAt,
            created_at: now
        };
    }

    static findByTokenHash(tokenHash: string): RefreshToken | null {
        const db = getDatabase();
        const stmt = db.prepare(`
      SELECT * FROM refresh_tokens 
      WHERE token_hash = ? AND expires_at > ?
    `);
        return stmt.get(tokenHash, Date.now()) as RefreshToken | null;
    }

    static deleteToken(id: string): void {
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM refresh_tokens WHERE id = ?');
        stmt.run(id);
    }

    static deleteUserTokens(userId: string): void {
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?');
        stmt.run(userId);
    }

    static cleanExpiredTokens(): void {
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM refresh_tokens WHERE expires_at <= ?');
        const result = stmt.run(Date.now());
        if (result.changes > 0) {
            console.log(`🧹 Cleaned ${result.changes} expired tokens`);
        }
    }
}

// Run cleanup every hour
setInterval(() => {
    TokenRepository.cleanExpiredTokens();
}, 60 * 60 * 1000);
