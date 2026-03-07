/**
 * Data Validation & Error Recovery Service
 *
 * Provides schema validation, data integrity checks, and error recovery mechanisms
 * to ensure data consistency across the Self Kernel system.
 *
 * Features:
 * - Schema validation for all data collections
 * - Automatic data repair for common issues
 * - Orphaned relationship detection and cleanup
 * - Data integrity verification
 * - Error recovery strategies
 */

/**
 * Validation schemas for each collection
 */
const SCHEMAS = {
    persons: {
        required: ['name', 'type'],
        fields: {
            name: { type: 'string', minLength: 1, maxLength: 200 },
            type: { type: 'enum', values: ['self', 'mentor', 'peer', 'investor', 'stakeholder', 'other'] },
            role: { type: 'string', optional: true, maxLength: 100 },
            bio: { type: 'string', optional: true, maxLength: 1000 }
        }
    },

    intents: {
        required: ['title', 'stage'],
        fields: {
            title: { type: 'string', minLength: 1, maxLength: 300 },
            description: { type: 'string', optional: true, maxLength: 5000 },
            stage: { type: 'enum', values: ['EXPLORATION', 'STRUCTURING', 'DECISION', 'EXECUTION', 'REFLECTION'] },
            priority: { type: 'enum', values: ['low', 'medium', 'high'], optional: true },
            confidence: { type: 'number', min: 0, max: 1, optional: true },
            tags: { type: 'array', itemType: 'string', optional: true },
            parent: { type: 'string', optional: true, nullable: true },
            active: { type: 'boolean', optional: true }
        }
    },

    relations: {
        required: ['sourceType', 'sourceId', 'targetType', 'targetId', 'label'],
        fields: {
            sourceType: { type: 'enum', values: ['person', 'intent', 'thinking-chain'] },
            sourceId: { type: 'string', minLength: 1 },
            targetType: { type: 'enum', values: ['person', 'intent', 'thinking-chain'] },
            targetId: { type: 'string', minLength: 1 },
            label: { type: 'string', minLength: 1, maxLength: 100 }
        }
    },

    'thinking-chains': {
        required: ['summary', 'thoughts'],
        fields: {
            contextIntentId: { type: 'string', optional: true },
            summary: { type: 'string', minLength: 1, maxLength: 500 },
            thoughts: { type: 'array', minLength: 1 }
        }
    },

    'cognitive-stages': {
        required: ['week', 'dominantStage', 'clarity', 'energy'],
        fields: {
            week: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}$/ },
            dominantStage: { type: 'enum', values: ['EXPLORATION', 'STRUCTURING', 'DECISION', 'EXECUTION', 'REFLECTION'] },
            clarity: { type: 'number', min: 0, max: 1 },
            energy: { type: 'number', min: 0, max: 1 },
            stageDistribution: { type: 'object', optional: true },
            summary: { type: 'string', optional: true, maxLength: 1000 }
        }
    },

    trajectories: {
        required: ['label', 'milestones'],
        fields: {
            label: { type: 'string', minLength: 1, maxLength: 200 },
            description: { type: 'string', optional: true, maxLength: 1000 },
            milestones: { type: 'array', minLength: 1 },
            successRate: { type: 'number', min: 0, max: 1, optional: true }
        }
    },

    'governance-rules': {
        required: ['name', 'action', 'conditions'],
        fields: {
            name: { type: 'string', minLength: 1, maxLength: 200 },
            description: { type: 'string', optional: true, maxLength: 1000 },
            action: { type: 'enum', values: ['auto-approve', 'require-approval', 'stage-only', 'auto-reject'] },
            conditions: { type: 'object' },
            enabled: { type: 'boolean', optional: true },
            priority: { type: 'number', optional: true, min: 0 }
        }
    },

    suggestions: {
        required: ['type', 'title', 'reasoning', 'confidence'],
        fields: {
            type: { type: 'string', minLength: 1 },
            title: { type: 'string', minLength: 1, maxLength: 300 },
            reasoning: { type: 'string', minLength: 1, maxLength: 2000 },
            confidence: { type: 'number', min: 0, max: 1 },
            priority: { type: 'enum', values: ['low', 'medium', 'high'], optional: true },
            status: { type: 'enum', values: ['pending', 'accepted', 'rejected'], optional: true },
            action: { type: 'object', optional: true }
        }
    },

    'rat-patterns': {
        required: ['context', 'action', 'outcome', 'confidence'],
        fields: {
            context: { type: 'string', minLength: 1, maxLength: 1000 },
            action: { type: 'string', minLength: 1, maxLength: 1000 },
            outcome: { type: 'string', minLength: 1, maxLength: 1000 },
            confidence: { type: 'number', min: 0, max: 1 },
            tags: { type: 'array', itemType: 'string', optional: true },
            tools: { type: 'array', itemType: 'string', optional: true },
            entities: { type: 'array', itemType: 'string', optional: true },
            executionTime: { type: 'number', optional: true, min: 0 },
            reuseCount: { type: 'number', optional: true, min: 0 }
        }
    },

    'execution-payloads': {
        required: ['task', 'confidence'],
        fields: {
            intentId: { type: 'string', optional: true },
            task: { type: 'string', minLength: 1, maxLength: 1000 },
            context: { type: 'object', optional: true },
            tools: { type: 'array', itemType: 'string', optional: true },
            confidence: { type: 'number', min: 0, max: 1 },
            staged: { type: 'boolean', optional: true }
        }
    }
};

/**
 * Validate data against schema
 * @param {string} collection - Collection name
 * @param {Object} data - Data to validate
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
 */
export function validate(collection, data) {
    const result = {
        valid: true,
        errors: [],
        warnings: []
    };

    const schema = SCHEMAS[collection];
    if (!schema) {
        result.warnings.push(`No validation schema defined for collection: ${collection}`);
        return result;
    }

    // Check required fields
    for (const field of schema.required) {
        if (data[field] === undefined || data[field] === null) {
            result.errors.push(`Missing required field: ${field}`);
            result.valid = false;
        }
    }

    // Validate field types and constraints
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        const value = data[fieldName];

        // Skip optional fields if not present
        if (value === undefined || value === null) {
            if (!fieldSchema.optional && !fieldSchema.nullable) {
                result.errors.push(`Field '${fieldName}' is required but missing`);
                result.valid = false;
            }
            continue;
        }

        // Type validation
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        if (fieldSchema.type !== actualType) {
            result.errors.push(`Field '${fieldName}' should be ${fieldSchema.type}, got ${actualType}`);
            result.valid = false;
            continue;
        }

        // Enum validation
        if (fieldSchema.type === 'enum' && !fieldSchema.values.includes(value)) {
            result.errors.push(`Field '${fieldName}' must be one of: ${fieldSchema.values.join(', ')}`);
            result.valid = false;
        }

        // String constraints
        if (fieldSchema.type === 'string') {
            if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
                result.errors.push(`Field '${fieldName}' must be at least ${fieldSchema.minLength} characters`);
                result.valid = false;
            }
            if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
                result.errors.push(`Field '${fieldName}' exceeds maximum length of ${fieldSchema.maxLength}`);
                result.valid = false;
            }
            if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
                result.errors.push(`Field '${fieldName}' does not match required pattern`);
                result.valid = false;
            }
        }

        // Number constraints
        if (fieldSchema.type === 'number') {
            if (fieldSchema.min !== undefined && value < fieldSchema.min) {
                result.errors.push(`Field '${fieldName}' must be at least ${fieldSchema.min}`);
                result.valid = false;
            }
            if (fieldSchema.max !== undefined && value > fieldSchema.max) {
                result.errors.push(`Field '${fieldName}' must be at most ${fieldSchema.max}`);
                result.valid = false;
            }
        }

        // Array constraints
        if (fieldSchema.type === 'array') {
            if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
                result.errors.push(`Field '${fieldName}' must have at least ${fieldSchema.minLength} items`);
                result.valid = false;
            }
            if (fieldSchema.itemType) {
                const invalidItems = value.filter(item => typeof item !== fieldSchema.itemType);
                if (invalidItems.length > 0) {
                    result.errors.push(`Field '${fieldName}' should only contain ${fieldSchema.itemType} items`);
                    result.valid = false;
                }
            }
        }
    }

    return result;
}

/**
 * Attempt to repair common data issues
 * @param {string} collection - Collection name
 * @param {Object} data - Data to repair
 * @returns {Object} Repaired data
 */
export function repair(collection, data) {
    const repaired = { ...data };
    const schema = SCHEMAS[collection];

    if (!schema) return repaired;

    // Set default values for missing optional fields with defaults
    if (collection === 'intents') {
        if (repaired.active === undefined) repaired.active = true;
        if (repaired.priority === undefined) repaired.priority = 'medium';
        if (repaired.confidence === undefined) repaired.confidence = 0.5;
        if (repaired.tags === undefined) repaired.tags = [];
    }

    if (collection === 'persons') {
        if (repaired.type === undefined) repaired.type = 'other';
    }

    if (collection === 'suggestions') {
        if (repaired.status === undefined) repaired.status = 'pending';
        if (repaired.priority === undefined) repaired.priority = 'medium';
    }

    if (collection === 'governance-rules') {
        if (repaired.enabled === undefined) repaired.enabled = true;
        if (repaired.priority === undefined) repaired.priority = 99;
    }

    if (collection === 'execution-payloads') {
        if (repaired.staged === undefined) repaired.staged = true;
    }

    // Trim strings
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        if (fieldSchema.type === 'string' && typeof repaired[fieldName] === 'string') {
            repaired[fieldName] = repaired[fieldName].trim();
        }
    }

    // Clamp numbers to valid ranges
    for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        if (fieldSchema.type === 'number' && typeof repaired[fieldName] === 'number') {
            if (fieldSchema.min !== undefined && repaired[fieldName] < fieldSchema.min) {
                repaired[fieldName] = fieldSchema.min;
            }
            if (fieldSchema.max !== undefined && repaired[fieldName] > fieldSchema.max) {
                repaired[fieldName] = fieldSchema.max;
            }
        }
    }

    return repaired;
}

/**
 * Verify data integrity across collections
 * @param {Object} storage - Storage instance
 * @returns {Object} Integrity report with issues found
 */
export async function verifyIntegrity(storage) {
    const report = {
        timestamp: new Date().toISOString(),
        orphanedRelations: [],
        brokenIntentHierarchy: [],
        missingThinkingChains: [],
        duplicates: [],
        issues: []
    };

    try {
        const [intents, persons, relations, chains] = await Promise.all([
            storage.listAll('intents'),
            storage.listAll('persons'),
            storage.listAll('relations'),
            storage.listAll('thinking-chains')
        ]);

        const intentIds = new Set(intents.map(i => i.id));
        const personIds = new Set(persons.map(p => p.id));
        const chainIds = new Set(chains.map(c => c.id));

        // Check for orphaned relations
        for (const relation of relations) {
            const sourceExists =
                (relation.sourceType === 'intent' && intentIds.has(relation.sourceId)) ||
                (relation.sourceType === 'person' && personIds.has(relation.sourceId)) ||
                (relation.sourceType === 'thinking-chain' && chainIds.has(relation.sourceId));

            const targetExists =
                (relation.targetType === 'intent' && intentIds.has(relation.targetId)) ||
                (relation.targetType === 'person' && personIds.has(relation.targetId)) ||
                (relation.targetType === 'thinking-chain' && chainIds.has(relation.targetId));

            if (!sourceExists || !targetExists) {
                report.orphanedRelations.push({
                    id: relation.id,
                    source: `${relation.sourceType}:${relation.sourceId}`,
                    target: `${relation.targetType}:${relation.targetId}`,
                    sourceExists,
                    targetExists
                });
            }
        }

        // Check intent hierarchy (parent references)
        for (const intent of intents) {
            if (intent.parent && !intentIds.has(intent.parent)) {
                report.brokenIntentHierarchy.push({
                    id: intent.id,
                    title: intent.title,
                    parentId: intent.parent,
                    issue: 'Parent intent does not exist'
                });
            }
        }

        // Check for thinking chains with invalid intent references
        for (const chain of chains) {
            if (chain.contextIntentId && !intentIds.has(chain.contextIntentId)) {
                report.missingThinkingChains.push({
                    id: chain.id,
                    intentId: chain.contextIntentId,
                    issue: 'Referenced intent does not exist'
                });
            }
        }

        // Check for duplicate intents (same title)
        const intentTitles = new Map();
        for (const intent of intents) {
            const normalized = intent.title.toLowerCase().trim();
            if (intentTitles.has(normalized)) {
                report.duplicates.push({
                    type: 'intent',
                    title: intent.title,
                    ids: [intentTitles.get(normalized), intent.id]
                });
            } else {
                intentTitles.set(normalized, intent.id);
            }
        }

        // Summary
        report.summary = {
            totalIssues: report.orphanedRelations.length +
                        report.brokenIntentHierarchy.length +
                        report.missingThinkingChains.length +
                        report.duplicates.length,
            orphanedRelations: report.orphanedRelations.length,
            brokenHierarchies: report.brokenIntentHierarchy.length,
            missingReferences: report.missingThinkingChains.length,
            duplicates: report.duplicates.length
        };

    } catch (error) {
        report.issues.push({
            type: 'error',
            message: 'Failed to complete integrity check',
            error: error.message
        });
    }

    return report;
}

/**
 * Automatically fix common integrity issues
 * @param {Object} storage - Storage instance
 * @param {Object} integrityReport - Report from verifyIntegrity
 * @returns {Object} Repair results
 */
export async function autoRepairIntegrity(storage, integrityReport) {
    const results = {
        orphanedRelationsDeleted: 0,
        brokenHierarchiesFixed: 0,
        missingReferencesCleared: 0,
        errors: []
    };

    try {
        // Delete orphaned relations
        for (const orphan of integrityReport.orphanedRelations) {
            try {
                await storage.deleteItem('relations', orphan.id);
                results.orphanedRelationsDeleted++;
            } catch (error) {
                results.errors.push(`Failed to delete orphaned relation ${orphan.id}: ${error.message}`);
            }
        }

        // Fix broken intent hierarchies by clearing invalid parent references
        for (const broken of integrityReport.brokenIntentHierarchy) {
            try {
                await storage.update('intents', broken.id, { parent: null });
                results.brokenHierarchiesFixed++;
            } catch (error) {
                results.errors.push(`Failed to fix intent hierarchy ${broken.id}: ${error.message}`);
            }
        }

        // Clear invalid intent references in thinking chains
        for (const missing of integrityReport.missingThinkingChains) {
            try {
                await storage.update('thinking-chains', missing.id, { contextIntentId: null });
                results.missingReferencesCleared++;
            } catch (error) {
                results.errors.push(`Failed to clear thinking chain reference ${missing.id}: ${error.message}`);
            }
        }

    } catch (error) {
        results.errors.push(`Auto-repair failed: ${error.message}`);
    }

    return results;
}

/**
 * Error recovery: Attempt to restore from backup or repair corrupted data
 * @param {string} collection - Collection name
 * @param {string} itemId - Item ID
 * @param {Error} error - The error that occurred
 * @returns {Object} Recovery result
 */
export async function recoverFromError(collection, itemId, error) {
    const recovery = {
        success: false,
        method: null,
        recoveredData: null,
        error: null
    };

    try {
        // Strategy 1: Return minimal valid object
        const schema = SCHEMAS[collection];
        if (schema) {
            const minimal = { id: itemId };
            for (const field of schema.required) {
                minimal[field] = getDefaultValue(schema.fields[field]);
            }
            recovery.success = true;
            recovery.method = 'minimal-valid-object';
            recovery.recoveredData = minimal;
        }
    } catch (err) {
        recovery.error = err.message;
    }

    return recovery;
}

/**
 * Get default value for a field based on its schema
 */
function getDefaultValue(fieldSchema) {
    switch (fieldSchema.type) {
        case 'string': return '';
        case 'number': return fieldSchema.min !== undefined ? fieldSchema.min : 0;
        case 'boolean': return false;
        case 'array': return [];
        case 'object': return {};
        case 'enum': return fieldSchema.values[0];
        default: return null;
    }
}
