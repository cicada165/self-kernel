/**
 * Quick Add — Floating Natural Language Inbox
 * Allows users to capture thoughts instantly with text or voice input
 */

import SpeechRecognitionManager from '../utils/speechRecognition.js';

export class QuickAdd {
    constructor() {
        this.isOpen = false;
        this.isRecording = false;
        this.speechRecognition = new SpeechRecognitionManager();
        this.setupSpeechRecognition();
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
                    ${this.speechRecognition.isSupported() ? `
                    <button class="btn btn-voice" id="quick-add-voice" title="Voice Input">
                        <span class="btn-icon" id="voice-icon">🎤</span>
                        <span id="voice-status">Voice</span>
                    </button>
                    ` : ''}
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
        const voiceBtn = document.getElementById('quick-add-voice');
        const input = document.getElementById('quick-add-input');

        fab.addEventListener('click', () => this.toggle());
        closeBtn.addEventListener('click', () => this.close());
        cancelBtn.addEventListener('click', () => this.close());
        submitBtn.addEventListener('click', () => this.submit());

        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        }

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

    setupSpeechRecognition() {
        if (!this.speechRecognition.isSupported()) return;

        this.speechRecognition.onStart = () => {
            this.isRecording = true;
            const voiceIcon = document.getElementById('voice-icon');
            const voiceStatus = document.getElementById('voice-status');
            if (voiceIcon) voiceIcon.textContent = '🔴';
            if (voiceStatus) voiceStatus.textContent = 'Listening...';
        };

        this.speechRecognition.onResult = (transcript, isFinal) => {
            const input = document.getElementById('quick-add-input');
            if (input) {
                if (isFinal) {
                    // Final result - append to input
                    input.value = transcript;
                } else {
                    // Interim result - show as placeholder
                    input.placeholder = transcript;
                }
            }
        };

        this.speechRecognition.onEnd = () => {
            this.isRecording = false;
            const voiceIcon = document.getElementById('voice-icon');
            const voiceStatus = document.getElementById('voice-status');
            const input = document.getElementById('quick-add-input');
            if (voiceIcon) voiceIcon.textContent = '🎤';
            if (voiceStatus) voiceStatus.textContent = 'Voice';
            if (input) input.placeholder = 'Type naturally...';
        };

        this.speechRecognition.onError = (error) => {
            this.isRecording = false;
            const voiceIcon = document.getElementById('voice-icon');
            const voiceStatus = document.getElementById('voice-status');
            const result = document.getElementById('quick-add-result');
            if (voiceIcon) voiceIcon.textContent = '🎤';
            if (voiceStatus) voiceStatus.textContent = 'Voice';
            if (result) {
                result.innerHTML = `
                    <div class="result-error">
                        <span class="result-icon">⚠️</span>
                        <div class="result-text">
                            <strong>Voice Input Error:</strong> ${error}
                        </div>
                    </div>
                `;
                result.classList.add('visible');
            }
        };
    }

    toggleVoiceInput() {
        if (this.isRecording) {
            this.speechRecognition.stop();
        } else {
            const input = document.getElementById('quick-add-input');
            if (input) {
                input.placeholder = 'Listening for your voice...';
            }
            this.speechRecognition.start();
        }
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
            // Check if this was voice input
            const isVoiceInput = this.speechRecognition.getTranscript() === text;
            const finalSource = isVoiceInput ? `${source.value}-voice` : source.value;

            const response = await fetch('http://localhost:3000/api/inbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: text,
                    source: finalSource,
                    metadata: isVoiceInput ? { input_method: 'voice' } : { input_method: 'text' }
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
