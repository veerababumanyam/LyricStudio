import { getDatabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  language_profile: string; // JSON string
  generation_settings: string; // JSON string
  created_at: number;
  updated_at: number;
}

export interface CreateProfileData {
  name: string;
  language_profile: object;
  generation_settings: object;
}

export interface UpdateProfileData {
  name?: string;
  language_profile?: object;
  generation_settings?: object;
}

export class ProfilesRepository {
  static findById(id: string, userId: string): UserProfile | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM user_profiles WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as UserProfile | null;
  }

  static findAllByUserId(userId: string): UserProfile[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM user_profiles WHERE user_id = ? ORDER BY created_at DESC');
    return stmt.all(userId) as UserProfile[];
  }

  static create(userId: string, data: CreateProfileData): UserProfile {
    const db = getDatabase();
    const now = Date.now();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO user_profiles (
        id, user_id, name, language_profile, generation_settings,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      data.name,
      JSON.stringify(data.language_profile),
      JSON.stringify(data.generation_settings),
      now,
      now
    );

    return this.findById(id, userId)!;
  }

  static update(id: string, userId: string, data: UpdateProfileData): UserProfile | null {
    const db = getDatabase();
    const existing = this.findById(id, userId);
    
    if (!existing) {
      return null;
    }

    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (data.name !== undefined) {
      updateFields.push('name = ?');
      updateValues.push(data.name);
    }
    if (data.language_profile !== undefined) {
      updateFields.push('language_profile = ?');
      updateValues.push(JSON.stringify(data.language_profile));
    }
    if (data.generation_settings !== undefined) {
      updateFields.push('generation_settings = ?');
      updateValues.push(JSON.stringify(data.generation_settings));
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = ?');
      updateValues.push(Date.now());
      updateValues.push(id);
      updateValues.push(userId);

      const stmt = db.prepare(`
        UPDATE user_profiles 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND user_id = ?
      `);
      stmt.run(...updateValues);
    }

    return this.findById(id, userId);
  }

  static delete(id: string, userId: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM user_profiles WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  static deleteAllByUserId(userId: string): number {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM user_profiles WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  }
}
