/**
 * Plugins API
 * Manage and configure plugins
 */

import express from 'express';
import { pluginManager } from '../plugins/PluginManager.js';
import { githubPlugin } from '../plugins/github-plugin.js';

const router = express.Router();

/**
 * GET /api/plugins
 * List all plugins
 */
router.get('/', (req, res) => {
  try {
    const plugins = pluginManager.listPlugins();
    const stats = pluginManager.getStats();

    res.json({
      plugins,
      stats
    });

  } catch (error) {
    console.error('Error listing plugins:', error);
    res.status(500).json({ error: 'Failed to list plugins' });
  }
});

/**
 * GET /api/plugins/:id
 * Get plugin details
 */
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const plugin = pluginManager.getPlugin(id);

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    res.json({ plugin });

  } catch (error) {
    console.error('Error getting plugin:', error);
    res.status(500).json({ error: 'Failed to get plugin' });
  }
});

/**
 * POST /api/plugins/:id/load
 * Load a plugin
 */
router.post('/:id/load', async (req, res) => {
  try {
    const { id } = req.params;

    await pluginManager.load(id);

    res.json({
      success: true,
      message: `Plugin ${id} loaded`,
      plugin: pluginManager.getPlugin(id)
    });

  } catch (error) {
    console.error('Error loading plugin:', error);
    res.status(500).json({ error: error.message || 'Failed to load plugin' });
  }
});

/**
 * POST /api/plugins/:id/unload
 * Unload a plugin
 */
router.post('/:id/unload', async (req, res) => {
  try {
    const { id } = req.params;

    await pluginManager.unload(id);

    res.json({
      success: true,
      message: `Plugin ${id} unloaded`,
      plugin: pluginManager.getPlugin(id)
    });

  } catch (error) {
    console.error('Error unloading plugin:', error);
    res.status(500).json({ error: error.message || 'Failed to unload plugin' });
  }
});

/**
 * POST /api/plugins/:id/enable
 * Enable a plugin
 */
router.post('/:id/enable', async (req, res) => {
  try {
    const { id } = req.params;

    await pluginManager.enable(id);

    res.json({
      success: true,
      message: `Plugin ${id} enabled`,
      plugin: pluginManager.getPlugin(id)
    });

  } catch (error) {
    console.error('Error enabling plugin:', error);
    res.status(500).json({ error: error.message || 'Failed to enable plugin' });
  }
});

/**
 * POST /api/plugins/:id/disable
 * Disable a plugin
 */
router.post('/:id/disable', async (req, res) => {
  try {
    const { id } = req.params;

    await pluginManager.disable(id);

    res.json({
      success: true,
      message: `Plugin ${id} disabled`,
      plugin: pluginManager.getPlugin(id)
    });

  } catch (error) {
    console.error('Error disabling plugin:', error);
    res.status(500).json({ error: error.message || 'Failed to disable plugin' });
  }
});

/**
 * POST /api/plugins/:id/configure
 * Configure a plugin
 *
 * Body: plugin-specific configuration
 */
router.post('/:id/configure', async (req, res) => {
  try {
    const { id } = req.params;
    const config = req.body;

    const plugin = pluginManager.getPlugin(id);

    if (!plugin) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    // Get the plugin instance
    const pluginInstance = pluginManager.plugins.get(id);

    if (!pluginInstance.configure) {
      return res.status(400).json({ error: 'Plugin does not support configuration' });
    }

    const result = await pluginInstance.configure(pluginInstance.context, config);

    res.json({
      success: true,
      message: `Plugin ${id} configured`,
      config: result
    });

  } catch (error) {
    console.error('Error configuring plugin:', error);
    res.status(500).json({ error: error.message || 'Failed to configure plugin' });
  }
});

/**
 * POST /api/plugins/:id/action
 * Execute a plugin action
 *
 * Body:
 * - action: action name
 * - params: action parameters
 */
router.post('/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, params } = req.body;

    const pluginInstance = pluginManager.plugins.get(id);

    if (!pluginInstance) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    if (!pluginInstance.enabled) {
      return res.status(400).json({ error: 'Plugin is not enabled' });
    }

    // Execute the action
    if (!pluginInstance[action] || typeof pluginInstance[action] !== 'function') {
      return res.status(400).json({ error: `Plugin does not support action: ${action}` });
    }

    const result = await pluginInstance[action](pluginInstance.context, params);

    res.json({
      success: true,
      result
    });

  } catch (error) {
    console.error('Error executing plugin action:', error);
    res.status(500).json({ error: error.message || 'Failed to execute action' });
  }
});

/**
 * GET /api/plugins/:id/status
 * Get plugin status
 */
router.get('/:id/status', (req, res) => {
  try {
    const { id } = req.params;

    const pluginInstance = pluginManager.plugins.get(id);

    if (!pluginInstance) {
      return res.status(404).json({ error: 'Plugin not found' });
    }

    const status = pluginInstance.getStatus
      ? pluginInstance.getStatus()
      : { enabled: pluginInstance.enabled, loaded: pluginInstance.loaded };

    res.json({ status });

  } catch (error) {
    console.error('Error getting plugin status:', error);
    res.status(500).json({ error: 'Failed to get plugin status' });
  }
});

/**
 * GET /api/plugins/stats
 * Get plugin system statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = pluginManager.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error getting plugin stats:', error);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

/**
 * Initialize plugins on startup
 */
export async function initPlugins() {
  console.log('[Plugins] Initializing plugin system...');

  // Initialize plugin manager
  await pluginManager.init();

  // Register built-in plugins
  pluginManager.register(githubPlugin);

  console.log('[Plugins] Plugin system initialized');
  console.log(`[Plugins] Registered plugins: ${pluginManager.listPlugins().map(p => p.name).join(', ')}`);
}

export default router;
