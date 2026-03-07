/**
 * Self Kernel — Sample Data Generator
 *
 * Generates various sample data scenarios for demos, testing, and development.
 * Supports multiple personas and workflow patterns.
 */

import { create, listAll, remove } from '../storage.js';
import { randomUUID as uuidv4 } from 'crypto';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Generate a date relative to a base date
 */
function relativeDate(baseDate, offsetDays) {
    return new Date(baseDate.getTime() + offsetDays * DAY).toISOString();
}

/**
 * Clear all existing data from collections
 */
export async function clearAllData() {
    const collections = [
        'persons', 'intents', 'relations', 'thinking-chains',
        'cognitive-stages', 'trajectories', 'mcp-logs', 'baseline',
        'governance-rules', 'suggestions', 'rat-patterns', 'execution-payloads'
    ];

    let totalDeleted = 0;
    for (const collection of collections) {
        const items = await listAll(collection);
        for (const item of items) {
            await remove(collection, item.id);
            totalDeleted++;
        }
    }
    return totalDeleted;
}

/**
 * Scenario 1: Tech Startup Founder (30-day journey)
 */
export async function generateStartupFounderScenario() {
    const baseDate = new Date('2025-01-15');
    const d = (offset) => relativeDate(baseDate, offset);

    // Persons
    const selfId = 'p-founder-self';
    const mentorId = 'p-mentor-sarah';
    const cofounderId = 'p-cofounder-alex';
    const investorId = 'p-investor-ming';

    await create('persons', {
        id: selfId,
        name: 'Tech Founder',
        type: 'self',
        role: 'AI Startup Founder',
        notes: 'Building next-generation personal intelligence tools',
        tags: ['founder', 'ai', 'product'],
        interactions: 0,
        createdAt: d(0)
    });

    await create('persons', {
        id: mentorId,
        name: 'Sarah Chen',
        type: 'other',
        role: 'Serial Entrepreneur',
        notes: 'Ex-Google AI lead, advising on GTM strategy',
        tags: ['mentor', 'advisor'],
        interactions: 15,
        createdAt: d(3)
    });

    await create('persons', {
        id: cofounderId,
        name: 'Alex Rivera',
        type: 'other',
        role: 'Tech Co-founder',
        notes: 'Systems engineer, MCP expert',
        tags: ['cofounder', 'engineer'],
        interactions: 30,
        createdAt: d(5)
    });

    await create('persons', {
        id: investorId,
        name: 'Ming Zhang',
        type: 'other',
        role: 'VC Partner',
        notes: 'Interested in personal AI infrastructure',
        tags: ['investor', 'vc'],
        interactions: 5,
        createdAt: d(15)
    });

    // Intents
    const productIntentId = 'i-product-launch';
    const fundingIntentId = 'i-seed-funding';
    const teamIntentId = 'i-team-building';

    await create('intents', {
        id: productIntentId,
        title: 'Launch Personal AI Platform',
        description: 'Build and launch Self Kernel - a white-box personal intelligence core',
        stage: 'DECISION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(0), note: 'Initial concept' },
            { stage: 'REFINING', timestamp: d(10), note: 'Architecture defined' },
            { stage: 'DECISION', timestamp: d(20), note: 'Committed to building' }
        ],
        tags: ['product', 'launch', 'ai'],
        priority: 'critical',
        active: true,
        createdAt: d(0)
    });

    await create('intents', {
        id: fundingIntentId,
        title: 'Raise $2M Seed Round',
        description: 'Secure seed funding for 18-month runway',
        stage: 'REFINING',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(15), note: 'Started fundraising research' },
            { stage: 'REFINING', timestamp: d(25), note: 'Building investor pipeline' }
        ],
        tags: ['funding', 'seed'],
        priority: 'high',
        active: true,
        createdAt: d(15)
    });

    await create('intents', {
        id: teamIntentId,
        title: 'Build Founding Team',
        description: 'Recruit 2-3 founding engineers and designer',
        stage: 'EXPLORATION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(18), note: 'Defining team needs' }
        ],
        tags: ['team', 'hiring'],
        priority: 'medium',
        active: true,
        createdAt: d(18)
    });

    // Trajectories
    await create('trajectories', {
        title: 'Startup Launch Trajectory',
        description: 'From idea to seed funding',
        milestones: [
            { label: 'Concept formed', date: d(0), status: 'completed', intentId: productIntentId },
            { label: 'Architecture finalized', date: d(20), status: 'completed', intentId: productIntentId },
            { label: 'Prototype built', date: d(30), status: 'in-progress', intentId: productIntentId },
            { label: 'First investor meeting', date: d(40), status: 'planned', intentId: fundingIntentId },
            { label: 'Seed round closed', date: d(90), status: 'planned', intentId: fundingIntentId }
        ],
        createdAt: d(0)
    });

    // Cognitive stages
    await create('cognitive-stages', {
        week: 1,
        startDate: d(0),
        endDate: d(7),
        dominantStage: 'exploration',
        summary: 'Exploring startup ideas and market opportunities',
        energyLevel: 0.7,
        clarityLevel: 0.4,
        intentActivity: { [productIntentId]: 'exploration' }
    });

    await create('cognitive-stages', {
        week: 2,
        startDate: d(7),
        endDate: d(14),
        dominantStage: 'structuring',
        summary: 'Converging on product vision and architecture',
        energyLevel: 0.8,
        clarityLevel: 0.6,
        intentActivity: { [productIntentId]: 'structuring' }
    });

    await create('cognitive-stages', {
        week: 3,
        startDate: d(14),
        endDate: d(21),
        dominantStage: 'decision',
        summary: 'Major decisions: committing to build, starting fundraise',
        energyLevel: 0.9,
        clarityLevel: 0.85,
        intentActivity: { [productIntentId]: 'decision', [fundingIntentId]: 'exploration' }
    });

    await create('cognitive-stages', {
        week: 4,
        startDate: d(21),
        endDate: d(28),
        dominantStage: 'execution',
        summary: 'Building prototype, talking to early users',
        energyLevel: 0.85,
        clarityLevel: 0.8,
        intentActivity: { [productIntentId]: 'execution', [fundingIntentId]: 'structuring' }
    });

    return {
        scenario: 'startup-founder',
        persons: 4,
        intents: 3,
        trajectories: 1,
        cognitiveStages: 4
    };
}

/**
 * Scenario 2: Researcher / Academic (research project workflow)
 */
export async function generateResearcherScenario() {
    const baseDate = new Date('2025-02-01');
    const d = (offset) => relativeDate(baseDate, offset);

    const selfId = 'p-researcher-self';
    const advisorId = 'p-advisor-prof';
    const collabId = 'p-collab-researcher';

    await create('persons', {
        id: selfId,
        name: 'Research Scientist',
        type: 'self',
        role: 'PhD Candidate in AI/ML',
        notes: 'Researching neural architecture search and meta-learning',
        tags: ['researcher', 'phd', 'ml'],
        interactions: 0,
        createdAt: d(0)
    });

    await create('persons', {
        id: advisorId,
        name: 'Prof. Jennifer Wu',
        type: 'other',
        role: 'PhD Advisor',
        notes: 'Expert in neural networks and optimization',
        tags: ['advisor', 'professor'],
        interactions: 20,
        createdAt: d(0)
    });

    await create('persons', {
        id: collabId,
        name: 'David Kim',
        type: 'other',
        role: 'Postdoc Collaborator',
        notes: 'Working on related meta-learning project',
        tags: ['collaborator', 'postdoc'],
        interactions: 35,
        createdAt: d(5)
    });

    const thesisId = 'i-thesis-completion';
    const paperId = 'i-paper-submission';
    const experimentId = 'i-experiments';

    await create('intents', {
        id: thesisId,
        title: 'Complete PhD Thesis',
        description: 'Finish dissertation on adaptive neural architectures',
        stage: 'DECISION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(-90), note: 'Research direction defined' },
            { stage: 'REFINING', timestamp: d(-30), note: 'Experiments underway' },
            { stage: 'DECISION', timestamp: d(0), note: 'Writing phase started' }
        ],
        tags: ['thesis', 'phd', 'research'],
        priority: 'critical',
        active: true,
        createdAt: d(-90)
    });

    await create('intents', {
        id: paperId,
        title: 'Submit Paper to NeurIPS 2025',
        description: 'Novel approach to few-shot meta-learning',
        stage: 'EXECUTION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(-20), note: 'Initial results promising' },
            { stage: 'REFINING', timestamp: d(-10), note: 'Ablation studies complete' },
            { stage: 'DECISION', timestamp: d(0), note: 'Decided to submit' },
            { stage: 'EXECUTION', timestamp: d(5), note: 'Writing manuscript' }
        ],
        tags: ['paper', 'neurips', 'publication'],
        priority: 'critical',
        active: true,
        createdAt: d(-20)
    });

    await create('intents', {
        id: experimentId,
        title: 'Run Large-Scale Experiments',
        description: '100+ model configurations on ImageNet',
        stage: 'EXECUTION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(-15), note: 'Experiment design' },
            { stage: 'DECISION', timestamp: d(-5), note: 'Allocated GPU cluster time' },
            { stage: 'EXECUTION', timestamp: d(0), note: 'Running experiments' }
        ],
        tags: ['experiments', 'ml', 'compute'],
        priority: 'high',
        active: true,
        createdAt: d(-15)
    });

    await create('trajectories', {
        title: 'PhD Completion Path',
        description: 'From experiments to graduation',
        milestones: [
            { label: 'Experiments complete', date: d(15), status: 'in-progress', intentId: experimentId },
            { label: 'NeurIPS submission', date: d(25), status: 'planned', intentId: paperId },
            { label: 'Thesis defense scheduled', date: d(60), status: 'planned', intentId: thesisId },
            { label: 'Defense', date: d(120), status: 'planned', intentId: thesisId },
            { label: 'Graduation', date: d(150), status: 'planned', intentId: thesisId }
        ],
        createdAt: d(0)
    });

    await create('cognitive-stages', {
        week: 1,
        startDate: d(0),
        endDate: d(7),
        dominantStage: 'execution',
        summary: 'Running experiments, analyzing results, writing paper drafts',
        energyLevel: 0.75,
        clarityLevel: 0.8,
        intentActivity: { [experimentId]: 'execution', [paperId]: 'execution' }
    });

    return {
        scenario: 'researcher',
        persons: 3,
        intents: 3,
        trajectories: 1,
        cognitiveStages: 1
    };
}

/**
 * Scenario 3: Product Manager (feature launch workflow)
 */
export async function generateProductManagerScenario() {
    const baseDate = new Date('2025-03-01');
    const d = (offset) => relativeDate(baseDate, offset);

    const selfId = 'p-pm-self';
    const designerId = 'p-designer-emily';
    const engineerId = 'p-engineer-jake';
    const stakeholderId = 'p-stakeholder-vp';

    await create('persons', {
        id: selfId,
        name: 'Product Manager',
        type: 'self',
        role: 'Senior PM at TechCo',
        notes: 'Leading AI features team',
        tags: ['pm', 'product', 'ai'],
        interactions: 0,
        createdAt: d(0)
    });

    await create('persons', {
        id: designerId,
        name: 'Emily Rodriguez',
        type: 'other',
        role: 'Lead Designer',
        notes: 'UX expert, focuses on AI interactions',
        tags: ['designer', 'ux'],
        interactions: 45,
        createdAt: d(0)
    });

    await create('persons', {
        id: engineerId,
        name: 'Jake Thompson',
        type: 'other',
        role: 'Tech Lead',
        notes: 'Backend architect, pragmatic builder',
        tags: ['engineer', 'tech-lead'],
        interactions: 60,
        createdAt: d(0)
    });

    await create('persons', {
        id: stakeholderId,
        name: 'VP Product',
        type: 'other',
        role: 'VP of Product',
        notes: 'Executive sponsor, wants aggressive timeline',
        tags: ['leadership', 'stakeholder'],
        interactions: 12,
        createdAt: d(0)
    });

    const featureLaunchId = 'i-feature-launch';
    const userResearchId = 'i-user-research';
    const metricsId = 'i-success-metrics';

    await create('intents', {
        id: featureLaunchId,
        title: 'Launch AI Assistant Feature',
        description: 'Ship conversational AI assistant to 10M users',
        stage: 'EXECUTION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(-60), note: 'Feature concept approved' },
            { stage: 'REFINING', timestamp: d(-30), note: 'Spec finalized' },
            { stage: 'DECISION', timestamp: d(-15), note: 'Go decision from leadership' },
            { stage: 'EXECUTION', timestamp: d(0), note: 'Development started' }
        ],
        tags: ['feature', 'ai', 'launch'],
        priority: 'critical',
        active: true,
        createdAt: d(-60)
    });

    await create('intents', {
        id: userResearchId,
        title: 'Conduct User Research',
        description: 'Interview 30 users about AI assistant needs',
        stage: 'REFUTED',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(-45), note: 'Research plan created' },
            { stage: 'EXECUTION', timestamp: d(-30), note: 'Conducting interviews' },
            { stage: 'REFUTED', timestamp: d(-10), note: 'Key insights captured' }
        ],
        tags: ['research', 'users', 'insights'],
        priority: 'medium',
        active: false,
        createdAt: d(-45)
    });

    await create('intents', {
        id: metricsId,
        title: 'Define Success Metrics',
        description: 'Establish KPIs and measurement framework',
        stage: 'DECISION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(-20), note: 'Reviewing industry benchmarks' },
            { stage: 'REFINING', timestamp: d(-10), note: 'Draft metrics doc' },
            { stage: 'DECISION', timestamp: d(0), note: 'Metrics approved by leadership' }
        ],
        tags: ['metrics', 'kpis', 'measurement'],
        priority: 'high',
        active: true,
        createdAt: d(-20)
    });

    await create('trajectories', {
        title: 'Q2 Feature Launch',
        description: 'AI Assistant from concept to launch',
        milestones: [
            { label: 'User research complete', date: d(-10), status: 'completed', intentId: userResearchId },
            { label: 'Engineering kickoff', date: d(0), status: 'completed', intentId: featureLaunchId },
            { label: 'Alpha testing', date: d(30), status: 'planned', intentId: featureLaunchId },
            { label: 'Beta launch', date: d(45), status: 'planned', intentId: featureLaunchId },
            { label: 'Public launch', date: d(60), status: 'planned', intentId: featureLaunchId }
        ],
        createdAt: d(-60)
    });

    await create('cognitive-stages', {
        week: 1,
        startDate: d(0),
        endDate: d(7),
        dominantStage: 'execution',
        summary: 'Sprint planning, daily standups, unblocking engineers',
        energyLevel: 0.8,
        clarityLevel: 0.85,
        intentActivity: { [featureLaunchId]: 'execution', [metricsId]: 'decision' }
    });

    return {
        scenario: 'product-manager',
        persons: 4,
        intents: 3,
        trajectories: 1,
        cognitiveStages: 1
    };
}

/**
 * Scenario 4: Minimal Test Data (for unit testing)
 */
export async function generateMinimalTestData() {
    const baseDate = new Date();
    const d = (offset) => relativeDate(baseDate, offset);

    const selfId = 'test-self';
    const otherId = 'test-other';
    const intentId = 'test-intent';

    await create('persons', {
        id: selfId,
        name: 'Test User',
        type: 'self',
        role: 'Testing',
        tags: ['test'],
        interactions: 0,
        createdAt: d(0)
    });

    await create('persons', {
        id: otherId,
        name: 'Test Contact',
        type: 'other',
        role: 'Test Role',
        tags: ['test'],
        interactions: 5,
        createdAt: d(0)
    });

    await create('intents', {
        id: intentId,
        title: 'Test Intent',
        description: 'Sample intent for testing',
        stage: 'EXPLORATION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(0), note: 'Created for testing' }
        ],
        tags: ['test'],
        priority: 'medium',
        active: true,
        createdAt: d(0)
    });

    await create('relations', {
        sourceType: 'person',
        sourceId: selfId,
        targetType: 'person',
        targetId: otherId,
        label: 'knows',
        strength: 0.5,
        context: 'Test relationship'
    });

    await create('cognitive-stages', {
        week: 1,
        startDate: d(0),
        endDate: d(7),
        dominantStage: 'exploration',
        summary: 'Test cognitive stage',
        energyLevel: 0.5,
        clarityLevel: 0.5,
        intentActivity: { [intentId]: 'exploration' }
    });

    return {
        scenario: 'minimal-test',
        persons: 2,
        intents: 1,
        relations: 1,
        cognitiveStages: 1
    };
}

/**
 * Scenario 5: Complex Multi-Project Workflow
 */
export async function generateComplexScenario() {
    const baseDate = new Date('2025-01-01');
    const d = (offset) => relativeDate(baseDate, offset);

    // Create multiple persons
    const personIds = [];
    const personTypes = [
        { name: 'Self', type: 'self', role: 'Multi-project Lead' },
        { name: 'Alice Chen', type: 'other', role: 'Project A Lead' },
        { name: 'Bob Martinez', type: 'other', role: 'Project B Lead' },
        { name: 'Carol Johnson', type: 'other', role: 'Executive Sponsor' },
        { name: 'David Lee', type: 'other', role: 'Technical Architect' },
        { name: 'Emma Wilson', type: 'other', role: 'Design Lead' }
    ];

    for (const p of personTypes) {
        const id = `p-complex-${p.name.toLowerCase().replace(/\s+/g, '-')}`;
        personIds.push(id);
        await create('persons', {
            id,
            name: p.name,
            type: p.type,
            role: p.role,
            tags: ['complex-scenario'],
            interactions: Math.floor(Math.random() * 50),
            createdAt: d(0)
        });
    }

    // Create multiple intents across different domains
    const intentIds = [];
    const intentData = [
        { title: 'Launch Product Alpha', stage: 'EXECUTION', priority: 'critical', domain: 'product' },
        { title: 'Hire 5 Engineers', stage: 'DECISION', priority: 'high', domain: 'hiring' },
        { title: 'Improve Team Culture', stage: 'REFINING', priority: 'medium', domain: 'culture' },
        { title: 'Quarterly OKR Planning', stage: 'DECISION', priority: 'high', domain: 'planning' },
        { title: 'Customer Research Initiative', stage: 'EXECUTION', priority: 'high', domain: 'research' },
        { title: 'Technical Debt Reduction', stage: 'EXPLORATION', priority: 'medium', domain: 'tech' },
        { title: 'Marketing Campaign', stage: 'REFINING', priority: 'medium', domain: 'marketing' },
        { title: 'Investor Relations', stage: 'DECISION', priority: 'high', domain: 'finance' }
    ];

    for (let i = 0; i < intentData.length; i++) {
        const intent = intentData[i];
        const id = `i-complex-${i + 1}`;
        intentIds.push(id);

        await create('intents', {
            id,
            title: intent.title,
            description: `Complex scenario intent for ${intent.domain}`,
            stage: intent.stage,
            stageHistory: [
                { stage: 'EXPLORATION', timestamp: d(i * 5), note: 'Initial exploration' },
                { stage: intent.stage, timestamp: d(i * 5 + 3), note: 'Current stage' }
            ],
            tags: ['complex-scenario', intent.domain],
            priority: intent.priority,
            active: true,
            linkedPersons: personIds.slice(0, 3),
            createdAt: d(i * 5)
        });
    }

    // Create cognitive stages showing progression
    for (let week = 1; week <= 6; week++) {
        await create('cognitive-stages', {
            week,
            startDate: d((week - 1) * 7),
            endDate: d(week * 7),
            dominantStage: ['exploration', 'structuring', 'decision', 'execution', 'execution', 'reflection'][week - 1],
            summary: `Week ${week}: Complex multi-project coordination`,
            energyLevel: 0.6 + (Math.random() * 0.3),
            clarityLevel: 0.5 + (Math.random() * 0.4),
            intentActivity: Object.fromEntries(
                intentIds.slice(0, 3).map(id => [id, ['exploration', 'structuring', 'decision', 'execution'][Math.floor(Math.random() * 4)]])
            )
        });
    }

    // Create trajectory
    await create('trajectories', {
        title: 'Q1 Multi-Project Execution',
        description: 'Coordinating 8 concurrent initiatives',
        milestones: intentIds.slice(0, 8).map((id, idx) => ({
            label: intentData[idx].title,
            date: d(idx * 7 + 14),
            status: idx < 2 ? 'completed' : idx < 4 ? 'in-progress' : 'planned',
            intentId: id
        })),
        createdAt: d(0)
    });

    return {
        scenario: 'complex-multi-project',
        persons: personIds.length,
        intents: intentIds.length,
        trajectories: 1,
        cognitiveStages: 6
    };
}

/**
 * Main generator function - generate specific scenario
 */
export async function generateSampleData(scenario = 'startup-founder', clearExisting = true) {
    console.log(`\n🌱 Generating sample data: ${scenario}`);

    if (clearExisting) {
        const deleted = await clearAllData();
        console.log(`   🧹 Cleared ${deleted} existing items`);
    }

    let result;
    switch (scenario) {
        case 'startup-founder':
            result = await generateStartupFounderScenario();
            break;
        case 'researcher':
            result = await generateResearcherScenario();
            break;
        case 'product-manager':
            result = await generateProductManagerScenario();
            break;
        case 'minimal-test':
            result = await generateMinimalTestData();
            break;
        case 'complex':
            result = await generateComplexScenario();
            break;
        default:
            throw new Error(`Unknown scenario: ${scenario}`);
    }

    console.log(`   ✅ Generated: ${JSON.stringify(result, null, 2)}`);
    return result;
}

/**
 * Get available scenarios
 */
export function getAvailableScenarios() {
    return [
        {
            id: 'startup-founder',
            name: 'Tech Startup Founder',
            description: '30-day journey from idea to seed funding',
            dataPoints: 'Moderate (4 persons, 3 intents, 1 trajectory)'
        },
        {
            id: 'researcher',
            name: 'Research Scientist',
            description: 'PhD candidate managing thesis and paper submissions',
            dataPoints: 'Small (3 persons, 3 intents, 1 trajectory)'
        },
        {
            id: 'product-manager',
            name: 'Product Manager',
            description: 'PM leading feature launch with cross-functional team',
            dataPoints: 'Moderate (4 persons, 3 intents, 1 trajectory)'
        },
        {
            id: 'minimal-test',
            name: 'Minimal Test Data',
            description: 'Bare minimum data for unit testing',
            dataPoints: 'Minimal (2 persons, 1 intent, 1 relation)'
        },
        {
            id: 'complex',
            name: 'Complex Multi-Project',
            description: 'Large-scale scenario with 8 concurrent projects',
            dataPoints: 'Large (6 persons, 8 intents, 6 cognitive stages)'
        }
    ];
}
