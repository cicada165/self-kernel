/**
 * Intent Proxy Panel — AI Suggestions & Strategy Governance
 * Shows proactive suggestions from the system's pattern analysis
 * Allows users to configure governance rules (no-code automation policies)
 */

import { api } from '../api.js';

export async function renderIntentProxy(container) {
  container.innerHTML = '<div class="panel-header"><h2>⌛ Loading Intent Proxy...</h2></div>';

  try {
    const [suggestionsResp, governanceRules, history] = await Promise.all([
      api.getProxySuggestions(),
      api.getGovernanceRules(),
      api.getProxyHistory()
    ]);

    const suggestions = suggestionsResp.suggestions || [];
    const acceptedCount = history.filter(h => h.status === 'accepted').length;
    const rejectedCount = history.filter(h => h.status === 'rejected').length;
    const acceptanceRate = history.length > 0 ? (acceptedCount / history.length * 100).toFixed(0) : 0;

    container.innerHTML = `
      <div class="panel-header">
        <h2>🤖 Intent Proxy — AI Suggestions</h2>
        <p>Your digital copy analyzes patterns and proactively suggests next actions.</p>
      </div>

      <!-- Stats Row -->
      <div class="stats-grid" style="margin-bottom: 24px;">
        <div class="stat-card">
          <div class="stat-value">${suggestions.length}</div>
          <div class="stat-label">Current Suggestions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${acceptedCount}</div>
          <div class="stat-label">Accepted</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${rejectedCount}</div>
          <div class="stat-label">Rejected</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${acceptanceRate}%</div>
          <div class="stat-label">Acceptance Rate</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${governanceRules.length}</div>
          <div class="stat-label">Governance Rules</div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs" style="margin-bottom: 20px;">
        <button class="tab-btn active" data-tab="suggestions">💡 Suggestions</button>
        <button class="tab-btn" data-tab="governance">⚖️ Governance Rules</button>
        <button class="tab-btn" data-tab="history">📜 History</button>
      </div>

      <!-- Tab: Suggestions -->
      <div class="tab-content active" id="tab-suggestions">
        ${suggestions.length === 0 ? `
          <div class="card">
            <p style="color: var(--text-muted); text-align: center; padding: 40px;">
              No suggestions at the moment. The system is learning your patterns. Check back later!
            </p>
          </div>
        ` : suggestions.map(s => renderSuggestionCard(s)).join('')}
      </div>

      <!-- Tab: Governance Rules -->
      <div class="tab-content" id="tab-governance">
        <div class="card" style="margin-bottom: 20px;">
          <div class="card-header">
            <span class="card-title">What are Governance Rules?</span>
          </div>
          <p style="font-size: 13px; color: var(--text-secondary); line-height: 1.6; padding: 0 16px 16px;">
            Governance rules define when the system can act autonomously on your behalf.
            For example: "Auto-approve all trajectory-pattern suggestions with >90% confidence"
            or "Require my approval for any person-influence suggestions".
            <br><br>
            <strong>This is how you teach your digital copy when to act without asking.</strong>
          </p>
        </div>

        <button class="btn btn-primary" id="add-governance-rule-btn" style="margin-bottom: 16px;">
          + Add Governance Rule
        </button>

        <div id="governance-rules-list">
          ${governanceRules.length === 0 ? `
            <div class="card">
              <p style="color: var(--text-muted); text-align: center; padding: 20px;">
                No governance rules defined yet. Add one to enable autonomous actions.
              </p>
            </div>
          ` : governanceRules.map(r => renderGovernanceRuleCard(r)).join('')}
        </div>

        <!-- Add Rule Form (hidden by default) -->
        <div id="add-rule-form" style="display: none; margin-top: 20px;">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Create Governance Rule</span>
            </div>
            <div style="padding: 16px;">
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Rule Name</label>
                <input type="text" id="rule-name" placeholder="e.g., Auto-approve high-confidence trajectory patterns" style="width: 100%; padding: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-primary);">
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Description (optional)</label>
                <textarea id="rule-description" placeholder="Explain when and why this rule applies..." style="width: 100%; height: 60px; padding: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-primary); resize: vertical;"></textarea>
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Suggestion Type</label>
                <select id="rule-type" style="width: 100%; padding: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-primary);">
                  <option value="">All types</option>
                  <option value="trajectory-pattern">Trajectory Pattern</option>
                  <option value="person-influence">Person Influence</option>
                  <option value="stage-transition">Stage Transition</option>
                  <option value="cognitive-health">Cognitive Health</option>
                </select>
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Minimum Confidence</label>
                <input type="number" id="rule-confidence" min="0" max="1" step="0.05" value="0.8" style="width: 100%; padding: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-primary);">
              </div>
              <div style="margin-bottom: 12px;">
                <label style="display: block; font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Action</label>
                <select id="rule-action" style="width: 100%; padding: 8px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: 6px; color: var(--text-primary);">
                  <option value="require-approval">Require my approval</option>
                  <option value="auto-approve">Auto-approve (act autonomously)</option>
                </select>
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary" id="save-rule-btn">Save Rule</button>
                <button class="btn" id="cancel-rule-btn">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab: History -->
      <div class="tab-content" id="tab-history">
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${history.slice(0, 20).map(h => renderHistoryItem(h)).join('')}
        </div>
      </div>
    `;

    // Wire up tab switching
    container.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        container.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        container.querySelector(`#tab-${btn.dataset.tab}`).classList.add('active');
      });
    });

    // Wire up suggestion actions
    container.querySelectorAll('.accept-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const suggestionId = btn.dataset.suggestionId;
        btn.disabled = true;
        btn.textContent = 'Accepting...';
        try {
          await api.acceptSuggestion(suggestionId);
          btn.textContent = '✓ Accepted';
          btn.style.background = 'var(--accent-success)';
          // Refresh after 1s
          setTimeout(() => renderIntentProxy(container), 1000);
        } catch (err) {
          btn.textContent = 'Error';
          btn.style.background = 'var(--accent-danger)';
        }
      });
    });

    container.querySelectorAll('.reject-suggestion-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const suggestionId = btn.dataset.suggestionId;
        btn.disabled = true;
        btn.textContent = 'Rejecting...';
        try {
          await api.rejectSuggestion(suggestionId);
          btn.textContent = '✓ Rejected';
          // Refresh after 1s
          setTimeout(() => renderIntentProxy(container), 1000);
        } catch (err) {
          btn.textContent = 'Error';
        }
      });
    });

    // Wire up governance rule form
    const addRuleBtn = container.querySelector('#add-governance-rule-btn');
    const addRuleForm = container.querySelector('#add-rule-form');
    const cancelRuleBtn = container.querySelector('#cancel-rule-btn');
    const saveRuleBtn = container.querySelector('#save-rule-btn');

    if (addRuleBtn) {
      addRuleBtn.addEventListener('click', () => {
        addRuleForm.style.display = 'block';
        addRuleBtn.style.display = 'none';
      });
    }

    if (cancelRuleBtn) {
      cancelRuleBtn.addEventListener('click', () => {
        addRuleForm.style.display = 'none';
        addRuleBtn.style.display = 'block';
      });
    }

    if (saveRuleBtn) {
      saveRuleBtn.addEventListener('click', async () => {
        const name = container.querySelector('#rule-name').value.trim();
        const description = container.querySelector('#rule-description').value.trim();
        const suggestionType = container.querySelector('#rule-type').value;
        const minConfidence = parseFloat(container.querySelector('#rule-confidence').value);
        const action = container.querySelector('#rule-action').value;

        if (!name) {
          alert('Please provide a rule name');
          return;
        }

        saveRuleBtn.disabled = true;
        saveRuleBtn.textContent = 'Saving...';

        try {
          await api.createGovernanceRule({
            name,
            description,
            suggestionType: suggestionType || null,
            minConfidence,
            action
          });
          // Refresh
          renderIntentProxy(container);
        } catch (err) {
          alert('Error creating rule: ' + err.message);
          saveRuleBtn.disabled = false;
          saveRuleBtn.textContent = 'Save Rule';
        }
      });
    }

  } catch (err) {
    container.innerHTML = `
      <div class="panel-header">
        <h2>🤖 Intent Proxy</h2>
        <p style="color: var(--accent-danger);">Error loading Intent Proxy: ${err.message}</p>
      </div>
    `;
  }
}

function renderSuggestionCard(suggestion) {
  const priorityColor = {
    high: 'var(--accent-danger)',
    medium: 'var(--accent-warning)',
    low: 'var(--text-muted)'
  }[suggestion.priority] || 'var(--text-muted)';

  const typeEmoji = {
    'trajectory-pattern': '🎯',
    'person-influence': '👥',
    'stage-transition': '⚡',
    'cognitive-health': '🧠'
  }[suggestion.type] || '💡';

  return `
    <div class="card" style="margin-bottom: 16px; border-left: 3px solid ${priorityColor};">
      <div style="padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
              <span style="font-size: 20px;">${typeEmoji}</span>
              <span class="badge" style="background: ${priorityColor}; color: white; font-size: 9px; text-transform: uppercase;">${suggestion.priority}</span>
              <span class="badge" style="font-size: 9px;">${suggestion.type.replace('-', ' ')}</span>
              <span style="font-size: 11px; color: var(--text-muted);">Confidence: ${Math.round(suggestion.confidence * 100)}%</span>
            </div>
            <div style="font-size: 14px; font-weight: 500; margin-bottom: 8px; color: var(--text-primary);">
              ${suggestion.suggestion}
            </div>
            <div style="font-size: 11px; color: var(--text-secondary); line-height: 1.5;">
              ${suggestion.reasoning}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <button class="btn btn-primary accept-suggestion-btn" data-suggestion-id="${suggestion.id}" style="flex: 1;">
            ✓ Accept & Execute
          </button>
          <button class="btn reject-suggestion-btn" data-suggestion-id="${suggestion.id}" style="flex: 1;">
            ✕ Not Now
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderGovernanceRuleCard(rule) {
  return `
    <div class="card" style="margin-bottom: 12px;">
      <div style="padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
          <div style="flex: 1;">
            <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">${rule.name}</div>
            ${rule.description ? `<div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 6px;">${rule.description}</div>` : ''}
            <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;">
              ${rule.suggestionType ? `<span class="badge" style="font-size: 9px;">${rule.suggestionType}</span>` : ''}
              <span class="badge" style="font-size: 9px;">Min confidence: ${Math.round(rule.minConfidence * 100)}%</span>
              <span class="badge" style="font-size: 9px; background: ${rule.action === 'auto-approve' ? 'var(--accent-success)' : 'var(--accent-warning)'}; color: white;">${rule.action}</span>
            </div>
          </div>
          <button class="btn btn-small" style="padding: 4px 8px; font-size: 11px;">Edit</button>
        </div>
      </div>
    </div>
  `;
}

function renderHistoryItem(item) {
  const statusColor = item.status === 'accepted' ? 'var(--accent-success)'
    : item.status === 'rejected' ? 'var(--text-muted)'
    : 'var(--accent-warning)';

  const statusIcon = item.status === 'accepted' ? '✓' : item.status === 'rejected' ? '✕' : '⏳';

  return `
    <div class="card">
      <div style="padding: 12px; display: flex; justify-content: space-between; align-items: center;">
        <div style="flex: 1;">
          <div style="font-size: 12px; margin-bottom: 4px;">${item.suggestion || 'Suggestion'}</div>
          <div style="font-size: 10px; color: var(--text-muted);">
            ${new Date(item.generatedAt).toLocaleString()} · ${item.type}
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 16px; color: ${statusColor};">${statusIcon}</span>
          <span style="font-size: 10px; text-transform: uppercase; color: ${statusColor};">${item.status}</span>
        </div>
      </div>
    </div>
  `;
}
