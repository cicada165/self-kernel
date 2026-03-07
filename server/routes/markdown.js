/**
 * Markdown Import Routes
 *
 * Enables bulk intent creation from Markdown documents and notes.
 * Supports various formats: headings as intents, checkboxes, bullet points.
 */

import { Router } from 'express';
import * as storage from '../storage.js';
import { randomUUID as uuidv4 } from 'crypto';

const router = Router();

/**
 * POST /api/markdown/import - Import intents from Markdown
 */
router.post('/import', async (req, res) => {
  try {
    const { markdown, format = 'auto', parentIntent = null } = req.body;

    if (!markdown) {
      return res.status(400).json({ error: 'Markdown content is required' });
    }

    const intents = parseMarkdown(markdown, format);
    const results = {
      created: [],
      errors: [],
      totalParsed: intents.length
    };

    for (const intentData of intents) {
      try {
        const intent = await storage.create('intents', {
          ...intentData,
          parent: parentIntent,
          tags: [...(intentData.tags || []), 'markdown-import'],
          stage: intentData.stage || 'EXPLORATION',
          precision: 0.5,
          children: [],
          active: true
        });

        results.created.push(intent);
      } catch (error) {
        results.errors.push({
          intent: intentData.title,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      ...results,
      message: `Imported ${results.created.length} intents from Markdown`
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/markdown/preview - Preview parsed intents without saving
 */
router.post('/preview', async (req, res) => {
  try {
    const { markdown, format = 'auto' } = req.body;

    if (!markdown) {
      return res.status(400).json({ error: 'Markdown content is required' });
    }

    const intents = parseMarkdown(markdown, format);

    res.json({
      count: intents.length,
      intents,
      detectedFormat: detectFormat(markdown)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Parse Markdown content into intent objects
 */
function parseMarkdown(markdown, format) {
  const lines = markdown.split('\n');
  const intents = [];

  if (format === 'auto') {
    format = detectFormat(markdown);
  }

  switch (format) {
    case 'headings':
      return parseHeadings(lines);
    case 'tasks':
      return parseTasks(lines);
    case 'bullets':
      return parseBullets(lines);
    case 'mixed':
      return parseMixed(lines);
    default:
      return parseHeadings(lines);
  }
}

/**
 * Detect Markdown format
 */
function detectFormat(markdown) {
  const hasHeadings = /^#{1,6}\s+/.test(markdown);
  const hasCheckboxes = /- \[(x| )\]/.test(markdown);
  const hasBullets = /^[*-]\s+/.test(markdown);

  if (hasCheckboxes) return 'tasks';
  if (hasHeadings && hasBullets) return 'mixed';
  if (hasHeadings) return 'headings';
  if (hasBullets) return 'bullets';

  return 'headings';
}

/**
 * Parse headings as intents
 */
function parseHeadings(lines) {
  const intents = [];
  let currentIntent = null;
  let currentDescription = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous intent
      if (currentIntent) {
        currentIntent.description = currentDescription.join('\n').trim();
        intents.push(currentIntent);
      }

      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      currentIntent = {
        title,
        priority: level <= 2 ? 'high' : level <= 4 ? 'medium' : 'low',
        tags: extractTags(title),
        description: ''
      };

      currentDescription = [];
    } else if (currentIntent && line.trim()) {
      // Accumulate description
      currentDescription.push(line.trim());
    }
  }

  // Save last intent
  if (currentIntent) {
    currentIntent.description = currentDescription.join('\n').trim();
    intents.push(currentIntent);
  }

  return intents;
}

/**
 * Parse task list (checkboxes) as intents
 */
function parseTasks(lines) {
  const intents = [];

  for (const line of lines) {
    const taskMatch = line.match(/^[*-]\s+\[(x| )\]\s+(.+)$/i);

    if (taskMatch) {
      const completed = taskMatch[1].toLowerCase() === 'x';
      const title = taskMatch[2].trim();

      intents.push({
        title,
        priority: determinePriority(title),
        tags: extractTags(title),
        stage: completed ? 'REFLECTION' : 'EXECUTION',
        description: ''
      });
    }
  }

  return intents;
}

/**
 * Parse bullet points as intents
 */
function parseBullets(lines) {
  const intents = [];

  for (const line of lines) {
    const bulletMatch = line.match(/^[*-]\s+(.+)$/);

    if (bulletMatch) {
      const title = bulletMatch[1].trim();

      intents.push({
        title,
        priority: determinePriority(title),
        tags: extractTags(title),
        description: ''
      });
    }
  }

  return intents;
}

/**
 * Parse mixed format (headings + bullets/tasks)
 */
function parseMixed(lines) {
  const intents = [];
  let parentIntent = null;

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    const taskMatch = line.match(/^[*-]\s+\[(x| )\]\s+(.+)$/i);
    const bulletMatch = line.match(/^[*-]\s+(.+)$/);

    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2].trim();

      const intent = {
        id: uuidv4(),
        title,
        priority: level <= 2 ? 'high' : 'medium',
        tags: extractTags(title),
        description: '',
        isParent: true
      };

      intents.push(intent);
      parentIntent = intent;

    } else if (taskMatch) {
      const completed = taskMatch[1].toLowerCase() === 'x';
      const title = taskMatch[2].trim();

      intents.push({
        title,
        parent: parentIntent?.id,
        priority: 'medium',
        tags: extractTags(title),
        stage: completed ? 'REFLECTION' : 'EXECUTION',
        description: ''
      });

    } else if (bulletMatch && parentIntent) {
      const title = bulletMatch[1].trim();

      intents.push({
        title,
        parent: parentIntent.id,
        priority: determinePriority(title),
        tags: extractTags(title),
        description: ''
      });
    }
  }

  return intents;
}

/**
 * Extract tags from title
 */
function extractTags(title) {
  const tags = [];

  // Priority indicators
  if (/urgent|asap|critical|important/i.test(title)) {
    tags.push('urgent');
  }

  // Category indicators
  const categories = {
    research: /research|investigate|explore|study/i,
    build: /build|create|develop|implement/i,
    fix: /fix|bug|issue|problem/i,
    meeting: /meeting|call|discussion|sync/i,
    review: /review|feedback|iterate/i
  };

  for (const [tag, pattern] of Object.entries(categories)) {
    if (pattern.test(title)) {
      tags.push(tag);
    }
  }

  // Extract hashtags
  const hashtagMatches = title.match(/#(\w+)/g);
  if (hashtagMatches) {
    tags.push(...hashtagMatches.map(t => t.substring(1).toLowerCase()));
  }

  return tags;
}

/**
 * Determine priority from title
 */
function determinePriority(title) {
  if (/urgent|critical|asap|high.priority/i.test(title)) {
    return 'high';
  }

  if (/low.priority|nice.to.have|someday/i.test(title)) {
    return 'low';
  }

  return 'medium';
}

export default router;
