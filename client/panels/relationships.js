/**
 * Relationships Panel — Visualizes Person ↔ Intent ↔ Thinking connections
 * Shows how people influence intents and how thoughts shape actions
 */

import { api } from '../api.js';

export async function renderRelationships(container) {
  container.innerHTML = '<div class="panel-header"><h2>⌛ Loading relationships...</h2></div>';

  try {
    const [persons, intents, relations, chains] = await Promise.all([
      api.getPersons(),
      api.getIntents(),
      api.getRelations(),
      api.getChains()
    ]);

    // Build relationship maps
    const personToIntents = new Map();
    const intentToPersons = new Map();
    const intentToChains = new Map();

    // Organize relations
    relations.forEach(rel => {
      if (rel.sourceType === 'person' && rel.targetType === 'intent') {
        if (!personToIntents.has(rel.sourceId)) personToIntents.set(rel.sourceId, []);
        personToIntents.get(rel.sourceId).push({ relation: rel, intent: intents.find(i => i.id === rel.targetId) });

        if (!intentToPersons.has(rel.targetId)) intentToPersons.set(rel.targetId, []);
        intentToPersons.get(rel.targetId).push({ relation: rel, person: persons.find(p => p.id === rel.sourceId) });
      }

      if (rel.sourceType === 'thinking-chain' && rel.targetType === 'intent') {
        if (!intentToChains.has(rel.targetId)) intentToChains.set(rel.targetId, []);
        intentToChains.get(rel.targetId).push({ relation: rel, chain: chains.find(c => c.id === rel.sourceId) });
      }
    });

    container.innerHTML = `
      <div class="panel-header">
        <h2>🔗 Relationships</h2>
        <p>Understanding how people, thoughts, and intents interconnect to shape your journey.</p>
      </div>

      <!-- Summary Stats -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-value">${relations.length}</div>
          <div class="stat-label">Total Relations</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${personToIntents.size}</div>
          <div class="stat-label">Connected Persons</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${intentToPersons.size}</div>
          <div class="stat-label">Influenced Intents</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${intentToChains.size}</div>
          <div class="stat-label">Thought-Linked Intents</div>
        </div>
      </div>

      <!-- Person-Centric View -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <span class="card-title">👥 Person → Intent Influence Map</span>
          <span style="font-size: 12px; color: var(--text-muted);">Who shapes which intents?</span>
        </div>
        <div style="padding: 16px;">
          ${persons.map(person => renderPersonInfluence(person, personToIntents.get(person.id) || [], intents)).join('')}
        </div>
      </div>

      <!-- Intent-Centric View -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">🎯 Intent → Person Context</span>
          <span style="font-size: 12px; color: var(--text-muted);">Which people are involved in each intent?</span>
        </div>
        <div style="padding: 16px;">
          ${intents.filter(i => i.active).map(intent =>
            renderIntentContext(intent, intentToPersons.get(intent.id) || [], intentToChains.get(intent.id) || [])
          ).join('')}
        </div>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `
      <div class="panel-header">
        <h2>🔗 Relationships</h2>
        <p style="color: var(--accent-danger);">Error loading relationships: ${err.message}</p>
      </div>
    `;
  }
}

function renderPersonInfluence(person, connections, allIntents) {
  if (connections.length === 0) return '';

  const roleColor = person.type === 'self' ? 'var(--accent-primary)'
    : person.role?.includes('mentor') ? 'var(--accent-success)'
    : person.role?.includes('investor') ? 'var(--accent-warning)'
    : 'var(--text-secondary)';

  return `
    <div style="margin-bottom: 20px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; border-left: 3px solid ${roleColor};">
      <div style="display: flex; align-items: start; margin-bottom: 12px;">
        <div style="flex: 1;">
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 4px;">
            ${person.name}
            ${person.type === 'self' ? '<span style="font-size: 10px; color: var(--accent-primary); margin-left: 6px;">● YOU</span>' : ''}
          </div>
          <div style="font-size: 11px; color: var(--text-secondary);">${person.role || 'Contact'}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 18px; font-weight: 700; color: ${roleColor};">${connections.length}</div>
          <div style="font-size: 10px; color: var(--text-muted);">influence${connections.length > 1 ? 's' : ''}</div>
        </div>
      </div>

      <!-- Connected Intents -->
      <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
        ${connections.map(({ relation, intent }) => {
          if (!intent) return '';
          return `
            <div style="flex: 0 0 calc(50% - 3px); background: var(--bg-secondary); padding: 8px; border-radius: 6px; font-size: 11px;">
              <div style="font-weight: 600; margin-bottom: 4px;">${truncate(intent.title, 30)}</div>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="badge badge-${intent.stage}" style="font-size: 9px;">${intent.stage}</span>
                <span style="color: var(--text-muted); font-size: 10px;">${relation.label || 'linked'}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderIntentContext(intent, connectedPersons, connectedChains) {
  const hasConnections = connectedPersons.length > 0 || connectedChains.length > 0;
  if (!hasConnections) return '';

  const stageColor = getStageColor(intent.stage);

  return `
    <div style="margin-bottom: 16px; padding: 14px; background: var(--bg-tertiary); border-radius: 8px; border-left: 3px solid ${stageColor};">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <div style="flex: 1;">
          <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">${intent.title}</div>
          <span class="badge badge-${intent.stage}" style="font-size: 9px;">${intent.stage}</span>
        </div>
      </div>

      ${connectedPersons.length > 0 ? `
        <div style="margin-bottom: 8px;">
          <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">People</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${connectedPersons.map(({ person, relation }) => {
              if (!person) return '';
              return `
                <div style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: var(--bg-secondary); border-radius: 12px; font-size: 11px;">
                  <span>${person.name}</span>
                  <span style="color: var(--text-muted); font-size: 9px;">(${relation.label || 'linked'})</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${connectedChains.length > 0 ? `
        <div>
          <div style="font-size: 10px; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px;">Thinking Chains</div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${connectedChains.map(({ chain, relation }) => {
              if (!chain) return '';
              return `
                <div style="font-size: 11px; color: var(--text-secondary);">
                  💭 ${truncate(chain.title, 50)} <span style="color: var(--text-muted); font-size: 9px;">(${relation.label || 'linked'})</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

function getStageColor(stage) {
  const colors = {
    exploration: '#4A9EFF',
    structuring: '#9B59B6',
    decision: '#F39C12',
    execution: '#27AE60',
    reflection: '#95A5A6'
  };
  return colors[stage?.toLowerCase()] || '#95A5A6';
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
