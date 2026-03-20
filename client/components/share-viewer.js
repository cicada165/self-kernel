/**
 * Share Viewer Component
 * Read-only view for shared intents, trajectories, and thinking chains
 */

export class ShareViewer {
  constructor() {
    this.init();
  }

  init() {
    // Check if we're on a share URL
    const path = window.location.pathname;
    if (path.startsWith('/share/')) {
      const token = path.split('/share/')[1];
      this.loadSharedResource(token);
    }
  }

  async loadSharedResource(token) {
    // Hide the main app and show share viewer
    const app = document.getElementById('app');
    if (!app) return;

    app.innerHTML = '<div class="share-loading"><div class="loading-spinner"></div><p>Loading shared resource...</p></div>';

    try {
      const response = await fetch(`http://localhost:3000/api/sharing/${token}`);
      const data = await response.json();

      if (!response.ok) {
        if (data.requiresPassword) {
          this.showPasswordPrompt(token);
          return;
        }
        throw new Error(data.error || 'Failed to load shared resource');
      }

      this.renderSharedResource(data);

    } catch (error) {
      console.error('Error loading shared resource:', error);
      app.innerHTML = `
        <div class="share-error">
          <div class="error-icon">❌</div>
          <h2>Failed to Load</h2>
          <p>${error.message}</p>
          <a href="/" class="btn btn-primary">Go to Dashboard</a>
        </div>
      `;
    }
  }

  showPasswordPrompt(token) {
    const app = document.getElementById('app');
    app.innerHTML = `
      <div class="share-password-prompt">
        <div class="password-card">
          <h2>🔒 Password Required</h2>
          <p>This shared resource is password protected</p>
          <form id="password-form">
            <input type="password" id="share-password" placeholder="Enter password" autofocus />
            <div class="password-actions">
              <button type="submit" class="btn btn-primary">Access</button>
              <a href="/" class="btn">Cancel</a>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById('password-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('share-password').value;

      try {
        const response = await fetch(`http://localhost:3000/api/sharing/${token}?password=${encodeURIComponent(password)}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Invalid password');
        }

        this.renderSharedResource(data);
      } catch (error) {
        alert(error.message);
      }
    });
  }

  renderSharedResource(data) {
    const { share, resource, relatedData } = data;

    const app = document.getElementById('app');

    let content = '';

    switch (share.type) {
      case 'intent':
        content = this.renderIntent(resource, relatedData);
        break;
      case 'trajectory':
        content = this.renderTrajectory(resource, relatedData);
        break;
      case 'thinking-chain':
        content = this.renderThinkingChain(resource, relatedData);
        break;
      default:
        content = '<p>Unknown share type</p>';
    }

    app.innerHTML = `
      <div class="share-viewer">
        <div class="share-header">
          <div class="share-brand">
            <span class="share-icon">🧠</span>
            <div>
              <h3>Self Kernel</h3>
              <p>Shared ${share.type}</p>
            </div>
          </div>
          <div class="share-meta">
            <span>👁️ ${share.accessCount} views</span>
            <span>⏱️ Expires ${new Date(share.expiresAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="share-content">
          ${content}
        </div>
        <div class="share-footer">
          <p>Shared via Self Kernel — Your Personal Intelligence Core</p>
          <a href="/" class="btn">Open Self Kernel</a>
        </div>
      </div>
    `;
  }

  renderIntent(intent, relatedData) {
    return `
      <div class="shared-intent">
        <div class="intent-header">
          <h2>${intent.target}</h2>
          <div class="intent-badges">
            <span class="badge badge-${intent.stage}">${intent.stage}</span>
            <span class="badge priority-${intent.priority}">${intent.priority.toUpperCase()}</span>
          </div>
        </div>

        ${intent.notes ? `
          <div class="intent-section">
            <h3>Notes</h3>
            <p>${intent.notes}</p>
          </div>
        ` : ''}

        <div class="intent-section">
          <h3>Details</h3>
          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Created</span>
              <span class="detail-value">${new Date(intent.createdAt).toLocaleDateString()}</span>
            </div>
            ${intent.deadline ? `
              <div class="detail-item">
                <span class="detail-label">Deadline</span>
                <span class="detail-value">${new Date(intent.deadline).toLocaleDateString()}</span>
              </div>
            ` : ''}
            ${intent.tags && intent.tags.length > 0 ? `
              <div class="detail-item">
                <span class="detail-label">Tags</span>
                <span class="detail-value">${intent.tags.map(t => `<span class="tag">${t}</span>`).join(' ')}</span>
              </div>
            ` : ''}
          </div>
        </div>

        ${relatedData.trajectory ? `
          <div class="intent-section">
            <h3>Part of Trajectory</h3>
            <div class="trajectory-preview">
              <strong>${relatedData.trajectory.name}</strong>
              <p>${relatedData.trajectory.description || ''}</p>
            </div>
          </div>
        ` : ''}

        ${relatedData.persons && relatedData.persons.length > 0 ? `
          <div class="intent-section">
            <h3>Involved People</h3>
            <div class="persons-list">
              ${relatedData.persons.map(p => `
                <div class="person-item">
                  <div class="person-avatar">${p.name.charAt(0)}</div>
                  <div>
                    <strong>${p.name}</strong>
                    <span>${p.role || p.type}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderTrajectory(trajectory, relatedData) {
    const milestones = trajectory.milestones || [];
    const completedCount = milestones.filter(m => m.status === 'completed').length;
    const progress = milestones.length > 0 ? (completedCount / milestones.length * 100).toFixed(0) : 0;

    return `
      <div class="shared-trajectory">
        <div class="trajectory-header">
          <h2>${trajectory.name}</h2>
          <p>${trajectory.description || ''}</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
          <span class="progress-text">${completedCount} of ${milestones.length} milestones completed</span>
        </div>

        ${milestones.length > 0 ? `
          <div class="trajectory-section">
            <h3>Milestones</h3>
            <div class="milestones-list">
              ${milestones.map((m, i) => `
                <div class="milestone-item ${m.status === 'completed' ? 'completed' : ''}">
                  <div class="milestone-number">${i + 1}</div>
                  <div class="milestone-content">
                    <strong>${m.name}</strong>
                    <p>${m.description || ''}</p>
                    <span class="milestone-date">Target: ${new Date(m.targetDate).toLocaleDateString()}</span>
                  </div>
                  <div class="milestone-status">
                    ${m.status === 'completed' ? '✅' : '○'}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${relatedData.intents && relatedData.intents.length > 0 ? `
          <div class="trajectory-section">
            <h3>Related Intents (${relatedData.intents.length})</h3>
            <div class="intents-grid">
              ${relatedData.intents.map(i => `
                <div class="intent-card-mini">
                  <span class="badge badge-${i.stage}">${i.stage}</span>
                  <strong>${i.target}</strong>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderThinkingChain(chain, relatedData) {
    return `
      <div class="shared-thinking-chain">
        <div class="chain-header">
          <h2>${chain.label || 'Thinking Chain'}</h2>
          <p>${chain.description || ''}</p>
        </div>

        ${chain.nodes && chain.nodes.length > 0 ? `
          <div class="chain-section">
            <h3>Thoughts (${chain.nodes.length})</h3>
            <div class="thoughts-list">
              ${chain.nodes.map(node => `
                <div class="thought-item">
                  <div class="thought-marker ${node.type}"></div>
                  <div class="thought-content">
                    <strong>${node.type}</strong>
                    <p>${node.content || ''}</p>
                    <span class="thought-date">${new Date(node.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${relatedData.intents && relatedData.intents.length > 0 ? `
          <div class="chain-section">
            <h3>Connected Intents</h3>
            <div class="intents-grid">
              ${relatedData.intents.map(i => `
                <div class="intent-card-mini">
                  <span class="badge badge-${i.stage}">${i.stage}</span>
                  <strong>${i.target}</strong>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
}
