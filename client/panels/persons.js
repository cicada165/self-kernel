/**
 * Persons Panel — Manage Person entities
 */

import { api } from '../api.js';

export async function renderPersons(container) {
    container.innerHTML = '<div class="panel-header"><h2>⌛ Loading persons...</h2></div>';

    try {
        const persons = await api.getPersons();
        const relations = await api.getRelations();

        // Count relations per person
        const relationCount = {};
        relations.forEach(r => {
            if (r.sourceType === 'person') relationCount[r.sourceId] = (relationCount[r.sourceId] || 0) + 1;
            if (r.targetType === 'person') relationCount[r.targetId] = (relationCount[r.targetId] || 0) + 1;
        });

        const avatarIcon = (type) => {
            if (type === 'self') return '🧠';
            if (type === 'digital-twin') return '🤖';
            return '👤';
        };

        container.innerHTML = `
      <div class="panel-header">
        <h2>👤 Persons</h2>
        <p>People in your personal intelligence network — including yourself and your digital twin.</p>
      </div>

      <div class="persons-grid">
        ${persons.map(p => `
          <div class="person-card type-${p.type}">
            <div class="person-avatar type-${p.type}">${avatarIcon(p.type)}</div>
            <div class="person-name">${p.name}</div>
            <div class="person-role">${p.role || 'No role defined'}</div>
            <div class="person-notes">${p.notes || ''}</div>
            <div style="margin: 10px 0;">
              ${(p.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
            <div class="person-stats">
              <span>${p.interactions || 0} interactions</span>
              <span>${relationCount[p.id] || 0} relations</span>
              <span>${formatDate(p.lastSeen)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
    } catch (err) {
        container.innerHTML = `<div class="panel-header"><h2>👤 Persons</h2><p style="color: var(--accent-danger);">Error: ${err.message}</p></div>`;
    }
}

function formatDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
