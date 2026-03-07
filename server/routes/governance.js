/**
 * Governance Execution & Monitoring Routes
 *
 * Provides API endpoints for:
 * - Real-time governance execution monitoring
 * - Rule evaluation logs
 * - Auto-approval statistics
 * - Manual overrides and testing
 */

import { Router } from 'express';
import * as storage from '../storage.js';
import * as governanceEngine from '../services/governanceEngine.js';

const router = Router();

/**
 * GET /api/governance/stats
 * Get governance execution statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await governanceEngine.getGovernanceStats();
        res.json(stats);
    } catch (error) {
        console.error('[Governance] Failed to get stats:', error);
        res.status(500).json({
            error: 'Failed to retrieve governance statistics',
            details: error.message
        });
    }
});

/**
 * GET /api/governance/logs
 * Get recent governance execution logs
 */
router.get('/logs', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const logs = await storage.listAll('governance-logs');

        // Sort by timestamp descending
        const sorted = logs.sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        ).slice(0, limit);

        res.json({
            total: logs.length,
            limit,
            logs: sorted
        });
    } catch (error) {
        console.error('[Governance] Failed to get logs:', error);
        res.status(500).json({
            error: 'Failed to retrieve governance logs',
            details: error.message
        });
    }
});

/**
 * POST /api/governance/test-rule/:ruleId
 * Test a rule against current suggestions without executing
 */
router.post('/test-rule/:ruleId', async (req, res) => {
    try {
        const { ruleId } = req.params;
        const testResult = await governanceEngine.testRule(ruleId);

        res.json({
            success: true,
            test: testResult
        });
    } catch (error) {
        console.error('[Governance] Rule test failed:', error);
        res.status(500).json({
            error: 'Failed to test rule',
            details: error.message
        });
    }
});

/**
 * POST /api/governance/execute-auto-approved
 * Manually trigger execution of auto-approved suggestions
 * (useful for testing or batch processing)
 */
router.post('/execute-auto-approved', async (req, res) => {
    try {
        const suggestions = await storage.listAll('suggestions');
        const pending = suggestions.filter(s => s.status === 'pending');

        const results = {
            evaluated: 0,
            autoApproved: 0,
            executed: [],
            failed: []
        };

        for (const suggestion of pending) {
            results.evaluated++;

            const evaluation = await governanceEngine.evaluateSuggestion(suggestion);

            if (evaluation.shouldAutoExecute) {
                results.autoApproved++;

                const execution = await governanceEngine.executeAutomatedAction(
                    suggestion,
                    evaluation.matchedRules
                );

                if (execution.success) {
                    results.executed.push({
                        suggestionId: suggestion.id,
                        rules: evaluation.matchedRules.map(r => r.name)
                    });
                } else {
                    results.failed.push({
                        suggestionId: suggestion.id,
                        error: execution.error
                    });
                }
            }
        }

        res.json({
            success: true,
            results
        });
    } catch (error) {
        console.error('[Governance] Execution failed:', error);
        res.status(500).json({
            error: 'Failed to execute auto-approved suggestions',
            details: error.message
        });
    }
});

/**
 * GET /api/governance/audit-trail
 * Get full audit trail from kernel metadata
 */
router.get('/audit-trail', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 100;
        const meta = await storage.getMeta();
        const auditLog = meta.governanceAuditLog || [];

        const sorted = auditLog.slice(-limit).reverse();

        res.json({
            total: auditLog.length,
            limit,
            trail: sorted
        });
    } catch (error) {
        console.error('[Governance] Failed to get audit trail:', error);
        res.status(500).json({
            error: 'Failed to retrieve audit trail',
            details: error.message
        });
    }
});

/**
 * POST /api/governance/override/:suggestionId
 * Manually override governance decision
 */
router.post('/override/:suggestionId', async (req, res) => {
    try {
        const { suggestionId } = req.params;
        const { action, reason } = req.body; // action: 'approve' | 'reject'

        const suggestion = await storage.getById('suggestions', suggestionId);
        if (!suggestion) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }

        // Log the manual override
        await storage.create('governance-logs', {
            suggestionId,
            ruleId: null,
            ruleName: 'Manual Override',
            action,
            reasoning: [reason || 'User manual override'],
            autoApproved: false,
            manualOverride: true,
            timestamp: new Date().toISOString()
        });

        // Update suggestion status
        await storage.update('suggestions', suggestionId, {
            status: action === 'approve' ? 'accepted' : 'rejected',
            manualOverride: true,
            overrideReason: reason,
            overrideAt: new Date().toISOString()
        });

        res.json({
            success: true,
            suggestion: {
                id: suggestionId,
                action,
                reason
            }
        });
    } catch (error) {
        console.error('[Governance] Override failed:', error);
        res.status(500).json({
            error: 'Failed to override suggestion',
            details: error.message
        });
    }
});

/**
 * DELETE /api/governance/logs
 * Clear governance logs (for testing/reset)
 */
router.delete('/logs', async (req, res) => {
    try {
        const logs = await storage.listAll('governance-logs');

        for (const log of logs) {
            await storage.deleteItem('governance-logs', log.id);
        }

        // Also clear audit trail from metadata
        const meta = await storage.getMeta();
        meta.governanceAuditLog = [];
        await storage.saveMeta(meta);

        res.json({
            success: true,
            deleted: logs.length
        });
    } catch (error) {
        console.error('[Governance] Failed to clear logs:', error);
        res.status(500).json({
            error: 'Failed to clear governance logs',
            details: error.message
        });
    }
});

export default router;
