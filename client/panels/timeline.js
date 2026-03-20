/**
 * Intent Timeline Panel — Visualizes how intents evolve over time
 * Shows cognitive stages and stage history
 */

import { api } from '../api.js';

export async function renderTimeline(container) {
  container.innerHTML = '<div class="panel-header"><h2>⌛ Loading timeline...</h2></div>';

  try {
    const [intents, trajectories, predictionsData] = await Promise.all([
      api.getIntents(),
      api.getTrajectories(),
      api.getTransitionPredictions({ minConfidence: 0.5 }).catch(() => ({ predictions: [] }))
    ]);

    const predictions = predictionsData.predictions || [];

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
        <h2>↗ Intent Timeline & Trajectories</h2>
        <p>Your cognitive journey over time — see how intents evolve and trajectories unfold.</p>
      </div>

      <!-- Trajectories Section - Enhanced for Non-Technical Users -->
      ${trajectories.length > 0 ? `
        <div class="card" style="margin-bottom: 24px; background: linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%); border: 2px solid var(--accent-primary);">
          <div class="card-header" style="border-bottom: 1px solid var(--border-subtle);">
            <div>
              <span class="card-title" style="font-size: 16px;">🎯 Your Journey Map</span>
              <p style="font-size: 12px; color: var(--text-secondary); margin-top: 4px; margin-bottom: 0;">
                Visual guide showing where you've been and where you're headed. Each milestone represents a key decision or achievement.
              </p>
            </div>
            <span style="font-size: 12px; color: var(--accent-primary); font-weight: 600;">${trajectories.length} active path${trajectories.length > 1 ? 's' : ''}</span>
          </div>
          <div style="padding: 20px;">
            ${trajectories.map(traj => renderTrajectoryCardEnhanced(traj, intents)).join('')}
          </div>
        </div>
      ` : `
        <div class="card" style="margin-bottom: 24px; border: 2px dashed var(--border-subtle);">
          <div style="padding: 32px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🗺️</div>
            <h3 style="margin-bottom: 8px; color: var(--text-primary);">No Journey Map Yet</h3>
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
              Trajectories help you visualize your path forward.<br/>
              As you add more intents, the system will automatically suggest trajectory milestones.
            </p>
            <button class="btn btn-primary" onclick="alert('Coming soon: trajectory creation wizard!')">Create Your First Journey</button>
          </div>
        </div>
      `}

      <!-- Stage Legend -->
      <div style="display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap;">
        <div class="legend-item"><span class="legend-dot" style="background: var(--stage-EXPLORATION);"></span> Exploration</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--stage-REFINING);"></span> Refining</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--stage-DECISION);"></span> Decision</div>
        <div class="legend-item"><span class="legend-dot" style="background: var(--stage-REFUTED);"></span> Refuted</div>
      </div>

      <!-- Intent Cards (summary) -->
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; margin-bottom: 32px;">
        ${intents.map(i => {
          const prediction = predictions.find(p => p.intent_id === i.id);
          return `
          <div class="card" style="padding: 14px; cursor: pointer; ${prediction ? 'border: 2px solid var(--accent-success);' : ''}" onclick="document.getElementById('event-${i.id}')?.scrollIntoView({behavior: 'smooth', block: 'center'})">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="font-size: 13px; font-weight: 600;">${truncate(i.title, 28)}</span>
              <span class="badge badge-${i.stage}" style="font-size: 9px;">${i.stage}</span>
            </div>
            ${prediction ? `
              <div style="margin: 8px 0; padding: 8px; background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.2)); border-radius: 6px; border-left: 3px solid var(--accent-success);">
                <div style="font-size: 11px; font-weight: 600; color: var(--accent-success); margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
                  <span>🎯</span>
                  <span>Ready for ${prediction.predicted_stage}</span>
                  <span style="background: rgba(76, 175, 80, 0.2); padding: 2px 6px; border-radius: 4px; font-size: 9px;">${Math.round(prediction.confidence * 100)}%</span>
                </div>
                <div style="font-size: 10px; color: var(--text-secondary); line-height: 1.4;">${truncate(prediction.reasoning, 80)}</div>
              </div>
            ` : ''}
            <div style="font-size: 11px; color: var(--text-muted);">${(i.stageHistory || []).length} stage changes</div>
            ${!i.active ? '<span style="font-size: 10px; color: var(--text-muted);">✓ completed</span>' : ''}
          </div>
        `}).join('')}
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

function renderTrajectoryCardEnhanced(trajectory, intents) {
  const completed = trajectory.milestones.filter(m => m.status === 'completed').length;
  const inProgress = trajectory.milestones.filter(m => m.status === 'in-progress').length;
  const planned = trajectory.milestones.filter(m => m.status === 'planned').length;
  const total = trajectory.milestones.length;
  const progress = (completed / total) * 100;

  // Find next milestone
  const nextMilestone = trajectory.milestones.find(m => m.status === 'in-progress' || m.status === 'planned');

  return `
    <div style="margin-bottom: 24px; padding: 20px; background: var(--bg-primary); border-radius: 12px; border: 1px solid var(--border-subtle); box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 16px;">
        <div style="flex: 1;">
          <div style="font-size: 16px; font-weight: 700; margin-bottom: 6px; color: var(--text-primary);">${trajectory.title}</div>
          <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.5;">${trajectory.description || ''}</div>
        </div>
        <div style="text-align: right; margin-left: 20px;">
          <div style="font-size: 32px; font-weight: 800; color: var(--accent-primary);">${Math.round(progress)}%</div>
          <div style="font-size: 11px; color: var(--text-muted);">complete</div>
        </div>
      </div>

      <!-- Progress Bar with Labels -->
      <div style="margin-bottom: 16px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="font-size: 11px; color: var(--text-muted);">
            ✅ ${completed} done · ⏳ ${inProgress} in progress · 📋 ${planned} planned
          </span>
          <span style="font-size: 11px; font-weight: 600; color: var(--accent-primary);">${completed}/${total}</span>
        </div>
        <div style="height: 10px; background: var(--bg-tertiary); border-radius: 5px; overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);">
          <div style="height: 100%; background: linear-gradient(90deg, #27AE60, #2ECC71, var(--accent-primary)); width: ${progress}%; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 10px rgba(46, 204, 113, 0.5);"></div>
        </div>
      </div>

      ${nextMilestone ? `
        <!-- Next Milestone Highlight -->
        <div style="background: var(--bg-tertiary); padding: 12px 16px; border-radius: 8px; border-left: 3px solid var(--accent-warning); margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">🎯</span>
            <div style="flex: 1;">
              <div style="font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Next Up</div>
              <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">${nextMilestone.label}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 10px; color: var(--text-muted);">Target</div>
              <div style="font-size: 11px; font-weight: 600;">${formatDate(nextMilestone.date)}</div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Detailed Milestone Timeline -->
      <div style="display: flex; gap: 6px; overflow-x: auto; padding: 8px 0;">
        ${trajectory.milestones.map((m, idx) => {
          const statusColor = m.status === 'completed' ? '#27AE60'
            : m.status === 'in-progress' ? '#F39C12'
            : '#95A5A6';
          const statusIcon = m.status === 'completed' ? '✓'
            : m.status === 'in-progress' ? '◉'
            : '○';
          const isNext = nextMilestone && m.label === nextMilestone.label;

          return `
            <div style="flex-shrink: 0; text-align: center; min-width: 80px; padding: 8px; background: ${isNext ? 'var(--bg-tertiary)' : 'transparent'}; border-radius: 6px; border: ${isNext ? '2px solid var(--accent-warning)' : '1px solid transparent'};">
              <div style="width: 28px; height: 28px; border-radius: 50%; background: ${statusColor}; display: flex; align-items: center; justify-content: center; margin: 0 auto 6px; font-size: 12px; font-weight: bold; color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${statusIcon}</div>
              <div style="font-size: 10px; color: var(--text-primary); line-height: 1.3; font-weight: 600; margin-bottom: 4px;">${truncate(m.label, 18)}</div>
              <div style="font-size: 9px; color: var(--text-muted);">${formatDateShort(m.date)}</div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function formatDateShort(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
