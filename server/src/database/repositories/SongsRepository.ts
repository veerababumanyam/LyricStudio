import { getDatabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export interface SavedSong {
  id: string;
  user_id: string;
  title: string;
  content: string;
  suno_content: string | null;
  suno_style_prompt: string | null;
  language: string | null;
  theme: string | null;
  created_at: number;
  updated_at: number;
}

export interface CreateSongData {
  title: string;
  content: string;
  suno_content?: string;
  suno_style_prompt?: string;
  language?: string;
  theme?: string;
}

export interface UpdateSongData {
  title?: string;
  content?: string;
  suno_content?: string;
  suno_style_prompt?: string;
  language?: string;
  theme?: string;
}

export class SongsRepository {
  static findById(id: string, userId: string): SavedSong | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM saved_songs WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as SavedSong | null;
  }

  static findAllByUserId(userId: string, limit?: number, offset?: number): SavedSong[] {
    const db = getDatabase();
    let query = 'SELECT * FROM saved_songs WHERE user_id = ? ORDER BY created_at DESC';
    
    if (limit !== undefined) {
      query += ` LIMIT ${limit}`;
      if (offset !== undefined) {
        query += ` OFFSET ${offset}`;
      }
    }
    
    const stmt = db.prepare(query);
    return stmt.all(userId) as SavedSong[];
  }

  static create(userId: string, data: CreateSongData): SavedSong {
    const db = getDatabase();
    const now = Date.now();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO saved_songs (
        id, user_id, title, content, suno_content, suno_style_prompt,
        language, theme, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      data.title,
      data.content,
      data.suno_content || null,
      data.suno_style_prompt || null,
      data.language || null,
      data.theme || null,
      now,
      now
    );

    return this.findById(id, userId)!;
  }

  static update(id: string, userId: string, data: UpdateSongData): SavedSong | null {
    const db = getDatabase();
    const existing = this.findById(id, userId);
    
    if (!existing) {
      return null;
    }

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
      updateValues.push(Date.now());
      updateValues.push(id);
      updateValues.push(userId);

      const stmt = db.prepare(`
        UPDATE saved_songs 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND user_id = ?
      `);
      stmt.run(...updateValues);
    }

    return this.findById(id, userId);
  }

  static delete(id: string, userId: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM saved_songs WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  static deleteAllByUserId(userId: string): number {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM saved_songs WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  }

  static countByUserId(userId: string): number {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM saved_songs WHERE user_id = ?');
    const result = stmt.get(userId) as { count: number };
    return result.count;
  }
}
