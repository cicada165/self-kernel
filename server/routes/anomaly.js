/**
 * Anomaly Detection API Routes
 * Exposes baseline metrics and anomaly detection status
 */

import { Router } from 'express';
import * as anomaly from '../anomaly.js';
import * as storage from '../storage.js';

const router = Router();

/**
 * GET /api/anomaly/baseline
 * Returns current behavioral baseline metrics
 */
router.get('/baseline', async (req, res) => {
    try {
        const baseline = await anomaly.getBaseline();
        res.json({
            baseline,
            hasEnoughData: baseline.count >= 3,
            summary: {
                avgLength: Math.round(baseline.length.mean),
                avgHour: Math.round(baseline.hour.mean),
                samples: baseline.count
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/anomaly/recent
 * Returns recent anomaly scores from baseline collection
 */
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        // Get baseline to check if we have enough data
        const baseline = await anomaly.getBaseline();

        // For now, return baseline stats as we don't store individual anomaly scores
        // In future iterations, we could add an 'anomaly-logs' collection
        res.json({
            hasEnoughData: baseline.count >= 3,
            baseline: {
                count: baseline.count,
                lengthMean: baseline.length.mean,
                lengthVariance: baseline.length.variance,
                hourMean: baseline.hour.mean,
                hourVariance: baseline.hour.variance
            },
            message: "Anomaly detection active. Individual scores are logged but not persisted in this version."
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /api/anomaly/status
 * Returns anomaly detection system status
 */
router.get('/status', async (req, res) => {
    try {
        const baseline = await anomaly.getBaseline();
        const hasEnoughData = baseline.count >= 3;

        res.json({
            enabled: true,
            status: hasEnoughData ? 'active' : 'collecting',
            samplesCollected: baseline.count,
            samplesNeeded: 3,
            metrics: {
                length: {
                    mean: baseline.length.mean,
                    stdDev: Math.sqrt(baseline.length.variance)
                },
                hour: {
                    mean: baseline.hour.mean,
                    stdDev: Math.sqrt(baseline.hour.variance)
                }
            }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
