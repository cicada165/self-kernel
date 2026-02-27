/**
 * Self Kernel — Demo Data Seeder
 * 
 * Seeds the data/ directory with a realistic 30-day scenario:
 * A user exploring a career transition from tech PM to AI startup founder,
 * with evolving intents, key relationships, and thinking chains.
 */

import { initStorage, create } from './storage.js';

// Fixed IDs for cross-referencing
const IDS = {
    // Persons
    self: 'p-self-001',
    mentor: 'p-mentor-sarah',
    cofounder: 'p-cofounder-alex',
    investor: 'p-investor-ming',
    colleague: 'p-colleague-david',
    twin: 'p-digital-twin',

    // Intents
    careerChange: 'i-career-change',
    aiStartup: 'i-ai-startup',
    fundingStrategy: 'i-funding',
    productVision: 'i-product-vision',
    teamBuilding: 'i-team-building',
    personalGrowth: 'i-personal-growth',
    marketResearch: 'i-market-research',

    // Thinking chains
    shouldILeave: 'tc-should-i-leave',
    whatToBuild: 'tc-what-to-build',
    piConcept: 'tc-pi-concept',
    goToMarket: 'tc-go-to-market',

    // Trajectories
    mainTrajectory: 'tr-career-pivot',
};

const DAY = 24 * 60 * 60 * 1000;
const baseDate = new Date('2025-01-15');
const d = (offset) => new Date(baseDate.getTime() + offset * DAY).toISOString();

async function seed() {
    console.log('🌱 Seeding Self Kernel with demo data...\n');
    await initStorage();

    // ═══════════════════════════════════════════
    // PERSONS
    // ═══════════════════════════════════════════
    console.log('  👤 Creating persons...');

    await create('persons', {
        id: IDS.self,
        name: 'Me',
        type: 'self',
        role: 'Tech PM → AI Founder (in transition)',
        notes: 'Core identity node. 8 years in product management at big tech. Increasingly drawn to AI-native tools and personal intelligence systems.',
        tags: ['self', 'founder', 'product', 'ai'],
        interactions: 0,
        lastSeen: d(0),
        createdAt: d(0)
    });

    await create('persons', {
        id: IDS.mentor,
        name: 'Sarah Chen',
        type: 'other',
        role: 'Serial entrepreneur, ex-Google AI lead',
        notes: 'Met at an AI conference in November. Incredibly sharp on go-to-market for dev tools. Offered to be an informal advisor. Values directness.',
        tags: ['mentor', 'ai', 'startup', 'advisor'],
        interactions: 12,
        lastSeen: d(25),
        createdAt: d(3)
    });

    await create('persons', {
        id: IDS.cofounder,
        name: 'Alex Rivera',
        type: 'other',
        role: 'Full-stack engineer, distributed systems expert',
        notes: 'Former colleague. Brilliant systems thinker. Has been independently exploring MCP and personal AI concepts. Potential co-founder.',
        tags: ['cofounder', 'engineer', 'mcp', 'systems'],
        interactions: 24,
        lastSeen: d(28),
        createdAt: d(5)
    });

    await create('persons', {
        id: IDS.investor,
        name: 'Ming Zhang',
        type: 'other',
        role: 'Partner at Horizon Ventures, AI/infra focus',
        notes: 'Introduced by Sarah. Excited about personal AI sovereignty angle. Wants to see a working prototype before discussing terms. Prefers concise pitches.',
        tags: ['investor', 'ai', 'infrastructure'],
        interactions: 3,
        lastSeen: d(20),
        createdAt: d(15)
    });

    await create('persons', {
        id: IDS.colleague,
        name: 'David Park',
        type: 'other',
        role: 'Current PM colleague, trusted friend',
        notes: 'Supportive of the transition. Good sounding board for risk assessment. Might join later if the startup gets traction.',
        tags: ['friend', 'pm', 'confidant'],
        interactions: 18,
        lastSeen: d(27),
        createdAt: d(0)
    });

    await create('persons', {
        id: IDS.twin,
        name: 'My Digital Twin',
        type: 'digital-twin',
        role: 'Autonomous PI agent for networking and research',
        notes: 'Configured to represent my professional interests in agent networks. Authorized to share: public work history, stated interests, and open collaboration requests. NOT authorized to share: financial details, private relationships, unfinished ideas.',
        tags: ['digital-twin', 'agent', 'proxy'],
        interactions: 156,
        lastSeen: d(29),
        createdAt: d(10)
    });

    // ═══════════════════════════════════════════
    // INTENTS
    // ═══════════════════════════════════════════
    console.log('  🎯 Creating intents...');

    await create('intents', {
        id: IDS.careerChange,
        title: 'Career Transition: PM → AI Startup Founder',
        description: 'The overarching intent to leave big tech and build something meaningful in the personal AI space. This is the root intent that spawned all others.',
        stage: 'DECISION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(0), note: 'First serious thought about leaving' },
            { stage: 'EXPLORATION', timestamp: d(5), note: 'Researching startup landscape' },
            { stage: 'REFINING', timestamp: d(12), note: 'Narrowing focus to personal AI' },
            { stage: 'DECISION', timestamp: d(20), note: 'Decision made: going for it' },
            { stage: 'DECISION', timestamp: d(25), note: 'Started building prototype' },
        ],
        tags: ['career', 'life-change', 'startup', 'ai'],
        parentId: null,
        linkedPersons: [IDS.self, IDS.mentor, IDS.cofounder, IDS.colleague],
        priority: 'critical',
        active: true,
        createdAt: d(0)
    });

    await create('intents', {
        id: IDS.aiStartup,
        title: 'Build Personal Intelligence Platform',
        description: 'Create a local-first, white-box personal intelligence core that serves as a user\'s MCP server — managing intents, relationships, and cognitive state.',
        stage: 'DECISION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(8), note: 'Initial concept brainstorm' },
            { stage: 'REFINING', timestamp: d(14), note: 'Architecture taking shape' },
            { stage: 'DECISION', timestamp: d(22), note: 'Committed to this specific vision' },
            { stage: 'DECISION', timestamp: d(26), note: 'Prototype development started' },
        ],
        tags: ['product', 'pi', 'mcp', 'prototype'],
        parentId: IDS.careerChange,
        linkedPersons: [IDS.self, IDS.cofounder],
        priority: 'critical',
        active: true,
        createdAt: d(8)
    });

    await create('intents', {
        id: IDS.fundingStrategy,
        title: 'Secure Seed Funding ($1-2M)',
        description: 'Raise a seed round to support 12-18 months of development. Focus on investors who understand AI infrastructure and personal sovereignty.',
        stage: 'REFINING',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(15), note: 'Started thinking about funding' },
            { stage: 'REFINING', timestamp: d(22), note: 'Building investor pipeline' },
        ],
        tags: ['funding', 'seed', 'investors'],
        parentId: IDS.careerChange,
        linkedPersons: [IDS.self, IDS.investor, IDS.mentor],
        priority: 'high',
        active: true,
        createdAt: d(15)
    });

    await create('intents', {
        id: IDS.productVision,
        title: 'Define Product Vision & Architecture',
        description: 'Establish the core architecture: three atomic objects (Person, Intent, Relation), local-first storage, MCP server interface, and progressive data collection via browser extension → chat plugin → input method.',
        stage: 'DECISION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(8), note: 'Exploring different approaches' },
            { stage: 'REFINING', timestamp: d(15), note: 'Converging on PI concept' },
            { stage: 'DECISION', timestamp: d(22), note: 'Architecture finalized' },
        ],
        tags: ['architecture', 'product', 'vision'],
        parentId: IDS.aiStartup,
        linkedPersons: [IDS.self, IDS.cofounder],
        priority: 'high',
        active: true,
        createdAt: d(8)
    });

    await create('intents', {
        id: IDS.teamBuilding,
        title: 'Build Founding Team',
        description: 'Recruit 2-3 founding team members: systems engineer (Alex?), ML engineer, and designer.',
        stage: 'EXPLORATION',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(18), note: 'Started thinking about team composition' },
        ],
        tags: ['team', 'hiring', 'cofounders'],
        parentId: IDS.careerChange,
        linkedPersons: [IDS.self, IDS.cofounder],
        priority: 'medium',
        active: true,
        createdAt: d(18)
    });

    await create('intents', {
        id: IDS.personalGrowth,
        title: 'Develop Founder Mindset',
        description: 'Transition from big-company PM thinking to founder thinking. Embrace uncertainty, move faster, focus on first principles.',
        stage: 'REFINING',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(2), note: 'Realizing I need to change how I think' },
            { stage: 'REFINING', timestamp: d(10), note: 'Developing daily practices' },
        ],
        tags: ['personal', 'mindset', 'growth'],
        parentId: IDS.careerChange,
        linkedPersons: [IDS.self, IDS.mentor],
        priority: 'medium',
        active: true,
        createdAt: d(2)
    });

    await create('intents', {
        id: IDS.marketResearch,
        title: 'Competitive Landscape Analysis',
        description: 'Deep dive into existing personal AI tools, memory systems, and MCP implementations. Identify white space and differentiation.',
        stage: 'REFUTED',
        stageHistory: [
            { stage: 'EXPLORATION', timestamp: d(5), note: 'Started scanning the market' },
            { stage: 'REFINING', timestamp: d(10), note: 'Building competitive matrix' },
            { stage: 'DECISION', timestamp: d(16), note: 'Writing detailed analysis' },
            { stage: 'REFUTED', timestamp: d(24), note: 'Key insight: nobody owns the white-box PI niche' },
        ],
        tags: ['research', 'competition', 'market'],
        parentId: IDS.aiStartup,
        linkedPersons: [IDS.self],
        priority: 'medium',
        active: false,
        createdAt: d(5)
    });

    // ═══════════════════════════════════════════
    // THINKING CHAINS
    // ═══════════════════════════════════════════
    console.log('  💭 Creating thinking chains...');

    await create('thinking-chains', {
        id: IDS.shouldILeave,
        title: 'Should I Leave Big Tech?',
        description: 'The foundational question that started everything.',
        nodes: [
            {
                id: 'n1',
                content: 'I keep thinking about what I actually want to build. The PM role feels increasingly constrained.',
                timestamp: d(0),
                type: 'question',
                source: 'self-reflection'
            },
            {
                id: 'n2',
                content: 'Asked Claude about common founder motivations. The "pull vs push" framework resonated — I have a pull toward building, not just a push away from corporate.',
                timestamp: d(2),
                type: 'insight',
                source: 'llm-conversation'
            },
            {
                id: 'n3',
                content: 'David said something important: "You\'ve been building other people\'s visions for 8 years. When do you build yours?"',
                timestamp: d(5),
                type: 'external-input',
                source: 'conversation',
                linkedPerson: IDS.colleague
            },
            {
                id: 'n4',
                content: 'Financial analysis: I have 18 months of runway if I\'m frugal. That\'s enough to build and raise.',
                timestamp: d(8),
                type: 'analysis',
                source: 'self-analysis'
            },
            {
                id: 'n5',
                content: 'Sarah\'s advice: "The window for personal AI infrastructure is 18-24 months. After that, the big players will lock it down."',
                timestamp: d(12),
                type: 'external-input',
                source: 'conversation',
                linkedPerson: IDS.mentor
            },
            {
                id: 'n6',
                content: 'DECISION: I\'m going to do this. Targeting March 1st as my last day.',
                timestamp: d(20),
                type: 'decision',
                source: 'self-reflection'
            }
        ],
        linkedIntents: [IDS.careerChange, IDS.personalGrowth],
        createdAt: d(0)
    });

    await create('thinking-chains', {
        id: IDS.whatToBuild,
        title: 'What Should I Build?',
        description: 'Exploring product directions in the personal AI space.',
        nodes: [
            {
                id: 'n1',
                content: 'Started by listing everything that frustrates me about current AI tools: no memory continuity, no data ownership, no cross-platform context.',
                timestamp: d(5),
                type: 'exploration',
                source: 'self-reflection'
            },
            {
                id: 'n2',
                content: 'Deep dive into MCP specification. It\'s the right abstraction layer. The question is: what\'s the "personal" MCP server?',
                timestamp: d(8),
                type: 'research',
                source: 'llm-conversation'
            },
            {
                id: 'n3',
                content: 'Key insight from conversation with Alex: "The data isn\'t the model. If you separate data sovereignty from model choice, you unlock something fundamentally new."',
                timestamp: d(10),
                type: 'insight',
                source: 'conversation',
                linkedPerson: IDS.cofounder
            },
            {
                id: 'n4',
                content: 'Explored three directions: (A) Personal memory layer, (B) Intent management system, (C) Full PI kernel with Person/Intent/Relation ontology. C is the most ambitious but also the most defensible.',
                timestamp: d(14),
                type: 'analysis',
                source: 'self-analysis'
            },
            {
                id: 'n5',
                content: 'CONVERGENCE: Building a "Self Kernel" — a local-first, white-box personal intelligence core. Three atomic objects: Person, Intent, Relation. Exposed as MCP server.',
                timestamp: d(18),
                type: 'decision',
                source: 'self-reflection'
            }
        ],
        linkedIntents: [IDS.aiStartup, IDS.productVision],
        createdAt: d(5)
    });

    await create('thinking-chains', {
        id: IDS.piConcept,
        title: 'Personal Intelligence as OS Core Process',
        description: 'Developing the theoretical framework for PI as the personal core process in the AI OS.',
        nodes: [
            {
                id: 'n1',
                content: 'Historical pattern: PC OS → software ecosystem. Mobile OS → app ecosystem. AI OS → ??? What\'s the personal layer?',
                timestamp: d(10),
                type: 'question',
                source: 'self-reflection'
            },
            {
                id: 'n2',
                content: 'AI glasses aren\'t about the hardware. They\'re about continuous sensing + persistent context. This REQUIRES a long-lived personal intelligence core.',
                timestamp: d(12),
                type: 'insight',
                source: 'llm-conversation'
            },
            {
                id: 'n3',
                content: 'The key distinction: LLM memory is "black box sedimentation." PI data must be white-box, user-governed, structured around Intent/Person/Relation.',
                timestamp: d(15),
                type: 'insight',
                source: 'self-reflection'
            },
            {
                id: 'n4',
                content: 'Ming asked the right question: "Why would someone choose this over just having a better ChatGPT memory?" Answer: because ChatGPT memory is a feature. PI is infrastructure.',
                timestamp: d(20),
                type: 'external-input',
                source: 'conversation',
                linkedPerson: IDS.investor
            },
            {
                id: 'n5',
                content: 'Framework crystallized: PI is the "personal core process" in the AI OS. One per person. Non-shareable. Long-lived. Model-agnostic. The anchor between humans and the entire AI ecosystem.',
                timestamp: d(22),
                type: 'synthesis',
                source: 'self-reflection'
            }
        ],
        linkedIntents: [IDS.productVision, IDS.aiStartup],
        createdAt: d(10)
    });

    await create('thinking-chains', {
        id: IDS.goToMarket,
        title: 'Go-to-Market Strategy',
        description: 'How to bring Self Kernel to market — starting with developers.',
        nodes: [
            {
                id: 'n1',
                content: 'Who needs this first? Developers already use multiple AI tools daily. They feel the pain of fragmented context most acutely.',
                timestamp: d(18),
                type: 'question',
                source: 'self-reflection'
            },
            {
                id: 'n2',
                content: 'Sarah\'s GTM advice: "Don\'t try to be everything. Start as a browser extension that captures thinking patterns from LLM usage. Then expand."',
                timestamp: d(22),
                type: 'external-input',
                source: 'conversation',
                linkedPerson: IDS.mentor
            },
            {
                id: 'n3',
                content: 'Prototype strategy: Build the core kernel + dashboard first. Ship as open-source. Let developers inspect and trust the data layer. Then build collection plugins.',
                timestamp: d(25),
                type: 'analysis',
                source: 'self-analysis'
            }
        ],
        linkedIntents: [IDS.aiStartup, IDS.fundingStrategy],
        createdAt: d(18)
    });

    // ═══════════════════════════════════════════
    // RELATIONS
    // ═══════════════════════════════════════════
    console.log('  🔗 Creating relations...');

    // Person ↔ Person
    await create('relations', {
        sourceType: 'person', sourceId: IDS.self,
        targetType: 'person', targetId: IDS.mentor,
        label: 'mentored-by', strength: 0.85,
        context: 'Sarah serves as informal advisor on startup strategy and AI market'
    });

    await create('relations', {
        sourceType: 'person', sourceId: IDS.self,
        targetType: 'person', targetId: IDS.cofounder,
        label: 'building-with', strength: 0.92,
        context: 'Alex is the strongest co-founder candidate. Aligned on vision and complementary skills.'
    });

    await create('relations', {
        sourceType: 'person', sourceId: IDS.self,
        targetType: 'person', targetId: IDS.investor,
        label: 'pitching-to', strength: 0.6,
        context: 'Ming is interested but needs to see a prototype. Introduced via Sarah.'
    });

    await create('relations', {
        sourceType: 'person', sourceId: IDS.self,
        targetType: 'person', targetId: IDS.colleague,
        label: 'supported-by', strength: 0.8,
        context: 'David is emotional support and reality check through the transition.'
    });

    await create('relations', {
        sourceType: 'person', sourceId: IDS.mentor,
        targetType: 'person', targetId: IDS.investor,
        label: 'introduced', strength: 0.7,
        context: 'Sarah connected me with Ming from her investor network.'
    });

    // Person ↔ Intent
    await create('relations', {
        sourceType: 'person', sourceId: IDS.mentor,
        targetType: 'intent', targetId: IDS.fundingStrategy,
        label: 'advising-on', strength: 0.8,
        context: 'Sarah is actively helping shape the fundraising approach.'
    });

    await create('relations', {
        sourceType: 'person', sourceId: IDS.cofounder,
        targetType: 'intent', targetId: IDS.productVision,
        label: 'co-creating', strength: 0.95,
        context: 'Alex and I are jointly designing the architecture.'
    });

    await create('relations', {
        sourceType: 'person', sourceId: IDS.investor,
        targetType: 'intent', targetId: IDS.fundingStrategy,
        label: 'evaluating', strength: 0.5,
        context: 'Ming is a potential lead investor for the seed round.'
    });

    // Intent ↔ Intent
    await create('relations', {
        sourceType: 'intent', sourceId: IDS.careerChange,
        targetType: 'intent', targetId: IDS.aiStartup,
        label: 'leads-to', strength: 1.0,
        context: 'The career change is specifically motivated by this startup idea.'
    });

    await create('relations', {
        sourceType: 'intent', sourceId: IDS.aiStartup,
        targetType: 'intent', targetId: IDS.productVision,
        label: 'requires', strength: 0.95,
        context: 'Product vision is the core deliverable for the startup.'
    });

    await create('relations', {
        sourceType: 'intent', sourceId: IDS.aiStartup,
        targetType: 'intent', targetId: IDS.fundingStrategy,
        label: 'enables', strength: 0.8,
        context: 'Funding is needed to build the full product.'
    });

    await create('relations', {
        sourceType: 'intent', sourceId: IDS.aiStartup,
        targetType: 'intent', targetId: IDS.teamBuilding,
        label: 'requires', strength: 0.85,
        context: 'Need a founding team to execute.'
    });

    await create('relations', {
        sourceType: 'intent', sourceId: IDS.marketResearch,
        targetType: 'intent', targetId: IDS.productVision,
        label: 'informs', strength: 0.75,
        context: 'Market research directly shapes product positioning.'
    });

    // Intent ↔ Thinking Chain
    await create('relations', {
        sourceType: 'thinking-chain', sourceId: IDS.shouldILeave,
        targetType: 'intent', targetId: IDS.careerChange,
        label: 'originated', strength: 1.0,
        context: 'This thinking chain is the origin of the career change intent.'
    });

    await create('relations', {
        sourceType: 'thinking-chain', sourceId: IDS.whatToBuild,
        targetType: 'intent', targetId: IDS.aiStartup,
        label: 'crystallized', strength: 0.95,
        context: 'This thinking chain led to the Self Kernel concept.'
    });

    await create('relations', {
        sourceType: 'thinking-chain', sourceId: IDS.piConcept,
        targetType: 'intent', targetId: IDS.productVision,
        label: 'defines', strength: 0.9,
        context: 'The theoretical framework that underpins the product architecture.'
    });

    // ═══════════════════════════════════════════
    // TRAJECTORIES (execution paths)
    // ═══════════════════════════════════════════
    console.log('  🛤️  Creating trajectories...');

    await create('trajectories', {
        id: IDS.mainTrajectory,
        title: 'Career Pivot → Self Kernel Launch',
        description: 'The master trajectory from corporate PM to launching Self Kernel.',
        milestones: [
            { label: 'First doubt', date: d(0), status: 'completed', intentId: IDS.careerChange },
            { label: 'Market research', date: d(5), status: 'completed', intentId: IDS.marketResearch },
            { label: 'Met Alex', date: d(5), status: 'completed', intentId: IDS.teamBuilding },
            { label: 'PI concept formed', date: d(12), status: 'completed', intentId: IDS.productVision },
            { label: 'Met Ming via Sarah', date: d(15), status: 'completed', intentId: IDS.fundingStrategy },
            { label: 'Architecture finalized', date: d(22), status: 'completed', intentId: IDS.productVision },
            { label: 'Prototype started', date: d(25), status: 'in-progress', intentId: IDS.aiStartup },
            { label: 'Prototype demo to Ming', date: d(35), status: 'planned', intentId: IDS.fundingStrategy },
            { label: 'Resignation date', date: d(45), status: 'planned', intentId: IDS.careerChange },
            { label: 'Seed round close', date: d(90), status: 'planned', intentId: IDS.fundingStrategy },
        ],
        createdAt: d(0)
    });

    // ═══════════════════════════════════════════
    // COGNITIVE STAGES
    // ═══════════════════════════════════════════
    console.log('  🧩 Creating cognitive stages...');

    await create('cognitive-stages', {
        id: 'cs-weekly-1',
        week: 1,
        startDate: d(0),
        endDate: d(7),
        dominantStage: 'exploration',
        summary: 'Questioning current career path. Exploring vague ideas about personal AI. High uncertainty, lots of branching questions.',
        intentActivity: { [IDS.careerChange]: 'exploration', [IDS.personalGrowth]: 'exploration' },
        energyLevel: 0.6,
        clarityLevel: 0.3
    });

    await create('cognitive-stages', {
        id: 'cs-weekly-2',
        week: 2,
        startDate: d(7),
        endDate: d(14),
        dominantStage: 'structuring',
        summary: 'Ideas converging around personal intelligence concept. MCP research deepening. Alex conversations crystallizing architecture. Growing confidence.',
        intentActivity: { [IDS.aiStartup]: 'exploration', [IDS.productVision]: 'structuring', [IDS.marketResearch]: 'execution' },
        energyLevel: 0.75,
        clarityLevel: 0.55
    });

    await create('cognitive-stages', {
        id: 'cs-weekly-3',
        week: 3,
        startDate: d(14),
        endDate: d(21),
        dominantStage: 'decision',
        summary: 'Major decisions made: committing to the startup, finalizing architecture, beginning investor outreach. High energy, high clarity.',
        intentActivity: { [IDS.careerChange]: 'decision', [IDS.fundingStrategy]: 'exploration', [IDS.productVision]: 'decision' },
        energyLevel: 0.9,
        clarityLevel: 0.8
    });

    await create('cognitive-stages', {
        id: 'cs-weekly-4',
        week: 4,
        startDate: d(21),
        endDate: d(28),
        dominantStage: 'execution',
        summary: 'Building mode. Prototype development underway. Less thinking, more doing. Occasional reflection on whether approach is right.',
        intentActivity: { [IDS.aiStartup]: 'execution', [IDS.careerChange]: 'execution', [IDS.teamBuilding]: 'exploration' },
        energyLevel: 0.85,
        clarityLevel: 0.85
    });

    console.log('\n✅ Seed complete! Your Self Kernel has been initialized with:');
    console.log('   • 6 persons (including digital twin)');
    console.log('   • 7 intents with cognitive stage histories');
    console.log('   • 4 thinking chains with 19 thought nodes');
    console.log('   • 16 relations (person↔person, person↔intent, intent↔intent)');
    console.log('   • 1 career trajectory with 10 milestones');
    console.log('   • 4 weekly cognitive stage snapshots');
    console.log('');
    console.log('   Data stored in: data/');
    console.log('   Run "npm run dev" to explore your kernel!');
}

seed().catch(console.error);
