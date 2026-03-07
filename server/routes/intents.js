/**
 * Intent Routes — Manage Intent/Idea entities in the Self Kernel
 * Intents represent the user's goals, questions, explorations, and cognitive directions.
 * Each intent tracks its cognitive stage evolution.
 */

import { Router } from 'express';
import * as storage from '../storage.js';
import * as fsm from '../fsm.js';

import { checkTriggers } from '../services/fsm.js';

const router = Router();

// Valid cognitive stages
const STAGES = ['exploration', 'structuring', 'decision', 'execution', 'reflection'];

// GET /api/intents — list all intents
router.get('/', async (req, res) => {
    const intents = await storage.listAll('intents');
    // Sort by updatedAt desc
    intents.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(intents);
});

// GET /api/intents/:id — get one intent
router.get('/:id', async (req, res) => {
    const intent = await storage.getById('intents', req.params.id);
    if (!intent) return res.status(404).json({ error: 'Intent not found' });
    res.json(intent);
});

// POST /api/intents — create an intent
router.post('/', async (req, res) => {
    const { title, description, stage, tags, parentId, linkedPersons } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    try {
        const intent = await fsm.createIntent({
            title,
            description: description || '',
            stage: stage || fsm.STATES.EXPLORATION,
            tags: tags || [],
            parentId: parentId || null,
            linkedPersons: linkedPersons || [],
            priority: 'medium',
            active: true
        });
        res.status(201).json(intent);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create intent: ' + err.message });
    }
});

// PUT /api/intents/:id — update an intent
router.put('/:id', async (req, res) => {
    try {
        const existing = await storage.getById('intents', req.params.id);
        if (!existing) return res.status(404).json({ error: 'Intent not found' });

        // If stage is changing, add to stage history
        if (req.body.stage && req.body.stage !== existing.stage) {
            const history = existing.stageHistory || [];
            history.push({
                stage: req.body.stage,
                timestamp: new Date().toISOString(),
                note: req.body.stageNote || `Moved to ${req.body.stage}`
            });
            req.body.stageHistory = history;

            // Check FSM Triggers!
            // We run this async so it doesn't block the API response
            checkTriggers(req.params.id, existing.stage, req.body.stage).catch(err => {
                console.error('[FSM Error]', err);
            });
        }

        // Fetch fresh object in case FSM modified it (though now we modify req.body directly)
        // const fresh = await storage.getById('intents', req.params.id); // No longer needed as we're not using fsm.transitionState

        // Remove stage from body to not overwrite FSM logic
        const updates = { ...req.body };
        delete updates.stage; // Stage is handled by history, and we don't want to overwrite it directly
        delete updates.stageHistory; // History is already prepared in req.body.stageHistory

        const updated = await storage.update('intents', req.params.id, { ...existing, ...updates, updatedAt: new Date().toISOString(), stage: req.body.stage || existing.stage, stageHistory: req.body.stageHistory || existing.stageHistory });
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update intent: ' + err.message });
    }
});

// DELETE /api/intents/:id — delete an intent
router.delete('/:id', async (req, res) => {
    const removed = await storage.remove('intents', req.params.id);
    if (!removed) return res.status(404).json({ error: 'Intent not found' });
    res.status(204).send();
});

export default router;
