import { Request, Response } from 'express';
import { ProfilesRepository } from '../database/repositories/ProfilesRepository.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class ProfilesController {
  /**
   * GET /api/profiles
   * Get all profiles for the authenticated user
   */
  static async getAllProfiles(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const profiles = ProfilesRepository.findAllByUserId(userId);

      // Parse JSON fields
      const parsedProfiles = profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        language_profile: JSON.parse(profile.language_profile),
        generation_settings: JSON.parse(profile.generation_settings),
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }));

      res.json(parsedProfiles);
    } catch (error) {
      console.error('Get profiles error:', error);
      res.status(500).json({ error: 'Failed to retrieve profiles' });
    }
  }

  /**
   * GET /api/profiles/:id
   * Get a specific profile by ID
   */
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const profile = ProfilesRepository.findById(id, userId);

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({
        id: profile.id,
        name: profile.name,
        language_profile: JSON.parse(profile.language_profile),
        generation_settings: JSON.parse(profile.generation_settings),
        created_at: profile.created_at,
        updated_at: profile.updated_at
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to retrieve profile' });
    }
  }

  /**
   * POST /api/profiles
   * Create a new profile
   */
  static async createProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { name, language_profile, generation_settings } = req.body;

      if (!name || !language_profile || !generation_settings) {
        return res.status(400).json({ 
          error: 'Name, language_profile, and generation_settings are required' 
        });
      }

      const profile = ProfilesRepository.create(userId, {
        name,
        language_profile,
        generation_settings
      });

      res.status(201).json({
        id: profile.id,
        name: profile.name,
        language_profile: JSON.parse(profile.language_profile),
        generation_settings: JSON.parse(profile.generation_settings),
        created_at: profile.created_at,
        updated_at: profile.updated_at
      });
    } catch (error) {
      console.error('Create profile error:', error);
      res.status(500).json({ error: 'Failed to create profile' });
    }
  }

  /**
   * PUT /api/profiles/:id
   * Update an existing profile
   */
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, language_profile, generation_settings } = req.body;

      const profile = ProfilesRepository.update(id, userId, {
        name,
        language_profile,
        generation_settings
      });

      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({
        id: profile.id,
        name: profile.name,
        language_profile: JSON.parse(profile.language_profile),
        generation_settings: JSON.parse(profile.generation_settings),
        created_at: profile.created_at,
        updated_at: profile.updated_at
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  /**
   * DELETE /api/profiles/:id
   * Delete a profile
   */
  static async deleteProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = ProfilesRepository.delete(id, userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({ message: 'Profile deleted successfully' });
    } catch (error) {
      console.error('Delete profile error:', error);
      res.status(500).json({ error: 'Failed to delete profile' });
    }
  }

  /**
   * POST /api/profiles/bulk
   * Create multiple profiles at once (for migration)
   */
  static async bulkCreateProfiles(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { profiles } = req.body;

      if (!Array.isArray(profiles)) {
        return res.status(400).json({ error: 'Profiles must be an array' });
      }

      const createdProfiles = profiles.map(profileData => {
        const profile = ProfilesRepository.create(userId, {
          name: profileData.name,
          language_profile: profileData.language,
          generation_settings: profileData.generation
        });

        return {
          id: profile.id,
          name: profile.name,
          language_profile: JSON.parse(profile.language_profile),
          generation_settings: JSON.parse(profile.generation_settings),
          created_at: profile.created_at,
          updated_at: profile.updated_at
        };
      });

      res.status(201).json({
        message: `${createdProfiles.length} profiles created successfully`,
        profiles: createdProfiles
      });
    } catch (error) {
      console.error('Bulk create profiles error:', error);
      res.status(500).json({ error: 'Failed to create profiles' });
    }
  }
}
