/**
 * Self Kernel — Proactive Orchestrator Layer
 * 
 * Monitors the Intent DAG. When an intent hits the DECISION FSM state,
 * it builds a context payload and "pushes" it to downstream execution agents 
 * (e.g., Openclaw interface) instead of waiting for user prompt.
 */

import { randomUUID as uuidv4 } from 'crypto';
import * as storage from './storage.js';
import * as learning from './learning.js';
import * as rat from './services/rat.js';

// The "Outbox" of tasks pushed to execution
const executionQueue = [];

export function buildExecutionPayload(intent, contextPersons = [], pastTransitions = []) {
    // Calculate predictive confidence score
    const predictiveConfidence = calculatePredictiveConfidence(intent, contextPersons, pastTransitions);

    return {
        task_id: uuidv4(),
        intent_source_id: intent.id,
        directive: intent.title,
        parameters: intent.description,
        priority: intent.priority || 'medium',
        confidence_trigger: intent.confidence || 1.0,
        predictive_confidence: predictiveConfidence,
        context: {
            involved_entities: contextPersons.map(p => ({ role: p.role, name: p.name })),
            tags: intent.tags || [],
            predicted_tools: pastTransitions,
            kernel_timestamp: new Date().toISOString()
        },
        status: 'staged' // Lazy Handoff: requires approval
    };
}

/**
 * Calculate predictive confidence score for an execution payload
 * Considers multiple signals:
 * - Intent precision/confidence
 * - Historical success patterns
 * - Context completeness
 * - Stakeholder engagement
 * - Time-based factors
 *
 * Returns a score between 0 and 1
 */
function calculatePredictiveConfidence(intent, contextPersons, pastTransitions) {
    let confidence = 0;
    let weights = 0;

    // Signal 1: Intent's base confidence/precision (weight: 30%)
    const baseConfidence = intent.precision || intent.confidence || 0.5;
    confidence += baseConfidence * 0.30;
    weights += 0.30;

    // Signal 2: Completeness score (weight: 20%)
    // Check if intent has sufficient information
    const completenessScore = calculateCompletenessScore(intent);
    confidence += completenessScore * 0.20;
    weights += 0.20;

    // Signal 3: Stakeholder signal (weight: 15%)
    // More involved stakeholders = higher confidence
    const stakeholderScore = Math.min(1.0, contextPersons.length / 3); // 3+ stakeholders = max
    confidence += stakeholderScore * 0.15;
    weights += 0.15;

    // Signal 4: Historical trajectory evidence (weight: 20%)
    // If similar patterns existed, higher confidence
    const trajectoryScore = pastTransitions.length > 0 ? 0.8 : 0.3;
    confidence += trajectoryScore * 0.20;
    weights += 0.20;

    // Signal 5: Intent maturity (weight: 10%)
    // How long has this intent existed?
    const maturityScore = calculateMaturityScore(intent);
    confidence += maturityScore * 0.10;
    weights += 0.10;

    // Signal 6: Stage progression velocity (weight: 5%)
    // Did intent move through stages quickly (good) or slowly (uncertain)?
    const velocityScore = intent.stage === 'execution' ? 0.9 :
                         intent.stage === 'decision' ? 0.7 :
                         intent.stage === 'structuring' ? 0.5 : 0.3;
    confidence += velocityScore * 0.05;
    weights += 0.05;

    // Normalize
    const finalConfidence = weights > 0 ? confidence / weights : 0.5;

    return Math.max(0, Math.min(1, finalConfidence)); // Clamp to [0, 1]
}

/**
 * Calculate completeness score based on intent metadata
 */
function calculateCompletenessScore(intent) {
    let score = 0;

    // Has title (required)
    if (intent.title && intent.title.length > 5) score += 0.2;

    // Has description (important)
    if (intent.description && intent.description.length > 20) score += 0.3;

    // Has tags (helps with pattern matching)
    if (intent.tags && intent.tags.length > 0) score += 0.2;

    // Has priority set
    if (intent.priority && intent.priority !== 'unknown') score += 0.1;

    // Has parent or children (part of hierarchy)
    if (intent.parent || (intent.children && intent.children.length > 0)) score += 0.2;

    return Math.min(1.0, score);
}

/**
 * Calculate maturity score based on intent age and updates
 */
function calculateMaturityScore(intent) {
    if (!intent.createdAt) return 0.5;

    const now = Date.now();
    const created = new Date(intent.createdAt).getTime();
    const ageInDays = (now - created) / (1000 * 60 * 60 * 24);

    // Sweet spot: 1-7 days (enough time to mature, not too stale)
    if (ageInDays < 0.5) return 0.3; // Too new, might be premature
    if (ageInDays >= 0.5 && ageInDays <= 7) return 0.9; // Optimal maturity
    if (ageInDays > 7 && ageInDays <= 30) return 0.7; // Getting older
    if (ageInDays > 30) return 0.5; // Stale, might need refresh

    return 0.5;
}

/**
 * Triggered by the FSM when an Intent reaches DECISION state
 */
export async function enqueueForExecution(intent) {
    const params = await learning.getSystemParameters();

    if ((intent.confidence || 0) < params.executionThreshold) {
        console.log(`[Orchestrator] Intent '${intent.title}' reached DECISION but confidence ${(intent.confidence || 0).toFixed(2)} < ${params.executionThreshold.toFixed(2)}. Waiting for more evidence.`);
        return;
    }

    console.log(`[Orchestrator] Intent '${intent.title}' reached P>${params.executionThreshold.toFixed(2)}. Building proactive execution payload...`);

    try {
        // 1. Gather Context (The DAG)
        const allRelations = await storage.listAll('relations');
        const allPersons = await storage.listAll('persons');

        // Find people related to this intent
        const relatedPersonIds = allRelations
            .filter(r => r.targetId === intent.id && r.sourceType === 'person')
            .map(r => r.sourceId);

        const contextPersons = allPersons.filter(p => relatedPersonIds.includes(p.id));

        // 1.5 Transition Matrix Modeling
        const trajectories = await storage.listAll('trajectories');
        const pastTransitions = [];
        for (const t of trajectories) {
            const idx = t.milestones.findIndex(m => m.intentId === intent.id);
            if (idx >= 0 && idx < t.milestones.length - 1) {
                // predict next steps based on historical trajectory
                pastTransitions.push(t.milestones[idx + 1].label);
            }
        }

        // 2. Build the Payload for "Downstream Hands"
        let executionPayload = buildExecutionPayload(intent, contextPersons, pastTransitions);

        // 2.5 Enhance payload with RAT (Retrieval-Augmented Trajectory) predictions
        executionPayload = await rat.enhancePayloadWithRAT(executionPayload);

        executionQueue.push(executionPayload);

        // 3. Log to Activity Feed (for Dashboard)
        await storage.create('mcp-logs', {
            agentId: 'openclaw-executor',
            type: 'PROACTIVE_STAGE',
            intentId: intent.id,
            details: `Kernel generated staged payload for Openclaw (P=${intent.confidence.toFixed(2)})`
        });

        console.log(`[Orchestrator] Successfully staged payload for Openclaw approval: ${executionPayload.task_id}`);

    } catch (err) {
        console.error(`[Orchestrator] Failed to execute intent ${intent.id}:`, err);
    }
}

/**
 * Returns the current outbox / execution status
 */
export function getExecutionQueue() {
    return executionQueue;
}

export function removeFromExecutionQueue(taskId) {
    const idx = executionQueue.findIndex(t => t.task_id === taskId);
    if (idx !== -1) {
        executionQueue.splice(idx, 1);
    }
}
