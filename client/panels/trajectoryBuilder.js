/**
 * Visual Trajectory Builder Panel
 *
 * Drag-and-drop interface for creating and editing trajectories:
 * - Visual milestone placement
 * - Intent linking
 * - Progress tracking
 * - Branching paths
 */

import { api } from '../api.js';

let currentTrajectory = null;
let milestones = [];
let selectedMilestone = null;
let isDragging = false;

export async function renderTrajectoryBuilder(container) {
    container.innerHTML = '<div class="panel-header"><h2>⏳ Loading trajectory builder...</h2></div>';

    try {
        const [trajectories, intents] = await Promise.all([
            api.getTrajectories(),
            api.getIntents()
        ]);

        currentTrajectory = trajectories[0] || null;
        milestones = currentTrajectory ? currentTrajectory.milestones : [];

        container.innerHTML = `
            <div class="panel-header">
                <h2>🛤️ Trajectory Builder</h2>
                <p>Visually design your journey milestones with drag-and-drop.</p>
            </div>

            <!-- Toolbar -->
            <div class="trajectory-toolbar">
                <select id="trajectory-select" class="form-select">
                    ${trajectories.length === 0 ? '<option>No trajectories yet</option>' : ''}
                    ${trajectories.map(t => `
                        <option value="${t.id}" ${currentTrajectory?.id === t.id ? 'selected' : ''}>
                            ${t.label}
                        </option>
                    `).join('')}
                </select>

                <button class="btn-primary" onclick="window.trajectoryBuilder.createNew()">
                    ➕ New Trajectory
                </button>

                ${currentTrajectory ? `
                    <button class="btn-secondary" onclick="window.trajectoryBuilder.addMilestone()">
                        ⭐ Add Milestone
                    </button>

                    <button class="btn-secondary" onclick="window.trajectoryBuilder.save()">
                        💾 Save
                    </button>

                    <button class="btn-secondary" onclick="window.trajectoryBuilder.exportCalendar()">
                        📅 Export to Calendar
                    </button>

                    <button class="btn-danger" onclick="window.trajectoryBuilder.delete()">
                        🗑️ Delete
                    </button>
                ` : ''}
            </div>

            <!-- Canvas Container -->
            <div class="trajectory-canvas-container">
                <div id="trajectory-canvas" class="trajectory-canvas">
                    ${renderCanvas(milestones, intents)}
                </div>

                <!-- Grid Background -->
                <svg class="canvas-grid" width="100%" height="100%">
                    <defs>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <!-- Properties Panel -->
            <div class="trajectory-properties">
                ${selectedMilestone ? renderMilestoneProperties(selectedMilestone, intents) : renderTrajectoryProperties()}
            </div>

            <!-- Instructions -->
            <div class="trajectory-instructions">
                <h4>💡 Instructions</h4>
                <ul>
                    <li><strong>Drag</strong> milestones to reposition them</li>
                    <li><strong>Click</strong> a milestone to edit its properties</li>
                    <li><strong>Add Milestone</strong> to create new waypoints</li>
                    <li><strong>Link Intent</strong> to connect milestones with goals</li>
                    <li><strong>Save</strong> to persist your trajectory</li>
                </ul>
            </div>
        `;

        // Initialize drag-and-drop
        initDragAndDrop();

        // Attach event handlers
        window.trajectoryBuilder = {
            createNew: () => createNewTrajectory(container),
            addMilestone: () => addMilestone(container),
            save: () => saveTrajectory(container),
            delete: () => deleteTrajectory(container),
            selectMilestone: (id) => selectMilestone(id, container),
            updateMilestoneProperty: (id, property, value) => updateMilestoneProperty(id, property, value, container),
            completeMilestone: (id) => completeMilestone(id, container),
            removeMilestone: (id) => removeMilestone(id, container)
        };

        // Handle trajectory selection change
        const select = document.getElementById('trajectory-select');
        if (select) {
            select.addEventListener('change', async (e) => {
                const trajectoryId = e.target.value;
                const trajectory = trajectories.find(t => t.id === trajectoryId);
                if (trajectory) {
                    currentTrajectory = trajectory;
                    milestones = trajectory.milestones || [];
                    await renderTrajectoryBuilder(container);
                }
            });
        }

    } catch (error) {
        container.innerHTML = `
            <div class="panel-header">
                <h2>❌ Trajectory Builder Error</h2>
            </div>
            <div class="error-message">
                <p>Failed to load trajectory builder:</p>
                <pre>${error.message}</pre>
                <button class="btn-primary" onclick="location.reload()">Reload</button>
            </div>
        `;
    }
}

/**
 * Render the trajectory canvas with milestones
 */
function renderCanvas(milestones, intents) {
    if (!milestones || milestones.length === 0) {
        return '<div class="canvas-empty">Add milestones to start building your trajectory</div>';
    }

    // Sort milestones by position for path drawing
    const sorted = [...milestones].sort((a, b) => (a.position?.x || 0) - (b.position?.x || 0));

    return sorted.map((milestone, index) => {
        const intent = intents.find(i => i.id === milestone.intentId);
        const x = (milestone.position?.x || index) * 200 + 100;
        const y = (milestone.position?.y || 0) * 150 + 200;

        return `
            <div class="milestone-node ${milestone.completed ? 'completed' : ''} ${selectedMilestone?.id === milestone.id ? 'selected' : ''}"
                 data-milestone-id="${milestone.id}"
                 style="left: ${x}px; top: ${y}px;"
                 onclick="window.trajectoryBuilder.selectMilestone('${milestone.id}')">

                <div class="milestone-icon">${milestone.completed ? '✅' : '○'}</div>

                <div class="milestone-content">
                    <div class="milestone-label">${milestone.label || 'Unnamed Milestone'}</div>
                    ${intent ? `<div class="milestone-intent">${intent.title}</div>` : ''}
                </div>

                ${index < sorted.length - 1 ? '<div class="milestone-connector"></div>' : ''}
            </div>
        `;
    }).join('');
}

/**
 * Render milestone properties editor
 */
function renderMilestoneProperties(milestone, intents) {
    const intent = intents.find(i => i.id === milestone.intentId);

    return `
        <h3>⭐ Milestone Properties</h3>

        <div class="property-field">
            <label>Label</label>
            <input type="text"
                   class="form-input"
                   value="${milestone.label || ''}"
                   onchange="window.trajectoryBuilder.updateMilestoneProperty('${milestone.id}', 'label', this.value)">
        </div>

        <div class="property-field">
            <label>Linked Intent</label>
            <select class="form-select"
                    onchange="window.trajectoryBuilder.updateMilestoneProperty('${milestone.id}', 'intentId', this.value)">
                <option value="">No intent linked</option>
                ${intents.map(i => `
                    <option value="${i.id}" ${i.id === milestone.intentId ? 'selected' : ''}>
                        ${i.title}
                    </option>
                `).join('')}
            </select>
        </div>

        <div class="property-field">
            <label>Position</label>
            <div class="position-inputs">
                <input type="number"
                       class="form-input-small"
                       value="${milestone.position?.x || 0}"
                       onchange="window.trajectoryBuilder.updateMilestoneProperty('${milestone.id}', 'position.x', this.value)"
                       placeholder="X">
                <input type="number"
                       class="form-input-small"
                       value="${milestone.position?.y || 0}"
                       onchange="window.trajectoryBuilder.updateMilestoneProperty('${milestone.id}', 'position.y', this.value)"
                       placeholder="Y">
            </div>
        </div>

        <div class="property-field">
            <label>Status</label>
            <div class="status-toggle">
                <button class="btn-toggle ${milestone.completed ? 'active' : ''}"
                        onclick="window.trajectoryBuilder.completeMilestone('${milestone.id}')">
                    ${milestone.completed ? '✅ Completed' : '○ In Progress'}
                </button>
            </div>
        </div>

        <div class="property-actions">
            <button class="btn-danger" onclick="window.trajectoryBuilder.removeMilestone('${milestone.id}')">
                🗑️ Remove Milestone
            </button>
        </div>
    `;
}

/**
 * Render trajectory properties editor
 */
function renderTrajectoryProperties() {
    if (!currentTrajectory) {
        return '<p class="muted">Select or create a trajectory to edit its properties</p>';
    }

    const completedCount = milestones.filter(m => m.completed).length;
    const totalCount = milestones.length;
    const successRate = totalCount > 0 ? (completedCount / totalCount * 100).toFixed(0) : 0;

    return `
        <h3>🛤️ Trajectory Properties</h3>

        <div class="property-field">
            <label>Name</label>
            <input type="text"
                   class="form-input"
                   value="${currentTrajectory.label || ''}"
                   onchange="window.trajectoryBuilder.updateTrajectoryProperty('label', this.value)">
        </div>

        <div class="property-field">
            <label>Description</label>
            <textarea class="form-textarea"
                      onchange="window.trajectoryBuilder.updateTrajectoryProperty('description', this.value)">${currentTrajectory.description || ''}</textarea>
        </div>

        <div class="property-stats">
            <div class="stat">
                <span class="stat-label">Milestones:</span>
                <span class="stat-value">${totalCount}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Completed:</span>
                <span class="stat-value">${completedCount}</span>
            </div>
            <div class="stat">
                <span class="stat-label">Progress:</span>
                <span class="stat-value">${successRate}%</span>
            </div>
        </div>

        <p class="muted">Click a milestone to edit its properties</p>
    `;
}

/**
 * Initialize drag-and-drop functionality
 */
function initDragAndDrop() {
    const canvas = document.getElementById('trajectory-canvas');
    if (!canvas) return;

    const milestoneNodes = canvas.querySelectorAll('.milestone-node');

    milestoneNodes.forEach(node => {
        let offsetX, offsetY;

        node.addEventListener('mousedown', (e) => {
            if (e.target.closest('.milestone-content')) return; // Allow text selection

            isDragging = true;
            node.classList.add('dragging');

            const rect = node.getBoundingClientRect();
            const canvasRect = canvas.getBoundingClientRect();
            offsetX = e.clientX - rect.left;
            offsetY = e.clientY - rect.top;

            const onMouseMove = (e) => {
                if (!isDragging) return;

                const x = e.clientX - canvasRect.left - offsetX;
                const y = e.clientY - canvasRect.top - offsetY;

                node.style.left = `${x}px`;
                node.style.top = `${y}px`;
            };

            const onMouseUp = () => {
                isDragging = false;
                node.classList.remove('dragging');

                // Update milestone position
                const milestoneId = node.dataset.milestoneId;
                const rect = node.getBoundingClientRect();
                const canvasRect = canvas.getBoundingClientRect();

                const gridX = Math.round((rect.left - canvasRect.left - 100) / 200);
                const gridY = Math.round((rect.top - canvasRect.top - 200) / 150);

                const milestone = milestones.find(m => m.id === milestoneId);
                if (milestone) {
                    milestone.position = { x: gridX, y: gridY };
                }

                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    });
}

/**
 * Create a new trajectory
 */
async function createNewTrajectory(container) {
    const label = prompt('Enter trajectory name:');
    if (!label) return;

    try {
        const newTrajectory = await fetch('/api/trajectories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                label,
                description: '',
                milestones: [],
                successRate: 0
            })
        }).then(r => r.json());

        currentTrajectory = newTrajectory;
        milestones = [];

        await renderTrajectoryBuilder(container);
    } catch (error) {
        alert(`Failed to create trajectory: ${error.message}`);
    }
}

/**
 * Add a new milestone
 */
function addMilestone(container) {
    const label = prompt('Enter milestone name:');
    if (!label) return;

    const newMilestone = {
        id: crypto.randomUUID(),
        label,
        intentId: null,
        completed: false,
        position: { x: milestones.length, y: 0 }
    };

    milestones.push(newMilestone);
    renderTrajectoryBuilder(container);
}

/**
 * Save current trajectory
 */
async function saveTrajectory(container) {
    if (!currentTrajectory) return;

    try {
        currentTrajectory.milestones = milestones;

        const completedCount = milestones.filter(m => m.completed).length;
        currentTrajectory.successRate = milestones.length > 0 ? completedCount / milestones.length : 0;

        await fetch(`/api/trajectories/${currentTrajectory.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentTrajectory)
        });

        alert('✅ Trajectory saved successfully!');
    } catch (error) {
        alert(`Failed to save trajectory: ${error.message}`);
    }
}

/**
 * Delete current trajectory
 */
async function deleteTrajectory(container) {
    if (!currentTrajectory) return;

    const confirmed = confirm(`Delete trajectory "${currentTrajectory.label}"?`);
    if (!confirmed) return;

    try {
        await fetch(`/api/trajectories/${currentTrajectory.id}`, {
            method: 'DELETE'
        });

        currentTrajectory = null;
        milestones = [];

        await renderTrajectoryBuilder(container);
    } catch (error) {
        alert(`Failed to delete trajectory: ${error.message}`);
    }
}

/**
 * Select a milestone
 */
function selectMilestone(id, container) {
    selectedMilestone = milestones.find(m => m.id === id);
    renderTrajectoryBuilder(container);
}

/**
 * Update milestone property
 */
function updateMilestoneProperty(id, property, value, container) {
    const milestone = milestones.find(m => m.id === id);
    if (!milestone) return;

    if (property.includes('.')) {
        const [parent, child] = property.split('.');
        if (!milestone[parent]) milestone[parent] = {};
        milestone[parent][child] = parseFloat(value) || value;
    } else {
        milestone[property] = value;
    }

    renderTrajectoryBuilder(container);
}

/**
 * Toggle milestone completion
 */
function completeMilestone(id, container) {
    const milestone = milestones.find(m => m.id === id);
    if (!milestone) return;

    milestone.completed = !milestone.completed;
    renderTrajectoryBuilder(container);
}

/**
 * Remove a milestone
 */
function removeMilestone(id, container) {
    const index = milestones.findIndex(m => m.id === id);
    if (index !== -1) {
        milestones.splice(index, 1);
        if (selectedMilestone?.id === id) {
            selectedMilestone = null;
        }
        renderTrajectoryBuilder(container);
    }
}

// Update trajectory property
window.trajectoryBuilder = window.trajectoryBuilder || {};
window.trajectoryBuilder.updateTrajectoryProperty = function(property, value) {
    if (currentTrajectory) {
        currentTrajectory[property] = value;
    }
};

// Export trajectory to calendar
window.trajectoryBuilder.exportCalendar = async function() {
    if (!currentTrajectory) {
        alert('No trajectory selected');
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/calendar/trajectory/${currentTrajectory.id}`);

        if (!response.ok) {
            throw new Error('Failed to export calendar');
        }

        // Create a download link
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentTrajectory.label || 'trajectory'}.ics`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        alert('📅 Calendar exported successfully! You can now import it into your calendar app.');
    } catch (error) {
        console.error('Calendar export error:', error);
        alert('Failed to export calendar: ' + error.message);
    }
};
