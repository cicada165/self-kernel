/**
 * Self Kernel — API Client
 */

const API_BASE = 'http://localhost:3000/api';

async function request(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined
    });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    if (res.status === 204) return null;
    return res.json();
}

export const api = {
    // Kernel
    getStatus: () => request('/kernel/status'),
    getActivity: () => request('/kernel/activity'),
    inspect: (col, id) => request(`/kernel/inspect/${col}/${id}`),
    saveInspect: (col, id, data) => request(`/kernel/inspect/${col}/${id}`, { method: 'PUT', body: data }),

    // Persons
    getPersons: () => request('/persons'),
    createPerson: (data) => request('/persons', { method: 'POST', body: data }),
    updatePerson: (id, data) => request(`/persons/${id}`, { method: 'PUT', body: data }),
    deletePerson: (id) => request(`/persons/${id}`, { method: 'DELETE' }),

    // Intents
    getIntents: () => request('/intents'),
    createIntent: (data) => request('/intents', { method: 'POST', body: data }),
    updateIntent: (id, data) => request(`/intents/${id}`, { method: 'PUT', body: data }),

    // Relations & Graph
    getRelations: () => request('/relations'),
    getGraph: () => request('/relations/graph/full'),
    createRelation: (data) => request('/relations', { method: 'POST', body: data }),

    // Thinking Chains
    getChains: () => request('/thinking-chains'),
    getChain: (id) => request(`/thinking-chains/${id}`),

    // Trajectories
    getTrajectories: () => request('/trajectories'),
    createTrajectory: (data) => request('/trajectories', { method: 'POST', body: data }),
    updateTrajectory: (id, data) => request(`/trajectories/${id}`, { method: 'PUT', body: data }),
    deleteTrajectory: (id) => request(`/trajectories/${id}`, { method: 'DELETE' }),

    // Cognitive Stages
    getCognitiveStages: () => request('/cognitive-stages'),

    // MCP
    getMcpStatus: () => request('/mcp/status'),
    getMcpLogs: () => request('/mcp/logs'),
    mcpContextQuery: (data) => request('/mcp/context', { method: 'POST', body: data }),

    // Auto-Annotator
    ingest: (text, source) => request('/ingest', { method: 'POST', body: { text, source } }),

    // Continuous Learning
    submitReward: (taskId, reward) => request('/learning/reward', { method: 'POST', body: { taskId, reward } }),
    getLearningParams: () => request('/learning/parameters'),

    // Intent Proxy
    getProxySuggestions: () => request('/intent-proxy/suggestions'),
    acceptSuggestion: (id) => request(`/intent-proxy/suggestions/${id}/accept`, { method: 'POST' }),
    rejectSuggestion: (id, reason) => request(`/intent-proxy/suggestions/${id}/reject`, { method: 'POST', body: { reason } }),
    getGovernanceRules: () => request('/intent-proxy/governance'),
    createGovernanceRule: (data) => request('/intent-proxy/governance', { method: 'POST', body: data }),
    updateGovernanceRule: (id, data) => request(`/intent-proxy/governance/${id}`, { method: 'PUT', body: data }),
    deleteGovernanceRule: (id) => request(`/intent-proxy/governance/${id}`, { method: 'DELETE' }),
    getProxyHistory: () => request('/intent-proxy/history'),

    // Inbox (Natural Language Input)
    submitToInbox: (text, source) => request('/inbox', { method: 'POST', body: { text, source } }),

    // Strategy Governance
    getStrategies: () => request('/strategies'),
    getStrategy: (id) => request(`/strategies/${id}`),
    createStrategy: (data) => request('/strategies', { method: 'POST', body: data }),
    updateStrategy: (id, data) => request(`/strategies/${id}`, { method: 'PUT', body: data }),
    deleteStrategy: (id) => request(`/strategies/${id}`, { method: 'DELETE' }),
    evaluateAction: (action) => request('/strategies/evaluate', { method: 'POST', body: action }),

    // System Health & Validation
    getSystemHealth: () => request('/system/health'),
    validateCollection: (collection) => request(`/system/validate/${collection}`),
    repairCollection: (collection, dryRun = false) => request(`/system/repair/${collection}?dryRun=${dryRun}`, { method: 'POST' }),
    createBackup: () => request('/system/backup', { method: 'POST' }),
    listBackups: () => request('/system/backups').then(res => res.backups),
    restoreBackup: (backupId) => request(`/system/restore/${backupId}`, { method: 'POST' }),
    checkIntegrity: () => request('/system/integrity'),
    getGovernanceStats: () => request('/intent-proxy/governance/stats'),

    // Search & Filter
    search: (query, options = {}) => {
        const params = new URLSearchParams({ q: query, ...options });
        return request(`/search?${params}`);
    },
    searchCollection: (collection, query, options = {}) => {
        const params = new URLSearchParams({ q: query, ...options });
        return request(`/search/collection/${collection}?${params}`);
    },
    getFilterOptions: (collection) => request(`/search/filter-options/${collection}`),
    advancedSearch: (query, options) => request('/search/advanced', { method: 'POST', body: { query, options } })
};
