document.addEventListener('DOMContentLoaded', () => {
  let directories = [];
  let currentFilter = 'all';
  let searchQuery = '';
  let currentSortField = 'score';
  let sortDirection = 'desc'; // 'asc' or 'desc'

  const searchInput = document.getElementById('search-input');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const tbody = document.getElementById('directory-tbody');
  const noResults = document.getElementById('no-results');
  const table = document.getElementById('directory-table');
  const dirCountEl = document.getElementById('dir-count');
  const freeCountEl = document.getElementById('free-count');
  const avgDaEl = document.getElementById('avg-da');
  const sortHeaders = document.querySelectorAll('.sortable');

  // Keyboard shortcut to focus search input (/)
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== searchInput) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Fetch directory list data
  fetch('directories.json')
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to load directories data.');
      }
      return response.json();
    })
    .then(data => {
      directories = data;
      calculateStats(directories);
      renderTable();
    })
    .catch(error => {
      console.error('Error fetching directories:', error);
      tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: #ef4444;">Failed to load directories. Please refresh the page.</td></tr>`;
    });

  // Search input handler
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderTable();
  });

  // Filter button handlers
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderTable();
    });
  });

  // Sorting handlers
  sortHeaders.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.dataset.sort;
      if (currentSortField === field) {
        // Toggle direction
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortField = field;
        sortDirection = field === 'score' ? 'desc' : 'asc';
      }
      
      // Update UI for sort headers
      sortHeaders.forEach(h => {
        const icon = h.querySelector('.sort-icon');
        if (h === header) {
          icon.textContent = sortDirection === 'asc' ? '▲' : '▼';
        } else {
          icon.textContent = '⇅';
        }
      });

      renderTable();
    });
  });

  // Calculate statistics (total count, free count, average DA score)
  function calculateStats(list) {
    dirCountEl.textContent = list.length;
    
    const freeCount = list.filter(d => d.pricing.toLowerCase() === 'free').length;
    freeCountEl.textContent = freeCount;
    
    const scoreItems = list.filter(d => typeof d.score === 'number' && d.score > 0);
    const avgDa = scoreItems.length > 0
      ? Math.round(scoreItems.reduce((acc, curr) => acc + curr.score, 0) / scoreItems.length)
      : 0;
    avgDaEl.textContent = avgDa;
  }

  // Highlight search matches
  function highlightText(text, query) {
    if (!query) return text;
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  // Render Table rows dynamically
  function renderTable() {
    // 1. Filter
    let filtered = directories.filter(d => {
      // Pricing filter
      if (currentFilter === 'free' && d.pricing.toLowerCase() !== 'free') return false;
      if (currentFilter === 'paid' && d.pricing.toLowerCase() !== 'paid') return false;
      
      // Search filter
      if (searchQuery) {
        const nameMatch = d.name.toLowerCase().includes(searchQuery);
        const urlMatch = d.url.toLowerCase().includes(searchQuery);
        const pricingMatch = d.pricing.toLowerCase().includes(searchQuery);
        return nameMatch || urlMatch || pricingMatch;
      }
      
      return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      let valA = a[currentSortField];
      let valB = b[currentSortField];

      // Handle null score values
      if (currentSortField === 'score') {
        if (valA === null) valA = -1;
        if (valB === null) valB = -1;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // 3. Render HTML
    if (filtered.length === 0) {
      tbody.innerHTML = '';
      table.classList.add('hidden');
      noResults.classList.remove('hidden');
    } else {
      table.classList.remove('hidden');
      noResults.classList.add('hidden');

      tbody.innerHTML = filtered.map(d => {
        const isAltHunt = d.name.toLowerCase() === 'althunt';
        const rowClass = isAltHunt ? 'class="row-althunt"' : '';
        const nameHtml = highlightText(d.name, searchQuery);
        
        let scoreHtml = '';
        if (typeof d.score === 'number' && d.score > 0) {
          const scoreClass = d.score >= 80 ? 'score-high' : '';
          scoreHtml = `<span class="score-badge ${scoreClass}">${d.score}</span>`;
        } else {
          scoreHtml = `<span class="score-badge score-null">-</span>`;
        }

        const pricingClass = d.pricing.toLowerCase() === 'free' ? 'pricing-free' : 'pricing-paid';
        const pricingHtml = `<span class="pricing-badge ${pricingClass}">${d.pricing}</span>`;

        return `
          <tr ${rowClass}>
            <td>
              <div class="name-col">
                ${isAltHunt ? '<span class="logo-icon">⭐</span>' : ''}
                <span>${nameHtml}</span>
              </div>
            </td>
            <td class="text-center">${scoreHtml}</td>
            <td class="text-center">${pricingHtml}</td>
            <td class="text-right">
              <a href="${d.url}" target="_blank" class="btn btn-secondary btn-sm" rel="noopener noreferrer">Submit &rarr;</a>
            </td>
          </tr>
        `;
      }).join('');
    }
  }
});
