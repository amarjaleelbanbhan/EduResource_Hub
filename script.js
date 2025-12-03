// Global variables
let allResources = [];
let filteredResources = [];
let currentSearch = '';
let currentFilters = {
    category: '',
    type: '',
    access: ''
};

// DOM elements
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const typeFilter = document.getElementById('type-filter');
const accessFilter = document.getElementById('access-filter');
const clearFiltersBtn = document.getElementById('clear-filters');
const resourcesGrid = document.getElementById('resources-grid');
const resultsCount = document.getElementById('results-count');
const loadingDiv = document.getElementById('loading');
const noResultsDiv = document.getElementById('no-results');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    loadResources();
    setupEventListeners();
});

// Load resources from JSON file
async function loadResources() {
    try {
        // FIXED: Use relative path for GitHub Pages
        const response = await fetch('resources_clean.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        allResources = await response.json();
        
        // Validate that we have an array
        if (!Array.isArray(allResources)) {
            throw new Error('Resources data is not in expected array format');
        }

        filteredResources = [...allResources];
        
        // Update stats
        updateStats();
        
        // Populate filters
        populateFilters();
        
        // Display resources
        displayResources();
        
    } catch (error) {
        console.error('Error loading resources:', error);
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <div style="text-align: center; color: #ef4444; padding: 20px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 30px; margin-bottom: 10px;"></i>
                    <h3>Error loading resources</h3>
                    <p>Could not load <code>resources_clean.json</code>.</p>
                    <p>Please make sure this file is committed to your GitHub repository.</p>
                </div>
            `;
        }
    }
}

// Update statistics
function updateStats() {
    const totalResourcesSpan = document.getElementById('total-resources');
    const totalCategoriesSpan = document.getElementById('total-categories');

    // Only update if elements exist on the page
    if (totalResourcesSpan && totalCategoriesSpan) {
        const categories = new Set(allResources.map(resource => resource.Category));
        totalResourcesSpan.textContent = allResources.length.toLocaleString();
        totalCategoriesSpan.textContent = categories.size;
    }
}

// Populate filter dropdowns
function populateFilters() {
    if (!allResources.length) return;

    const categories = [...new Set(allResources.map(resource => resource.Category || 'Other'))].sort();
    const types = [...new Set(allResources.map(resource => resource.Type || 'Other'))].sort();
    const accessTypes = [...new Set(allResources.map(resource => resource['Access type'] || 'Other'))].sort();

    if (categoryFilter) populateSelect(categoryFilter, categories);
    if (typeFilter) populateSelect(typeFilter, types);
    if (accessFilter) populateSelect(accessFilter, accessTypes);
}

// Helper function to populate select elements
function populateSelect(selectElement, options) {
    const defaultOption = selectElement.options[0];
    selectElement.innerHTML = '';
    selectElement.appendChild(defaultOption);
    
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        selectElement.appendChild(optionElement);
    });
}

// Setup event listeners
function setupEventListeners() {
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = this.value.toLowerCase();
                filterAndDisplayResources();
            }, 300);
        });
    }

    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            currentFilters.category = this.value;
            filterAndDisplayResources();
        });
    }

    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            currentFilters.type = this.value;
            filterAndDisplayResources();
        });
    }

    if (accessFilter) {
        accessFilter.addEventListener('change', function() {
            currentFilters.access = this.value;
            filterAndDisplayResources();
        });
    }

    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function() {
            if (searchInput) searchInput.value = '';
            if (categoryFilter) categoryFilter.value = '';
            if (typeFilter) typeFilter.value = '';
            if (accessFilter) accessFilter.value = '';
            currentSearch = '';
            currentFilters = { category: '', type: '', access: '' };
            filterAndDisplayResources();
        });
    }
}

// Filter and display resources
function filterAndDisplayResources() {
    filteredResources = allResources.filter(resource => {
        if (currentSearch) {
            const searchableText = [
                resource['Title/Name'],
                resource['Short Description'],
                resource["Why it's useful for students"],
                resource.Category,
                resource.Type
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(currentSearch)) return false;
        }

        if (currentFilters.category && resource.Category !== currentFilters.category) return false;
        if (currentFilters.type && resource.Type !== currentFilters.type) return false;
        if (currentFilters.access && resource['Access type'] !== currentFilters.access) return false;

        return true;
    });

    displayResources();
}

// Display resources in the grid
function displayResources() {
    if (loadingDiv) loadingDiv.style.display = 'none';
    
    if (resultsCount) {
        resultsCount.textContent = `${filteredResources.length} resource${filteredResources.length !== 1 ? 's' : ''} found`;
    }

    if (filteredResources.length === 0) {
        if (resourcesGrid) resourcesGrid.style.display = 'none';
        if (noResultsDiv) noResultsDiv.style.display = 'block';
        return;
    }

    if (noResultsDiv) noResultsDiv.style.display = 'none';
    if (resourcesGrid) {
        resourcesGrid.style.display = 'grid';
        resourcesGrid.innerHTML = filteredResources.map(resource => createResourceCard(resource)).join('');
    }
}

// Create individual resource card
function createResourceCard(resource) {
    const title = resource['Title/Name'] || 'Untitled Resource';
    const category = resource.Category || 'Uncategorized';
    const type = resource.Type || 'Unknown';
    const accessType = resource['Access type'] || 'Unknown';
    const description = resource['Short Description'] || '';
    const whyUseful = resource["Why it's useful for students"] || '';
    const link = resource.Link || '#';

    // Clean up escaped quotes in the data
    const cleanDescription = description.replace(/\\"/g, '"').replace(/\\'/g, "'");
    const cleanWhyUseful = whyUseful.replace(/\\"/g, '"').replace(/\\'/g, "'");

    return `
        <div class="resource-card" onclick="window.open('${link}', '_blank')">
            <div class="resource-header">
                <div>
                    <h3 class="resource-title">
                        <a href="${link}" target="_blank" class="resource-link" onclick="event.stopPropagation()">
                            ${title}
                        </a>
                    </h3>
                </div>
            </div>
            
            <div class="resource-tags">
                <span class="tag tag-category">${category}</span>
                <span class="tag tag-type">${type}</span>
                <span class="tag tag-access">${accessType}</span>
            </div>
            
            ${cleanDescription ? `<div class="resource-description">${cleanDescription}</div>` : ''}
            
            ${cleanWhyUseful ? `<div class="resource-why"><strong>Why it's useful:</strong> ${cleanWhyUseful}</div>` : ''}
            
            <div class="resource-footer">
                <a href="${link}" target="_blank" class="external-link" onclick="event.stopPropagation()">
                    Visit Resource <i class="fas fa-external-link-alt"></i>
                </a>
            </div>
        </div>
    `;
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === '/' && !e.ctrlKey && !e.metaKey && searchInput) {
        e.preventDefault();
        searchInput.focus();
    }
});
