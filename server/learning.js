/**
 * Self Kernel V3 — Predictive Engine (Phase 4)
 * 
 * Continuous Learning / Self-Supervised Loss
 * 
 * Modifies predictive parameters (e.g. novelty thresholds or confidence weights)
 * based on the user's explicit interaction with the Staged Execution Payloads.
 */

import * as storage from './storage.js';

// The Kernel meta object tracks the dynamic system thresholds
export async function getSystemParameters() {
    let meta = await storage.getById('', 'kernel-meta');

    // Initialize predictive parameters if missing
    if (!meta.parameters) {
        meta.parameters = {
            anomalyThreshold: 2.0,       // Z-score threshold (Phase 1)
            executionThreshold: 0.95,    // Confidence threshold (Phase 3)
            decayRate: 0.05              // Daily decay rate
        };
        await storage.update('', 'kernel-meta', meta);
    }
    return meta.parameters;
}

export async function processReward(taskId, rewardType) {
    // rewardType: 1 (Accepted), -1 (Rejected/Ignored)
    let meta = await storage.getById('', 'kernel-meta');
    let params = await getSystemParameters();

    // Learning Rate
    const alpha = 0.01;

    console.log(`[Predictive Engine] Received Reward Signal ${rewardType} for task ${taskId}`);

    if (rewardType === 1) {
        // User accepted: System made a good prediction.
        // We can slightly lower the execution threshold to be more proactive next time.
        params.executionThreshold = Math.max(0.85, params.executionThreshold - alpha);

        await storage.create('mcp-logs', {
            agentId: 'system-learning',
            type: 'POSITIVE_REWARD',
            details: `User executed staged payload. Execution threshold lowered to ${params.executionThreshold.toFixed(3)}.`
        });
    } else if (rewardType === -1) {
        // User rejected: System was too eager or annoying.
        // Raise the execution threshold, require more evidence before staging payloads.
        params.executionThreshold = Math.min(0.99, params.executionThreshold + (alpha * 2)); // Penalize faster

        await storage.create('mcp-logs', {
            agentId: 'system-learning',
            type: 'NEGATIVE_REWARD',
            details: `User rejected staged payload. Execution threshold raised to ${params.executionThreshold.toFixed(3)}.`
        });
    }

    meta.parameters = params;
    await storage.update('', 'kernel-meta', meta);
    return params;
}
