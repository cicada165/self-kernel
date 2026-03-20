/**
 * GitHub Integration Plugin
 * Syncs GitHub issues as intents and PRs as milestones
 */

export const githubPlugin = {
  id: 'github-integration',
  name: 'GitHub Integration',
  version: '1.0.0',
  description: 'Import GitHub issues as intents and sync PR status',
  author: 'Self Kernel',
  capabilities: ['data-source', 'webhook'],

  config: {
    token: null,
    repos: [],
    syncInterval: 300000, // 5 minutes
    autoSync: false
  },

  state: {
    lastSync: null,
    syncTimer: null
  },

  /**
   * Initialize plugin
   */
  async onLoad(context) {
    context.log('GitHub plugin loaded');

    // Load config from storage
    const savedConfig = await this.loadConfig(context);
    if (savedConfig) {
      this.config = { ...this.config, ...savedConfig };
    }

    // Start auto-sync if enabled
    if (this.config.autoSync && this.config.token) {
      this.startAutoSync(context);
    }
  },

  /**
   * Cleanup plugin
   */
  async onUnload(context) {
    context.log('GitHub plugin unloading');

    // Stop auto-sync
    if (this.state.syncTimer) {
      clearInterval(this.state.syncTimer);
    }
  },

  /**
   * Plugin hooks
   */
  hooks: {
    // Hook into intent creation to enrich with GitHub data
    'intent:created': async (intent, context) => {
      // Check if intent has GitHub issue reference
      const issueMatch = intent.target.match(/#(\d+)/);

      if (issueMatch && context.pluginId === 'github-integration') {
        const issueNumber = issueMatch[1];
        context.log(`Enriching intent with GitHub issue #${issueNumber}`);

        // Fetch GitHub issue data
        // (In real implementation, would call GitHub API)

        intent.metadata = intent.metadata || {};
        intent.metadata.github = {
          issueNumber,
          synced: true
        };
      }

      return intent;
    }
  },

  /**
   * Load configuration
   */
  async loadConfig(context) {
    try {
      const meta = context.storage.get('kernel-meta', 'kernel');
      return meta?.plugins?.github;
    } catch (error) {
      return null;
    }
  },

  /**
   * Save configuration
   */
  async saveConfig(context, config) {
    const meta = context.storage.get('kernel-meta', 'kernel') || { id: 'kernel', plugins: {} };
    meta.plugins = meta.plugins || {};
    meta.plugins.github = config;
    context.storage.update('kernel-meta', 'kernel', meta);
  },

  /**
   * Configure plugin
   */
  async configure(context, config) {
    this.config = { ...this.config, ...config };
    await this.saveConfig(context, this.config);

    context.log('GitHub plugin configured');

    // Restart auto-sync if needed
    if (this.config.autoSync && this.config.token) {
      this.stopAutoSync();
      this.startAutoSync(context);
    }

    return this.config;
  },

  /**
   * Sync GitHub data
   */
  async sync(context) {
    if (!this.config.token) {
      throw new Error('GitHub token not configured');
    }

    if (this.config.repos.length === 0) {
      throw new Error('No repositories configured');
    }

    context.log('Starting GitHub sync...');

    const results = {
      intentsCreated: 0,
      intentsUpdated: 0,
      errors: []
    };

    for (const repo of this.config.repos) {
      try {
        await this.syncRepo(context, repo, results);
      } catch (error) {
        context.error(`Failed to sync repo ${repo}:`, error);
        results.errors.push({ repo, error: error.message });
      }
    }

    this.state.lastSync = new Date().toISOString();

    context.log(`GitHub sync complete: ${results.intentsCreated} created, ${results.intentsUpdated} updated`);

    context.emit('sync:complete', results);

    return results;
  },

  /**
   * Sync a single repository
   */
  async syncRepo(context, repo, results) {
    context.log(`Syncing repository: ${repo}`);

    // Fetch GitHub issues
    const issues = await this.fetchIssues(repo);

    for (const issue of issues) {
      await this.syncIssue(context, repo, issue, results);
    }
  },

  /**
   * Fetch GitHub issues
   */
  async fetchIssues(repo) {
    // In real implementation, would call GitHub API
    // For now, return mock data

    context.log(`Fetching issues from ${repo}...`);

    return [
      {
        number: 1,
        title: 'Example issue',
        state: 'open',
        labels: ['bug'],
        created_at: new Date().toISOString(),
        html_url: `https://github.com/${repo}/issues/1`
      }
    ];
  },

  /**
   * Sync a single GitHub issue
   */
  async syncIssue(context, repo, issue, results) {
    // Check if intent already exists for this issue
    const existingIntents = context.storage.list('intents');
    const existing = existingIntents.find(i =>
      i.metadata?.github?.issueNumber === issue.number &&
      i.metadata?.github?.repo === repo
    );

    if (existing) {
      // Update existing intent
      existing.target = `[GitHub #${issue.number}] ${issue.title}`;
      existing.stage = issue.state === 'closed' ? 'DECISION' : 'REFINING';
      existing.updatedAt = new Date().toISOString();

      context.storage.update('intents', existing.id, existing);
      results.intentsUpdated++;

    } else {
      // Create new intent
      const intent = {
        id: context.storage.generateId(),
        target: `[GitHub #${issue.number}] ${issue.title}`,
        stage: 'REFINING',
        priority: issue.labels.includes('urgent') ? 'high' : 'medium',
        tags: ['github', repo, ...issue.labels],
        createdAt: issue.created_at,
        updatedAt: new Date().toISOString(),
        metadata: {
          source: 'github-plugin',
          github: {
            issueNumber: issue.number,
            repo,
            url: issue.html_url,
            state: issue.state
          }
        }
      };

      context.storage.create('intents', intent);
      results.intentsCreated++;
    }
  },

  /**
   * Start auto-sync
   */
  startAutoSync(context) {
    if (this.state.syncTimer) {
      return;
    }

    context.log(`Starting auto-sync (interval: ${this.config.syncInterval}ms)`);

    this.state.syncTimer = setInterval(() => {
      this.sync(context).catch(error => {
        context.error('Auto-sync failed:', error);
      });
    }, this.config.syncInterval);
  },

  /**
   * Stop auto-sync
   */
  stopAutoSync() {
    if (this.state.syncTimer) {
      clearInterval(this.state.syncTimer);
      this.state.syncTimer = null;
    }
  },

  /**
   * Get plugin status
   */
  getStatus() {
    return {
      configured: !!this.config.token,
      repos: this.config.repos.length,
      autoSync: this.config.autoSync,
      lastSync: this.state.lastSync,
      nextSync: this.state.syncTimer ? new Date(Date.now() + this.config.syncInterval).toISOString() : null
    };
  }
};
