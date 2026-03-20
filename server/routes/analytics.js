/**
 * Learning Analytics API Routes
 *
 * Provides endpoints for learning history, parameter evolution, and trend analysis.
 */

import express from 'express';
import * as storage from '../storage.js';

const router = express.Router();

/**
 * GET /api/analytics/learning-history
 * Get learning parameter evolution over time
 */
router.get('/learning-history', async (req, res) => {
  try {
    const meta = await storage.getMeta();
    const feedbackHistory = meta.predictor?.feedback || [];
    const suggestionHistory = meta.intentProxy?.suggestionHistory || [];

    // Build timeline of parameter changes
    const parameterEvolution = buildParameterEvolution(meta, feedbackHistory, suggestionHistory);

    res.json({
      success: true,
      evolution: parameterEvolution,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching learning history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/acceptance-trends
 * Get suggestion acceptance rate trends over time
 */
router.get('/acceptance-trends', async (req, res) => {
  try {
    const meta = await storage.getMeta();
    const suggestions = await storage.listAll('suggestions');

    // Group by time periods (weekly)
    const trends = buildAcceptanceTrends(suggestions);

    res.json({
      success: true,
      trends,
      overall_rate: meta.predictor?.accuracy?.rate || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching acceptance trends:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/pattern-reuse
 * Get pattern reuse frequency statistics
 */
router.get('/pattern-reuse', async (req, res) => {
  try {
    const ratPatterns = await storage.listAll('rat-patterns');

    // Sort patterns by reuse count
    const sortedPatterns = ratPatterns
      .map(p => ({
        name: p.context?.substring(0, 50) || 'Unnamed Pattern',
        reuse_count: p.reuse_count || 0,
        confidence: p.confidence || 0,
        createdAt: p.createdAt
      }))
      .sort((a, b) => b.reuse_count - a.reuse_count)
      .slice(0, 20); // Top 20

    const reuseDistribution = {
      never_used: ratPatterns.filter(p => (p.reuse_count || 0) === 0).length,
      low_use: ratPatterns.filter(p => (p.reuse_count || 0) >= 1 && (p.reuse_count || 0) <= 3).length,
      medium_use: ratPatterns.filter(p => (p.reuse_count || 0) >= 4 && (p.reuse_count || 0) <= 10).length,
      high_use: ratPatterns.filter(p => (p.reuse_count || 0) > 10).length
    };

    res.json({
      success: true,
      top_patterns: sortedPatterns,
      distribution: reuseDistribution,
      total_patterns: ratPatterns.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching pattern reuse:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/analytics/learning-velocity
 * Get learning velocity (patterns learned, actions automated per week)
 */
router.get('/learning-velocity', async (req, res) => {
  try {
    const ratPatterns = await storage.listAll('rat-patterns');
    const executionPayloads = await storage.listAll('execution-payloads');
    const intents = await storage.listAll('intents');

    // Group by weeks
    const velocity = buildLearningVelocity(ratPatterns, executionPayloads, intents);

    res.json({
      success: true,
      velocity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching learning velocity:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Helper: Build parameter evolution timeline
 */
function buildParameterEvolution(meta, feedbackHistory, suggestionHistory) {
  const evolution = [];

  // Sample key parameters over time
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  // Generate weekly snapshots (last 8 weeks)
  for (let i = 7; i >= 0; i--) {
    const weekStart = now - (i * oneWeek);
    const weekEnd = weekStart + oneWeek;

    // Filter feedback in this week
    const weekFeedback = feedbackHistory.filter(f => {
      const timestamp = new Date(f.timestamp).getTime();
      return timestamp >= weekStart && timestamp < weekEnd;
    });

    const acceptanceRate = weekFeedback.length > 0
      ? weekFeedback.filter(f => f.accepted).length / weekFeedback.length
      : 0;

    evolution.push({
      week: `Week ${8 - i}`,
      date: new Date(weekStart).toISOString(),
      acceptance_rate: acceptanceRate,
      feedback_count: weekFeedback.length,
      execution_threshold: meta.learning?.execution_threshold || 0.7,
      precision_confidence: meta.learning?.precision_confidence || 0.8
    });
  }

  return evolution;
}

/**
 * Helper: Build acceptance trends
 */
function buildAcceptanceTrends(suggestions) {
  const trends = [];
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  for (let i = 7; i >= 0; i--) {
    const weekStart = now - (i * oneWeek);
    const weekEnd = weekStart + oneWeek;

    const weekSuggestions = suggestions.filter(s => {
      const timestamp = new Date(s.timestamp || s.createdAt).getTime();
      return timestamp >= weekStart && timestamp < weekEnd;
    });

    const accepted = weekSuggestions.filter(s => s.status === 'accepted').length;
    const rejected = weekSuggestions.filter(s => s.status === 'rejected').length;
    const pending = weekSuggestions.filter(s => s.status === 'pending').length;

    trends.push({
      week: `Week ${8 - i}`,
      date: new Date(weekStart).toISOString(),
      accepted,
      rejected,
      pending,
      total: weekSuggestions.length,
      acceptance_rate: weekSuggestions.length > 0 ? accepted / weekSuggestions.length : 0
    });
  }

  return trends;
}

/**
 * Helper: Build learning velocity
 */
function buildLearningVelocity(ratPatterns, executionPayloads, intents) {
  const velocity = [];
  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;

  for (let i = 7; i >= 0; i--) {
    const weekStart = now - (i * oneWeek);
    const weekEnd = weekStart + oneWeek;

    const weekPatterns = ratPatterns.filter(p => {
      const timestamp = new Date(p.createdAt).getTime();
      return timestamp >= weekStart && timestamp < weekEnd;
    });

    const weekPayloads = executionPayloads.filter(p => {
      const timestamp = new Date(p.generatedAt || p.createdAt).getTime();
      return timestamp >= weekStart && timestamp < weekEnd;
    });

    const weekIntents = intents.filter(i => {
      const timestamp = new Date(i.createdAt).getTime();
      return timestamp >= weekStart && timestamp < weekEnd;
    });

    velocity.push({
      week: `Week ${8 - i}`,
      date: new Date(weekStart).toISOString(),
      patterns_learned: weekPatterns.length,
      payloads_generated: weekPayloads.length,
      intents_created: weekIntents.length,
      learning_rate: weekPatterns.length + weekPayloads.length // Combined activity
    });
  }

  return velocity;
}

export default router;
