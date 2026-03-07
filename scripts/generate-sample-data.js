#!/usr/bin/env node
/**
 * Sample Data Generator for Self Kernel
 *
 * Creates realistic sample data for demos and testing across all collections.
 * Usage: node scripts/generate-sample-data.js [--clean]
 *
 * Options:
 *   --clean    Clear existing data before generating samples
 *   --minimal  Generate minimal dataset (faster, for quick tests)
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID as uuidv4 } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'database');

// Utilities
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomChoice(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

// Sample Data Templates
const SAMPLE_DATA = {
    persons: [
        {
            id: 'p-self-demo',
            type: 'self',
            name: 'Demo User',
            role: 'Founder & Product Designer',
            context: 'Building personal AI tools while exploring entrepreneurship',
            tags: ['self', 'founder', 'designer']
        },
        {
            id: 'p-mentor-demo',
            type: 'mentor',
            name: 'Dr. Emily Chen',
            role: 'AI Research Lead at Meta',
            context: 'Mentoring on AI product strategy and technical architecture',
            tags: ['mentor', 'ai', 'research']
        },
        {
            id: 'p-investor-demo',
            type: 'investor',
            name: 'James Park',
            role: 'Partner at Sequoia Capital',
            context: 'Interested in personal AI and productivity tools',
            tags: ['investor', 'vc', 'productivity']
        },
        {
            id: 'p-cofounder-demo',
            type: 'peer',
            name: 'Alex Rivera',
            role: 'CTO & Co-founder',
            context: 'Leading technical development and infrastructure',
            tags: ['cofounder', 'engineer', 'technical']
        },
        {
            id: 'p-user-demo',
            type: 'other',
            name: 'Sarah Thompson',
            role: 'Early Beta Tester',
            context: 'Product manager testing personal AI for work-life balance',
            tags: ['user', 'beta', 'feedback']
        }
    ],

    intents: [
        {
            id: 'i-launch-mvp',
            title: 'Launch MVP of Personal AI Assistant',
            description: 'Build and ship first version with core features: intent tracking, natural language inbox, and basic automation',
            stage: 'execution',
            priority: 'high',
            tags: ['product', 'mvp', 'launch'],
            precision: 0.85,
            parent: null,
            children: ['i-user-testing', 'i-marketing-prep']
        },
        {
            id: 'i-user-testing',
            title: 'Conduct User Testing with 10 Beta Users',
            description: 'Get feedback on core workflows and identify pain points',
            stage: 'decision',
            priority: 'high',
            tags: ['research', 'users', 'feedback'],
            precision: 0.72,
            parent: 'i-launch-mvp',
            children: []
        },
        {
            id: 'i-marketing-prep',
            title: 'Prepare Marketing Materials for Launch',
            description: 'Create landing page, demo video, and launch post',
            stage: 'structuring',
            priority: 'medium',
            tags: ['marketing', 'content', 'launch'],
            precision: 0.68,
            parent: 'i-launch-mvp',
            children: []
        },
        {
            id: 'i-raise-seed',
            title: 'Raise $500K Seed Round',
            description: 'Secure funding to hire team and accelerate development',
            stage: 'exploration',
            priority: 'high',
            tags: ['funding', 'growth', 'strategy'],
            precision: 0.55,
            parent: null,
            children: ['i-pitch-deck', 'i-investor-meetings']
        },
        {
            id: 'i-pitch-deck',
            title: 'Create Compelling Pitch Deck',
            description: 'Design 15-slide deck highlighting vision, traction, and team',
            stage: 'structuring',
            priority: 'high',
            tags: ['funding', 'pitch', 'content'],
            precision: 0.78,
            parent: 'i-raise-seed',
            children: []
        },
        {
            id: 'i-investor-meetings',
            title: 'Schedule 20 Investor Meetings',
            description: 'Reach out to seed-stage VCs focused on AI and productivity',
            stage: 'exploration',
            priority: 'medium',
            tags: ['funding', 'networking', 'outreach'],
            precision: 0.62,
            parent: 'i-raise-seed',
            children: []
        },
        {
            id: 'i-hire-engineer',
            title: 'Hire First Full-Stack Engineer',
            description: 'Find senior engineer with AI/ML experience to join founding team',
            stage: 'decision',
            priority: 'high',
            tags: ['hiring', 'team', 'engineering'],
            precision: 0.70,
            parent: null,
            children: []
        },
        {
            id: 'i-implement-rag',
            title: 'Implement RAT Pattern Matching',
            description: 'Build retrieval system to suggest actions based on past successes',
            stage: 'execution',
            priority: 'medium',
            tags: ['technical', 'ai', 'features'],
            precision: 0.88,
            parent: null,
            children: []
        }
    ],

    thinkingChains: [
        {
            id: 'tc-mvp-scope',
            title: 'What should be in the MVP?',
            steps: [
                { stage: 'question', content: 'What features are absolutely essential for launch?' },
                { stage: 'exploration', content: 'Core workflow: capture intent → process → suggest action → learn from feedback' },
                { stage: 'analysis', content: 'Must-haves: natural language inbox, intent FSM, basic automation, learning loop' },
                { stage: 'decision', content: 'Ship with minimal viable feature set, iterate based on user feedback' }
            ],
            relatedIntents: ['i-launch-mvp', 'i-user-testing'],
            tags: ['product', 'strategy', 'mvp']
        },
        {
            id: 'tc-funding-strategy',
            title: 'When is the right time to raise?',
            steps: [
                { stage: 'question', content: 'Should we raise now or wait for more traction?' },
                { stage: 'exploration', content: 'Pros: runway, hiring. Cons: dilution, time spent fundraising' },
                { stage: 'analysis', content: 'Current metrics: 50 beta users, 3.2x weekly growth, strong engagement' },
                { stage: 'decision', content: 'Raise seed now while momentum is high, use funds to accelerate' }
            ],
            relatedIntents: ['i-raise-seed', 'i-hire-engineer'],
            tags: ['funding', 'strategy', 'growth']
        },
        {
            id: 'tc-hiring-priorities',
            title: 'Who should we hire first?',
            steps: [
                { stage: 'question', content: 'Which role will have the biggest impact on growth?' },
                { stage: 'exploration', content: 'Options: engineer, designer, marketer, sales' },
                { stage: 'analysis', content: 'Bottleneck is technical execution; design and marketing can be outsourced for now' },
                { stage: 'decision', content: 'Hire senior full-stack engineer with AI/ML background' }
            ],
            relatedIntents: ['i-hire-engineer', 'i-launch-mvp'],
            tags: ['hiring', 'team', 'strategy']
        }
    ],

    trajectories: [
        {
            id: 'tr-product-launch',
            title: '0 to 1: MVP Launch',
            description: 'Complete journey from concept to first paying customers',
            milestones: [
                { label: 'MVP Feature Complete', status: 'completed', date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
                { label: 'Beta Testing (10 users)', status: 'completed', date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
                { label: 'Public Launch', status: 'in-progress', date: null },
                { label: 'First 100 Users', status: 'planned', date: null },
                { label: 'Product-Market Fit', status: 'planned', date: null }
            ],
            relatedIntents: ['i-launch-mvp', 'i-user-testing', 'i-marketing-prep'],
            tags: ['product', 'launch', 'growth']
        },
        {
            id: 'tr-fundraising',
            title: 'Seed Fundraising Journey',
            description: 'Path to securing first institutional funding',
            milestones: [
                { label: 'Pitch Deck Complete', status: 'in-progress', date: null },
                { label: '20 Investor Meetings', status: 'planned', date: null },
                { label: 'Term Sheet', status: 'planned', date: null },
                { label: 'Close $500K Round', status: 'planned', date: null }
            ],
            relatedIntents: ['i-raise-seed', 'i-pitch-deck', 'i-investor-meetings'],
            tags: ['funding', 'growth', 'milestone']
        },
        {
            id: 'tr-team-building',
            title: 'Building the Founding Team',
            description: 'Assembling core team to scale the company',
            milestones: [
                { label: 'Define Hiring Criteria', status: 'completed', date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
                { label: 'First Engineering Hire', status: 'in-progress', date: null },
                { label: 'Design Partner', status: 'planned', date: null },
                { label: 'Team of 5', status: 'planned', date: null }
            ],
            relatedIntents: ['i-hire-engineer'],
            tags: ['team', 'hiring', 'growth']
        }
    ],

    cognitiveStages: (weekCount) => {
        const stages = [];
        const now = new Date();
        for (let i = 0; i < weekCount; i++) {
            const weekDate = new Date(now.getTime() - (weekCount - i) * 7 * 24 * 60 * 60 * 1000);
            stages.push({
                id: `cs-week-${i + 1}`,
                weekOf: weekDate.toISOString().split('T')[0],
                dominantStage: randomChoice(['exploration', 'structuring', 'decision', 'execution', 'reflection']),
                clarity: randomFloat(0.5, 0.95),
                energy: randomFloat(0.4, 0.9),
                summary: randomChoice([
                    'Focused on execution this week, making steady progress on core features',
                    'Lots of exploration and research, clarifying product direction',
                    'Decision-making week: prioritized features and locked down MVP scope',
                    'High energy execution sprint, shipped several key improvements',
                    'Reflection period: analyzing user feedback and planning next iteration'
                ])
            });
        }
        return stages;
    },

    governanceRules: [
        {
            id: 'gr-auto-approve-high-confidence',
            name: 'Auto-approve high-confidence RAT patterns',
            description: 'Automatically approve suggestions based on successful past patterns with confidence > 90%',
            enabled: true,
            conditions: {
                suggestionType: 'trajectory-pattern',
                minConfidence: 0.90
            },
            action: 'auto-approve',
            tags: ['automation', 'rat', 'high-confidence']
        },
        {
            id: 'gr-auto-stage-transition',
            name: 'Auto-approve stage transitions',
            description: 'Automatically move intents to next FSM stage after sufficient time',
            enabled: true,
            conditions: {
                suggestionType: 'stage-transition',
                minConfidence: 0.75
            },
            action: 'auto-approve',
            tags: ['automation', 'fsm', 'workflow']
        },
        {
            id: 'gr-notify-low-energy',
            name: 'Notify on low cognitive energy',
            description: 'Send notification when energy levels drop below 40% for 3+ days',
            enabled: true,
            conditions: {
                suggestionType: 'cognitive-health',
                energyThreshold: 0.40,
                duration: '3d'
            },
            action: 'notify',
            tags: ['health', 'monitoring', 'wellbeing']
        }
    ],

    ratPatterns: [
        {
            id: 'rat-mvp-launch-sequence',
            name: 'MVP Launch Sequence',
            description: 'Proven pattern for launching new product features',
            context: 'Successfully launched multiple features using this approach',
            pattern: {
                steps: ['feature-complete', 'internal-testing', 'beta-users', 'public-launch'],
                duration: 14,
                successRate: 0.92
            },
            tags: ['product', 'launch', 'mvp'],
            entities: ['product-team', 'beta-users'],
            tools: ['user-testing', 'analytics', 'feedback-collection'],
            confidence: 0.92,
            reuseCount: 5,
            lastUsed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'rat-investor-outreach',
            name: 'Investor Outreach Pattern',
            description: 'Effective sequence for scheduling investor meetings',
            context: 'Used to secure 15+ investor meetings in previous round',
            pattern: {
                steps: ['research-fit', 'warm-intro', 'personalized-email', 'follow-up-48h'],
                duration: 7,
                successRate: 0.78
            },
            tags: ['funding', 'networking', 'outreach'],
            entities: ['investors', 'intro-providers'],
            tools: ['crm', 'email', 'calendar'],
            confidence: 0.85,
            reuseCount: 3,
            lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        }
    ],

    executionPayloads: [
        {
            id: 'ep-user-testing-outreach',
            taskName: 'Send user testing invitations to beta cohort',
            intentId: 'i-user-testing',
            stage: 'staged',
            confidence: 0.88,
            payload: {
                action: 'send-email',
                recipients: ['beta-group-1'],
                template: 'user-testing-invite',
                parameters: {
                    testingWindow: '2026-03-10 to 2026-03-14',
                    incentive: '$25 gift card'
                }
            },
            ratPredictions: {
                confidenceBoost: 0.12,
                predictedDuration: 2,
                successSignals: ['high open rate in previous campaigns', 'strong beta engagement'],
                reuseCount: 3
            },
            stagedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
            id: 'ep-pitch-deck-review',
            taskName: 'Schedule pitch deck review with mentor',
            intentId: 'i-pitch-deck',
            stage: 'staged',
            confidence: 0.82,
            payload: {
                action: 'schedule-meeting',
                participant: 'p-mentor-demo',
                duration: 60,
                agenda: 'Review seed pitch deck, get feedback on story and metrics'
            },
            ratPredictions: {
                confidenceBoost: 0.15,
                predictedDuration: 1,
                successSignals: ['previous deck reviews led to 30% improvement', 'mentor highly responsive'],
                reuseCount: 2
            },
            stagedAt: new Date().toISOString()
        }
    ],

    baseline: {
        id: 'b-metrics-demo',
        type: 'behavioral-baseline',
        weeklyIntentCount: { mean: 12, stddev: 3.2 },
        stageDuration: {
            exploration: { mean: 3.5, stddev: 1.2 },
            structuring: { mean: 2.8, stddev: 0.9 },
            decision: { mean: 1.5, stddev: 0.6 },
            execution: { mean: 5.2, stddev: 2.1 },
            reflection: { mean: 1.2, stddev: 0.5 }
        },
        energyLevels: { mean: 0.72, stddev: 0.12 },
        clarityLevels: { mean: 0.68, stddev: 0.15 },
        establishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    }
};

// Generate relations between entities
function generateRelations() {
    return [
        // Person → Intent relations
        { id: uuidv4(), from: 'p-self-demo', to: 'i-launch-mvp', type: 'owns', label: 'owns' },
        { id: uuidv4(), from: 'p-mentor-demo', to: 'i-launch-mvp', type: 'advises', label: 'advises on' },
        { id: uuidv4(), from: 'p-investor-demo', to: 'i-raise-seed', type: 'interested-in', label: 'interested in' },
        { id: uuidv4(), from: 'p-cofounder-demo', to: 'i-implement-rag', type: 'executes', label: 'executing' },
        { id: uuidv4(), from: 'p-user-demo', to: 'i-user-testing', type: 'participates', label: 'participating in' },

        // Intent → Thinking Chain relations
        { id: uuidv4(), from: 'i-launch-mvp', to: 'tc-mvp-scope', type: 'informed-by', label: 'informed by' },
        { id: uuidv4(), from: 'i-raise-seed', to: 'tc-funding-strategy', type: 'informed-by', label: 'informed by' },
        { id: uuidv4(), from: 'i-hire-engineer', to: 'tc-hiring-priorities', type: 'informed-by', label: 'informed by' },

        // Intent → Trajectory relations
        { id: uuidv4(), from: 'i-launch-mvp', to: 'tr-product-launch', type: 'part-of', label: 'part of' },
        { id: uuidv4(), from: 'i-user-testing', to: 'tr-product-launch', type: 'part-of', label: 'part of' },
        { id: uuidv4(), from: 'i-raise-seed', to: 'tr-fundraising', type: 'part-of', label: 'part of' },
        { id: uuidv4(), from: 'i-hire-engineer', to: 'tr-team-building', type: 'part-of', label: 'part of' }
    ];
}

// Write data to filesystem
async function writeData(collection, items) {
    const dir = path.join(DATA_DIR, collection);
    await fs.mkdir(dir, { recursive: true });

    for (const item of items) {
        const filePath = path.join(dir, `${item.id}.json`);
        const data = {
            ...item,
            createdAt: item.createdAt || randomDate(new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), new Date()).toISOString(),
            updatedAt: item.updatedAt || new Date().toISOString()
        };
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    }
}

async function clearCollection(collection) {
    const dir = path.join(DATA_DIR, collection);
    try {
        const files = await fs.readdir(dir);
        for (const file of files) {
            if (file.endsWith('.json')) {
                await fs.unlink(path.join(dir, file));
            }
        }
    } catch (err) {
        // Directory doesn't exist, that's fine
    }
}

async function generateSampleData(options = {}) {
    const { clean = false, minimal = false } = options;

    console.log('🌱 Self Kernel Sample Data Generator\n');

    if (clean) {
        console.log('🧹 Cleaning existing data...');
        const collections = ['persons', 'intents', 'relations', 'thinking-chains',
                           'cognitive-stages', 'trajectories', 'governance-rules',
                           'rat-patterns', 'execution-payloads', 'baseline'];
        for (const col of collections) {
            await clearCollection(col);
        }
        console.log('✓ Cleaned\n');
    }

    console.log('📝 Generating sample data...\n');

    // Persons
    console.log('  → Persons (5 items)');
    await writeData('persons', SAMPLE_DATA.persons);

    // Intents
    console.log(`  → Intents (${SAMPLE_DATA.intents.length} items)`);
    await writeData('intents', SAMPLE_DATA.intents);

    // Thinking Chains
    console.log(`  → Thinking Chains (${SAMPLE_DATA.thinkingChains.length} items)`);
    await writeData('thinking-chains', SAMPLE_DATA.thinkingChains);

    // Trajectories
    console.log(`  → Trajectories (${SAMPLE_DATA.trajectories.length} items)`);
    await writeData('trajectories', SAMPLE_DATA.trajectories);

    // Cognitive Stages
    const weekCount = minimal ? 4 : 12;
    console.log(`  → Cognitive Stages (${weekCount} weeks)`);
    const stages = SAMPLE_DATA.cognitiveStages(weekCount);
    await writeData('cognitive-stages', stages);

    // Governance Rules
    console.log(`  → Governance Rules (${SAMPLE_DATA.governanceRules.length} items)`);
    await writeData('governance-rules', SAMPLE_DATA.governanceRules);

    // RAT Patterns
    console.log(`  → RAT Patterns (${SAMPLE_DATA.ratPatterns.length} items)`);
    await writeData('rat-patterns', SAMPLE_DATA.ratPatterns);

    // Execution Payloads
    console.log(`  → Execution Payloads (${SAMPLE_DATA.executionPayloads.length} items)`);
    await writeData('execution-payloads', SAMPLE_DATA.executionPayloads);

    // Baseline
    console.log('  → Baseline Metrics (1 item)');
    await writeData('baseline', [SAMPLE_DATA.baseline]);

    // Relations
    const relations = generateRelations();
    console.log(`  → Relations (${relations.length} items)`);
    await writeData('relations', relations);

    // Kernel Meta
    console.log('  → Kernel Metadata');
    const metaPath = path.join(DATA_DIR, 'kernel-meta.json');
    const meta = {
        kernelId: uuidv4(),
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        version: '0.1.0',
        owner: 'Demo User',
        description: 'Sample Self Kernel with realistic demo data',
        learningHistory: [
            {
                timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
                event: 'suggestion-accepted',
                suggestionType: 'trajectory-pattern',
                confidence: 0.88,
                outcome: 'User approved RAT-based next step'
            },
            {
                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                event: 'suggestion-rejected',
                suggestionType: 'stage-transition',
                confidence: 0.65,
                outcome: 'User felt it was too early to move to execution'
            }
        ],
        suggestionFeedback: {
            totalAccepted: 12,
            totalRejected: 3,
            acceptanceRate: 0.80
        }
    };
    await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));

    console.log('\n✅ Sample data generated successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • 5 persons`);
    console.log(`   • ${SAMPLE_DATA.intents.length} intents`);
    console.log(`   • ${SAMPLE_DATA.thinkingChains.length} thinking chains`);
    console.log(`   • ${SAMPLE_DATA.trajectories.length} trajectories`);
    console.log(`   • ${weekCount} cognitive stages`);
    console.log(`   • ${SAMPLE_DATA.governanceRules.length} governance rules`);
    console.log(`   • ${SAMPLE_DATA.ratPatterns.length} RAT patterns`);
    console.log(`   • ${SAMPLE_DATA.executionPayloads.length} execution payloads`);
    console.log(`   • ${relations.length} relations`);
    console.log('\n🚀 Start the server and explore the data!\n');
}

// CLI
const args = process.argv.slice(2);
const options = {
    clean: args.includes('--clean'),
    minimal: args.includes('--minimal')
};

generateSampleData(options).catch(err => {
    console.error('❌ Error generating sample data:', err);
    process.exit(1);
});
