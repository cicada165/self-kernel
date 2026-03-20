/**
 * Templates Panel
 * Browse and apply pre-built workflow templates
 */

import api from '../api.js';

let selectedTemplate = null;

export async function renderTemplates(container) {
  container.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const [templatesRes, categoriesRes] = await Promise.all([
      fetch('http://localhost:3000/api/templates'),
      fetch('http://localhost:3000/api/templates/categories')
    ]);

    const { templates } = await templatesRes.json();
    const { categories } = await categoriesRes.json();

    container.innerHTML = `
      <div class="panel-header">
        <h2>Workflow Templates</h2>
        <p>Quick-start your projects with pre-built workflows</p>
      </div>

      <div class="templates-filter">
        <button class="filter-btn active" data-category="all">
          All Templates (${templates.length})
        </button>
        ${categories.map(cat => {
          const count = templates.filter(t => t.category === cat).length;
          return `
            <button class="filter-btn" data-category="${cat}">
              ${capitalize(cat)} (${count})
            </button>
          `;
        }).join('')}
      </div>

      <div class="templates-grid" id="templates-grid">
        ${renderTemplateCards(templates)}
      </div>

      <div id="template-modal" class="template-modal" style="display: none;">
        <div class="template-modal-backdrop"></div>
        <div class="template-modal-content">
          <div id="template-detail"></div>
        </div>
      </div>
    `;

    // Set up filter buttons
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const category = btn.dataset.category;
        const filtered = category === 'all'
          ? templates
          : templates.filter(t => t.category === category);

        document.getElementById('templates-grid').innerHTML = renderTemplateCards(filtered);
        attachCardListeners(container);
      });
    });

    attachCardListeners(container);

  } catch (error) {
    console.error('Failed to load templates:', error);
    container.innerHTML = `
      <div class="panel-header">
        <h2>Workflow Templates</h2>
        <p>Error loading templates</p>
      </div>
      <div class="card">
        <p style="color: var(--accent-danger);">Failed to load templates. Please try again.</p>
      </div>
    `;
  }
}

function renderTemplateCards(templates) {
  if (templates.length === 0) {
    return '<div class="templates-empty"><p>No templates found</p></div>';
  }

  return templates.map(t => `
    <div class="template-card" data-template-id="${t.id}">
      <div class="template-icon">${t.icon}</div>
      <div class="template-card-content">
        <h3 class="template-name">${t.name}</h3>
        <p class="template-description">${t.description}</p>
        <div class="template-meta">
          <span class="template-badge difficulty-${t.difficulty}">
            ${capitalize(t.difficulty)}
          </span>
          <span class="template-meta-item">
            ⏱️ ${t.duration}
          </span>
          <span class="template-meta-item">
            📋 ${t.intentCount} intents
          </span>
          <span class="template-meta-item">
            🎯 ${t.milestoneCount} milestones
          </span>
        </div>
      </div>
      <button class="btn btn-primary template-view-btn">
        View Details
      </button>
    </div>
  `).join('');
}

function attachCardListeners(container) {
  container.querySelectorAll('.template-card').forEach(card => {
    card.querySelector('.template-view-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      const templateId = card.dataset.templateId;
      await showTemplateDetail(templateId);
    });
  });
}

async function showTemplateDetail(templateId) {
  const modal = document.getElementById('template-modal');
  const detailContainer = document.getElementById('template-detail');

  modal.style.display = 'block';
  detailContainer.innerHTML = '<div class="loading-spinner"></div>';

  try {
    const [templateRes, previewRes] = await Promise.all([
      fetch(`http://localhost:3000/api/templates/${templateId}`),
      fetch(`http://localhost:3000/api/templates/${templateId}/preview`)
    ]);

    const { template } = await templateRes.json();
    const { preview } = await previewRes.json();
    selectedTemplate = template;

    detailContainer.innerHTML = `
      <div class="template-detail-header">
        <div class="template-detail-icon">${template.icon}</div>
        <div>
          <h2>${template.name}</h2>
          <p class="template-detail-desc">${template.description}</p>
          <div class="template-detail-meta">
            <span class="badge difficulty-${template.difficulty}">${capitalize(template.difficulty)}</span>
            <span>⏱️ ${template.duration}</span>
            <span>📂 ${capitalize(template.category)}</span>
          </div>
        </div>
        <button class="template-close" id="close-modal">✕</button>
      </div>

      <div class="template-detail-body">
        <div class="template-section">
          <h3>📋 Intents (${preview.details.intents.length})</h3>
          <div class="intent-preview-list">
            ${preview.details.intents.map((intent, i) => `
              <div class="intent-preview-item">
                <span class="intent-number">${i + 1}</span>
                <div class="intent-preview-content">
                  <strong>${intent.title}</strong>
                  <div class="intent-preview-meta">
                    <span class="badge badge-${intent.stage}">${intent.stage}</span>
                    <span class="priority-${intent.priority}">${intent.priority.toUpperCase()}</span>
                    ${intent.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="template-section">
          <h3>🎯 Milestones (${preview.details.milestones.length})</h3>
          <div class="milestone-preview-list">
            ${preview.details.milestones.map(m => `
              <div class="milestone-preview-item">
                <div class="milestone-day">Day ${m.targetDays}</div>
                <div class="milestone-preview-content">
                  <strong>${m.name}</strong>
                  <p>${m.description}</p>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="template-section">
          <h3>👥 People (${preview.details.persons.length})</h3>
          <div class="person-preview-list">
            ${preview.details.persons.map(p => `
              <div class="person-preview-item">
                <div class="person-preview-avatar">${p.name.charAt(0)}</div>
                <div>
                  <strong>${p.name}</strong>
                  <span class="person-role">${p.role}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div class="template-detail-footer">
        <div class="template-options">
          <label>
            <input type="checkbox" id="add-prefix" />
            Add prefix to all items
          </label>
          <input type="text" id="prefix-input" placeholder="e.g., Q1 2026" class="template-prefix-input" disabled />
        </div>
        <div class="template-actions">
          <button class="btn" id="cancel-apply">Cancel</button>
          <button class="btn btn-primary" id="apply-template">
            Apply Template
          </button>
        </div>
      </div>
    `;

    // Modal close handlers
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-apply').addEventListener('click', closeModal);
    document.querySelector('.template-modal-backdrop').addEventListener('click', closeModal);

    // Prefix checkbox
    const prefixCheckbox = document.getElementById('add-prefix');
    const prefixInput = document.getElementById('prefix-input');
    prefixCheckbox.addEventListener('change', () => {
      prefixInput.disabled = !prefixCheckbox.checked;
      if (prefixCheckbox.checked) prefixInput.focus();
    });

    // Apply template
    document.getElementById('apply-template').addEventListener('click', async () => {
      await applyTemplate(templateId, prefixCheckbox.checked ? prefixInput.value : '');
    });

  } catch (error) {
    console.error('Failed to load template details:', error);
    detailContainer.innerHTML = `
      <div class="card">
        <p style="color: var(--accent-danger);">Failed to load template details</p>
      </div>
    `;
  }
}

function closeModal() {
  const modal = document.getElementById('template-modal');
  modal.style.display = 'none';
  selectedTemplate = null;
}

async function applyTemplate(templateId, prefix) {
  const btn = document.getElementById('apply-template');
  btn.disabled = true;
  btn.innerHTML = 'Applying...';

  try {
    const response = await fetch(`http://localhost:3000/api/templates/${templateId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prefix: prefix || undefined,
        adjustDates: true,
        mergeDuplicates: true
      })
    });

    const result = await response.json();

    if (result.success) {
      // Show success message
      const detailContainer = document.getElementById('template-detail');
      detailContainer.innerHTML = `
        <div class="template-success">
          <div class="success-icon">✅</div>
          <h2>Template Applied Successfully!</h2>
          <p>Your workflow has been created.</p>
          <div class="success-stats">
            <div class="success-stat">
              <span class="success-stat-value">${result.results.intentsCreated}</span>
              <span class="success-stat-label">Intents Created</span>
            </div>
            <div class="success-stat">
              <span class="success-stat-value">${result.results.milestoneCount || result.results.trajectoryCreated}</span>
              <span class="success-stat-label">Trajectory Created</span>
            </div>
            <div class="success-stat">
              <span class="success-stat-value">${result.results.personsCreated}</span>
              <span class="success-stat-label">People Added</span>
            </div>
            <div class="success-stat">
              <span class="success-stat-value">${result.results.relationsCreated}</span>
              <span class="success-stat-label">Relations Created</span>
            </div>
          </div>
          <div class="success-actions">
            <button class="btn btn-primary" id="view-timeline">View Timeline</button>
            <button class="btn" id="close-success">Close</button>
          </div>
        </div>
      `;

      document.getElementById('view-timeline').addEventListener('click', () => {
        closeModal();
        document.querySelector('[data-panel="timeline"]').click();
      });

      document.getElementById('close-success').addEventListener('click', closeModal);

    } else {
      throw new Error(result.error || 'Failed to apply template');
    }

  } catch (error) {
    console.error('Failed to apply template:', error);
    btn.disabled = false;
    btn.innerHTML = 'Apply Template';
    alert('Failed to apply template: ' + error.message);
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
