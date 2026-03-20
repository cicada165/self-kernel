/**
 * Plugin Manager
 * Extensible plugin architecture for Self Kernel
 *
 * Plugins can extend the kernel with new data sources, integrations,
 * and MCP capabilities.
 */

import { EventEmitter } from 'events';
import storage from '../storage.js';

class PluginManager extends EventEmitter {
  constructor() {
    super();
    this.plugins = new Map();
    this.hooks = new Map();
    this.initialized = false;
  }

  /**
   * Register a plugin
   */
  register(plugin) {
    if (!plugin.id) {
      throw new Error('Plugin must have an id');
    }

    if (!plugin.name) {
      throw new Error('Plugin must have a name');
    }

    if (!plugin.version) {
      throw new Error('Plugin must have a version');
    }

    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }

    // Validate plugin interface
    if (plugin.onLoad && typeof plugin.onLoad !== 'function') {
      throw new Error('Plugin onLoad must be a function');
    }

    if (plugin.onUnload && typeof plugin.onUnload !== 'function') {
      throw new Error('Plugin onUnload must be a function');
    }

    this.plugins.set(plugin.id, {
      ...plugin,
      loaded: false,
      enabled: false,
      error: null
    });

    console.log(`[PluginManager] Registered plugin: ${plugin.name} v${plugin.version}`);

    this.emit('plugin:registered', { pluginId: plugin.id });

    return true;
  }

  /**
   * Load a plugin
   */
  async load(pluginId) {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (plugin.loaded) {
      console.log(`[PluginManager] Plugin ${pluginId} already loaded`);
      return true;
    }

    try {
      console.log(`[PluginManager] Loading plugin: ${plugin.name}`);

      // Create plugin context
      const context = this.createPluginContext(pluginId);

      // Call plugin's onLoad hook
      if (plugin.onLoad) {
        await plugin.onLoad(context);
      }

      // Register plugin hooks
      if (plugin.hooks) {
        for (const [hookName, hookHandler] of Object.entries(plugin.hooks)) {
          this.registerHook(pluginId, hookName, hookHandler);
        }
      }

      plugin.loaded = true;
      plugin.enabled = true;
      plugin.context = context;

      console.log(`[PluginManager] Plugin ${pluginId} loaded successfully`);

      this.emit('plugin:loaded', { pluginId });

      return true;

    } catch (error) {
      console.error(`[PluginManager] Failed to load plugin ${pluginId}:`, error);
      plugin.error = error.message;
      this.emit('plugin:error', { pluginId, error: error.message });
      throw error;
    }
  }

  /**
   * Unload a plugin
   */
  async unload(pluginId) {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!plugin.loaded) {
      return true;
    }

    try {
      console.log(`[PluginManager] Unloading plugin: ${plugin.name}`);

      // Call plugin's onUnload hook
      if (plugin.onUnload) {
        await plugin.onUnload(plugin.context);
      }

      // Unregister plugin hooks
      if (plugin.hooks) {
        for (const hookName of Object.keys(plugin.hooks)) {
          this.unregisterHook(pluginId, hookName);
        }
      }

      plugin.loaded = false;
      plugin.enabled = false;
      plugin.context = null;

      console.log(`[PluginManager] Plugin ${pluginId} unloaded`);

      this.emit('plugin:unloaded', { pluginId });

      return true;

    } catch (error) {
      console.error(`[PluginManager] Failed to unload plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Create plugin context
   */
  createPluginContext(pluginId) {
    return {
      pluginId,

      // Storage API
      storage: {
        get: (collection, id) => storage.get(collection, id),
        list: (collection) => storage.list(collection),
        create: (collection, data) => storage.create(collection, data),
        update: (collection, id, data) => storage.update(collection, id, data),
        delete: (collection, id) => storage.delete(collection, id),
      },

      // Event API
      emit: (event, data) => {
        this.emit(`plugin:${pluginId}:${event}`, data);
      },

      on: (event, handler) => {
        this.on(`plugin:${pluginId}:${event}`, handler);
      },

      // Hook API
      registerHook: (hookName, handler) => {
        this.registerHook(pluginId, hookName, handler);
      },

      // HTTP API helpers
      http: {
        fetch: async (url, options) => {
          return fetch(url, options);
        }
      },

      // Logging
      log: (...args) => console.log(`[Plugin:${pluginId}]`, ...args),
      error: (...args) => console.error(`[Plugin:${pluginId}]`, ...args),
      warn: (...args) => console.warn(`[Plugin:${pluginId}]`, ...args),
    };
  }

  /**
   * Register a hook handler
   */
  registerHook(pluginId, hookName, handler) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }

    this.hooks.get(hookName).push({
      pluginId,
      handler
    });

    console.log(`[PluginManager] Registered hook: ${hookName} (plugin: ${pluginId})`);
  }

  /**
   * Unregister a hook handler
   */
  unregisterHook(pluginId, hookName) {
    if (!this.hooks.has(hookName)) return;

    const handlers = this.hooks.get(hookName);
    const filtered = handlers.filter(h => h.pluginId !== pluginId);

    if (filtered.length === 0) {
      this.hooks.delete(hookName);
    } else {
      this.hooks.set(hookName, filtered);
    }

    console.log(`[PluginManager] Unregistered hook: ${hookName} (plugin: ${pluginId})`);
  }

  /**
   * Execute hooks
   */
  async executeHook(hookName, data) {
    if (!this.hooks.has(hookName)) {
      return data;
    }

    const handlers = this.hooks.get(hookName);
    let result = data;

    for (const { pluginId, handler } of handlers) {
      try {
        const plugin = this.plugins.get(pluginId);

        if (!plugin || !plugin.enabled) {
          continue;
        }

        result = await handler(result, plugin.context);

      } catch (error) {
        console.error(`[PluginManager] Hook ${hookName} failed in plugin ${pluginId}:`, error);
        // Continue with other handlers
      }
    }

    return result;
  }

  /**
   * Get plugin info
   */
  getPlugin(pluginId) {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      return null;
    }

    return {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      loaded: plugin.loaded,
      enabled: plugin.enabled,
      error: plugin.error,
      capabilities: plugin.capabilities || []
    };
  }

  /**
   * List all plugins
   */
  listPlugins() {
    const plugins = [];

    for (const [id, plugin] of this.plugins.entries()) {
      plugins.push(this.getPlugin(id));
    }

    return plugins;
  }

  /**
   * Enable a plugin
   */
  async enable(pluginId) {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    if (!plugin.loaded) {
      await this.load(pluginId);
    }

    plugin.enabled = true;
    this.emit('plugin:enabled', { pluginId });

    return true;
  }

  /**
   * Disable a plugin
   */
  async disable(pluginId) {
    const plugin = this.plugins.get(pluginId);

    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    plugin.enabled = false;
    this.emit('plugin:disabled', { pluginId });

    return true;
  }

  /**
   * Get plugin statistics
   */
  getStats() {
    const stats = {
      total: this.plugins.size,
      loaded: 0,
      enabled: 0,
      errors: 0,
      hooks: this.hooks.size
    };

    for (const plugin of this.plugins.values()) {
      if (plugin.loaded) stats.loaded++;
      if (plugin.enabled) stats.enabled++;
      if (plugin.error) stats.errors++;
    }

    return stats;
  }

  /**
   * Initialize plugin manager
   */
  async init() {
    if (this.initialized) {
      return;
    }

    console.log('[PluginManager] Initializing...');

    // Load built-in plugins
    // These would be imported from separate files

    this.initialized = true;
    console.log('[PluginManager] Initialized');
  }
}

// Export singleton
export const pluginManager = new PluginManager();
export default pluginManager;
