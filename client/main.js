/**
 * Self Kernel — Main Application
 * Initializes navigation, routing, and panel rendering
 */

import { renderOverview } from './panels/overview.js';
import { renderGraph } from './panels/graph.js';
import { renderTimeline } from './panels/timeline.js';
import { renderThinking } from './panels/thinking.js';
import { renderPersons } from './panels/persons.js';
import { renderRelationships } from './panels/relationships.js';
import { renderInspector } from './panels/inspector.js';
import { renderIntentProxy } from './panels/intentProxy.js';
import { renderMcp } from './panels/mcp.js';
import { renderFsm } from './panels/fsm.js';
import { renderAutomations } from './panels/automations.js';
import { renderStrategies } from './panels/strategies.js';
import { renderHealthPanel } from './panels/health.js';
import { renderTrajectoryBuilder } from './panels/trajectoryBuilder.js';
import { renderSearch } from './panels/search.js';
import { OnboardingOverlay } from './components/onboarding.js';
import { QuickAdd } from './components/quick-add.js';
import { LearningFeed } from './components/learning-feed.js';

const panelRenderers = {
    overview: renderOverview,
    graph: renderGraph,
    timeline: renderTimeline,
    thinking: renderThinking,
    persons: renderPersons,
    relationships: renderRelationships,
    inspector: renderInspector,
    intentProxy: renderIntentProxy,
    mcp: renderMcp,
    fsm: renderFsm,
    automations: renderAutomations,
    strategies: renderStrategies,
    health: renderHealthPanel,
    trajectoryBuilder: renderTrajectoryBuilder,
    search: renderSearch,
};

let currentPanel = 'overview';
const panelCache = new Set(); // Track which panels have been rendered

function switchPanel(panelName) {
    if (!panelRenderers[panelName]) return;
    currentPanel = panelName;

    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.panel === panelName);
    });

    // Switch active panel
    document.querySelectorAll('.panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${panelName}`);
    });

    // Render panel if not cached (or always re-render for dynamic content)
    const container = document.getElementById(`panel-${panelName}`);
    if (container && !panelCache.has(panelName)) {
        panelRenderers[panelName](container);
        panelCache.add(panelName);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Set up navigation clicks
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            switchPanel(item.dataset.panel);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey) return;
        const shortcuts = {
            '1': 'overview',
            '2': 'graph',
            '3': 'timeline',
            '4': 'thinking',
            '5': 'persons',
            '6': 'relationships',
            '7': 'inspector',
            '8': 'intentProxy',
            '9': 'strategies',
            '0': 'automations'
        };
        if (shortcuts[e.key] && !e.target.closest('textarea, input, select')) {
            e.preventDefault();
            switchPanel(shortcuts[e.key]);
        }
    });

    // Render initial panel
    switchPanel('overview');

    // Check server connectivity
    checkServer();

    // Initialize UX components
    const onboarding = new OnboardingOverlay();
    onboarding.show();

    new QuickAdd();

    const learningFeed = new LearningFeed();
    window.learningFeedInstance = learningFeed; // Make globally accessible

    // Add sample learning event after 3 seconds (demo)
    setTimeout(() => {
        learningFeed.addEvent({
            type: 'behavior_learned',
            title: 'Welcome to Self Kernel!',
            description: 'Your kernel is ready to learn from your behavior patterns and help organize your thoughts.',
            details: {
                'Status': 'Active',
                'Learning Mode': 'Continuous'
            }
        });
    }, 3000);
});

async function checkServer() {
    const indicator = document.getElementById('kernel-status-indicator');
    try {
        const res = await fetch('http://localhost:3000/api/health');
        if (res.ok) {
            indicator.innerHTML = '<span class="status-dot online"></span><span>Kernel Online</span>';
        } else {
            throw new Error('Server not healthy');
        }
    } catch {
        indicator.innerHTML = '<span class="status-dot" style="background: var(--accent-danger);"></span><span>Kernel Offline</span>';
    }
}
