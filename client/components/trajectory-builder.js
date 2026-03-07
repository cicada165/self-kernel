/**
 * Visual Trajectory Builder with Drag-and-Drop Milestones
 *
 * Interactive UI for creating and managing trajectories with visual milestone arrangement.
 * Features drag-and-drop, milestone sequencing, and real-time updates.
 */

import { fetchAPI } from '../api.js';

let currentTrajectory = null;
let milestones = [];
let availableIntents = [];
let draggedMilestone = null;

/**
 * Initialize the trajectory builder
 */
export async function initTrajectoryBuilder(trajectoryId = null) {
  const container = document.getElementById('trajectory-builder');
  if (!container) return;

  // Load data
  try {
    availableIntents = await fetchAPI('/intents');

    if (trajectoryId) {
      const trajectories = await fetchAPI('/trajectories');
      currentTrajectory = trajectories.find(t => t.id === trajectoryId);
      milestones = currentTrajectory?.milestones || [];
    } else {
      currentTrajectory = null;
      milestones = [];
    }

    renderBuilder(container);
  } catch (error) {
    container.innerHTML = `<div class="error">Failed to load trajectory builder: ${error.message}</div>`;
  }
}

/**
 * Render the trajectory builder UI
 */
function renderBuilder(container) {
  container.innerHTML = `
    <div class="trajectory-builder">
      <!-- Header Section -->
      <div class="builder-header">
        <h2>${currentTrajectory ? 'Edit Trajectory' : 'Create New Trajectory'}</h2>
        <div class="builder-actions">
          <button id="save-trajectory" class="btn-primary">Save Trajectory</button>
          <button id="cancel-builder" class="btn-secondary">Cancel</button>
        </div>
      </div>

      <!-- Trajectory Info Form -->
      <div class="trajectory-info-form">
        <div class="form-group">
          <label for="trajectory-label">Trajectory Label</label>
          <input
            type="text"
            id="trajectory-label"
            placeholder="e.g., Path to Product Launch"
            value="${currentTrajectory?.label || ''}"
            required
          />
        </div>
        <div class="form-group">
          <label for="trajectory-description">Description</label>
          <textarea
            id="trajectory-description"
            placeholder="Describe the journey and goals..."
            rows="3"
          >${currentTrajectory?.description || ''}</textarea>
        </div>
      </div>

      <!-- Drag-and-Drop Canvas -->
      <div class="milestone-canvas">
        <div class="canvas-header">
          <h3>📍 Milestone Sequence</h3>
          <button id="add-milestone" class="btn-small">+ Add Milestone</button>
        </div>

        <div class="canvas-grid" id="milestone-grid">
          ${renderMilestoneGrid()}
        </div>

        <div class="canvas-legend">
          <div class="legend-item">
            <span class="status-indicator completed"></span> Completed
          </div>
          <div class="legend-item">
            <span class="status-indicator in-progress"></span> In Progress
          </div>
          <div class="legend-item">
            <span class="status-indicator planned"></span> Planned
          </div>
        </div>
      </div>

      <!-- Intent Selector Sidebar -->
      <div class="intent-selector">
        <h3>Available Intents</h3>
        <input
          type="text"
          id="intent-search"
          placeholder="Search intents..."
          class="search-input"
        />
        <div class="intent-list" id="intent-list">
          ${renderIntentList()}
        </div>
      </div>
    </div>
  `;

  setupEventListeners();
}

/**
 * Render milestone grid with drag-and-drop support
 */
function renderMilestoneGrid() {
  if (milestones.length === 0) {
    return `
      <div class="empty-canvas">
        <p>No milestones yet. Drag intents here or click "+ Add Milestone"</p>
      </div>
    `;
  }

  return milestones.map((milestone, index) => {
    const intent = availableIntents.find(i => i.id === milestone.intentId);
    return `
      <div
        class="milestone-card ${milestone.completed ? 'completed' : 'planned'}"
        data-milestone-id="${milestone.id}"
        data-index="${index}"
        draggable="true"
      >
        <div class="milestone-number">${index + 1}</div>
        <div class="milestone-content">
          <div class="milestone-label">${milestone.label || (intent?.title || 'Unnamed Milestone')}</div>
          <div class="milestone-meta">
            ${intent ? `<span class="intent-ref">${intent.title}</span>` : ''}
            <span class="milestone-status ${milestone.completed ? 'completed' : 'planned'}">
              ${milestone.completed ? '✓ Completed' : '○ Planned'}
            </span>
          </div>
        </div>
        <div class="milestone-actions">
          <button class="action-btn edit-milestone" data-milestone-id="${milestone.id}" title="Edit">
            ✎
          </button>
          <button class="action-btn toggle-complete" data-milestone-id="${milestone.id}" title="Toggle complete">
            ${milestone.completed ? '○' : '✓'}
          </button>
          <button class="action-btn delete-milestone" data-milestone-id="${milestone.id}" title="Delete">
            ✕
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Render list of available intents
 */
function renderIntentList(filter = '') {
  const filtered = availableIntents.filter(intent =>
    intent.title.toLowerCase().includes(filter.toLowerCase()) ||
    (intent.description && intent.description.toLowerCase().includes(filter.toLowerCase()))
  );

  if (filtered.length === 0) {
    return '<div class="no-results">No intents found</div>';
  }

  return filtered.map(intent => `
    <div
      class="intent-item"
      data-intent-id="${intent.id}"
      draggable="true"
    >
      <div class="intent-header">
        <span class="intent-title">${intent.title}</span>
        <span class="intent-stage ${intent.stage}">${intent.stage}</span>
      </div>
      ${intent.description ? `<div class="intent-description">${truncate(intent.description, 100)}</div>` : ''}
      <button class="add-to-trajectory-btn" data-intent-id="${intent.id}">
        + Add to Trajectory
      </button>
    </div>
  `).join('');
}

/**
 * Setup all event listeners
 */
function setupEventListeners() {
  // Save trajectory
  document.getElementById('save-trajectory')?.addEventListener('click', saveTrajectory);

  // Cancel
  document.getElementById('cancel-builder')?.addEventListener('click', () => {
    if (confirm('Discard changes?')) {
      window.location.hash = '#trajectories';
    }
  });

  // Add milestone button
  document.getElementById('add-milestone')?.addEventListener('click', addEmptyMilestone);

  // Intent search
  document.getElementById('intent-search')?.addEventListener('input', (e) => {
    const filter = e.target.value;
    document.getElementById('intent-list').innerHTML = renderIntentList(filter);
    setupIntentListeners();
  });

  // Setup drag-and-drop
  setupDragAndDrop();

  // Setup intent list listeners
  setupIntentListeners();

  // Setup milestone action listeners
  setupMilestoneListeners();
}

/**
 * Setup intent list event listeners
 */
function setupIntentListeners() {
  // Draggable intents
  document.querySelectorAll('.intent-item').forEach(item => {
    item.addEventListener('dragstart', (e) => {
      const intentId = e.target.dataset.intentId;
      e.dataTransfer.setData('intent-id', intentId);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });

  // Add to trajectory buttons
  document.querySelectorAll('.add-to-trajectory-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const intentId = e.target.dataset.intentId;
      addMilestoneFromIntent(intentId);
    });
  });
}

/**
 * Setup milestone event listeners
 */
function setupMilestoneListeners() {
  // Edit milestone
  document.querySelectorAll('.edit-milestone').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const milestoneId = e.target.dataset.milestoneId;
      editMilestone(milestoneId);
    });
  });

  // Toggle complete
  document.querySelectorAll('.toggle-complete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const milestoneId = e.target.dataset.milestoneId;
      toggleMilestoneComplete(milestoneId);
    });
  });

  // Delete milestone
  document.querySelectorAll('.delete-milestone').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const milestoneId = e.target.dataset.milestoneId;
      if (confirm('Delete this milestone?')) {
        deleteMilestone(milestoneId);
      }
    });
  });
}

/**
 * Setup drag-and-drop functionality
 */
function setupDragAndDrop() {
  const grid = document.getElementById('milestone-grid');

  // Drag milestone cards
  grid.querySelectorAll('.milestone-card').forEach(card => {
    card.addEventListener('dragstart', (e) => {
      draggedMilestone = e.target;
      e.target.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    card.addEventListener('dragend', (e) => {
      e.target.classList.remove('dragging');
      draggedMilestone = null;
    });

    card.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';

      const afterElement = getDragAfterElement(grid, e.clientY);
      const dragging = document.querySelector('.dragging');

      if (afterElement == null) {
        grid.appendChild(dragging);
      } else {
        grid.insertBefore(dragging, afterElement);
      }
    });
  });

  // Drop zone for new intents
  grid.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  grid.addEventListener('drop', (e) => {
    e.preventDefault();
    const intentId = e.dataTransfer.getData('intent-id');

    if (intentId && !draggedMilestone) {
      // Adding new intent from sidebar
      addMilestoneFromIntent(intentId);
    } else if (draggedMilestone) {
      // Reordering existing milestones
      reorderMilestones();
    }
  });
}

/**
 * Get element to insert dragged item after
 */
function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.milestone-card:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

/**
 * Add milestone from intent
 */
function addMilestoneFromIntent(intentId) {
  const intent = availableIntents.find(i => i.id === intentId);
  if (!intent) return;

  const milestone = {
    id: `milestone-${Date.now()}`,
    label: intent.title,
    intentId: intent.id,
    completed: false,
    position: { x: milestones.length, y: 0 }
  };

  milestones.push(milestone);
  refreshGrid();
}

/**
 * Add empty milestone
 */
function addEmptyMilestone() {
  const label = prompt('Milestone label:');
  if (!label) return;

  const milestone = {
    id: `milestone-${Date.now()}`,
    label,
    intentId: null,
    completed: false,
    position: { x: milestones.length, y: 0 }
  };

  milestones.push(milestone);
  refreshGrid();
}

/**
 * Edit milestone
 */
function editMilestone(milestoneId) {
  const milestone = milestones.find(m => m.id === milestoneId);
  if (!milestone) return;

  const newLabel = prompt('Edit milestone label:', milestone.label);
  if (newLabel !== null) {
    milestone.label = newLabel;
    refreshGrid();
  }
}

/**
 * Toggle milestone completion status
 */
function toggleMilestoneComplete(milestoneId) {
  const milestone = milestones.find(m => m.id === milestoneId);
  if (!milestone) return;

  milestone.completed = !milestone.completed;
  refreshGrid();
}

/**
 * Delete milestone
 */
function deleteMilestone(milestoneId) {
  milestones = milestones.filter(m => m.id !== milestoneId);
  refreshGrid();
}

/**
 * Reorder milestones based on DOM order
 */
function reorderMilestones() {
  const grid = document.getElementById('milestone-grid');
  const cards = [...grid.querySelectorAll('.milestone-card')];

  const newOrder = cards.map(card => {
    const milestoneId = card.dataset.milestoneId;
    return milestones.find(m => m.id === milestoneId);
  }).filter(Boolean);

  milestones = newOrder;
  milestones.forEach((m, i) => {
    m.position = { x: i, y: 0 };
  });

  refreshGrid();
}

/**
 * Refresh the milestone grid
 */
function refreshGrid() {
  const grid = document.getElementById('milestone-grid');
  grid.innerHTML = renderMilestoneGrid();
  setupDragAndDrop();
  setupMilestoneListeners();
}

/**
 * Save trajectory
 */
async function saveTrajectory() {
  const label = document.getElementById('trajectory-label').value.trim();
  const description = document.getElementById('trajectory-description').value.trim();

  if (!label) {
    alert('Please enter a trajectory label');
    return;
  }

  if (milestones.length === 0) {
    if (!confirm('Trajectory has no milestones. Save anyway?')) {
      return;
    }
  }

  const trajectoryData = {
    label,
    description,
    milestones,
    successRate: milestones.filter(m => m.completed).length / (milestones.length || 1),
    relatedIntents: milestones.map(m => m.intentId).filter(Boolean),
    tags: []
  };

  try {
    if (currentTrajectory) {
      await fetchAPI(`/trajectories/${currentTrajectory.id}`, {
        method: 'PUT',
        body: JSON.stringify(trajectoryData)
      });
      alert('Trajectory updated successfully!');
    } else {
      await fetchAPI('/trajectories', {
        method: 'POST',
        body: JSON.stringify(trajectoryData)
      });
      alert('Trajectory created successfully!');
    }

    window.location.hash = '#timeline';
  } catch (error) {
    alert(`Failed to save trajectory: ${error.message}`);
  }
}

/**
 * Helper: Truncate text
 */
function truncate(text, maxLength) {
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

export { initTrajectoryBuilder };
