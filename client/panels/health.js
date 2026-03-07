/**
 * Health Check Dashboard Panel
 *
 * Displays system health metrics, data integrity status, and diagnostics.
 */

import { api } from '../api.js';

export async function renderHealthPanel() {
    const container = document.getElementById('health-panel');
    if (!container) return;

    container.innerHTML = '<div class="loading">Loading health metrics...</div>';

    try {
        const [health, governanceStats] = await Promise.all([
            api.getSystemHealth(),
            api.getGovernanceStats().catch(() => ({ totalExecutions: 0, successCount: 0 }))
        ]);

        const healthPercent = health.database.healthPercentage;
        const statusColor = healthPercent === 100 ? '#00ff88' : healthPercent >= 90 ? '#ffaa00' : '#ff4444';

        container.innerHTML = `
            <div class="panel-header">
                <h2>🏥 System Health</h2>
                <button class="btn-secondary" onclick="window.healthPanel.refresh()">Refresh</button>
            </div>

            <!-- Overall Status Card -->
            <div class="health-status-card" style="border-left: 4px solid ${statusColor}">
                <div class="status-header">
                    <h3>Overall Status: ${health.status === 'healthy' ? '✅ Healthy' : '⚠️ Issues Detected'}</h3>
                    <div class="status-metric">${healthPercent}%</div>
                </div>
                <div class="status-details">
                    <div class="metric">
                        <span class="metric-label">Total Files:</span>
                        <span class="metric-value">${health.database.totalFiles}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Valid:</span>
                        <span class="metric-value" style="color: #00ff88">${health.database.validFiles}</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">Issues:</span>
                        <span class="metric-value" style="color: #ff4444">${health.database.invalidFiles}</span>
                    </div>
                </div>
                <div class="status-timestamp">Last checked: ${new Date(health.timestamp).toLocaleString()}</div>
            </div>

            <!-- Health Bar Chart -->
            <div class="health-bar">
                <div class="health-bar-fill" style="width: ${healthPercent}%; background: ${statusColor}"></div>
            </div>

            <!-- Collection Health Grid -->
            <div class="collections-grid">
                <h3>📁 Collection Status</h3>
                ${health.collections.map(col => {
                    const colHealth = col.totalFiles > 0 ? Math.round((col.validFiles / col.totalFiles) * 100) : 100;
                    const colColor = colHealth === 100 ? '#00ff88' : colHealth >= 90 ? '#ffaa00' : '#ff4444';
                    return `
                        <div class="collection-card" style="border-color: ${colColor}">
                            <div class="collection-header">
                                <span class="collection-name">${col.name}</span>
                                <span class="collection-health" style="color: ${colColor}">${colHealth}%</span>
                            </div>
                            <div class="collection-metrics">
                                <div class="mini-metric">
                                    <span class="mini-label">Files:</span>
                                    <span class="mini-value">${col.totalFiles}</span>
                                </div>
                                <div class="mini-metric">
                                    <span class="mini-label">Valid:</span>
                                    <span class="mini-value">${col.validFiles}</span>
                                </div>
                                ${col.invalidFiles > 0 ? `
                                    <div class="mini-metric">
                                        <span class="mini-label">Issues:</span>
                                        <span class="mini-value" style="color: #ff4444">${col.invalidFiles}</span>
                                    </div>
                                ` : ''}
                            </div>
                            ${col.issuesCount > 0 ? `
                                <button class="btn-repair" onclick="window.healthPanel.repairCollection('${col.name}')">
                                    🔧 Repair (${col.issuesCount} issues)
                                </button>
                            ` : '<div class="status-ok">✓ All data valid</div>'}
                        </div>
                    `;
                }).join('')}
            </div>

            <!-- Governance Stats -->
            <div class="governance-stats-section">
                <h3>🛡️ Governance Engine</h3>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Total Executions</div>
                        <div class="stat-value">${governanceStats.totalExecutions || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Success Rate</div>
                        <div class="stat-value">
                            ${governanceStats.totalExecutions > 0
                                ? Math.round((governanceStats.successCount / governanceStats.totalExecutions) * 100)
                                : 0}%
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Successful</div>
                        <div class="stat-value" style="color: #00ff88">${governanceStats.successCount || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Failed</div>
                        <div class="stat-value" style="color: #ff4444">${governanceStats.failureCount || 0}</div>
                    </div>
                </div>

                ${governanceStats.recentExecutions && governanceStats.recentExecutions.length > 0 ? `
                    <div class="recent-executions">
                        <h4>Recent Automated Actions</h4>
                        ${governanceStats.recentExecutions.slice(0, 5).map(exec => `
                            <div class="execution-item">
                                <span class="exec-status ${exec.status === 'completed' ? 'success' : 'failed'}">
                                    ${exec.status === 'completed' ? '✓' : '✗'}
                                </span>
                                <span class="exec-action">${exec.action?.type || 'unknown'}</span>
                                <span class="exec-time">${new Date(exec.timestamp).toLocaleString()}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>

            <!-- System Actions -->
            <div class="system-actions">
                <h3>🔧 System Actions</h3>
                <div class="action-buttons">
                    <button class="btn-primary" onclick="window.healthPanel.createBackup()">
                        💾 Create Backup
                    </button>
                    <button class="btn-secondary" onclick="window.healthPanel.viewBackups()">
                        📦 View Backups
                    </button>
                    <button class="btn-secondary" onclick="window.healthPanel.validateAll()">
                        ✓ Validate All Data
                    </button>
                    <button class="btn-warning" onclick="window.healthPanel.repairAll()">
                        🔧 Repair All Collections
                    </button>
                </div>
            </div>

            <!-- Status Log -->
            <div id="health-status-log" class="status-log"></div>
        `;

    } catch (err) {
        container.innerHTML = `
            <div class="panel-header">
                <h2>🏥 System Health</h2>
            </div>
            <div class="error-state">
                <p>⚠️ Failed to load health metrics</p>
                <p class="error-details">${err.message}</p>
                <button class="btn-primary" onclick="window.healthPanel.refresh()">Retry</button>
            </div>
        `;
    }
}

// Health panel actions
window.healthPanel = {
    async refresh() {
        await renderHealthPanel();
    },

    async repairCollection(collection) {
        const log = document.getElementById('health-status-log');
        log.innerHTML = `<div class="log-entry info">🔧 Repairing ${collection}...</div>`;

        try {
            const result = await api.repairCollection(collection);
            log.innerHTML += `
                <div class="log-entry success">
                    ✓ Repair complete for ${collection}: ${result.repairedFiles} files repaired,
                    ${result.unchangedFiles} unchanged, ${result.failedFiles} failed
                </div>
            `;

            setTimeout(() => this.refresh(), 1500);
        } catch (err) {
            log.innerHTML += `<div class="log-entry error">✗ Repair failed: ${err.message}</div>`;
        }
    },

    async createBackup() {
        const log = document.getElementById('health-status-log');
        log.innerHTML = `<div class="log-entry info">💾 Creating backup...</div>`;

        try {
            const result = await api.createBackup();
            log.innerHTML += `
                <div class="log-entry success">
                    ✓ Backup created successfully: ${result.totalFiles} files backed up<br>
                    Backup ID: ${result.timestamp}
                </div>
            `;
        } catch (err) {
            log.innerHTML += `<div class="log-entry error">✗ Backup failed: ${err.message}</div>`;
        }
    },

    async viewBackups() {
        try {
            const backups = await api.listBackups();
            const log = document.getElementById('health-status-log');

            if (backups.length === 0) {
                log.innerHTML = `<div class="log-entry info">No backups found. Create one to get started.</div>`;
                return;
            }

            log.innerHTML = `
                <div class="backups-list">
                    <h4>📦 Available Backups</h4>
                    ${backups.map(backup => `
                        <div class="backup-item">
                            <div class="backup-info">
                                <div class="backup-id">${backup.id}</div>
                                <div class="backup-date">${new Date(backup.created).toLocaleString()}</div>
                            </div>
                            <button class="btn-small btn-secondary" onclick="window.healthPanel.restoreBackup('${backup.id}')">
                                Restore
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        } catch (err) {
            const log = document.getElementById('health-status-log');
            log.innerHTML = `<div class="log-entry error">✗ Failed to load backups: ${err.message}</div>`;
        }
    },

    async restoreBackup(backupId) {
        if (!confirm(`⚠️ This will restore all data from backup ${backupId}. Current data will be overwritten. Continue?`)) {
            return;
        }

        const log = document.getElementById('health-status-log');
        log.innerHTML = `<div class="log-entry info">📦 Restoring backup ${backupId}...</div>`;

        try {
            const result = await api.restoreBackup(backupId);
            log.innerHTML += `
                <div class="log-entry success">
                    ✓ Backup restored successfully: ${result.totalFiles} files restored
                </div>
            `;

            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (err) {
            log.innerHTML += `<div class="log-entry error">✗ Restore failed: ${err.message}</div>`;
        }
    },

    async validateAll() {
        const log = document.getElementById('health-status-log');
        log.innerHTML = `<div class="log-entry info">✓ Running full validation...</div>`;

        try {
            const result = await api.checkIntegrity();
            log.innerHTML += `
                <div class="log-entry ${result.healthy ? 'success' : 'warning'}">
                    ${result.healthy ? '✓ All data is valid!' : '⚠️ Issues found in some collections'}
                    <br>Total: ${result.summary.totalFiles} files,
                    Valid: ${result.summary.validFiles},
                    Issues: ${result.summary.invalidFiles}
                </div>
            `;

            setTimeout(() => this.refresh(), 1000);
        } catch (err) {
            log.innerHTML += `<div class="log-entry error">✗ Validation failed: ${err.message}</div>`;
        }
    },

    async repairAll() {
        if (!confirm('⚠️ This will attempt to repair all collections. Continue?')) {
            return;
        }

        const log = document.getElementById('health-status-log');
        log.innerHTML = `<div class="log-entry info">🔧 Repairing all collections...</div>`;

        const collections = ['persons', 'intents', 'relations', 'thinking-chains',
                           'trajectories', 'cognitive-stages', 'governance-rules', 'rat-patterns'];

        let totalRepaired = 0;
        let totalFailed = 0;

        for (const collection of collections) {
            try {
                const result = await api.repairCollection(collection);
                totalRepaired += result.repairedFiles;
                totalFailed += result.failedFiles;

                if (result.repairedFiles > 0) {
                    log.innerHTML += `
                        <div class="log-entry success">
                            ✓ ${collection}: ${result.repairedFiles} repaired
                        </div>
                    `;
                }
            } catch (err) {
                log.innerHTML += `<div class="log-entry error">✗ ${collection}: ${err.message}</div>`;
            }
        }

        log.innerHTML += `
            <div class="log-entry info">
                🎉 Repair complete: ${totalRepaired} files repaired, ${totalFailed} failed
            </div>
        `;

        setTimeout(() => this.refresh(), 2000);
    }
};
