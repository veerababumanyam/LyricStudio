import { Request, Response } from 'express';
import { PreferencesRepository } from '../database/repositories/PreferencesRepository.js';
import { EncryptionService } from '../services/encryption.service.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class PreferencesController {
  /**
   * GET /api/preferences
   * Get user preferences
   */
  static async getPreferences(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const preferences = PreferencesRepository.findByUserId(userId);

      if (!preferences) {
        // Return default preferences if none exist
        return res.json({
          font_size: 16,
          theme_id: 'default',
          custom_themes: null,
          selected_model: null,
          context_selection: null,
          context_order: null,
          language_primary: null,
          language_secondary: null,
          preferences_json: null,
          api_key_set: false
        });
      }

      // Don't send the encrypted API key to the client
      // Just indicate whether it's set
      const response = {
        font_size: preferences.font_size,
        theme_id: preferences.theme_id,
        custom_themes: preferences.custom_themes ? JSON.parse(preferences.custom_themes) : null,
        selected_model: preferences.selected_model,
        context_selection: preferences.context_selection ? JSON.parse(preferences.context_selection) : null,
        context_order: preferences.context_order ? JSON.parse(preferences.context_order) : null,
        language_primary: preferences.language_primary,
        language_secondary: preferences.language_secondary,
        preferences_json: preferences.preferences_json ? JSON.parse(preferences.preferences_json) : null,
        api_key_set: !!preferences.api_key_encrypted
      };

      res.json(response);
    } catch (error) {
      console.error('Get preferences error:', error);
      res.status(500).json({ error: 'Failed to retrieve preferences' });
    }
  }

  /**
   * PUT /api/preferences
   * Update user preferences
   */
  static async updatePreferences(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const {
        font_size,
        theme_id,
        custom_themes,
        selected_model,
        context_selection,
        context_order,
        language_primary,
        language_secondary,
        preferences_json
      } = req.body;

      const updateData: any = {};

      if (font_size !== undefined) updateData.font_size = font_size;
      if (theme_id !== undefined) updateData.theme_id = theme_id;
      if (custom_themes !== undefined) {
        updateData.custom_themes = custom_themes ? JSON.stringify(custom_themes) : null;
      }
      if (selected_model !== undefined) updateData.selected_model = selected_model;
      if (context_selection !== undefined) {
        updateData.context_selection = context_selection ? JSON.stringify(context_selection) : null;
      }
      if (context_order !== undefined) {
        updateData.context_order = context_order ? JSON.stringify(context_order) : null;
      }
      if (language_primary !== undefined) updateData.language_primary = language_primary;
      if (language_secondary !== undefined) updateData.language_secondary = language_secondary;
      if (preferences_json !== undefined) {
        updateData.preferences_json = preferences_json ? JSON.stringify(preferences_json) : null;
      }

      const preferences = PreferencesRepository.createOrUpdate(userId, updateData);

      res.json({
        message: 'Preferences updated successfully',
        preferences: {
          font_size: preferences.font_size,
          theme_id: preferences.theme_id,
          custom_themes: preferences.custom_themes ? JSON.parse(preferences.custom_themes) : null,
          selected_model: preferences.selected_model,
          context_selection: preferences.context_selection ? JSON.parse(preferences.context_selection) : null,
          context_order: preferences.context_order ? JSON.parse(preferences.context_order) : null,
          language_primary: preferences.language_primary,
          language_secondary: preferences.language_secondary,
          preferences_json: preferences.preferences_json ? JSON.parse(preferences.preferences_json) : null,
          api_key_set: !!preferences.api_key_encrypted
        }
      });
    } catch (error) {
      console.error('Update preferences error:', error);
      res.status(500).json({ error: 'Failed to update preferences' });
    }
  }

  /**
   * POST /api/preferences/api-key
   * Store encrypted API key
   */
  static async setApiKey(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { api_key } = req.body;

      if (!api_key || typeof api_key !== 'string') {
        return res.status(400).json({ error: 'API key is required' });
      }

      // Encrypt the API key with user-specific encryption
      const encrypted = EncryptionService.encrypt(api_key, userId);
      
      PreferencesRepository.createOrUpdate(userId, {
        api_key_encrypted: encrypted
      });

      res.json({ message: 'API key stored successfully' });
    } catch (error) {
      console.error('Set API key error:', error);
      res.status(500).json({ error: 'Failed to store API key' });
    }
  }

  /**
   * GET /api/preferences/api-key
   * Retrieve decrypted API key
   */
  static async getApiKey(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const preferences = PreferencesRepository.findByUserId(userId);

      if (!preferences || !preferences.api_key_encrypted) {
        return res.status(404).json({ error: 'API key not found' });
      }

      // Decrypt the API key
      const apiKey = EncryptionService.decrypt(preferences.api_key_encrypted, userId);

      res.json({ api_key: apiKey });
    } catch (error) {
      console.error('Get API key error:', error);
      res.status(500).json({ error: 'Failed to retrieve API key' });
    }
  }

  /**
   * DELETE /api/preferences/api-key
   * Remove stored API key
   */
  static async deleteApiKey(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      
      PreferencesRepository.createOrUpdate(userId, {
        api_key_encrypted: null
      });

      res.json({ message: 'API key removed successfully' });
    } catch (error) {
      console.error('Delete API key error:', error);
      res.status(500).json({ error: 'Failed to remove API key' });
    }
  }
}
