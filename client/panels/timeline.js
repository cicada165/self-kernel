/**
 * Intent Timeline Panel — Visualizes how intents evolve over time
 * Shows cognitive stages and stage history
 */

import { api } from '../api.js';

export async function renderTimeline(container) {
  container.innerHTML = '<div class="panel-header"><h2>⌛ Loading timeline...</h2></div>';

  try {
    const intents = await api.getIntents();

    // Build timeline events from stage histories
    const events = [];
    intents.forEach(intent => {
      (intent.stageHistory || []).forEach(sh => {
        events.push({
          intent,
          stage: sh.stage,
          note: sh.note,
          timestamp: sh.timestamp
        });
      });
    });

    events.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    container.innerHTML = `
      <div class="panel-header">
        <h2>↗ Intent Timeline</h2>
        <p>How your cognitive journey evolved over time — from exploration to execution.</p>
      </div>

      <!-- Stage Legend -->
      <div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
        <div class="legend-item"><span class="legend-dot" style="background: var(--stage-EXPLORATION);"></span> Exploration</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--stage-REFINING);"></span> Refining</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--stage-DECISION);"></span> Decision</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--stage-REFUTED);"></span> Refuted</div>
      </div>

      <!-- Intent Cards (summary) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 32px;">
        ${intents.map(i => `
          <div class="card" style="padding: 14px; cursor: pointer;" onclick="document.getElementById('event-${i.id}')?.scrollIntoView({behavior: 'smooth', block: 'center'})">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 13px; font-weight: 600;">${truncate(i.title, 28)}</span>
              <span class="badge badge-${i.stage}" style="font-size: 9px;">${i.stage}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">${(i.stageHistory || []).length} stage changes</div>
            ${!i.active ? '<span style="font-size: 10px; color: var(--text-muted);">✓ completed</span>' : ''}
          </div>
        `).join('')}
      </div>

      <!-- Timeline -->
      <div class="timeline-container">
        <div class="timeline-line"></div>
        ${events.map((ev, idx) => `
          <div class="timeline-item" id="event-${idx === 0 ? ev.intent.id : ''}" style="border-left: 3px solid var(--stage-${ev.stage});">
            <div class="timeline-dot" style="background: var(--stage-${ev.stage}); box-shadow: 0 0 8px var(--stage-${ev.stage});"></div>
            <div class="timeline-date">${formatDate(ev.timestamp)}</div>
            <div class="timeline-title">${ev.intent.title}</div>
            <div class="timeline-desc">${ev.note}</div>
            <div class="timeline-meta">
              <span class="badge badge-${ev.stage}">${ev.stage}</span>
              ${(ev.intent.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="panel-header"><h2>↗ Intent Timeline</h2><p style="color: var(--accent-danger);">Error: ${err.message}</p></div>`;
  }
}

function formatDate(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
