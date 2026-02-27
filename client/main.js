/**
 * Self Kernel — Main Application
 * Initializes navigation, routing, and panel rendering
 */

import { renderOverview } from './panels/overview.js';
import { renderGraph } from './panels/graph.js';
import { renderTimeline } from './panels/timeline.js';
import { renderThinking } from './panels/thinking.js';
import { renderPersons } from './panels/persons.js';
import { renderInspector } from './panels/inspector.js';
import { renderMcp } from './panels/mcp.js';

const panelRenderers = {
    overview: renderOverview,
    graph: renderGraph,
    timeline: renderTimeline,
    thinking: renderThinking,
    persons: renderPersons,
    inspector: renderInspector,
    mcp: renderMcp,
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
            '6': 'inspector',
            '7': 'mcp'
        };
        if (shortcuts[e.key] && !e.target.closest('textarea, input')) {
            e.preventDefault();
            switchPanel(shortcuts[e.key]);
        }
    });

    // Render initial panel
    switchPanel('overview');

    // Check server connectivity
    checkServer();
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
