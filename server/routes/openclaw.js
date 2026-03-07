/**
 * OpenClaw Integration Routes
 *
 * API contract for OpenClaw to fetch staged execution payloads,
 * submit feedback, and query RAT (Retrieval-Augmented Trajectory) patterns.
 */

import { Router } from 'express';
import * as storage from '../storage.js';
import * as orchestrator from '../orchestrator.js';
import * as rat from '../services/rat.js';

const router = Router();

// Execution history (completed payloads)
const executionHistory = [];

/**
 * GET /api/openclaw/staged
 * Returns all staged execution payloads waiting for OpenClaw approval
 */
router.get('/staged', async (req, res) => {
    const stagedPayloads = orchestrator.getExecutionQueue();
    res.json(stagedPayloads);
});

/**
 * GET /api/openclaw/executed
 * Returns execution history (completed/failed payloads)
 */
router.get('/executed', async (req, res) => {
    res.json(executionHistory);
});

/**
 * POST /api/openclaw/execute/:taskId
 * Mark a staged payload as being executed by OpenClaw
 * Body: { agentId: string (optional) }
 */
router.post('/execute/:taskId', async (req, res) => {
    const { taskId } = req.params;
    const { agentId } = req.body;

    const queue = orchestrator.getExecutionQueue();
    const payload = queue.find(p => p.task_id === taskId);

    if (!payload) {
        return res.status(404).json({ error: 'Payload not found in staged queue' });
    }

    // Update status and move to execution history
    payload.status = 'executing';
    payload.executedAt = new Date().toISOString();
    payload.executorAgent = agentId || 'openclaw';

    // Move to history
    executionHistory.unshift({ ...payload });

    // Remove from staged queue
    orchestrator.removeFromExecutionQueue(taskId);

    // Log to activity feed
    await storage.create('mcp-logs', {
        agentId: agentId || 'openclaw',
        type: 'EXECUTION_START',
        intentId: payload.intent_source_id,
        details: `OpenClaw began executing: ${payload.directive}`
    });

    res.json({
        success: true,
        message: 'Payload marked as executing',
        payload
    });
});

/**
 * POST /api/openclaw/reject/:taskId
 * Remove a staged payload from the queue (user rejected)
 */
router.post('/reject/:taskId', async (req, res) => {
    const { taskId } = req.params;

    const queue = orchestrator.getExecutionQueue();
    const payload = queue.find(p => p.task_id === taskId);

    if (!payload) {
        return res.status(404).json({ error: 'Payload not found in staged queue' });
    }

    // Mark as rejected and move to history
    payload.status = 'rejected';
    payload.rejectedAt = new Date().toISOString();
    executionHistory.unshift({ ...payload });

    // Remove from staged queue
    orchestrator.removeFromExecutionQueue(taskId);

    // Log rejection
    await storage.create('mcp-logs', {
        agentId: 'user',
        type: 'EXECUTION_REJECTED',
        intentId: payload.intent_source_id,
        details: `User rejected staged payload: ${payload.directive}`
    });

    res.json({
        success: true,
        message: 'Payload rejected and removed from queue'
    });
});

/**
 * POST /api/openclaw/feedback
 * Submit execution feedback (success/failure) to train the learning system
 * Body: { taskId: string, status: 'success'|'failure', feedback: string, duration_ms: number }
 */
router.post('/feedback', async (req, res) => {
    const { taskId, status, feedback, duration_ms } = req.body;

    if (!taskId || !status) {
        return res.status(400).json({ error: 'taskId and status are required' });
    }

    // Find the execution in history
    const execution = executionHistory.find(e => e.task_id === taskId);

    if (!execution) {
        return res.status(404).json({ error: 'Execution not found in history' });
    }

    // Update execution record
    execution.status = status;
    execution.feedback = feedback || '';
    execution.duration_ms = duration_ms || null;
    execution.completedAt = new Date().toISOString();

    // Submit reward signal to learning system
    const learning = await import('../learning.js');
    const rewardValue = status === 'success' ? 1.0 : -0.5;
    await learning.submitReward(taskId, rewardValue);

    // If successful, record in RAT for future pattern matching
    if (status === 'success') {
        await rat.recordSuccess(execution);
    }

    // Log to activity feed
    await storage.create('mcp-logs', {
        agentId: execution.executorAgent || 'openclaw',
        type: status === 'success' ? 'EXECUTION_SUCCESS' : 'EXECUTION_FAILURE',
        intentId: execution.intent_source_id,
        details: `Execution ${status}: ${execution.directive}${feedback ? ` — ${feedback}` : ''}`
    });

    res.json({
        success: true,
        message: 'Feedback recorded and learning system updated',
        execution
    });
});

/**
 * GET /api/openclaw/rat
 * Query RAT (Retrieval-Augmented Trajectory) for similar successful patterns
 * Query params: ?tags=tag1,tag2&context=description
 */
router.get('/rat', async (req, res) => {
    const { tags, context } = req.query;

    const tagsArray = tags ? tags.split(',') : [];
    const patterns = await rat.queryPatterns(tagsArray, context);

    res.json({
        query: { tags: tagsArray, context },
        patterns,
        count: patterns.length
    });
});

/**
 * GET /api/openclaw/status
 * Return OpenClaw integration status and stats
 */
router.get('/status', async (req, res) => {
    const stagedCount = orchestrator.getExecutionQueue().length;
    const executedCount = executionHistory.length;
    const successCount = executionHistory.filter(e => e.status === 'success').length;
    const failureCount = executionHistory.filter(e => e.status === 'failure').length;

    res.json({
        status: 'active',
        staged: stagedCount,
        executed: executedCount,
        success: successCount,
        failure: failureCount,
        successRate: executedCount > 0 ? (successCount / executedCount * 100).toFixed(1) : 0
    });
});

export default router;
