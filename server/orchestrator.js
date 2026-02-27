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

// The "Outbox" of tasks pushed to execution
const executionQueue = [];

export function buildExecutionPayload(intent, contextPersons = [], pastTransitions = []) {
    return {
        task_id: uuidv4(),
        intent_source_id: intent.id,
        directive: intent.title,
        parameters: intent.description,
        priority: intent.priority || 'medium',
        confidence_trigger: intent.confidence || 1.0,
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
        const executionPayload = buildExecutionPayload(intent, contextPersons, pastTransitions);

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
