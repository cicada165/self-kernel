/**
 * Governance Rule Execution Engine
 *
 * Automatically executes actions based on user-defined governance rules.
 * This enables autonomous behavior while maintaining user control and transparency.
 *
 * Core Features:
 * - Rule evaluation for incoming suggestions
 * - Auto-approval based on confidence thresholds
 * - Action execution with safety checks
 * - Audit logging for all automated decisions
 */

import * as storage from '../storage.js';

/**
 * Evaluate a suggestion against all enabled governance rules
 * @param {Object} suggestion - The suggestion to evaluate
 * @returns {Object} { shouldAutoExecute: boolean, matchedRules: Array, reason: string }
 */
export async function evaluateSuggestion(suggestion) {
    const rules = await storage.listAll('governance-rules');
    const enabledRules = rules.filter(r => r.enabled);

    const matchedRules = [];

    for (const rule of enabledRules) {
        if (ruleMatches(rule, suggestion)) {
            matchedRules.push(rule);
        }
    }

    // Determine if we should auto-execute
    const autoApproveRules = matchedRules.filter(r => r.action === 'auto-approve');

    if (autoApproveRules.length > 0) {
        return {
            shouldAutoExecute: true,
            matchedRules: autoApproveRules,
            reason: `Matched ${autoApproveRules.length} auto-approve rule(s): ${autoApproveRules.map(r => r.name).join(', ')}`
        };
    }

    // Check for notification rules
    const notifyRules = matchedRules.filter(r => r.action === 'notify');
    if (notifyRules.length > 0) {
        return {
            shouldAutoExecute: false,
            matchedRules: notifyRules,
            reason: `Matched ${notifyRules.length} notify rule(s) - user attention required`
        };
    }

    return {
        shouldAutoExecute: false,
        matchedRules: [],
        reason: 'No matching governance rules'
    };
}

/**
 * Check if a rule matches a suggestion
 * @param {Object} rule - Governance rule
 * @param {Object} suggestion - Suggestion to check
 * @returns {boolean}
 */
function ruleMatches(rule, suggestion) {
    const { conditions } = rule;

    // Check suggestion type
    if (conditions.suggestionType && conditions.suggestionType !== suggestion.type) {
        return false;
    }

    // Check minimum confidence
    if (conditions.minConfidence && suggestion.confidence < conditions.minConfidence) {
        return false;
    }

    // Check maximum confidence (for cautious rules)
    if (conditions.maxConfidence && suggestion.confidence > conditions.maxConfidence) {
        return false;
    }

    // Check specific intent stages
    if (conditions.intentStage && suggestion.metadata?.intentStage !== conditions.intentStage) {
        return false;
    }

    // Check intent priority
    if (conditions.intentPriority && suggestion.metadata?.intentPriority !== conditions.intentPriority) {
        return false;
    }

    // Check tags (any match)
    if (conditions.tags && conditions.tags.length > 0) {
        const suggestionTags = suggestion.tags || [];
        const hasMatchingTag = conditions.tags.some(tag => suggestionTags.includes(tag));
        if (!hasMatchingTag) {
            return false;
        }
    }

    // Check time-based conditions (e.g., only auto-approve during work hours)
    if (conditions.timeWindow) {
        const now = new Date();
        const hour = now.getHours();
        const { startHour, endHour } = conditions.timeWindow;
        if (hour < startHour || hour >= endHour) {
            return false;
        }
    }

    // Check day-based conditions (e.g., only auto-approve on weekdays)
    if (conditions.daysOfWeek) {
        const day = new Date().getDay(); // 0 = Sunday, 6 = Saturday
        if (!conditions.daysOfWeek.includes(day)) {
            return false;
        }
    }

    // Check cognitive health thresholds
    if (conditions.energyThreshold || conditions.clarityThreshold) {
        // This would require fetching latest cognitive state
        // For now, we'll pass if suggestion includes this metadata
        if (suggestion.metadata?.cognitiveState) {
            const { energy, clarity } = suggestion.metadata.cognitiveState;
            if (conditions.energyThreshold && energy < conditions.energyThreshold) {
                return true; // Alert on low energy
            }
            if (conditions.clarityThreshold && clarity < conditions.clarityThreshold) {
                return true; // Alert on low clarity
            }
        }
    }

    return true;
}

/**
 * Execute an approved suggestion based on governance rules
 * @param {Object} suggestion - The suggestion to execute
 * @param {Array} matchedRules - Rules that matched
 * @returns {Object} Execution result
 */
export async function executeAutomatedAction(suggestion, matchedRules) {
    const executionLog = {
        suggestionId: suggestion.id,
        timestamp: new Date().toISOString(),
        matchedRules: matchedRules.map(r => ({ id: r.id, name: r.name })),
        action: suggestion.suggestedAction,
        status: 'pending'
    };

    try {
        // Execute the action based on suggestion type
        let result;

        switch (suggestion.type) {
            case 'trajectory-pattern':
                result = await executeTrajectoryPattern(suggestion);
                break;

            case 'stage-transition':
                result = await executeStageTransition(suggestion);
                break;

            case 'person-influence':
                result = await executePersonInfluence(suggestion);
                break;

            case 'cognitive-health':
                result = await executeCognitiveHealthAction(suggestion);
                break;

            default:
                throw new Error(`Unknown suggestion type: ${suggestion.type}`);
        }

        executionLog.status = 'completed';
        executionLog.result = result;

        // Update suggestion status
        await storage.update('suggestions', suggestion.id, {
            status: 'auto-approved',
            executedAt: new Date().toISOString(),
            executionLog
        });

        // Log to audit trail
        await logGovernanceAction(executionLog);

        return {
            success: true,
            executionLog,
            result
        };

    } catch (error) {
        executionLog.status = 'failed';
        executionLog.error = error.message;

        await storage.update('suggestions', suggestion.id, {
            status: 'failed',
            error: error.message
        });

        await logGovernanceAction(executionLog);

        return {
            success: false,
            executionLog,
            error: error.message
        };
    }
}

/**
 * Execute a trajectory pattern suggestion
 */
async function executeTrajectoryPattern(suggestion) {
    const { intentId, suggestedAction } = suggestion;

    // Create new child intent based on pattern
    if (suggestedAction.type === 'create-child-intent') {
        const newIntent = await storage.create('intents', {
            title: suggestedAction.title,
            description: suggestedAction.description || '',
            stage: 'exploration',
            priority: suggestedAction.priority || 'medium',
            parent: intentId,
            tags: suggestedAction.tags || [],
            precision: 0.5,
            children: []
        });

        return { type: 'intent-created', intentId: newIntent.id };
    }

    return { type: 'pattern-applied', details: suggestedAction };
}

/**
 * Execute a stage transition suggestion
 */
async function executeStageTransition(suggestion) {
    const { intentId, suggestedAction } = suggestion;

    const intent = await storage.getById('intents', intentId);
    if (!intent) {
        throw new Error(`Intent ${intentId} not found`);
    }

    const newStage = suggestedAction.newStage;
    await storage.update('intents', intentId, { stage: newStage });

    return {
        type: 'stage-transition',
        intentId,
        from: intent.stage,
        to: newStage
    };
}

/**
 * Execute a person influence suggestion
 */
async function executePersonInfluence(suggestion) {
    const { personId, intentId, suggestedAction } = suggestion;

    if (suggestedAction.type === 'create-relation') {
        const relation = await storage.create('relations', {
            from: personId,
            to: intentId,
            type: suggestedAction.relationType || 'influences',
            label: suggestedAction.label || 'influences'
        });

        return { type: 'relation-created', relationId: relation.id };
    }

    return { type: 'influence-applied', details: suggestedAction };
}

/**
 * Execute cognitive health action
 */
async function executeCognitiveHealthAction(suggestion) {
    const { suggestedAction } = suggestion;

    // For cognitive health, we typically just create a notification
    // but we'll also update the kernel meta with the alert
    const meta = await storage.getMeta();

    if (!meta.cognitiveAlerts) {
        meta.cognitiveAlerts = [];
    }

    meta.cognitiveAlerts.push({
        timestamp: new Date().toISOString(),
        type: suggestedAction.type,
        severity: suggestedAction.severity || 'warning',
        message: suggestedAction.message,
        acknowledged: false
    });

    await storage.saveMeta(meta);

    return {
        type: 'cognitive-alert',
        message: suggestedAction.message
    };
}

/**
 * Log governance action to audit trail
 */
async function logGovernanceAction(executionLog) {
    const meta = await storage.getMeta();

    if (!meta.governanceAuditLog) {
        meta.governanceAuditLog = [];
    }

    meta.governanceAuditLog.push(executionLog);

    // Keep only last 1000 entries
    if (meta.governanceAuditLog.length > 1000) {
        meta.governanceAuditLog = meta.governanceAuditLog.slice(-1000);
    }

    await storage.saveMeta(meta);
}

/**
 * Get governance statistics
 */
export async function getGovernanceStats() {
    const meta = await storage.getMeta();
    const auditLog = meta.governanceAuditLog || [];

    const stats = {
        totalExecutions: auditLog.length,
        successCount: auditLog.filter(l => l.status === 'completed').length,
        failureCount: auditLog.filter(l => l.status === 'failed').length,
        recentExecutions: auditLog.slice(-10).reverse(),
        ruleUsage: {}
    };

    // Count rule usage
    for (const log of auditLog) {
        for (const rule of log.matchedRules || []) {
            if (!stats.ruleUsage[rule.name]) {
                stats.ruleUsage[rule.name] = 0;
            }
            stats.ruleUsage[rule.name]++;
        }
    }

    return stats;
}

/**
 * Test a rule against current data without executing
 * @param {string} ruleId - Rule ID to test
 * @returns {Object} Test results with matched suggestions
 */
export async function testRule(ruleId) {
    const rule = await storage.getById('governance-rules', ruleId);
    if (!rule) {
        throw new Error(`Rule ${ruleId} not found`);
    }

    const suggestions = await storage.listAll('suggestions');
    const pending = suggestions.filter(s => s.status === 'pending');

    const matches = [];
    for (const suggestion of pending) {
        if (ruleMatches(rule, suggestion)) {
            matches.push({
                suggestionId: suggestion.id,
                type: suggestion.type,
                confidence: suggestion.confidence,
                reason: suggestion.reason
            });
        }
    }

    return {
        rule: { id: rule.id, name: rule.name },
        matchCount: matches.length,
        matches
    };
}
