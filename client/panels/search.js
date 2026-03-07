/**
 * Search Panel
 *
 * Universal search across all data collections with advanced filtering.
 */

import { api } from '../api.js';

let currentQuery = '';
let currentFilters = {};
let currentCollection = 'all';
let searchResults = null;

export async function renderSearch(container) {
    container.innerHTML = `
        <div class="panel-header">
            <h2>🔍 Universal Search</h2>
            <p>Search across all your data with advanced filters.</p>
        </div>

        <!-- Search Bar -->
        <div class="search-controls">
            <div class="search-input-group">
                <input type="text"
                       id="search-query"
                       class="search-input"
                       placeholder="Search intents, persons, trajectories, thinking chains..."
                       value="${currentQuery}">
                <button class="btn-primary" onclick="window.searchPanel.performSearch()">
                    🔍 Search
                </button>
            </div>

            <div class="search-filters">
                <select id="collection-filter" class="form-select" onchange="window.searchPanel.updateCollection(this.value)">
                    <option value="all" ${currentCollection === 'all' ? 'selected' : ''}>All Collections</option>
                    <option value="intents" ${currentCollection === 'intents' ? 'selected' : ''}>Intents</option>
                    <option value="persons" ${currentCollection === 'persons' ? 'selected' : ''}>Persons</option>
                    <option value="thinking-chains" ${currentCollection === 'thinking-chains' ? 'selected' : ''}>Thinking Chains</option>
                    <option value="trajectories" ${currentCollection === 'trajectories' ? 'selected' : ''}>Trajectories</option>
                    <option value="rat-patterns" ${currentCollection === 'rat-patterns' ? 'selected' : ''}>RAT Patterns</option>
                    <option value="suggestions" ${currentCollection === 'suggestions' ? 'selected' : ''}>Suggestions</option>
                    <option value="governance-rules" ${currentCollection === 'governance-rules' ? 'selected' : ''}>Governance Rules</option>
                </select>

                <button class="btn-secondary" onclick="window.searchPanel.toggleAdvancedFilters()">
                    ⚙️ Advanced Filters
                </button>

                <button class="btn-secondary" onclick="window.searchPanel.clearSearch()">
                    ✕ Clear
                </button>
            </div>
        </div>

        <!-- Advanced Filters (Collapsible) -->
        <div id="advanced-filters" class="advanced-filters" style="display: none;">
            ${renderAdvancedFilters()}
        </div>

        <!-- Search Results -->
        <div id="search-results" class="search-results">
            ${searchResults ? renderSearchResults(searchResults) : renderEmptyState()}
        </div>
    `;

    // Attach event handlers
    window.searchPanel = {
        performSearch: () => performSearch(container),
        updateCollection: (col) => updateCollection(col, container),
        toggleAdvancedFilters: () => toggleAdvancedFilters(),
        clearSearch: () => clearSearch(container),
        applyFilters: () => applyFilters(container),
        viewItem: (collection, id) => viewItem(collection, id)
    };

    // Handle Enter key in search input
    const searchInput = document.getElementById('search-query');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch(container);
            }
        });
        searchInput.focus();
    }
}

/**
 * Render advanced filters panel
 */
function renderAdvancedFilters() {
    return `
        <h4>🔧 Advanced Filters</h4>

        <div class="filter-group">
            <label>Date Range</label>
            <div class="date-range">
                <input type="date" id="filter-date-from" class="form-input-small">
                <span>to</span>
                <input type="date" id="filter-date-to" class="form-input-small">
            </div>
        </div>

        <div class="filter-group">
            <label>Tags (comma-separated)</label>
            <input type="text" id="filter-tags" class="form-input" placeholder="automation, research, urgent">
        </div>

        ${currentCollection === 'intents' || currentCollection === 'all' ? `
            <div class="filter-group">
                <label>FSM Stage</label>
                <select id="filter-stage" class="form-select">
                    <option value="">All Stages</option>
                    <option value="exploration">Exploration</option>
                    <option value="structuring">Structuring</option>
                    <option value="decision">Decision</option>
                    <option value="execution">Execution</option>
                    <option value="reflection">Reflection</option>
                </select>
            </div>

            <div class="filter-group">
                <label>Priority</label>
                <select id="filter-priority" class="form-select">
                    <option value="">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                </select>
            </div>
        ` : ''}

        ${currentCollection === 'persons' || currentCollection === 'all' ? `
            <div class="filter-group">
                <label>Person Type</label>
                <select id="filter-person-type" class="form-select">
                    <option value="">All Types</option>
                    <option value="self">Self</option>
                    <option value="mentor">Mentor</option>
                    <option value="peer">Peer</option>
                    <option value="investor">Investor</option>
                    <option value="other">Other</option>
                </select>
            </div>
        ` : ''}

        <div class="filter-actions">
            <button class="btn-primary" onclick="window.searchPanel.applyFilters()">
                ✓ Apply Filters
            </button>
        </div>
    `;
}

/**
 * Render search results
 */
function renderSearchResults(results) {
    if (!results || results.totalResults === 0) {
        return `
            <div class="empty-state">
                <p>No results found for "${currentQuery}"</p>
                <p class="muted">Try a different search term or adjust your filters.</p>
            </div>
        `;
    }

    const sections = [];

    if (results.topResults && results.topResults.length > 0) {
        sections.push(`
            <div class="results-section">
                <h3>📊 Top Results (${results.totalResults} total)</h3>
                <div class="results-list">
                    ${results.topResults.map(item => renderSearchResultCard(item)).join('')}
                </div>
            </div>
        `);
    }

    // Render by collection
    for (const [collection, items] of Object.entries(results.collections || {})) {
        sections.push(`
            <div class="results-section">
                <h3>${getCollectionIcon(collection)} ${formatCollectionName(collection)} (${items.length})</h3>
                <div class="results-list">
                    ${items.map(item => renderSearchResultCard({ ...item, collection })).join('')}
                </div>
            </div>
        `);
    }

    return sections.join('');
}

/**
 * Render a single search result card
 */
function renderSearchResultCard(item) {
    const collection = item.collection;
    const title = item.title || item.name || item.label || 'Untitled';
    const description = item.description || item.bio || item.summary || '';
    const relevanceScore = item.relevanceScore || 0;
    const date = item.createdAt || item.updatedAt || '';

    return `
        <div class="search-result-card" onclick="window.searchPanel.viewItem('${collection}', '${item.id}')">
            <div class="result-header">
                <span class="result-icon">${getCollectionIcon(collection)}</span>
                <span class="result-title">${highlightQuery(title, currentQuery)}</span>
                <span class="result-score">${relevanceScore}%</span>
            </div>

            ${description ? `
                <div class="result-description">
                    ${highlightQuery(truncate(description, 150), currentQuery)}
                </div>
            ` : ''}

            <div class="result-meta">
                <span class="result-collection">${formatCollectionName(collection)}</span>
                ${item.tags && item.tags.length > 0 ? `
                    <span class="result-tags">
                        ${item.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </span>
                ` : ''}
                ${date ? `<span class="result-date">${formatDate(date)}</span>` : ''}
            </div>

            ${renderItemSpecificInfo(item, collection)}
        </div>
    `;
}

/**
 * Render collection-specific information
 */
function renderItemSpecificInfo(item, collection) {
    switch (collection) {
        case 'intents':
            return `
                <div class="result-extra">
                    <span class="badge badge-${item.stage || 'default'}">${item.stage || 'Unknown'}</span>
                    <span class="badge badge-priority-${item.priority || 'medium'}">${item.priority || 'medium'} priority</span>
                </div>
            `;
        case 'persons':
            return `
                <div class="result-extra">
                    <span class="badge">${item.type || 'unknown'}</span>
                    ${item.role ? `<span class="badge">${item.role}</span>` : ''}
                </div>
            `;
        case 'trajectories':
            const progress = item.successRate ? Math.round(item.successRate * 100) : 0;
            return `
                <div class="result-extra">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <span class="progress-text">${progress}% complete</span>
                </div>
            `;
        default:
            return '';
    }
}

/**
 * Render empty state
 */
function renderEmptyState() {
    return `
        <div class="empty-state">
            <h3>🔍 Start Searching</h3>
            <p>Enter a search term to find:</p>
            <ul>
                <li><strong>Intents</strong> — Your goals and tasks</li>
                <li><strong>Persons</strong> — People in your network</li>
                <li><strong>Thinking Chains</strong> — Your thought processes</li>
                <li><strong>Trajectories</strong> — Your journey milestones</li>
                <li><strong>RAT Patterns</strong> — Successful automation patterns</li>
                <li><strong>Suggestions</strong> — AI recommendations</li>
                <li><strong>Governance Rules</strong> — Automation policies</li>
            </ul>
            <p class="muted">Tip: Use advanced filters to narrow your search</p>
        </div>
    `;
}

/**
 * Perform search
 */
async function performSearch(container) {
    const searchInput = document.getElementById('search-query');
    const query = searchInput?.value.trim();

    if (!query) {
        alert('Please enter a search query');
        return;
    }

    currentQuery = query;

    try {
        // Show loading state
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = '<div class="loading">🔍 Searching...</div>';
        }

        // Perform search
        if (currentCollection === 'all') {
            const collections = currentFilters.collections || undefined;
            searchResults = await api.search(query, { collections, limit: 50 });
        } else {
            const result = await api.searchCollection(currentCollection, query, currentFilters);
            searchResults = {
                totalResults: result.totalResults,
                collections: {
                    [currentCollection]: result.results
                },
                topResults: result.results.slice(0, 10)
            };
        }

        // Re-render with results
        await renderSearch(container);

    } catch (error) {
        console.error('[Search] Search failed:', error);
        const resultsContainer = document.getElementById('search-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <p>Search failed: ${error.message}</p>
                </div>
            `;
        }
    }
}

/**
 * Update collection filter
 */
function updateCollection(collection, container) {
    currentCollection = collection;
    renderSearch(container);
}

/**
 * Toggle advanced filters
 */
function toggleAdvancedFilters() {
    const filtersPanel = document.getElementById('advanced-filters');
    if (filtersPanel) {
        filtersPanel.style.display = filtersPanel.style.display === 'none' ? 'block' : 'none';
    }
}

/**
 * Apply advanced filters
 */
async function applyFilters(container) {
    currentFilters = {};

    // Date range
    const dateFrom = document.getElementById('filter-date-from')?.value;
    const dateTo = document.getElementById('filter-date-to')?.value;
    if (dateFrom) currentFilters.dateFrom = dateFrom;
    if (dateTo) currentFilters.dateTo = dateTo;

    // Tags
    const tagsInput = document.getElementById('filter-tags')?.value;
    if (tagsInput) {
        currentFilters.tags = tagsInput.split(',').map(t => t.trim()).filter(t => t);
    }

    // Intent-specific
    const stage = document.getElementById('filter-stage')?.value;
    if (stage) currentFilters.stage = stage;

    const priority = document.getElementById('filter-priority')?.value;
    if (priority) currentFilters.priority = priority;

    // Person-specific
    const personType = document.getElementById('filter-person-type')?.value;
    if (personType) currentFilters.personType = personType;

    // Re-run search with filters
    if (currentQuery) {
        await performSearch(container);
    }
}

/**
 * Clear search
 */
function clearSearch(container) {
    currentQuery = '';
    currentFilters = {};
    currentCollection = 'all';
    searchResults = null;
    renderSearch(container);
}

/**
 * View item details (navigate to inspector)
 */
function viewItem(collection, id) {
    // Navigate to inspector panel with this item
    console.log(`View ${collection}/${id}`);
    // TODO: Implement navigation to inspector panel
    alert(`Viewing ${collection}/${id}\n\nInspector integration coming soon!`);
}

/**
 * Helper: Get collection icon
 */
function getCollectionIcon(collection) {
    const icons = {
        'intents': '💡',
        'persons': '👤',
        'thinking-chains': '🧠',
        'trajectories': '🛤️',
        'rat-patterns': '🎯',
        'suggestions': '💭',
        'governance-rules': '⚖️',
        'relations': '🔗',
        'cognitive-stages': '📊'
    };
    return icons[collection] || '📄';
}

/**
 * Helper: Format collection name
 */
function formatCollectionName(collection) {
    return collection
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Helper: Highlight query in text
 */
function highlightQuery(text, query) {
    if (!query || !text) return text;

    const terms = query.toLowerCase().split(/\s+/);
    let result = text;

    terms.forEach(term => {
        const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
        result = result.replace(regex, '<mark>$1</mark>');
    });

    return result;
}

/**
 * Helper: Escape regex special characters
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Helper: Truncate text
 */
function truncate(text, length) {
    if (!text || text.length <= length) return text;
    return text.substring(0, length) + '...';
}

/**
 * Helper: Format date
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;

    return date.toLocaleDateString();
}
