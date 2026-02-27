/**
 * Self Kernel — Local-First Storage Layer
 * 
 * All data is stored as human-readable JSON files in the data/ directory.
 * This is the "white-box" principle: everything is transparent, inspectable, and editable.
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID as uuidv4 } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'database');

const COLLECTIONS = [
    'persons',
    'intents',
    'relations',
    'thinking-chains',
    'cognitive-stages',
    'trajectories',
    'mcp-logs'
];

/** Ensure all collection directories exist */
export async function initStorage() {
    await fs.mkdir(DATA_DIR, { recursive: true });
    for (const col of COLLECTIONS) {
        await fs.mkdir(path.join(DATA_DIR, col), { recursive: true });
    }
    // Create metadata file if it doesn't exist
    const metaPath = path.join(DATA_DIR, 'kernel-meta.json');
    try {
        await fs.access(metaPath);
    } catch {
        await fs.writeFile(metaPath, JSON.stringify({
            kernelId: uuidv4(),
            createdAt: new Date().toISOString(),
            version: '0.1.0',
            owner: 'Anonymous',
            description: 'My Personal Intelligence Core'
        }, null, 2));
    }
}

/** List all items in a collection */
export async function listAll(collection) {
    const dir = path.join(DATA_DIR, collection);
    try {
        const files = await fs.readdir(dir);
        const items = [];
        for (const file of files) {
            if (file.endsWith('.json')) {
                const content = await fs.readFile(path.join(dir, file), 'utf-8');
                items.push(JSON.parse(content));
            }
        }
        return items;
    } catch {
        return [];
    }
}

/** Get a single item by ID */
export async function getById(collection, id) {
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

/** Create a new item */
export async function create(collection, data) {
    const id = data.id || uuidv4();
    const item = {
        id,
        ...data,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(item, null, 2));
    return item;
}

/** Update an existing item */
export async function update(collection, id, data) {
    const existing = await getById(collection, id);
    if (!existing) return null;
    const updated = {
        ...existing,
        ...data,
        id, // preserve original ID
        updatedAt: new Date().toISOString()
    };
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(updated, null, 2));
    return updated;
}

/** Delete an item */
export async function remove(collection, id) {
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    try {
        await fs.unlink(filePath);
        return true;
    } catch {
        return false;
    }
}

/** Get kernel metadata */
export async function getKernelMeta() {
    const metaPath = path.join(DATA_DIR, 'kernel-meta.json');
    try {
        const content = await fs.readFile(metaPath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
}

/** Get counts for all collections */
export async function getCounts() {
    const counts = {};
    for (const col of COLLECTIONS) {
        const dir = path.join(DATA_DIR, col);
        try {
            const files = await fs.readdir(dir);
            counts[col] = files.filter(f => f.endsWith('.json')).length;
        } catch {
            counts[col] = 0;
        }
    }
    return counts;
}

/** Get raw JSON for the data inspector */
export async function getRawData(collection, id) {
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { path: filePath, content: JSON.parse(content), raw: content };
    } catch {
        return null;
    }
}

/** Save raw JSON from the data inspector */
export async function saveRawData(collection, id, rawJson) {
    const filePath = path.join(DATA_DIR, collection, `${id}.json`);
    const parsed = JSON.parse(rawJson); // validate JSON
    parsed.updatedAt = new Date().toISOString();
    await fs.writeFile(filePath, JSON.stringify(parsed, null, 2));
    return parsed;
}
