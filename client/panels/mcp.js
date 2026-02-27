/**
 * MCP Server Panel — Shows connected agents, query logs, and access control
 */

import { api } from '../api.js';

export async function renderMcp(container) {
  container.innerHTML = '<div class="panel-header"><h2>⌛ Loading MCP status...</h2></div>';

  try {
    const [mcpStatus, logs] = await Promise.all([
      api.getMcpStatus(),
      api.getMcpLogs()
    ]);

    container.innerHTML = `
      <div class="panel-header">
        <h2>🔌 MCP Server Interface</h2>
        <p>Your Personal Intelligence as a Model Context Protocol server — how external agents and apps connect to your kernel.</p>
      </div>

      <!-- Server Status -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-value" style="font-size: 20px;">${mcpStatus.protocol}</div>
          <div class="stat-label">Protocol</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${mcpStatus.connectedAgents?.length || 0}</div>
          <div class="stat-label">Connected Agents</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${mcpStatus.capabilities?.length || 0}</div>
          <div class="stat-label">Capabilities</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${logs.length}</div>
          <div class="stat-label">Access Logs</div>
        </div>
      </div>

      <!-- Connected Agents -->
      <div class="card" style="margin-bottom: 24px;">
        <div class="card-header">
          <span class="card-title">Connected Agents</span>
        </div>
        <div class="mcp-grid">
          ${(mcpStatus.connectedAgents || []).map(agent => `
            <div class="agent-card">
              <div class="agent-header">
                <span class="agent-status ${agent.status}"></span>
                <span class="agent-name">${agent.name}</span>
                <span class="agent-type">${agent.type}</span>
              </div>
              <div class="agent-stats">
                <span>Queries: <span class="agent-stat-value">${agent.queriesTotal}</span></span>
                <span>Permission: <span class="agent-stat-value">${agent.permissionLevel}</span></span>
              </div>
              <div style="margin-top: 8px; font-size: 11px; color: var(--text-muted);">
                Last: ${formatTime(agent.lastQuery)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Capabilities -->
      <div class="two-col" style="margin-bottom: 24px;">
        <div class="card">
          <div class="card-header">
            <span class="card-title">Server Capabilities</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${(mcpStatus.capabilities || []).map(c => `
              <span class="tag" style="font-size: 12px; padding: 4px 12px;">${c}</span>
            `).join('')}
          </div>
        </div>

        <!-- Query Simulator -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">Query Simulator</span>
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">
            Simulate an external agent querying your kernel for context.
          </p>
          <button class="btn btn-primary" id="mcp-simulate-btn">
            ⚡ Simulate Context Query
          </button>
          <div id="mcp-simulate-result" style="margin-top: 12px;"></div>
        </div>
      </div>

      <!-- Outbound Executor Queue (Orchestrator) -->
      <div class="card" style="margin-bottom: 24px; border-color: var(--stage-decision);">
        <div class="card-header">
          <span class="card-title">🚀 Orchestrator Outbox</span>
          <span class="badge" style="background: var(--stage-decision); color: #fff;">Proactive Execution</span>
        </div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
          Intents that reach the <strong>DECISION</strong> state are automatically packaged and pushed here for downstream agents (e.g., Openclaw) to execute.
        </p>
        ${mcpStatus.outboundQueue && mcpStatus.outboundQueue.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${mcpStatus.outboundQueue.map(task => `
              <div style="padding: 12px; background: var(--bg-card-hover); border: 1px solid var(--border-subtle); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                  <strong style="color: var(--text-primary);">${task.directive}</strong>
                  <span class="badge" style="background: var(--bg-tertiary);">${task.status}</span>
                </div>
                <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 8px;">${task.parameters}</div>
                <div style="font-size: 11px; font-family: var(--font-mono); color: var(--accent-primary);">ID: ${task.task_id}</div>
                ${task.status === 'staged' ? `
                  <div style="margin-top: 12px; display: flex; gap: 8px;">
                    <button class="btn btn-primary btn-sm btn-approve" data-id="${task.task_id}">✅ Execute</button>
                    <button class="btn btn-secondary btn-sm btn-reject" data-id="${task.task_id}">❌ Reject</button>
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        ` : `
          <div style="padding: 24px; text-align: center; color: var(--text-muted); background: var(--bg-tertiary); border-radius: 8px; border: 1px dashed var(--border-subtle);">
            Queue is empty. Move an Intent to DECISION state to trigger proactive execution.
          </div>
        `}
      </div>

      <!-- Access Logs -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Access Log</span>
        </div>
        ${logs.length > 0 ? `
          <ul class="mcp-log-list">
            ${logs.map(log => `
              <li class="mcp-log-item">
                <span class="mcp-log-time">${formatShortTime(log.timestamp)}</span>
                <span class="mcp-log-agent">${log.agentId}</span>
                <span class="mcp-log-type">${log.type}</span>
              </li>
            `).join('')}
          </ul>
        ` : '<p style="font-size: 12px; color: var(--text-muted);">No access logs yet. Use the Query Simulator to generate some.</p>'}
      </div>
    `;

    // Wire up Continuous Learning Action buttons
    container.querySelectorAll('.btn-approve').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const taskId = e.target.dataset.id;
        try {
          await api.submitReward(taskId, 1);
          renderMcp(container); // Refresh
        } catch (err) { console.error(err); }
      });
    });

    container.querySelectorAll('.btn-reject').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const taskId = e.target.dataset.id;
        try {
          await api.submitReward(taskId, -1);
          renderMcp(container); // Refresh
        } catch (err) { console.error(err); }
      });
    });

    // Wire up simulate button
    document.getElementById('mcp-simulate-btn')?.addEventListener('click', async () => {
      const resultEl = document.getElementById('mcp-simulate-result');
      resultEl.innerHTML = '<span style="color: var(--text-muted); font-size: 12px;">Querying...</span>';

      try {
        const result = await api.mcpContextQuery({
          agentId: 'simulator-dashboard',
          query: 'What is the user currently focused on?',
          scope: 'general'
        });
        resultEl.innerHTML = `
          <pre style="font-family: var(--font-mono); font-size: 11px; color: var(--text-primary); background: var(--bg-tertiary); padding: 12px; border-radius: var(--radius-sm); overflow: auto; max-height: 200px;">${JSON.stringify(result, null, 2)}</pre>
        `;
      } catch (err) {
        resultEl.innerHTML = `<span style="color: var(--accent-danger); font-size: 12px;">Error: ${err.message}</span>`;
      }
    });
  } catch (err) {
    container.innerHTML = `<div class="panel-header"><h2>🔌 MCP Server</h2><p style="color: var(--accent-danger);">Error: ${err.message}</p></div>`;
  }
}

function formatTime(ts) {
  if (!ts) return 'never';
  const d = new Date(ts);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatShortTime(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
