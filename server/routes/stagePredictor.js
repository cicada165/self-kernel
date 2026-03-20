/**
 * FSM Stage Transition Predictor API Routes
 *
 * Endpoints for accessing stage transition predictions and submitting feedback.
 */

import express from 'express';
import * as stagePredictor from '../services/stagePredictor.js';

const router = express.Router();

/**
 * GET /api/predictor/transitions
 * Get all stage transition predictions
 *
 * Query params:
 * - minConfidence: Minimum confidence threshold (default: 0.5)
 * - includeReflection: Include reflection stage intents (default: false)
 */
router.get('/transitions', async (req, res) => {
  try {
    const minConfidence = parseFloat(req.query.minConfidence) || 0.5;
    const includeReflection = req.query.includeReflection === 'true';

    const predictions = await stagePredictor.generatePredictions({
      minConfidence,
      includeReflection
    });

    res.json({
      success: true,
      count: predictions.length,
      predictions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/predictor/transitions/:intentId
 * Get stage transition prediction for a specific intent
 *
 * Query params:
 * - minConfidence: Minimum confidence threshold (default: 0.3, lower for single intent)
 */
router.get('/transitions/:intentId', async (req, res) => {
  try {
    const { intentId } = req.params;
    const minConfidence = parseFloat(req.query.minConfidence) || 0.3;

    const predictions = await stagePredictor.generatePredictions({
      intentId,
      minConfidence,
      includeReflection: false
    });

    if (predictions.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No prediction available for this intent',
        intentId
      });
    }

    res.json({
      success: true,
      prediction: predictions[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating prediction for intent:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/predictor/feedback
 * Submit feedback on a prediction (user accepted or rejected)
 *
 * Body:
 * {
 *   "predictionId": "pred_123_456",
 *   "intentId": "intent_123",
 *   "predictedStage": "structuring",
 *   "accepted": true
 * }
 */
router.post('/feedback', async (req, res) => {
  try {
    const { predictionId, intentId, predictedStage, accepted } = req.body;

    if (!predictionId || !intentId || !predictedStage || typeof accepted !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: predictionId, intentId, predictedStage, accepted'
      });
    }

    const result = await stagePredictor.recordFeedback(predictionId, {
      accepted,
      intentId,
      predictedStage
    });

    res.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error recording feedback:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/predictor/statistics
 * Get predictor statistics and historical patterns
 */
router.get('/statistics', async (req, res) => {
  try {
    const stats = await stagePredictor.getStatistics();

    res.json({
      success: true,
      statistics: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching predictor statistics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
