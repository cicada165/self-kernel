/**
 * Thinking Chains Panel — Cross-session thought threads with branching
 */

import { api } from '../api.js';

let selectedChainId = null;

export async function renderThinking(container) {
    container.innerHTML = '<div class="panel-header"><h2>⌛ Loading thinking chains...</h2></div>';

    try {
        const chains = await api.getChains();
        selectedChainId = chains[0]?.id || null;

        container.innerHTML = `
      <div class="panel-header">
        <h2>💭 Thinking Chains</h2>
        <p>Cross-session thought threads — see how questions on Day 1 connect to decisions on Day 14.</p>
      </div>

      <div class="chain-list" id="chain-list">
        ${chains.map(c => `
          <div class="chain-card ${c.id === selectedChainId ? 'selected' : ''}" data-chain-id="${c.id}" id="chain-btn-${c.id}">
            <div class="chain-title">${c.title}</div>
            <div class="chain-desc">${c.description}</div>
            <div class="chain-meta">${c.nodes?.length || 0} thought nodes · ${formatDate(c.createdAt)}</div>
          </div>
        `).join('')}
      </div>

      <div class="chain-detail" id="chain-detail">
        ${selectedChainId ? renderChainDetail(chains[0]) : '<p style="color: var(--text-muted);">Select a thinking chain above.</p>'}
      </div>
    `;

        // Wire up clicks
        container.querySelectorAll('.chain-card').forEach(card => {
            card.addEventListener('click', async () => {
                const id = card.dataset.chainId;
                selectedChainId = id;

                // Update selection state
                container.querySelectorAll('.chain-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');

                // Render detail
                const chain = chains.find(c => c.id === id);
                if (chain) {
                    document.getElementById('chain-detail').innerHTML = renderChainDetail(chain);
                }
            });
        });
    } catch (err) {
        container.innerHTML = `<div class="panel-header"><h2>💭 Thinking Chains</h2><p style="color: var(--accent-danger);">Error: ${err.message}</p></div>`;
    }
}

function renderChainDetail(chain) {
    if (!chain || !chain.nodes) return '';

    return `
    <div style="padding: 20px; background: var(--bg-card); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
      <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 4px;">${chain.title}</h3>
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 20px;">${chain.description}</p>
      
      <div style="position: relative;">
        ${chain.nodes.map((node, i) => `
          <div class="thought-node">
            <div class="thought-marker ${node.type}"></div>
            <div class="thought-content">
              <div class="thought-text">${node.content}</div>
              <div class="thought-meta">
                <span class="thought-type ${node.type}">${node.type.replace('-', ' ')}</span>
                <span class="thought-source">${node.source}</span>
                <span class="thought-source">${formatDate(node.timestamp)}</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function formatDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
