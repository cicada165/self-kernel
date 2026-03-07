#!/usr/bin/env node
/**
 * Demo Data Generator — Comprehensive Sample Data for Testing & Demos
 * Generates realistic data across all collections for testing automation workflows
 */

import * as storage from '../server/storage.js';
import { randomUUID as uuidv4 } from 'crypto';

/**
 * Generate comprehensive demo data
 */
async function generateDemoData() {
    console.log('🔄 Generating comprehensive demo data...\n');

    const data = {
        persons: [],
        intents: [],
        relations: [],
        thinkingChains: [],
        cognitiveStages: [],
        trajectories: [],
        ratPatterns: [],
        executionPayloads: [],
        governanceRules: [],
        suggestions: []
    };

    // 1. PERSONS
    console.log('👥 Creating persons...');
    const selfPerson = await storage.create('persons', {
        name: 'You',
        type: 'self',
        role: 'Builder & Learner',
        bio: 'Building a personal AI that learns from your patterns and helps you achieve goals.'
    });
    data.persons.push(selfPerson);

    const mentorPerson = await storage.create('persons', {
        name: 'Dr. Emma Rodriguez',
        type: 'mentor',
        role: 'AI Research Advisor',
        bio: 'PhD in Machine Learning, specializes in autonomous agents and cognitive architectures.'
    });
    data.persons.push(mentorPerson);

    const investorPerson = await storage.create('persons', {
        name: 'Michael Zhang',
        type: 'investor',
        role: 'Venture Partner',
        bio: 'Early-stage investor focused on AI productivity tools. Portfolio includes 20+ startups.'
    });
    data.persons.push(investorPerson);

    const peerPerson = await storage.create('persons', {
        name: 'Jordan Lee',
        type: 'peer',
        role: 'Fellow Developer',
        bio: 'Full-stack engineer working on similar automation projects. Great sounding board.'
    });
    data.persons.push(peerPerson);

    console.log(`  ✅ Created ${data.persons.length} persons`);

    // 2. INTENTS (realistic hierarchy)
    console.log('\n🎯 Creating intents...');

    const parentIntent1 = await storage.create('intents', {
        title: 'Build Personal AI Assistant',
        description: 'Create a system that learns from my patterns and automates repetitive tasks, starting with email management and calendar scheduling.',
        tags: ['automation', 'AI', 'productivity', 'MVP'],
        priority: 'high',
        confidence: 0.88,
        stage: 'EXECUTION',
        parent: null
    });
    data.intents.push(parentIntent1);

    const childIntent1 = await storage.create('intents', {
        title: 'Implement email triage system',
        description: 'Auto-categorize emails using RAT patterns from past successful filtering.',
        tags: ['email', 'automation', 'RAT'],
        priority: 'high',
        confidence: 0.92,
        stage: 'EXECUTION',
        parent: parentIntent1.id
    });
    data.intents.push(childIntent1);

    const childIntent2 = await storage.create('intents', {
        title: 'Research OpenClaw integration',
        description: 'Investigate how to connect Self Kernel with OpenClaw for task execution.',
        tags: ['research', 'OpenClaw', 'integration'],
        priority: 'medium',
        confidence: 0.75,
        stage: 'STRUCTURING',
        parent: parentIntent1.id
    });
    data.intents.push(childIntent2);

    const parentIntent2 = await storage.create('intents', {
        title: 'Prepare investor pitch',
        description: 'Create compelling demo and pitch deck for Series A fundraising round. Target: $2M raise.',
        tags: ['fundraising', 'pitch', 'milestone'],
        priority: 'high',
        confidence: 0.85,
        stage: 'DECISION',
        parent: null
    });
    data.intents.push(parentIntent2);

    const childIntent3 = await storage.create('intents', {
        title: 'Build product demo video',
        description: 'Record 3-minute demo showing email automation and learning capabilities.',
        tags: ['demo', 'video', 'marketing'],
        priority: 'medium',
        confidence: 0.70,
        stage: 'STRUCTURING',
        parent: parentIntent2.id
    });
    data.intents.push(childIntent3);

    const explorationIntent = await storage.create('intents', {
        title: 'Learn about RAT pattern matching',
        description: 'Deep dive into Retrieval-Augmented Trajectory for pattern reuse and learning.',
        tags: ['learning', 'AI', 'patterns', 'research'],
        priority: 'medium',
        confidence: 0.65,
        stage: 'EXPLORATION',
        parent: parentIntent1.id
    });
    data.intents.push(explorationIntent);

    const reflectionIntent = await storage.create('intents', {
        title: 'Review last sprint outcomes',
        description: 'Analyze what worked well and what needs improvement from the previous development cycle.',
        tags: ['reflection', 'review', 'learning'],
        priority: 'low',
        confidence: 0.60,
        stage: 'REFLECTION',
        parent: null
    });
    data.intents.push(reflectionIntent);

    console.log(`  ✅ Created ${data.intents.length} intents`);

    // 3. RELATIONS
    console.log('\n🔗 Creating relations...');

    await storage.create('relations', {
        sourceType: 'person',
        sourceId: mentorPerson.id,
        targetType: 'intent',
        targetId: parentIntent1.id,
        label: 'advises on architecture'
    });

    await storage.create('relations', {
        sourceType: 'person',
        sourceId: mentorPerson.id,
        targetType: 'intent',
        targetId: explorationIntent.id,
        label: 'suggested research topic'
    });

    await storage.create('relations', {
        sourceType: 'person',
        sourceId: investorPerson.id,
        targetType: 'intent',
        targetId: parentIntent2.id,
        label: 'interested in funding'
    });

    await storage.create('relations', {
        sourceType: 'person',
        sourceId: peerPerson.id,
        targetType: 'intent',
        targetId: childIntent2.id,
        label: 'collaborating on'
    });

    await storage.create('relations', {
        sourceType: 'intent',
        sourceId: parentIntent1.id,
        targetType: 'intent',
        targetId: childIntent1.id,
        label: 'parent'
    });

    console.log('  ✅ Created 5 relations');

    // 4. THINKING CHAINS
    console.log('\n💭 Creating thinking chains...');

    const thinkingChain1 = await storage.create('thinking-chains', {
        contextIntentId: parentIntent1.id,
        summary: 'Evolution of automation strategy',
        thoughts: [
            {
                id: uuidv4(),
                text: 'Email is the highest-leverage starting point - I spend 2 hours/day on it',
                timestamp: new Date(Date.now() - 86400000 * 3).toISOString()
            },
            {
                id: uuidv4(),
                text: 'Emma suggested looking at RAT patterns - could reuse my existing email filters',
                timestamp: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
                id: uuidv4(),
                text: 'OpenClaw integration would let me execute the automation without manual intervention',
                timestamp: new Date(Date.now() - 86400000).toISOString()
            },
            {
                id: uuidv4(),
                text: 'Need to balance sophistication vs. simplicity for investor demo',
                timestamp: new Date().toISOString()
            }
        ]
    });
    data.thinkingChains.push(thinkingChain1);

    await storage.create('relations', {
        sourceType: 'intent',
        sourceId: parentIntent1.id,
        targetType: 'thinking-chain',
        targetId: thinkingChain1.id,
        label: 'analyzed in'
    });

    console.log(`  ✅ Created ${data.thinkingChains.length} thinking chains`);

    // 5. COGNITIVE STAGES (4 weeks of history)
    console.log('\n🧠 Creating cognitive stages...');

    const now = new Date();
    for (let weekOffset = 3; weekOffset >= 0; weekOffset--) {
        const weekDate = new Date(now.getTime() - weekOffset * 7 * 86400000);
        const weekString = weekDate.toISOString().split('T')[0];

        const stages = ['EXPLORATION', 'STRUCTURING', 'DECISION', 'EXECUTION', 'REFLECTION'];
        const dominantStage = stages[Math.floor((3 - weekOffset) * 1.5) % stages.length];

        const cogStage = await storage.create('cognitive-stages', {
            week: weekString,
            dominantStage,
            stageDistribution: {
                EXPLORATION: weekOffset === 3 ? 0.50 : 0.20,
                STRUCTURING: weekOffset === 2 ? 0.45 : 0.25,
                DECISION: weekOffset === 1 ? 0.40 : 0.20,
                EXECUTION: weekOffset === 0 ? 0.50 : 0.20,
                REFLECTION: 0.15
            },
            clarity: 0.65 + (3 - weekOffset) * 0.08,
            energy: 0.70 + Math.random() * 0.15,
            summary: weekOffset === 0 ? 'High execution mode - implementing key features' :
                     weekOffset === 1 ? 'Decision phase - finalizing architecture choices' :
                     weekOffset === 2 ? 'Structuring knowledge - organizing research findings' :
                     'Exploration phase - researching AI agent patterns'
        });
        data.cognitiveStages.push(cogStage);
    }

    console.log(`  ✅ Created ${data.cognitiveStages.length} cognitive stages`);

    // 6. TRAJECTORIES
    console.log('\n🛤️  Creating trajectories...');

    const trajectory1 = await storage.create('trajectories', {
        label: 'MVP to Production',
        description: 'Journey from prototype to investor-ready product',
        milestones: [
            {
                id: uuidv4(),
                label: 'Research & Planning',
                intentId: explorationIntent.id,
                completed: true,
                position: { x: 0, y: 0 }
            },
            {
                id: uuidv4(),
                label: 'Core Development',
                intentId: parentIntent1.id,
                completed: false,
                position: { x: 1, y: 0 }
            },
            {
                id: uuidv4(),
                label: 'Demo & Pitch',
                intentId: parentIntent2.id,
                completed: false,
                position: { x: 2, y: 0 }
            }
        ],
        successRate: 0.33
    });
    data.trajectories.push(trajectory1);

    console.log(`  ✅ Created ${data.trajectories.length} trajectories`);

    // 7. RAT PATTERNS (successful execution patterns)
    console.log('\n🎯 Creating RAT patterns...');

    const ratPattern1 = await storage.create('rat-patterns', {
        context: 'Email triage automation for newsletter categorization',
        action: 'Filter emails by sender domain and subject keywords',
        outcome: 'Successfully categorized 95% of newsletters automatically',
        tags: ['email', 'automation', 'filtering'],
        confidence: 0.95,
        tools: ['gmail-api', 'keyword-matcher'],
        entities: ['newsletter', 'sender-domain'],
        executionTime: 120,
        timestamp: new Date(Date.now() - 86400000 * 7).toISOString(),
        reuseCount: 5
    });
    data.ratPatterns.push(ratPattern1);

    const ratPattern2 = await storage.create('rat-patterns', {
        context: 'Calendar scheduling for recurring meetings',
        action: 'Auto-schedule based on past successful time slots',
        outcome: 'Zero conflicts, 100% attendance rate improvement',
        tags: ['calendar', 'automation', 'scheduling'],
        confidence: 0.88,
        tools: ['google-calendar-api', 'time-optimizer'],
        entities: ['meeting', 'time-slot'],
        executionTime: 90,
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        reuseCount: 3
    });
    data.ratPatterns.push(ratPattern2);

    const ratPattern3 = await storage.create('rat-patterns', {
        context: 'Task prioritization based on energy levels',
        action: 'Schedule deep work during high-energy hours (9-11am)',
        outcome: 'Productivity increased by 40% on complex tasks',
        tags: ['productivity', 'optimization', 'energy'],
        confidence: 0.82,
        tools: ['task-scheduler', 'energy-tracker'],
        entities: ['deep-work', 'energy-level'],
        executionTime: 60,
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        reuseCount: 8
    });
    data.ratPatterns.push(ratPattern3);

    console.log(`  ✅ Created ${data.ratPatterns.length} RAT patterns`);

    // 8. EXECUTION PAYLOADS (staged tasks)
    console.log('\n⚡ Creating execution payloads...');

    const payload1 = await storage.create('execution-payloads', {
        intentId: childIntent1.id,
        task: 'Filter and categorize incoming emails from last 24 hours',
        context: {
            targetFolder: 'Newsletters',
            confidence: 0.92,
            ratPredictions: {
                similarPatterns: [ratPattern1.id],
                expectedDuration: 120,
                confidenceBoost: 0.08
            }
        },
        tools: ['gmail-api', 'keyword-matcher'],
        confidence: 0.92,
        staged: true,
        timestamp: new Date().toISOString()
    });
    data.executionPayloads.push(payload1);

    const payload2 = await storage.create('execution-payloads', {
        intentId: childIntent1.id,
        task: 'Schedule weekly team sync based on availability patterns',
        context: {
            attendees: ['Jordan Lee', 'Dr. Emma Rodriguez'],
            confidence: 0.85,
            ratPredictions: {
                similarPatterns: [ratPattern2.id],
                expectedDuration: 90,
                confidenceBoost: 0.05
            }
        },
        tools: ['google-calendar-api', 'time-optimizer'],
        confidence: 0.85,
        staged: true,
        timestamp: new Date().toISOString()
    });
    data.executionPayloads.push(payload2);

    console.log(`  ✅ Created ${data.executionPayloads.length} execution payloads`);

    // 9. GOVERNANCE RULES
    console.log('\n⚖️  Creating governance rules...');

    const rule1 = await storage.create('governance-rules', {
        name: 'Auto-approve high-confidence RAT patterns',
        description: 'Automatically execute suggestions based on proven RAT patterns with >90% confidence',
        conditions: {
            suggestionType: 'trajectory-pattern',
            minConfidence: 0.90,
            requiresRATMatch: true
        },
        action: 'auto-approve',
        enabled: true,
        priority: 1
    });
    data.governanceRules.push(rule1);

    const rule2 = await storage.create('governance-rules', {
        name: 'Review before investor contact',
        description: 'Always require manual approval for any communication with investors',
        conditions: {
            tags: ['investor', 'fundraising', 'pitch'],
            personTypes: ['investor']
        },
        action: 'require-approval',
        enabled: true,
        priority: 0
    });
    data.governanceRules.push(rule2);

    const rule3 = await storage.create('governance-rules', {
        name: 'Auto-stage low-priority tasks',
        description: 'Stage low-priority automations without interrupting flow',
        conditions: {
            priority: 'low',
            minConfidence: 0.70
        },
        action: 'stage-only',
        enabled: true,
        priority: 2
    });
    data.governanceRules.push(rule3);

    console.log(`  ✅ Created ${data.governanceRules.length} governance rules`);

    // 10. SUGGESTIONS (Intent Proxy history)
    console.log('\n💡 Creating suggestions...');

    const suggestion1 = await storage.create('suggestions', {
        type: 'trajectory-pattern',
        title: 'Based on past success, schedule deep work session',
        reasoning: 'Your energy is typically highest at 9am, and RAT pattern shows 40% productivity boost',
        confidence: 0.88,
        priority: 'high',
        action: {
            type: 'create-intent',
            params: {
                title: 'Deep work: Architecture design',
                stage: 'EXECUTION',
                tags: ['deep-work', 'architecture']
            }
        },
        status: 'accepted',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        acceptedAt: new Date(Date.now() - 43200000).toISOString()
    });
    data.suggestions.push(suggestion1);

    const suggestion2 = await storage.create('suggestions', {
        type: 'person-influence',
        title: 'Follow up with Emma on RAT implementation',
        reasoning: 'Emma previously advised on automation patterns, and you\'re now implementing similar work',
        confidence: 0.75,
        priority: 'medium',
        action: {
            type: 'create-intent',
            params: {
                title: 'Discuss RAT implementation with Emma',
                stage: 'STRUCTURING',
                tags: ['meeting', 'mentor']
            }
        },
        status: 'pending',
        timestamp: new Date().toISOString()
    });
    data.suggestions.push(suggestion2);

    console.log(`  ✅ Created ${data.suggestions.length} suggestions`);

    // 11. MCP LOGS
    console.log('\n📝 Creating MCP logs...');
    await storage.create('mcp-logs', {
        agentId: 'demo-generator',
        type: 'DATA_GENERATION',
        intentId: null,
        details: 'Comprehensive demo data generated for testing and demonstrations'
    });

    console.log('  ✅ Created MCP log entry');

    return data;
}

/**
 * Main execution
 */
async function main() {
    try {
        console.log('╔════════════════════════════════════════╗');
        console.log('║  Self Kernel Demo Data Generator      ║');
        console.log('╚════════════════════════════════════════╝\n');

        // Check if data already exists
        const existingIntents = await storage.listAll('intents');
        if (existingIntents.length > 0) {
            console.log('⚠️  Warning: Database already contains data.');
            console.log('   Run with --force to regenerate, or use /api/onboarding/clear first.\n');
            process.exit(1);
        }

        const data = await generateDemoData();

        console.log('\n╔════════════════════════════════════════╗');
        console.log('║  ✅ Demo Data Generated Successfully  ║');
        console.log('╚════════════════════════════════════════╝\n');

        console.log('📊 Summary:');
        console.log(`   • ${data.persons.length} persons`);
        console.log(`   • ${data.intents.length} intents`);
        console.log(`   • 5 relations`);
        console.log(`   • ${data.thinkingChains.length} thinking chains`);
        console.log(`   • ${data.cognitiveStages.length} cognitive stages`);
        console.log(`   • ${data.trajectories.length} trajectories`);
        console.log(`   • ${data.ratPatterns.length} RAT patterns`);
        console.log(`   • ${data.executionPayloads.length} execution payloads`);
        console.log(`   • ${data.governanceRules.length} governance rules`);
        console.log(`   • ${data.suggestions.length} suggestions`);
        console.log('\n✨ Your Self Kernel is now ready for testing!\n');

    } catch (error) {
        console.error('\n❌ Error generating demo data:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { generateDemoData };
