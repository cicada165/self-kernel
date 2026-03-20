/**
 * Collaborative Sharing API
 * Share intents, trajectories, and thinking chains via read-only links
 */

import express from 'express';
import storage from '../storage.js';
import crypto from 'crypto';

const router = express.Router();

// In-memory store for share tokens (could be persisted to file)
const shareTokens = new Map();

/**
 * Generate a secure share token
 */
function generateShareToken() {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * POST /api/sharing/intent/:id
 * Create a share link for an intent
 *
 * Body:
 * - expiry: optional expiry time in ms (default: 30 days)
 * - password: optional password protection
 */
router.post('/intent/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { expiry, password } = req.body || {};

    const intent = storage.get('intents', id);
    if (!intent) {
      return res.status(404).json({ error: 'Intent not found' });
    }

    const token = generateShareToken();
    const expiryMs = expiry || (30 * 24 * 60 * 60 * 1000); // 30 days default

    const share = {
      token,
      type: 'intent',
      resourceId: id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiryMs).toISOString(),
      password: password || null,
      accessCount: 0,
      lastAccessed: null
    };

    shareTokens.set(token, share);

    const shareUrl = `http://localhost:3001/share/${token}`;

    res.json({
      success: true,
      share: {
        token,
        url: shareUrl,
        expiresAt: share.expiresAt,
        hasPassword: !!password
      }
    });

  } catch (error) {
    console.error('Error creating intent share:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

/**
 * POST /api/sharing/trajectory/:id
 * Create a share link for a trajectory
 */
router.post('/trajectory/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { expiry, password } = req.body || {};

    const trajectory = storage.get('trajectories', id);
    if (!trajectory) {
      return res.status(404).json({ error: 'Trajectory not found' });
    }

    const token = generateShareToken();
    const expiryMs = expiry || (30 * 24 * 60 * 60 * 1000);

    const share = {
      token,
      type: 'trajectory',
      resourceId: id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiryMs).toISOString(),
      password: password || null,
      accessCount: 0,
      lastAccessed: null
    };

    shareTokens.set(token, share);

    const shareUrl = `http://localhost:3001/share/${token}`;

    res.json({
      success: true,
      share: {
        token,
        url: shareUrl,
        expiresAt: share.expiresAt,
        hasPassword: !!password
      }
    });

  } catch (error) {
    console.error('Error creating trajectory share:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

/**
 * POST /api/sharing/thinking-chain/:id
 * Create a share link for a thinking chain
 */
router.post('/thinking-chain/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { expiry, password } = req.body || {};

    const chain = storage.get('thinking-chains', id);
    if (!chain) {
      return res.status(404).json({ error: 'Thinking chain not found' });
    }

    const token = generateShareToken();
    const expiryMs = expiry || (30 * 24 * 60 * 60 * 1000);

    const share = {
      token,
      type: 'thinking-chain',
      resourceId: id,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + expiryMs).toISOString(),
      password: password || null,
      accessCount: 0,
      lastAccessed: null
    };

    shareTokens.set(token, share);

    const shareUrl = `http://localhost:3001/share/${token}`;

    res.json({
      success: true,
      share: {
        token,
        url: shareUrl,
        expiresAt: share.expiresAt,
        hasPassword: !!password
      }
    });

  } catch (error) {
    console.error('Error creating thinking chain share:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

/**
 * GET /api/sharing/:token
 * Access a shared resource
 *
 * Query params:
 * - password: optional password if share is protected
 */
router.get('/:token', (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.query;

    const share = shareTokens.get(token);

    if (!share) {
      return res.status(404).json({ error: 'Share link not found or expired' });
    }

    // Check expiry
    if (new Date() > new Date(share.expiresAt)) {
      shareTokens.delete(token);
      return res.status(410).json({ error: 'Share link has expired' });
    }

    // Check password
    if (share.password && share.password !== password) {
      return res.status(403).json({ error: 'Invalid password', requiresPassword: true });
    }

    // Update access stats
    share.accessCount++;
    share.lastAccessed = new Date().toISOString();

    // Get the shared resource
    let resource;
    let relatedData = {};

    switch (share.type) {
      case 'intent':
        resource = storage.get('intents', share.resourceId);

        // Get related trajectory if exists
        if (resource.trajectoryId) {
          relatedData.trajectory = storage.get('trajectories', resource.trajectoryId);
        }

        // Get related persons
        const intentRelations = storage.list('relations').filter(r =>
          (r.sourceId === share.resourceId && r.sourceType === 'intent') ||
          (r.targetId === share.resourceId && r.targetType === 'intent')
        );

        relatedData.persons = intentRelations.map(r => {
          const personId = r.sourceType === 'person' ? r.sourceId : r.targetId;
          return storage.get('persons', personId);
        }).filter(Boolean);

        break;

      case 'trajectory':
        resource = storage.get('trajectories', share.resourceId);

        // Get associated intents
        const intentIds = resource.milestones?.flatMap(m => m.intentIds || []) || [];
        relatedData.intents = intentIds.map(id => storage.get('intents', id)).filter(Boolean);

        break;

      case 'thinking-chain':
        resource = storage.get('thinking-chains', share.resourceId);

        // Get related intents
        const chainRelations = storage.list('relations').filter(r =>
          (r.sourceId === share.resourceId && r.sourceType === 'thinking-chain') ||
          (r.targetId === share.resourceId && r.targetType === 'thinking-chain')
        );

        relatedData.intents = chainRelations.map(r => {
          const intentId = r.sourceType === 'intent' ? r.sourceId : r.targetId;
          return storage.get('intents', intentId);
        }).filter(Boolean);

        break;

      default:
        return res.status(400).json({ error: 'Unknown share type' });
    }

    if (!resource) {
      return res.status(404).json({ error: 'Shared resource no longer exists' });
    }

    res.json({
      success: true,
      share: {
        type: share.type,
        createdAt: share.createdAt,
        expiresAt: share.expiresAt,
        accessCount: share.accessCount
      },
      resource,
      relatedData
    });

  } catch (error) {
    console.error('Error accessing shared resource:', error);
    res.status(500).json({ error: 'Failed to access shared resource' });
  }
});

/**
 * DELETE /api/sharing/:token
 * Revoke a share link
 */
router.delete('/:token', (req, res) => {
  try {
    const { token } = req.params;

    if (!shareTokens.has(token)) {
      return res.status(404).json({ error: 'Share link not found' });
    }

    shareTokens.delete(token);

    res.json({
      success: true,
      message: 'Share link revoked'
    });

  } catch (error) {
    console.error('Error revoking share:', error);
    res.status(500).json({ error: 'Failed to revoke share link' });
  }
});

/**
 * GET /api/sharing
 * List all active shares
 */
router.get('/', (req, res) => {
  try {
    const now = new Date();
    const activeShares = [];

    // Clean up expired shares and collect active ones
    for (const [token, share] of shareTokens.entries()) {
      if (new Date(share.expiresAt) > now) {
        activeShares.push({
          token,
          type: share.type,
          resourceId: share.resourceId,
          createdAt: share.createdAt,
          expiresAt: share.expiresAt,
          hasPassword: !!share.password,
          accessCount: share.accessCount,
          lastAccessed: share.lastAccessed,
          url: `http://localhost:3001/share/${token}`
        });
      } else {
        shareTokens.delete(token);
      }
    }

    res.json({
      shares: activeShares,
      count: activeShares.length
    });

  } catch (error) {
    console.error('Error listing shares:', error);
    res.status(500).json({ error: 'Failed to list shares' });
  }
});

/**
 * GET /api/sharing/stats
 * Get sharing statistics
 */
router.get('/stats', (req, res) => {
  try {
    const now = new Date();
    let total = 0;
    let expired = 0;
    let active = 0;
    let totalAccesses = 0;

    const typeCount = {
      intent: 0,
      trajectory: 0,
      'thinking-chain': 0
    };

    for (const [token, share] of shareTokens.entries()) {
      total++;
      totalAccesses += share.accessCount;

      if (new Date(share.expiresAt) > now) {
        active++;
        typeCount[share.type] = (typeCount[share.type] || 0) + 1;
      } else {
        expired++;
      }
    }

    res.json({
      stats: {
        total,
        active,
        expired,
        totalAccesses,
        byType: typeCount
      }
    });

  } catch (error) {
    console.error('Error getting share stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

export default router;
