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

    // Cognitive Stages
    getStages: () => request('/kernel/status').then(async () => {
        const res = await fetch(`${API_BASE}/kernel/status`);
        return res.json();
    }),

    // MCP
    getMcpStatus: () => request('/mcp/status'),
    getMcpLogs: () => request('/mcp/logs'),
    mcpContextQuery: (data) => request('/mcp/context', { method: 'POST', body: data }),

    // Auto-Annotator
    ingest: (text, source) => request('/ingest', { method: 'POST', body: { text, source } }),

    // Continuous Learning
    submitReward: (taskId, reward) => request('/learning/reward', { method: 'POST', body: { taskId, reward } }),
    getLearningParams: () => request('/learning/parameters')
};
