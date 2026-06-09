// State Management
let toolsData = [];
let filteredTools = [];
let uniqueCategories = [];
let activeCategory = 'all';
let searchQuery = '';
let currentSort = 'name-asc';
let selectedUrls = []; // Track selected rows for deletion

// Environmental checks for local admin mode
const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
const API_BASE_URL = 'http://localhost:3000/api';
let backendAvailable = false;

// Constants
const LOCAL_STORAGE_KEY = 'tools-dashboard-category';

// SVG Icons markup declarations
const sparklesSvg = `
  <svg viewBox="0 0 24 24" fill="none" class="sparkles-icon" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 4L10.3 8.7L6 10.3L10.3 12L12 16.3L13.7 12L18 10.3L13.7 8.7L12 4Z" fill="currentColor"/>
    <path d="M6 3L5.2 5.2L3 6L5.2 6.8L6 9L6.8 6.8L9 6L6.8 5.2L6 3Z" fill="currentColor"/>
    <path d="M18 15L17.2 17.2L15 18L17.2 18.8L18 21L18.8 18.8L21 18L18.8 17.2L18 15Z" fill="currentColor"/>
  </svg>
`;

const externalLinkSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
    <polyline points="15 3 21 3 21 9"></polyline>
    <line x1="10" y1="14" x2="21" y2="3"></line>
  </svg>
`;

const copyIconSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="copy-icon">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1"></path>
  </svg>
`;

const successIconSvg = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="success-icon" style="color: #4ade80;">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
`;

const checkIconSvg = `
  <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
`;

// Helper: Stable gradient hash picker based on tool name
function getStableGradientClass(toolName) {
  let hash = 0;
  for (let i = 0; i < toolName.length; i++) {
    hash = toolName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash % 5) + 1;
  return `icon-grad-${index}`;
}

// Check if Express backend is running locally
async function checkBackendStatus() {
  if (!isLocal) return;
  try {
    const response = await fetch(`${API_BASE_URL}/tools`, { method: 'GET' });
    if (response.ok) {
      backendAvailable = true;
    }
  } catch (error) {
    console.warn('Backend server is not running on port 3000. Local admin actions are disabled.');
    backendAvailable = false;
  }
}

// 1. Load data from JSON
async function loadTools() {
  try {
    // Verify backend availability first
    await checkBackendStatus();
    
    // Toggle Admin Toolbar display based on environment and server status
    const adminToolbar = document.getElementById('admin-toolbar');
    if (isLocal && backendAvailable) {
      adminToolbar.classList.remove('hidden');
    } else {
      adminToolbar.classList.add('hidden');
    }
    
    // Fetch data using cache buster query parameter to guarantee updates reflect instantly
    const response = await fetch(`datas/tools.json?t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    toolsData = data.Tools || [];
    
    // Extracted categories must be available before state restoration
    extractCategories();
    
    // Restore states, chips, search, and category parameters
    restoreState();
    renderCategoryDropdown();
    
    // Filter, sort, and render full view
    filterTools();
    sortTools();
    renderTools();
  } catch (error) {
    console.error("Failed to load tools database: ", error);
    const tbody = document.getElementById('tools-tbody');
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: #ff9a9e; padding: 40px;">
          Failed to load tools database. Please ensure files are hosted on a server or paths are correct.
        </td>
      </tr>
    `;
  }
}

// Extract unique categories
function extractCategories() {
  const categories = toolsData.map(tool => tool.category);
  uniqueCategories = [...new Set(categories)].sort();
}

// Dynamic category dropdown rendering
function renderCategoryDropdown() {
  const menuContainer = document.getElementById('filter-dropdown-menu');
  const activeLabel = document.getElementById('active-category-label');
  
  // Update active label text
  activeLabel.textContent = activeCategory === 'all' ? 'All Categories' : activeCategory;
  
  // Use DocumentFragment for performance
  const fragment = document.createDocumentFragment();
  
  // Create All Categories option
  const allBtn = document.createElement('button');
  allBtn.className = `filter-dropdown-item ${activeCategory === 'all' ? 'active' : ''}`;
  allBtn.setAttribute('data-category', 'all');
  allBtn.innerHTML = `
    <span>All Categories</span>
    ${activeCategory === 'all' ? checkIconSvg : ''}
  `;
  fragment.appendChild(allBtn);
  
  // Create items for unique categories
  uniqueCategories.forEach(category => {
    const btn = document.createElement('button');
    btn.className = `filter-dropdown-item ${activeCategory === category ? 'active' : ''}`;
    btn.setAttribute('data-category', category);
    btn.innerHTML = `
      <span>${category}</span>
      ${activeCategory === category ? checkIconSvg : ''}
    `;
    fragment.appendChild(btn);
  });
  
  menuContainer.innerHTML = '';
  menuContainer.appendChild(fragment);
}

// 2. Persistent State in LocalStorage
function saveSelectedCategory() {
  localStorage.setItem(LOCAL_STORAGE_KEY, activeCategory);
}

function restoreSelectedCategory() {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    if (stored === 'all' || uniqueCategories.includes(stored)) {
      activeCategory = stored;
    } else {
      activeCategory = 'all';
    }
  } else {
    activeCategory = 'all';
  }
}

// 3. Search Query and Category Queries in URL Sync
function updateURL() {
  const params = new URLSearchParams();
  const query = searchQuery.trim();
  if (query) {
    params.set('q', query);
  }
  if (activeCategory && activeCategory !== 'all') {
    params.set('category', activeCategory);
  }
  
  const newRelativePathQuery = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  history.replaceState(null, '', newRelativePathQuery);
}

function readURL() {
  const params = new URLSearchParams(window.location.search);
  searchQuery = params.get('q') || '';
  const catParam = params.get('category') || '';
  if (catParam) {
    activeCategory = catParam;
  }
}

// Combined Save / Restore wrapper actions
function saveState() {
  saveSelectedCategory();
  updateURL();
}

function restoreState() {
  // Read query URL string details
  readURL();
  
  // If activeCategory is default, check localStorage
  if (!activeCategory || activeCategory === 'all') {
    restoreSelectedCategory();
  } else {
    // Validate URL category values, fallback if no longer exists
    if (!uniqueCategories.includes(activeCategory)) {
      restoreSelectedCategory();
    }
  }
  
  // Sync HTML inputs value
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.value = searchQuery;
  }
}

// 4. Filtering Action
function filterTools() {
  const query = searchQuery.trim().toLowerCase();
  filteredTools = toolsData.filter(tool => {
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    const matchesSearch = !query || 
      tool.name.toLowerCase().includes(query) || 
      tool.url.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
}

// 5. Sorting Action
function sortTools() {
  if (currentSort === 'name-asc') {
    filteredTools.sort((a, b) => a.name.localeCompare(b.name));
  } else if (currentSort === 'name-desc') {
    filteredTools.sort((a, b) => b.name.localeCompare(a.name));
  } else if (currentSort === 'category-asc') {
    filteredTools.sort((a, b) => a.category.localeCompare(b.category));
  } else if (currentSort === 'category-desc') {
    filteredTools.sort((a, b) => b.category.localeCompare(a.category));
  }
}

// 6. Dynamic DOM Rendering (Optimized performance)
function renderTools() {
  const tbody = document.getElementById('tools-tbody');
  const footerInfo = document.getElementById('footer-info');
  const headerTr = document.getElementById('table-header-tr');
  
  // Clear body
  tbody.innerHTML = '';
  
  // Update result count instantly
  footerInfo.textContent = `Showing ${filteredTools.length} of ${toolsData.length} tools`;
  
  // Dynamic header updates for Admin mode selection checkboxes
  if (isLocal && backendAvailable) {
    if (headerTr && !headerTr.querySelector('.col-select')) {
      const selectTh = document.createElement('th');
      selectTh.className = 'col-select';
      selectTh.scope = 'col';
      selectTh.innerHTML = '<input type="checkbox" id="select-all-checkbox" aria-label="Select all rows" />';
      headerTr.insertBefore(selectTh, headerTr.firstChild);
      
      // Select All change handler
      const selectAllCb = document.getElementById('select-all-checkbox');
      selectAllCb.addEventListener('change', (e) => {
        const checkAll = e.target.checked;
        const checkboxes = document.querySelectorAll('.col-select input[type="checkbox"]:not(#select-all-checkbox)');
        checkboxes.forEach(cb => {
          cb.checked = checkAll;
          const url = cb.getAttribute('data-url');
          if (checkAll) {
            if (!selectedUrls.includes(url)) selectedUrls.push(url);
          } else {
            selectedUrls = selectedUrls.filter(u => u !== url);
          }
        });
        updateDeleteButtonState();
      });
    }
  } else {
    // Remove checkbox header if we are not in local admin mode anymore
    if (headerTr) {
      const existingTh = headerTr.querySelector('.col-select');
      if (existingTh) existingTh.remove();
    }
  }
  
  if (filteredTools.length === 0) {
    showEmptyState(true);
    return;
  }
  
  showEmptyState(false);
  
  // Populate Rows efficiently using fragments - rendering ALL matched tools in a continuous list
  const fragment = document.createDocumentFragment();
  
  filteredTools.forEach((tool, index) => {
    const displayedIndex = index + 1;
    const gradientClass = getStableGradientClass(tool.name);
    
    const row = document.createElement('tr');
    row.className = 'animate-fade-in';
    row.style.animationDelay = `${index * 0.03}s`;
    row.setAttribute('data-url', tool.url);
    
    // Checkbox html block if admin system is active
    const isChecked = selectedUrls.includes(tool.url);
    const checkboxTd = `
      <td class="col-select">
        <input type="checkbox" class="row-checkbox" data-url="${tool.url}" ${isChecked ? 'checked' : ''} aria-label="Select row" />
      </td>
    `;
    
    row.innerHTML = `
      ${(isLocal && backendAvailable) ? checkboxTd : ''}
      <td class="col-num"><span class="row-number">${displayedIndex}</span></td>
      <td class="col-icon">
        <div class="tool-icon ${gradientClass}">
          ${sparklesSvg}
        </div>
      </td>
      <td class="col-name"><span class="tool-name-text">${tool.name}</span></td>
      <td class="col-category"><span class="category-badge">${tool.category}</span></td>
      <td class="col-desc"><p class="description-text" title="${tool.description}">${tool.description}</p></td>
      <td class="col-link">
        <div class="action-buttons">
          <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="open-btn" title="Open in new tab">
            Open Website
            ${externalLinkSvg}
          </a>
          <button class="copy-btn" data-url="${tool.url}" title="Copy website link">
            ${copyIconSvg}
            Copy
          </button>
        </div>
      </td>
    `;
    
    fragment.appendChild(row);
  });
  
  tbody.appendChild(fragment);
  updateDeleteButtonState();
}

// 7. Clipboard Copy Link Action
function copyLink(url, buttonElement) {
  if (!navigator.clipboard) {
    // Fallback copy logic
    const textArea = document.createElement("textarea");
    textArea.value = url;
    textArea.style.position = "fixed";  // Avoid scrolling
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      toggleCopySuccess(buttonElement);
    } catch (err) {
      console.error('Fallback copy operation failed', err);
    }
    document.body.removeChild(textArea);
    return;
  }
  
  navigator.clipboard.writeText(url)
    .then(() => {
      toggleCopySuccess(buttonElement);
    })
    .catch(err => {
      console.error('Copy to clipboard failed: ', err);
    });
}

// Success indicator handler for copy button
function toggleCopySuccess(btn) {
  btn.classList.add('copied');
  btn.innerHTML = `${successIconSvg} Copied`;
  
  setTimeout(() => {
    btn.classList.remove('copied');
    btn.innerHTML = `${copyIconSvg} Copy`;
  }, 2000);
}

// 8. Toggling Empty State view
function showEmptyState(visible) {
  const emptyState = document.getElementById('empty-state');
  const tableElement = document.getElementById('tools-table-element');
  
  if (visible) {
    emptyState.classList.remove('hidden');
    tableElement.style.display = 'none';
  } else {
    emptyState.classList.add('hidden');
    tableElement.style.display = 'table';
  }
}

// 9. Resets Filters
function clearAllFilters() {
  searchQuery = '';
  activeCategory = 'all';
  currentSort = 'name-asc';
  selectedUrls = []; // Clear selections
  
  // Sync HTML elements
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'name-asc';
  
  // Close dropdown if open
  const dropdownBtn = document.getElementById('filter-dropdown-btn');
  const dropdownMenu = document.getElementById('filter-dropdown-menu');
  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.classList.remove('open');
    dropdownMenu.classList.add('hidden');
  }
  
  // Reset active label and rebuild menu items
  renderCategoryDropdown();
  
  // Uncheck select-all header checkbox
  const selectAllCb = document.getElementById('select-all-checkbox');
  if (selectAllCb) selectAllCb.checked = false;
  
  saveState();
  filterTools();
  sortTools();
  renderTools();
}

// Show Toast Floating Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? successIconSvg : `
    <svg class="toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="8" x2="12" y2="12"></line>
      <line x1="12" y1="16" x2="12.01" y2="16"></line>
    </svg>
  `;
  
  toast.innerHTML = `
    ${icon}
    <span class="toast-message">${message}</span>
  `;
  
  container.appendChild(toast);
  
  // Trigger slide-in
  setTimeout(() => {
    toast.classList.add('show');
  }, 15);
  
  // Auto dismiss after 3 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// Update state of Delete Selected button based on check counts
function updateDeleteButtonState() {
  if (!isLocal || !backendAvailable) return;
  
  const deleteBtn = document.getElementById('delete-selected-btn');
  const countSpan = document.getElementById('selected-count');
  
  if (!deleteBtn) return;
  
  const count = selectedUrls.length;
  countSpan.textContent = count;
  
  if (count > 0) {
    deleteBtn.removeAttribute('disabled');
    deleteBtn.classList.remove('disabled');
  } else {
    deleteBtn.setAttribute('disabled', 'true');
    deleteBtn.classList.add('disabled');
  }
}

// Event Listeners Setup
function initializeEvents() {
  const searchInput = document.getElementById('search-input');
  const sortSelect = document.getElementById('sort-select');
  const clearAllBtn = document.getElementById('clear-all-btn');
  const emptyStateClearBtn = document.getElementById('clear-filters-btn');
  const tbody = document.getElementById('tools-tbody');
  
  // Dropdown Toggle elements
  const dropdownBtn = document.getElementById('filter-dropdown-btn');
  const dropdownMenu = document.getElementById('filter-dropdown-menu');
  
  // Modal Elements
  const addModal = document.getElementById('add-tool-modal');
  const addBtn = document.getElementById('add-tool-btn');
  const closeAddX = document.getElementById('close-modal-x-btn');
  const cancelAddBtn = document.getElementById('cancel-add-btn');
  const addForm = document.getElementById('add-tool-form');
  
  const deleteConfirmModal = document.getElementById('delete-confirm-modal');
  const deleteBtn = document.getElementById('delete-selected-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  
  // 1. Add Tool Modal Toggling & Submit handlers
  addBtn.addEventListener('click', () => {
    addModal.classList.remove('hidden');
    document.getElementById('tool-name-input').focus();
  });
  
  const closeAddModal = () => {
    addModal.classList.add('hidden');
    addForm.reset();
  };
  
  closeAddX.addEventListener('click', closeAddModal);
  cancelAddBtn.addEventListener('click', closeAddModal);
  
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const nameVal = document.getElementById('tool-name-input').value.trim();
    const descVal = document.getElementById('tool-description-input').value.trim();
    const catVal = document.getElementById('tool-category-input').value.trim();
    const urlVal = document.getElementById('tool-url-input').value.trim();
    
    // Verification validation checks
    if (!nameVal || !descVal || !catVal || !urlVal) {
      showToast('All fields marked with an asterisk (*) are required.', 'error');
      return;
    }
    
    // URL format checks
    try {
      new URL(urlVal);
    } catch (_) {
      showToast('Please enter a valid absolute URL (e.g. https://www.example.com).', 'error');
      return;
    }
    
    // Client-side duplicate URL check
    const duplicate = toolsData.some(tool => tool.url.toLowerCase() === urlVal.toLowerCase());
    if (duplicate) {
      showToast('Duplicate URL: A tool with this URL already exists.', 'error');
      return;
    }
    
    // Submit POST request to backend
    try {
      const response = await fetch(`${API_BASE_URL}/tools/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nameVal,
          description: descVal,
          category: catVal,
          url: urlVal
        })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showToast(result.message || '✓ Tool Added Successfully', 'success');
        closeAddModal();
        await loadTools(); // Reload and refresh
      } else {
        showToast(result.message || 'Server rejected request.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network Error: Could not connect to the local admin server.', 'error');
    }
  });
  
  // 2. Delete Selected Modal Toggling & Submit handlers
  deleteBtn.addEventListener('click', () => {
    if (selectedUrls.length === 0) return;
    
    document.getElementById('delete-count-text').textContent = selectedUrls.length;
    deleteConfirmModal.classList.remove('hidden');
  });
  
  const closeDeleteModal = () => {
    deleteConfirmModal.classList.add('hidden');
  };
  
  cancelDeleteBtn.addEventListener('click', closeDeleteModal);
  
  confirmDeleteBtn.addEventListener('click', async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/tools/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: selectedUrls })
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        showToast(result.message || `✓ ${selectedUrls.length} Tools Deleted`, 'success');
        
        // Reset state
        selectedUrls = [];
        const selectAllCb = document.getElementById('select-all-checkbox');
        if (selectAllCb) selectAllCb.checked = false;
        
        closeDeleteModal();
        await loadTools(); // Reload lists
      } else {
        showToast(result.message || 'Server rejected delete request.', 'error');
      }
    } catch (error) {
      console.error(error);
      showToast('Network Error: Could not connect to the local admin server.', 'error');
    }
  });
  
  // Dropdown toggle trigger
  dropdownBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdownBtn.classList.toggle('open');
    dropdownMenu.classList.toggle('hidden', !isOpen);
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (dropdownMenu && !dropdownMenu.classList.contains('hidden')) {
      const wrapper = document.querySelector('.filter-dropdown-wrapper');
      if (wrapper && !wrapper.contains(e.target)) {
        dropdownBtn.classList.remove('open');
        dropdownMenu.classList.add('hidden');
      }
    }
  });
  
  // Dropdown item selection via event delegation (Performance)
  dropdownMenu.addEventListener('click', (e) => {
    const item = e.target.closest('.filter-dropdown-item');
    if (!item) return;
    
    activeCategory = item.getAttribute('data-category');
    
    // Hide menu, rotate chevron back
    dropdownBtn.classList.remove('open');
    dropdownMenu.classList.add('hidden');
    
    // Re-render dropdown label and checkmarks
    renderCategoryDropdown();
    
    saveState();
    filterTools();
    sortTools();
    renderTools();
  });
  
  // Real-time search query input
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    saveState();
    filterTools();
    sortTools();
    renderTools();
  });
  
  // Dropdown sorting change
  sortSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    sortTools();
    renderTools();
  });
  
  // Clear all secondary filters
  clearAllBtn.addEventListener('click', clearAllFilters);
  
  // Empty state clear filter
  emptyStateClearBtn.addEventListener('click', clearAllFilters);
  
  // Checkbox row toggles via delegation on tbody
  tbody.addEventListener('change', (e) => {
    const cb = e.target.closest('.row-checkbox');
    if (!cb) return;
    
    const url = cb.getAttribute('data-url');
    if (cb.checked) {
      if (!selectedUrls.includes(url)) {
        selectedUrls.push(url);
      }
    } else {
      selectedUrls = selectedUrls.filter(u => u !== url);
      // Uncheck select-all header check if any row is manually deselected
      const selectAllCb = document.getElementById('select-all-checkbox');
      if (selectAllCb) selectAllCb.checked = false;
    }
    updateDeleteButtonState();
  });
  
  // Dynamic action buttons click handler via Event Delegation (Performance)
  tbody.addEventListener('click', (e) => {
    const copyBtn = e.target.closest('.copy-btn');
    const openBtn = e.target.closest('.open-btn');
    
    if (copyBtn) {
      e.preventDefault();
      e.stopPropagation();
      const url = copyBtn.getAttribute('data-url');
      copyLink(url, copyBtn);
    } else if (openBtn) {
      // Let standard link anchor redirection fire
      e.stopPropagation();
    }
  });
}

// Initial Kickoff
document.addEventListener('DOMContentLoaded', () => {
  initializeEvents();
  loadTools();
});
