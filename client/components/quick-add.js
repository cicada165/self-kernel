/**
 * Quick Add — Floating Natural Language Inbox
 * Allows users to capture thoughts instantly
 */

export class QuickAdd {
    constructor() {
        this.isOpen = false;
        this.render();
        this.attachEvents();
    }

    render() {
        const container = document.createElement('div');
        container.id = 'quick-add-container';
        container.innerHTML = `
            <button class="quick-add-fab" id="quick-add-fab" title="Quick Add (Press Q)">
                <span class="fab-icon">⚡</span>
            </button>
            <div class="quick-add-panel" id="quick-add-panel">
                <div class="quick-add-header">
                    <h3>Quick Add</h3>
                    <button class="quick-add-close" id="quick-add-close">×</button>
                </div>
                <div class="quick-add-body">
                    <textarea
                        id="quick-add-input"
                        placeholder="Type naturally... e.g., 'I need to finish the quarterly report by Friday' or 'Sarah mentioned a new project opportunity'"
                        rows="4"
                    ></textarea>
                    <div class="quick-add-meta">
                        <select id="quick-add-source" class="quick-add-source">
                            <option value="quick-add">Quick Add</option>
                            <option value="manual">Manual Entry</option>
                            <option value="meeting-notes">Meeting Notes</option>
                            <option value="brainstorm">Brainstorm</option>
                        </select>
                    </div>
                </div>
                <div class="quick-add-footer">
                    <button class="btn btn-secondary" id="quick-add-cancel">Cancel</button>
                    <button class="btn btn-primary" id="quick-add-submit">
                        <span class="btn-icon">✨</span> Add to Kernel
                    </button>
                </div>
                <div class="quick-add-result" id="quick-add-result"></div>
            </div>
        `;
        document.body.appendChild(container);
    }

    attachEvents() {
        const fab = document.getElementById('quick-add-fab');
        const panel = document.getElementById('quick-add-panel');
        const closeBtn = document.getElementById('quick-add-close');
        const cancelBtn = document.getElementById('quick-add-cancel');
        const submitBtn = document.getElementById('quick-add-submit');
        const input = document.getElementById('quick-add-input');

        fab.addEventListener('click', () => this.toggle());
        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        submitBtn.addEventListener('click', () => this.submit());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Q to open (when not in input)
            if (e.key === 'q' && !e.target.closest('textarea, input') && !this.isOpen) {
                e.preventDefault();
                this.open();
            }
            // Escape to close
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
            // Cmd/Ctrl + Enter to submit
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && this.isOpen) {
                e.preventDefault();
                this.submit();
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
        const panel = document.getElementById('quick-add-panel');
        const input = document.getElementById('quick-add-input');
        panel.classList.add('active');
        setTimeout(() => input.focus(), 100);
    }

    close() {
        this.isOpen = false;
        const panel = document.getElementById('quick-add-panel');
        const input = document.getElementById('quick-add-input');
        const result = document.getElementById('quick-add-result');
        panel.classList.remove('active');
        input.value = '';
        result.innerHTML = '';
        result.classList.remove('visible');
    }

    async submit() {
        const input = document.getElementById('quick-add-input');
        const source = document.getElementById('quick-add-source');
        const submitBtn = document.getElementById('quick-add-submit');
        const result = document.getElementById('quick-add-result');

        const text = input.value.trim();
        if (!text) return;

        // Disable button during submission
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="btn-icon">⏳</span> Processing...';

        try {
            const response = await fetch('http://localhost:3000/api/inbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    source: source.value
                })
            });

            const data = await response.json();

            // Show result
            result.innerHTML = this.renderResult(data);
            result.classList.add('visible');

            // Clear input after successful submission
            input.value = '';

            // Auto-close after 3 seconds if committed
            if (data.action === 'committed') {
                setTimeout(() => this.close(), 3000);
            }
        } catch (error) {
            result.innerHTML = `
                <div class="result-error">
                    <span class="result-icon">⚠️</span>
                    <div class="result-text">
                        <strong>Error:</strong> ${error.message}
                    </div>
                </div>
            `;
            result.classList.add('visible');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span class="btn-icon">✨</span> Add to Kernel';
        }
    }

    renderResult(data) {
        if (data.action === 'committed') {
            return `
                <div class="result-success">
                    <span class="result-icon">✅</span>
                    <div class="result-text">
                        <strong>Added to your kernel!</strong>
                        <p>${data.reason}</p>
                        ${data.extracted && data.extracted.intents && data.extracted.intents.length > 0
                            ? `<div class="result-extracted">
                                <strong>Extracted Intents:</strong>
                                ${data.extracted.intents.map(i => `<span class="badge badge-${i.stage}">${i.title}</span>`).join(' ')}
                            </div>`
                            : ''}
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="result-warning">
                    <span class="result-icon">💡</span>
                    <div class="result-text">
                        <strong>Low confidence signal</strong>
                        <p>${data.reason}</p>
                        <p class="result-hint">Try adding more context or specific details.</p>
                    </div>
                </div>
            `;
        }
    }
}
