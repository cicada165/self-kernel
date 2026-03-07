/**
 * Export/Import Service for White-Box Data
 *
 * Provides data portability through JSON and CSV export/import functionality.
 * Maintains the white-box principle by keeping data human-readable and editable.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as storage from '../storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'database');
const EXPORT_DIR = path.join(__dirname, '..', '..', 'exports');

/**
 * Export all data as a single JSON bundle
 * @returns {Object} Complete data snapshot
 */
export async function exportAllAsJSON() {
    const collections = [
        'persons', 'intents', 'relations', 'thinking-chains',
        'trajectories', 'cognitive-stages', 'governance-rules',
        'rat-patterns', 'execution-payloads', 'suggestions', 'baseline'
    ];

    const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        metadata: await storage.getMeta(),
        collections: {}
    };

    for (const collection of collections) {
        const items = await storage.listAll(collection);
        exportData.collections[collection] = items;
    }

    return exportData;
}

/**
 * Export specific collection as JSON
 * @param {string} collection - Collection name
 * @returns {Object} Collection data
 */
export async function exportCollectionAsJSON(collection) {
    const items = await storage.listAll(collection);
    return {
        collection,
        exportedAt: new Date().toISOString(),
        count: items.length,
        data: items
    };
}

/**
 * Export collection as CSV
 * @param {string} collection - Collection name
 * @returns {string} CSV content
 */
export async function exportCollectionAsCSV(collection) {
    const items = await storage.listAll(collection);
    if (items.length === 0) {
        return '';
    }

    // Extract all unique keys from all items
    const allKeys = new Set();
    items.forEach(item => {
        Object.keys(item).forEach(key => allKeys.add(key));
    });

    const headers = Array.from(allKeys);
    const csvRows = [];

    // Header row
    csvRows.push(headers.map(h => escapeCSV(h)).join(','));

    // Data rows
    for (const item of items) {
        const row = headers.map(header => {
            const value = item[header];
            if (value === null || value === undefined) {
                return '';
            }
            if (typeof value === 'object') {
                return escapeCSV(JSON.stringify(value));
            }
            return escapeCSV(String(value));
        });
        csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
}

/**
 * Escape CSV value
 */
function escapeCSV(value) {
    if (value === null || value === undefined) {
        return '';
    }
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Save export to file
 * @param {string} filename - File name
 * @param {string} content - File content
 * @returns {Object} File info
 */
export async function saveExportToFile(filename, content) {
    await fs.mkdir(EXPORT_DIR, { recursive: true });
    const filePath = path.join(EXPORT_DIR, filename);
    await fs.writeFile(filePath, content, 'utf-8');

    const stats = await fs.stat(filePath);
    return {
        filename,
        path: filePath,
        size: stats.size,
        created: stats.birthtime
    };
}

/**
 * Import data from JSON bundle
 * @param {Object} importData - Data to import
 * @param {Object} options - Import options
 * @returns {Object} Import report
 */
export async function importFromJSON(importData, options = {}) {
    const {
        merge = false,  // If true, merge with existing data; if false, replace
        collections = null  // Array of collections to import, or null for all
    } = options;

    const report = {
        startedAt: new Date().toISOString(),
        collections: {},
        totalImported: 0,
        totalSkipped: 0,
        totalErrors: 0,
        errors: []
    };

    const collectionsToImport = collections || Object.keys(importData.collections || {});

    for (const collection of collectionsToImport) {
        const collectionData = importData.collections[collection];
        if (!collectionData) {
            report.collections[collection] = { skipped: true, reason: 'No data found' };
            continue;
        }

        const collectionReport = {
            imported: 0,
            skipped: 0,
            errors: 0,
            errorDetails: []
        };

        // If not merging, clear existing data first
        if (!merge) {
            const existing = await storage.listAll(collection);
            for (const item of existing) {
                await storage.remove(collection, item.id);
            }
        }

        // Import items
        for (const item of collectionData) {
            try {
                if (merge) {
                    // Check if item exists
                    const existing = await storage.getById(collection, item.id);
                    if (existing) {
                        // Update existing
                        await storage.update(collection, item.id, item);
                    } else {
                        // Create new
                        await storage.create(collection, item);
                    }
                } else {
                    // Create all items (collection was cleared)
                    await storage.create(collection, item);
                }

                collectionReport.imported++;
                report.totalImported++;
            } catch (err) {
                collectionReport.errors++;
                collectionReport.errorDetails.push({
                    itemId: item.id,
                    error: err.message
                });
                report.totalErrors++;
                report.errors.push({
                    collection,
                    itemId: item.id,
                    error: err.message
                });
            }
        }

        report.collections[collection] = collectionReport;
    }

    // Import metadata if present and merge is false
    if (!merge && importData.metadata) {
        try {
            await storage.saveMeta(importData.metadata);
        } catch (err) {
            report.errors.push({
                collection: 'metadata',
                error: err.message
            });
        }
    }

    report.completedAt = new Date().toISOString();
    report.success = report.totalErrors === 0;

    return report;
}

/**
 * Import collection from CSV
 * @param {string} collection - Collection name
 * @param {string} csvContent - CSV content
 * @param {Object} options - Import options
 * @returns {Object} Import report
 */
export async function importCollectionFromCSV(collection, csvContent, options = {}) {
    const { merge = false } = options;

    const report = {
        collection,
        imported: 0,
        skipped: 0,
        errors: 0,
        errorDetails: []
    };

    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
        throw new Error('CSV file is empty');
    }

    // Parse header
    const headers = parseCSVLine(lines[0]);

    // If not merging, clear existing data
    if (!merge) {
        const existing = await storage.listAll(collection);
        for (const item of existing) {
            await storage.remove(collection, item.id);
        }
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
        try {
            const values = parseCSVLine(lines[i]);
            if (values.length !== headers.length) {
                throw new Error(`Row ${i + 1}: Column count mismatch`);
            }

            const item = {};
            for (let j = 0; j < headers.length; j++) {
                const header = headers[j];
                let value = values[j];

                // Try to parse JSON values (arrays, objects)
                if (value && (value.startsWith('{') || value.startsWith('['))) {
                    try {
                        value = JSON.parse(value);
                    } catch {
                        // Keep as string if JSON parse fails
                    }
                }

                // Try to parse numbers
                if (value && !isNaN(value) && value.trim() !== '') {
                    value = Number(value);
                }

                // Empty string to null
                if (value === '') {
                    value = null;
                }

                item[header] = value;
            }

            // Ensure item has an ID
            if (!item.id) {
                item.id = `imported-${Date.now()}-${i}`;
            }

            // Import item
            if (merge) {
                const existing = await storage.getById(collection, item.id);
                if (existing) {
                    await storage.update(collection, item.id, item);
                } else {
                    await storage.create(collection, item);
                }
            } else {
                await storage.create(collection, item);
            }

            report.imported++;
        } catch (err) {
            report.errors++;
            report.errorDetails.push({
                row: i + 1,
                error: err.message
            });
        }
    }

    report.success = report.errors === 0;
    return report;
}

/**
 * Parse CSV line (handles quoted fields)
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote mode
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }

    // Add last field
    result.push(current);

    return result;
}

/**
 * List available exports
 * @returns {Array} List of export files
 */
export async function listExports() {
    try {
        await fs.mkdir(EXPORT_DIR, { recursive: true });
        const files = await fs.readdir(EXPORT_DIR);

        const exports = [];
        for (const file of files) {
            if (file.endsWith('.json') || file.endsWith('.csv')) {
                const filePath = path.join(EXPORT_DIR, file);
                const stats = await fs.stat(filePath);
                exports.push({
                    filename: file,
                    path: filePath,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                });
            }
        }

        return exports.sort((a, b) => b.created - a.created);
    } catch {
        return [];
    }
}

/**
 * Delete export file
 * @param {string} filename - File to delete
 */
export async function deleteExport(filename) {
    const filePath = path.join(EXPORT_DIR, filename);
    await fs.unlink(filePath);
}

/**
 * Read export file
 * @param {string} filename - File to read
 * @returns {string} File content
 */
export async function readExportFile(filename) {
    const filePath = path.join(EXPORT_DIR, filename);
    return await fs.readFile(filePath, 'utf-8');
}

/**
 * Generate export filename
 * @param {string} collection - Collection name or 'all'
 * @param {string} format - 'json' or 'csv'
 * @returns {string} Filename
 */
export function generateExportFilename(collection, format) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    return `export-${collection}-${timestamp}.${format}`;
}
