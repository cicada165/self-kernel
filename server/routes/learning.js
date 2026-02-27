import express from 'express';
import * as learning from '../learning.js';
import * as orchestrator from '../orchestrator.js';

const router = express.Router();

// Get current system parameters
router.get('/parameters', async (req, res) => {
    try {
        const params = await learning.getSystemParameters();
        res.json(params);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// Submit a reward signal for a staged task
router.post('/reward', async (req, res) => {
    try {
        const { taskId, reward } = req.body;
        if (!taskId || (reward !== 1 && reward !== -1)) {
            return res.status(400).json({ error: "taskId and reward (1 or -1) are required." });
        }

        // Apply learning
        const newParams = await learning.processReward(taskId, reward);

        // Remove from outbox (simulating execution or deletion)
        orchestrator.removeFromExecutionQueue(taskId);

        res.json({ success: true, newParameters: newParams });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;
