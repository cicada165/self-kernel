/**
 * WebSocket Service for Real-Time Updates
 *
 * Provides real-time push notifications for:
 * - Learning feed updates
 * - Intent state changes
 * - Governance rule executions
 * - System health alerts
 */

import { WebSocketServer } from 'ws';

let wss = null;
const clients = new Set();

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 */
export function initWebSocket(server) {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        console.log(`WebSocket client connected from ${req.socket.remoteAddress}`);
        clients.add(ws);

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'connected',
            timestamp: new Date().toISOString(),
            message: 'Connected to Self Kernel WebSocket'
        }));

        // Handle client messages
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                handleClientMessage(ws, message);
            } catch (err) {
                console.error('Invalid WebSocket message:', err);
            }
        });

        // Handle disconnection
        ws.on('close', () => {
            console.log('WebSocket client disconnected');
            clients.delete(ws);
        });

        ws.on('error', (err) => {
            console.error('WebSocket error:', err);
            clients.delete(ws);
        });
    });

    console.log('WebSocket server initialized on /ws');
}

/**
 * Handle incoming client messages
 */
function handleClientMessage(ws, message) {
    switch (message.type) {
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
            break;

        case 'subscribe':
            // Client can subscribe to specific event types
            if (!ws.subscriptions) {
                ws.subscriptions = new Set();
            }
            if (message.channel) {
                ws.subscriptions.add(message.channel);
                ws.send(JSON.stringify({
                    type: 'subscribed',
                    channel: message.channel,
                    timestamp: new Date().toISOString()
                }));
            }
            break;

        case 'unsubscribe':
            if (ws.subscriptions && message.channel) {
                ws.subscriptions.delete(message.channel);
                ws.send(JSON.stringify({
                    type: 'unsubscribed',
                    channel: message.channel,
                    timestamp: new Date().toISOString()
                }));
            }
            break;

        default:
            console.warn('Unknown WebSocket message type:', message.type);
    }
}

/**
 * Broadcast event to all connected clients
 * @param {Object} event - Event to broadcast
 * @param {string} channel - Optional channel filter
 */
export function broadcast(event, channel = null) {
    if (!wss) {
        console.warn('WebSocket server not initialized');
        return;
    }

    const message = JSON.stringify({
        ...event,
        timestamp: event.timestamp || new Date().toISOString()
    });

    clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
            // If channel specified, only send to subscribed clients
            if (channel && client.subscriptions && !client.subscriptions.has(channel)) {
                return;
            }
            client.send(message);
        }
    });
}

/**
 * Event emitters for different types
 */

export function emitLearningEvent(event) {
    broadcast({
        type: 'learning',
        channel: 'learning',
        ...event
    }, 'learning');
}

export function emitIntentUpdate(intent) {
    broadcast({
        type: 'intent-updated',
        channel: 'intents',
        intent
    }, 'intents');
}

export function emitGovernanceExecution(execution) {
    broadcast({
        type: 'governance-executed',
        channel: 'governance',
        execution
    }, 'governance');
}

export function emitSystemAlert(alert) {
    broadcast({
        type: 'system-alert',
        channel: 'system',
        alert
    }, 'system');
}

export function emitSuggestionCreated(suggestion) {
    broadcast({
        type: 'suggestion-created',
        channel: 'suggestions',
        suggestion
    }, 'suggestions');
}

export function emitPayloadStaged(payload) {
    broadcast({
        type: 'payload-staged',
        channel: 'payloads',
        payload
    }, 'payloads');
}

export function emitCognitiveStageChange(stage) {
    broadcast({
        type: 'cognitive-stage-changed',
        channel: 'cognitive',
        stage
    }, 'cognitive');
}

/**
 * Get client count
 */
export function getClientCount() {
    return clients.size;
}

/**
 * Get all active channels
 */
export function getActiveChannels() {
    const channels = new Set();
    clients.forEach(client => {
        if (client.subscriptions) {
            client.subscriptions.forEach(channel => channels.add(channel));
        }
    });
    return Array.from(channels);
}
