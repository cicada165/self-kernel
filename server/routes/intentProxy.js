/**
 * Intent Proxy Routes — Proactive AI suggestions and governance
 */

import { Router } from 'express';
import * as storage from '../storage.js';
import * as intentProxy from '../services/intentProxy.js';
import * as governanceEngine from '../services/governanceEngine.js';

const router = Router();

// GET /api/intent-proxy/suggestions — get current proactive suggestions
router.get('/suggestions', async (req, res) => {
  try {
    const suggestions = await intentProxy.generateSuggestions();

    // Store and evaluate each suggestion against governance rules
    const processedSuggestions = [];
    const autoExecutedActions = [];

    for (const suggestion of suggestions) {
      // Store the suggestion
      const stored = await storage.create('suggestions', {
        ...suggestion,
        status: 'pending',
        generatedAt: new Date().toISOString()
      });

      // Evaluate against governance rules
      const evaluation = await governanceEngine.evaluateSuggestion(stored);

      // If rule matches for auto-approval, execute immediately
      if (evaluation.shouldAutoExecute) {
        const execution = await governanceEngine.executeAutomatedAction(stored, evaluation.matchedRules);

        autoExecutedActions.push({
          suggestionId: stored.id,
          suggestion: stored,
          execution,
          matchedRules: evaluation.matchedRules
        });

        // Update stored suggestion with execution result
        stored.status = execution.success ? 'auto-approved' : 'failed';
        stored.governanceEvaluation = evaluation;
        stored.executionResult = execution;
      } else {
        // Not auto-executed, add to pending list
        stored.governanceEvaluation = evaluation;
      }

      processedSuggestions.push(stored);
    }

    res.json({
      suggestions: processedSuggestions.filter(s => s.status === 'pending'),
      autoExecuted: autoExecutedActions,
      count: processedSuggestions.length,
      autoExecutedCount: autoExecutedActions.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/intent-proxy/suggestions/:id/accept — user accepts a suggestion
router.post('/suggestions/:id/accept', async (req, res) => {
  try {
    const suggestion = await storage.getById('suggestions', req.params.id);
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

    // Mark as accepted
    await storage.update('suggestions', req.params.id, { status: 'accepted' });

    // Execute the suggestion's action
    let result = null;
    if (suggestion.action.type === 'create-intent') {
      result = await storage.create('intents', {
        title: suggestion.action.title,
        description: `Auto-created from suggestion: ${suggestion.suggestion}`,
        stage: 'exploration',
        linkedPersons: suggestion.action.linkedPersons || [],
        tags: ['ai-suggested'],
        active: true
      });
    } else if (suggestion.action.type === 'update-intent') {
      result = await storage.update('intents', suggestion.action.intentId, {
        stage: suggestion.action.stage
      });
    }

    // Log the acceptance for learning
    await storage.create('mcp-logs', {
      agentId: 'intent-proxy',
      type: 'SUGGESTION_ACCEPTED',
      suggestionId: req.params.id,
      suggestionType: suggestion.type
    });

    res.json({ status: 'accepted', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/intent-proxy/suggestions/:id/reject — user rejects a suggestion
router.post('/suggestions/:id/reject', async (req, res) => {
  try {
    const suggestion = await storage.getById('suggestions', req.params.id);
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found' });

    await storage.update('suggestions', req.params.id, {
      status: 'rejected',
      rejectionReason: req.body.reason
    });

    // Log the rejection for learning
    await storage.create('mcp-logs', {
      agentId: 'intent-proxy',
      type: 'SUGGESTION_REJECTED',
      suggestionId: req.params.id,
      suggestionType: suggestion.type
    });

    res.json({ status: 'rejected' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intent-proxy/governance — get all governance rules
router.get('/governance', async (req, res) => {
  try {
    const rules = await storage.listAll('governance-rules');
    res.json(rules);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/intent-proxy/governance — create a new governance rule
router.post('/governance', async (req, res) => {
  try {
    const { name, description, suggestionType, minConfidence, intentStage, action } = req.body;

    if (!name || !action) {
      return res.status(400).json({ error: 'Name and action are required' });
    }

    const rule = await storage.create('governance-rules', {
      name,
      description: description || '',
      suggestionType: suggestionType || null,
      minConfidence: minConfidence || 0.8,
      intentStage: intentStage || null,
      action, // 'auto-approve' or 'require-approval'
      enabled: true
    });

    res.status(201).json(rule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/intent-proxy/governance/:id — update a governance rule
router.put('/governance/:id', async (req, res) => {
  try {
    const updated = await storage.update('governance-rules', req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Rule not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/intent-proxy/governance/:id — delete a governance rule
router.delete('/governance/:id', async (req, res) => {
  try {
    const deleted = await storage.remove('governance-rules', req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Rule not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intent-proxy/history — get suggestion history
router.get('/history', async (req, res) => {
  try {
    const suggestions = await storage.listAll('suggestions');
    suggestions.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt));
    res.json(suggestions.slice(0, 50)); // Last 50 suggestions
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/intent-proxy/governance/stats — get governance statistics
router.get('/governance/stats', async (req, res) => {
  try {
    const stats = await governanceEngine.getGovernanceStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/intent-proxy/governance/:id/test — test a governance rule
router.post('/governance/:id/test', async (req, res) => {
  try {
    const testResult = await governanceEngine.testRule(req.params.id);
    res.json(testResult);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
