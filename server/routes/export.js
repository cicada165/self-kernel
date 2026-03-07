/**
 * Export/Import Routes — White-box Data Exchange
 *
 * Provides endpoints for exporting and importing all system data in JSON and CSV formats.
 * Enables data portability, backups, and integration with external tools.
 */

import { Router } from 'express';
import * as storage from '../storage.js';

const router = Router();

/**
 * GET /api/export/json — Export all data as JSON
 */
router.get('/json', async (req, res) => {
  try {
    const collections = req.query.collections
      ? req.query.collections.split(',')
      : ['persons', 'intents', 'relations', 'thinking-chains', 'cognitive-stages',
         'trajectories', 'governance-rules', 'rat-patterns', 'execution-payloads',
         'suggestions', 'baseline'];

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      collections: {}
    };

    for (const collection of collections) {
      try {
        const items = await storage.listAll(collection);
        exportData.collections[collection] = items;
      } catch (error) {
        exportData.collections[collection] = { error: error.message };
      }
    }

    // Include metadata
    try {
      exportData.meta = await storage.getMeta();
    } catch (error) {
      exportData.meta = { error: error.message };
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="self-kernel-export-${Date.now()}.json"`);
    res.json(exportData);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/csv/:collection — Export specific collection as CSV
 */
router.get('/csv/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const items = await storage.listAll(collection);

    if (items.length === 0) {
      return res.status(404).json({ error: 'Collection is empty' });
    }

    const csv = convertToCSV(items);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${collection}-export-${Date.now()}.csv"`);
    res.send(csv);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/import/json — Import data from JSON
 */
router.post('/json', async (req, res) => {
  try {
    const { data, mode = 'merge' } = req.body;

    if (!data || !data.collections) {
      return res.status(400).json({ error: 'Invalid import data format' });
    }

    const results = {
      imported: {},
      errors: {},
      mode
    };

    // Create backup before import
    const backup = await storage.createBackup?.();
    results.backupCreated = backup ? true : false;

    for (const [collection, items] of Object.entries(data.collections)) {
      if (!Array.isArray(items)) continue;

      results.imported[collection] = { count: 0, skipped: 0 };

      for (const item of items) {
        try {
          if (mode === 'replace') {
            // Delete all existing items first
            const existing = await storage.listAll(collection);
            for (const existingItem of existing) {
              await storage.deleteItem(collection, existingItem.id);
            }
          }

          // Check if item already exists (for merge mode)
          if (mode === 'merge') {
            const existing = await storage.getById(collection, item.id);
            if (existing) {
              results.imported[collection].skipped++;
              continue;
            }
          }

          await storage.create(collection, item);
          results.imported[collection].count++;

        } catch (error) {
          if (!results.errors[collection]) {
            results.errors[collection] = [];
          }
          results.errors[collection].push({
            itemId: item.id,
            error: error.message
          });
        }
      }
    }

    // Import metadata if provided
    if (data.meta) {
      try {
        await storage.saveMeta(data.meta);
        results.metaImported = true;
      } catch (error) {
        results.errors.meta = error.message;
      }
    }

    res.json({
      success: true,
      results,
      message: `Import completed. Imported ${Object.values(results.imported).reduce((sum, r) => sum + r.count, 0)} items.`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/import/csv/:collection — Import CSV into collection
 */
router.post('/csv/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const { csv, mode = 'merge' } = req.body;

    if (!csv) {
      return res.status(400).json({ error: 'No CSV data provided' });
    }

    const items = parseCSV(csv);
    const results = {
      imported: 0,
      skipped: 0,
      errors: []
    };

    for (const item of items) {
      try {
        if (mode === 'merge') {
          const existing = await storage.getById(collection, item.id);
          if (existing) {
            results.skipped++;
            continue;
          }
        }

        await storage.create(collection, item);
        results.imported++;

      } catch (error) {
        results.errors.push({
          itemId: item.id,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      message: `Imported ${results.imported} items into ${collection}`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/collection/:collection — Export single collection as JSON
 */
router.get('/collection/:collection', async (req, res) => {
  try {
    const { collection } = req.params;
    const items = await storage.listAll(collection);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${collection}-${Date.now()}.json"`);
    res.json({
      collection,
      exportedAt: new Date().toISOString(),
      count: items.length,
      items
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/export/report — Generate human-readable report
 */
router.get('/report', async (req, res) => {
  try {
    const [intents, persons, relations, trajectories, cognitiveStages, ratPatterns] = await Promise.all([
      storage.listAll('intents'),
      storage.listAll('persons'),
      storage.listAll('relations'),
      storage.listAll('trajectories'),
      storage.listAll('cognitive-stages'),
      storage.listAll('rat-patterns')
    ]);

    const meta = await storage.getMeta().catch(() => ({}));

    const report = generateTextReport({
      intents,
      persons,
      relations,
      trajectories,
      cognitiveStages,
      ratPatterns,
      meta
    });

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="self-kernel-report-${Date.now()}.txt"`);
    res.send(report);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Convert array of objects to CSV
 */
function convertToCSV(items) {
  if (items.length === 0) return '';

  // Get all unique keys
  const keys = Array.from(new Set(items.flatMap(item => Object.keys(item))));

  // Create header row
  const header = keys.join(',');

  // Create data rows
  const rows = items.map(item => {
    return keys.map(key => {
      const value = item[key];

      // Handle different types
      if (value === null || value === undefined) {
        return '';
      }

      if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }

      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Parse CSV string to array of objects
 */
function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const items = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const item = {};

    headers.forEach((header, index) => {
      let value = values[index];

      // Try to parse as JSON if it looks like an object/array
      if (value.startsWith('{') || value.startsWith('[')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Keep as string if JSON parse fails
        }
      }

      // Convert string numbers to actual numbers
      if (!isNaN(value) && value !== '') {
        value = parseFloat(value);
      }

      item[header] = value;
    });

    items.push(item);
  }

  return items;
}

/**
 * Parse a single CSV line (handles quoted fields)
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/**
 * Generate human-readable text report
 */
function generateTextReport(data) {
  const { intents, persons, relations, trajectories, cognitiveStages, ratPatterns, meta } = data;

  let report = '';
  report += '═══════════════════════════════════════════════════════════\n';
  report += '                SELF KERNEL SYSTEM REPORT                 \n';
  report += '═══════════════════════════════════════════════════════════\n';
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Kernel ID: ${meta.kernelId || 'N/A'}\n`;
  report += `Version: ${meta.version || 'N/A'}\n\n`;

  // Summary Statistics
  report += '─────────────────────────────────────────────────────────\n';
  report += ' SUMMARY STATISTICS\n';
  report += '─────────────────────────────────────────────────────────\n';
  report += `  Persons: ${persons.length}\n`;
  report += `  Intents: ${intents.length}\n`;
  report += `  Relations: ${relations.length}\n`;
  report += `  Trajectories: ${trajectories.length}\n`;
  report += `  Cognitive Stages: ${cognitiveStages.length}\n`;
  report += `  RAT Patterns: ${ratPatterns.length}\n\n`;

  // Persons
  report += '─────────────────────────────────────────────────────────\n';
  report += ' PERSONS\n';
  report += '─────────────────────────────────────────────────────────\n';
  persons.forEach(person => {
    report += `  • ${person.name} (${person.type})\n`;
    if (person.role) report += `    Role: ${person.role}\n`;
    if (person.bio) report += `    Bio: ${person.bio}\n`;
  });
  report += '\n';

  // Intents by Stage
  report += '─────────────────────────────────────────────────────────\n';
  report += ' INTENTS BY STAGE\n';
  report += '─────────────────────────────────────────────────────────\n';
  const intentsByStage = intents.reduce((acc, intent) => {
    const stage = intent.stage || 'UNKNOWN';
    if (!acc[stage]) acc[stage] = [];
    acc[stage].push(intent);
    return acc;
  }, {});

  for (const [stage, stageIntents] of Object.entries(intentsByStage)) {
    report += `  ${stage} (${stageIntents.length}):\n`;
    stageIntents.forEach(intent => {
      report += `    • ${intent.title} [${intent.priority || 'medium'}]\n`;
    });
  }
  report += '\n';

  // Trajectories
  report += '─────────────────────────────────────────────────────────\n';
  report += ' TRAJECTORIES\n';
  report += '─────────────────────────────────────────────────────────\n';
  trajectories.forEach(traj => {
    report += `  • ${traj.label || traj.title}\n`;
    if (traj.description) report += `    ${traj.description}\n`;
    if (traj.milestones) {
      report += `    Milestones: ${traj.milestones.length}\n`;
      report += `    Success Rate: ${Math.round((traj.successRate || 0) * 100)}%\n`;
    }
  });
  report += '\n';

  // Cognitive Stages (Latest)
  if (cognitiveStages.length > 0) {
    const latest = cognitiveStages.sort((a, b) =>
      new Date(b.weekOf || b.week) - new Date(a.weekOf || a.week)
    )[0];

    report += '─────────────────────────────────────────────────────────\n';
    report += ' CURRENT COGNITIVE STATE\n';
    report += '─────────────────────────────────────────────────────────\n';
    report += `  Week: ${latest.weekOf || latest.week}\n`;
    report += `  Dominant Stage: ${latest.dominantStage}\n`;
    report += `  Clarity: ${Math.round((latest.clarity || 0) * 100)}%\n`;
    report += `  Energy: ${Math.round((latest.energy || 0) * 100)}%\n`;
    if (latest.summary) report += `  Summary: ${latest.summary}\n`;
    report += '\n';
  }

  // Learning Stats
  if (meta.suggestionFeedback) {
    report += '─────────────────────────────────────────────────────────\n';
    report += ' LEARNING METRICS\n';
    report += '─────────────────────────────────────────────────────────\n';
    report += `  Total Accepted: ${meta.suggestionFeedback.totalAccepted || 0}\n`;
    report += `  Total Rejected: ${meta.suggestionFeedback.totalRejected || 0}\n`;
    report += `  Acceptance Rate: ${Math.round((meta.suggestionFeedback.acceptanceRate || 0) * 100)}%\n`;
    report += '\n';
  }

  report += '═══════════════════════════════════════════════════════════\n';
  report += '                     END OF REPORT                        \n';
  report += '═══════════════════════════════════════════════════════════\n';

  return report;
}

export default router;
