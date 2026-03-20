/**
 * Workflow Templates API
 * Endpoints for managing workflow templates
 */

import express from 'express';
import {
  listTemplates,
  getTemplate,
  applyTemplate,
  getTemplatesByCategory,
  getCategories
} from '../services/templates.js';

const router = express.Router();

/**
 * GET /api/templates
 * List all available workflow templates
 */
router.get('/', (req, res) => {
  try {
    const templates = listTemplates();
    res.json({ templates, count: templates.length });
  } catch (error) {
    console.error('Error listing templates:', error);
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

/**
 * GET /api/templates/categories
 * Get all template categories
 */
router.get('/categories', (req, res) => {
  try {
    const categories = getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

/**
 * GET /api/templates/category/:category
 * Get templates by category
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const templates = getTemplatesByCategory(category);
    res.json({ templates, category, count: templates.length });
  } catch (error) {
    console.error('Error getting templates by category:', error);
    res.status(500).json({ error: 'Failed to get templates by category' });
  }
});

/**
 * GET /api/templates/:id
 * Get full template details by ID
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const template = getTemplate(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
});

/**
 * POST /api/templates/:id/apply
 * Apply a template to create intents, trajectory, and persons
 *
 * Body:
 * - prefix (optional): Prefix to add to all created items
 * - adjustDates (optional): Auto-adjust milestone dates from today (default: true)
 * - mergeDuplicates (optional): Don't create duplicate persons (default: true)
 */
router.post('/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    const options = req.body || {};

    const results = await applyTemplate(id, options);

    res.json({
      success: true,
      message: `Template "${id}" applied successfully`,
      results: {
        intentsCreated: results.intents.length,
        trajectoryCreated: results.trajectory ? 1 : 0,
        personsCreated: results.persons.length,
        relationsCreated: results.relations.length
      },
      data: results
    });
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to apply template'
    });
  }
});

/**
 * GET /api/templates/:id/preview
 * Preview what will be created without actually creating it
 */
router.get('/:id/preview', (req, res) => {
  try {
    const { id } = req.params;
    const template = getTemplate(id);

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const preview = {
      template: {
        id: template.id,
        name: template.name,
        description: template.description
      },
      willCreate: {
        intents: template.intents.length,
        milestones: template.trajectory.milestones.length,
        persons: template.persons.length,
        estimatedRelations: Math.floor(template.intents.length / 2)
      },
      details: {
        intents: template.intents.map(i => ({
          title: i.title,
          stage: i.stage,
          priority: i.priority,
          tags: i.tags
        })),
        milestones: template.trajectory.milestones.map(m => ({
          name: m.name,
          description: m.description,
          targetDays: m.targetDate
        })),
        persons: template.persons.map(p => ({
          name: p.name,
          type: p.type,
          role: p.role
        }))
      }
    };

    res.json({ preview });
  } catch (error) {
    console.error('Error generating preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

export default router;
