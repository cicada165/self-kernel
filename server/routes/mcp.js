/**
 * MCP Server Interface — Self Kernel as a Model Context Protocol Server
 * 
 * This demonstrates how external LLMs, Agents, and Apps would query the
 * Personal Intelligence for user context, intents, and cognitive state.
 * 
 * In production, this would implement the full MCP specification.
 * For the prototype, it simulates the query interface and logs all access.
 */

import { Router } from 'express';
import * as storage from '../storage.js';
import * as orchestrator from '../orchestrator.js';

const router = Router();

// Simulated connected agents
const connectedAgents = [
    {
        id: 'agent-claude',
        name: 'Claude (Anthropic)',
        type: 'llm',
        status: 'connected',
        lastQuery: new Date(Date.now() - 120000).toISOString(),
        queriesTotal: 47,
        permissionLevel: 'full-context'
    },
    {
        id: 'agent-browser',
        name: 'Browser Extension',
        type: 'data-collector',
        status: 'connected',
        lastQuery: new Date(Date.now() - 30000).toISOString(),
        queriesTotal: 312,
        permissionLevel: 'write-intents'
    },
    {
        id: 'agent-openclaw',
        name: 'OpenClaw Executor',
        type: 'executor',
        status: 'idle',
        lastQuery: new Date(Date.now() - 3600000).toISOString(),
        queriesTotal: 15,
        permissionLevel: 'read-trajectories'
    },
    {
        id: 'agent-input-method',
        name: 'Cognitive Input Method',
        type: 'data-collector',
        status: 'connected',
        lastQuery: new Date(Date.now() - 5000).toISOString(),
        queriesTotal: 1024,
        permissionLevel: 'write-stages'
    }
];

// GET /api/mcp/status — MCP server status
router.get('/status', async (req, res) => {
    res.json({
        protocol: 'MCP/1.0',
        serverName: 'Self Kernel PI',
        status: 'active',
        connectedAgents,
        capabilities: [
            'context-retrieval',
            'intent-query',
            'cognitive-state',
            'relationship-graph',
            'trajectory-replay',
            'permission-management'
        ],
        outboundQueue: orchestrator.getExecutionQueue()
    });
});

// POST /api/mcp/context — an external agent queries for user context
router.post('/context', async (req, res) => {
    const { agentId, query, scope } = req.body;

    // Log the query
    await storage.create('mcp-logs', {
        agentId: agentId || 'unknown',
        type: 'context-query',
        query: query || '',
        scope: scope || 'general',
        timestamp: new Date().toISOString(),
        granted: true
    });

    // Return relevant context based on scope
    const [intents, persons, chains] = await Promise.all([
        storage.listAll('intents'),
        storage.listAll('persons'),
        storage.listAll('thinking-chains')
    ]);

    const activeIntents = intents.filter(i => i.active);
    const recentChains = chains.sort((a, b) =>
        new Date(b.updatedAt) - new Date(a.updatedAt)
    ).slice(0, 5);

    res.json({
        status: 'granted',
        context: {
            activeIntents: activeIntents.map(i => ({
                title: i.title,
                stage: i.stage,
                description: i.description
            })),
            cognitiveState: {
                primaryFocus: activeIntents[0]?.title || 'No active focus',
                stage: activeIntents[0]?.stage || 'idle',
                recentThinking: recentChains.map(c => c.title)
            },
            personCount: persons.length,
            intentCount: intents.length
        }
    });
});

// POST /api/mcp/intent — query specific intent information
router.post('/intent', async (req, res) => {
    const { agentId, intentId, detail } = req.body;

    await storage.create('mcp-logs', {
        agentId: agentId || 'unknown',
        type: 'intent-query',
        intentId,
        detail: detail || 'summary',
        timestamp: new Date().toISOString(),
        granted: true
    });

    if (intentId) {
        const intent = await storage.getById('intents', intentId);
        if (!intent) return res.status(404).json({ error: 'Intent not found' });
        res.json({ status: 'granted', intent });
    } else {
        const intents = await storage.listAll('intents');
        res.json({
            status: 'granted',
            intents: intents.map(i => ({
                id: i.id,
                title: i.title,
                stage: i.stage,
                active: i.active
            }))
        });
    }
});

// POST /api/mcp/query — generic query endpoint
router.post('/query', async (req, res) => {
    const { agentId, type, params } = req.body;

    await storage.create('mcp-logs', {
        agentId: agentId || 'unknown',
        type: 'generic-query',
        queryType: type,
        params,
        timestamp: new Date().toISOString(),
        granted: true
    });

    switch (type) {
        case 'cognitive-state': {
            const intents = await storage.listAll('intents');
            const stages = await storage.listAll('cognitive-stages');
            res.json({
                status: 'granted',
                cognitiveState: {
                    activeIntents: intents.filter(i => i.active).length,
                    stages: stages
                }
            });
            break;
        }
        case 'relationship-graph': {
            const relations = await storage.listAll('relations');
            res.json({ status: 'granted', relations });
            break;
        }
        case 'expression-profile': {
            res.json({
                status: 'granted',
                profile: {
                    formalityLevel: 0.65,
                    preferredStructure: 'analytical',
                    languageStyle: 'concise-technical',
                    topDomains: ['technology', 'AI', 'product-strategy'],
                    communicationPatterns: {
                        professional: 'structured, data-driven',
                        casual: 'exploratory, metaphor-rich',
                        brainstorming: 'rapid-fire, builds on others'
                    }
                }
            });
            break;
        }
        default:
            res.status(400).json({ error: `Unknown query type: ${type}` });
    }
});

// GET /api/mcp/logs — access log
router.get('/logs', async (req, res) => {
    const logs = await storage.listAll('mcp-logs');
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(logs.slice(0, 100));
});

export default router;
