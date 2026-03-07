/**
 * Self Kernel — Server Entry Point
 * 
 * Your Personal Intelligence Core.
 * A local-first, white-box PI system exposed as an MCP-ready server.
 */

import express from 'express';
import cors from 'cors';
import http from 'http';
import { initStorage } from './storage.js';
import { initWebSocket } from './services/websocket.js';
import personsRouter from './routes/persons.js';
import intentsRouter from './routes/intents.js';
import relationsRouter from './routes/relations.js';
import kernelRouter from './routes/kernel.js';
import mcpRouter from './routes/mcp.js';
import ingestRouter from './routes/ingest.js';
import learningRouter from './routes/learning.js';
import inboxRouter from './routes/inbox.js';
import intentProxyRouter from './routes/intentProxy.js';
import strategiesRouter from './routes/strategies.js';
import openclawRouter from './routes/openclaw.js';
import onboardingRouter from './routes/onboarding.js';
import sampleDataRouter from './routes/sampleData.js';
import systemRouter from './routes/system.js';
import governanceRouter from './routes/governance.js';
import exportImportRouter from './routes/exportImport.js';
import validationRouter from './routes/validation.js';
import searchRouter from './routes/search.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (!req.url.includes('/api/mcp/logs')) { // avoid recursion
            console.log(`${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`);
        }
    });
    next();
});

// API Routes
app.use('/api/persons', personsRouter);
app.use('/api/intents', intentsRouter);
app.use('/api/relations', relationsRouter);
app.use('/api/kernel', kernelRouter);
app.use('/api/mcp', mcpRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/learning', learningRouter);
app.use('/api/inbox', inboxRouter);
app.use('/api/intent-proxy', intentProxyRouter);
app.use('/api/strategies', strategiesRouter);
app.use('/api/openclaw', openclawRouter);
app.use('/api/onboarding', onboardingRouter);
app.use('/api/sample-data', sampleDataRouter);
app.use('/api/system', systemRouter);
app.use('/api/export', exportImportRouter);
app.use('/api/governance', governanceRouter);
app.use('/api/validation', validationRouter);
app.use('/api/search', searchRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Thinking chains — simple CRUD
import * as storage from './storage.js';

app.get('/api/thinking-chains', async (req, res) => {
    const chains = await storage.listAll('thinking-chains');
    chains.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    res.json(chains);
});

app.get('/api/thinking-chains/:id', async (req, res) => {
    const chain = await storage.getById('thinking-chains', req.params.id);
    if (!chain) return res.status(404).json({ error: 'Thinking chain not found' });
    res.json(chain);
});

app.post('/api/thinking-chains', async (req, res) => {
    const chain = await storage.create('thinking-chains', req.body);
    res.status(201).json(chain);
});

// Trajectories — simple CRUD
app.get('/api/trajectories', async (req, res) => {
    const trajectories = await storage.listAll('trajectories');
    res.json(trajectories);
});

app.post('/api/trajectories', async (req, res) => {
    const trajectory = await storage.create('trajectories', req.body);
    res.status(201).json(trajectory);
});

app.put('/api/trajectories/:id', async (req, res) => {
    const updated = await storage.update('trajectories', req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Trajectory not found' });
    res.json(updated);
});

app.delete('/api/trajectories/:id', async (req, res) => {
    const deleted = await storage.remove('trajectories', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Trajectory not found' });
    res.status(204).send();
});

// Cognitive Stages — simple CRUD
app.get('/api/cognitive-stages', async (req, res) => {
    const stages = await storage.listAll('cognitive-stages');
    stages.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    res.json(stages);
});

// Execution Payloads
app.get('/api/execution-payloads', async (req, res) => {
    const payloads = await storage.listAll('execution-payloads');
    payloads.sort((a, b) => new Date(b.createdAt || b.generatedAt) - new Date(a.createdAt || a.generatedAt));
    res.json(payloads);
});

// Start server
async function start() {
    await initStorage();

    // Initialize strategy governance with defaults
    const { initStrategies } = await import('./services/strategyGovernance.js');
    await initStrategies();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket
    initWebSocket(server);

    server.listen(PORT, () => {
        console.log('');
        console.log('  ╔══════════════════════════════════════════╗');
        console.log('  ║                                          ║');
        console.log('  ║   🧠  Self Kernel — PI Server Active     ║');
        console.log('  ║                                          ║');
        console.log(`  ║   API:  http://localhost:${PORT}             ║`);
        console.log('  ║   MCP:  http://localhost:' + PORT + '/api/mcp      ║');
        console.log('  ║   WS:   ws://localhost:' + PORT + '/ws           ║');
        console.log('  ║                                          ║');
        console.log('  ║   Your Personal Intelligence Core        ║');
        console.log('  ║   is now online.                         ║');
        console.log('  ║                                          ║');
        console.log('  ╚══════════════════════════════════════════╝');
        console.log('');
    });
}

start().catch(console.error);
