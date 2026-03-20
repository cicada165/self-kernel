/**
 * Command Palette Component
 * Quick navigation and actions with Cmd+K / Ctrl+K
 */

export class CommandPalette {
  constructor() {
    this.isOpen = false;
    this.selectedIndex = 0;
    this.filteredCommands = [];
    this.recentCommands = this.loadRecentCommands();

    // Define all available commands
    this.commands = [
      // Panels
      { id: 'nav-overview', label: 'Overview', description: 'Kernel status and cognitive stages', icon: '🧠', action: () => this.navigateToPanel('overview') },
      { id: 'nav-search', label: 'Universal Search', description: 'Search across all collections', icon: '🔍', action: () => this.navigateToPanel('search') },
      { id: 'nav-graph', label: 'Knowledge Graph', description: 'Interactive visualization', icon: '🌐', action: () => this.navigateToPanel('graph') },
      { id: 'nav-timeline', label: 'Intent Timeline', description: 'FSM stage progression', icon: '⏱️', action: () => this.navigateToPanel('timeline') },
      { id: 'nav-trajectory', label: 'Trajectory Builder', description: 'Plan milestones and paths', icon: '🛤️', action: () => this.navigateToPanel('trajectoryBuilder') },
      { id: 'nav-thinking', label: 'Thinking Chains', description: 'Cross-session thought threads', icon: '💭', action: () => this.navigateToPanel('thinking') },
      { id: 'nav-persons', label: 'Persons', description: 'Entity management', icon: '👤', action: () => this.navigateToPanel('persons') },
      { id: 'nav-relationships', label: 'Relationships', description: 'Connection visualization', icon: '🔗', action: () => this.navigateToPanel('relationships') },
      { id: 'nav-inspector', label: 'Data Inspector', description: 'View and edit JSON', icon: '🔬', action: () => this.navigateToPanel('inspector') },
      { id: 'nav-proxy', label: 'Intent Proxy', description: 'AI suggestions', icon: '🤖', action: () => this.navigateToPanel('intentProxy') },
      { id: 'nav-strategies', label: 'Governance Rules', description: 'Autonomous policies', icon: '⚙️', action: () => this.navigateToPanel('strategies') },
      { id: 'nav-automations', label: 'OpenClaw Automations', description: 'Staged execution payloads', icon: '🦾', action: () => this.navigateToPanel('automations') },
      { id: 'nav-insights', label: 'Insights & Analytics', description: 'Pattern analysis', icon: '📊', action: () => this.navigateToPanel('insights') },
      { id: 'nav-mcp', label: 'MCP Server', description: 'Agent connections', icon: '🔌', action: () => this.navigateToPanel('mcp') },
      { id: 'nav-fsm', label: 'FSM & Auto-Labeler', description: 'Intent stage management', icon: '🔄', action: () => this.navigateToPanel('fsm') },
      { id: 'nav-health', label: 'System Health', description: 'Component monitoring', icon: '❤️', action: () => this.navigateToPanel('health') },

      // Quick Actions
      { id: 'action-ingest', label: 'Quick Ingest', description: 'Process raw thought immediately', icon: '🎙️', action: () => this.focusQuickIngest() },
      { id: 'action-create-intent', label: 'Create Intent', description: 'Add new goal or question', icon: '🎯', action: () => this.createIntent() },
      { id: 'action-backup', label: 'Create Backup', description: 'Save current state', icon: '💾', action: () => this.createBackup() },
      { id: 'action-refresh', label: 'Refresh Dashboard', description: 'Reload all panels', icon: '🔄', action: () => window.location.reload() }
    ];

    this.createUI();
    this.attachEventListeners();
  }

  loadRecentCommands() {
    try {
      const recent = localStorage.getItem('commandPalette_recent');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  }

  saveRecentCommand(commandId) {
    this.recentCommands = [
      commandId,
      ...this.recentCommands.filter(id => id !== commandId)
    ].slice(0, 5);
    localStorage.setItem('commandPalette_recent', JSON.stringify(this.recentCommands));
  }

  createUI() {
    const overlay = document.createElement('div');
    overlay.id = 'command-palette-overlay';
    overlay.className = 'command-palette-overlay';
    overlay.style.display = 'none';

    overlay.innerHTML = `
      <div class="command-palette-modal">
        <div class="command-palette-search">
          <span class="command-palette-icon">⌘</span>
          <input type="text" id="command-palette-input" placeholder="Type a command or search..." autocomplete="off" />
          <span class="command-palette-close" id="command-palette-close">ESC</span>
        </div>

        <div class="command-palette-results" id="command-palette-results">
          <!-- Results will be rendered here -->
        </div>

        <div class="command-palette-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Select</span>
          <span><kbd>ESC</kbd> Close</span>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.overlay = overlay;
    this.input = overlay.querySelector('#command-palette-input');
    this.results = overlay.querySelector('#command-palette-results');
  }

  attachEventListeners() {
    // Global keyboard listener for Cmd+K / Ctrl+K
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Close on overlay click
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.close();
      }
    });

    // Close button
    this.overlay.querySelector('#command-palette-close').addEventListener('click', () => {
      this.close();
    });

    // Input listener for search
    this.input.addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    // Keyboard navigation
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.selectNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.selectPrevious();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this.executeSelected();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.overlay.style.display = 'flex';
    this.input.value = '';
    this.input.focus();
    this.selectedIndex = 0;
    this.renderResults();
  }

  close() {
    this.isOpen = false;
    this.overlay.style.display = 'none';
    this.input.value = '';
  }

  handleSearch(query) {
    this.selectedIndex = 0;

    if (!query.trim()) {
      this.filteredCommands = [];
      this.renderResults();
      return;
    }

    // Simple fuzzy search
    const lowerQuery = query.toLowerCase();
    this.filteredCommands = this.commands
      .map(cmd => {
        const labelMatch = cmd.label.toLowerCase().includes(lowerQuery);
        const descMatch = cmd.description.toLowerCase().includes(lowerQuery);
        const score = labelMatch ? 10 : (descMatch ? 5 : 0);
        return { ...cmd, score };
      })
      .filter(cmd => cmd.score > 0)
      .sort((a, b) => b.score - a.score);

    this.renderResults();
  }

  renderResults() {
    const commandsToShow = this.filteredCommands.length > 0
      ? this.filteredCommands
      : this.getRecentCommandsObj();

    if (commandsToShow.length === 0) {
      this.results.innerHTML = '<div class="command-palette-empty">No commands found. Try searching for panels or actions.</div>';
      return;
    }

    const title = this.filteredCommands.length > 0 ? '' : '<div class="command-palette-section-title">Recent</div>';

    this.results.innerHTML = title + commandsToShow
      .map((cmd, index) => `
        <div class="command-palette-item ${index === this.selectedIndex ? 'selected' : ''}" data-index="${index}">
          <span class="command-palette-item-icon">${cmd.icon}</span>
          <div class="command-palette-item-content">
            <div class="command-palette-item-label">${cmd.label}</div>
            <div class="command-palette-item-description">${cmd.description}</div>
          </div>
        </div>
      `)
      .join('');

    // Add click handlers
    this.results.querySelectorAll('.command-palette-item').forEach((el, index) => {
      el.addEventListener('click', () => {
        this.selectedIndex = index;
        this.executeSelected();
      });
    });
  }

  getRecentCommandsObj() {
    return this.recentCommands
      .map(id => this.commands.find(cmd => cmd.id === id))
      .filter(cmd => cmd !== undefined)
      .slice(0, 5);
  }

  selectNext() {
    const maxIndex = (this.filteredCommands.length > 0 ? this.filteredCommands.length : this.getRecentCommandsObj().length) - 1;
    this.selectedIndex = Math.min(this.selectedIndex + 1, maxIndex);
    this.renderResults();
  }

  selectPrevious() {
    this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
    this.renderResults();
  }

  executeSelected() {
    const commandsToShow = this.filteredCommands.length > 0
      ? this.filteredCommands
      : this.getRecentCommandsObj();

    const command = commandsToShow[this.selectedIndex];
    if (command) {
      this.saveRecentCommand(command.id);
      command.action();
      this.close();
    }
  }

  // Action handlers
  navigateToPanel(panelName) {
    const button = document.querySelector(`[data-panel="${panelName}"]`);
    if (button) {
      button.click();
    }
  }

  focusQuickIngest() {
    this.navigateToPanel('overview');
    setTimeout(() => {
      const input = document.querySelector('#ingest-input');
      if (input) input.focus();
    }, 100);
  }

  createIntent() {
    // This would open a modal or navigate to intents panel
    // For now, just navigate to overview where quick ingest is
    this.focusQuickIngest();
  }

  async createBackup() {
    try {
      await fetch('http://localhost:3000/api/system/backup', { method: 'POST' });
      alert('Backup created successfully!');
    } catch (err) {
      alert('Failed to create backup: ' + err.message);
    }
  }
}
