/**
 * Inbox Routes — Raw Data Ingestion Stream
 * Simulates high-frequency inputs from zero-friction channels like
 * Apple Watch, Keyboard Input Methods, or Browser Plugins.
 */

import { Router } from 'express';
import { processRawInput } from '../services/purifier.js';

const router = Router();

// POST /api/inbox — Submit raw thought/data stream
router.post('/', async (req, res) => {
    const { text, source } = req.body;
    if (!text) return res.status(400).json({ error: 'Text input is required' });

    try {
        // The Purifier Daemon processes it asynchronously and auto-labels
        const result = await processRawInput(text, source || 'unknown');
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
