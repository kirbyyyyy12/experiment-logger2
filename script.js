let experiments = [];
let historyStack = [];
let redoStack = [];

document.getElementById('experimentForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const experiment = {
    title: document.getElementById('title').value,
    datetime: document.getElementById('datetime').value,
    description: document.getElementById('description').value,
    researchers: document.getElementById('researchers').value,
    tags: document.getElementById('tags').value,
    steps: document.getElementById('steps').value,
    materials: document.getElementById('materials').value,
    observations: document.getElementById('observations').value,
    status: document.getElementById('status').value,
    media: document.getElementById('media').files,
    observationMedia: document.getElementById('observationMedia').files
  };
  
  experiments.push(experiment);
  historyStack.push([...experiments]);
  redoStack = [];
  
  alert("✅ Experiment logged successfully!");
  updateDashboard();
  updateLog();
  
  this.reset();
});

// Switch Sections
function showSection(id) {
  document.querySelectorAll('.section').forEach(sec => sec.style.display = 'none');
  document.getElementById(id).style.display = 'block';
}

// Update Dashboard Quick Stats
function updateDashboard() {
  const statsSummary = document.getElementById('statsSummary');
  statsSummary.innerText = `${experiments.length} experiments logged this month`;
}

// Update Log View
function updateLog() {
  const log = document.getElementById('log');
  log.innerHTML = '';
  
  if (experiments.length === 0) {
    log.innerHTML = '<p class="empty-log-message">No experiments logged yet.</p>';
    return;
  }

  experiments.forEach((exp, index) => {
    const expDiv = document.createElement('div');
    expDiv.className = 'experiment-entry';
    expDiv.innerHTML = `
      <h3>${exp.title}</h3>
      <p><strong>Date:</strong> ${exp.datetime}</p>
      <p><strong>Status:</strong> ${exp.status}</p>
      <p>${exp.description}</p>
    `;
    log.appendChild(expDiv);
  });
}

// Export Functions (placeholder)
document.getElementById('exportCSV').addEventListener('click', () => {
  alert("🚀 Export to CSV coming soon!");
});
document.getElementById('exportPDF').addEventListener('click', () => {
  alert("🚀 Export to PDF coming soon!");
});
document.getElementById('exportMD').addEventListener('click', () => {
  alert("🚀 Export to Markdown coming soon!");
});

// Undo / Redo
document.getElementById('undo').addEventListener('click', () => {
  if (historyStack.length > 1) {
    redoStack.push(historyStack.pop());
    experiments = [...historyStack[historyStack.length - 1]];
    updateDashboard();
    updateLog();
  }
});

document.getElementById('redo').addEventListener('click', () => {
  if (redoStack.length > 0) {
    historyStack.push(redoStack.pop());
    experiments = [...historyStack[historyStack.length - 1]];
    updateDashboard();
    updateLog();
  }
});
