/**
 * Intent Clusters Panel
 *
 * Visualize intent clusters, detect duplicates, and suggest consolidation opportunities.
 * Uses TF-IDF and cosine similarity for semantic grouping.
 */

import { api } from '../api.js';

export async function renderClusters(container) {
  container.innerHTML = '<div class="panel-header"><h2>🔍 Loading clusters...</h2></div>';

  try {
    const [clustersData, duplicatesData, recommendations, stats] = await Promise.all([
      api.clusterIntents(5),
      api.findDuplicates(0.7),
      api.getConsolidationRecommendations(),
      api.getClusteringStatistics()
    ]);

    const clusters = clustersData.clusters || [];
    const duplicates = duplicatesData.duplicates || [];

    container.innerHTML = `
      <div class="panel-header">
        <h2>🔍 Intent Clusters & Duplicate Detection</h2>
        <p>Discover similar intents, reduce cognitive load, and consolidate overlapping goals.</p>
      </div>

      <!-- Statistics Cards -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 32px;">
        <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 36px; font-weight: 800; color: var(--accent-primary);">${stats.total_intents}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Total Intents</div>
        </div>
        <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 36px; font-weight: 800; color: var(--accent-warning);">${stats.duplicates_found}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Duplicates Found</div>
        </div>
        <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 36px; font-weight: 800; color: var(--accent-info);">${stats.similar_pairs}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Similar Pairs</div>
        </div>
        <div class="card" style="padding: 20px; text-align: center;">
          <div style="font-size: 36px; font-weight: 800; color: var(--accent-success);">${stats.clusters_found}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Clusters</div>
        </div>
      </div>

      <!-- Tab Navigation -->
      <div style="display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 2px solid var(--border-subtle);">
        <button class="tab-btn active" data-tab="recommendations" style="padding: 12px 24px; background: transparent; border: none; border-bottom: 2px solid var(--accent-primary); color: var(--accent-primary); cursor: pointer; font-weight: 600; transition: all 0.2s;">
          Recommendations (${recommendations.length})
        </button>
        <button class="tab-btn" data-tab="duplicates" style="padding: 12px 24px; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); cursor: pointer; font-weight: 600; transition: all 0.2s;">
          Duplicates (${duplicates.filter(d => d.similarity > 0.9).length})
        </button>
        <button class="tab-btn" data-tab="clusters" style="padding: 12px 24px; background: transparent; border: none; border-bottom: 2px solid transparent; color: var(--text-muted); cursor: pointer; font-weight: 600; transition: all 0.2s;">
          Clusters (${clusters.length})
        </button>
      </div>

      <!-- Recommendations Tab -->
      <div id="tab-recommendations" class="tab-content">
        ${recommendations.length > 0 ? recommendations.map(rec => `
          <div class="card" style="margin-bottom: 16px; padding: 20px; border-left: 4px solid ${rec.priority === 'high' ? 'var(--accent-danger)' : rec.priority === 'medium' ? 'var(--accent-warning)' : 'var(--accent-info)'};">
            <div style="display: flex; justify-content: between; align-items: start; margin-bottom: 12px;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                  <span class="badge" style="background: ${rec.priority === 'high' ? 'rgba(255, 82, 82, 0.15)' : rec.priority === 'medium' ? 'rgba(255, 177, 66, 0.15)' : 'rgba(32, 191, 230, 0.15)'}; color: ${rec.priority === 'high' ? 'var(--accent-danger)' : rec.priority === 'medium' ? 'var(--accent-warning)' : 'var(--accent-info)'}; text-transform: uppercase; font-size: 10px; font-weight: 700;">${rec.priority} Priority</span>
                  <span class="badge" style="background: rgba(255, 255, 255, 0.05); color: var(--text-secondary); font-size: 10px;">${rec.type}</span>
                  <span style="font-size: 12px; color: var(--text-muted);">${Math.round(rec.similarity * 100)}% similar</span>
                </div>
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: var(--text-primary);">${rec.action}</div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 12px;">${rec.reason}</div>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 16px; align-items: center;">
              <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Intent 1</div>
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">${rec.intents[0].title}</div>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <span class="badge badge-${rec.intents[0].stage}" style="font-size: 9px;">${rec.intents[0].stage}</span>
                  ${rec.intents[0].priority ? `<span style="font-size: 10px; color: var(--text-muted);">Priority: ${rec.intents[0].priority}</span>` : ''}
                </div>
              </div>

              <div style="font-size: 20px; color: var(--text-muted);">↔</div>

              <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Intent 2</div>
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 4px;">${rec.intents[1].title}</div>
                <div style="display: flex; gap: 6px; align-items: center;">
                  <span class="badge badge-${rec.intents[1].stage}" style="font-size: 9px;">${rec.intents[1].stage}</span>
                  ${rec.intents[1].priority ? `<span style="font-size: 10px; color: var(--text-muted);">Priority: ${rec.intents[1].priority}</span>` : ''}
                </div>
              </div>
            </div>

            <div style="margin-top: 16px; display: flex; gap: 12px;">
              <button class="btn btn-sm" style="background: var(--accent-success); color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer;" onclick="alert('Merge feature coming soon!')">
                Merge Intents
              </button>
              <button class="btn btn-sm" style="background: transparent; border: 1px solid var(--border-subtle); color: var(--text-secondary); padding: 8px 16px; border-radius: 6px; cursor: pointer;" onclick="this.parentElement.parentElement.remove()">
                Dismiss
              </button>
            </div>
          </div>
        `).join('') : `
          <div class="card" style="padding: 40px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">✨</div>
            <h3 style="margin-bottom: 8px; color: var(--text-primary);">No Recommendations</h3>
            <p style="color: var(--text-secondary);">Your intents are well-organized. Keep up the good work!</p>
          </div>
        `}
      </div>

      <!-- Duplicates Tab -->
      <div id="tab-duplicates" class="tab-content" style="display: none;">
        ${duplicates.filter(d => d.similarity > 0.9).length > 0 ? duplicates.filter(d => d.similarity > 0.9).map(dup => `
          <div class="card" style="margin-bottom: 16px; padding: 20px; border-left: 4px solid var(--accent-danger);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div style="font-size: 14px; font-weight: 600; color: var(--accent-danger);">
                🚨 Likely Duplicate (${Math.round(dup.similarity * 100)}% match)
              </div>
              <span style="font-size: 12px; color: var(--text-secondary);">${dup.reason}</span>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div style="padding: 14px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">${dup.intent1.title}</div>
                <div style="display: flex; gap: 6px;">
                  <span class="badge badge-${dup.intent1.stage}" style="font-size: 9px;">${dup.intent1.stage}</span>
                </div>
              </div>

              <div style="padding: 14px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-subtle);">
                <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">${dup.intent2.title}</div>
                <div style="display: flex; gap: 6px;">
                  <span class="badge badge-${dup.intent2.stage}" style="font-size: 9px;">${dup.intent2.stage}</span>
                </div>
              </div>
            </div>
          </div>
        `).join('') : `
          <div class="card" style="padding: 40px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
            <h3 style="margin-bottom: 8px; color: var(--text-primary);">No Duplicates Found</h3>
            <p style="color: var(--text-secondary);">All your intents are unique. Great job staying organized!</p>
          </div>
        `}
      </div>

      <!-- Clusters Tab -->
      <div id="tab-clusters" class="tab-content" style="display: none;">
        ${clusters.length > 0 ? clusters.map((cluster, idx) => `
          <div class="card" style="margin-bottom: 24px; padding: 20px; border-left: 4px solid hsl(${idx * 60}, 70%, 60%);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <div style="font-size: 16px; font-weight: 700; margin-bottom: 4px; color: var(--text-primary);">
                  Cluster ${cluster.cluster_id + 1}: ${cluster.centroid_label}
                </div>
                <div style="font-size: 12px; color: var(--text-secondary);">${cluster.size} intent${cluster.size > 1 ? 's' : ''} in this group</div>
              </div>
              <div style="width: 60px; height: 60px; border-radius: 50%; background: linear-gradient(135deg, hsl(${idx * 60}, 70%, 60%), hsl(${idx * 60}, 70%, 50%)); display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                ${cluster.size}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px;">
              ${cluster.members.map(member => `
                <div style="padding: 12px; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-subtle);">
                  <div style="font-size: 12px; font-weight: 600; margin-bottom: 6px; color: var(--text-primary);">${truncate(member.title, 35)}</div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span class="badge badge-${member.stage}" style="font-size: 9px;">${member.stage}</span>
                    <span style="font-size: 10px; color: var(--text-muted);">Distance: ${member.distance.toFixed(2)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('') : `
          <div class="card" style="padding: 40px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
            <h3 style="margin-bottom: 8px; color: var(--text-primary);">Not Enough Data</h3>
            <p style="color: var(--text-secondary);">Add more intents to see clustering patterns emerge.</p>
          </div>
        `}
      </div>
    `;

    // Setup tab switching
    setupTabs();

  } catch (err) {
    container.innerHTML = `
      <div class="panel-header">
        <h2>🔍 Intent Clusters</h2>
        <p style="color: var(--accent-danger);">Error: ${err.message}</p>
      </div>
    `;
  }
}

function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Update button styles
      tabButtons.forEach(b => {
        b.style.borderBottomColor = 'transparent';
        b.style.color = 'var(--text-muted)';
        b.classList.remove('active');
      });
      btn.style.borderBottomColor = 'var(--accent-primary)';
      btn.style.color = 'var(--accent-primary)';
      btn.classList.add('active');

      // Show/hide content
      tabContents.forEach(content => {
        content.style.display = 'none';
      });
      document.getElementById(`tab-${targetTab}`).style.display = 'block';
    });
  });
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
