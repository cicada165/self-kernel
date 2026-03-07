/**
 * FSM Trigger Engine
 * Monitors Intent stage transitions. When an Intent reaches 'execution',
 * it automatically generates an immutable Context Payload for OpenClaw.
 */

import * as storage from '../storage.js';

export async function checkTriggers(intentId, oldStage, newStage) {
    if (newStage === 'execution' && oldStage !== 'execution') {
        console.log(`[FSM Trigger] Intent ${intentId} reached execution stage. Generating payload.`);
        await generateExecutionPayload(intentId);
    }
}

async function generateExecutionPayload(intentId) {
    const intent = await storage.getById('intents', intentId);
    if (!intent) return;

    // Gather Context
    const allPersons = await storage.listAll('persons');
    const linkedPersons = allPersons.filter(p => (intent.linkedPersons || []).includes(p.id));

    // Determine standard constraints based on Trajectories/Kernel defaults
    const constraints = [
        "Operate within ~/Documents/Dev or ~/.../self-kernel paths exclusively.",
        "Do NOT install global npm packages without explicit permission.",
        "Do NOT send codebase contents to external APIs other than configured local/trusted models.",
        "Report progress directly into local markdown logs."
    ];

    const payload = {
        id: `exe-${Date.now()}`,
        intentId: intent.id,
        generatedAt: new Date().toISOString(),
        status: 'ready_for_openclaw',
        instruction: intent.title,
        details: intent.description,
        context: {
            involved_persons: linkedPersons.map(p => ({
                name: p.name,
                role: p.role || 'Unknown'
            }))
        },
        rat_constraints: constraints // Retrieval-Augmented Trajectory constraints
    };

    // Save the payload in a new collection
    await storage.create('execution-payloads', payload);
    console.log(`[FSM Trigger] Payload saved: ${payload.id}`);

    return payload;
}
