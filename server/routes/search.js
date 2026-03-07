/**
 * Search & Filter Routes
 *
 * API endpoints for searching and filtering across collections
 */

import { Router } from 'express';
import * as search from '../services/search.js';

const router = Router();

/**
 * GET /api/search
 * Search across all collections
 */
router.get('/', async (req, res) => {
    try {
        const { q, collections, limit, includeArchived } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const options = {
            collections: collections ? collections.split(',') : undefined,
            limit: limit ? parseInt(limit) : 50,
            includeArchived: includeArchived === 'true'
        };

        const results = await search.searchAll(q, options);

        res.json(results);
    } catch (error) {
        console.error('[Search] Search failed:', error);
        res.status(500).json({
            error: 'Search failed',
            details: error.message
        });
    }
});

/**
 * GET /api/search/collection/:collection
 * Search within a specific collection
 */
router.get('/collection/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const { q, sortBy, limit, offset, ...filters } = req.query;

        if (!q) {
            return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const options = {
            filters,
            sortBy: sortBy || 'relevance',
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0
        };

        const results = await search.searchCollection(collection, q, options);

        res.json({
            collection,
            query: q,
            totalResults: results.length,
            results
        });
    } catch (error) {
        console.error('[Search] Collection search failed:', error);
        res.status(500).json({
            error: 'Collection search failed',
            details: error.message
        });
    }
});

/**
 * GET /api/search/filter-options/:collection
 * Get available filter options for a collection
 */
router.get('/filter-options/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const suggestions = await search.getFilterSuggestions(collection);

        res.json({
            collection,
            filters: suggestions
        });
    } catch (error) {
        console.error('[Search] Filter options failed:', error);
        res.status(500).json({
            error: 'Failed to get filter options',
            details: error.message
        });
    }
});

/**
 * POST /api/search/advanced
 * Advanced search with boolean operators
 */
router.post('/advanced', async (req, res) => {
    try {
        const { query, options } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const results = await search.advancedSearch(query, options);

        res.json(results);
    } catch (error) {
        console.error('[Search] Advanced search failed:', error);
        res.status(500).json({
            error: 'Advanced search failed',
            details: error.message
        });
    }
});

export default router;
