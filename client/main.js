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
import { renderInsights } from './panels/insights.js';
import { renderClusters } from './panels/clusters.js';
import { renderTemplates } from './panels/templates.js';
import { OnboardingOverlay } from './components/onboarding.js';
import { QuickAdd } from './components/quick-add.js';
import { LearningFeed } from './components/learning-feed.js';
import { CommandPalette } from './components/command-palette.js';
import { themeManager } from './utils/themeManager.js';
import { ShareViewer } from './components/share-viewer.js';

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
    insights: renderInsights,
    clusters: renderClusters,
    templates: renderTemplates,
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
    // Check if we're viewing a shared resource
    if (window.location.pathname.startsWith('/share/')) {
        new ShareViewer();
        return; // Don't initialize the main app
    }

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

    // Initialize command palette
    new CommandPalette();

    // Initialize mobile menu
    initMobileMenu();

    // Initialize theme manager
    themeManager.init();
    initThemeToggle();

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

function initMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const toggle = document.getElementById('mobile-menu-toggle');
    const overlay = document.getElementById('mobile-overlay');

    if (!sidebar || !toggle || !overlay) return;

    // Toggle menu
    const toggleMenu = () => {
        sidebar.classList.toggle('mobile-open');
        toggle.classList.toggle('active');
        overlay.classList.toggle('active');
    };

    // Close menu
    const closeMenu = () => {
        sidebar.classList.remove('mobile-open');
        toggle.classList.remove('active');
        overlay.classList.remove('active');
    };

    // Event listeners
    toggle.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', closeMenu);

    // Close menu when navigating to a panel
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', closeMenu);
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('mobile-open')) {
            closeMenu();
        }
    });
}

function initThemeToggle() {
    // Add theme toggle button to sidebar footer
    const sidebarFooter = document.querySelector('.sidebar-footer');
    if (!sidebarFooter) return;

    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = `
        <span class="theme-icon">${themeManager.isDark() ? '☀️' : '🌙'}</span>
        <span class="theme-label">${themeManager.isDark() ? 'Light Mode' : 'Dark Mode'}</span>
    `;
    themeToggle.title = 'Toggle theme';

    themeToggle.addEventListener('click', () => {
        themeManager.toggle();
        themeToggle.querySelector('.theme-icon').textContent = themeManager.isDark() ? '☀️' : '🌙';
        themeToggle.querySelector('.theme-label').textContent = themeManager.isDark() ? 'Light Mode' : 'Dark Mode';
    });

    // Insert before kernel status
    const kernelStatus = document.querySelector('.kernel-status');
    if (kernelStatus) {
        sidebarFooter.insertBefore(themeToggle, kernelStatus);
    } else {
        sidebarFooter.appendChild(themeToggle);
    }
}
