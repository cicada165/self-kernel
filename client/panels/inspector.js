/**
 * Data Inspector Panel — White-box JSON viewer/editor
 * Full transparency into what the kernel stores and why
 */

import { api } from '../api.js';

const COLLECTIONS = [
    { key: 'persons', label: 'Persons', icon: '👤' },
    { key: 'intents', label: 'Intents', icon: '🎯' },
    { key: 'relations', label: 'Relations', icon: '🔗' },
    { key: 'thinking-chains', label: 'Thinking Chains', icon: '💭' },
    { key: 'trajectories', label: 'Trajectories', icon: '🛤️' },
    { key: 'cognitive-stages', label: 'Cognitive Stages', icon: '🧩' },
    { key: 'mcp-logs', label: 'MCP Logs', icon: '📋' },
];

let currentCollection = null;
let currentEntityId = null;
let isEditing = false;

export async function renderInspector(container) {
    container.innerHTML = `
    <div class="panel-header">
      <h2>🔍 Data Inspector</h2>
      <p>White-box transparency — view, edit, and manage every piece of data in your kernel. Your data, fully visible.</p>
    </div>
    <div class="inspector-layout">
      <div class="inspector-sidebar" id="inspector-sidebar">
        <div style="padding: 12px; font-size: 11px; color: var(--text-muted); text-align: center;">Loading collections...</div>
      </div>
      <div class="inspector-detail" id="inspector-detail">
        <div class="inspector-toolbar">
          <span class="inspector-path" id="inspector-path">Select an entity to inspect</span>
          <div class="inspector-actions" id="inspector-actions"></div>
        </div>
        <div class="inspector-editor" id="inspector-editor">
          <pre style="color: var(--text-muted); padding: 40px; text-align: center;">← Choose a collection and entity to inspect its raw data.</pre>
        </div>
      </div>
    </div>
  `;

    await loadCollections(container);
}

async function loadCollections(container) {
    const sidebar = document.getElementById('inspector-sidebar');
    let html = '';

    for (const col of COLLECTIONS) {
        try {
            const items = await fetchCollection(col.key);
            html += `
        <div class="inspector-collection">
          <div class="inspector-collection-title" data-collection="${col.key}">
            <span>${col.icon} ${col.label}</span>
            <span class="inspector-collection-count">${items.length}</span>
          </div>
          <ul class="inspector-entity-list" id="inspector-list-${col.key}" style="display: none;">
            ${items.map(item => `
              <li class="inspector-entity-item" data-collection="${col.key}" data-id="${item.id}">
                ${item.name || item.title || item.label || item.type || item.id}
              </li>
            `).join('')}
          </ul>
        </div>
      `;
        } catch {
            html += `<div class="inspector-collection"><div class="inspector-collection-title">${col.icon} ${col.label} <span style="color: var(--text-muted);">error</span></div></div>`;
        }
    }

    sidebar.innerHTML = html;

    // Toggle collection lists
    sidebar.querySelectorAll('.inspector-collection-title').forEach(title => {
        title.addEventListener('click', () => {
            const list = document.getElementById(`inspector-list-${title.dataset.collection}`);
            if (list) {
                list.style.display = list.style.display === 'none' ? 'block' : 'none';
            }
        });
    });

    // Click entity items
    sidebar.querySelectorAll('.inspector-entity-item').forEach(item => {
        item.addEventListener('click', () => {
            sidebar.querySelectorAll('.inspector-entity-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            loadEntity(item.dataset.collection, item.dataset.id);
        });
    });
}

async function fetchCollection(key) {
    const endpoint = key === 'cognitive-stages' ? '/kernel/status' : `/${key}`;
    if (key === 'cognitive-stages') {
        // Cognitive stages don't have a direct list endpoint, use storage
        const r = await fetch(`http://localhost:3000/api/thinking-chains`);
        // Fallback: just list what's in there
    }
    const r = await fetch(`http://localhost:3000/api/${key.replace('cognitive-', '')}`);
    if (!r.ok) return [];
    return r.json();
}

async function loadEntity(collection, id) {
    currentCollection = collection;
    currentEntityId = id;
    isEditing = false;

    const pathEl = document.getElementById('inspector-path');
    const editorEl = document.getElementById('inspector-editor');
    const actionsEl = document.getElementById('inspector-actions');

    pathEl.textContent = `data/${collection}/${id}.json`;

    try {
        const data = await api.inspect(collection, id);

        actionsEl.innerHTML = `
      <button class="btn btn-sm" id="inspect-edit-btn">✏️ Edit</button>
      <button class="btn btn-sm btn-danger" id="inspect-delete-btn">🗑️ Delete</button>
    `;

        editorEl.innerHTML = `<pre>${syntaxHighlight(JSON.stringify(data.content, null, 2))}</pre>`;

        document.getElementById('inspect-edit-btn').addEventListener('click', () => toggleEdit(data));
        document.getElementById('inspect-delete-btn').addEventListener('click', () => deleteEntity(collection, id));
    } catch (err) {
        editorEl.innerHTML = `<pre style="color: var(--accent-danger);">Error loading entity: ${err.message}</pre>`;
        actionsEl.innerHTML = '';
    }
}

function toggleEdit(data) {
    const editorEl = document.getElementById('inspector-editor');
    const editBtn = document.getElementById('inspect-edit-btn');

    if (!isEditing) {
        isEditing = true;
        editBtn.textContent = '💾 Save';
        editBtn.classList.add('btn-primary');
        editorEl.innerHTML = `<textarea id="inspector-textarea">${JSON.stringify(data.content, null, 2)}</textarea>`;
    } else {
        const textarea = document.getElementById('inspector-textarea');
        try {
            const parsed = JSON.parse(textarea.value);
            api.saveInspect(currentCollection, currentEntityId, parsed).then(() => {
                isEditing = false;
                editBtn.textContent = '✏️ Edit';
                editBtn.classList.remove('btn-primary');
                loadEntity(currentCollection, currentEntityId);
            });
        } catch (e) {
            alert('Invalid JSON: ' + e.message);
        }
    }
}

async function deleteEntity(collection, id) {
    if (!confirm(`Delete this ${collection} entity? This action cannot be undone.`)) return;
    try {
        await fetch(`http://localhost:3000/api/${collection}/${id}`, { method: 'DELETE' });
        document.getElementById('inspector-editor').innerHTML = '<pre style="color: var(--text-muted); padding: 40px; text-align: center;">Entity deleted.</pre>';
        document.getElementById('inspector-actions').innerHTML = '';
        // Refresh sidebar
        renderInspector(document.getElementById('panel-inspector'));
    } catch (err) {
        alert('Delete failed: ' + err.message);
    }
}

function syntaxHighlight(json) {
    return json
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (match) => {
            let cls = 'color: var(--accent-danger);';
            if (/^"/.test(match)) {
                if (/:$/.test(match)) {
                    cls = 'color: var(--accent-primary);'; // key
                } else {
                    cls = 'color: var(--accent-success);'; // string
                }
            } else if (/true|false/.test(match)) {
                cls = 'color: var(--accent-warning);';
            } else if (/null/.test(match)) {
                cls = 'color: var(--text-muted);';
            }
            return `<span style="${cls}">${match}</span>`;
        });
}
