/**
 * Kernel Routes — System-level endpoints for Self Kernel status and management
 */

import { Router } from 'express';
import * as storage from '../storage.js';

const router = Router();
const startTime = Date.now();

// GET /api/kernel/status — overall system health and stats
router.get('/status', async (req, res) => {
    const [meta, counts] = await Promise.all([
        storage.getKernelMeta(),
        storage.getCounts()
    ]);

    res.json({
        status: 'online',
        uptime: Math.floor((Date.now() - startTime) / 1000),
        kernel: meta,
        entities: counts,
        capabilities: [
            'intent-management',
            'cognitive-tracking',
            'relationship-modeling',
            'thinking-chains',
            'white-box-inspection',
            'mcp-interface'
        ],
        mcpServer: {
            status: 'active',
            protocol: 'MCP/1.0',
            endpoints: [
                '/api/mcp/context',
                '/api/mcp/intent',
                '/api/mcp/query'
            ]
        }
    });
});

// GET /api/kernel/activity — recent activity feed
router.get('/activity', async (req, res) => {
    const [intents, relations, chains] = await Promise.all([
        storage.listAll('intents'),
        storage.listAll('relations'),
        storage.listAll('thinking-chains')
    ]);

    // Build activity feed from all entities, sorted by updatedAt
    const activities = [];

    intents.forEach(i => {
        activities.push({
            type: 'intent',
            action: 'updated',
            entity: i.title,
            entityId: i.id,
            stage: i.stage,
            timestamp: i.updatedAt
        });
    });

    relations.forEach(r => {
        activities.push({
            type: 'relation',
            action: 'created',
            entity: r.label,
            entityId: r.id,
            timestamp: r.updatedAt || r.createdAt
        });
    });

    chains.forEach(c => {
        activities.push({
            type: 'thinking-chain',
            action: 'evolved',
            entity: c.title,
            entityId: c.id,
            timestamp: c.updatedAt
        });
    });

    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(activities.slice(0, 50));
});

// GET /api/kernel/inspect/:collection/:id — raw data inspector
router.get('/inspect/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    const data = await storage.getRawData(collection, id);
    if (!data) return res.status(404).json({ error: 'Entity not found' });
    res.json(data);
});

// PUT /api/kernel/inspect/:collection/:id — save raw data from inspector
router.put('/inspect/:collection/:id', async (req, res) => {
    const { collection, id } = req.params;
    try {
        const updated = await storage.saveRawData(collection, id, JSON.stringify(req.body));
        res.json(updated);
    } catch (e) {
        res.status(400).json({ error: 'Invalid JSON: ' + e.message });
    }
});

export default router;
