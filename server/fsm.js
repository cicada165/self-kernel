/**
 * Self Kernel — Finite State Machine (FSM) & DAG Processor
 * 
 * Manages Intent lifecycle through 4 formal states:
 * EXPLORATION, REFINING, REFUTED, DECISION
 * 
 * Propagates weight/confidence through the DAG to trigger execution.
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
    [STATES.EXPLORATION]: [STATES.REFINING, STATES.REFUTED],
    [STATES.REFINING]: [STATES.EXPLORATION, STATES.DECISION, STATES.REFUTED],
    [STATES.REFUTED]: [STATES.EXPLORATION], // Can resurrect
    [STATES.DECISION]: [STATES.REFINING]    // Needs more work
};

export async function createIntent(data) {
    const intent = await storage.create('intents', {
        ...data,
        stage: STATES.EXPLORATION,
        confidence: 0.1, // DAG weight out of 1.0
        stageHistory: [{
            stage: STATES.EXPLORATION,
            timestamp: new Date().toISOString(),
            note: 'Intent created/identified'
        }]
    });
    return intent;
}

export async function transitionState(intentId, newState, reason) {
    const intent = await storage.getById('intents', intentId);
    if (!intent) throw new Error('Intent not found');

    if (!TRANSITIONS[intent.stage]?.includes(newState) && intent.stage !== newState) {
        throw new Error(`Invalid transition from ${intent.stage} to ${newState}`);
    }

    intent.stage = newState;
    intent.stageHistory.push({
        stage: newState,
        timestamp: new Date().toISOString(),
        note: reason || 'State transitioned via FSM'
    });

    // Calculate new confidence based on DAG position and state
    intent.confidence = calculateDagConfidence(intent);

    await storage.update('intents', intentId, intent);

    // Trigger orchestrator if it hit Decision
    if (newState === STATES.DECISION) {
        orchestrator.enqueueForExecution(intent);
    }

    // Bubble up confidence to parent intents in the DAG
    await propagateWeightUpwards(intentId);

    return intent;
}

function calculateDagConfidence(intent) {
    if (intent.stage === STATES.DECISION) return 1.0;
    if (intent.stage === STATES.REFUTED) return 0.0;
    if (intent.stage === STATES.REFINING) return 0.7;
    return 0.3; // EXPLORATION
}

async function propagateWeightUpwards(childIntentId) {
    // Find all relations where this intent is the target (i.e. it is a child of another intent)
    const allRelations = await storage.listAll('relations');
    const parentRelations = allRelations.filter(r =>
        r.targetType === 'intent' && r.targetId === childIntentId && r.sourceType === 'intent'
    );

    for (const rel of parentRelations) {
        const parent = await storage.getById('intents', rel.sourceId);
        if (!parent || parent.stage === STATES.DECISION) continue;

        // Simple DAG rollup math: Parent gains confidence when children are decided
        const child = await storage.getById('intents', childIntentId);
        if (child && child.stage === STATES.DECISION) {
            // Automatic structure transition if enough children are decided
            if (parent.stage === STATES.EXPLORATION) {
                await transitionState(parent.id, STATES.REFINING, `Child intent '${child.title}' reached Decision`);
            }
        }
    }
}
