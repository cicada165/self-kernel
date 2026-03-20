/**
 * Intent Clustering API Routes
 *
 * Endpoints for intent clustering, duplicate detection, and consolidation recommendations.
 */

import express from 'express';
import * as clustering from '../services/intentClustering.js';

const router = express.Router();

/**
 * GET /api/clustering/duplicates
 * Find duplicate or highly similar intents
 *
 * Query params:
 * - minSimilarity: Minimum similarity threshold (default: 0.7)
 */
router.get('/duplicates', async (req, res) => {
  try {
    const minSimilarity = parseFloat(req.query.minSimilarity) || 0.7;

    const duplicates = await clustering.findDuplicates(minSimilarity);

    res.json({
      success: true,
      count: duplicates.length,
      duplicates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error finding duplicates:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/clustering/clusters
 * Cluster intents using k-means
 *
 * Query params:
 * - k: Number of clusters (default: 5)
 */
router.get('/clusters', async (req, res) => {
  try {
    const k = parseInt(req.query.k) || 5;

    const clusters = await clustering.clusterIntents(k);

    res.json({
      success: true,
      count: clusters.length,
      clusters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error clustering intents:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/clustering/recommendations
 * Get consolidation recommendations based on similarity
 */
router.get('/recommendations', async (req, res) => {
  try {
    const recommendations = await clustering.getRecommendations();

    res.json({
      success: true,
      count: recommendations.length,
      recommendations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/clustering/statistics
 * Get clustering statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await clustering.getStatistics();

    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching clustering statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
