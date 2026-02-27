/**
 * Person Routes — Manage Person entities in the Self Kernel
 * Persons include: self, others (specific individuals), and digital twin/proxy identities.
 */

import { Router } from 'express';
import * as storage from '../storage.js';

const router = Router();

// GET /api/persons — list all persons
router.get('/', async (req, res) => {
    const persons = await storage.listAll('persons');
    res.json(persons);
});

// GET /api/persons/:id — get one person
router.get('/:id', async (req, res) => {
    const person = await storage.getById('persons', req.params.id);
    if (!person) return res.status(404).json({ error: 'Person not found' });
    res.json(person);
});

// POST /api/persons — create a person
router.post('/', async (req, res) => {
    const { name, type, role, notes, tags } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const person = await storage.create('persons', {
        name,
        type: type || 'other', // self | other | digital-twin
        role: role || '',
        notes: notes || '',
        tags: tags || [],
        interactions: 0,
        lastSeen: new Date().toISOString()
    });
    res.status(201).json(person);
});

// PUT /api/persons/:id — update a person
router.put('/:id', async (req, res) => {
    const updated = await storage.update('persons', req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Person not found' });
    res.json(updated);
});

// DELETE /api/persons/:id — delete a person
router.delete('/:id', async (req, res) => {
    const removed = await storage.remove('persons', req.params.id);
    if (!removed) return res.status(404).json({ error: 'Person not found' });
    res.status(204).send();
});

export default router;
