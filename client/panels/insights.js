/**
 * Insights Panel — Learned Patterns and Trends Visualization
 *
 * Displays actionable insights derived from learning history, patterns, and user behavior.
 * Shows what the system has learned and provides recommendations.
 */

import { api } from '../api.js';

let insightsData = null;

/**
 * Render the insights panel
 */
export async function renderInsights(container) {
  container.innerHTML = '<div class="panel-header"><h2>⌛ Analyzing patterns and generating insights...</h2></div>';

  try {
    // Fetch all necessary data for insights
    const [intents, ratPatterns, governanceStats, cognitiveStages, learningHistory, acceptanceTrends, patternReuse, learningVelocity] = await Promise.all([
      api.getIntents(),
      api.getAll('rat-patterns').catch(() => []),
      api.getGovernanceStats().catch(() => ({ totalExecutions: 0 })),
      api.getCognitiveStages().catch(() => []),
      api.getLearningHistory().catch(() => ({ evolution: [] })),
      api.getAcceptanceTrends().catch(() => ({ trends: [] })),
      api.getPatternReuse().catch(() => ({ top_patterns: [], distribution: {} })),
      api.getLearningVelocity().catch(() => ({ velocity: [] }))
    ]);

    const meta = {}; // TODO: Add meta API endpoint if needed
    const suggestions = []; // TODO: Add suggestions list if needed

    insightsData = analyzeInsights({
      intents,
      ratPatterns,
      suggestions,
      governanceStats,
      meta,
      cognitiveStages
    });

    container.innerHTML = renderInsightsDashboard(insightsData, {
      learningHistory: learningHistory.evolution || [],
      acceptanceTrends: acceptanceTrends.trends || [],
      patternReuse: patternReuse.top_patterns || [],
      learningVelocity: learningVelocity.velocity || []
    });

  } catch (error) {
    container.innerHTML = `
      <div class="error-state">
        <h3>Failed to generate insights</h3>
        <p>${error.message}</p>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

/**
 * Analyze data to generate insights
 */
function analyzeInsights(data) {
  const insights = {
    summary: generateSummaryInsights(data),
    patterns: generatePatternInsights(data),
    trends: generateTrendInsights(data),
    recommendations: generateRecommendations(data),
    learningMetrics: generateLearningMetrics(data),
    cognitiveInsights: generateCognitiveInsights(data)
  };

  return insights;
}

/**
 * Generate summary insights
 */
function generateSummaryInsights(data) {
  const { intents, ratPatterns, suggestions, governanceStats } = data;

  const activeIntents = intents.filter(i => i.active !== false);
  const completedMilestones = intents.filter(i => i.stage === 'REFLECTION').length;
  const acceptedSuggestions = suggestions.filter(s => s.status === 'accepted').length;
  const automationRate = governanceStats.totalExecutions > 0
    ? (governanceStats.successCount / governanceStats.totalExecutions) * 100
    : 0;

  return {
    activeIntents: activeIntents.length,
    completedMilestones,
    totalPatterns: ratPatterns.length,
    acceptedSuggestions,
    automationRate: Math.round(automationRate),
    topPattern: ratPatterns.sort((a, b) => (b.reuseCount || 0) - (a.reuseCount || 0))[0]
  };
}

/**
 * Generate pattern insights
 */
function generatePatternInsights(data) {
  const { ratPatterns, intents } = data;

  const insights = [];

  // Most reused pattern
  const mostReused = ratPatterns.sort((a, b) => (b.reuseCount || 0) - (a.reuseCount || 0))[0];
  if (mostReused && mostReused.reuseCount > 3) {
    insights.push({
      type: 'success',
      title: 'Highly Effective Pattern Identified',
      description: `"${mostReused.name || mostReused.context}" has been successfully reused ${mostReused.reuseCount} times with ${Math.round(mostReused.confidence * 100)}% confidence.`,
      recommendation: 'Consider creating a governance rule to auto-apply this pattern.'
    });
  }

  // High confidence patterns
  const highConfidence = ratPatterns.filter(p => p.confidence > 0.9);
  if (highConfidence.length > 0) {
    insights.push({
      type: 'info',
      title: 'High-Confidence Patterns Available',
      description: `${highConfidence.length} patterns have >90% confidence and are ready for automation.`,
      recommendation: 'Enable auto-execution for these proven patterns.'
    });
  }

  // Intent stage bottlenecks
  const stageDistribution = intents.reduce((acc, intent) => {
    acc[intent.stage] = (acc[intent.stage] || 0) + 1;
    return acc;
  }, {});

  const maxStage = Object.entries(stageDistribution).sort((a, b) => b[1] - a[1])[0];
  if (maxStage && maxStage[1] > intents.length * 0.4) {
    insights.push({
      type: 'warning',
      title: 'Bottleneck Detected',
      description: `${maxStage[1]} intents are stuck in ${maxStage[0]} stage (${Math.round((maxStage[1] / intents.length) * 100)}% of total).`,
      recommendation: 'Review and prioritize these intents to maintain momentum.'
    });
  }

  return insights;
}

/**
 * Generate trend insights
 */
function generateTrendInsights(data) {
  const { cognitiveStages, intents } = data;

  const trends = [];

  if (cognitiveStages.length >= 4) {
    // Energy trend
    const recentEnergy = cognitiveStages.slice(-4).map(s => s.energy || 0);
    const energyTrend = calculateTrend(recentEnergy);

    if (energyTrend < -0.1) {
      trends.push({
        type: 'warning',
        metric: 'Energy',
        direction: 'declining',
        change: `${Math.abs(Math.round(energyTrend * 100))}% decrease`,
        recommendation: 'Consider reducing workload or taking a break to restore energy levels.'
      });
    } else if (energyTrend > 0.1) {
      trends.push({
        type: 'success',
        metric: 'Energy',
        direction: 'improving',
        change: `${Math.round(energyTrend * 100)}% increase`,
        recommendation: 'Great momentum! This is a good time for challenging tasks.'
      });
    }

    // Clarity trend
    const recentClarity = cognitiveStages.slice(-4).map(s => s.clarity || 0);
    const clarityTrend = calculateTrend(recentClarity);

    if (clarityTrend < -0.1) {
      trends.push({
        type: 'warning',
        metric: 'Clarity',
        direction: 'declining',
        change: `${Math.abs(Math.round(clarityTrend * 100))}% decrease`,
        recommendation: 'Spend time in reflection to clarify goals and priorities.'
      });
    } else if (clarityTrend > 0.1) {
      trends.push({
        type: 'success',
        metric: 'Clarity',
        direction: 'improving',
        change: `${Math.round(clarityTrend * 100)}% increase`,
        recommendation: 'Clear thinking! Good time for planning and decision-making.'
      });
    }
  }

  // Intent completion trend
  if (intents.length > 0) {
    const completionRate = intents.filter(i => i.stage === 'REFLECTION').length / intents.length;
    if (completionRate > 0.3) {
      trends.push({
        type: 'success',
        metric: 'Completion',
        direction: 'strong',
        change: `${Math.round(completionRate * 100)}% completion rate`,
        recommendation: 'Excellent follow-through! Continue this momentum.'
      });
    } else if (completionRate < 0.1) {
      trends.push({
        type: 'info',
        metric: 'Completion',
        direction: 'low',
        change: `${Math.round(completionRate * 100)}% completion rate`,
        recommendation: 'Focus on completing existing intents before starting new ones.'
      });
    }
  }

  return trends;
}

/**
 * Generate recommendations
 */
function generateRecommendations(data) {
  const { intents, ratPatterns, suggestions, meta } = data;

  const recommendations = [];

  // Low automation rate
  const autoRate = meta.suggestionFeedback?.acceptanceRate || 0;
  if (autoRate < 0.5 && suggestions.length > 10) {
    recommendations.push({
      priority: 'high',
      category: 'Automation',
      title: 'Low Suggestion Acceptance Rate',
      description: `Only ${Math.round(autoRate * 100)}% of suggestions are being accepted. The system may not be learning your preferences accurately.`,
      action: 'Review governance rules and provide feedback on suggestions.'
    });
  }

  // Unused patterns
  const unusedPatterns = ratPatterns.filter(p => (p.reuseCount || 0) === 0);
  if (unusedPatterns.length > 5) {
    recommendations.push({
      priority: 'medium',
      category: 'Patterns',
      title: 'Unused RAT Patterns',
      description: `${unusedPatterns.length} patterns have never been reused. They may not be relevant or discoverable.`,
      action: 'Review and archive or enhance pattern matching algorithms.'
    });
  }

  // Missing relationships
  const intentsWithoutRelations = intents.filter(i => !i.relatedPersons || i.relatedPersons.length === 0);
  if (intentsWithoutRelations.length > intents.length * 0.3) {
    recommendations.push({
      priority: 'low',
      category: 'Context',
      title: 'Missing Person Relationships',
      description: `${intentsWithoutRelations.length} intents don't have associated people. Adding relationships improves suggestions.`,
      action: 'Link intents to relevant mentors, collaborators, or stakeholders.'
    });
  }

  // High-priority stalled intents
  const stalledHighPriority = intents.filter(i =>
    i.priority === 'high' && (i.stage === 'EXPLORATION' || i.stage === 'STRUCTURING')
  );
  if (stalledHighPriority.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'Execution',
      title: 'High-Priority Intents Need Attention',
      description: `${stalledHighPriority.length} high-priority intents are in early stages.`,
      action: `Focus on: ${stalledHighPriority.slice(0, 3).map(i => i.title).join(', ')}`
    });
  }

  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Generate learning metrics
 */
function generateLearningMetrics(data) {
  const { governanceStats, ratPatterns, meta } = data;

  return {
    automatedActions: governanceStats.totalExecutions || 0,
    successRate: governanceStats.totalExecutions > 0
      ? Math.round((governanceStats.successCount / governanceStats.totalExecutions) * 100)
      : 0,
    patternsLearned: ratPatterns.length,
    mostReusedPattern: ratPatterns.sort((a, b) => (b.reuseCount || 0) - (a.reuseCount || 0))[0],
    acceptanceRate: Math.round((meta.suggestionFeedback?.acceptanceRate || 0) * 100)
  };
}

/**
 * Generate cognitive insights
 */
function generateCognitiveInsights(data) {
  const { cognitiveStages } = data;

  if (cognitiveStages.length === 0) return null;

  const latest = cognitiveStages[cognitiveStages.length - 1];
  const dominantStages = cognitiveStages.map(s => s.dominantStage);

  // Find most common stage
  const stageCounts = dominantStages.reduce((acc, stage) => {
    acc[stage] = (acc[stage] || 0) + 1;
    return acc;
  }, {});

  const mostCommon = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    currentEnergy: latest.energy,
    currentClarity: latest.clarity,
    dominantStage: latest.dominantStage,
    mostCommonStage: mostCommon[0],
    weeksCounted: cognitiveStages.length
  };
}

/**
 * Calculate trend (simple linear regression slope)
 */
function calculateTrend(values) {
  if (values.length < 2) return 0;

  const n = values.length;
  const sumX = (n * (n - 1)) / 2; // 0 + 1 + 2 + ... + (n-1)
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = values.reduce((sum, y, x) => sum + x * y, 0);
  const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6; // sum of squares

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  return slope;
}

/**
 * Render insights dashboard
 */
function renderInsightsDashboard(insights, analytics) {
  return `
    <div class="panel-header">
      <h2>📊 Insights & Learning Analytics</h2>
      <p>Visualize system learning, pattern trends, and behavior evolution over time.</p>
    </div>

    <!-- Summary Cards -->
    ${renderSummaryCards(insights.summary)}

    <!-- 4 Interactive Charts -->
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 24px; margin-bottom: 32px;">
      ${renderParameterEvolutionChart(analytics.learningHistory)}
      ${renderAcceptanceTrendsChart(analytics.acceptanceTrends)}
      ${renderPatternReuseChart(analytics.patternReuse)}
      ${renderLearningVelocityChart(analytics.learningVelocity)}
    </div>

    <!-- Key Patterns -->
    ${renderPatternsSection(insights.patterns)}

    <!-- Trends -->
    ${renderTrendsSection(insights.trends)}

    <!-- Recommendations -->
    ${renderRecommendationsSection(insights.recommendations)}

    <!-- Learning Metrics -->
    ${renderLearningMetrics(insights.learningMetrics)}

    <!-- Cognitive State -->
    ${insights.cognitiveInsights ? renderCognitiveInsights(insights.cognitiveInsights) : ''}
  `;
}

function renderSummaryCards(summary) {
  return `
    <div class="summary-cards">
      <div class="summary-card">
        <div class="card-value">${summary.activeIntents}</div>
        <div class="card-label">Active Intents</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${summary.totalPatterns}</div>
        <div class="card-label">Learned Patterns</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${summary.automationRate}%</div>
        <div class="card-label">Automation Success</div>
      </div>
      <div class="summary-card">
        <div class="card-value">${summary.acceptedSuggestions}</div>
        <div class="card-label">Suggestions Accepted</div>
      </div>
    </div>
  `;
}

function renderPatternsSection(patterns) {
  if (patterns.length === 0) return '';

  return `
    <div class="insights-section">
      <h3>📊 Pattern Insights</h3>
      ${patterns.map(p => `
        <div class="insight-card ${p.type}">
          <div class="insight-icon">${p.type === 'success' ? '✓' : p.type === 'warning' ? '⚠' : 'ℹ'}</div>
          <div class="insight-content">
            <h4>${p.title}</h4>
            <p>${p.description}</p>
            <div class="insight-recommendation">${p.recommendation}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTrendsSection(trends) {
  if (trends.length === 0) return '';

  return `
    <div class="insights-section">
      <h3>📈 Trends</h3>
      ${trends.map(t => `
        <div class="trend-card ${t.type}">
          <div class="trend-header">
            <span class="trend-metric">${t.metric}</span>
            <span class="trend-direction ${t.direction}">${t.direction} (${t.change})</span>
          </div>
          <div class="trend-recommendation">${t.recommendation}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderRecommendationsSection(recommendations) {
  if (recommendations.length === 0) {
    return `
      <div class="insights-section">
        <h3>💡 Recommendations</h3>
        <div class="no-recommendations">
          <p>✓ System is operating optimally. No recommendations at this time.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="insights-section">
      <h3>💡 Recommendations</h3>
      ${recommendations.map(r => `
        <div class="recommendation-card priority-${r.priority}">
          <div class="rec-header">
            <span class="rec-category">${r.category}</span>
            <span class="rec-priority ${r.priority}">${r.priority} priority</span>
          </div>
          <h4>${r.title}</h4>
          <p>${r.description}</p>
          <div class="rec-action"><strong>Action:</strong> ${r.action}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderLearningMetrics(metrics) {
  return `
    <div class="insights-section">
      <h3>🧠 Learning Metrics</h3>
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">Automated Actions</div>
          <div class="metric-value">${metrics.automatedActions}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Success Rate</div>
          <div class="metric-value">${metrics.successRate}%</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Patterns Learned</div>
          <div class="metric-value">${metrics.patternsLearned}</div>
        </div>
        <div class="metric-item">
          <div class="metric-label">Acceptance Rate</div>
          <div class="metric-value">${metrics.acceptanceRate}%</div>
        </div>
      </div>
      ${metrics.mostReusedPattern ? `
        <div class="top-pattern">
          <strong>Most Effective Pattern:</strong> ${metrics.mostReusedPattern.name || metrics.mostReusedPattern.context}
          (used ${metrics.mostReusedPattern.reuseCount}× with ${Math.round(metrics.mostReusedPattern.confidence * 100)}% confidence)
        </div>
      ` : ''}
    </div>
  `;
}

function renderCognitiveInsights(insights) {
  return `
    <div class="insights-section">
      <h3>🧘 Cognitive State</h3>
      <div class="cognitive-overview">
        <div class="cognitive-metric">
          <div class="metric-name">Energy</div>
          <div class="metric-bar">
            <div class="bar-fill" style="width: ${insights.currentEnergy * 100}%"></div>
          </div>
          <div class="metric-percent">${Math.round(insights.currentEnergy * 100)}%</div>
        </div>
        <div class="cognitive-metric">
          <div class="metric-name">Clarity</div>
          <div class="metric-bar">
            <div class="bar-fill" style="width: ${insights.currentClarity * 100}%"></div>
          </div>
          <div class="metric-percent">${Math.round(insights.currentClarity * 100)}%</div>
        </div>
        <div class="cognitive-info">
          <p><strong>Current Focus:</strong> ${insights.dominantStage}</p>
          <p><strong>Most Common State:</strong> ${insights.mostCommonStage} (across ${insights.weeksCounted} weeks)</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Chart 1: Parameter Evolution Over Time
 */
function renderParameterEvolutionChart(evolution) {
  if (!evolution || evolution.length === 0) {
    return '<div class="card"><div class="card-header"><span class="card-title">📈 Parameter Evolution</span></div><p style="padding: 20px; color: var(--text-muted);">No data available yet.</p></div>';
  }

  const maxRate = Math.max(...evolution.map(e => e.acceptance_rate), 1);

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">📈 Parameter Evolution</span>
        <span style="font-size: 11px; color: var(--text-muted);">Learning thresholds over time</span>
      </div>
      <div style="padding: 20px;">
        <div style="display: flex; flex-direction: column; gap: 4px; height: 200px; justify-content: space-between;">
          ${evolution.map((week, idx) => `
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 10px; color: var(--text-muted); width: 50px;">${week.week}</span>
              <div style="flex: 1; position: relative; background: var(--bg-secondary); border-radius: 4px; height: 20px; overflow: hidden;">
                <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${(week.acceptance_rate * 100)}%; background: linear-gradient(90deg, var(--accent-success), var(--accent-primary)); border-radius: 4px; transition: width 0.3s;"></div>
                <span style="position: absolute; top: 50%; left: 8px; transform: translateY(-50%); font-size: 10px; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${Math.round(week.acceptance_rate * 100)}%</span>
              </div>
              <span style="font-size: 10px; color: var(--text-secondary); width: 40px;">${week.feedback_count} feedback</span>
            </div>
          `).join('')}
        </div>
        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-subtle); display: flex; gap: 16px; font-size: 11px;">
          <div><span style="color: var(--text-muted);">Exec Threshold:</span> <strong>${(evolution[evolution.length - 1]?.execution_threshold * 100 || 70).toFixed(0)}%</strong></div>
          <div><span style="color: var(--text-muted);">Precision:</span> <strong>${(evolution[evolution.length - 1]?.precision_confidence * 100 || 80).toFixed(0)}%</strong></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Chart 2: Acceptance Rate Trends
 */
function renderAcceptanceTrendsChart(trends) {
  if (!trends || trends.length === 0) {
    return '<div class="card"><div class="card-header"><span class="card-title">✅ Acceptance Trends</span></div><p style="padding: 20px; color: var(--text-muted);">No suggestions yet.</p></div>';
  }

  const maxTotal = Math.max(...trends.map(t => t.total), 1);

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">✅ Acceptance Trends</span>
        <span style="font-size: 11px; color: var(--text-muted);">User feedback patterns</span>
      </div>
      <div style="padding: 20px;">
        <div style="height: 200px; display: flex; align-items: flex-end; gap: 8px; padding-bottom: 20px; border-bottom: 2px solid var(--border-subtle); position: relative;">
          ${trends.map((week, idx) => {
            const acceptedHeight = (week.accepted / maxTotal) * 100;
            const rejectedHeight = (week.rejected / maxTotal) * 100;
            const pendingHeight = (week.pending / maxTotal) * 100;
            return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px;">
              <div style="width: 100%; display: flex; flex-direction: column-reverse; gap: 1px; height: 160px; justify-content: flex-end;">
                ${week.accepted > 0 ? `<div style="width: 100%; height: ${acceptedHeight}%; background: var(--accent-success); border-radius: 4px 4px 0 0;" title="${week.accepted} accepted"></div>` : ''}
                ${week.rejected > 0 ? `<div style="width: 100%; height: ${rejectedHeight}%; background: var(--accent-danger);" title="${week.rejected} rejected"></div>` : ''}
                ${week.pending > 0 ? `<div style="width: 100%; height: ${pendingHeight}%; background: var(--accent-warning); border-radius: ${week.accepted === 0 && week.rejected === 0 ? '4px 4px 0 0' : '0'}" title="${week.pending} pending"></div>` : ''}
              </div>
              <span style="font-size: 9px; color: var(--text-muted); writing-mode: vertical-lr; transform: rotate(180deg);">${week.week}</span>
            </div>
          `}).join('')}
        </div>
        <div style="margin-top: 12px; display: flex; gap: 16px; justify-content: center; font-size: 11px;">
          <div style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: var(--accent-success); border-radius: 2px;"></span> Accepted</div>
          <div style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: var(--accent-danger); border-radius: 2px;"></span> Rejected</div>
          <div style="display: flex; align-items: center; gap: 4px;"><span style="width: 12px; height: 12px; background: var(--accent-warning); border-radius: 2px;"></span> Pending</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Chart 3: Pattern Reuse Frequency
 */
function renderPatternReuseChart(patterns) {
  if (!patterns || patterns.length === 0) {
    return '<div class="card"><div class="card-header"><span class="card-title">🔄 Pattern Reuse</span></div><p style="padding: 20px; color: var(--text-muted);">No patterns learned yet.</p></div>';
  }

  const topPatterns = patterns.slice(0, 8);
  const maxReuse = Math.max(...topPatterns.map(p => p.reuse_count), 1);

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">🔄 Pattern Reuse Frequency</span>
        <span style="font-size: 11px; color: var(--text-muted);">Top 8 patterns by usage</span>
      </div>
      <div style="padding: 20px;">
        <div style="display: flex; flex-direction: column; gap: 8px; max-height: 200px; overflow-y: auto;">
          ${topPatterns.map((pattern, idx) => {
            const barWidth = (pattern.reuse_count / maxReuse) * 100;
            const color = pattern.reuse_count > 10 ? 'var(--accent-success)' : pattern.reuse_count > 5 ? 'var(--accent-primary)' : 'var(--accent-info)';
            return `
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 10px; color: var(--text-muted); width: 20px;">#${idx + 1}</span>
              <div style="flex: 1;">
                <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${pattern.name}</div>
                <div style="position: relative; background: var(--bg-secondary); border-radius: 4px; height: 16px; overflow: hidden;">
                  <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${barWidth}%; background: ${color}; border-radius: 4px; transition: width 0.3s;"></div>
                  <span style="position: absolute; top: 50%; left: 6px; transform: translateY(-50%); font-size: 9px; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${pattern.reuse_count}× (${Math.round(pattern.confidence * 100)}%)</span>
                </div>
              </div>
            </div>
          `}).join('')}
        </div>
      </div>
    </div>
  `;
}

/**
 * Chart 4: Learning Velocity
 */
function renderLearningVelocityChart(velocity) {
  if (!velocity || velocity.length === 0) {
    return '<div class="card"><div class="card-header"><span class="card-title">⚡ Learning Velocity</span></div><p style="padding: 20px; color: var(--text-muted);">No activity data yet.</p></div>';
  }

  const maxVelocity = Math.max(...velocity.map(v => v.learning_rate), 1);

  return `
    <div class="card">
      <div class="card-header">
        <span class="card-title">⚡ Learning Velocity</span>
        <span style="font-size: 11px; color: var(--text-muted);">System activity over time</span>
      </div>
      <div style="padding: 20px;">
        <div style="height: 180px; display: flex; align-items: flex-end; gap: 6px; padding-bottom: 20px; border-bottom: 2px solid var(--border-subtle);">
          ${velocity.map((week, idx) => {
            const height = (week.learning_rate / maxVelocity) * 100;
            return `
            <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; position: relative;" title="Week ${idx + 1}: ${week.patterns_learned} patterns, ${week.payloads_generated} payloads, ${week.intents_created} intents">
              <div style="width: 100%; height: 140px; display: flex; align-items: flex-end;">
                <div style="width: 100%; height: ${height}%; background: linear-gradient(180deg, var(--accent-primary), var(--accent-secondary)); border-radius: 4px 4px 0 0; position: relative; overflow: hidden;">
                  <span style="position: absolute; top: 4px; left: 50%; transform: translateX(-50%); font-size: 9px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${week.learning_rate}</span>
                </div>
              </div>
              <span style="font-size: 9px; color: var(--text-muted);">W${idx + 1}</span>
            </div>
          `}).join('')}
        </div>
        <div style="margin-top: 12px; display: flex; gap: 16px; justify-content: center; font-size: 11px;">
          <div><span style="color: var(--text-muted);">Avg:</span> <strong>${Math.round(velocity.reduce((sum, v) => sum + v.learning_rate, 0) / velocity.length)}/week</strong></div>
          <div><span style="color: var(--text-muted);">Peak:</span> <strong>${maxVelocity}</strong></div>
        </div>
      </div>
    </div>
  `;
}

// Keep old export for compatibility, but export both
export { renderInsights, renderInsights as render };
