/**
 * System Routes — Data validation, backups, and health checks
 */

import { Router } from 'express';
import * as validation from '../services/validation.js';

const router = Router();

// GET /api/system/health — comprehensive system health check
router.get('/health', async (req, res) => {
    try {
        const integrityReport = await validation.checkIntegrity();

        const health = {
            status: integrityReport.healthy ? 'healthy' : 'issues-detected',
            timestamp: integrityReport.timestamp,
            database: {
                totalFiles: integrityReport.summary.totalFiles,
                validFiles: integrityReport.summary.validFiles,
                invalidFiles: integrityReport.summary.invalidFiles,
                healthPercentage: integrityReport.summary.totalFiles > 0
                    ? Math.round((integrityReport.summary.validFiles / integrityReport.summary.totalFiles) * 100)
                    : 100
            },
            collections: Object.entries(integrityReport.collections).map(([name, data]) => ({
                name,
                totalFiles: data.totalFiles,
                validFiles: data.validFiles,
                invalidFiles: data.invalidFiles,
                issuesCount: data.issues?.length || 0
            }))
        };

        res.json(health);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/system/validate/:collection — validate specific collection
router.get('/validate/:collection', async (req, res) => {
    try {
        const report = await validation.validateCollection(req.params.collection);
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/system/repair/:collection — repair data in collection
router.post('/repair/:collection', async (req, res) => {
    try {
        const dryRun = req.query.dryRun === 'true';
        const report = await validation.repairCollection(req.params.collection, dryRun);
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/system/backup — create a new backup
router.post('/backup', async (req, res) => {
    try {
        const result = await validation.createBackup();
        res.status(201).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/system/backups — list all backups
router.get('/backups', async (req, res) => {
    try {
        const backups = await validation.listBackups();
        res.json({ backups, count: backups.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/system/restore/:backupId — restore from backup
router.post('/restore/:backupId', async (req, res) => {
    try {
        const result = await validation.restoreBackup(req.params.backupId);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/system/integrity — full integrity check
router.get('/integrity', async (req, res) => {
    try {
        const report = await validation.checkIntegrity();
        res.json(report);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
