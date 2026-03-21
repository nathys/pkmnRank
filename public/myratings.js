const userId = getUserId();
let allPokemon = [];
let userRatings = {};


async function init() {
  const [pokemon, ratings] = await Promise.all([
    fetch('/data/pokemon.json').then(r => r.json()),
    fetch(`/api/ratings/${userId}`).then(r => r.json()).catch(() => ({})),
  ]);

  allPokemon = pokemon;
  userRatings = ratings;

  // Show the CTA button when the user hasn't finished rating all Pokémon.
  const ratedCount = Object.keys(userRatings).length;
  if (ratedCount < allPokemon.length) {
    const btn = document.getElementById('start-rating-btn');
    btn.textContent = ratedCount > 0 ? 'Continue Rating' : 'Start Rating';
    btn.classList.remove('hidden');
  }

  refreshGenFilter(getGenPool());
  refreshTypeFilters(getPool());
  renderList();
}


function ratingSum(r) {
  return (r.battleAbility ?? 0) + (r.appeal ?? 0) + (r.iconicness ?? 0);
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
            <tr class="row-expand hidden">
              <td colspan="4">
                <div class="expand-grid">
                  <span>Battle Ability</span><span>${r ? r.battleAbility : '—'}</span>
                  <span>Appeal</span><span>${r ? r.appeal : '—'}</span>
                  <span>Iconicness</span><span>${r ? r.iconicness : '—'}</span>
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
      if (!isOpen) detail.classList.remove('hidden');
    });
  });
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

// Pool for gen dropdown: all pokemon matching current search + type filters.
function getPool() {
  const { search, gen } = getFilters();
  return allPokemon.filter(p => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    return true;
  });
}

// Pool for type dropdown: all pokemon matching current search + gen filters.
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
