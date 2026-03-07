/**
 * Search & Filter Service
 *
 * Provides advanced search and filtering across all data collections:
 * - Full-text search
 * - Tag-based filtering
 * - Date range filtering
 * - Multi-collection search
 * - Relevance scoring
 */

import * as storage from '../storage.js';

/**
 * Search across all collections
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Object} Search results grouped by collection
 */
export async function searchAll(query, options = {}) {
    const {
        collections = ['persons', 'intents', 'relations', 'thinking-chains', 'trajectories', 'rat-patterns'],
        limit = 50,
        includeArchived = false
    } = options;

    const results = {
        query,
        totalResults: 0,
        collections: {}
    };

    for (const collection of collections) {
        const collectionResults = await searchCollection(collection, query, { ...options, limit: null });
        if (collectionResults.length > 0) {
            results.collections[collection] = collectionResults;
            results.totalResults += collectionResults.length;
        }
    }

    // Sort by relevance score and apply limit
    const allResults = Object.entries(results.collections).flatMap(([collection, items]) =>
        items.map(item => ({ ...item, collection }))
    );

    allResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    results.topResults = allResults.slice(0, limit);

    return results;
}

/**
 * Search within a specific collection
 * @param {string} collection - Collection name
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Array} Matching items with relevance scores
 */
export async function searchCollection(collection, query, options = {}) {
    const {
        filters = {},
        sortBy = 'relevance',
        limit = 50,
        offset = 0
    } = options;

    const items = await storage.listAll(collection);
    const queryLower = query.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 0);

    // Filter and score items
    let results = items
        .map(item => {
            const score = calculateRelevanceScore(item, queryTerms, collection);
            return {
                ...item,
                relevanceScore: score,
                collection
            };
        })
        .filter(item => item.relevanceScore > 0);

    // Apply filters
    results = applyFilters(results, filters);

    // Sort
    if (sortBy === 'relevance') {
        results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    } else if (sortBy === 'date') {
        results.sort((a, b) => new Date(b.createdAt || b.timestamp || 0) - new Date(a.createdAt || a.timestamp || 0));
    } else if (sortBy === 'alpha') {
        results.sort((a, b) => {
            const aName = a.title || a.name || a.label || '';
            const bName = b.title || b.name || b.label || '';
            return aName.localeCompare(bName);
        });
    }

    // Apply pagination
    results = results.slice(offset, offset + limit);

    return results;
}

/**
 * Calculate relevance score for an item
 * @param {Object} item - Item to score
 * @param {Array} queryTerms - Search terms
 * @param {string} collection - Collection name
 * @returns {number} Relevance score (0-100)
 */
function calculateRelevanceScore(item, queryTerms, collection) {
    let score = 0;
    const searchableFields = getSearchableFields(collection);

    for (const term of queryTerms) {
        for (const field of searchableFields) {
            const value = getFieldValue(item, field);
            if (!value) continue;

            const valueLower = String(value).toLowerCase();

            // Exact match: +10 points
            if (valueLower === term) {
                score += 10;
            }
            // Starts with: +5 points
            else if (valueLower.startsWith(term)) {
                score += 5;
            }
            // Contains: +2 points
            else if (valueLower.includes(term)) {
                score += 2;
            }

            // Bonus for title/name fields
            if (field === 'title' || field === 'name') {
                score *= 1.5;
            }
        }

        // Tag matching
        if (item.tags && Array.isArray(item.tags)) {
            const tagMatches = item.tags.filter(tag => tag.toLowerCase().includes(term));
            score += tagMatches.length * 3;
        }
    }

    // Normalize score to 0-100
    return Math.min(score, 100);
}

/**
 * Get searchable fields for a collection
 */
function getSearchableFields(collection) {
    const fieldMap = {
        'persons': ['name', 'role', 'bio', 'type'],
        'intents': ['title', 'description', 'stage', 'priority'],
        'relations': ['label', 'sourceType', 'targetType'],
        'thinking-chains': ['summary', 'thoughts'],
        'trajectories': ['label', 'description'],
        'rat-patterns': ['context', 'action', 'outcome'],
        'suggestions': ['title', 'reasoning', 'type'],
        'governance-rules': ['name', 'description'],
        'cognitive-stages': ['dominantStage', 'summary']
    };

    return fieldMap[collection] || ['title', 'name', 'description'];
}

/**
 * Get field value from item (supports nested paths)
 */
function getFieldValue(item, field) {
    if (field.includes('.')) {
        const parts = field.split('.');
        let value = item;
        for (const part of parts) {
            value = value?.[part];
            if (value === undefined) return null;
        }
        return value;
    }

    // Special handling for arrays
    if (field === 'thoughts' && Array.isArray(item.thoughts)) {
        return item.thoughts.map(t => t.text).join(' ');
    }

    return item[field];
}

/**
 * Apply filters to results
 * @param {Array} results - Search results
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered results
 */
function applyFilters(results, filters) {
    let filtered = [...results];

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
        filtered = filtered.filter(item => {
            const itemTags = item.tags || [];
            return filters.tags.some(tag => itemTags.includes(tag));
        });
    }

    // Stage filter (for intents)
    if (filters.stage) {
        filtered = filtered.filter(item => item.stage === filters.stage);
    }

    // Priority filter
    if (filters.priority) {
        filtered = filtered.filter(item => item.priority === filters.priority);
    }

    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
        filtered = filtered.filter(item => {
            const itemDate = new Date(item.createdAt || item.timestamp || 0);
            if (filters.dateFrom && itemDate < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && itemDate > new Date(filters.dateTo)) return false;
            return true;
        });
    }

    // Confidence range filter
    if (filters.minConfidence !== undefined) {
        filtered = filtered.filter(item => (item.confidence || 0) >= filters.minConfidence);
    }

    if (filters.maxConfidence !== undefined) {
        filtered = filtered.filter(item => (item.confidence || 0) <= filters.maxConfidence);
    }

    // Active filter (for intents)
    if (filters.active !== undefined) {
        filtered = filtered.filter(item => item.active === filters.active);
    }

    // Person type filter
    if (filters.personType) {
        filtered = filtered.filter(item => item.type === filters.personType);
    }

    // Completed filter (for trajectories/milestones)
    if (filters.completed !== undefined) {
        filtered = filtered.filter(item => item.completed === filters.completed);
    }

    return filtered;
}

/**
 * Get filter suggestions based on current data
 * @param {string} collection - Collection name
 * @returns {Object} Available filter options
 */
export async function getFilterSuggestions(collection) {
    const items = await storage.listAll(collection);

    const suggestions = {
        tags: new Set(),
        stages: new Set(),
        priorities: new Set(),
        types: new Set()
    };

    for (const item of items) {
        // Tags
        if (item.tags && Array.isArray(item.tags)) {
            item.tags.forEach(tag => suggestions.tags.add(tag));
        }

        // Stages
        if (item.stage) {
            suggestions.stages.add(item.stage);
        }

        // Priorities
        if (item.priority) {
            suggestions.priorities.add(item.priority);
        }

        // Types
        if (item.type) {
            suggestions.types.add(item.type);
        }
    }

    return {
        tags: Array.from(suggestions.tags).sort(),
        stages: Array.from(suggestions.stages).sort(),
        priorities: Array.from(suggestions.priorities).sort(),
        types: Array.from(suggestions.types).sort()
    };
}

/**
 * Advanced search with boolean operators
 * @param {string} queryString - Query with operators (AND, OR, NOT)
 * @param {Object} options - Search options
 * @returns {Object} Search results
 */
export async function advancedSearch(queryString, options = {}) {
    // Parse query string for boolean operators
    // Example: "automation AND (email OR calendar) NOT archived"

    const tokens = queryString.split(/\s+(AND|OR|NOT)\s+/i);
    const queries = [];
    let currentOp = 'AND';

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i].trim();
        if (token.match(/^(AND|OR|NOT)$/i)) {
            currentOp = token.toUpperCase();
        } else {
            queries.push({ term: token, operator: currentOp });
        }
    }

    // Execute searches and combine results
    const results = await searchAll(queryString, options);

    // TODO: Implement boolean logic for combining results

    return results;
}
