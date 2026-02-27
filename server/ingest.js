/**
 * Self Kernel — Ingestion & Auto-Annotator Layer
 * 
 * Takes raw unstructured input (like voice memos or quick notes),
 * and uses an LLM to extract structured Persons, Topics, Context,
 * and relational weight.
 */

import { randomUUID as uuidv4 } from 'crypto';
import * as storage from './storage.js';
import * as fsm from './fsm.js';
import * as anomaly from './anomaly.js';

// Since we cannot install openai/huggingface SDKs due to env permissions,
// we interface with the GitHub Models API directly using fetch.
const OMNI_URL = 'http://0.0.0.0:4000/chat/completions';
const MODEL_NAME = 'anthropic/claude-3-5-sonnet-latest';

const SYSTEM_PROMPT = `You are the Auto-Annotator for a Personal Intelligence Core (Self Kernel).
Your job is to read unstructured raw input from the user (e.g., voice memos, quick thoughts) and extract structured entities.

Return ONLY a valid JSON object with the following schema, and absolutely no markdown formatting or extra text:

{
  "persons": [
    {
      "name": "Full name or identifier",
      "role": "Inferred role or context (e.g., 'mentor', 'investor', 'friend')",
      "confidence": 0-1
    }
  ],
  "intents": [
    {
      "title": "A short, actionable title for the intent/idea",
      "description": "A 1-2 sentence description of what the user is thinking/planning",
      "stage": "EXPLORATION" | "REFINING" | "REFUTED" | "DECISION" (Choose the best fit),
      "priority": "low" | "medium" | "high" | "critical",
      "precision": 0.0-1.0 (A confidence score of how clearly and seriously the user articulated this intent),
      "tags": ["tag1", "tag2"]
    }
  ],
  "relations": [
    {
      "sourcePersonName": "Name from persons array, or 'Self'",
      "targetIntentTitle": "Title from intents array",
      "label": "How they relate (e.g., 'advising', 'building')",
      "weight": 0-1 (0.8+ for strong connection/care, 0.4 for casual)
    }
  ],
  "summary": "1 sentence summarizing the core thought"
}`;

/**
 * Process a raw input string and store the resulting entities and relationships.
 */
export async function processRawInput(rawText, source = 'text-input') {
    console.log(`[Ingest] Processing raw input from ${source} (${rawText.length} chars)`);

    // 1. Calculate Anomaly Score
    const anomalyResult = await anomaly.calculateAnomalyScore(rawText);
    await anomaly.updateBaseline(rawText);

    if (!anomalyResult.isNovel) {
        console.log(`[Ingest] Input deemed ROUTINE (score: ${anomalyResult.score.toFixed(2)}). Bypassing LLM.`);
        const intent = await fsm.createIntent({
            title: rawText.substring(0, 40) + (rawText.length > 40 ? '...' : ''),
            description: rawText,
            priority: 'low',
            tags: ['routine', 'auto-ingest']
        });
        await storage.create('mcp-logs', {
            agentId: 'system-anomaly-filter',
            type: 'ROUTINE_LOG',
            intentId: intent.id,
            details: `Routine input logged directly (Score: ${anomalyResult.score.toFixed(2)})`
        });
        return { message: "Routine input logged directly", anomalyScore: anomalyResult.score, intentId: intent.id };
    }

    console.log(`[Ingest] Input deemed NOVEL (score: ${anomalyResult.score.toFixed(2)}). Routing to LLM Auto-Annotator.`);

    // 2. Call LLM to extract entities
    const response = await fetch(OMNI_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer sk-dummy-key'
        },
        body: JSON.stringify({
            messages: [
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: rawText }
            ],
            model: MODEL_NAME,
            temperature: 0.1,
            response_format: { type: 'json_object' }
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`LLM API Error: ${response.status} ${errText}`);
    }

    const data = await response.json();
    let extracted;
    try {
        extracted = JSON.parse(data.choices[0].message.content);
    } catch (e) {
        throw new Error('Failed to parse LLM JSON output');
    }

    console.log('[Ingest] Extracted entities:', Object.keys(extracted));

    // 2. Persist to storage and build the DAG
    const results = {
        personsCreated: 0,
        intentsCreated: 0,
        relationsCreated: 0,
        thoughtNodeId: null
    };

    const selfNode = (await storage.listAll('persons')).find(p => p.type === 'self');
    const selfId = selfNode ? selfNode.id : 'p-self-001';

    // Map to hold temp names to actual DB IDs
    const personMap = { 'Self': selfId, 'Me': selfId };
    const intentMap = {};

    // Find or create Persons
    if (extracted.persons) {
        for (const p of extracted.persons) {
            if (personMap[p.name]) continue;

            // Simple lookup to avoid exact duplicates
            const existing = (await storage.listAll('persons')).find(ex => ex.name.toLowerCase() === p.name.toLowerCase());

            if (existing) {
                personMap[p.name] = existing.id;
            } else {
                const created = await storage.create('persons', {
                    name: p.name,
                    role: p.role || 'Extracted from ingest',
                    type: 'other',
                    interactions: 1,
                    tags: ['auto-ingest']
                });
                personMap[p.name] = created.id;
                results.personsCreated++;
            }
        }
    }

    // Find or create Intents
    if (extracted.intents) {
        for (const i of extracted.intents) {
            // Create Intent directly (we assume auto-annotated intents are new exploratory nodes in the DAG)
            const created = await fsm.createIntent({
                title: i.title,
                description: i.description,
                stage: i.stage || 'EXPLORATION',
                priority: i.priority || 'medium',
                precision: i.precision || 0.3,
                tags: i.tags || [],
                source: 'auto-annotator'
            });
            intentMap[i.title] = created.id;
            results.intentsCreated++;
        }
    }

    // Create Relations (Edges of the DAG)
    if (extracted.relations) {
        for (const r of extracted.relations) {
            const sourceId = personMap[r.sourcePersonName] || selfId;
            const targetId = intentMap[r.targetIntentTitle];

            if (sourceId && targetId) {
                await storage.create('relations', {
                    sourceType: 'person',
                    sourceId: sourceId,
                    targetType: 'intent',
                    targetId: targetId,
                    label: r.label || 'relates-to',
                    strength: r.weight || 0.5,
                    context: `Auto-extracted from: ${extracted.summary}`
                });
                results.relationsCreated++;
            }
        }
    }

    // Bind the raw thought into a generic "Inbox" thinking chain
    const existingChains = await storage.listAll('thinking-chains');
    let inboxChain = existingChains.find(c => c.title === 'Auto-Ingest Log');
    if (!inboxChain) {
        inboxChain = await storage.create('thinking-chains', {
            title: 'Auto-Ingest Log',
            description: 'Raw thoughts and memos processed by the Auto-Annotator',
            nodes: []
        });
    }

    const thoughtNode = {
        id: uuidv4(),
        content: rawText,
        summary: extracted.summary,
        timestamp: new Date().toISOString(),
        type: 'exploration',
        source,
        linkedIntents: Object.values(intentMap)
    };

    inboxChain.nodes.push(thoughtNode);
    await storage.update('thinking-chains', inboxChain.id, { nodes: inboxChain.nodes });
    results.thoughtNodeId = thoughtNode.id;

    return { success: true, results, extracted };
}
