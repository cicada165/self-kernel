/**
 * Self Kernel — Intent Proxy Engine
 *
 * Proactively analyzes patterns and suggests next actions based on:
 * - Historical trajectory data (what worked before)
 * - Current cognitive stage
 * - Person relationships and influences
 * - Time-based patterns
 *
 * This is the "digital copy" intelligence that learns from the user's patterns.
 */

import * as storage from './storage.js';

/**
 * Generate proactive suggestions for the user based on current context
 */
export async function generateSuggestions() {
  try {
    const [intents, trajectories, cognitiveStages, persons, relations] = await Promise.all([
      storage.listAll('intents'),
      storage.listAll('trajectories'),
      storage.listAll('cognitive-stages'),
      storage.listAll('persons'),
      storage.listAll('relations')
    ]);

    const activeIntents = intents.filter(i => i.active);
    const suggestions = [];

    // Pattern 1: Trajectory-based suggestions (RAT - Retrieval Augmented Trajectory)
    for (const intent of activeIntents) {
      const trajectoryMatch = findTrajectoryPattern(intent, trajectories);
      if (trajectoryMatch) {
        suggestions.push({
          type: 'trajectory-pattern',
          priority: 'high',
          intent: intent,
          suggestion: `Based on past patterns, after "${intent.title}", you typically move to: ${trajectoryMatch.nextStep}`,
          action: {
            type: 'create-intent',
            title: trajectoryMatch.nextStep,
            linkedTo: intent.id
          },
          confidence: trajectoryMatch.confidence,
          reasoning: `This pattern appeared ${trajectoryMatch.occurrences} time(s) in your trajectory history.`
        });
      }
    }

    // Pattern 2: Person-influence suggestions
    const recentPersonInteractions = getRecentPersonInteractions(relations, persons);
    for (const interaction of recentPersonInteractions.slice(0, 3)) {
      if (interaction.person && interaction.suggestedIntent) {
        suggestions.push({
          type: 'person-influence',
          priority: 'medium',
          person: interaction.person,
          suggestion: `Consider following up on your conversation with ${interaction.person.name} about "${interaction.suggestedIntent}"`,
          action: {
            type: 'create-intent',
            title: interaction.suggestedIntent,
            linkedPersons: [interaction.person.id]
          },
          confidence: 0.7,
          reasoning: `${interaction.person.name} has influenced ${interaction.influenceCount} of your active intents.`
        });
      }
    }

    // Pattern 3: Stage transition suggestions
    const stageTransitions = analyzeStageTransitions(intents);
    for (const intent of activeIntents) {
      if (shouldTransitionStage(intent, stageTransitions)) {
        const nextStage = getNextStage(intent.stage);
        suggestions.push({
          type: 'stage-transition',
          priority: 'medium',
          intent: intent,
          suggestion: `"${intent.title}" has been in ${intent.stage} stage. Consider moving to ${nextStage}.`,
          action: {
            type: 'update-intent',
            intentId: intent.id,
            stage: nextStage
          },
          confidence: 0.6,
          reasoning: `Similar intents typically spend ${stageTransitions[intent.stage]?.avgDuration || '1-2 weeks'} in ${intent.stage}.`
        });
      }
    }

    // Pattern 4: Cognitive state suggestions
    const latestCognitiveStage = cognitiveStages[cognitiveStages.length - 1];
    if (latestCognitiveStage && latestCognitiveStage.clarityLevel < 0.4) {
      suggestions.push({
        type: 'cognitive-health',
        priority: 'high',
        suggestion: `Your clarity level is low (${Math.round(latestCognitiveStage.clarityLevel * 100)}%). Consider: consolidating intents, or taking a reflection break.`,
        action: {
          type: 'recommend-action',
          actions: ['consolidate-intents', 'schedule-reflection-time']
        },
        confidence: 0.8,
        reasoning: `Low clarity often correlates with too many concurrent explorations.`
      });
    }

    // Sort by priority and confidence
    suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] - priorityOrder[a.priority]) || (b.confidence - a.confidence);
    });

    return suggestions;
  } catch (err) {
    console.error('[Intent Proxy] Error generating suggestions:', err);
    return [];
  }
}

/**
 * Find patterns in trajectories that match current intent
 */
function findTrajectoryPattern(intent, trajectories) {
  const matches = [];

  for (const trajectory of trajectories) {
    const milestones = trajectory.milestones || [];
    for (let i = 0; i < milestones.length - 1; i++) {
      const current = milestones[i];
      const next = milestones[i + 1];

      // Check if current intent matches this milestone (by title similarity or intentId)
      if (current.intentId === intent.id || titleSimilarity(current.label, intent.title) > 0.7) {
        matches.push({
          nextStep: next.label,
          trajectory: trajectory.title,
          confidence: current.status === 'completed' ? 0.9 : 0.6
        });
      }
    }
  }

  if (matches.length === 0) return null;

  // Return the most common next step
  const stepCounts = {};
  matches.forEach(m => {
    stepCounts[m.nextStep] = (stepCounts[m.nextStep] || 0) + 1;
  });

  const mostCommon = Object.entries(stepCounts).sort((a, b) => b[1] - a[1])[0];
  return {
    nextStep: mostCommon[0],
    occurrences: mostCommon[1],
    confidence: Math.min(0.95, mostCommon[1] / matches.length)
  };
}

/**
 * Get recent person interactions that might suggest follow-up intents
 */
function getRecentPersonInteractions(relations, persons) {
  const personInfluence = new Map();

  relations.forEach(rel => {
    if (rel.sourceType === 'person' && rel.targetType === 'intent') {
      const person = persons.find(p => p.id === rel.sourceId);
      if (!person) return;

      if (!personInfluence.has(person.id)) {
        personInfluence.set(person.id, {
          person,
          influenceCount: 0,
          recentIntents: []
        });
      }

      const influence = personInfluence.get(person.id);
      influence.influenceCount++;
      influence.recentIntents.push(rel);
    }
  });

  // Convert to array and suggest follow-ups
  return Array.from(personInfluence.values()).map(inf => {
    // Simple heuristic: if person influenced multiple intents, suggest follow-up meeting
    if (inf.influenceCount >= 2) {
      return {
        ...inf,
        suggestedIntent: `Follow up with ${inf.person.name}`
      };
    }
    return inf;
  });
}

/**
 * Analyze stage transition patterns
 */
function analyzeStageTransitions(intents) {
  const transitions = {
    exploration: { avgDuration: '1-2 weeks', nextStage: 'structuring' },
    structuring: { avgDuration: '1 week', nextStage: 'decision' },
    decision: { avgDuration: '3-5 days', nextStage: 'execution' },
    execution: { avgDuration: 'ongoing', nextStage: 'reflection' },
    reflection: { avgDuration: '1 week', nextStage: 'exploration' }
  };

  // Could be enhanced with actual timing analysis from stageHistory
  return transitions;
}

/**
 * Determine if an intent should transition to next stage
 */
function shouldTransitionStage(intent, stageTransitions) {
  const stageHistory = intent.stageHistory || [];
  if (stageHistory.length === 0) return false;

  const currentStageEntry = stageHistory[stageHistory.length - 1];
  const daysSinceTransition = (Date.now() - new Date(currentStageEntry.timestamp)) / (1000 * 60 * 60 * 24);

  // Simple heuristic: suggest transition after 7 days
  return daysSinceTransition > 7;
}

/**
 * Get next stage in FSM
 */
function getNextStage(currentStage) {
  const progression = {
    exploration: 'structuring',
    structuring: 'decision',
    decision: 'execution',
    execution: 'reflection',
    reflection: 'exploration'
  };
  return progression[currentStage?.toLowerCase()] || 'structuring';
}

/**
 * Calculate title similarity (simple Jaccard similarity on words)
 */
function titleSimilarity(title1, title2) {
  if (!title1 || !title2) return 0;

  const words1 = new Set(title1.toLowerCase().split(/\s+/));
  const words2 = new Set(title2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Evaluate if a suggestion should be auto-executed based on governance rules
 */
export async function checkGovernanceRules(suggestion) {
  const rules = await storage.listAll('governance-rules');

  // If no rules defined, nothing is auto-approved
  if (rules.length === 0) return { autoApprove: false, reason: 'No governance rules defined' };

  for (const rule of rules) {
    if (ruleMatches(rule, suggestion)) {
      return {
        autoApprove: rule.action === 'auto-approve',
        reason: rule.description,
        ruleId: rule.id
      };
    }
  }

  return { autoApprove: false, reason: 'No matching governance rule' };
}

/**
 * Check if a governance rule matches a suggestion
 */
function ruleMatches(rule, suggestion) {
  // Simple pattern matching
  if (rule.suggestionType && rule.suggestionType !== suggestion.type) return false;
  if (rule.minConfidence && suggestion.confidence < rule.minConfidence) return false;
  if (rule.intentStage && suggestion.intent && suggestion.intent.stage !== rule.intentStage) return false;

  return true;
}
