/**
 * Onboarding Routes — Sample Data Generation for First-Time Users
 * Provides API endpoints to populate the system with example data
 */

import { Router } from 'express';
import * as storage from '../storage.js';
import { randomUUID as uuidv4 } from 'crypto';

const router = Router();

/**
 * Generate sample data for onboarding
 * Creates persons, intents, relations, and thinking chains
 */
async function generateSampleData() {
    const data = {
        persons: [],
        intents: [],
        relations: [],
        thinkingChains: [],
        cognitiveStages: [],
        trajectories: []
    };

    // Sample Persons
    const selfPerson = await storage.create('persons', {
        name: 'You',
        type: 'self',
        role: 'Knowledge Seeker',
        bio: 'This is your digital representation in the Self Kernel.'
    });
    data.persons.push(selfPerson);

    const mentorPerson = await storage.create('persons', {
        name: 'Alex Chen',
        type: 'mentor',
        role: 'Tech Advisor',
        bio: 'Senior engineer who guides technical decisions.'
    });
    data.persons.push(mentorPerson);

    const investorPerson = await storage.create('persons', {
        name: 'Sarah Martinez',
        type: 'investor',
        role: 'Angel Investor',
        bio: 'Early-stage investor interested in AI applications.'
    });
    data.persons.push(investorPerson);

    // Sample Intents
    const intent1 = await storage.create('intents', {
        title: 'Build personal automation system',
        description: 'Create a system that handles repetitive tasks automatically, starting with email sorting.',
        tags: ['automation', 'productivity', 'MVP'],
        priority: 'high',
        confidence: 0.85,
        stage: 'STRUCTURING',
        parent: null
    });
    data.intents.push(intent1);

    const intent2 = await storage.create('intents', {
        title: 'Research AI agent frameworks',
        description: 'Investigate OpenClaw, AutoGPT, and other agent frameworks for feasibility.',
        tags: ['research', 'AI', 'agents'],
        priority: 'medium',
        confidence: 0.65,
        stage: 'EXPLORATION',
        parent: intent1.id
    });
    data.intents.push(intent2);

    const intent3 = await storage.create('intents', {
        title: 'Learn about RAT patterns',
        description: 'Understand Retrieval-Augmented Trajectory for learning from past successes.',
        tags: ['learning', 'AI', 'patterns'],
        priority: 'medium',
        confidence: 0.70,
        stage: 'EXPLORATION',
        parent: intent1.id
    });
    data.intents.push(intent3);

    const intent4 = await storage.create('intents', {
        title: 'Pitch to investors',
        description: 'Prepare pitch deck and demo for Series A fundraising round.',
        tags: ['fundraising', 'pitch', 'milestone'],
        priority: 'high',
        confidence: 0.90,
        stage: 'DECISION',
        parent: null
    });
    data.intents.push(intent4);

    // Sample Relations
    const relation1 = await storage.create('relations', {
        sourceType: 'person',
        sourceId: mentorPerson.id,
        targetType: 'intent',
        targetId: intent1.id,
        label: 'advises on'
    });
    data.relations.push(relation1);

    const relation2 = await storage.create('relations', {
        sourceType: 'person',
        sourceId: mentorPerson.id,
        targetType: 'intent',
        targetId: intent2.id,
        label: 'suggested'
    });
    data.relations.push(relation2);

    const relation3 = await storage.create('relations', {
        sourceType: 'person',
        sourceId: investorPerson.id,
        targetType: 'intent',
        targetId: intent4.id,
        label: 'interested in'
    });
    data.relations.push(relation3);

    // Sample Thinking Chain
    const thinkingChain = await storage.create('thinking-chains', {
        contextIntentId: intent1.id,
        summary: 'Breaking down automation system into phases',
        thoughts: [
            {
                id: uuidv4(),
                text: 'Start with simple email automation - high ROI, low complexity',
                timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
                id: uuidv4(),
                text: 'Need to learn about AI agent patterns first - Alex recommended OpenClaw',
                timestamp: new Date(Date.now() - 1800000).toISOString()
            },
            {
                id: uuidv4(),
                text: 'RAT patterns could help reuse successful strategies from past projects',
                timestamp: new Date().toISOString()
            }
        ]
    });
    data.thinkingChains.push(thinkingChain);

    // Link thinking chain to intent
    await storage.create('relations', {
        sourceType: 'intent',
        sourceId: intent1.id,
        targetType: 'thinking-chain',
        targetId: thinkingChain.id,
        label: 'analyzed in'
    });

    // Sample Cognitive Stage (current week)
    const cognitiveStage = await storage.create('cognitive-stages', {
        week: new Date().toISOString().split('T')[0],
        dominantStage: 'STRUCTURING',
        stageDistribution: {
            EXPLORATION: 0.25,
            STRUCTURING: 0.45,
            DECISION: 0.20,
            EXECUTION: 0.10,
            REFLECTION: 0.00
        },
        clarity: 0.78,
        energy: 0.82,
        summary: 'Actively organizing knowledge and forming plans. High energy week with good focus.'
    });
    data.cognitiveStages.push(cognitiveStage);

    // Sample Trajectory
    const trajectory = await storage.create('trajectories', {
        label: 'Path to Personal AI Assistant',
        description: 'Journey from concept to working automation system',
        milestones: [
            {
                id: uuidv4(),
                label: 'Research phase',
                intentId: intent2.id,
                completed: false,
                position: { x: 0, y: 0 }
            },
            {
                id: uuidv4(),
                label: 'MVP development',
                intentId: intent1.id,
                completed: false,
                position: { x: 1, y: 0 }
            },
            {
                id: uuidv4(),
                label: 'Investor demo',
                intentId: intent4.id,
                completed: false,
                position: { x: 2, y: 0 }
            }
        ],
        successRate: 0
    });
    data.trajectories.push(trajectory);

    // Sample MCP logs
    await storage.create('mcp-logs', {
        agentId: 'system',
        type: 'ONBOARDING',
        intentId: null,
        details: 'Sample data generated for new user onboarding'
    });

    return data;
}

/**
 * POST /api/onboarding/generate-samples
 * Generate sample data for first-time users
 */
router.post('/generate-samples', async (req, res) => {
    try {
        // Check if database already has data
        const existingIntents = await storage.listAll('intents');
        const existingPersons = await storage.listAll('persons');

        if (existingIntents.length > 0 || existingPersons.length > 1) {
            return res.status(400).json({
                error: 'Database already contains data. Clear existing data first.',
                hint: 'Use /api/onboarding/clear to reset, or skip sample generation.'
            });
        }

        const data = await generateSampleData();

        res.json({
            success: true,
            message: 'Sample data generated successfully',
            summary: {
                persons: data.persons.length,
                intents: data.intents.length,
                relations: data.relations.length,
                thinkingChains: data.thinkingChains.length,
                cognitiveStages: data.cognitiveStages.length,
                trajectories: data.trajectories.length
            },
            data
        });
    } catch (error) {
        console.error('[Onboarding] Failed to generate sample data:', error);
        res.status(500).json({
            error: 'Failed to generate sample data',
            details: error.message
        });
    }
});

/**
 * POST /api/onboarding/clear
 * Clear all data (for testing/reset)
 */
router.post('/clear', async (req, res) => {
    try {
        const collections = [
            'persons',
            'intents',
            'relations',
            'thinking-chains',
            'cognitive-stages',
            'trajectories',
            'mcp-logs',
            'rat-patterns',
            'suggestions',
            'governance-rules'
        ];

        const results = {};
        for (const collection of collections) {
            const items = await storage.listAll(collection);
            for (const item of items) {
                await storage.deleteItem(collection, item.id);
            }
            results[collection] = items.length;
        }

        res.json({
            success: true,
            message: 'All data cleared',
            itemsDeleted: results
        });
    } catch (error) {
        console.error('[Onboarding] Failed to clear data:', error);
        res.status(500).json({
            error: 'Failed to clear data',
            details: error.message
        });
    }
});

/**
 * GET /api/onboarding/status
 * Check if user is new (no data) or returning (has data)
 */
router.get('/status', async (req, res) => {
    try {
        const intents = await storage.listAll('intents');
        const persons = await storage.listAll('persons');
        const relations = await storage.listAll('relations');

        const isNew = intents.length === 0 && persons.length <= 1 && relations.length === 0;

        res.json({
            isNew,
            dataExists: !isNew,
            counts: {
                intents: intents.length,
                persons: persons.length,
                relations: relations.length
            }
        });
    } catch (error) {
        console.error('[Onboarding] Failed to check status:', error);
        res.status(500).json({
            error: 'Failed to check onboarding status',
            details: error.message
        });
    }
});

export default router;
