import { getDatabase } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export interface CustomContext {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  icon: string | null;
  sub_contexts: string; // JSON string
  created_at: number;
  updated_at: number;
}

export interface CreateContextData {
  name: string;
  description?: string;
  icon?: string;
  sub_contexts: object[];
}

export interface UpdateContextData {
  name?: string;
  description?: string;
  icon?: string;
  sub_contexts?: object[];
}

export class ContextsRepository {
  static findById(id: string, userId: string): CustomContext | null {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM custom_contexts WHERE id = ? AND user_id = ?');
    return stmt.get(id, userId) as CustomContext | null;
  }

  static findAllByUserId(userId: string): CustomContext[] {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM custom_contexts WHERE user_id = ? ORDER BY created_at ASC');
    return stmt.all(userId) as CustomContext[];
  }

  static create(userId: string, data: CreateContextData): CustomContext {
    const db = getDatabase();
    const now = Date.now();
    const id = uuidv4();

    const stmt = db.prepare(`
      INSERT INTO custom_contexts (
        id, user_id, name, description, icon, sub_contexts,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userId,
      data.name,
      data.description || null,
      data.icon || null,
      JSON.stringify(data.sub_contexts),
      now,
      now
    );

    return this.findById(id, userId)!;
  }

  static update(id: string, userId: string, data: UpdateContextData): CustomContext | null {
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
    if (data.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(data.description || null);
    }
    if (data.icon !== undefined) {
      updateFields.push('icon = ?');
      updateValues.push(data.icon || null);
    }
    if (data.sub_contexts !== undefined) {
      updateFields.push('sub_contexts = ?');
      updateValues.push(JSON.stringify(data.sub_contexts));
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = ?');
      updateValues.push(Date.now());
      updateValues.push(id);
      updateValues.push(userId);

      const stmt = db.prepare(`
        UPDATE custom_contexts 
        SET ${updateFields.join(', ')}
        WHERE id = ? AND user_id = ?
      `);
      stmt.run(...updateValues);
    }

    return this.findById(id, userId);
  }

  static delete(id: string, userId: string): boolean {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM custom_contexts WHERE id = ? AND user_id = ?');
    const result = stmt.run(id, userId);
    return result.changes > 0;
  }

  static deleteAllByUserId(userId: string): number {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM custom_contexts WHERE user_id = ?');
    const result = stmt.run(userId);
    return result.changes;
  }
}
