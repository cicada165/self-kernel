/**
 * Purifier Daemon — Enhanced Auto-Labeler Pipeline
 * Ingests raw text, extracts entities via LLM, and commits high-precision data to the Kernel.
 *
 * Enhanced Features:
 * - 10+ intent type patterns (build, research, meet, deploy, etc.)
 * - Intelligent person name extraction from context
 * - Time constraint and priority detection
 * - Improved precision weighting with multiple signal types
 * - Better handling of natural language variations
 *
 * Examples of high-precision inputs (weight > 0.7):
 * - "I need to finish the quarterly report by Friday and discuss with Sarah"
 * - "Must implement the authentication system this week using OAuth"
 * - "Planning to meet David tomorrow to review the budget proposal"
 *
 * Examples of low-precision inputs (weight < 0.7):
 * - "thinking about stuff"
 * - "hmm"
 * - "maybe later"
 */

import { extractEntities } from './llm.js';
import * as storage from '../storage.js';

// The threshold for committing automatic extractions to the Kernel
// Raised to 0.7 to ensure high-quality auto-committed data
const PRECISION_THRESHOLD = 0.7;

/**
 * Calculate similarity between two strings (simple word overlap)
 */
function calculateSimilarity(str1, str2) {
    const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Find existing person by name (case-insensitive, fuzzy match)
 */
async function findExistingPerson(name) {
    const allPersons = await storage.listAll('persons');
    const nameLower = name.toLowerCase().trim();

    // Exact match
    let match = allPersons.find(p => p.name.toLowerCase().trim() === nameLower);
    if (match) return match;

    // Fuzzy match (first name or last name)
    const nameParts = nameLower.split(/\s+/);
    match = allPersons.find(p => {
        const personParts = p.name.toLowerCase().split(/\s+/);
        return nameParts.some(part => personParts.includes(part) && part.length > 2);
    });

    return match;
}

/**
 * Find similar existing intent (to avoid duplicates)
 */
async function findSimilarIntent(title, description) {
    const allIntents = await storage.listAll('intents');

    // Exact title match
    let match = allIntents.find(i => i.title.toLowerCase() === title.toLowerCase());
    if (match) return match;

    // High similarity match (>70% word overlap)
    match = allIntents.find(i => {
        const titleSim = calculateSimilarity(i.title, title);
        const descSim = description ? calculateSimilarity(i.description || '', description) : 0;
        return titleSim > 0.7 || descSim > 0.6;
    });

    return match;
}

export async function processRawInput(text, source) {
    // 1. Run inference
    const llmResult = await extractEntities(text, source);
    const weight = llmResult.precision_weight;
    const entities = llmResult.extracted_entities;

    const result = {
        source,
        preview: text.length > 50 ? text.slice(0, 50) + '...' : text,
        weight,
        extracted: entities,
        action: 'discarded',
        reason: `Precision weight (${weight}) below threshold (${PRECISION_THRESHOLD})`
    };

    // 2. Precision-Weighting filter
    if (weight >= PRECISION_THRESHOLD) {
        result.action = 'committed';
        result.reason = `High precision signal (${weight})`;
        result.savedIds = { persons: [], intents: [], relations: [] };
        result.linked = { persons: [], intents: [] };
        result.updated = { persons: [], intents: [] };

        // 3. Process Persons (link to existing or create new)
        const personIds = [];
        for (const p of entities.persons) {
            const existing = await findExistingPerson(p.name);

            if (existing) {
                // Update interaction count and last seen
                existing.interactions = (existing.interactions || 0) + 1;
                existing.lastSeen = new Date().toISOString();
                if (!existing.tags) existing.tags = [];
                if (!existing.tags.includes('auto-extracted')) {
                    existing.tags.push('auto-extracted');
                }
                await storage.update('persons', existing.id, existing);
                result.linked.persons.push(existing.id);
                result.updated.persons.push(existing.id);
                personIds.push(existing.id);
                console.log(`[Purifier] Linked to existing person: ${existing.name}`);
            } else {
                // Create new person
                const saved = await storage.create('persons', {
                    name: p.name,
                    type: p.type,
                    role: p.role || 'Unknown',
                    notes: `Auto-extracted from ${source}`,
                    tags: ['auto-extracted'],
                    interactions: 1,
                    lastSeen: new Date().toISOString()
                });
                result.savedIds.persons.push(saved.id);
                personIds.push(saved.id);
                console.log(`[Purifier] Created new person: ${saved.name}`);
            }
        }

        // 4. Process Intents (link to existing or create new)
        for (const i of entities.intents) {
            const existing = await findSimilarIntent(i.title, i.description);

            if (existing) {
                // Update existing intent with new information
                if (i.description && i.description.length > (existing.description || '').length) {
                    existing.description = i.description;
                }
                // Merge tags
                const newTags = [...new Set([...(existing.tags || []), ...(i.tags || [])])];
                existing.tags = newTags;
                // Update priority if higher
                const priorityLevels = { low: 1, medium: 2, high: 3 };
                if (priorityLevels[i.priority] > priorityLevels[existing.priority || 'low']) {
                    existing.priority = i.priority;
                }
                existing.updatedAt = new Date().toISOString();
                await storage.update('intents', existing.id, existing);
                result.linked.intents.push(existing.id);
                result.updated.intents.push(existing.id);
                console.log(`[Purifier] Updated existing intent: ${existing.title}`);

                // Create person-intent relations
                for (const personId of personIds) {
                    const relation = await storage.create('relations', {
                        sourceType: 'person',
                        sourceId: personId,
                        targetType: 'intent',
                        targetId: existing.id,
                        label: 'mentioned in',
                        context: text,
                        createdAt: new Date().toISOString()
                    });
                    result.savedIds.relations.push(relation.id);
                }
            } else {
                // Create new intent
                const saved = await storage.create('intents', {
                    title: i.title,
                    description: i.description,
                    stage: i.stage,
                    stageHistory: [{
                        stage: i.stage,
                        timestamp: new Date().toISOString(),
                        note: `Auto-extracted via Purifier Daemon (weight: ${weight})`
                    }],
                    tags: i.tags,
                    parentId: null,
                    priority: i.priority || 'medium',
                    active: true,
                    confidence: weight
                });
                result.savedIds.intents.push(saved.id);
                console.log(`[Purifier] Created new intent: ${saved.title}`);

                // Create person-intent relations
                for (const personId of personIds) {
                    const relation = await storage.create('relations', {
                        sourceType: 'person',
                        sourceId: personId,
                        targetType: 'intent',
                        targetId: saved.id,
                        label: 'mentioned in',
                        context: text,
                        createdAt: new Date().toISOString()
                    });
                    result.savedIds.relations.push(relation.id);
                }
            }
        }
    }

    // 4. Log the action (demonstrates the pipeline working)
    console.log(`[Purifier] Processed input from ${source}. Weight: ${weight} -> ${result.action}`);

    return result;
}
