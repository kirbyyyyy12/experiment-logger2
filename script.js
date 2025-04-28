let experiments = [];
let historyStack = [];
let redoStack = [];

document.addEventListener('DOMContentLoaded', function() {
  // Initialize the application
  updateDashboard();
  updateLog();
  
  // Setup event listeners
  document.getElementById('experimentForm').addEventListener('submit', handleExperimentSubmit);
  document.getElementById('undo').addEventListener('click', handleUndo);
  document.getElementById('redo').addEventListener('click', handleRedo);
  document.getElementById('exportCSV').addEventListener('click', handleExportCSV);
  document.getElementById('exportPDF').addEventListener('click', handleExportPDF);
  document.getElementById('exportMD').addEventListener('click', handleExportMD);
  
  // Setup search functionality
  document.getElementById('searchInput').addEventListener('input', handleSearch);
  document.getElementById('filterTag').addEventListener('input', handleFilters);
  document.getElementById('filterDate').addEventListener('change', handleFilters);
  document.getElementById('filterStatus').addEventListener('change', handleFilters);
});

// Handle experiment form submission
function handleExperimentSubmit(e) {
  e.preventDefault();
  
  const experiment = {
    id: Date.now(), // Unique ID for the experiment
    title: document.getElementById('title').value,
    datetime: document.getElementById('datetime').value,
    description: document.getElementById('description').value,
    researchers: document.getElementById('researchers').value,
    tags: document.getElementById('tags').value.split(',').map(tag => tag.trim()),
    steps: document.getElementById('steps').value,
    materials: document.getElementById('materials').value,
    observations: document.getElementById('observations').value,
    status: document.getElementById('status').value,
    media: Array.from(document.getElementById('media').files).map(file => file.name),
    observationMedia: Array.from(document.getElementById('observationMedia').files).map(file => file.name),
    createdAt: new Date().toISOString()
  };
  
  // Add experiment and update history
  experiments.push(experiment);
  historyStack.push(JSON.parse(JSON.stringify(experiments)));
  redoStack = [];
  
  // Show success message
  showNotification('✅ Experiment logged successfully!');
  
  // Update UI
  updateDashboard();
  updateLog();
  
  // Reset form
  this.reset();
  
  // Switch to log view
  showSection('log');
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
    const expDate = new Date(exp.datetime);
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
    new Date(b.datetime) - new Date(a.datetime)
  );

  // Create log entries
  sortedExperiments.forEach((exp) => {
    const expDiv = document.createElement('div');
    expDiv.className = `experiment-entry ${exp.status.toLowerCase().replace(' ', '-')}`;
    
    // Format date
    const expDate = new Date(exp.datetime);
    const formattedDate = expDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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
      <button class="view-details-btn" data-id="${exp.id}">
        <i class="fas fa-eye"></i> View Details
      </button>
    `;
    
    log.appendChild(expDiv);
  });
  
  // Add event listeners to view details buttons
  document.querySelectorAll('.view-details-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const expId = parseInt(this.getAttribute('data-id'));
      viewExperimentDetails(expId);
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
  
  // Create modal content
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h2>${experiment.title}</h2>
        <button class="close-modal"><i class="fas fa-times"></i></button>
      </div>
      <div class="modal-body">
        <div class="experiment-meta">
          <p><strong><i class="fas fa-calendar"></i> Date:</strong> ${new Date(experiment.datetime).toLocaleString()}</p>
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
  document.body.appendChild(modal);
  
  // Setup event listeners
  modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
  modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
  
  // Setup edit button
  modal.querySelector('.edit-btn').addEventListener('click', function() {
    const expId = parseInt(this.getAttribute('data-id'));
    editExperiment(expId);
    modal.remove();
  });
  
  // Setup delete button
  modal.querySelector('.delete-btn').addEventListener('click', function() {
    const expId = parseInt(this.getAttribute('data-id'));
    deleteExperiment(expId);
    modal.remove();
  });
}

// Placeholder for edit function
function editExperiment(id) {
  showNotification('Edit functionality coming soon!', 'info');
}

// Delete experiment
function deleteExperiment(id) {
  // Find index
  const index = experiments.findIndex(exp => exp.id === id);
  if (index === -1) return;
  
  // Remove experiment
  experiments.splice(index, 1);
  
  // Update history
  historyStack.push(JSON.parse(JSON.stringify(experiments)));
  redoStack = [];
  
  // Update UI
  updateDashboard();
  updateLog();
  
  // Show notification
  showNotification('Experiment deleted successfully');
}

// Handle search
function handleSearch() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  filterExperiments();
}

// Handle filters
function handleFilters() {
  filterExperiments();
}

// Filter experiments based on search and filters
function filterExperiments() {
  // Get filter values
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const tagFilter = document.getElementById('filterTag').value.toLowerCase();
  const dateFilter = document.getElementById('filterDate').value;
  const statusFilter = document.getElementById('filterStatus').value;
  
  // Select all experiment entries
  const entries = document.querySelectorAll('.experiment-entry');
  
  // Filter experiments
  entries.forEach(entry => {
    const title = entry.querySelector('h3').textContent.toLowerCase();
    const status = entry.querySelector('.exp-status').textContent.toLowerCase();
    const researchers = entry.querySelector('.exp-researchers').textContent.toLowerCase();
    const tags = Array.from(entry.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
    const dateElement = entry.querySelector('.exp-date').textContent;
    
    // Check if all filters match
    const matchesSearch = !searchTerm || 
      title.includes(searchTerm) || 
      researchers.includes(searchTerm) || 
      tags.some(tag => tag.includes(searchTerm));
    
    const matchesTag = !tagFilter || tags.some(tag => tag.includes(tagFilter));
    
    const matchesStatus = !statusFilter || status.includes(statusFilter.toLowerCase());
    
    const matchesDate = !dateFilter || dateElement.includes(dateFilter);
    
    // Show or hide based on filters
    if (matchesSearch && matchesTag && matchesStatus && matchesDate) {
      entry.style.display = 'block';
    } else {
      entry.style.display = 'none';
    }
  });
}

// Undo
function handleUndo() {
  if (historyStack.length > 1) {
    redoStack.push(historyStack.pop());
    experiments = JSON.parse(JSON.stringify(historyStack[historyStack.length - 1]));
    updateDashboard();
    updateLog();
    showNotification('Undo successful');
  } else {
    showNotification('Nothing to undo', 'info');
  }
}

// Redo
function handleRedo() {
  if (redoStack.length > 0) {
    historyStack.push(JSON.parse(JSON.stringify(redoStack.pop())));
    experiments = JSON.parse(JSON.stringify(historyStack[historyStack.length - 1]));
    updateDashboard();
    updateLog();
    showNotification('Redo successful');
  } else {
    showNotification('Nothing to redo',
