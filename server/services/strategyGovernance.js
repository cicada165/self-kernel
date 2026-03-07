/**
 * Strategy Governance Service
 *
 * Allows users (especially non-technical ones) to define rules for when
 * the system can act autonomously vs when it should ask for permission.
 *
 * Think of this as "permission policies" but expressed in plain language:
 * - IF intent priority is "critical" THEN always ask before acting
 * - IF confidence > 90% AND action type is "research" THEN auto-execute
 * - IF involves person tagged "investor" THEN require manual approval
 */

import * as storage from '../storage.js';

const DEFAULT_STRATEGIES = [
  {
    id: 'default-critical-intents',
    name: 'Always Ask: Critical Intents',
    description: 'Never auto-execute actions related to critical priority intents without user approval',
    enabled: true,
    conditions: [
      { type: 'intent-priority', operator: 'equals', value: 'critical' }
    ],
    action: 'require-approval',
    createdAt: new Date().toISOString(),
    isDefault: true
  },
  {
    id: 'default-high-confidence',
    name: 'Auto-Execute: High Confidence Research',
    description: 'Automatically execute research and data gathering tasks with >85% confidence',
    enabled: true,
    conditions: [
      { type: 'confidence', operator: 'greater-than', value: 0.85 },
      { type: 'action-type', operator: 'in', value: ['research', 'data-gathering'] }
    ],
    action: 'auto-execute',
    createdAt: new Date().toISOString(),
    isDefault: true
  },
  {
    id: 'default-investor-relations',
    name: 'Always Ask: Investor Communications',
    description: 'Require approval for any action involving persons tagged as "investor"',
    enabled: true,
    conditions: [
      { type: 'person-tag', operator: 'includes', value: 'investor' }
    ],
    action: 'require-approval',
    createdAt: new Date().toISOString(),
    isDefault: true
  },
  {
    id: 'default-low-risk',
    name: 'Auto-Execute: Low-Risk Internal Tasks',
    description: 'Automatically perform internal organization tasks (tagging, summarization, linking)',
    enabled: true,
    conditions: [
      { type: 'action-type', operator: 'in', value: ['organize', 'summarize', 'tag', 'link'] },
      { type: 'risk-level', operator: 'equals', value: 'low' }
    ],
    action: 'auto-execute',
    createdAt: new Date().toISOString(),
    isDefault: true
  }
];

/**
 * Initialize strategy governance with defaults
 */
export async function initStrategies() {
  const existing = await storage.listAll('strategies');
  if (existing.length === 0) {
    for (const strategy of DEFAULT_STRATEGIES) {
      await storage.create('strategies', strategy);
    }
    console.log('  ✅ Initialized default governance strategies');
  }
}

/**
 * Evaluate whether a proposed action should be auto-executed or require approval
 * @param {Object} action - The proposed action
 * @returns {Object} { allowed: boolean, matchedStrategy: Strategy, reason: string }
 */
export async function evaluateAction(action) {
  const strategies = await storage.listAll('strategies');
  const enabledStrategies = strategies.filter(s => s.enabled);

  // Sort by specificity (more conditions = more specific = higher priority)
  enabledStrategies.sort((a, b) => b.conditions.length - a.conditions.length);

  for (const strategy of enabledStrategies) {
    if (matchesAllConditions(action, strategy.conditions)) {
      return {
        allowed: strategy.action === 'auto-execute',
        requiresApproval: strategy.action === 'require-approval',
        matchedStrategy: strategy,
        reason: strategy.description
      };
    }
  }

  // Default: require approval if no strategy matched
  return {
    allowed: false,
    requiresApproval: true,
    matchedStrategy: null,
    reason: 'No matching strategy found. Default to requiring approval for safety.'
  };
}

/**
 * Check if action matches all conditions in a strategy
 */
function matchesAllConditions(action, conditions) {
  return conditions.every(condition => evaluateCondition(action, condition));
}

/**
 * Evaluate a single condition
 */
function evaluateCondition(action, condition) {
  const { type, operator, value } = condition;

  switch (type) {
    case 'intent-priority':
      return compareValue(action.intentPriority, operator, value);

    case 'confidence':
      return compareValue(action.confidence, operator, value);

    case 'action-type':
      return compareValue(action.type, operator, value);

    case 'person-tag':
      if (!action.involvedPersons) return false;
      return action.involvedPersons.some(person =>
        person.tags && compareValue(person.tags, operator, value)
      );

    case 'risk-level':
      return compareValue(action.riskLevel || 'medium', operator, value);

    case 'intent-stage':
      return compareValue(action.intentStage, operator, value);

    case 'time-of-day':
      const hour = new Date().getHours();
      return compareValue(hour, operator, value);

    default:
      return false;
  }
}

/**
 * Compare values based on operator
 */
function compareValue(actual, operator, expected) {
  switch (operator) {
    case 'equals':
      return actual === expected;

    case 'not-equals':
      return actual !== expected;

    case 'greater-than':
      return actual > expected;

    case 'less-than':
      return actual < expected;

    case 'in':
      if (Array.isArray(expected)) {
        return expected.includes(actual);
      }
      return false;

    case 'includes':
      if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      return false;

    case 'contains':
      if (typeof actual === 'string' && typeof expected === 'string') {
        return actual.toLowerCase().includes(expected.toLowerCase());
      }
      return false;

    default:
      return false;
  }
}

/**
 * Get all strategies
 */
export async function listStrategies() {
  return storage.listAll('strategies');
}

/**
 * Create a new strategy
 */
export async function createStrategy(strategyData) {
  return storage.create('strategies', {
    ...strategyData,
    enabled: strategyData.enabled !== false,
    createdAt: new Date().toISOString(),
    isDefault: false
  });
}

/**
 * Update a strategy
 */
export async function updateStrategy(id, updates) {
  return storage.update('strategies', id, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Delete a strategy (only non-default ones)
 */
export async function deleteStrategy(id) {
  const strategy = await storage.getById('strategies', id);
  if (strategy?.isDefault) {
    throw new Error('Cannot delete default strategies. You can disable them instead.');
  }
  return storage.deleteById('strategies', id);
}

/**
 * Get user-friendly explanation of what a strategy does
 */
export function explainStrategy(strategy) {
  const conditionExplanations = strategy.conditions.map(c => {
    const { type, operator, value } = c;

    const typeNames = {
      'intent-priority': 'Intent Priority',
      'confidence': 'Confidence Score',
      'action-type': 'Action Type',
      'person-tag': 'Person Tag',
      'risk-level': 'Risk Level',
      'intent-stage': 'Intent Stage',
      'time-of-day': 'Time of Day'
    };

    const operatorNames = {
      'equals': 'is',
      'not-equals': 'is not',
      'greater-than': 'is greater than',
      'less-than': 'is less than',
      'in': 'is one of',
      'includes': 'includes',
      'contains': 'contains'
    };

    const typeName = typeNames[type] || type;
    const operatorName = operatorNames[operator] || operator;
    const valueDisplay = Array.isArray(value) ? value.join(', ') : value;

    return `${typeName} ${operatorName} ${valueDisplay}`;
  });

  const actionText = strategy.action === 'auto-execute'
    ? 'automatically execute the action'
    : 'ask for your approval first';

  return {
    when: conditionExplanations.join(' AND '),
    then: actionText,
    summary: `When ${conditionExplanations.join(' and ')}, ${actionText}.`
  };
}
