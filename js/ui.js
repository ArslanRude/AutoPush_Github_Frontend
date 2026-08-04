/**
 * AutoPush UI Controller
 * Manages view states, DOM elements, rendering, tabs, and interactivity.
 */

const UI = {
  views: {
    compose: 'view-compose',
    loading: 'view-loading',
    results: 'view-results'
  },
  loadingInterval: null,

  /**
   * Switch between views ('compose', 'loading', 'results')
   */
  showView(name) {
    Object.values(this.views).forEach(id => {
      document.getElementById(id).classList.remove('on');
    });
    const target = document.getElementById(this.views[name]);
    if (target) target.classList.add('on');
  },

  /**
   * Start cycling loading messages
   */
  startLoadingMessages() {
    const loadingText = document.getElementById('loadingText');
    let idx = 0;
    loadingText.textContent = CONFIG.LOADING_MESSAGES[0];
    
    this.stopLoadingMessages();
    this.loadingInterval = setInterval(() => {
      idx = (idx + 1) % CONFIG.LOADING_MESSAGES.length;
      loadingText.style.opacity = '0';
      setTimeout(() => {
        loadingText.textContent = CONFIG.LOADING_MESSAGES[idx];
        loadingText.style.opacity = '1';
      }, 250);
    }, 3200);
  },

  /**
   * Stop loading messages interval
   */
  stopLoadingMessages() {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
  },

  /**
   * Display error message in the error box
   */
  showError(message) {
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent = `Error: ${message}\n\nCheck that the API is running and the URL is correct.`;
    errorBox.classList.add('on');
  },

  /**
   * Clear error message
   */
  clearError() {
    const errorBox = document.getElementById('errorBox');
    errorBox.textContent = '';
    errorBox.classList.remove('on');
  },

  /**
   * Get file extension
   */
  getFileExt(path) {
    const match = path.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : 'default';
  },

  /**
   * Normalize files array from API response format
   */
  extractFiles(files) {
    if (!files) return [];
    if (Array.isArray(files)) {
      return files.map((f, i) => {
        if (typeof f === 'string') return { path: `file_${i}`, content: f };
        const path = f.path || f.filename || f.file_path || f.name || `file_${i}`;
        const content = f.content ?? f.code ?? f.text ?? JSON.stringify(f, null, 2);
        return { path, content };
      });
    }
    if (typeof files === 'object') {
      return Object.entries(files).map(([path, content]) => ({
        path,
        content: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
      }));
    }
    return [];
  },

  /**
   * Render results overview and stats
   */
  renderResults(data) {
    document.getElementById('repoName').textContent = data.topic || 'Generated Project';
    document.getElementById('outDescription').textContent = data.description || '—';

    const files = this.extractFiles(data.files);
    
    // Render Stats
    const statList = document.getElementById('statList');
    statList.innerHTML = `
      <div class="stat-row">
        <span class="stat-k">Files generated</span>
        <span class="stat-v">${files.length}</span>
      </div>
      <div class="stat-row">
        <span class="stat-k">Status</span>
        <span class="stat-v">${data.status || 'success'}</span>
      </div>
      <div class="stat-row">
        <span class="stat-k">Topic</span>
        <span class="stat-v">${(data.topic || '—').slice(0, 28)}</span>
      </div>
    `;

    this.renderWorkflow(data.workflow);
    this.renderFiles(files);
  },

  /**
   * Render workflow graph/steps
   */
  renderWorkflow(workflow) {
    const card = document.getElementById('workflowCard');
    let steps = null;

    if (Array.isArray(workflow)) steps = workflow;
    else if (workflow && Array.isArray(workflow.steps)) steps = workflow.steps;

    if (steps && steps.length && typeof steps[0] !== 'string') {
      card.innerHTML = `
        <div class="card-h">Pipeline Steps</div>
        <div class="flow" id="flowBody">
          <div class="flow-line"></div>
        </div>
      `;
      const body = document.getElementById('flowBody');
      steps.forEach((s, i) => {
        const title = s.name || s.title || s.step || `Step ${i + 1}`;
        const desc = s.description || s.detail || s.desc || '';
        const el = document.createElement('div');
        el.className = 'flow-step';
        el.innerHTML = `
          <div class="flow-dot">${i + 1}</div>
          <div class="flow-title">${title}</div>
          <div class="flow-desc">${desc}</div>
        `;
        body.appendChild(el);
      });
    } else {
      card.innerHTML = `
        <div class="card-h">Workflow JSON</div>
        <pre class="json">${workflow ? JSON.stringify(workflow, null, 2) : 'No workflow returned'}</pre>
      `;
    }
  },

  /**
   * Render list of generated files & active file view
   */
  renderFiles(files) {
    const list = document.getElementById('fileList');
    const pathEl = document.getElementById('filePath');
    const codeEl = document.getElementById('fileCode');
    
    list.innerHTML = '';
    document.getElementById('fileCount').textContent = `${files.length} ${files.length === 1 ? 'file' : 'files'}`;

    if (!files.length) {
      list.innerHTML = '<div class="empty">No files returned</div>';
      pathEl.innerHTML = '<span>—</span>';
      codeEl.textContent = '';
      return;
    }

    files.forEach((f, i) => {
      const item = document.createElement('div');
      item.className = `file-item ${i === 0 ? 'active' : ''}`;
      const color = CONFIG.EXT_COLORS[this.getFileExt(f.path)] || CONFIG.EXT_COLORS.default;
      
      item.innerHTML = `
        <span class="file-dot" style="background:${color}"></span>
        <span>${f.path}</span>
      `;
      
      item.addEventListener('click', () => {
        document.querySelectorAll('.file-item').forEach(el => el.classList.remove('active'));
        item.classList.add('active');
        this.setFile(f);
      });
      list.appendChild(item);
    });

    this.setFile(files[0]);
  },

  /**
   * Display active file content and set up copy button
   */
  setFile(file) {
    const pathEl = document.getElementById('filePath');
    const codeEl = document.getElementById('fileCode');

    pathEl.innerHTML = `
      <span>${file.path}</span>
      <button class="copy-btn" id="copyBtn">Copy</button>
    `;
    codeEl.textContent = file.content;

    document.getElementById('copyBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(file.content);
      const btn = document.getElementById('copyBtn');
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = 'Copy';
      }, 1200);
    });
  }
};
