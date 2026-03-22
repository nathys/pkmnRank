const userId = getUserId();
let allPokemon = [];
let userRatings = {};
// Tracks whether the welcome modal has been shown this session
let welcomeShown = false;


async function init() {
  const [pokemon, ratings] = await Promise.all([
    fetch('/data/pokemon.json').then(r => r.json()),
    fetch(`/api/ratings/${userId}`).then(r => r.json()).catch(() => ({})),
  ]);

  allPokemon = pokemon;
  userRatings = ratings;

  const ratedCount = Object.keys(userRatings).length;
  if (ratedCount < allPokemon.length) {
    const btn = document.getElementById('start-rating-btn');
    btn.textContent = ratedCount > 0 ? 'Continue Rating' : 'Start Rating';
    btn.classList.remove('hidden');
  }

  // Wire welcome modal close button (modal is triggered on first row expand when unrated)
  document.getElementById('welcome-close').addEventListener('click', () => {
    document.getElementById('welcome-overlay').classList.add('hidden');
  });

  refreshGenFilter(getGenPool());
  refreshTypeFilters(getPool());
  renderList();
}


function getFilters() {
  return {
    search: document.getElementById('search').value.trim().toLowerCase(),
    gen: document.getElementById('filter-gen').value,
    type: document.getElementById('filter-type').value,
    type2: document.getElementById('filter-type2').value,
    rated: document.getElementById('filter-rated').value,
    sortBy: document.getElementById('sort-by').value,
  };
}

function renderList() {
  const { search, gen, type, type2, rated, sortBy } = getFilters();

  let list = allPokemon.filter(p => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    if (type && !p.types.includes(type)) return false;
    if (type2 === 'mono') { if (p.types.length !== 1) return false; }
    else if (type2 && !p.types.includes(type2)) return false;
    if (rated === 'rated' && !userRatings[p.id]) return false;
    if (rated === 'unrated' && userRatings[p.id]) return false;
    return true;
  });

  list.sort((a, b) => {
    if (sortBy === 'dex') return (a.baseId ?? a.id) - (b.baseId ?? b.id);
    const ra = userRatings[a.id], rb = userRatings[b.id];
    if (sortBy === 'total') {
      return (rb ? ratingSum(rb) : -1) - (ra ? ratingSum(ra) : -1);
    }
    return (rb ? rb[sortBy] ?? -1 : -1) - (ra ? ra[sortBy] ?? -1 : -1);
  });

  const container = document.getElementById('ratings-list');
  container.innerHTML = `
    <table class="ratings-table">
      <thead>
        <tr>
          <th>#</th>
          <th></th>
          <th>Name</th>
          <th class="col-detail">Battle Ability</th>
          <th class="col-detail">Appeal</th>
          <th class="col-detail">Iconicness</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((p, i) => {
          const r = userRatings[p.id];
          const dex = String(p.baseId ?? p.id).padStart(4, '0');
          return `
            <tr class="main-row ${r ? 'row-rated' : 'row-unrated'}">
              <td class="rank-num">${i + 1}</td>
              <td><div class="list-sprite-wrapper"><canvas class="list-sprite-canvas" data-id="${p.id}" width="86" height="86"></canvas><img class="list-sprite" src="${p.sprite || ''}" alt="${p.name}" loading="lazy" /></div></td>
              <td>
                <div class="list-dex">#${dex}</div>
                ${nameHTML(p, allPokemon)}
              </td>
              <td class="col-detail">${r ? r.battleAbility : '—'}</td>
              <td class="col-detail">${r ? r.appeal : '—'}</td>
              <td class="col-detail">${r ? r.iconicness : '—'}</td>
              <td class="total-score">${r ? ratingSum(r) : '—'}</td>
            </tr>
            <tr class="row-expand hidden" data-pokemon-id="${p.id}">
              <td colspan="7">
                <!-- Mobile default: stats summary + Edit button -->
                <div class="expand-stats-view">
                  <div class="expand-grid">
                    <span>Battle Ability</span><span>${r ? r.battleAbility : '—'}</span>
                    <span>Appeal</span><span>${r ? r.appeal : '—'}</span>
                    <span>Iconicness</span><span>${r ? r.iconicness : '—'}</span>
                  </div>
                  <button class="expand-edit-btn">Edit</button>
                </div>
                <!-- Desktop default / mobile edit mode: rating sliders -->
                <div class="expand-sliders-view">
                  <div class="expand-panel">
                    <div class="expand-sliders">
                      <div class="expand-rating-row">
                        <label><span>Battle Ability</span><span class="expand-score" data-field="battleAbility">${r ? r.battleAbility : 5}</span></label>
                        <input type="range" min="0" max="10" step="0.5" value="${r ? r.battleAbility : 5}" data-field="battleAbility" />
                      </div>
                      <div class="expand-rating-row">
                        <label><span>Appeal</span><span class="expand-score" data-field="appeal">${r ? r.appeal : 5}</span></label>
                        <input type="range" min="0" max="10" step="0.5" value="${r ? r.appeal : 5}" data-field="appeal" />
                      </div>
                      <div class="expand-rating-row">
                        <label><span>Iconicness</span><span class="expand-score" data-field="iconicness">${r ? r.iconicness : 5}</span></label>
                        <input type="range" min="0" max="10" step="0.5" value="${r ? r.iconicness : 5}" data-field="iconicness" />
                      </div>
                    </div>
                    <div class="expand-actions">
                      <button class="expand-close-btn">Close</button>
                      <button class="expand-save-btn">Save</button>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  container.querySelectorAll('.list-sprite-canvas').forEach(canvas => {
    const r = userRatings[canvas.dataset.id];
    drawStatTriangle(canvas, r ? [r.battleAbility, r.appeal, r.iconicness] : null);
  });

  container.querySelectorAll('.main-row').forEach(row => {
    row.addEventListener('click', () => {
      const detail = row.nextElementSibling;
      const isOpen = !detail.classList.contains('hidden');
      container.querySelectorAll('.row-expand').forEach(r => r.classList.add('hidden'));
      if (!isOpen) {
        detail.classList.remove('hidden');
        // On desktop the sliders are immediately visible — show welcome modal here.
        // On mobile the modal is deferred to the Edit button click (sliders aren't shown yet).
        const isMobile = window.innerWidth <= 600;
        if (!isMobile && Object.keys(userRatings).length === 0 && !welcomeShown) {
          welcomeShown = true;
          document.getElementById('welcome-overlay').classList.remove('hidden');
        }
      }
    });
  });

  // Wire slider live-display, edit, close, and save for each expand row
  container.querySelectorAll('.row-expand').forEach(expandRow => {
    // Mobile: Edit button switches from stats view to sliders view
    expandRow.querySelector('.expand-edit-btn').addEventListener('click', () => {
      expandRow.classList.add('edit-mode');
      // Show welcome modal when an unrated user first reaches the sliders on mobile
      if (Object.keys(userRatings).length === 0 && !welcomeShown) {
        welcomeShown = true;
        document.getElementById('welcome-overlay').classList.remove('hidden');
      }
    });

    // Update score display as slider moves
    expandRow.querySelectorAll('input[type="range"]').forEach(input => {
      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        expandRow.querySelector(`.expand-score[data-field="${input.dataset.field}"]`).textContent =
          Number.isInteger(v) ? v : v.toFixed(1);
      });
    });

    // Close: collapse the row and reset edit-mode (for mobile re-open)
    expandRow.querySelector('.expand-close-btn').addEventListener('click', () => {
      expandRow.classList.remove('edit-mode');
      expandRow.classList.add('hidden');
    });

    // Save and collapse
    expandRow.querySelector('.expand-save-btn').addEventListener('click', async () => {
      const pokemonId = parseInt(expandRow.dataset.pokemonId, 10);
      await saveRating(pokemonId, expandRow, expandRow.previousElementSibling);
    });
  });
}


/**
 * POSTs a rating to the server, then updates the row display in-place.
 * @param {number} pokemonId
 * @param {HTMLElement} expandRow - The .row-expand <tr>
 * @param {HTMLElement} mainRow   - The preceding .main-row <tr>
 */
async function saveRating(pokemonId, expandRow, mainRow) {
  const getVal = field => Number(expandRow.querySelector(`input[data-field="${field}"]`).value);

  const res = await fetch(`/api/ratings/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pokemonId,
      battleAbility: getVal('battleAbility'),
      appeal: getVal('appeal'),
      iconicness: getVal('iconicness'),
    }),
  });

  if (!res.ok) return;

  const { rating } = await res.json();
  userRatings[pokemonId] = rating;

  // Update row class and stat cells without a full re-render
  mainRow.classList.remove('row-unrated');
  mainRow.classList.add('row-rated');
  const cells = mainRow.querySelectorAll('td');
  cells[3].textContent = rating.battleAbility; // Battle Ability (col-detail)
  cells[4].textContent = rating.appeal;         // Appeal (col-detail)
  cells[5].textContent = rating.iconicness;     // Iconicness (col-detail)
  cells[6].textContent = ratingSum(rating);     // Total

  // Redraw the stat triangle canvas
  const canvas = mainRow.querySelector('.list-sprite-canvas');
  drawStatTriangle(canvas, [rating.battleAbility, rating.appeal, rating.iconicness]);

  // Refresh the mobile stats view so re-opening the row shows the new values
  const gridSpans = expandRow.querySelectorAll('.expand-grid span:nth-child(even)');
  if (gridSpans.length === 3) {
    gridSpans[0].textContent = rating.battleAbility;
    gridSpans[1].textContent = rating.appeal;
    gridSpans[2].textContent = rating.iconicness;
  }

  // Update the start-rating button text
  const ratedCount = Object.keys(userRatings).length;
  const startBtn = document.getElementById('start-rating-btn');
  if (ratedCount >= allPokemon.length) {
    startBtn.classList.add('hidden');
  } else {
    startBtn.textContent = 'Continue Rating';
    startBtn.classList.remove('hidden');
  }

  expandRow.classList.remove('edit-mode');
  expandRow.classList.add('hidden');
}

function updateClearButton() {
  const { search, gen, type, type2, rated, sortBy } = getFilters();
  const active = search || gen || type || type2 || rated || sortBy !== 'total';
  document.getElementById('clear-filters').classList.toggle('hidden', !active);
}

function updateFilterXButtons() {
  const { search, gen, type, type2, rated } = getFilters();
  document.getElementById('clear-search').classList.toggle('hidden', !search);
  document.getElementById('clear-gen').classList.toggle('hidden', !gen);
  document.getElementById('clear-type').classList.toggle('hidden', !type);
  document.getElementById('clear-type2').classList.toggle('hidden', !type2);
  document.getElementById('clear-rated').classList.toggle('hidden', !rated);
}

function getPool() {
  const { search, gen } = getFilters();
  return allPokemon.filter(p => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    return true;
  });
}

function getGenPool() {
  const { search, type, type2 } = getFilters();
  return allPokemon.filter(p => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (type && !p.types.includes(type)) return false;
    if (type2 === 'mono') { if (p.types.length !== 1) return false; }
    else if (type2 && !p.types.includes(type2)) return false;
    return true;
  });
}

function clearFilters() {
  document.getElementById('search').value = '';
  document.getElementById('filter-gen').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-type2').value = '';
  document.getElementById('filter-type2-wrap').classList.add('hidden');
  document.getElementById('filter-rated').value = '';
  document.getElementById('sort-by').value = 'total';
  refreshGenFilter(getGenPool());
  refreshTypeFilters(getPool());
  renderList();
  updateClearButton();
  updateFilterXButtons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onTypeChange() {
  refreshType2Filter(getPool());
  refreshGenFilter(getGenPool());
  renderList();
  updateClearButton();
  updateFilterXButtons();
}

document.getElementById('search').addEventListener('input', () => { refreshGenFilter(getGenPool()); refreshTypeFilters(getPool()); renderList(); updateClearButton(); updateFilterXButtons(); });
document.getElementById('filter-gen').addEventListener('change', () => { refreshTypeFilters(getPool()); renderList(); updateClearButton(); updateFilterXButtons(); });
document.getElementById('filter-type').addEventListener('change', onTypeChange);
document.getElementById('filter-type2').addEventListener('change', () => { refreshGenFilter(getGenPool()); renderList(); updateClearButton(); updateFilterXButtons(); });
document.getElementById('filter-rated').addEventListener('change', () => { renderList(); updateClearButton(); updateFilterXButtons(); });
document.getElementById('sort-by').addEventListener('change', () => { renderList(); updateClearButton(); });
document.getElementById('clear-filters').addEventListener('click', clearFilters);

document.getElementById('clear-search').addEventListener('click', () => {
  document.getElementById('search').value = '';
  refreshGenFilter(getGenPool()); refreshTypeFilters(getPool()); renderList(); updateClearButton(); updateFilterXButtons();
});
document.getElementById('clear-gen').addEventListener('click', () => {
  document.getElementById('filter-gen').value = '';
  refreshTypeFilters(getPool()); renderList(); updateClearButton(); updateFilterXButtons();
});
document.getElementById('clear-type').addEventListener('click', () => {
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-type2').value = '';
  document.getElementById('filter-type2-wrap').classList.add('hidden');
  refreshGenFilter(getGenPool()); renderList(); updateClearButton(); updateFilterXButtons();
});
document.getElementById('clear-type2').addEventListener('click', () => {
  document.getElementById('filter-type2').value = '';
  refreshGenFilter(getGenPool()); renderList(); updateClearButton(); updateFilterXButtons();
});
document.getElementById('clear-rated').addEventListener('click', () => {
  document.getElementById('filter-rated').value = '';
  renderList(); updateClearButton(); updateFilterXButtons();
});

init();
