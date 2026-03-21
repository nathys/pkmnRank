let allPokemon = [];
let wolfeRankings = [];
let pokemonById = {};
// Populated in init(); used by pool functions to restrict filters to ranked pokemon only.
let rankedIds = new Set();

async function init() {
  const [pokemon, rankings] = await Promise.all([
    fetch('/data/pokemon.json').then(r => r.json()),
    fetch('/data/wolfe-rankings.json').then(r => r.json()),
  ]);

  allPokemon = pokemon;
  wolfeRankings = rankings;
  pokemonById = Object.fromEntries(pokemon.map(p => [p.id, p]));
  rankedIds = new Set(rankings.map(r => r.id));

  renderPyramid();
  refreshGenFilter(getGenPool());
  refreshTypeFilters(getPool());
  renderList();
}

function pyramidCard(entry, large) {
  const p = pokemonById[entry.id];
  if (!p) return '';
  const canvasSize = large ? 180 : 130;
  return `
    <div class="pyramid-card${large ? ' pyramid-card-large' : ''}">
      <div class="pyramid-rank">#${entry.rank}</div>
      <div class="pyramid-body">
        <div class="pyramid-sprite-wrapper">
          <canvas class="pyramid-sprite-canvas" data-id="${p.id}" width="${canvasSize}" height="${canvasSize}"></canvas>
          <img class="pyramid-sprite" src="${p.sprite || ''}" alt="${p.name}" loading="lazy" />
        </div>
        <div class="pyramid-name">${p.name}</div>
      </div>
    </div>
  `;
}

function renderPyramid() {
  const top10 = wolfeRankings.slice().sort((a, b) => a.rank - b.rank).slice(0, 10);
  const rows = [
    top10.slice(0, 1),
    top10.slice(1, 3),
    top10.slice(3, 6),
    top10.slice(6, 10),
  ];
  const container = document.getElementById('wolfe-pyramid');
  container.innerHTML = rows.map((row, i) => `
    <div class="pyramid-row pyramid-row-${i + 1}">
      ${row.map(entry => pyramidCard(entry, i === 0)).join('')}
    </div>
  `).join('');

  container.querySelectorAll('.pyramid-sprite-canvas').forEach(canvas => {
    drawStatTriangle(canvas, null);
  });
}

function getFilters() {
  return {
    search: document.getElementById('search').value.trim().toLowerCase(),
    gen: document.getElementById('filter-gen').value,
    type: document.getElementById('filter-type').value,
    type2: document.getElementById('filter-type2').value,
  };
}

function renderList() {
  const { search, gen, type, type2 } = getFilters();
  const filtered = search || gen || type || type2;

  document.getElementById('wolfe-pyramid').style.display = filtered ? 'none' : '';

  let list = wolfeRankings.filter(entry => {
    const p = pokemonById[entry.id];
    if (!p) return false;
    if (!filtered && entry.rank <= 10) return false;
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    if (type && !p.types.includes(type)) return false;
    if (type2 === 'mono') { if (p.types.length !== 1) return false; }
    else if (type2 && !p.types.includes(type2)) return false;
    return true;
  });

  list.sort((a, b) => a.rank - b.rank);

  // When pyramid is visible it already shows ranks 1–10, so start the # counter at 11.
  const rankOffset = filtered ? 0 : 10;

  const container = document.getElementById('wolfe-list');
  container.innerHTML = `
    <table class="ratings-table">
      <thead>
        <tr>
          <th>#</th>
          <th></th>
          <th>Name</th>
          <th>Total Rank</th>
          <th class="col-detail">Dex #</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((entry, i) => {
          const p = pokemonById[entry.id];
          if (!p) return '';
          const dex = String(p.baseId ?? p.id).padStart(4, '0');
          return `
            <tr class="main-row row-rated">
              <td class="rank-num">${i + 1 + rankOffset}</td>
              <td><div class="list-sprite-wrapper"><canvas class="list-sprite-canvas" data-id="${p.id}" width="86" height="86"></canvas><img class="list-sprite" src="${p.sprite || ''}" alt="${p.name}" loading="lazy" /></div></td>
              <td>
                <div class="list-dex">#${dex}</div>
                ${nameHTML(p, allPokemon)}
              </td>
              <td class="rank-num wolfe-rank">#${entry.rank}</td>
              <td class="col-detail list-dex">#${dex}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  container.querySelectorAll('.list-sprite-canvas').forEach(canvas => {
    drawStatTriangle(canvas, null);
  });
}

function updateClearButton() {
  const { search, gen, type, type2 } = getFilters();
  const active = search || gen || type || type2;
  document.getElementById('clear-filters').classList.toggle('hidden', !active);
}

function updateFilterXButtons() {
  const { search, gen, type, type2 } = getFilters();
  document.getElementById('clear-search').classList.toggle('hidden', !search);
  document.getElementById('clear-gen').classList.toggle('hidden', !gen);
  document.getElementById('clear-type').classList.toggle('hidden', !type);
  document.getElementById('clear-type2').classList.toggle('hidden', !type2);
}

// Pool for gen dropdown: ranked pokemon matching current search + type filters.
function getPool() {
  const { search, gen } = getFilters();
  return allPokemon.filter(p => {
    if (!rankedIds.has(p.id)) return false;
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    return true;
  });
}

// Pool for type dropdown: ranked pokemon matching current search + gen filters.
function getGenPool() {
  const { search, type, type2 } = getFilters();
  return allPokemon.filter(p => {
    if (!rankedIds.has(p.id)) return false;
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

init();
