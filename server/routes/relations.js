/**
 * Relation Routes — Manage relationships between entities in the Self Kernel
 * Relations connect: person↔person, person↔intent, intent↔intent, intent↔thinking-chain
 */

import { Router } from 'express';
import * as storage from '../storage.js';

const router = Router();

// GET /api/relations — list all relations
router.get('/', async (req, res) => {
    const relations = await storage.listAll('relations');
    res.json(relations);
});

// GET /api/relations/:id — get one relation
router.get('/:id', async (req, res) => {
    const relation = await storage.getById('relations', req.params.id);
    if (!relation) return res.status(404).json({ error: 'Relation not found' });
    res.json(relation);
});

// POST /api/relations — create a relation
router.post('/', async (req, res) => {
    const { sourceType, sourceId, targetType, targetId, label, strength, context } = req.body;
    if (!sourceId || !targetId) {
        return res.status(400).json({ error: 'sourceId and targetId are required' });
    }
    const relation = await storage.create('relations', {
        sourceType: sourceType || 'person',  // person | intent | thinking-chain
        sourceId,
        targetType: targetType || 'intent',
        targetId,
        label: label || 'related-to',
        strength: strength || 0.5, // 0-1
        context: context || '',
        bidirectional: req.body.bidirectional ?? true
    });
    res.status(201).json(relation);
});

// PUT /api/relations/:id — update a relation
router.put('/:id', async (req, res) => {
    const updated = await storage.update('relations', req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Relation not found' });
    res.json(updated);
});

// DELETE /api/relations/:id — delete a relation
router.delete('/:id', async (req, res) => {
    const removed = await storage.remove('relations', req.params.id);
    if (!removed) return res.status(404).json({ error: 'Relation not found' });
    res.status(204).send();
});

// GET /api/relations/graph — full graph data for visualization
router.get('/graph/full', async (req, res) => {
    const [persons, intents, relations, chains] = await Promise.all([
        storage.listAll('persons'),
        storage.listAll('intents'),
        storage.listAll('relations'),
        storage.listAll('thinking-chains')
    ]);

    const nodes = [
        ...persons.map(p => ({ id: p.id, label: p.name, type: 'person', data: p })),
        ...intents.map(i => ({ id: i.id, label: i.title, type: 'intent', stage: i.stage, data: i })),
        ...chains.map(c => ({ id: c.id, label: c.title, type: 'thinking-chain', data: c }))
    ];

    const edges = relations.map(r => ({
        id: r.id,
        source: r.sourceId,
        target: r.targetId,
        label: r.label,
        strength: r.strength,
        sourceType: r.sourceType,
        targetType: r.targetType
    }));

    res.json({ nodes, edges });
});

export default router;
