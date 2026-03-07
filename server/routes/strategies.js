/**
 * Strategy Governance API Routes
 */

import express from 'express';
import * as governance from '../services/strategyGovernance.js';

const router = express.Router();

// List all strategies
router.get('/', async (req, res) => {
  try {
    const strategies = await governance.listStrategies();
    res.json(strategies);
  } catch (err) {
    console.error('Error listing strategies:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get a single strategy with explanation
router.get('/:id', async (req, res) => {
  try {
    const strategy = await governance.listStrategies();
    const found = strategy.find(s => s.id === req.params.id);
    if (!found) return res.status(404).json({ error: 'Strategy not found' });

    const explanation = governance.explainStrategy(found);
    res.json({ ...found, explanation });
  } catch (err) {
    console.error('Error getting strategy:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create a new strategy
router.post('/', async (req, res) => {
  try {
    const strategy = await governance.createStrategy(req.body);
    res.status(201).json(strategy);
  } catch (err) {
    console.error('Error creating strategy:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update a strategy
router.put('/:id', async (req, res) => {
  try {
    const strategy = await governance.updateStrategy(req.params.id, req.body);
    res.json(strategy);
  } catch (err) {
    console.error('Error updating strategy:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete a strategy
router.delete('/:id', async (req, res) => {
  try {
    await governance.deleteStrategy(req.params.id);
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting strategy:', err);
    res.status(400).json({ error: err.message });
  }
});

// Evaluate an action against strategies
router.post('/evaluate', async (req, res) => {
  try {
    const result = await governance.evaluateAction(req.body);
    res.json(result);
  } catch (err) {
    console.error('Error evaluating action:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
