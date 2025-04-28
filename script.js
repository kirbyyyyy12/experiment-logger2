let experiments = [];

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  loadExperiments();
  updateDashboard();
  updateLog();
  
  // Setup event listeners
  document.getElementById('experimentForm').addEventListener('submit', handleExperimentSubmit);
  
  // Setup search functionality
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('filterTag').addEventListener('input', handleFilters);
  document.getElementById('filterDate').addEventListener('change', handleFilters);
  document.getElementById('filterStatus').addEventListener('change', handleFilters);
});

// Load experiments from local storage
function loadExperiments() {
  const savedExperiments = localStorage.getItem('scienceLogExperiments');
  if (savedExperiments) {
    experiments = JSON.parse(savedExperiments);
  }
}

// Save experiments to local storage
function saveExperiments() {
  localStorage.setItem('scienceLogExperiments', JSON.stringify(experiments));
}

// Handle experiment form submission
function handleExperimentSubmit(e) {
  e.preventDefault();
  
  const editingId = document.getElementById('editingId').value;
  const isEditing = editingId !== '';
  
  const experiment = {
    id: isEditing ? parseInt(editingId) : Date.now(), // Unique ID for the experiment
    title: document.getElementById('title').value,
    date: document.getElementById('date').value,
    description: document.getElementById('description').value,
    researchers: document.getElementById('researchers').value,
    tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()),
    steps: document.getElementById('steps').value,
    materials: document.getElementById('materials').value,
    observations: document.getElementById('observations').value,
    status: document.getElementById('status').value,
    media: Array.from(document.getElementById('media').files).map(file => file.name),
    observationMedia: Array.from(document.getElementById('observationMedia').files).map(file => file.name),
    createdAt: isEditing ? experiments.find(exp => exp.id === parseInt(editingId)).createdAt : new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  if (isEditing) {
    // Update existing experiment
    const index = experiments.findIndex(exp => exp.id === parseInt(editingId));
    if (index !== -1) {
      experiments[index] = experiment;
      showNotification('✅ Experiment updated successfully!');
    }
  } else {
    // Add new experiment
    experiments.push(experiment);
    showNotification('✅ Experiment logged successfully!');
  }
  
  // Save and update UI
  saveExperiments();
  updateDashboard();
  updateLog();
  
  // Reset form and editing state
  resetForm();
  
  // Switch to log view
  showSection('log');
}

// Reset form
function resetForm() {
  document.getElementById('experimentForm').reset();
  document.getElementById('editingId').value = '';
  document.getElementById('submitButtonText').textContent = 'Log This Experiment';
}

// Display notification
function showNotification(message, type = 'success') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  // Add to body
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.classList.add('fade-out');
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

// Update Dashboard Quick Stats
function updateDashboard() {
  const statsSummary = document.getElementById('statsSummary');
  
  if (experiments.length === 0) {
    statsSummary.innerHTML = '0 experiments logged';
    return;
  }
  
  // Count experiments by status
  const statusCounts = experiments.reduce((acc, exp) => {
    acc[exp.status] = (acc[exp.status] || 0) + 1;
    return acc;
  }, {});
  
  // Get current month's experiments
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthExperiments = experiments.filter(exp => {
    const expDate = new Date(exp.date);
    return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
  });
  
  // Update stats
  statsSummary.innerHTML = `
    <span class="stat-item">${experiments.length} total experiments</span>
    <span class="stat-item">${thisMonthExperiments.length} this month</span>
    <span class="stat-item">${statusCounts['Completed'] || 0} completed</span>
    <span class="stat-item">${statusCounts['In Progress'] || 0} in progress</span>
  `;
}

// Update Log View
function updateLog() {
  const log = document.getElementById('log');
  
  // Clear previous content
  log.innerHTML = '<h2><i class="fas fa-book"></i> Experiment Log</h2>';
  
  if (experiments.length === 0) {
    log.innerHTML += '<p class="empty-log-message">No experiments logged yet. Create a new experiment to get started.</p>';
    return;
  }

  // Sort experiments by date (newest first)
  const sortedExperiments = [...experiments].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Create log entries
  sortedExperiments.forEach((exp) => {
    const expDiv = document.createElement('div');
    expDiv.className = `experiment-entry ${exp.status.toLowerCase().replace(' ', '-')}`;
    
    // Format date
    const expDate = new Date(exp.date);
    const formattedDate = expDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
    
    // Build experiment entry
    expDiv.innerHTML = `
      <h3>${exp.title}</h3>
      <div class="experiment-meta">
        <span class="exp-date"><i class="fas fa-calendar"></i> ${formattedDate}</span>
        <span class="exp-status status-${exp.status.toLowerCase().replace(' ', '-')}">
          <i class="fas fa-tag"></i> ${exp.status}
        </span>
        <span class="exp-researchers"><i class="fas fa-users"></i> ${exp.researchers}</span>
      </div>
      <div class="experiment-tags">
        ${exp.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
      </div>
      <p class="exp-description">${exp.description}</p>
      <div class="experiment-actions">
        <button class="edit-btn" data-id="${exp.id}">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="view-details-btn" data-id="${exp.id}">
          <i class="fas fa-eye"></i> View Details
        </button>
        <button class="delete-btn" data-id="${exp.id}">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    `;
    
    log.appendChild(expDiv);
  });
  
  // Add event listeners to buttons
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const expId = parseInt(this.getAttribute('data-id'));
      viewExperimentDetails(expId);
    });
  });
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const expId = parseInt(this.getAttribute('data-id'));
      editExperiment(expId);
    });
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const expId = parseInt(this.getAttribute('data-id'));
      deleteExperiment(expId);
    });
  });
}

// View experiment details
function viewExperimentDetails(id) {
  const experiment = experiments.find(exp => exp.id === id);
  if (!experiment) return;
  
  // Create modal overlay
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  
  // Format date
  const expDate = new Date(experiment.date);
  const formattedDate = expDate.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric'
  });
  
  // Create modal content
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${experiment.title}</h2>
        <button class="close-modal"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <div class="experiment-meta">
          <p><strong><i class="fas fa-calendar"></i> Date:</strong> ${formattedDate}</p>
          <p><strong><i class="fas fa-users"></i> Researchers:</strong> ${experiment.researchers}</p>
          <p><strong><i class="fas fa-tag"></i> Status:</strong> ${experiment.status}</p>
          <p><strong><i class="fas fa-tags"></i> Tags:</strong> ${experiment.tags.join(', ')}</p>
        </div>
        
        <h3><i class="fas fa-info-circle"></i> Description</h3>
        <p>${experiment.description}</p>
        
        <h3><i class="fas fa-list-ol"></i> Procedure</h3>
        <p>${experiment.steps}</p>
        
        <h3><i class="fas fa-flask"></i> Materials</h3>
        <p>${experiment.materials}</p>
        
        <h3><i class="fas fa-eye"></i> Observations</h3>
        <p>${experiment.observations}</p>
        
        ${experiment.media.length ? `
          <h3><i class="fas fa-image"></i> Media</h3>
          <p>Attached files: ${experiment.media.join(', ')}</p>
        ` : ''}
        
        ${experiment.observationMedia.length ? `
          <h3><i class="fas fa-camera"></i> Observation Media</h3>
          <p>Attached files: ${experiment.observationMedia.join(', ')}</p>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button class="edit-btn" data-id="${experiment.id}"><i class="fas fa-edit"></i> Edit</button>
        <button class="delete-btn" data-id="${experiment.id}"><i class="fas fa-trash"></i> Delete</button>
        <button class="close-btn">Close</button>
      </div>
    </div>
  `;
  
  // Add to body
  document.body.appendChild(modal
