/**
 * Data Validation & Integrity Routes
 *
 * Provides endpoints for:
 * - Manual data validation
 * - Integrity verification
 * - Auto-repair functionality
 * - Validation reports
 */

import { Router } from 'express';
import * as storage from '../storage.js';
import * as validator from '../services/validator.js';

const router = Router();

/**
 * POST /api/validation/validate
 * Validate a data object against its collection schema
 */
router.post('/validate', async (req, res) => {
    try {
        const { collection, data } = req.body;

        if (!collection || !data) {
            return res.status(400).json({
                error: 'Missing required fields: collection and data'
            });
        }

        const result = validator.validate(collection, data);

        res.json({
            collection,
            valid: result.valid,
            errors: result.errors,
            warnings: result.warnings
        });
    } catch (error) {
        console.error('[Validation] Validation failed:', error);
        res.status(500).json({
            error: 'Validation failed',
            details: error.message
        });
    }
});

/**
 * POST /api/validation/repair
 * Attempt to repair data issues automatically
 */
router.post('/repair', async (req, res) => {
    try {
        const { collection, data } = req.body;

        if (!collection || !data) {
            return res.status(400).json({
                error: 'Missing required fields: collection and data'
            });
        }

        const repaired = validator.repair(collection, data);
        const validation = validator.validate(collection, repaired);

        res.json({
            collection,
            repaired,
            nowValid: validation.valid,
            remainingErrors: validation.errors,
            warnings: validation.warnings
        });
    } catch (error) {
        console.error('[Validation] Repair failed:', error);
        res.status(500).json({
            error: 'Repair failed',
            details: error.message
        });
    }
});

/**
 * GET /api/validation/integrity
 * Run full integrity check across all collections
 */
router.get('/integrity', async (req, res) => {
    try {
        const report = await validator.verifyIntegrity(storage);

        res.json({
            success: true,
            report,
            healthy: report.summary.totalIssues === 0
        });
    } catch (error) {
        console.error('[Validation] Integrity check failed:', error);
        res.status(500).json({
            error: 'Integrity check failed',
            details: error.message
        });
    }
});

/**
 * POST /api/validation/auto-repair
 * Automatically fix common integrity issues
 */
router.post('/auto-repair', async (req, res) => {
    try {
        // First, run integrity check
        const report = await validator.verifyIntegrity(storage);

        if (report.summary.totalIssues === 0) {
            return res.json({
                success: true,
                message: 'No issues found - system is healthy',
                report
            });
        }

        // Run auto-repair
        const repairResults = await validator.autoRepairIntegrity(storage, report);

        // Run integrity check again to verify
        const afterRepair = await validator.verifyIntegrity(storage);

        res.json({
            success: true,
            before: report.summary,
            repairs: repairResults,
            after: afterRepair.summary,
            resolved: report.summary.totalIssues - afterRepair.summary.totalIssues
        });
    } catch (error) {
        console.error('[Validation] Auto-repair failed:', error);
        res.status(500).json({
            error: 'Auto-repair failed',
            details: error.message
        });
    }
});

/**
 * GET /api/validation/health
 * Quick health check with basic statistics
 */
router.get('/health', async (req, res) => {
    try {
        const collections = [
            'persons',
            'intents',
            'relations',
            'thinking-chains',
            'cognitive-stages',
            'trajectories',
            'governance-rules',
            'suggestions',
            'rat-patterns',
            'execution-payloads'
        ];

        const health = {
            timestamp: new Date().toISOString(),
            collections: {},
            totalItems: 0,
            issues: []
        };

        for (const collection of collections) {
            try {
                const items = await storage.listAll(collection);
                health.collections[collection] = {
                    count: items.length,
                    healthy: true
                };
                health.totalItems += items.length;
            } catch (error) {
                health.collections[collection] = {
                    count: 0,
                    healthy: false,
                    error: error.message
                };
                health.issues.push({
                    collection,
                    error: error.message
                });
            }
        }

        health.overallHealthy = health.issues.length === 0;

        res.json(health);
    } catch (error) {
        console.error('[Validation] Health check failed:', error);
        res.status(500).json({
            error: 'Health check failed',
            details: error.message
        });
    }
});

/**
 * POST /api/validation/batch-validate
 * Validate all items in a collection
 */
router.post('/batch-validate/:collection', async (req, res) => {
    try {
        const { collection } = req.params;

        const items = await storage.listAll(collection);
        const results = {
            collection,
            total: items.length,
            valid: 0,
            invalid: 0,
            errors: []
        };

        for (const item of items) {
            const validation = validator.validate(collection, item);
            if (validation.valid) {
                results.valid++;
            } else {
                results.invalid++;
                results.errors.push({
                    id: item.id,
                    errors: validation.errors
                });
            }
        }

        res.json({
            success: true,
            results,
            allValid: results.invalid === 0
        });
    } catch (error) {
        console.error('[Validation] Batch validation failed:', error);
        res.status(500).json({
            error: 'Batch validation failed',
            details: error.message
        });
    }
});

export default router;
