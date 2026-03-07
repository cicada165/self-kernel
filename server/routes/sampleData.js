/**
 * Sample Data Generator Routes
 */

import express from 'express';
import {
    generateSampleData,
    getAvailableScenarios,
    clearAllData
} from '../services/sampleDataGenerator.js';

const router = express.Router();

/**
 * GET /api/sample-data/scenarios
 * List available sample data scenarios
 */
router.get('/scenarios', (req, res) => {
    const scenarios = getAvailableScenarios();
    res.json({ scenarios });
});

/**
 * POST /api/sample-data/generate
 * Generate sample data for a specific scenario
 * Body: { scenario: string, clearExisting?: boolean }
 */
router.post('/generate', async (req, res) => {
    try {
        const { scenario = 'startup-founder', clearExisting = true } = req.body;
        const result = await generateSampleData(scenario, clearExisting);
        res.json({
            success: true,
            message: `Generated ${scenario} scenario`,
            result
        });
    } catch (error) {
        console.error('Sample data generation error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/sample-data/clear
 * Clear all existing data
 */
router.delete('/clear', async (req, res) => {
    try {
        const deleted = await clearAllData();
        res.json({
            success: true,
            message: `Cleared ${deleted} items`,
            deleted
        });
    } catch (error) {
        console.error('Clear data error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
