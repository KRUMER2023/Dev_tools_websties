// State Management
let toolsData = [];
let filteredTools = [];
let uniqueCategories = [];
let activeCategory = 'all';
let searchQuery = '';
let currentSort = 'name-asc';

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

// 1. Load data from JSON
async function loadTools() {
  try {
    const response = await fetch('datas/tools.json');
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
  
  // Clear body
  tbody.innerHTML = '';
  
  // Update result count instantly
  footerInfo.textContent = `Showing ${filteredTools.length} of ${toolsData.length} tools`;
  
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
    
    row.innerHTML = `
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
  
  // Sync HTML elements
  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';
  
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'name-asc';
  
  // Clear localStorage
  localStorage.removeItem(LOCAL_STORAGE_KEY);
  
  // Close dropdown if open
  const dropdownBtn = document.getElementById('filter-dropdown-btn');
  const dropdownMenu = document.getElementById('filter-dropdown-menu');
  if (dropdownBtn && dropdownMenu) {
    dropdownBtn.classList.remove('open');
    dropdownMenu.classList.add('hidden');
  }
  
  // Reset active label and rebuild menu items
  renderCategoryDropdown();
  
  saveState();
  filterTools();
  sortTools();
  renderTools();
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
