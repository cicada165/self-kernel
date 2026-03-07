/**
 * Self Kernel - Quick Capture Popup
 */

const API_URL = 'http://localhost:3000/api';
let tags = [];

// Check connection status
async function checkConnection() {
    const statusEl = document.getElementById('status');
    const iconEl = document.getElementById('status-icon');
    const textEl = document.getElementById('status-text');

    try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
            statusEl.className = 'status connected';
            iconEl.textContent = '✅';
            textEl.textContent = 'Connected to Self Kernel';
            return true;
        }
    } catch (error) {
        statusEl.className = 'status disconnected';
        iconEl.textContent = '⚠️';
        textEl.textContent = 'Self Kernel not running';
        return false;
    }
}

// Show message
function showMessage(text, type = 'success') {
    const container = document.getElementById('message-container');
    container.innerHTML = `
        <div class="${type}-message">
            ${text}
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = '';
    }, 3000);
}

// Handle tag input
function setupTagsInput() {
    const tagsContainer = document.getElementById('tags-container');
    const tagsInput = document.getElementById('tags-input');

    tagsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = tagsInput.value.trim();
            if (tag && !tags.includes(tag)) {
                tags.push(tag);
                renderTags();
            }
            tagsInput.value = '';
        } else if (e.key === 'Backspace' && tagsInput.value === '' && tags.length > 0) {
            tags.pop();
            renderTags();
        }
    });
}

// Render tags
function renderTags() {
    const tagsContainer = document.getElementById('tags-container');
    const tagsInput = document.getElementById('tags-input');

    const tagsHTML = tags.map(tag => `
        <span class="tag">
            ${tag}
            <span class="tag-remove" onclick="removeTag('${tag}')">×</span>
        </span>
    `).join('');

    tagsContainer.innerHTML = tagsHTML;
    tagsContainer.appendChild(tagsInput);
}

// Remove tag
window.removeTag = function(tag) {
    tags = tags.filter(t => t !== tag);
    renderTags();
};

// Capture thought
async function captureThought(thought, priority) {
    try {
        const response = await fetch(`${API_URL}/inbox`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: thought,
                priority,
                tags: [...tags, 'quick-capture'],
                source: 'browser-extension'
            })
        });

        if (!response.ok) {
            throw new Error('Failed to capture thought');
        }

        const result = await response.json();

        // Save to recent captures
        saveRecentCapture({
            thought,
            priority,
            tags: [...tags],
            timestamp: new Date().toISOString()
        });

        return result;
    } catch (error) {
        throw error;
    }
}

// Save recent capture to storage
function saveRecentCapture(capture) {
    chrome.storage.local.get(['recentCaptures'], (result) => {
        const recent = result.recentCaptures || [];
        recent.unshift(capture);
        if (recent.length > 10) recent.pop();

        chrome.storage.local.set({ recentCaptures: recent }, () => {
            loadRecentCaptures();
        });
    });
}

// Load recent captures
function loadRecentCaptures() {
    chrome.storage.local.get(['recentCaptures'], (result) => {
        const recent = result.recentCaptures || [];
        const listEl = document.getElementById('recent-list');

        if (recent.length === 0) {
            listEl.innerHTML = '<p style="color: #666; font-size: 12px;">No recent captures</p>';
            return;
        }

        listEl.innerHTML = recent.slice(0, 5).map(capture => `
            <div class="capture-item">
                <div class="capture-item-title">${capture.thought.substring(0, 60)}${capture.thought.length > 60 ? '...' : ''}</div>
                <div class="capture-item-time">${formatTime(capture.timestamp)}</div>
            </div>
        `).join('');
    });
}

// Format time
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return date.toLocaleDateString();
}

// Handle form submission
document.getElementById('capture-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const thought = document.getElementById('thought-input').value.trim();
    const priority = document.getElementById('priority-select').value;

    if (!thought) {
        showMessage('Please enter a thought or idea', 'error');
        return;
    }

    const connected = await checkConnection();
    if (!connected) {
        showMessage('Self Kernel is not running. Please start the server first.', 'error');
        return;
    }

    try {
        await captureThought(thought, priority);
        showMessage('✅ Thought captured successfully!', 'success');

        // Clear form
        document.getElementById('thought-input').value = '';
        tags = [];
        renderTags();

    } catch (error) {
        showMessage(`Failed to capture thought: ${error.message}`, 'error');
    }
});

// Handle clear button
document.getElementById('clear-btn').addEventListener('click', () => {
    document.getElementById('thought-input').value = '';
    tags = [];
    renderTags();
});

// Auto-fill from selected text
chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    try {
        const [{ result }] = await chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            function: () => window.getSelection().toString()
        });

        if (result && result.trim()) {
            document.getElementById('thought-input').value = result.trim();
        }
    } catch (error) {
        // Selection not available
    }
});

// Initialize
checkConnection();
setupTagsInput();
loadRecentCaptures();
