import { getDatabase } from '../db.js';
import type { Database } from 'better-sqlite3';

export interface UserPreferences {
  user_id: string;
  api_key_encrypted: string | null;
  language_primary: string | null;
  language_secondary: string | null;
  font_size: number;
  theme_id: string;
  custom_themes: string | null; // JSON string
  selected_model: string | null;
  context_selection: string | null; // JSON string
  context_order: string | null; // JSON string
  preferences_json: string | null; // JSON string
  created_at: number;
  updated_at: number;
}

export interface UpdatePreferencesData {
  api_key_encrypted?: string | null;
  language_primary?: string | null;
  language_secondary?: string | null;
  font_size?: number;
  theme_id?: string;
  custom_themes?: string | null;
  selected_model?: string | null;
  context_selection?: string | null;
  context_order?: string | null;
  preferences_json?: string | null;
}

export class PreferencesRepository {
  static findByUserId(userId: string): UserPreferences | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?');
    return stmt.get(userId) as UserPreferences | null;
  }

  static createOrUpdate(userId: string, data: UpdatePreferencesData): UserPreferences {
    const db = getDatabase();
    const existing = this.findByUserId(userId);
    const now = Date.now();

    if (existing) {
      // Update existing preferences
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = ?`);
          updateValues.push(value);
        }
      });

      if (updateFields.length > 0) {
        updateFields.push('updated_at = ?');
        updateValues.push(now);
        updateValues.push(userId);

        const stmt = db.prepare(`
          UPDATE user_preferences 
          SET ${updateFields.join(', ')}
          WHERE user_id = ?
        `);
        stmt.run(...updateValues);
      }
    } else {
      // Create new preferences
      const stmt = db.prepare(`
        INSERT INTO user_preferences (
          user_id, api_key_encrypted, language_primary, language_secondary,
          font_size, theme_id, custom_themes, selected_model,
          context_selection, context_order, preferences_json,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        userId,
        data.api_key_encrypted || null,
        data.language_primary || null,
        data.language_secondary || null,
        data.font_size || 16,
        data.theme_id || 'default',
        data.custom_themes || null,
        data.selected_model || null,
        data.context_selection || null,
        data.context_order || null,
        data.preferences_json || null,
        now,
        now
      );
    }

    return this.findByUserId(userId)!;
  }

  static deleteByUserId(userId: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM user_preferences WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes > 0;
  }

  static updateApiKey(userId: string, encryptedApiKey: string): UserPreferences {
    return this.createOrUpdate(userId, { api_key_encrypted: encryptedApiKey });
  }
}
