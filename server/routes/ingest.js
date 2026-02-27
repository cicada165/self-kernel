import express from 'express';
import * as ingest from '../ingest.js';

const router = express.Router();

// POST /api/ingest
router.post('/', async (req, res) => {
    try {
        const { text, source } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text input is required' });
        }

        const result = await ingest.processRawInput(text, source || 'dashboard-quick-ingest');

        res.json(result);
    } catch (err) {
        console.error('[Route/Ingest] Error:', err);
        res.status(500).json({ error: err.message || 'Failed to process input' });
    }
});

export default router;
