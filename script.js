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
const totalResourcesSpan = document.getElementById('total-resources');
const totalCategoriesSpan = document.getElementById('total-categories');
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
        const response = await fetch'./resources_clean.json');
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
        loadingDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error loading resources</h3>
            <p>There was an error loading the resources. Please check the console for details.</p>
        `;
    }
}

// Update statistics
function updateStats() {
    const categories = new Set(allResources.map(resource => resource.Category));
    totalResourcesSpan.textContent = allResources.length.toLocaleString();
    totalCategoriesSpan.textContent = categories.size;
}

// Populate filter dropdowns
function populateFilters() {
    const categories = [...new Set(allResources.map(resource => resource.Category))].sort();
    const types = [...new Set(allResources.map(resource => resource.Type))].sort();
    const accessTypes = [...new Set(allResources.map(resource => resource['Access type']))].sort();

    populateSelect(categoryFilter, categories);
    populateSelect(typeFilter, types);
    populateSelect(accessFilter, accessTypes);
}

// Helper function to populate select elements
function populateSelect(selectElement, options) {
    // Keep the default "All" option
    const defaultOption = selectElement.children[0];
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
    // Search input with debouncing
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentSearch = this.value.toLowerCase();
            filterAndDisplayResources();
        }, 300);
    });

    // Filter dropdowns
    categoryFilter.addEventListener('change', function() {
        currentFilters.category = this.value;
        filterAndDisplayResources();
    });

    typeFilter.addEventListener('change', function() {
        currentFilters.type = this.value;
        filterAndDisplayResources();
    });

    accessFilter.addEventListener('change', function() {
        currentFilters.access = this.value;
        filterAndDisplayResources();
    });

    // Clear filters button
    clearFiltersBtn.addEventListener('click', function() {
        searchInput.value = '';
        categoryFilter.value = '';
        typeFilter.value = '';
        accessFilter.value = '';
        currentSearch = '';
        currentFilters = { category: '', type: '', access: '' };
        filterAndDisplayResources();
    });

    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Filter and display resources
function filterAndDisplayResources() {
    filteredResources = allResources.filter(resource => {
        // Search filter
        if (currentSearch) {
            const searchableText = [
                resource['Title/Name'],
                resource['Short Description'],
                resource["Why it's useful for students"],
                resource.Category,
                resource.Type
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(currentSearch)) {
                return false;
            }
        }

        // Category filter
        if (currentFilters.category && resource.Category !== currentFilters.category) {
            return false;
        }

        // Type filter
        if (currentFilters.type && resource.Type !== currentFilters.type) {
            return false;
        }

        // Access type filter
        if (currentFilters.access && resource['Access type'] !== currentFilters.access) {
            return false;
        }

        return true;
    });

    displayResources();
}

// Display resources in the grid
function displayResources() {
    loadingDiv.style.display = 'none';
    
    // Update results count
    resultsCount.textContent = `${filteredResources.length} resource${filteredResources.length !== 1 ? 's' : ''} found`;

    if (filteredResources.length === 0) {
        resourcesGrid.style.display = 'none';
        noResultsDiv.style.display = 'block';
        return;
    }

    noResultsDiv.style.display = 'none';
    resourcesGrid.style.display = 'grid';

    // Create resource cards
    resourcesGrid.innerHTML = filteredResources.map(resource => createResourceCard(resource)).join('');
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

// Add some utility functions for better UX
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add scroll-to-top functionality
function addScrollToTop() {
    // Create scroll to top button
    const scrollBtn = document.createElement('button');
    scrollBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    scrollBtn.className = 'scroll-to-top';
    scrollBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #2563eb;
        color: white;
        border: none;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        cursor: pointer;
        display: none;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(scrollBtn);
    
    scrollBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // Show/hide scroll button
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.style.display = 'flex';
            scrollBtn.style.alignItems = 'center';
            scrollBtn.style.justifyContent = 'center';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
}

// Initialize scroll to top functionality
document.addEventListener('DOMContentLoaded', addScrollToTop);

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Focus search input when pressing '/'
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Clear search when pressing Escape
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.blur();
        if (searchInput.value) {
            searchInput.value = '';
            currentSearch = '';
            filterAndDisplayResources();
        }
    }
});

// Add search hint
searchInput.addEventListener('focus', function() {
    if (!this.dataset.hintShown) {
        this.placeholder = "Try searching for subjects like 'math', 'science', or 'art'...";
        this.dataset.hintShown = 'true';
    }
});

searchInput.addEventListener('blur', function() {
    this.placeholder = "Search for resources, subjects, or topics...";
});


