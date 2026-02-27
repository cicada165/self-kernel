/**
 * Overview Panel — Kernel status, stats, cognitive stages, activity feed
 */

import { api } from '../api.js';

export async function renderOverview(container) {
  container.innerHTML = '<div class="panel-header"><h2>⌛ Loading kernel...</h2></div>';

  try {
    const [status, activity, intents, persons, chains, trajectories] = await Promise.all([
      api.getStatus(),
      api.getActivity(),
      api.getIntents(),
      api.getPersons(),
      api.getChains(),
      api.getTrajectories()
    ]);

    const activeIntents = intents.filter(i => i.active);
    const trajectory = trajectories[0]; // Main trajectory

    container.innerHTML = `
      <div class="panel-header">
        <h2>🧠 Kernel Overview</h2>
        <p>Your Personal Intelligence Core — monitoring cognitive state, intents, and relationships.</p>
      </div>

      <!-- Stats Row -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${status.entities?.persons || 0}</div>
          <div class="stat-label">Persons</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${activeIntents.length}<span style="font-size: 14px; color: var(--text-muted)">/${intents.length}</span></div>
          <div class="stat-label">Active Intents</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${status.entities?.relations || 0}</div>
          <div class="stat-label">Relations</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${chains.length}</div>
          <div class="stat-label">Thinking Chains</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${formatUptime(status.uptime)}</div>
          <div class="stat-label">Uptime</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">MCP</div>
          <div class="stat-label">${status.mcpServer?.status || 'unknown'}</div>
        </div>
      </div>

      <!-- Cognitive Stages + Active Intents -->
      <div class="two-col">
        <!-- Quick Ingest -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🎙️ Quick Ingest</span>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
            Drop raw thoughts, meeting notes, or voice memos here. The Auto-Annotator will automatically extract Persons, Intents, and Relations and place them in your DAG.
          </p>
          <textarea id="ingest-input" placeholder="e.g. Just had coffee with Alex. He thinks we should pivot the MVP to focus entirely on the Orchestrator outbox first..." style="width: 100%; height: 80px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 12px; color: var(--text-primary); font-family: var(--font-sans); margin-bottom: 12px; resize: vertical;"></textarea>
          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 12px;">
            <span id="ingest-status" style="font-size: 12px; color: var(--text-muted);"></span>
            <button id="ingest-btn" class="btn btn-primary" style="padding: 6px 16px;">Process Intelligence 🧠</button>
          </div>
        </div>

        <!-- Cognitive Stage Evolution -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Cognitive Evolution (30 Days)</span>
          </div>
          ${renderCognitiveChart(intents)}
        </div>
      </div>

      <div class="two-col" style="margin-top: 20px;">
        <!-- Active Intents -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Active Intents</span>
          </div>
          <div class="intent-list">
            ${activeIntents.map(i => `
              <div class="activity-item" style="cursor: default;">
                <div class="activity-icon intent">🎯</div>
                <div class="activity-content">
                  <div class="activity-title">${i.title}</div>
                  <div style="margin-top: 4px;">
                    <span class="badge badge-${i.stage}">${i.stage}</span>
                    ${(i.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Trajectory + Activity Feed -->
      <div class="two-col" style="margin-top: 20px;">
        <!-- Trajectory Milestones -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Career Trajectory</span>
          </div>
          ${trajectory ? renderTrajectory(trajectory) : '<p style="color: var(--text-muted);">No trajectories yet.</p>'}
        </div>

        <!-- Activity Feed -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Recent Activity</span>
          </div>
          <ul class="activity-feed">
            ${activity.slice(0, 10).map(a => `
              <li class="activity-item">
                <div class="activity-icon ${a.type}">
                  ${a.type === 'intent' ? '🎯' : a.type === 'relation' ? '🔗' : '💭'}
                </div>
                <div class="activity-content">
                  <div class="activity-title">${a.entity}</div>
                  <div class="activity-time">${formatTime(a.timestamp)}</div>
                </div>
                ${a.stage ? `<span class="badge badge-${a.stage}">${a.stage}</span>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    // Wire up Ingest button
    const ingestBtn = container.querySelector('#ingest-btn');
    const ingestInput = container.querySelector('#ingest-input');
    const ingestStatus = container.querySelector('#ingest-status');

    if (ingestBtn) {
      ingestBtn.addEventListener('click', async () => {
        const text = ingestInput.value.trim();
        if (!text) return;

        ingestBtn.disabled = true;
        ingestBtn.textContent = 'Processing...';
        ingestStatus.innerHTML = '<span class="status-dot online"></span> Auto-Annotator running...';

        try {
          const result = await api.ingest(text, 'dashboard-quick-ingest');
          ingestInput.value = '';
          ingestStatus.innerHTML = `<span style="color: var(--accent-success);">✅ Extracted ${result.results.personsCreated} persons, ${result.results.intentsCreated} intents.</span>`;

          // Refresh dashboard after 2s
          setTimeout(() => renderOverview(container), 2000);
        } catch (err) {
          ingestStatus.innerHTML = `<span style="color: var(--accent-danger);">❌ Error: ${err.message}</span>`;
        } finally {
          ingestBtn.disabled = false;
          ingestBtn.textContent = 'Process Intelligence 🧠';
        }
      });
    }

  } catch (err) {
    container.innerHTML = `
      <div class="panel-header">
        <h2>🧠 Kernel Overview</h2>
        <p style="color: var(--accent-danger);">Could not connect to Self Kernel server. Make sure it's running on port 3000.</p>
        <p style="color: var(--text-muted); margin-top: 8px; font-family: var(--font-mono); font-size: 12px;">Error: ${err.message}</p>
      </div>
    `;
  }
}

function renderCognitiveChart(intents) {
  // Aggregate stages from intents
  const stageCounts = { exploration: 0, structuring: 0, decision: 0, execution: 0, reflection: 0 };
  intents.forEach(i => { if (stageCounts[i.stage] !== undefined) stageCounts[i.stage]++; });
  const total = Math.max(intents.length, 1);

  const stageColors = {
    exploration: 'var(--stage-exploration)',
    structuring: 'var(--stage-structuring)',
    decision: 'var(--stage-decision)',
    execution: 'var(--stage-execution)',
    reflection: 'var(--stage-reflection)'
  };

  return `
    <div style="display: flex; gap: 8px; align-items: flex-end; height: 120px; padding: 12px 0;">
      ${Object.entries(stageCounts).map(([stage, count]) => {
    const pct = Math.max((count / total) * 100, 8);
    return `
          <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;">
            <div style="width: 100%; height: ${pct}px; min-height: 8px; background: ${stageColors[stage]}; border-radius: 4px 4px 0 0; opacity: 0.7; transition: height 0.5s ease;"></div>
            <span style="font-size: 10px; color: var(--text-muted); text-transform: capitalize; text-align: center;">${stage}</span>
            <span style="font-size: 14px; font-weight: 600; color: ${stageColors[stage]};">${count}</span>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function renderTrajectory(trajectory) {
  return `
    <div style="padding-left: 18px; position: relative;">
      <div style="position: absolute; left: 4px; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, var(--accent-success), var(--accent-primary), var(--text-muted));"></div>
      ${trajectory.milestones.map(m => {
    const statusColor = m.status === 'completed' ? 'var(--accent-success)'
      : m.status === 'in-progress' ? 'var(--accent-warning)'
        : 'var(--text-muted)';
    const statusIcon = m.status === 'completed' ? '✓'
      : m.status === 'in-progress' ? '◉'
        : '○';
    return `
          <div style="display: flex; align-items: center; gap: 12px; padding: 6px 0; position: relative;">
            <span style="position: absolute; left: -17px; color: ${statusColor}; font-size: 12px; width: 14px; text-align: center;">${statusIcon}</span>
            <span style="font-size: 12px; flex: 1;">${m.label}</span>
            <span style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);">${new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
          </div>
        `;
  }).join('')}
    </div>
  `;
}

function formatUptime(seconds) {
  if (!seconds) return '0s';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
}

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
