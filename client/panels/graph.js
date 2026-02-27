/**
 * Knowledge Graph Panel — D3.js force-directed graph
 * Visualizes Person ↔ Intent ↔ Relation connections
 */

import { api } from '../api.js';

let simulation = null;

export async function renderGraph(container) {
    container.innerHTML = `
    <div class="panel-header">
      <h2>◎ Knowledge Graph</h2>
      <p>Interactive visualization of your personal knowledge network — persons, intents, and thinking chains.</p>
    </div>
    <div class="graph-container" id="graph-root">
      <svg id="graph-svg"></svg>
      <div class="graph-legend">
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--node-self);"></span> Self
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--node-person);"></span> Person
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--node-intent);"></span> Intent
        </div>
        <div class="legend-item">
          <span class="legend-dot" style="background: var(--node-chain);"></span> Thinking Chain
        </div>
      </div>
      <div class="graph-tooltip" id="graph-tooltip"></div>
    </div>
  `;

    try {
        const graphData = await api.getGraph();
        await initGraph(graphData);
    } catch (err) {
        document.getElementById('graph-root').innerHTML = `<p style="padding: 40px; color: var(--text-muted);">Could not load graph data: ${err.message}</p>`;
    }
}

async function initGraph(data) {
    // Dynamically load D3
    if (!window.d3) {
        await loadScript('https://d3js.org/d3.v7.min.js');
    }

    const svg = d3.select('#graph-svg');
    const container = document.getElementById('graph-root');
    const tooltip = document.getElementById('graph-tooltip');
    const width = container.clientWidth;
    const height = container.clientHeight;

    svg.attr('viewBox', [0, 0, width, height]);

    // Filter out nodes that have no connections
    const connectedIds = new Set();
    data.edges.forEach(e => { connectedIds.add(e.source); connectedIds.add(e.target); });
    const nodes = data.nodes.filter(n => connectedIds.has(n.id));
    const edges = data.edges.filter(e =>
        nodes.find(n => n.id === e.source) && nodes.find(n => n.id === e.target)
    );

    // Node color mapping
    const nodeColor = (node) => {
        if (node.type === 'person' && node.data?.type === 'self') return '#ffeaa7';
        if (node.type === 'person' && node.data?.type === 'digital-twin') return '#00cec9';
        if (node.type === 'person') return '#6c5ce7';
        if (node.type === 'intent') {
            const stageColors = {
                exploration: '#00cec9',
                structuring: '#6c5ce7',
                decision: '#fdcb6e',
                execution: '#00b894',
                reflection: '#fd79a8'
            };
            return stageColors[node.stage] || '#00cec9';
        }
        if (node.type === 'thinking-chain') return '#fd79a8';
        return '#9a9ab0';
    };

    const nodeRadius = (node) => {
        if (node.type === 'person' && node.data?.type === 'self') return 22;
        if (node.type === 'person') return 16;
        if (node.type === 'intent') return 14;
        return 12;
    };

    // Stop existing simulation
    if (simulation) simulation.stop();

    // Create simulation
    simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(edges).id(d => d.id).distance(120).strength(0.4))
        .force('charge', d3.forceManyBody().strength(-300))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => nodeRadius(d) + 10));

    // Gradient defs
    const defs = svg.append('defs');

    // Glow filter
    const filter = defs.append('filter').attr('id', 'glow');
    filter.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Draw edges
    const link = svg.append('g')
        .selectAll('line')
        .data(edges)
        .join('line')
        .attr('stroke', 'rgba(255, 255, 255, 0.08)')
        .attr('stroke-width', d => Math.max(d.strength * 3, 0.5));

    // Edge labels
    const linkLabel = svg.append('g')
        .selectAll('text')
        .data(edges)
        .join('text')
        .text(d => d.label)
        .attr('font-size', 9)
        .attr('fill', 'rgba(255, 255, 255, 0.2)')
        .attr('font-family', 'Inter, sans-serif')
        .attr('text-anchor', 'middle');

    // Draw nodes
    const node = svg.append('g')
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', d => nodeRadius(d))
        .attr('fill', d => nodeColor(d))
        .attr('fill-opacity', 0.8)
        .attr('stroke', d => nodeColor(d))
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.3)
        .attr('filter', 'url(#glow)')
        .style('cursor', 'pointer')
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded));

    // Node labels
    const label = svg.append('g')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .text(d => truncate(d.label, 18))
        .attr('font-size', 11)
        .attr('font-weight', 500)
        .attr('fill', 'rgba(232, 232, 239, 0.8)')
        .attr('font-family', 'Inter, sans-serif')
        .attr('text-anchor', 'middle')
        .attr('dy', d => nodeRadius(d) + 16)
        .style('pointer-events', 'none');

    // Tooltip
    node.on('mouseover', (event, d) => {
        tooltip.innerHTML = buildTooltip(d);
        tooltip.classList.add('visible');
        tooltip.style.left = `${event.offsetX + 16}px`;
        tooltip.style.top = `${event.offsetY - 10}px`;

        // Highlight connected
        const connected = new Set();
        edges.forEach(e => {
            if (e.source.id === d.id) connected.add(e.target.id);
            if (e.target.id === d.id) connected.add(e.source.id);
        });
        connected.add(d.id);

        node.attr('fill-opacity', n => connected.has(n.id) ? 1 : 0.15);
        link.attr('stroke', l => (l.source.id === d.id || l.target.id === d.id) ? 'rgba(108, 92, 231, 0.5)' : 'rgba(255, 255, 255, 0.03)');
        label.attr('fill-opacity', n => connected.has(n.id) ? 1 : 0.15);
    });

    node.on('mouseout', () => {
        tooltip.classList.remove('visible');
        node.attr('fill-opacity', 0.8);
        link.attr('stroke', 'rgba(255, 255, 255, 0.08)');
        label.attr('fill-opacity', 0.8);
    });

    node.on('mousemove', (event) => {
        tooltip.style.left = `${event.offsetX + 16}px`;
        tooltip.style.top = `${event.offsetY - 10}px`;
    });

    // Simulation tick
    simulation.on('tick', () => {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        linkLabel
            .attr('x', d => (d.source.x + d.target.x) / 2)
            .attr('y', d => (d.source.y + d.target.y) / 2);

        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);

        label
            .attr('x', d => d.x)
            .attr('y', d => d.y);
    });

    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }
}

function buildTooltip(node) {
    let html = `<div style="font-weight: 600; margin-bottom: 4px;">${node.label}</div>`;
    html += `<div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; margin-bottom: 6px;">${node.type}</div>`;

    if (node.type === 'person') {
        html += `<div style="font-size: 11px; color: var(--text-secondary);">${node.data?.role || ''}</div>`;
        if (node.data?.interactions) {
            html += `<div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">${node.data.interactions} interactions</div>`;
        }
    } else if (node.type === 'intent') {
        html += `<div style="margin-bottom: 4px;"><span class="badge badge-${node.stage}">${node.stage}</span></div>`;
        html += `<div style="font-size: 11px; color: var(--text-secondary); line-height: 1.4;">${truncate(node.data?.description || '', 120)}</div>`;
    } else if (node.type === 'thinking-chain') {
        html += `<div style="font-size: 11px; color: var(--text-secondary);">${truncate(node.data?.description || '', 100)}</div>`;
        html += `<div style="font-size: 10px; color: var(--text-muted); margin-top: 4px;">${node.data?.nodes?.length || 0} thought nodes</div>`;
    }
    return html;
}

function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? str.slice(0, len) + '…' : str;
}

function loadScript(src) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}
