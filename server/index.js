/**
 * Self Kernel — Server Entry Point
 * 
 * Your Personal Intelligence Core.
 * A local-first, white-box PI system exposed as an MCP-ready server.
 */

import express from 'express';
import cors from 'cors';
import { initStorage } from './storage.js';
import personsRouter from './routes/persons.js';
import intentsRouter from './routes/intents.js';
import relationsRouter from './routes/relations.js';
import kernelRouter from './routes/kernel.js';
import mcpRouter from './routes/mcp.js';
import ingestRouter from './routes/ingest.js';

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

// Start server
async function start() {
    await initStorage();
    app.listen(PORT, () => {
        console.log('');
        console.log('  ╔══════════════════════════════════════════╗');
        console.log('  ║                                          ║');
        console.log('  ║   🧠  Self Kernel — PI Server Active     ║');
        console.log('  ║                                          ║');
        console.log(`  ║   API:  http://localhost:${PORT}             ║`);
        console.log('  ║   MCP:  http://localhost:' + PORT + '/api/mcp      ║');
        console.log('  ║                                          ║');
        console.log('  ║   Your Personal Intelligence Core        ║');
        console.log('  ║   is now online.                         ║');
        console.log('  ║                                          ║');
        console.log('  ╚══════════════════════════════════════════╝');
        console.log('');
    });
}

start().catch(console.error);
