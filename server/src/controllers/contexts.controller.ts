import { Request, Response } from 'express';
import { ContextsRepository } from '../database/repositories/ContextsRepository.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export class ContextsController {
  /**
   * GET /api/contexts
   * Get all custom contexts for the authenticated user
   */
  static async getAllContexts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const contexts = ContextsRepository.findAllByUserId(userId);

      // Parse JSON fields
      const parsedContexts = contexts.map(context => ({
        id: context.id,
        name: context.name,
        description: context.description,
        icon: context.icon,
        subContexts: JSON.parse(context.sub_contexts),
        createdAt: context.created_at,
        updatedAt: context.updated_at
      }));

      res.json(parsedContexts);
    } catch (error) {
      console.error('Get contexts error:', error);
      res.status(500).json({ error: 'Failed to retrieve contexts' });
    }
  }

  /**
   * GET /api/contexts/:id
   * Get a specific context by ID
   */
  static async getContext(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const context = ContextsRepository.findById(id, userId);

      if (!context) {
        return res.status(404).json({ error: 'Context not found' });
      }

      res.json({
        id: context.id,
        name: context.name,
        description: context.description,
        icon: context.icon,
        subContexts: JSON.parse(context.sub_contexts),
        createdAt: context.created_at,
        updatedAt: context.updated_at
      });
    } catch (error) {
      console.error('Get context error:', error);
      res.status(500).json({ error: 'Failed to retrieve context' });
    }
  }

  /**
   * POST /api/contexts
   * Create a new custom context
   */
  static async createContext(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { name, description, icon, sub_contexts } = req.body;

      if (!name || !sub_contexts) {
        return res.status(400).json({ 
          error: 'Name and sub_contexts are required' 
        });
      }

      if (!Array.isArray(sub_contexts)) {
        return res.status(400).json({ error: 'sub_contexts must be an array' });
      }

      const context = ContextsRepository.create(userId, {
        name,
        description,
        icon,
        sub_contexts
      });

      res.status(201).json({
        id: context.id,
        name: context.name,
        description: context.description,
        icon: context.icon,
        subContexts: JSON.parse(context.sub_contexts),
        createdAt: context.created_at,
        updatedAt: context.updated_at
      });
    } catch (error) {
      console.error('Create context error:', error);
      res.status(500).json({ error: 'Failed to create context' });
    }
  }

  /**
   * PUT /api/contexts/:id
   * Update an existing context
   */
  static async updateContext(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const { name, description, icon, sub_contexts } = req.body;

      const context = ContextsRepository.update(id, userId, {
        name,
        description,
        icon,
        sub_contexts
      });

      if (!context) {
        return res.status(404).json({ error: 'Context not found' });
      }

      res.json({
        id: context.id,
        name: context.name,
        description: context.description,
        icon: context.icon,
        subContexts: JSON.parse(context.sub_contexts),
        createdAt: context.created_at,
        updatedAt: context.updated_at
      });
    } catch (error) {
      console.error('Update context error:', error);
      res.status(500).json({ error: 'Failed to update context' });
    }
  }

  /**
   * DELETE /api/contexts/:id
   * Delete a context
   */
  static async deleteContext(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { id } = req.params;

      const deleted = ContextsRepository.delete(id, userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Context not found' });
      }

      res.json({ message: 'Context deleted successfully' });
    } catch (error) {
      console.error('Delete context error:', error);
      res.status(500).json({ error: 'Failed to delete context' });
    }
  }

  /**
   * POST /api/contexts/bulk
   * Create multiple contexts at once (for migration)
   */
  static async bulkCreateContexts(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const { contexts } = req.body;

      if (!Array.isArray(contexts)) {
        return res.status(400).json({ error: 'Contexts must be an array' });
      }

      const createdContexts = contexts.map(contextData => {
        const context = ContextsRepository.create(userId, {
          name: contextData.name,
          description: contextData.description,
          icon: contextData.icon,
          sub_contexts: contextData.subContexts
        });

        return {
          id: context.id,
          name: context.name,
          description: context.description,
          icon: context.icon,
          subContexts: JSON.parse(context.sub_contexts),
          createdAt: context.created_at,
          updatedAt: context.updated_at
        };
      });

      res.status(201).json({
        message: `${createdContexts.length} contexts created successfully`,
        contexts: createdContexts
      });
    } catch (error) {
      console.error('Bulk create contexts error:', error);
      res.status(500).json({ error: 'Failed to create contexts' });
    }
  }
}
