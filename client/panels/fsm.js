/**
 * Auto-Labeler & FSM Trigger Panel
 * Demonstrates the Predictive Processing pipeline and OpenClaw execution payloads.
 */

import { api } from '../api.js';

export async function renderFsm(container) {
    container.innerHTML = `
    <div class="panel-header" style="margin-bottom: 20px;">
      <h2>⚡ Auto-Labeler & FSM Trigger</h2>
      <p>Watch raw data get purified into structured intents, and see OpenClaw payloads generate when intents hit Execution.</p>
    </div>

    <!-- Top Section: Auto-Labeler Input -->
    <div class="card" style="margin-bottom: 24px; border-color: var(--accent-secondary);">
      <div class="card-header">
        <span class="card-title">1. Auto-Labeler (Active Sampling)</span>
        <span class="badge" style="background: rgba(0, 206, 201, 0.1); color: var(--accent-secondary);">Purifier Daemon</span>
      </div>
      
      <div class="two-col" style="gap: 24px;">
        <!-- Input Form -->
        <div>
          <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 12px;">
            Simulate a zero-friction input (e.g., Apple Watch voice note, browser selection).
            Try adding action words ("need to", "let's build") to increase the Precision Weight.
          </p>
          <textarea id="fsm-raw-input" placeholder="e.g., Note to self: Alex and I really need to build the MVP backend this weekend. Let's use Express and local JSON files." style="width: 100%; height: 120px; background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); padding: 12px; color: var(--text-primary); font-family: var(--font-sans); font-size: 13px; margin-bottom: 12px; resize: vertical;"></textarea>
          
          <div style="display: flex; gap: 12px; align-items: center;">
            <select id="fsm-source-select" style="background: var(--bg-tertiary); border: 1px solid var(--border-subtle); color: var(--text-primary); padding: 8px; border-radius: var(--radius-sm); font-size: 12px;">
              <option value="apple-watch">Apple Watch</option>
              <option value="browser-extension">Browser Extension</option>
              <option value="chat-plugin">Chat Plugin</option>
            </select>
            <button class="btn btn-primary" id="fsm-submit-btn">
              Capture Thought
            </button>
          </div>
        </div>

        <!-- Purifier Result Log -->
        <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); display: flex; flex-direction: column;">
          <div style="padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); display: flex; justify-content: space-between;">
            <span>Purifier Log</span>
            <span id="fsm-weight-display">Weight: --</span>
          </div>
          <div id="fsm-purifier-log" style="flex: 1; padding: 16px; font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary); overflow-y: auto; max-height: 200px;">
            Waiting for input...
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: FSM Engine & Payloads -->
    <div class="card" style="border-color: var(--accent-success);">
      <div class="card-header">
        <span class="card-title">2. FSM Trigger & Downstream Execution</span>
        <span class="badge" style="background: rgba(0, 184, 148, 0.1); color: var(--accent-success);">OpenClaw Payload</span>
      </div>
      
      <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: 16px;">
        When an Intent state machine transitions to "Execution", a Context Payload is immutablely generated and stored for OpenClaw to consume.
      </p>

      <div class="two-col" style="gap: 24px;">
        <!-- Stages Trigger Test -->
        <div>
          <div style="margin-bottom: 12px; font-size: 12px; font-weight: 500;">Trigger a transition manually:</div>
          <div style="display: flex; gap: 8px; margin-bottom: 16px;" id="fsm-intents-dropdown-container">
            <select id="fsm-intent-select" style="flex: 1; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); color: var(--text-primary); padding: 8px; border-radius: var(--radius-sm); font-size: 12px;">
              <option value="">Loading intents...</option>
            </select>
            <button class="btn" id="fsm-trigger-btn" style="border-color: var(--accent-success); color: var(--accent-success);">
              Move to Execution
            </button>
          </div>
          
          <div style="margin-bottom: 8px; font-size: 12px; font-weight: 500; display: flex; justify-content: space-between;">
            <span>Generated Payloads</span>
            <button class="btn btn-sm" id="fsm-refresh-payloads">↻ Refresh</button>
          </div>
          <div id="fsm-payloads-list" style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
            <div style="color: var(--text-muted); font-size: 12px; padding: 12px;">Loading payloads...</div>
          </div>
        </div>

        <!-- Payload Viewer -->
        <div style="background: var(--bg-secondary); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); display: flex; flex-direction: column;">
          <div style="padding: 10px 16px; border-bottom: 1px solid var(--border-subtle); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">
            Payload Inspector
          </div>
          <div id="fsm-payload-viewer" style="flex: 1; padding: 16px; font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary); overflow-y: auto; max-height: 300px; white-space: pre-wrap; word-break: break-word;">
            Select a payload from the list to view its contents.
          </div>
        </div>
      </div>
    </div>
  `;

    // --- Logic Setup ---
    await refreshIntentsDropdown();
    await loadPayloads();

    // 1. Submit to Auto-Labeler
    document.getElementById('fsm-submit-btn').addEventListener('click', async () => {
        const text = document.getElementById('fsm-raw-input').value;
        const source = document.getElementById('fsm-source-select').value;
        const logEl = document.getElementById('fsm-purifier-log');
        const weightEl = document.getElementById('fsm-weight-display');

        if (!text) return;

        logEl.innerHTML = '<span style="color: var(--accent-warning);">Processing via LLM...</span>';
        weightEl.textContent = 'Weight: calc...';

        try {
            // Direct fetch to our new inbox route
            const res = await fetch('http://localhost:3000/api/inbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, source })
            });
            const data = await res.json();

            const isCommitted = data.action === 'committed';
            const color = isCommitted ? 'var(--accent-success)' : 'var(--text-muted)';

            weightEl.innerHTML = `Weight: <span style="color:${color}">${data.weight}</span>`;

            logEl.innerHTML = `
        <div style="color: ${color}; margin-bottom: 8px; font-weight: 600;">Status: ${data.action.toUpperCase()}</div>
        <div style="margin-bottom: 12px;">Reason: ${data.reason}</div>
        <div style="margin-bottom: 4px;">Extracted Entities:</div>
        <pre style="color: var(--text-primary); background: rgba(0,0,0,0.2); padding: 8px; border-radius: 4px;">${JSON.stringify(data.extracted, null, 2)}</pre>
      `;

            if (isCommitted) {
                // Refresh intents dropdown to show new auto-labeled intent
                await refreshIntentsDropdown();
                document.getElementById('fsm-raw-input').value = '';
            }
        } catch (err) {
            logEl.innerHTML = `<span style="color: var(--accent-danger);">Error: ${err.message}</span>`;
        }
    });

    // 2. Trigger FSM manually
    document.getElementById('fsm-trigger-btn').addEventListener('click', async () => {
        const intentId = document.getElementById('fsm-intent-select').value;
        if (!intentId) return;

        try {
            await api.updateIntent(intentId, { stage: 'execution', stageNote: 'Manual trigger from FSM panel' });
            // The backend checkTriggers() will run asynchronously. Give it a moment then refresh payloads.
            setTimeout(loadPayloads, 500);

            // Update local drop down text
            const select = document.getElementById('fsm-intent-select');
            const opt = select.options[select.selectedIndex];
            if (opt) opt.text = opt.text.replace(/\[.*?\]/, '[execution]');

        } catch (err) {
            alert('Error triggering FSM: ' + err.message);
        }
    });

    // 3. Refresh & select payloads
    document.getElementById('fsm-refresh-payloads').addEventListener('click', loadPayloads);
}

// Helpers
async function refreshIntentsDropdown() {
    const select = document.getElementById('fsm-intent-select');
    try {
        const [intents, predictionsData] = await Promise.all([
            api.getIntents(),
            api.getTransitionPredictions({ minConfidence: 0.5 }).catch(() => ({ predictions: [] }))
        ]);

        const predictions = predictionsData.predictions || [];
        const predictionMap = new Map(predictions.map(p => [p.intent_id, p]));

        select.innerHTML = intents
            .filter(i => i.stage !== 'execution') // Only show ones not yet executing
            .map(i => {
                const prediction = predictionMap.get(i.id);
                const predictionIndicator = prediction
                    ? ` 🎯 → ${prediction.predicted_stage} (${Math.round(prediction.confidence * 100)}%)`
                    : '';
                return `<option value="${i.id}">[${i.stage}] ${i.title}${predictionIndicator}</option>`;
            })
            .join('');
        if (select.options.length === 0) {
            select.innerHTML = '<option value="">No non-executing intents available</option>';
        }
    } catch {
        select.innerHTML = '<option value="">Error loading intents</option>';
    }
}

async function loadPayloads() {
    const listEl = document.getElementById('fsm-payloads-list');
    try {
        const res = await fetch('http://localhost:3000/api/execution-payloads');
        if (!res.ok) throw new Error('API Error');
        const payloads = await res.json();

        if (payloads.length === 0) {
            listEl.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; padding: 12px;">No payloads generated yet. Trigger an intent above.</div>';
            return;
        }

        listEl.innerHTML = payloads.map(p => `
      <div class="payload-card" data-id="${p.id}" style="padding: 10px; background: var(--bg-tertiary); border: 1px solid var(--border-subtle); border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s ease;">
        <div style="font-size: 12px; font-weight: 500; color: var(--accent-success); margin-bottom: 2px;">Payload generated</div>
        <div style="font-size: 11px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.instruction || p.intentId}</div>
        <div style="font-size: 10px; color: var(--text-muted); font-family: var(--font-mono); margin-top: 4px;">${new Date(p.generatedAt).toLocaleTimeString()}</div>
      </div>
    `).join('');

        // Add click listeners
        listEl.querySelectorAll('.payload-card').forEach(card => {
            card.addEventListener('click', () => {
                // Highlight logic
                listEl.querySelectorAll('.payload-card').forEach(c => c.style.borderColor = 'var(--border-subtle)');
                card.style.borderColor = 'var(--accent-success)';

                // Show detail
                const payload = payloads.find(p => p.id === card.dataset.id);
                const viewer = document.getElementById('fsm-payload-viewer');

                // Pretty print JSON with simple regex highlighting
                const jsonStr = JSON.stringify(payload, null, 2);
                const highlighted = jsonStr
                    .replace(/"([^"]+)"\s*:/g, '<span style="color: var(--accent-primary);">"$1"</span>:')
                    .replace(/:\s*"([^"]+)"/g, ': <span style="color: var(--accent-success);">"$1"</span>')
                    .replace(/:\s*(true|false|null|[0-9]+)/g, ': <span style="color: var(--accent-warning);">$1</span>');

                viewer.innerHTML = highlighted;
            });
        });

    } catch (err) {
        listEl.innerHTML = `<div style="color: var(--accent-danger); font-size: 12px; padding: 12px;">Error loading payloads: ${err.message}</div>`;
    }
}
