import { Request, Response } from 'express';
import { SongsRepository } from '../database/repositories/SongsRepository.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class SongsController {
  /**
   * GET /api/songs
   * Get all songs for the authenticated user
   */
  static async getAllSongs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : undefined;

      const songs = SongsRepository.findAllByUserId(userId, limit, offset);
      const total = SongsRepository.countByUserId(userId);

      res.json({
        songs,
        total,
        limit,
        offset
      });
    } catch (error) {
      console.error('Get songs error:', error);
      res.status(500).json({ error: 'Failed to retrieve songs' });
    }
  }

  /**
   * GET /api/songs/:id
   * Get a specific song by ID
   */
  static async getSong(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const song = SongsRepository.findById(id, userId);

      if (!song) {
        return res.status(404).json({ error: 'Song not found' });
      }

      res.json(song);
    } catch (error) {
      console.error('Get song error:', error);
      res.status(500).json({ error: 'Failed to retrieve song' });
    }
  }

  /**
   * POST /api/songs
   * Create a new song
   */
  static async createSong(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { title, content, suno_content, suno_style_prompt, language, theme } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' });
      }

      const song = SongsRepository.create(userId, {
        title,
        content,
        suno_content,
        suno_style_prompt,
        language,
        theme
      });

      res.status(201).json(song);
    } catch (error) {
      console.error('Create song error:', error);
      res.status(500).json({ error: 'Failed to create song' });
    }
  }

  /**
   * PUT /api/songs/:id
   * Update an existing song
   */
  static async updateSong(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { title, content, suno_content, suno_style_prompt, language, theme } = req.body;

      const song = SongsRepository.update(id, userId, {
        title,
        content,
        suno_content,
        suno_style_prompt,
        language,
        theme
      });

      if (!song) {
        return res.status(404).json({ error: 'Song not found' });
      }

      res.json(song);
    } catch (error) {
      console.error('Update song error:', error);
      res.status(500).json({ error: 'Failed to update song' });
    }
  }

  /**
   * DELETE /api/songs/:id
   * Delete a song
   */
  static async deleteSong(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = SongsRepository.delete(id, userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Song not found' });
      }

      res.json({ message: 'Song deleted successfully' });
    } catch (error) {
      console.error('Delete song error:', error);
      res.status(500).json({ error: 'Failed to delete song' });
    }
  }

  /**
   * POST /api/songs/bulk
   * Create multiple songs at once (for migration)
   */
  static async bulkCreateSongs(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { songs } = req.body;

      if (!Array.isArray(songs)) {
        return res.status(400).json({ error: 'Songs must be an array' });
      }

      const createdSongs = songs.map(songData => {
        return SongsRepository.create(userId, {
          title: songData.title,
          content: songData.content,
          suno_content: songData.sunoContent,
          suno_style_prompt: songData.sunoStylePrompt,
          language: songData.language,
          theme: songData.theme
        });
      });

      res.status(201).json({
        message: `${createdSongs.length} songs created successfully`,
        songs: createdSongs
      });
    } catch (error) {
      console.error('Bulk create songs error:', error);
      res.status(500).json({ error: 'Failed to create songs' });
    }
  }
}
