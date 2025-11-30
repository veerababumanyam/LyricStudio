import { getDatabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import type { User, CreateUserData, UpdateUserData, UserResponse } from '../../types/models.js';

export class UserRepository {
    static createUser(userData: CreateUserData): User {
        const db = getDatabase();
        const now = Date.now();
        const id = uuidv4();

        const stmt = db.prepare(`
      INSERT INTO users (
        id, email, phone_number, password_hash, display_name, avatar_url,
        auth_provider, google_id, email_verified, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

        stmt.run(
            id,
            userData.email,
            userData.phone_number || null,
            userData.password_hash || null,
            userData.display_name,
            userData.avatar_url || null,
            userData.auth_provider,
            userData.google_id || null,
            userData.email_verified || 0,
            now,
            now
        );

        return this.findById(id)!;
    }

    static findByEmail(email: string): User | null {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email) as User | null;
    }

    static findById(id: string): User | null {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
        return stmt.get(id) as User | null;
    }

    static findByGoogleId(googleId: string): User | null {
        const db = getDatabase();
        const stmt = db.prepare('SELECT * FROM users WHERE google_id = ?');
        return stmt.get(googleId) as User | null;
    }

    static updateUser(id: string, updates: UpdateUserData): User | null {
        const db = getDatabase();
        const now = Date.now();

        const fields: string[] = [];
        const values: any[] = [];

        if (updates.display_name !== undefined) {
            fields.push('display_name = ?');
            values.push(updates.display_name);
        }
        if (updates.avatar_url !== undefined) {
            fields.push('avatar_url = ?');
            values.push(updates.avatar_url);
        }
        if (updates.email_verified !== undefined) {
            fields.push('email_verified = ?');
            values.push(updates.email_verified);
        }
        if (updates.last_login !== undefined) {
            fields.push('last_login = ?');
            values.push(updates.last_login);
        }

        fields.push('updated_at = ?');
        values.push(now);
        values.push(id);

        if (fields.length === 1) {
            return this.findById(id);
        }

        const stmt = db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `);

        stmt.run(...values);
        return this.findById(id);
    }

    static updateLastLogin(id: string): void {
        const db = getDatabase();
        const stmt = db.prepare('UPDATE users SET last_login = ? WHERE id = ?');
        stmt.run(Date.now(), id);
    }

    static deleteUser(id: string): void {
        const db = getDatabase();
        const stmt = db.prepare('DELETE FROM users WHERE id = ?');
        stmt.run(id);
    }

    static toResponse(user: User): UserResponse {
        return {
            id: user.id,
            email: user.email,
            displayName: user.display_name,
            avatarUrl: user.avatar_url,
            authProvider: user.auth_provider,
            emailVerified: user.email_verified === 1,
            createdAt: user.created_at,
            lastLogin: user.last_login
        };
    }
}
