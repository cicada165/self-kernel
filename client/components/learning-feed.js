/**
 * Learning Feed — Shows What the Kernel Has Learned
 * Displays learning insights and parameter changes
 */

export class LearningFeed {
    constructor() {
        this.isOpen = false;
        this.learningEvents = this.loadFromStorage();
        this.render();
        this.attachEvents();
        this.startPolling();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('self-kernel-learning-events');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('self-kernel-learning-events', JSON.stringify(this.learningEvents));
        } catch (error) {
            console.error('Failed to save learning events:', error);
        }
    }

    render() {
        const container = document.createElement('div');
        container.id = 'learning-feed-container';
        container.innerHTML = `
            <button class="learning-feed-toggle" id="learning-feed-toggle" title="Learning Feed (Press L)">
                <span class="feed-icon">🌱</span>
                <span class="feed-badge" id="learning-feed-badge">0</span>
            </button>
            <div class="learning-feed-panel" id="learning-feed-panel">
                <div class="learning-feed-header">
                    <div class="feed-title">
                        <span class="feed-icon-large">🌱</span>
                        <div>
                            <h3>Learning Feed</h3>
                            <p class="feed-subtitle">What your kernel learned</p>
                        </div>
                    </div>
                    <button class="learning-feed-close" id="learning-feed-close">×</button>
                </div>
                <div class="learning-feed-body" id="learning-feed-body">
                    ${this.renderEvents()}
                </div>
                <div class="learning-feed-footer">
                    <button class="btn btn-sm" id="learning-feed-clear">Clear All</button>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        this.updateBadge();
    }

    renderEvents() {
        if (this.learningEvents.length === 0) {
            return `
                <div class="learning-empty">
                    <span class="empty-icon">🌱</span>
                    <p>Your kernel is learning from your behavior.</p>
                    <p class="empty-hint">Learning insights will appear here as you interact with the system.</p>
                </div>
            `;
        }

        return `
            <div class="learning-event-list">
                ${this.learningEvents.slice().reverse().map(event => this.renderEvent(event)).join('')}
            </div>
        `;
    }

    renderEvent(event) {
        const icons = {
            'parameter_update': '⚙️',
            'pattern_detected': '🔍',
            'threshold_adjusted': '📊',
            'behavior_learned': '💡',
            'anomaly_detected': '⚠️',
            'success_recorded': '✅'
        };

        const icon = icons[event.type] || '🌱';
        const timeAgo = this.formatTimeAgo(event.timestamp);

        return `
            <div class="learning-event">
                <div class="event-icon">${icon}</div>
                <div class="event-content">
                    <div class="event-title">${event.title}</div>
                    <div class="event-description">${event.description}</div>
                    ${event.details ? `
                        <div class="event-details">
                            ${Object.entries(event.details).map(([key, value]) => `
                                <span class="event-detail-item">
                                    <strong>${key}:</strong> ${value}
                                </span>
                            `).join('')}
                        </div>
                    ` : ''}
                    <div class="event-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }

    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}d ago`;
        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return 'just now';
    }

    attachEvents() {
        const toggle = document.getElementById('learning-feed-toggle');
        const close = document.getElementById('learning-feed-close');
        const clear = document.getElementById('learning-feed-clear');

        toggle.addEventListener('click', () => this.toggle());
        close.addEventListener('click', () => this.close());
        clear.addEventListener('click', () => this.clearEvents());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'l' && !e.target.closest('textarea, input') && !this.isOpen) {
                e.preventDefault();
                this.open();
            }
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
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
        const panel = document.getElementById('learning-feed-panel');
        panel.classList.add('active');
        this.updateBadge();
    }

    close() {
        this.isOpen = false;
        const panel = document.getElementById('learning-feed-panel');
        panel.classList.remove('active');
    }

    clearEvents() {
        this.learningEvents = [];
        this.saveToStorage();
        this.updateFeed();
    }

    updateFeed() {
        const body = document.getElementById('learning-feed-body');
        if (body) {
            body.innerHTML = this.renderEvents();
        }
        this.updateBadge();
    }

    updateBadge() {
        const badge = document.getElementById('learning-feed-badge');
        if (badge) {
            const unreadCount = this.learningEvents.filter(e => !e.read).length;
            badge.textContent = unreadCount;
            badge.style.display = unreadCount > 0 ? 'block' : 'none';
        }

        // Mark all as read when panel is open
        if (this.isOpen) {
            this.learningEvents.forEach(e => e.read = true);
            this.saveToStorage();
        }
    }

    addEvent(event) {
        this.learningEvents.push({
            ...event,
            timestamp: Date.now(),
            read: false
        });

        // Keep only last 50 events
        if (this.learningEvents.length > 50) {
            this.learningEvents = this.learningEvents.slice(-50);
        }

        this.saveToStorage();
        this.updateFeed();
    }

    async startPolling() {
        // Poll learning parameters every 10 seconds
        setInterval(async () => {
            try {
                const response = await fetch('http://localhost:3000/api/learning/parameters');
                const params = await response.json();

                // Check if parameters have changed
                this.checkParameterChanges(params);
            } catch (error) {
                // Silently fail - don't spam console
            }
        }, 10000);
    }

    checkParameterChanges(newParams) {
        const lastParams = this.lastParams;
        this.lastParams = newParams;

        if (!lastParams) return;

        // Check for significant changes
        if (Math.abs(newParams.executionThreshold - lastParams.executionThreshold) > 0.05) {
            this.addEvent({
                type: 'threshold_adjusted',
                title: 'Execution threshold adjusted',
                description: `Based on your feedback, the system adjusted its confidence threshold.`,
                details: {
                    'Previous': lastParams.executionThreshold.toFixed(2),
                    'New': newParams.executionThreshold.toFixed(2),
                    'Direction': newParams.executionThreshold > lastParams.executionThreshold ? 'More cautious' : 'More proactive'
                }
            });
        }

        if (Math.abs(newParams.learningRate - lastParams.learningRate) > 0.001) {
            this.addEvent({
                type: 'parameter_update',
                title: 'Learning rate updated',
                description: `The system is ${newParams.learningRate > lastParams.learningRate ? 'adapting faster' : 'stabilizing'} based on your behavior patterns.`,
                details: {
                    'Learning Rate': newParams.learningRate.toFixed(4)
                }
            });
        }
    }

    // Public method to add custom learning events
    static addLearningEvent(event) {
        const feed = window.learningFeedInstance;
        if (feed) {
            feed.addEvent(event);
        }
    }
}
