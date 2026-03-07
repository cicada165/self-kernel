/**
 * Onboarding Overlay — Guided Setup for First-Time Users
 * Explains the Self Kernel concept to non-technical users
 */

export class OnboardingOverlay {
    constructor() {
        this.currentStep = 0;
        this.isNewUser = true;
        this.steps = [
            {
                title: "Welcome to Your Self Kernel",
                icon: "🧠",
                content: `<p>Your <strong>Self Kernel</strong> is a personal intelligence core that learns and evolves with you.</p>
                <p>Think of it as your digital companion that understands your goals, relationships, and thought patterns.</p>
                <p><strong>No coding required</strong> — everything is designed for natural interaction.</p>`,
                highlight: null
            },
            {
                title: "What is an Intent?",
                icon: "💡",
                content: `<p>An <strong>Intent</strong> is anything you want to achieve or explore.</p>
                <p>Examples: "Launch my startup", "Learn Python", "Plan vacation"</p>
                <p>Your kernel organizes intents into a living knowledge graph.</p>`,
                highlight: "#nav-timeline"
            },
            {
                title: "Track Relationships",
                icon: "🔗",
                content: `<p><strong>Persons</strong> are people in your life — mentors, collaborators, friends.</p>
                <p>The kernel tracks how they influence your goals and ideas.</p>
                <p>See who advises on what, who inspires which projects.</p>`,
                highlight: "#nav-persons"
            },
            {
                title: "AI-Powered Suggestions",
                icon: "🤖",
                content: `<p>The <strong>Intent Proxy</strong> analyzes patterns and suggests next steps.</p>
                <p>It learns from your behavior: what works, what doesn't.</p>
                <p>You approve or reject suggestions — you're always in control.</p>`,
                highlight: "#nav-intentProxy"
            },
            {
                title: "Automate with OpenClaw",
                icon: "🔧",
                content: `<p><strong>OpenClaw Automations</strong> turn your intents into actions.</p>
                <p>The system stages execution payloads based on confidence levels.</p>
                <p>RAT (Retrieval-Augmented Trajectory) learns from successful patterns.</p>`,
                highlight: "#nav-automations"
            },
            {
                title: "Start with Sample Data?",
                icon: "🎯",
                content: `<p>Would you like to <strong>explore with sample data</strong> first?</p>
                <p>We'll create example intents, persons, and relationships to show how everything works.</p>
                <p><strong>Or start fresh</strong> and create your own from scratch.</p>
                <div class="onboarding-choice">
                    <button class="btn btn-primary" id="onboarding-sample">Load Sample Data</button>
                    <button class="btn btn-secondary" id="onboarding-fresh">Start Fresh</button>
                </div>`,
                highlight: null
            }
        ];
    }

    show() {
        // Check if user has seen onboarding
        if (localStorage.getItem('self-kernel-onboarding-complete') === 'true') {
            return;
        }

        this.render();
        this.attachEvents();
    }

    render() {
        const overlay = document.createElement('div');
        overlay.id = 'onboarding-overlay';
        overlay.className = 'onboarding-overlay';

        const step = this.steps[this.currentStep];

        overlay.innerHTML = `
            <div class="onboarding-backdrop"></div>
            <div class="onboarding-card">
                <div class="onboarding-header">
                    <div class="onboarding-icon">${step.icon}</div>
                    <h2 class="onboarding-title">${step.title}</h2>
                </div>
                <div class="onboarding-content">
                    ${step.content}
                </div>
                <div class="onboarding-footer">
                    <div class="onboarding-progress">
                        ${this.steps.map((_, i) => `
                            <div class="progress-dot ${i === this.currentStep ? 'active' : ''} ${i < this.currentStep ? 'completed' : ''}"></div>
                        `).join('')}
                    </div>
                    <div class="onboarding-actions">
                        ${this.currentStep > 0 ? '<button class="btn btn-secondary" id="onboarding-prev">Back</button>' : ''}
                        ${this.currentStep < this.steps.length - 1
                            ? '<button class="btn btn-primary" id="onboarding-next">Next</button>'
                            : '<button class="btn btn-primary" id="onboarding-finish">Get Started</button>'}
                        <button class="btn btn-sm" id="onboarding-skip">Skip Tour</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Highlight element if specified
        if (step.highlight) {
            const element = document.querySelector(step.highlight);
            if (element) {
                element.classList.add('onboarding-highlight');
            }
        }
    }

    attachEvents() {
        const nextBtn = document.getElementById('onboarding-next');
        const prevBtn = document.getElementById('onboarding-prev');
        const finishBtn = document.getElementById('onboarding-finish');
        const skipBtn = document.getElementById('onboarding-skip');
        const sampleBtn = document.getElementById('onboarding-sample');
        const freshBtn = document.getElementById('onboarding-fresh');

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.next());
        }
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.prev());
        }
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.finish());
        }
        if (skipBtn) {
            skipBtn.addEventListener('click', () => this.finish());
        }
        if (sampleBtn) {
            sampleBtn.addEventListener('click', () => this.loadSampleData());
        }
        if (freshBtn) {
            freshBtn.addEventListener('click', () => this.finish());
        }
    }

    next() {
        this.clearHighlight();
        this.currentStep++;
        this.update();
    }

    prev() {
        this.clearHighlight();
        this.currentStep--;
        this.update();
    }

    update() {
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.remove();
        }
        this.render();
        this.attachEvents();
    }

    clearHighlight() {
        document.querySelectorAll('.onboarding-highlight').forEach(el => {
            el.classList.remove('onboarding-highlight');
        });
    }

    async loadSampleData() {
        try {
            // Update UI to show loading
            const card = document.querySelector('.onboarding-card');
            card.innerHTML = `
                <div class="onboarding-header">
                    <div class="onboarding-icon">⏳</div>
                    <h2 class="onboarding-title">Loading Sample Data...</h2>
                </div>
                <div class="onboarding-content">
                    <p>Creating example intents, persons, and relationships...</p>
                    <div class="loading-spinner"></div>
                </div>
            `;

            // Call API to generate sample data
            const response = await fetch('/api/onboarding/generate-samples', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            if (response.ok) {
                // Success! Show summary
                card.innerHTML = `
                    <div class="onboarding-header">
                        <div class="onboarding-icon">✅</div>
                        <h2 class="onboarding-title">Sample Data Loaded!</h2>
                    </div>
                    <div class="onboarding-content">
                        <p>Your kernel is now populated with:</p>
                        <ul style="text-align: left; margin: 1rem 0;">
                            <li><strong>${result.summary.persons}</strong> persons (mentors, investors)</li>
                            <li><strong>${result.summary.intents}</strong> intents (goals and ideas)</li>
                            <li><strong>${result.summary.relations}</strong> relationships</li>
                            <li><strong>${result.summary.thinkingChains}</strong> thinking chains</li>
                            <li><strong>${result.summary.trajectories}</strong> trajectories</li>
                        </ul>
                        <p><strong>Explore the panels to see your data in action!</strong></p>
                    </div>
                    <div class="onboarding-footer">
                        <div class="onboarding-actions">
                            <button class="btn btn-primary" id="onboarding-explore">Start Exploring</button>
                        </div>
                    </div>
                `;

                // Attach event to explore button
                document.getElementById('onboarding-explore').addEventListener('click', () => {
                    this.finish();
                    window.location.reload(); // Reload to show new data
                });
            } else {
                // Error handling
                card.innerHTML = `
                    <div class="onboarding-header">
                        <div class="onboarding-icon">⚠️</div>
                        <h2 class="onboarding-title">Could Not Load Samples</h2>
                    </div>
                    <div class="onboarding-content">
                        <p>${result.error || 'An error occurred'}</p>
                        <p>${result.hint || 'You can start fresh instead.'}</p>
                    </div>
                    <div class="onboarding-footer">
                        <div class="onboarding-actions">
                            <button class="btn btn-secondary" id="onboarding-retry">Try Again</button>
                            <button class="btn btn-primary" id="onboarding-continue">Start Fresh</button>
                        </div>
                    </div>
                `;

                document.getElementById('onboarding-retry').addEventListener('click', () => this.loadSampleData());
                document.getElementById('onboarding-continue').addEventListener('click', () => this.finish());
            }
        } catch (error) {
            console.error('[Onboarding] Failed to load sample data:', error);
            alert('Failed to load sample data. Please check server connection.');
        }
    }

    finish() {
        localStorage.setItem('self-kernel-onboarding-complete', 'true');
        this.clearHighlight();
        const overlay = document.getElementById('onboarding-overlay');
        if (overlay) {
            overlay.classList.add('fade-out');
            setTimeout(() => overlay.remove(), 300);
        }
    }

    // Allow users to replay onboarding
    static reset() {
        localStorage.removeItem('self-kernel-onboarding-complete');
    }
}
