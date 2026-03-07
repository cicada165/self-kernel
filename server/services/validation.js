/**
 * Data Validation and Error Recovery System
 *
 * Ensures data integrity across all collections with schema validation,
 * automatic backups, and recovery mechanisms for corrupted data.
 *
 * Features:
 * - Schema validation for all collection types
 * - Automatic data repair for common issues
 * - Backup/restore functionality
 * - Integrity checks and health monitoring
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'database');
const BACKUP_DIR = path.join(__dirname, '..', '..', 'database-backups');

// Schema definitions for each collection
const SCHEMAS = {
    person: {
        required: ['id', 'type', 'name'],
        optional: ['role', 'context', 'tags', 'createdAt', 'updatedAt'],
        types: {
            id: 'string',
            type: 'string',
            name: 'string',
            role: 'string',
            context: 'string',
            tags: 'array'
        },
        enums: {
            type: ['self', 'mentor', 'investor', 'peer', 'other']
        }
    },

    intent: {
        required: ['id', 'title', 'stage'],
        optional: ['description', 'priority', 'tags', 'precision', 'parent', 'children', 'createdAt', 'updatedAt'],
        types: {
            id: 'string',
            title: 'string',
            description: 'string',
            stage: 'string',
            priority: 'string',
            tags: 'array',
            precision: 'number',
            parent: 'string',
            children: 'array'
        },
        enums: {
            stage: ['exploration', 'structuring', 'decision', 'execution', 'reflection'],
            priority: ['low', 'medium', 'high']
        },
        constraints: {
            precision: (val) => val >= 0 && val <= 1
        }
    },

    relation: {
        required: ['id', 'from', 'to', 'type'],
        optional: ['label', 'metadata', 'createdAt', 'updatedAt'],
        types: {
            id: 'string',
            from: 'string',
            to: 'string',
            type: 'string',
            label: 'string'
        }
    },

    thinkingChain: {
        required: ['id', 'title', 'steps'],
        optional: ['relatedIntents', 'tags', 'createdAt', 'updatedAt'],
        types: {
            id: 'string',
            title: 'string',
            steps: 'array',
            relatedIntents: 'array',
            tags: 'array'
        }
    },

    trajectory: {
        required: ['id', 'title', 'milestones'],
        optional: ['description', 'relatedIntents', 'tags', 'createdAt', 'updatedAt'],
        types: {
            id: 'string',
            title: 'string',
            description: 'string',
            milestones: 'array',
            relatedIntents: 'array',
            tags: 'array'
        }
    },

    cognitiveStage: {
        required: ['id', 'weekOf', 'dominantStage', 'clarity', 'energy'],
        optional: ['summary', 'createdAt', 'updatedAt'],
        types: {
            id: 'string',
            weekOf: 'string',
            dominantStage: 'string',
            clarity: 'number',
            energy: 'number',
            summary: 'string'
        },
        enums: {
            dominantStage: ['exploration', 'structuring', 'decision', 'execution', 'reflection']
        },
        constraints: {
            clarity: (val) => val >= 0 && val <= 1,
            energy: (val) => val >= 0 && val <= 1
        }
    },

    governanceRule: {
        required: ['id', 'name', 'enabled', 'conditions', 'action'],
        optional: ['description', 'tags', 'createdAt', 'updatedAt'],
        types: {
            id: 'string',
            name: 'string',
            description: 'string',
            enabled: 'boolean',
            conditions: 'object',
            action: 'string',
            tags: 'array'
        },
        enums: {
            action: ['auto-approve', 'notify', 'block']
        }
    },

    ratPattern: {
        required: ['id', 'name', 'pattern', 'confidence'],
        optional: ['description', 'context', 'tags', 'entities', 'tools', 'reuseCount', 'lastUsed', 'createdAt', 'updatedAt'],
        types: {
            id: 'string',
            name: 'string',
            description: 'string',
            context: 'string',
            pattern: 'object',
            confidence: 'number',
            tags: 'array',
            entities: 'array',
            tools: 'array',
            reuseCount: 'number',
            lastUsed: 'string'
        },
        constraints: {
            confidence: (val) => val >= 0 && val <= 1
        }
    }
};

/**
 * Validate data against schema
 * @param {string} collectionType - Type of collection (person, intent, etc.)
 * @param {Object} data - Data to validate
 * @returns {Object} { valid: boolean, errors: Array, warnings: Array }
 */
export function validate(collectionType, data) {
    const schema = SCHEMAS[collectionType];
    if (!schema) {
        return { valid: false, errors: [`Unknown collection type: ${collectionType}`], warnings: [] };
    }

    const errors = [];
    const warnings = [];

    // Check required fields
    for (const field of schema.required) {
        if (!(field in data) || data[field] === null || data[field] === undefined) {
            errors.push(`Missing required field: ${field}`);
        }
    }

    // Check types
    for (const [field, expectedType] of Object.entries(schema.types || {})) {
        if (field in data && data[field] !== null && data[field] !== undefined) {
            const actualType = Array.isArray(data[field]) ? 'array' : typeof data[field];
            if (actualType !== expectedType) {
                errors.push(`Field ${field} should be ${expectedType}, got ${actualType}`);
            }
        }
    }

    // Check enums
    for (const [field, allowedValues] of Object.entries(schema.enums || {})) {
        if (field in data && data[field] !== null) {
            if (!allowedValues.includes(data[field])) {
                errors.push(`Field ${field} must be one of: ${allowedValues.join(', ')}. Got: ${data[field]}`);
            }
        }
    }

    // Check constraints
    for (const [field, constraint] of Object.entries(schema.constraints || {})) {
        if (field in data && data[field] !== null) {
            if (!constraint(data[field])) {
                errors.push(`Field ${field} failed validation constraint`);
            }
        }
    }

    // Check for unexpected fields (warning only)
    const allowedFields = [...schema.required, ...schema.optional];
    for (const field of Object.keys(data)) {
        if (!allowedFields.includes(field)) {
            warnings.push(`Unexpected field: ${field}`);
        }
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

/**
 * Attempt to auto-repair common data issues
 * @param {string} collectionType - Type of collection
 * @param {Object} data - Data to repair
 * @returns {Object} Repaired data
 */
export function autoRepair(collectionType, data) {
    const repaired = { ...data };
    const schema = SCHEMAS[collectionType];

    if (!schema) return repaired;

    // Add missing timestamps
    if (!repaired.createdAt) {
        repaired.createdAt = new Date().toISOString();
    }
    if (!repaired.updatedAt) {
        repaired.updatedAt = new Date().toISOString();
    }

    // Fix array fields that are null/undefined
    for (const [field, type] of Object.entries(schema.types || {})) {
        if (type === 'array' && (!repaired[field] || !Array.isArray(repaired[field]))) {
            repaired[field] = [];
        }
    }

    // Fix enum fields with invalid values
    for (const [field, allowedValues] of Object.entries(schema.enums || {})) {
        if (field in repaired && !allowedValues.includes(repaired[field])) {
            repaired[field] = allowedValues[0]; // Default to first allowed value
        }
    }

    // Clamp numeric constraints
    for (const [field, constraint] of Object.entries(schema.constraints || {})) {
        if (field in repaired && typeof repaired[field] === 'number') {
            // If constraint fails, try to clamp to valid range
            if (!constraint(repaired[field])) {
                if (repaired[field] < 0) repaired[field] = 0;
                if (repaired[field] > 1) repaired[field] = 1;
            }
        }
    }

    return repaired;
}

/**
 * Validate all data in a collection
 * @param {string} collection - Collection name
 * @returns {Object} Validation report
 */
export async function validateCollection(collection) {
    const collectionPath = path.join(DATA_DIR, collection);
    const report = {
        collection,
        totalFiles: 0,
        validFiles: 0,
        invalidFiles: 0,
        issues: []
    };

    try {
        const files = await fs.readdir(collectionPath);

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            report.totalFiles++;
            const filePath = path.join(collectionPath, file);

            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(content);

                // Determine collection type from collection name
                const collectionType = getCollectionType(collection);
                const validation = validate(collectionType, data);

                if (validation.valid) {
                    report.validFiles++;
                } else {
                    report.invalidFiles++;
                    report.issues.push({
                        file,
                        id: data.id,
                        errors: validation.errors,
                        warnings: validation.warnings
                    });
                }
            } catch (err) {
                report.invalidFiles++;
                report.issues.push({
                    file,
                    error: `Failed to parse JSON: ${err.message}`
                });
            }
        }
    } catch (err) {
        report.error = `Failed to read collection: ${err.message}`;
    }

    return report;
}

/**
 * Repair all data in a collection
 * @param {string} collection - Collection name
 * @param {boolean} dryRun - If true, don't write changes
 * @returns {Object} Repair report
 */
export async function repairCollection(collection, dryRun = false) {
    const collectionPath = path.join(DATA_DIR, collection);
    const report = {
        collection,
        totalFiles: 0,
        repairedFiles: 0,
        unchangedFiles: 0,
        failedFiles: 0,
        dryRun,
        repairs: []
    };

    try {
        const files = await fs.readdir(collectionPath);

        for (const file of files) {
            if (!file.endsWith('.json')) continue;

            report.totalFiles++;
            const filePath = path.join(collectionPath, file);

            try {
                const content = await fs.readFile(filePath, 'utf-8');
                const data = JSON.parse(content);

                const collectionType = getCollectionType(collection);
                const validation = validate(collectionType, data);

                if (!validation.valid) {
                    const repaired = autoRepair(collectionType, data);
                    const revalidation = validate(collectionType, repaired);

                    if (revalidation.valid) {
                        report.repairedFiles++;
                        report.repairs.push({
                            file,
                            id: data.id,
                            originalErrors: validation.errors,
                            repaired: true
                        });

                        if (!dryRun) {
                            await fs.writeFile(filePath, JSON.stringify(repaired, null, 2));
                        }
                    } else {
                        report.failedFiles++;
                        report.repairs.push({
                            file,
                            id: data.id,
                            originalErrors: validation.errors,
                            remainingErrors: revalidation.errors,
                            repaired: false
                        });
                    }
                } else {
                    report.unchangedFiles++;
                }
            } catch (err) {
                report.failedFiles++;
                report.repairs.push({
                    file,
                    error: `Failed to repair: ${err.message}`
                });
            }
        }
    } catch (err) {
        report.error = `Failed to read collection: ${err.message}`;
    }

    return report;
}

/**
 * Create a backup of all data
 * @returns {Object} Backup info
 */
export async function createBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `backup-${timestamp}`);

    await fs.mkdir(backupPath, { recursive: true });

    const collections = await fs.readdir(DATA_DIR);
    let totalFiles = 0;

    for (const item of collections) {
        const itemPath = path.join(DATA_DIR, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
            const destPath = path.join(backupPath, item);
            await fs.mkdir(destPath, { recursive: true });

            const files = await fs.readdir(itemPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    await fs.copyFile(
                        path.join(itemPath, file),
                        path.join(destPath, file)
                    );
                    totalFiles++;
                }
            }
        } else if (item.endsWith('.json')) {
            await fs.copyFile(itemPath, path.join(backupPath, item));
            totalFiles++;
        }
    }

    return {
        backupPath,
        timestamp,
        totalFiles,
        success: true
    };
}

/**
 * Restore from a backup
 * @param {string} backupId - Backup identifier (timestamp)
 * @returns {Object} Restore info
 */
export async function restoreBackup(backupId) {
    const backupPath = path.join(BACKUP_DIR, `backup-${backupId}`);

    try {
        await fs.access(backupPath);
    } catch {
        throw new Error(`Backup not found: ${backupId}`);
    }

    const items = await fs.readdir(backupPath);
    let totalFiles = 0;

    for (const item of items) {
        const itemPath = path.join(backupPath, item);
        const stat = await fs.stat(itemPath);

        if (stat.isDirectory()) {
            const destPath = path.join(DATA_DIR, item);
            await fs.mkdir(destPath, { recursive: true });

            const files = await fs.readdir(itemPath);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    await fs.copyFile(
                        path.join(itemPath, file),
                        path.join(destPath, file)
                    );
                    totalFiles++;
                }
            }
        } else if (item.endsWith('.json')) {
            await fs.copyFile(itemPath, path.join(DATA_DIR, item));
            totalFiles++;
        }
    }

    return {
        backupId,
        totalFiles,
        success: true
    };
}

/**
 * List available backups
 * @returns {Array} List of backups
 */
export async function listBackups() {
    try {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        const items = await fs.readdir(BACKUP_DIR);
        const backups = [];

        for (const item of items) {
            if (item.startsWith('backup-')) {
                const timestamp = item.replace('backup-', '');
                const backupPath = path.join(BACKUP_DIR, item);
                const stat = await fs.stat(backupPath);

                backups.push({
                    id: timestamp,
                    path: backupPath,
                    created: stat.birthtime,
                    size: stat.size
                });
            }
        }

        return backups.sort((a, b) => b.created - a.created);
    } catch {
        return [];
    }
}

/**
 * Perform integrity check on entire database
 * @returns {Object} Integrity report
 */
export async function checkIntegrity() {
    const collections = ['persons', 'intents', 'relations', 'thinking-chains',
                        'trajectories', 'cognitive-stages', 'governance-rules',
                        'rat-patterns', 'execution-payloads', 'baseline'];

    const report = {
        timestamp: new Date().toISOString(),
        collections: {},
        totalIssues: 0,
        summary: {
            totalFiles: 0,
            validFiles: 0,
            invalidFiles: 0
        }
    };

    for (const collection of collections) {
        const collectionReport = await validateCollection(collection);
        report.collections[collection] = collectionReport;
        report.totalIssues += collectionReport.invalidFiles;
        report.summary.totalFiles += collectionReport.totalFiles;
        report.summary.validFiles += collectionReport.validFiles;
        report.summary.invalidFiles += collectionReport.invalidFiles;
    }

    report.healthy = report.totalIssues === 0;

    return report;
}

/**
 * Map collection name to schema type
 */
function getCollectionType(collection) {
    const mapping = {
        'persons': 'person',
        'intents': 'intent',
        'relations': 'relation',
        'thinking-chains': 'thinkingChain',
        'trajectories': 'trajectory',
        'cognitive-stages': 'cognitiveStage',
        'governance-rules': 'governanceRule',
        'rat-patterns': 'ratPattern'
    };
    return mapping[collection] || collection;
}
