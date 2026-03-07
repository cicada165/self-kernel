/**
 * Strategy Governance Panel — No-code interface for defining automation rules
 *
 * Allows users with NO coding experience to control when the system
 * can act autonomously vs when it should ask permission.
 */

import { api } from '../api.js';

export async function renderStrategies(container) {
  container.innerHTML = '<div class="panel-header"><h2>⌛ Loading strategies...</h2></div>';

  try {
    const strategies = await api.getStrategies();
    const enabledCount = strategies.filter(s => s.enabled).length;

    container.innerHTML = `
      <div class="panel-header">
        <h2>🛡️ Automation Governance</h2>
        <p>Control when your digital copy can act on its own vs when it needs your permission.</p>
      </div>

      <!-- Overview Stats -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-value">${strategies.length}</div>
          <div class="stat-label">Total Rules</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${enabledCount}</div>
          <div class="stat-label">Active Rules</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${strategies.filter(s => s.action === 'auto-execute').length}</div>
          <div class="stat-label">Auto-Execute</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${strategies.filter(s => s.action === 'require-approval').length}</div>
          <div class="stat-label">Ask First</div>
        </div>
      </div>

      <!-- Explanation Banner -->
      <div class="card" style="background: linear-gradient(135deg, var(--accent-primary), var(--accent-success)); color: white; margin-bottom: 24px; border: none;">
        <div style="padding: 20px;">
          <h3 style="margin-bottom: 12px; font-size: 16px;">🤖 What are Governance Rules?</h3>
          <p style="font-size: 13px; line-height: 1.6; margin-bottom: 12px;">
            Governance rules let you teach your digital copy when it can work independently and when it should check with you first.
            Think of it as setting boundaries for your AI assistant.
          </p>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; font-size: 12px;">
            <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 6px;">
              <strong>✅ Auto-Execute:</strong> System acts on its own (e.g., organizing notes, research gathering)
            </div>
            <div style="background: rgba(255,255,255,0.2); padding: 12px; border-radius: 6px;">
              <strong>🤝 Ask First:</strong> System asks your permission (e.g., sending messages, making decisions)
            </div>
          </div>
        </div>
      </div>

      <!-- Active Strategies -->
      <div class="card">
        <div class="card-header">
          <span class="card-title">Active Rules</span>
          <button class="btn btn-primary" onclick="window.showCreateStrategyDialog()" style="padding: 6px 12px; font-size: 12px;">+ New Rule</button>
        </div>
        <div style="padding: 16px;">
          ${strategies.length === 0 ? `
            <div style="text-align: center; padding: 40px;">
              <div style="font-size: 48px; margin-bottom: 12px;">🛡️</div>
              <p style="color: var(--text-muted);">No governance rules yet. Start by creating one!</p>
            </div>
          ` : strategies.map(strategy => renderStrategyCard(strategy)).join('')}
        </div>
      </div>

      <!-- Create Strategy Dialog (Hidden by default) -->
      <div id="create-strategy-dialog" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.7); z-index: 1000; align-items: center; justify-content: center;">
        <div style="background: var(--bg-primary); border-radius: 12px; padding: 24px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
          <h3 style="margin-bottom: 16px;">Create New Governance Rule</h3>

          <form id="create-strategy-form">
            <!-- Rule Name -->
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary);">Rule Name</label>
              <input type="text" name="name" placeholder="e.g., Auto-approve research tasks" required style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-primary);">
            </div>

            <!-- Description -->
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary);">Description</label>
              <textarea name="description" placeholder="What does this rule do?" rows="2" style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-primary); resize: vertical;"></textarea>
            </div>

            <!-- Conditions -->
            <div style="margin-bottom: 16px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary);">When should this rule apply?</label>

              <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 6px; margin-bottom: 8px;">
                <select name="conditionType" style="width: 100%; padding: 8px; margin-bottom: 8px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-primary);">
                  <option value="intent-priority">Intent Priority</option>
                  <option value="confidence">Confidence Score</option>
                  <option value="action-type">Action Type</option>
                  <option value="person-tag">Person Tag</option>
                  <option value="risk-level">Risk Level</option>
                </select>

                <select name="operator" style="width: 100%; padding: 8px; margin-bottom: 8px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-primary);">
                  <option value="equals">equals</option>
                  <option value="greater-than">greater than</option>
                  <option value="less-than">less than</option>
                  <option value="includes">includes</option>
                  <option value="in">is one of</option>
                </select>

                <input type="text" name="value" placeholder="Value (e.g., critical, 0.85, research)" style="width: 100%; padding: 8px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: 4px; color: var(--text-primary);">
              </div>
            </div>

            <!-- Action -->
            <div style="margin-bottom: 20px;">
              <label style="display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary);">Then the system should...</label>
              <select name="action" required style="width: 100%; padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-primary);">
                <option value="auto-execute">Auto-Execute (act on its own)</option>
                <option value="require-approval">Require Approval (ask me first)</option>
              </select>
            </div>

            <!-- Buttons -->
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
              <button type="button" onclick="window.hideCreateStrategyDialog()" class="btn" style="background: var(--bg-tertiary);">Cancel</button>
              <button type="submit" class="btn btn-primary">Create Rule</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Wire up form submission
    const form = container.querySelector('#create-strategy-form');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);

        const strategy = {
          name: formData.get('name'),
          description: formData.get('description'),
          conditions: [{
            type: formData.get('conditionType'),
            operator: formData.get('operator'),
            value: parseValue(formData.get('value'))
          }],
          action: formData.get('action')
        };

        try {
          await api.createStrategy(strategy);
          window.hideCreateStrategyDialog();
          renderStrategies(container); // Refresh
        } catch (err) {
          alert('Error creating strategy: ' + err.message);
        }
      });
    }

    // Global dialog helpers
    window.showCreateStrategyDialog = () => {
      document.getElementById('create-strategy-dialog').style.display = 'flex';
    };
    window.hideCreateStrategyDialog = () => {
      document.getElementById('create-strategy-dialog').style.display = 'none';
    };

  } catch (err) {
    container.innerHTML = `
      <div class="panel-header">
        <h2>🛡️ Automation Governance</h2>
        <p style="color: var(--accent-danger);">Error loading strategies: ${err.message}</p>
      </div>
    `;
  }
}

function renderStrategyCard(strategy) {
  const actionColor = strategy.action === 'auto-execute' ? 'var(--accent-success)' : 'var(--accent-warning)';
  const actionIcon = strategy.action === 'auto-execute' ? '⚡' : '🤝';
  const actionLabel = strategy.action === 'auto-execute' ? 'Auto-Execute' : 'Ask First';

  return `
    <div style="margin-bottom: 16px; padding: 16px; background: var(--bg-tertiary); border-radius: 8px; border-left: 4px solid ${actionColor};">
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 16px;">${actionIcon}</span>
            <span style="font-size: 14px; font-weight: 600;">${strategy.name}</span>
            ${strategy.isDefault ? '<span class="badge" style="font-size: 9px; background: var(--accent-primary);">DEFAULT</span>' : ''}
          </div>
          <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">${strategy.description}</p>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; margin-left: 12px;">
          <label class="toggle-switch" style="display: inline-block; width: 44px; height: 24px; position: relative;">
            <input type="checkbox" ${strategy.enabled ? 'checked' : ''} onchange="window.toggleStrategy('${strategy.id}', this.checked)" style="opacity: 0; width: 0; height: 0;">
            <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: ${strategy.enabled ? actionColor : 'var(--bg-secondary)'}; border-radius: 24px; transition: 0.3s;"></span>
            <span style="position: absolute; height: 18px; width: 18px; left: ${strategy.enabled ? '23px' : '3px'}; bottom: 3px; background-color: white; border-radius: 50%; transition: 0.3s;"></span>
          </label>
          ${!strategy.isDefault ? `<button onclick="window.deleteStrategy('${strategy.id}')" style="padding: 4px 8px; font-size: 11px; background: var(--accent-danger); color: white; border: none; border-radius: 4px; cursor: pointer;">Delete</button>` : ''}
        </div>
      </div>

      <!-- Conditions Display -->
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
        <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 6px;">CONDITIONS:</div>
        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
          ${strategy.conditions.map(c => `
            <span style="padding: 4px 8px; background: var(--bg-secondary); border-radius: 4px; font-size: 10px; color: var(--text-secondary);">
              ${formatCondition(c)}
            </span>
          `).join('')}
        </div>
        <div style="margin-top: 8px; padding: 8px; background: ${actionColor}20; border-radius: 4px; font-size: 11px; font-weight: 600; color: ${actionColor};">
          → ${actionLabel}
        </div>
      </div>
    </div>
  `;
}

function formatCondition(condition) {
  const { type, operator, value } = condition;
  const valueDisplay = Array.isArray(value) ? value.join(', ') : value;
  return `${type} ${operator} ${valueDisplay}`;
}

function parseValue(val) {
  // Try to parse as number
  const num = parseFloat(val);
  if (!isNaN(num)) return num;

  // Try to parse as array (comma-separated)
  if (val.includes(',')) {
    return val.split(',').map(v => v.trim());
  }

  return val;
}

// Global functions for strategy management
window.toggleStrategy = async (id, enabled) => {
  try {
    await api.updateStrategy(id, { enabled });
  } catch (err) {
    alert('Error updating strategy: ' + err.message);
  }
};

window.deleteStrategy = async (id) => {
  if (!confirm('Are you sure you want to delete this governance rule?')) return;

  try {
    await api.deleteStrategy(id);
    location.reload();
  } catch (err) {
    alert('Error deleting strategy: ' + err.message);
  }
};
