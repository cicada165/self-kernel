/**
 * FSM Stage Transition Predictor Service
 *
 * Analyzes historical FSM stage progression patterns to predict when intents
 * are ready to transition to the next stage. Uses multi-signal confidence scoring
 * based on time in current stage, completeness, historical patterns, and user activity.
 *
 * Learning from user feedback: accepts/rejects predictions to improve accuracy.
 */

import * as storage from '../storage.js';

// FSM Stage sequence
const STAGE_SEQUENCE = ['exploration', 'structuring', 'decision', 'execution', 'reflection'];
const STAGE_INDEX = {
  exploration: 0,
  structuring: 1,
  decision: 2,
  execution: 3,
  reflection: 4
};

/**
 * Calculate time in current stage (in hours)
 */
function getTimeInStage(intent) {
  // Find when intent entered current stage from stageHistory
  if (intent.stageHistory && Array.isArray(intent.stageHistory) && intent.stageHistory.length > 0) {
    const currentStage = intent.stage?.toLowerCase() || 'exploration';
    // Sort history by timestamp (most recent first)
    const sortedHistory = [...intent.stageHistory].sort((a, b) =>
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    // Find when intent entered current stage
    const stageEntry = sortedHistory.find(h => h.stage?.toLowerCase() === currentStage);
    if (stageEntry) {
      const enteredAt = new Date(stageEntry.timestamp);
      return (Date.now() - enteredAt.getTime()) / (1000 * 60 * 60);
    }
  }

  // Fallback to intent creation time
  const created = new Date(intent.createdAt || Date.now());
  return (Date.now() - created.getTime()) / (1000 * 60 * 60);
}

/**
 * Analyze historical stage transitions to find average time per stage
 */
async function analyzeHistoricalPatterns() {
  const intents = await storage.listAll('intents');
  const relations = await storage.listAll('relations');

  // Group by stage and calculate average time in each stage
  const stageStats = {};

  STAGE_SEQUENCE.forEach(stage => {
    stageStats[stage] = {
      count: 0,
      totalTime: 0,
      avgTime: 0,
      transitions: []
    };
  });

  // Analyze completed stage transitions
  intents.forEach(intent => {
    if (intent.stageHistory && Array.isArray(intent.stageHistory)) {
      for (let i = 0; i < intent.stageHistory.length - 1; i++) {
        const current = intent.stageHistory[i];
        const next = intent.stageHistory[i + 1];

        if (current.stage && next.stage && current.timestamp && next.timestamp) {
          const currentStageKey = current.stage.toLowerCase();
          const timeInStage = (new Date(next.timestamp) - new Date(current.timestamp)) / (1000 * 60 * 60);

          if (stageStats[currentStageKey]) {
            stageStats[currentStageKey].count++;
            stageStats[currentStageKey].totalTime += timeInStage;
            stageStats[currentStageKey].transitions.push({
              intentId: intent.id,
              timeInStage,
              nextStage: next.stage.toLowerCase(),
              timestamp: next.timestamp
            });
          }
        }
      }
    }
  });

  // Calculate averages
  Object.keys(stageStats).forEach(stage => {
    if (stageStats[stage].count > 0) {
      stageStats[stage].avgTime = stageStats[stage].totalTime / stageStats[stage].count;
    } else {
      // Default estimates if no historical data (in hours)
      const defaults = {
        exploration: 72,    // 3 days
        structuring: 48,    // 2 days
        decision: 24,       // 1 day
        execution: 120,     // 5 days
        reflection: 12      // 0.5 days
      };
      stageStats[stage].avgTime = defaults[stage] || 48;
    }
  });

  return stageStats;
}

/**
 * Calculate completeness score for an intent (0-1)
 */
function calculateCompleteness(intent) {
  let score = 0;
  let maxScore = 5;

  // Has title
  if (intent.title && intent.title.trim().length > 0) score += 1;

  // Has description
  if (intent.description && intent.description.trim().length > 10) score += 1;

  // Has tags
  if (intent.tags && intent.tags.length > 0) score += 1;

  // Has priority
  if (intent.priority) score += 0.5;

  // Has relationships (linkedPersons)
  if (intent.linkedPersons && intent.linkedPersons.length > 0) {
    score += 1;
  }

  // Has parent or children
  if (intent.parentId || (intent.children && intent.children.length > 0)) {
    score += 0.5;
  }

  return score / maxScore;
}

/**
 * Calculate user activity score based on recent interactions
 */
async function calculateActivityScore(intent) {
  // Check if intent was updated recently
  const daysSinceUpdate = (Date.now() - new Date(intent.updatedAt || intent.createdAt)) / (1000 * 60 * 60 * 24);

  // Very recent (< 2 days) = 1.0
  // Recent (2-7 days) = 0.7
  // Moderate (7-14 days) = 0.5
  // Old (14-30 days) = 0.3
  // Stale (> 30 days) = 0.1
  if (daysSinceUpdate < 2) return 1.0;
  if (daysSinceUpdate < 7) return 0.7;
  if (daysSinceUpdate < 14) return 0.5;
  if (daysSinceUpdate < 30) return 0.3;
  return 0.1;
}

/**
 * Calculate multi-signal confidence score for stage transition
 */
async function calculateTransitionConfidence(intent, historicalStats) {
  const currentStage = intent.stage || 'exploration';
  const timeInStage = getTimeInStage(intent);
  const avgTime = historicalStats[currentStage]?.avgTime || 48;
  const completeness = calculateCompleteness(intent);
  const activity = await calculateActivityScore(intent);

  // Signal 1: Time-based (30% weight)
  // Ready when time >= 80% of average, maxes at 150% of average
  const timeRatio = timeInStage / avgTime;
  const timeSignal = Math.min(Math.max((timeRatio - 0.8) / 0.7, 0), 1);

  // Signal 2: Completeness (30% weight)
  const completenessSignal = completeness;

  // Signal 3: Historical patterns (20% weight)
  // If similar intents transitioned at similar times, boost confidence
  const transitions = historicalStats[currentStage]?.transitions || [];
  const similarTimeTransitions = transitions.filter(t => {
    const diff = Math.abs(t.timeInStage - timeInStage);
    return diff < avgTime * 0.3; // Within 30% of current time
  });
  const historicalSignal = Math.min(similarTimeTransitions.length / 3, 1.0);

  // Signal 4: Activity (20% weight)
  const activitySignal = activity;

  // Weighted combination
  const confidence = (
    timeSignal * 0.30 +
    completenessSignal * 0.30 +
    historicalSignal * 0.20 +
    activitySignal * 0.20
  );

  return {
    confidence,
    signals: {
      time: timeSignal,
      completeness: completenessSignal,
      historical: historicalSignal,
      activity: activitySignal
    },
    metrics: {
      timeInStage,
      avgTime,
      completeness,
      activity
    }
  };
}

/**
 * Generate reasoning text for a prediction
 */
function generateReasoning(intent, analysis, nextStage) {
  const reasons = [];
  const { signals, metrics } = analysis;

  // Time-based reasoning
  if (signals.time > 0.7) {
    const hours = Math.round(metrics.timeInStage);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    const timeStr = days > 0 ? `${days}d ${remainingHours}h` : `${hours}h`;
    reasons.push(`Been in ${intent.stage} for ${timeStr}, exceeding typical duration`);
  } else if (signals.time > 0.4) {
    reasons.push(`Approaching typical transition time for ${intent.stage} stage`);
  }

  // Completeness reasoning
  if (signals.completeness > 0.8) {
    reasons.push(`Intent is well-defined (${Math.round(metrics.completeness * 100)}% complete)`);
  } else if (signals.completeness < 0.5) {
    reasons.push(`Consider adding more details before transitioning (${Math.round(metrics.completeness * 100)}% complete)`);
  }

  // Historical reasoning
  if (signals.historical > 0.6) {
    reasons.push(`Similar intents transitioned successfully at this stage`);
  }

  // Activity reasoning
  if (signals.activity > 0.6) {
    reasons.push(`Recent active engagement detected`);
  } else if (signals.activity < 0.2) {
    reasons.push(`Low recent activity - may need attention`);
  }

  return reasons.join('. ');
}

/**
 * Get next stage in the FSM sequence
 */
function getNextStage(currentStage) {
  const currentIndex = STAGE_INDEX[currentStage];
  if (currentIndex === undefined || currentIndex === STAGE_SEQUENCE.length - 1) {
    return null; // Already at final stage
  }
  return STAGE_SEQUENCE[currentIndex + 1];
}

/**
 * Generate predictions for all active intents
 */
async function generatePredictions(options = {}) {
  const {
    intentId = null,
    minConfidence = 0.5,
    includeReflection = false
  } = options;

  const intents = await storage.listAll('intents');
  const historicalStats = await analyzeHistoricalPatterns();

  // Filter intents
  let targetIntents = intents;
  if (intentId) {
    targetIntents = intents.filter(i => i.id === intentId);
  }

  // Filter out reflection stage unless explicitly included
  if (!includeReflection) {
    targetIntents = targetIntents.filter(i => i.stage?.toLowerCase() !== 'reflection');
  }

  const predictions = [];

  for (const intent of targetIntents) {
    const currentStage = intent.stage?.toLowerCase() || 'exploration';
    const nextStage = getNextStage(currentStage);
    if (!nextStage) continue; // No next stage available

    const analysis = await calculateTransitionConfidence(intent, historicalStats);

    // Only include predictions above confidence threshold
    if (analysis.confidence >= minConfidence) {
      const reasoning = generateReasoning(intent, analysis, nextStage);

      predictions.push({
        id: `pred_${intent.id}_${Date.now()}`,
        intent_id: intent.id,
        intent_title: intent.title,
        current_stage: currentStage,
        predicted_stage: nextStage,
        confidence: analysis.confidence,
        reasoning,
        signals: analysis.signals,
        metrics: analysis.metrics,
        timestamp: new Date().toISOString(),
        status: 'pending' // pending, accepted, rejected
      });
    }
  }

  // Sort by confidence (highest first)
  predictions.sort((a, b) => b.confidence - a.confidence);

  return predictions;
}

/**
 * Record user feedback on a prediction
 */
async function recordFeedback(predictionId, feedback) {
  const { accepted, intentId, predictedStage } = feedback;

  // Load existing feedback history
  const meta = await storage.getMeta();
  if (!meta.predictor) {
    meta.predictor = {
      feedback: [],
      accuracy: {
        total: 0,
        accepted: 0,
        rejected: 0,
        rate: 0
      }
    };
  }

  // Record feedback
  meta.predictor.feedback.push({
    prediction_id: predictionId,
    intent_id: intentId,
    predicted_stage: predictedStage,
    accepted,
    timestamp: new Date().toISOString()
  });

  // Update accuracy stats
  meta.predictor.accuracy.total++;
  if (accepted) {
    meta.predictor.accuracy.accepted++;
  } else {
    meta.predictor.accuracy.rejected++;
  }
  meta.predictor.accuracy.rate = meta.predictor.accuracy.accepted / meta.predictor.accuracy.total;

  // Keep only last 1000 feedback entries
  if (meta.predictor.feedback.length > 1000) {
    meta.predictor.feedback = meta.predictor.feedback.slice(-1000);
  }

  await storage.saveMeta(meta);

  return {
    accuracy: meta.predictor.accuracy,
    feedback_recorded: true
  };
}

/**
 * Get predictor statistics
 */
async function getStatistics() {
  const meta = await storage.getMeta();
  const historicalStats = await analyzeHistoricalPatterns();

  return {
    historical_patterns: historicalStats,
    predictor_accuracy: meta.predictor?.accuracy || {
      total: 0,
      accepted: 0,
      rejected: 0,
      rate: 0
    },
    recent_feedback: (meta.predictor?.feedback || []).slice(-10)
  };
}

export {
  generatePredictions,
  recordFeedback,
  getStatistics,
  analyzeHistoricalPatterns,
  calculateTransitionConfidence,
  getNextStage
};
