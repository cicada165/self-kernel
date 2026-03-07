/**
 * Intent Proxy Service
 *
 * Analyzes user's intents, patterns, and context to proactively suggest:
 * - Next actions based on intent stage
 * - People to connect with
 * - Resources to gather
 * - Automation opportunities (for OpenClaw)
 *
 * This is the "digital copy" layer that learns what the user would do next.
 *
 * Four Core Pattern Analyzers:
 * 1. RAT (Retrieval-Augmented Trajectory) - Suggests based on past successful patterns
 * 2. Person Influence - Suggests follow-ups based on who influences which intents
 * 3. Stage Transitions - Recommends moving intents to next FSM stage
 * 4. Cognitive Health - Alerts when clarity/energy levels are low
 */

import * as storage from '../storage.js';
import * as rat from './rat.js';

/**
 * Generate proactive action suggestions for the user
 * @returns {Array} List of suggested actions with confidence scores
 */
export async function generateSuggestions() {
  const [intents, persons, relations, chains, meta, trajectories, cognitiveStages] = await Promise.all([
    storage.listAll('intents'),
    storage.listAll('persons'),
    storage.listAll('relations'),
    storage.listAll('thinking-chains'),
    storage.getMeta(),
    storage.listAll('trajectories'),
    storage.listAll('cognitive-stages')
  ]);

  const activeIntents = intents.filter(i => i.active);
  const suggestions = [];

  // ===== PATTERN 1: RAT (Retrieval-Augmented Trajectory) =====
  // Analyze trajectory history to suggest next steps based on past patterns
  const ratSuggestions = await analyzeRATPatterns(activeIntents, trajectories);
  suggestions.push(...ratSuggestions);

  // ===== PATTERN 2: Person Influence =====
  // Suggest follow-ups based on which people influence which intents
  const personSuggestions = analyzePersonInfluence(activeIntents, persons, relations);
  suggestions.push(...personSuggestions);

  // ===== PATTERN 3: Stage Transitions =====
  // Recommend moving intents to next FSM stage based on time elapsed
  const stageSuggestions = analyzeStageTransitions(activeIntents);
  suggestions.push(...stageSuggestions);

  // ===== PATTERN 4: Cognitive Health =====
  // Alert when clarity/energy levels are low, suggest consolidation
  const healthSuggestions = analyzeCognitiveHealth(cognitiveStages, activeIntents);
  suggestions.push(...healthSuggestions);

  // Legacy patterns (kept for compatibility but will be phased out in favor of the 4-pattern system)
  // Pattern 1: Intents stuck in EXPLORATION → suggest structuring actions
  for (const intent of activeIntents) {
    if (intent.stage === 'EXPLORATION') {
      const daysInStage = getDaysSinceLastStageChange(intent);
      if (daysInStage > 3) {
        suggestions.push({
          type: 'intent-progression',
          intentId: intent.id,
          intentTitle: intent.title,
          action: 'Structure this intent',
          description: `"${intent.title}" has been in exploration for ${daysInStage} days. Consider breaking it into concrete next steps.`,
          confidence: 0.75,
          automationPotential: 'low',
          suggestedSteps: [
            'Define 3-5 key questions to answer',
            'Identify people who can provide insights',
            'Set a decision deadline'
          ],
          priority: 'medium'
        });
      }
    }

    // Pattern 2: Intents in DECISION → suggest execution preparation
    if (intent.stage === 'DECISION') {
      const hasExecutionPlan = await checkForExecutionPlan(intent.id);
      if (!hasExecutionPlan) {
        suggestions.push({
          type: 'intent-progression',
          intentId: intent.id,
          intentTitle: intent.title,
          action: 'Prepare for execution',
          description: `You've made a decision on "${intent.title}". Ready to create an execution plan?`,
          confidence: 0.85,
          automationPotential: 'high',
          suggestedSteps: [
            'Break down into actionable tasks',
            'Identify required resources',
            'Set up tracking/monitoring',
            'Create OpenClaw automation recipe'
          ],
          priority: 'high'
        });
      }
    }

    // Pattern 3: High-priority intents without recent person connections
    if (intent.priority === 'critical' || intent.priority === 'high') {
      const recentPersonConnections = getRecentPersonConnections(intent, relations, persons);
      if (recentPersonConnections.length === 0) {
        const relevantPersons = findRelevantPersons(intent, persons, relations);
        if (relevantPersons.length > 0) {
          suggestions.push({
            type: 'relationship-building',
            intentId: intent.id,
            intentTitle: intent.title,
            action: `Connect with ${relevantPersons[0].name}`,
            description: `Consider reaching out to ${relevantPersons[0].name} (${relevantPersons[0].role}) about "${intent.title}".`,
            confidence: 0.7,
            automationPotential: 'medium',
            suggestedSteps: [
              `Draft message to ${relevantPersons[0].name}`,
              'Schedule a call or meeting',
              'Prepare discussion points'
            ],
            relatedPersons: relevantPersons.slice(0, 3),
            priority: 'medium'
          });
        }
      }
    }

    // Pattern 4: Intents with parent/child relationships → suggest alignment
    if (intent.parentId) {
      const parent = intents.find(i => i.id === intent.parentId);
      if (parent && isStageAheadOfParent(intent, parent)) {
        suggestions.push({
          type: 'intent-alignment',
          intentId: intent.id,
          intentTitle: intent.title,
          action: 'Review parent intent alignment',
          description: `"${intent.title}" is progressing faster than its parent "${parent.title}". Consider aligning timelines.`,
          confidence: 0.65,
          automationPotential: 'low',
          priority: 'low'
        });
      }
    }
  }

  // Pattern 5: Suggest trajectory creation if user has multiple active intents but no trajectory
  const trajectories = await storage.listAll('trajectories');
  if (activeIntents.length >= 3 && trajectories.length === 0) {
    suggestions.push({
      type: 'system-setup',
      action: 'Create a journey map',
      description: `You have ${activeIntents.length} active intents. Creating a trajectory will help you visualize the big picture.`,
      confidence: 0.8,
      automationPotential: 'low',
      suggestedSteps: [
        'Group related intents into a theme',
        'Define key milestones',
        'Set target dates'
      ],
      priority: 'medium'
    });
  }

  // Pattern 6: Learning feedback - suggest parameter adjustments
  if (meta.learningHistory && meta.learningHistory.length > 10) {
    const recentRewards = meta.learningHistory.slice(-10);
    const avgReward = recentRewards.reduce((sum, r) => sum + r.reward, 0) / recentRewards.length;

    if (avgReward < 0) {
      suggestions.push({
        type: 'system-tuning',
        action: 'Adjust automation threshold',
        description: 'Recent automated suggestions have been rejected frequently. Consider raising the confidence threshold.',
        confidence: 0.6,
        automationPotential: 'none',
        priority: 'low'
      });
    }
  }

  // Sort by confidence and priority
  suggestions.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    return (b.confidence * priorityWeight[b.priority]) - (a.confidence * priorityWeight[a.priority]);
  });

  return suggestions;
}

/**
 * Analyze a specific intent and suggest OpenClaw automations
 */
export async function suggestAutomations(intentId) {
  const intent = await storage.getById('intents', intentId);
  if (!intent) return [];

  const automations = [];

  // Based on intent stage and tags, suggest relevant automations
  if (intent.tags?.includes('research') || intent.stage === 'EXPLORATION') {
    automations.push({
      name: 'Research Aggregator',
      description: 'Automatically gather and summarize relevant articles, papers, and discussions',
      trigger: 'Daily at 9am',
      actions: [
        'Search for keywords from intent tags',
        'Collect top 5 results',
        'Generate summary',
        'Add to thinking chain'
      ],
      confidence: 0.75
    });
  }

  if (intent.tags?.includes('meeting') || intent.linkedPersons?.length > 2) {
    automations.push({
      name: 'Meeting Prep Assistant',
      description: 'Prepare context for upcoming meetings based on intent history and person relationships',
      trigger: '30 minutes before calendar event',
      actions: [
        'Pull recent interactions with attendees',
        'Summarize relevant thinking chains',
        'Generate discussion points',
        'Create meeting brief'
      ],
      confidence: 0.8
    });
  }

  if (intent.stage === 'DECISION') {
    automations.push({
      name: 'Decision Execution Planner',
      description: 'Convert decisions into actionable task lists',
      trigger: 'When intent moves to DECISION stage',
      actions: [
        'Break down decision into tasks',
        'Assign priorities',
        'Suggest timelines',
        'Create tracking dashboard'
      ],
      confidence: 0.85
    });
  }

  return automations;
}

// Helper functions

function getDaysSinceLastStageChange(intent) {
  if (!intent.stageHistory || intent.stageHistory.length === 0) return 0;
  const lastChange = intent.stageHistory[intent.stageHistory.length - 1];
  const now = new Date();
  const then = new Date(lastChange.timestamp);
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

async function checkForExecutionPlan(intentId) {
  // Check if there are execution-related thinking chains or child intents
  const intents = await storage.listAll('intents');
  const childIntents = intents.filter(i => i.parentId === intentId);
  return childIntents.length > 0;
}

function getRecentPersonConnections(intent, relations, persons) {
  const recentThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
  return relations
    .filter(r =>
      r.targetType === 'intent' &&
      r.targetId === intent.id &&
      r.sourceType === 'person' &&
      new Date(r.createdAt) > recentThreshold
    )
    .map(r => persons.find(p => p.id === r.sourceId))
    .filter(Boolean);
}

function findRelevantPersons(intent, persons, relations) {
  // Find persons already connected to this intent or similar intents
  const connectedPersonIds = new Set(
    relations
      .filter(r => r.targetType === 'intent' && r.targetId === intent.id && r.sourceType === 'person')
      .map(r => r.sourceId)
  );

  // Filter persons by role or tags that match intent context
  return persons
    .filter(p =>
      p.type !== 'self' &&
      p.type !== 'digital-twin' &&
      !connectedPersonIds.has(p.id)
    )
    .map(p => {
      let relevanceScore = 0;

      // Match role keywords with intent tags
      if (intent.tags && p.role) {
        const roleLower = p.role.toLowerCase();
        intent.tags.forEach(tag => {
          if (roleLower.includes(tag.toLowerCase())) relevanceScore += 0.3;
        });
      }

      // Match person tags with intent tags
      if (intent.tags && p.tags) {
        const commonTags = intent.tags.filter(t => p.tags.includes(t));
        relevanceScore += commonTags.length * 0.2;
      }

      return { ...p, relevanceScore };
    })
    .filter(p => p.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function isStageAheadOfParent(intent, parent) {
  const stageOrder = ['EXPLORATION', 'REFINING', 'DECISION', 'EXECUTION', 'REFLECTION'];
  const intentStageIdx = stageOrder.indexOf(intent.stage);
  const parentStageIdx = stageOrder.indexOf(parent.stage);
  return intentStageIdx > parentStageIdx + 1;
}

/**
 * Record user feedback on a suggestion (for learning)
 */
export async function recordSuggestionFeedback(suggestionId, accepted) {
  const meta = await storage.getMeta();

  if (!meta.suggestionFeedback) meta.suggestionFeedback = [];

  meta.suggestionFeedback.push({
    id: suggestionId,
    accepted,
    timestamp: new Date().toISOString()
  });

  // Keep only last 100 feedback entries
  if (meta.suggestionFeedback.length > 100) {
    meta.suggestionFeedback = meta.suggestionFeedback.slice(-100);
  }

  await storage.saveMeta(meta);
}

// ===== FOUR CORE PATTERN ANALYZERS =====

/**
 * PATTERN 1: RAT (Retrieval-Augmented Trajectory)
 * Analyze trajectory history to suggest next steps based on past successful patterns
 */
async function analyzeRATPatterns(activeIntents, trajectories) {
  const suggestions = [];

  try {
    // Query RAT for patterns
    const ratPatterns = await rat.queryPatterns([], '');

    if (ratPatterns.length > 0) {
      // For each high-relevance pattern, suggest reusing it
      for (const pattern of ratPatterns.slice(0, 3)) { // Top 3 patterns
        const relatedIntent = activeIntents.find(i => i.id === pattern.intent_id);

        if (relatedIntent) {
          suggestions.push({
            id: `rat-${pattern.id}`,
            type: 'trajectory-pattern',
            suggestion: `Based on past patterns: ${pattern.directive}`,
            reasoning: `You successfully completed a similar task ${Math.floor((Date.now() - new Date(pattern.timestamp).getTime()) / (1000 * 60 * 60 * 24))} days ago. This pattern has been reused ${pattern.reuse_count || 0} times.`,
            confidence: pattern.confidence * 0.9, // Slightly lower since it's a suggestion
            priority: pattern.confidence > 0.8 ? 'high' : 'medium',
            action: {
              type: 'replicate-pattern',
              patternId: pattern.id,
              intentId: relatedIntent.id,
              steps: pattern.context?.predicted_tools || []
            },
            relatedIntent: relatedIntent.title
          });
        }
      }
    }

    // Check trajectories for patterns
    for (const trajectory of trajectories) {
      const completedMilestones = trajectory.milestones.filter(m => m.completed).length;
      const totalMilestones = trajectory.milestones.length;
      const nextMilestone = trajectory.milestones.find(m => !m.completed);

      if (nextMilestone && completedMilestones > 0) {
        const successRate = completedMilestones / totalMilestones;
        suggestions.push({
          id: `traj-${trajectory.id}`,
          type: 'trajectory-pattern',
          suggestion: `Continue trajectory: "${trajectory.label}"`,
          reasoning: `You've completed ${completedMilestones} of ${totalMilestones} milestones (${Math.round(successRate * 100)}% progress). Next: ${nextMilestone.label}`,
          confidence: successRate > 0.5 ? 0.85 : 0.7,
          priority: 'high',
          action: {
            type: 'advance-trajectory',
            trajectoryId: trajectory.id,
            nextMilestone: nextMilestone.label
          }
        });
      }
    }
  } catch (err) {
    console.error('[Intent Proxy] RAT analysis error:', err);
  }

  return suggestions;
}

/**
 * PATTERN 2: Person Influence
 * Suggest follow-ups based on which people influence which intents
 */
function analyzePersonInfluence(activeIntents, persons, relations) {
  const suggestions = [];

  for (const intent of activeIntents) {
    // Find persons connected to this intent
    const connectedPersonIds = relations
      .filter(r => r.targetType === 'intent' && r.targetId === intent.id && r.sourceType === 'person')
      .map(r => r.sourceId);

    const connectedPersons = persons.filter(p => connectedPersonIds.includes(p.id));

    // Check if we haven't interacted with key persons recently
    const recentThreshold = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
    const recentConnections = relations.filter(r =>
      r.targetType === 'intent' &&
      r.targetId === intent.id &&
      r.sourceType === 'person' &&
      new Date(r.createdAt) > recentThreshold
    );

    if (connectedPersons.length > 0 && recentConnections.length === 0) {
      const keyPerson = connectedPersons[0];
      suggestions.push({
        id: `person-${intent.id}-${keyPerson.id}`,
        type: 'person-influence',
        suggestion: `Follow up with ${keyPerson.name} about "${intent.title}"`,
        reasoning: `${keyPerson.name} (${keyPerson.role}) is connected to this intent but you haven't interacted in over 7 days. They might have valuable input.`,
        confidence: 0.75,
        priority: intent.priority === 'critical' ? 'high' : 'medium',
        action: {
          type: 'schedule-followup',
          personId: keyPerson.id,
          intentId: intent.id
        },
        relatedPerson: keyPerson.name
      });
    }

    // Suggest connecting with relevant persons who aren't yet linked
    if (connectedPersons.length === 0 && intent.priority !== 'low') {
      const relevantPersons = findRelevantPersons(intent, persons, relations);
      if (relevantPersons.length > 0) {
        const topPerson = relevantPersons[0];
        suggestions.push({
          id: `person-new-${intent.id}-${topPerson.id}`,
          type: 'person-influence',
          suggestion: `Consider involving ${topPerson.name} in "${intent.title}"`,
          reasoning: `${topPerson.name}'s role (${topPerson.role}) aligns with this intent's goals. They could provide valuable perspective.`,
          confidence: 0.65,
          priority: 'medium',
          action: {
            type: 'connect-person',
            personId: topPerson.id,
            intentId: intent.id
          },
          relatedPerson: topPerson.name
        });
      }
    }
  }

  return suggestions;
}

/**
 * PATTERN 3: Stage Transitions
 * Recommend moving intents to next FSM stage based on time elapsed
 */
function analyzeStageTransitions(activeIntents) {
  const suggestions = [];

  const stageOrder = ['EXPLORATION', 'REFINING', 'DECISION', 'EXECUTION', 'REFLECTION'];

  for (const intent of activeIntents) {
    const daysInStage = getDaysSinceLastStageChange(intent);
    const currentStageIdx = stageOrder.indexOf(intent.stage);

    if (currentStageIdx === -1) continue;

    const nextStage = stageOrder[currentStageIdx + 1];

    // EXPLORATION → REFINING (after 3+ days)
    if (intent.stage === 'EXPLORATION' && daysInStage > 3 && nextStage) {
      suggestions.push({
        id: `stage-${intent.id}`,
        type: 'stage-transition',
        suggestion: `Move "${intent.title}" from Exploration to Refining`,
        reasoning: `This intent has been in exploration for ${daysInStage} days. Time to refine your thinking and move toward a decision.`,
        confidence: daysInStage > 7 ? 0.85 : 0.7,
        priority: daysInStage > 7 ? 'high' : 'medium',
        action: {
          type: 'update-intent',
          intentId: intent.id,
          stage: nextStage
        }
      });
    }

    // REFINING → DECISION (after 5+ days)
    if (intent.stage === 'REFINING' && daysInStage > 5 && nextStage) {
      suggestions.push({
        id: `stage-${intent.id}`,
        type: 'stage-transition',
        suggestion: `Move "${intent.title}" from Refining to Decision`,
        reasoning: `You've been refining this intent for ${daysInStage} days. Consider making a decision and moving to execution.`,
        confidence: 0.8,
        priority: 'high',
        action: {
          type: 'update-intent',
          intentId: intent.id,
          stage: nextStage
        }
      });
    }

    // DECISION → EXECUTION (after 2+ days)
    if (intent.stage === 'DECISION' && daysInStage > 2 && nextStage) {
      suggestions.push({
        id: `stage-${intent.id}`,
        type: 'stage-transition',
        suggestion: `Start executing on "${intent.title}"`,
        reasoning: `A decision has been made ${daysInStage} days ago. Time to move from planning to action.`,
        confidence: 0.9,
        priority: 'high',
        action: {
          type: 'update-intent',
          intentId: intent.id,
          stage: nextStage
        }
      });
    }
  }

  return suggestions;
}

/**
 * PATTERN 4: Cognitive Health
 * Alert when clarity/energy levels are low, suggest consolidation
 */
function analyzeCognitiveHealth(cognitiveStages, activeIntents) {
  const suggestions = [];

  if (cognitiveStages.length === 0) return suggestions;

  // Get most recent cognitive stage
  const recentStages = cognitiveStages.sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  );
  const latestStage = recentStages[0];

  // Alert if clarity or energy is low
  const lowClarityThreshold = 0.4;
  const lowEnergyThreshold = 0.4;

  if (latestStage.clarity < lowClarityThreshold) {
    suggestions.push({
      id: `health-clarity-${latestStage.id}`,
      type: 'cognitive-health',
      suggestion: 'Your cognitive clarity is low — consider consolidating your intents',
      reasoning: `Recent cognitive analysis shows clarity at ${Math.round(latestStage.clarity * 100)}%. You might be juggling too many thoughts. Consider:
      - Pausing low-priority intents
      - Consolidating related intents
      - Taking time to reflect and reorganize`,
      confidence: 0.85,
      priority: 'high',
      action: {
        type: 'consolidate-intents',
        suggestion: 'review-and-pause'
      }
    });
  }

  if (latestStage.energy < lowEnergyThreshold) {
    suggestions.push({
      id: `health-energy-${latestStage.id}`,
      type: 'cognitive-health',
      suggestion: 'Your cognitive energy is low — take a break or reduce active intents',
      reasoning: `Recent cognitive analysis shows energy at ${Math.round(latestStage.energy * 100)}%. Consider reducing cognitive load:
      - Defer non-critical intents
      - Focus on 1-2 high-priority goals
      - Schedule rest and recovery time`,
      confidence: 0.8,
      priority: 'high',
      action: {
        type: 'reduce-cognitive-load',
        suggestion: 'pause-low-priority'
      }
    });
  }

  // Suggest reflection if too many active intents
  if (activeIntents.length > 10) {
    suggestions.push({
      id: 'health-overload',
      type: 'cognitive-health',
      suggestion: `You have ${activeIntents.length} active intents — consider pausing some`,
      reasoning: `Managing ${activeIntents.length} simultaneous goals can lead to cognitive overload. Research suggests optimal focus on 3-5 major goals at once.`,
      confidence: 0.75,
      priority: 'medium',
      action: {
        type: 'intent-review',
        suggestion: 'pause-some-intents'
      }
    });
  }

  return suggestions;
}
