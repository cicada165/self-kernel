/**
 * Self Kernel — Proactive Orchestrator Layer
 * 
 * Monitors the Intent DAG. When an intent hits the DECISION FSM state,
 * it builds a context payload and "pushes" it to downstream execution agents 
 * (e.g., Openclaw interface) instead of waiting for user prompt.
 */

import { randomUUID as uuidv4 } from 'crypto';
import * as storage from './storage.js';

// The "Outbox" of tasks pushed to execution
const executionQueue = [];

/**
 * Triggered by the FSM when an Intent reaches DECISION state
 */
export async function enqueueForExecution(intent) {
    console.log(`[Orchestrator] Intent '${intent.title}' reached DECISION. Building execution payload...`);

    try {
        // 1. Gather Context (The DAG)
        const allRelations = await storage.listAll('relations');
        const allPersons = await storage.listAll('persons');

        // Find people related to this intent
        const relatedPersonIds = allRelations
            .filter(r => r.targetId === intent.id && r.sourceType === 'person')
            .map(r => r.sourceId);

        const contextPersons = allPersons.filter(p => relatedPersonIds.includes(p.id));

        // 2. Build the Payload for "Downstream Hands"
        const executionPayload = {
            task_id: uuidv4(),
            intent_source_id: intent.id,
            directive: intent.title,
            parameters: intent.description,
            priority: intent.priority || 'medium',
            context: {
                involved_entities: contextPersons.map(p => ({ role: p.role, name: p.name })),
                tags: intent.tags || [],
                kernel_timestamp: new Date().toISOString()
            },
            status: 'dispatched'
        };

        executionQueue.push(executionPayload);

        // 3. Log to Activity Feed (for Dashboard)
        await storage.create('mcp-logs', {
            agentId: 'openclaw-executor',
            type: 'PROACTIVE_DISPATCH',
            intentId: intent.id,
            details: `Kernel dynamically routed intent to executor: ${intent.title}`
        });

        console.log(`[Orchestrator] Successfully dispatched to Openclaw simulator: ${executionPayload.task_id}`);

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
