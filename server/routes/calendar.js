/**
 * Calendar Integration API
 * ICS export/import for trajectory milestones and intent deadlines
 */

import express from 'express';
import storage from '../storage.js';
import {
  generateTrajectoryICS,
  generateIntentICS,
  parseICS
} from '../utils/icsGenerator.js';

const router = express.Router();

/**
 * GET /api/calendar/trajectory/:id
 * Export trajectory milestones as ICS file
 */
router.get('/trajectory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const trajectory = storage.get('trajectories', id);

    if (!trajectory) {
      return res.status(404).json({ error: 'Trajectory not found' });
    }

    // Get associated intents
    const intents = storage.list('intents').filter(intent =>
      intent.trajectoryId === id && intent.deadline
    );

    const icsContent = generateTrajectoryICS(trajectory, intents);

    // Set headers for file download
    const filename = `${trajectory.name.replace(/[^a-z0-9]/gi, '_')}.ics`;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(icsContent);

  } catch (error) {
    console.error('Error exporting trajectory calendar:', error);
    res.status(500).json({ error: 'Failed to export calendar' });
  }
});

/**
 * GET /api/calendar/intent/:id
 * Export single intent as ICS event
 */
router.get('/intent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const intent = storage.get('intents', id);

    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    const icsContent = generateIntentICS(intent);

    // Set headers for file download
    const filename = `${intent.target.substring(0, 50).replace(/[^a-z0-9]/gi, '_')}.ics`;
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    res.send(icsContent);

  } catch (error) {
    console.error('Error exporting intent calendar:', error);
    res.status(500).json({ error: 'Failed to export intent' });
  }
});

/**
 * GET /api/calendar/all
 * Export all trajectories and deadlines as a single ICS file
 */
router.get('/all', async (req, res) => {
  try {
    const trajectories = storage.list('trajectories');
    const intents = storage.list('intents').filter(i => i.deadline);

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Self Kernel//Full Calendar Export//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Self Kernel - All Events',
      'X-WR-TIMEZONE:UTC',
      ''
    ].join('\r\n');

    // Add all trajectory milestones
    for (const trajectory of trajectories) {
      const trajectoryICS = generateTrajectoryICS(trajectory, []);
      // Extract events from trajectory ICS (skip calendar headers)
      const events = trajectoryICS.split('BEGIN:VEVENT').slice(1);
      for (const event of events) {
        icsContent += 'BEGIN:VEVENT' + event.split('END:VCALENDAR')[0];
      }
    }

    // Add all intent deadlines
    for (const intent of intents) {
      const intentICS = generateIntentICS(intent);
      // Extract event from intent ICS
      const events = intentICS.split('BEGIN:VEVENT').slice(1);
      for (const event of events) {
        icsContent += 'BEGIN:VEVENT' + event.split('END:VCALENDAR')[0];
      }
    }

    icsContent += 'END:VCALENDAR\r\n';

    // Set headers for file download
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="self-kernel-all-events.ics"');

    res.send(icsContent);

  } catch (error) {
    console.error('Error exporting all calendar events:', error);
    res.status(500).json({ error: 'Failed to export calendar' });
  }
});

/**
 * POST /api/calendar/import
 * Import ICS file and create intents from events
 *
 * Body:
 * - icsContent: string (ICS file content)
 * - createIntents: boolean (default: true) - create intents from events
 * - tags: array - tags to add to created intents
 */
router.post('/import', async (req, res) => {
  try {
    const { icsContent, createIntents = true, tags = ['calendar-import'] } = req.body;

    if (!icsContent) {
      return res.status(400).json({ error: 'ICS content is required' });
    }

    const events = parseICS(icsContent);

    if (!createIntents) {
      return res.json({
        success: true,
        preview: events,
        count: events.length,
        message: 'Preview only - no intents created'
      });
    }

    const createdIntents = [];

    for (const event of events) {
      // Skip if it's a Self Kernel exported event (avoid circular imports)
      if (event.categories && event.categories.includes('Self-Kernel')) {
        continue;
      }

      // Create intent from event
      const intent = {
        id: storage.generateId(),
        target: event.summary.replace(/^[📌🎯]\s*/, ''), // Remove emoji prefix if present
        stage: 'EXPLORATION', // Default stage for imported events
        priority: event.priority || 'medium',
        tags: [...tags, ...(event.categories || [])],
        deadline: event.start ? event.start.toISOString() : undefined,
        notes: event.description || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'calendar-import',
          originalSummary: event.summary
        }
      };

      storage.create('intents', intent);
      createdIntents.push(intent);
    }

    res.json({
      success: true,
      message: `Imported ${createdIntents.length} events as intents`,
      created: createdIntents.length,
      skipped: events.length - createdIntents.length,
      intents: createdIntents
    });

  } catch (error) {
    console.error('Error importing calendar:', error);
    res.status(500).json({ error: error.message || 'Failed to import calendar' });
  }
});

/**
 * POST /api/calendar/preview
 * Preview ICS file contents without importing
 */
router.post('/preview', async (req, res) => {
  try {
    const { icsContent } = req.body;

    if (!icsContent) {
      return res.status(400).json({ error: 'ICS content is required' });
    }

    const events = parseICS(icsContent);

    res.json({
      success: true,
      events: events.map(e => ({
        summary: e.summary,
        start: e.start,
        description: e.description,
        categories: e.categories,
        priority: e.priority,
        willImport: !e.categories || !e.categories.includes('Self-Kernel')
      })),
      count: events.length,
      importable: events.filter(e => !e.categories || !e.categories.includes('Self-Kernel')).length
    });

  } catch (error) {
    console.error('Error previewing calendar:', error);
    res.status(500).json({ error: 'Failed to preview calendar' });
  }
});

/**
 * GET /api/calendar/status
 * Get calendar integration statistics
 */
router.get('/status', async (req, res) => {
  try {
    const trajectories = storage.list('trajectories');
    const intents = storage.list('intents');

    const stats = {
      trajectories: trajectories.length,
      totalMilestones: trajectories.reduce((sum, t) =>
        sum + (t.milestones ? t.milestones.length : 0), 0
      ),
      intentsWithDeadlines: intents.filter(i => i.deadline).length,
      totalIntents: intents.length,
      exportableEvents: 0
    };

    stats.exportableEvents = stats.totalMilestones + stats.intentsWithDeadlines;

    res.json({ stats });

  } catch (error) {
    console.error('Error getting calendar status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;
