/**
 * Automation Recipes Panel — OpenClaw Integration Dashboard
 * Shows staged intents → executed patterns → learned trajectories
 */

import { api } from '../api.js';

export async function renderAutomations(container) {
  container.innerHTML = '<div class="panel-header"><h2>⏳ Loading automation recipes...</h2></div>';

  try {
    const [stagedPayloads, executedPayloads, trajectories, intents] = await Promise.all([
      fetch('http://localhost:3000/api/openclaw/staged').then(r => r.json()),
      fetch('http://localhost:3000/api/openclaw/executed').then(r => r.json()),
      api.getTrajectories(),
      api.getIntents()
    ]);

    // Calculate stats
    const successRate = executedPayloads.length > 0
      ? (executedPayloads.filter(p => p.status === 'success').length / executedPayloads.length * 100).toFixed(1)
      : 0;

    const avgConfidence = stagedPayloads.length > 0
      ? (stagedPayloads.reduce((sum, p) => sum + (p.confidence_trigger || 0), 0) / stagedPayloads.length).toFixed(2)
      : 0;

    container.innerHTML = `
      <div class="panel-header">
        <h2>🤖 Automation Recipes</h2>
        <p>OpenClaw Integration Dashboard — Staged intents ready for execution, historical patterns, and learned trajectories.</p>
      </div>

      <!-- Stats Row -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stagedPayloads.length}</div>
          <div class="stat-label">Staged Payloads</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${executedPayloads.length}</div>
          <div class="stat-label">Executed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${successRate}%</div>
          <div class="stat-label">Success Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgConfidence}</div>
          <div class="stat-label">Avg Confidence</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${trajectories.length}</div>
          <div class="stat-label">RAT Patterns</div>
        </div>
      </div>

      <!-- Main Content: Three Sections -->
      <div class="automation-sections">
        <!-- 1. Staged Payloads (Ready for OpenClaw) -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">📦 Staged Payloads (Ready for OpenClaw)</span>
            <span class="badge" style="background: var(--accent-warning);">${stagedPayloads.length} pending</span>
          </div>
          <div class="automation-list">
            ${stagedPayloads.length === 0 ? `
              <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <div style="font-size: 48px; margin-bottom: 12px;">📭</div>
                <p>No staged payloads yet.</p>
                <p style="font-size: 13px; margin-top: 8px;">When an intent reaches DECISION stage with confidence > threshold, it will appear here.</p>
              </div>
            ` : stagedPayloads.map(payload => renderStagedPayload(payload, intents)).join('')}
          </div>
        </div>

        <!-- 2. Execution History -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">⚡ Execution History</span>
            <span class="badge" style="background: var(--accent-success);">${executedPayloads.filter(p => p.status === 'success').length} succeeded</span>
          </div>
          <div class="automation-list">
            ${executedPayloads.length === 0 ? `
              <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <div style="font-size: 48px; margin-bottom: 12px;">🕐</div>
                <p>No executions yet.</p>
                <p style="font-size: 13px; margin-top: 8px;">Payloads executed by OpenClaw will appear here with success/failure status.</p>
              </div>
            ` : executedPayloads.slice(0, 10).map(payload => renderExecutedPayload(payload)).join('')}
          </div>
        </div>

        <!-- 3. RAT (Retrieval-Augmented Trajectory) Patterns -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🧠 RAT: What Worked Before</span>
            <span class="badge" style="background: var(--accent-info);">${trajectories.length} patterns</span>
          </div>
          <div class="automation-list">
            ${trajectories.length === 0 ? `
              <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
                <div style="font-size: 48px; margin-bottom: 12px;">🔮</div>
                <p>No learned patterns yet.</p>
                <p style="font-size: 13px; margin-top: 8px;">As you execute automations, successful patterns will be recorded here for reuse.</p>
              </div>
            ` : trajectories.map(trajectory => renderRATPattern(trajectory)).join('')}
          </div>
        </div>
      </div>

      <!-- API Contract Information -->
      <div class="card" style="margin-top: 20px;">
        <div class="card-header">
          <span class="card-title">🔌 OpenClaw API Contract</span>
        </div>
        <div style="padding: 16px; font-family: var(--font-mono); font-size: 13px;">
          <p style="color: var(--text-secondary); margin-bottom: 12px;">OpenClaw can fetch staged payloads using these endpoints:</p>
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px; margin-bottom: 8px;">
            <div><span style="color: var(--accent-success);">GET</span> <span style="color: var(--accent-info);">/api/openclaw/staged</span> — Fetch all staged execution payloads</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px; margin-bottom: 8px;">
            <div><span style="color: var(--accent-warning);">POST</span> <span style="color: var(--accent-info);">/api/openclaw/execute/:taskId</span> — Mark payload as executed</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px; margin-bottom: 8px;">
            <div><span style="color: var(--accent-info);">POST</span> <span style="color: var(--accent-info);">/api/openclaw/feedback</span> — Submit execution feedback (success/failure)</div>
          </div>
          <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px;">
            <div><span style="color: var(--accent-success);">GET</span> <span style="color: var(--accent-info);">/api/openclaw/rat</span> — Query RAT for similar successful patterns</div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners for action buttons
    attachPayloadActions();

  } catch (err) {
    container.innerHTML = `
      <div class="panel-header">
        <h2>🤖 Automation Recipes</h2>
      </div>
      <div class="card">
        <div style="padding: 40px; text-align: center; color: var(--accent-danger);">
          <div style="font-size: 48px; margin-bottom: 12px;">⚠️</div>
          <p>Failed to load automation data</p>
          <p style="font-size: 13px; margin-top: 8px; color: var(--text-muted);">${err.message}</p>
        </div>
      </div>
    `;
  }
}

function renderStagedPayload(payload, intents) {
  const intent = intents.find(i => i.id === payload.intent_source_id);
  const intentTitle = intent ? intent.title : 'Unknown Intent';
  const confidence = ((payload.confidence_trigger || 0) * 100).toFixed(0);

  return `
    <div class="automation-item" data-task-id="${payload.task_id}">
      <div class="automation-header">
        <div>
          <div class="automation-title">${payload.directive}</div>
          <div class="automation-meta">
            <span class="badge badge-warning">staged</span>
            <span class="tag">${intentTitle}</span>
            <span style="font-size: 12px; color: var(--text-muted);">Confidence: ${confidence}%</span>
          </div>
        </div>
        <div class="automation-actions">
          <button class="btn btn-sm btn-primary" onclick="approvePayload('${payload.task_id}')">
            ✓ Approve
          </button>
          <button class="btn btn-sm btn-secondary" onclick="rejectPayload('${payload.task_id}')">
            ✕ Reject
          </button>
        </div>
      </div>
      <div class="automation-details">
        <div><strong>Parameters:</strong> ${payload.parameters || 'None'}</div>
        <div><strong>Priority:</strong> ${payload.priority}</div>
        <div><strong>Context Entities:</strong> ${payload.context?.involved_entities?.map(e => e.name).join(', ') || 'None'}</div>
        ${payload.context?.predicted_tools?.length > 0 ? `
          <div><strong>Predicted Tools (RAT):</strong> ${payload.context.predicted_tools.join(' → ')}</div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderExecutedPayload(payload) {
  const statusColor = payload.status === 'success' ? 'var(--accent-success)' : 'var(--accent-danger)';
  const statusIcon = payload.status === 'success' ? '✓' : '✕';
  const executedAt = new Date(payload.executedAt).toLocaleString();

  return `
    <div class="automation-item">
      <div class="automation-header">
        <div>
          <div class="automation-title">${payload.directive}</div>
          <div class="automation-meta">
            <span class="badge" style="background: ${statusColor};">${statusIcon} ${payload.status}</span>
            <span style="font-size: 12px; color: var(--text-muted);">${executedAt}</span>
          </div>
        </div>
      </div>
      ${payload.feedback ? `
        <div class="automation-details">
          <div><strong>Feedback:</strong> ${payload.feedback}</div>
        </div>
      ` : ''}
    </div>
  `;
}

function renderRATPattern(trajectory) {
  const completedMilestones = trajectory.milestones.filter(m => m.completed).length;
  const totalMilestones = trajectory.milestones.length;
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones * 100).toFixed(0) : 0;

  return `
    <div class="automation-item">
      <div class="automation-header">
        <div>
          <div class="automation-title">${trajectory.label}</div>
          <div class="automation-meta">
            <span class="badge" style="background: var(--accent-info);">${progress}% success rate</span>
            <span style="font-size: 12px; color: var(--text-muted);">${totalMilestones} milestones</span>
          </div>
        </div>
      </div>
      <div class="automation-details">
        <div><strong>Pattern:</strong> ${trajectory.milestones.map(m => m.label).join(' → ')}</div>
        ${trajectory.description ? `<div><strong>Description:</strong> ${trajectory.description}</div>` : ''}
      </div>
    </div>
  `;
}

function attachPayloadActions() {
  // These will be called from inline onclick handlers
  window.approvePayload = async (taskId) => {
    try {
      await fetch(`http://localhost:3000/api/openclaw/execute/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Payload approved and sent to OpenClaw!');
      // Refresh the panel
      const container = document.getElementById('panel-automations');
      if (container) renderAutomations(container);
    } catch (err) {
      alert('Failed to approve payload: ' + err.message);
    }
  };

  window.rejectPayload = async (taskId) => {
    try {
      await fetch(`http://localhost:3000/api/openclaw/reject/${taskId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      alert('Payload rejected and removed from queue.');
      // Refresh the panel
      const container = document.getElementById('panel-automations');
      if (container) renderAutomations(container);
    } catch (err) {
      alert('Failed to reject payload: ' + err.message);
    }
  };
}
