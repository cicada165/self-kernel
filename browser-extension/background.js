/**
 * Self Kernel - Background Service Worker
 */

const API_URL = 'http://localhost:3000/api';

// Create context menu on installation
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'capture-selection',
        title: 'Capture to Self Kernel',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'capture-link',
        title: 'Capture link to Self Kernel',
        contexts: ['link']
    });

    chrome.contextMenus.create({
        id: 'capture-page',
        title: 'Capture current page',
        contexts: ['page']
    });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    let thought = '';

    if (info.menuItemId === 'capture-selection') {
        thought = info.selectionText;
    } else if (info.menuItemId === 'capture-link') {
        thought = `${info.linkText || 'Link'}: ${info.linkUrl}`;
    } else if (info.menuItemId === 'capture-page') {
        thought = `${tab.title}: ${tab.url}`;
    }

    if (thought) {
        try {
            const response = await fetch(`${API_URL}/inbox`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: thought,
                    priority: 'medium',
                    tags: ['quick-capture', 'context-menu'],
                    source: 'browser-extension',
                    metadata: {
                        url: tab.url,
                        title: tab.title
                    }
                })
            });

            if (response.ok) {
                chrome.notifications.create({
                    type: 'basic',
                    iconUrl: 'icons/icon48.png',
                    title: 'Self Kernel',
                    message: '✅ Thought captured successfully!'
                });
            } else {
                throw new Error('Failed to capture');
            }
        } catch (error) {
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icons/icon48.png',
                title: 'Self Kernel',
                message: '❌ Failed to capture: ' + error.message
            });
        }
    }
});

// Handle keyboard shortcut
chrome.commands.onCommand.addListener(async (command) => {
    if (command === 'quick-capture') {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        try {
            const [{ result }] = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => window.getSelection().toString()
            });

            if (result && result.trim()) {
                const response = await fetch(`${API_URL}/inbox`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        text: result.trim(),
                        priority: 'medium',
                        tags: ['quick-capture', 'keyboard-shortcut'],
                        source: 'browser-extension'
                    })
                });

                if (response.ok) {
                    chrome.notifications.create({
                        type: 'basic',
                        iconUrl: 'icons/icon48.png',
                        title: 'Self Kernel',
                        message: '✅ Selection captured!'
                    });
                }
            }
        } catch (error) {
            console.error('Quick capture failed:', error);
        }
    }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkConnection') {
        fetch(`${API_URL}/health`)
            .then(response => sendResponse({ connected: response.ok }))
            .catch(() => sendResponse({ connected: false }));
        return true; // Required for async sendResponse
    }
});
