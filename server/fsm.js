/**
 * Self Kernel V3 — Predictive Engine (Phase 2)
 * 
 * Finite State Machine (FSM) & DAG Processor with Bayesian Updating
 * 
 * Manages Intent lifecycle through 4 formal states:
 * EXPLORATION, REFINING, REFUTED, DECISION
 * 
 * Propagates precision weights through the DAG and triggers execution 
 * at P > 0.95.
 */

import { randomUUID as uuidv4 } from 'crypto';
import * as storage from './storage.js';
import * as orchestrator from './orchestrator.js';

export const STATES = {
    EXPLORATION: 'EXPLORATION', // Brainstorming, collecting context
    REFINING: 'REFINING',       // Structuring, making connections
    REFUTED: 'REFUTED',         // Abandoned or proven wrong
    DECISION: 'DECISION'        // Ready for execution
};

const TRANSITIONS = {
    [STATES.EXPLORATION]: [STATES.REFINING, STATES.REFUTED, STATES.DECISION],
    [STATES.REFINING]: [STATES.EXPLORATION, STATES.DECISION, STATES.REFUTED],
    [STATES.REFUTED]: [STATES.EXPLORATION], // Can resurrect
    [STATES.DECISION]: [STATES.REFINING]    // Needs more work
};

export function validateTransition(currentStage, newStage) {
    if (currentStage === newStage) return true;
    return TRANSITIONS[currentStage]?.includes(newStage) || false;
}

export async function createIntent(data) {
    const intent = await storage.create('intents', {
        ...data,
        stage: data.stage || STATES.EXPLORATION,
        confidence: Number(data.precision) || 0.1, // Precision weight Prior
        stageHistory: [{
            stage: data.stage || STATES.EXPLORATION,
            timestamp: new Date().toISOString(),
            note: 'Intent created/identified'
        }]
    });
    return intent;
}

export async function transitionState(intentId, newState, reason) {
    const intent = await storage.getById('intents', intentId);
    if (!intent) throw new Error('Intent not found');

    if (!validateTransition(intent.stage, newState)) {
        throw new Error(`Invalid transition from ${intent.stage} to ${newState}`);
    }

    intent.stage = newState;
    intent.stageHistory.push({
        stage: newState,
        timestamp: new Date().toISOString(),
        note: reason || 'State transitioned via FSM'
    });

    // Forced confidence bounds for final states
    if (newState === STATES.DECISION) intent.confidence = Math.max(intent.confidence, 0.95);
    if (newState === STATES.REFUTED) intent.confidence = 0.0;

    await storage.update('intents', intentId, intent);

    // Trigger orchestrator if it hit Decision (threshold checked below)
    if (newState === STATES.DECISION) {
        orchestrator.enqueueForExecution(intent);
    }

    // Bubble up evidence to parent intents in the DAG
    await propagateWeightUpwards(intentId);

    return intent;
}

/**
 * Applies time-decay to intent confidence and prunes if it drops too low.
 */
export async function evaluateConfidence(intentId) {
    const intent = await storage.getById('intents', intentId);
    if (!intent) return null;
    if (intent.stage === STATES.DECISION || intent.stage === STATES.REFUTED) return intent; // Final states do not decay

    const lastUpdate = new Date(intent.updatedAt || intent.createdAt).getTime();
    const daysPassed = (Date.now() - lastUpdate) / (1000 * 60 * 60 * 24);

    if (daysPassed > 1) {
        // 5% decay per day
        intent.confidence *= Math.pow(0.95, daysPassed);
        await storage.update('intents', intentId, intent);
    }

    // Dynamic Pruning
    if (intent.confidence < 0.05 && intent.stage !== STATES.REFUTED) {
        return await transitionState(intentId, STATES.REFUTED, 'Archived due to low confidence (temporal decay)');
    }

    return intent;
}

/**
 * Bayesian State Updating based on new evidence precision.
 */
export async function addEvidence(intentId, precisionWeight) {
    const intent = await evaluateConfidence(intentId);
    if (!intent || intent.stage === STATES.DECISION || intent.stage === STATES.REFUTED) return intent;

    // Pseudo-Bayesian Update: Posterior = Prior + (Evidence * (1 - Prior))
    intent.confidence = intent.confidence + (precisionWeight * (1 - intent.confidence));
    await storage.update('intents', intentId, intent);

    console.log(`[Predictive Engine] Updated confidence for '${intent.title}' to ${intent.confidence.toFixed(3)}`);

    // Threshold Checks for state advancement
    if (intent.confidence >= 0.95 && intent.stage !== STATES.DECISION) {
        await transitionState(intentId, STATES.DECISION, 'Confidence exceeded P>0.95 execution threshold');
    } else if (intent.confidence >= 0.70 && intent.stage === STATES.EXPLORATION) {
        await transitionState(intentId, STATES.REFINING, 'Confidence exceeded P>0.70 refinement threshold');
    }

    return intent;
}

async function propagateWeightUpwards(childIntentId) {
    const child = await evaluateConfidence(childIntentId);
    if (!child) return;

    // Find all relations where this intent is the target (i.e. it is a child of another intent)
    const allRelations = await storage.listAll('relations');
    const parentRelations = allRelations.filter(r =>
        r.targetType === 'intent' && r.targetId === childIntentId && r.sourceType === 'intent'
    );

    for (const rel of parentRelations) {
        // Parent receives evidence weighted by the reliability of the edge and the child's posterior
        const edgeWeight = rel.weight || 0.5;
        await addEvidence(rel.sourceId, child.confidence * edgeWeight);
    }
}
