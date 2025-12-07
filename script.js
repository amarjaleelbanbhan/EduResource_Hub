// EduResource Hub - Main Logic

// Global State
let allResources = [];
let filteredResources = [];
let currentSearch = '';
let currentFilters = { category: '', type: '', access: '' };

// DOM Elements
const elements = {
    searchInput: document.getElementById('search-input'),
    categoryFilter: document.getElementById('category-filter'),
    typeFilter: document.getElementById('type-filter'),
    accessFilter: document.getElementById('access-filter'),
    clearBtn: document.getElementById('clear-filters'),
    grid: document.getElementById('resources-grid'),
    resultsCount: document.getElementById('results-count'),
    loading: document.getElementById('loading'),
    noResults: document.getElementById('no-results'),
    statsResources: document.getElementById('stat-total-resources'),
    statsCategories: document.getElementById('stat-total-categories')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchResources();
    setupEventListeners();
});

// Fetch Data
async function fetchResources() {
    try {
        // Fetching the cleaned JSON file
        const response = await fetch('resources_clean.json');
        
        if (!response.ok) throw new Error('Failed to load resources');
        
        allResources = await response.json();
        
        // Initial setup
        filteredResources = [...allResources];
        updateStats();
        populateFilters();
        renderResources();
        
    } catch (error) {
        console.error('Error:', error);
        elements.loading.innerHTML = `
            <div style="color: #EF4444;">
                <i class="fas fa-exclamation-circle fa-2x"></i>
                <p>Failed to load resources. Please try refreshing.</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}

// Stats
function updateStats() {
    if (elements.statsResources) {
        elements.statsResources.textContent = allResources.length;
    }
    if (elements.statsCategories) {
        const uniqueCategories = new Set(allResources.map(r => r.Category));
        elements.statsCategories.textContent = uniqueCategories.size;
    }
}

// Populate Filters
function populateFilters() {
    const getOptions = (key) => [...new Set(allResources.map(r => r[key] || 'Other'))].sort();
    
    fillSelect(elements.categoryFilter, getOptions('Category'));
    fillSelect(elements.typeFilter, getOptions('Type'));
    fillSelect(elements.accessFilter, getOptions('Access type'));
}

function fillSelect(select, options) {
    if (!select) return;
    const defaultText = select.options[0].text;
    select.innerHTML = `<option value="">${defaultText}</option>`;
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
    });
}

// Event Listeners
function setupEventListeners() {
    // Search with Debounce
    let timeout;
    elements.searchInput?.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            currentSearch = e.target.value.toLowerCase();
            applyFilters();
        }, 300);
    });

    // Dropdowns
    const handleFilter = (key, val) => {
        currentFilters[key] = val;
        applyFilters();
    };

    elements.categoryFilter?.addEventListener('change', (e) => handleFilter('category', e.target.value));
    elements.typeFilter?.addEventListener('change', (e) => handleFilter('type', e.target.value));
    elements.accessFilter?.addEventListener('change', (e) => handleFilter('access', e.target.value));

    // Clear Button
    elements.clearBtn?.addEventListener('click', () => {
        currentSearch = '';
        currentFilters = { category: '', type: '', access: '' };
        
        elements.searchInput.value = '';
        elements.categoryFilter.value = '';
        elements.typeFilter.value = '';
        elements.accessFilter.value = '';
        
        applyFilters();
    });
    
    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        // Focus search on '/' key (unless already focused on an input)
        if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
            e.preventDefault();
            elements.searchInput?.focus();
        }
        
        // Clear search on Escape key when search is focused
        if (e.key === 'Escape' && document.activeElement === elements.searchInput) {
            elements.searchInput.value = '';
            currentSearch = '';
            applyFilters();
            elements.searchInput.blur();
        }
    });
}

// Filter Logic
function applyFilters() {
    filteredResources = allResources.filter(item => {
        // Search matches Title, Desc, or Category
        const matchSearch = !currentSearch || 
            (item['Title/Name']?.toLowerCase().includes(currentSearch)) ||
            (item['Short Description']?.toLowerCase().includes(currentSearch)) ||
            (item['Category']?.toLowerCase().includes(currentSearch));

        const matchCat = !currentFilters.category || item.Category === currentFilters.category;
        const matchType = !currentFilters.type || item.Type === currentFilters.type;
        const matchAccess = !currentFilters.access || item['Access type'] === currentFilters.access;

        return matchSearch && matchCat && matchType && matchAccess;
    });

    renderResources();
}

// Render Logic
function renderResources() {
    elements.loading.style.display = 'none';
    
    // Update count
    if(elements.resultsCount) {
        elements.resultsCount.textContent = `${filteredResources.length} Found`;
    }

    // Empty State
    if (filteredResources.length === 0) {
        elements.grid.style.display = 'none';
        elements.noResults.style.display = 'block';
        return;
    }

    elements.noResults.style.display = 'none';
    elements.grid.style.display = 'grid';
    
    // Render Cards
    elements.grid.innerHTML = filteredResources.map(resource => {
        const whyUseful = resource["Why it's useful for students"] || "Check details for more info.";
        
        return `
        <article class="resource-card">
            <div class="resource-header">
                <div class="resource-tags">
                    <span class="tag tag-cat">${resource.Category}</span>
                    <span class="tag tag-type">${resource.Type}</span>
                    <span class="tag tag-access">${resource['Access type']}</span>
                </div>
                <h3 class="resource-title">
                    <a href="${resource.Link}" target="_blank" rel="noopener noreferrer">${resource['Title/Name']}</a>
                </h3>
            </div>
            
            <p class="resource-desc">${resource['Short Description']}</p>
            
            <div class="resource-why">
                <strong>Why it's useful:</strong> ${whyUseful}
            </div>
            
            <div class="resource-footer">
                <a href="${resource.Link}" target="_blank" rel="noopener noreferrer" class="visit-btn">
                    Visit Resource <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        </article>
        `;
    }).join('');
}
