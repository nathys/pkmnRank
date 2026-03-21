let allPokemon = [];
let wolfeRankings = [];
let pokemonById = {};
const ALL_TYPES = ['Bug','Dark','Dragon','Electric','Fairy','Fighting','Fire','Flying','Ghost','Grass','Ground','Ice','Normal','Poison','Psychic','Rock','Steel','Water'];
const ALL_GENS = [
  { value: 'generation-i', label: 'Gen I' }, { value: 'generation-ii', label: 'Gen II' },
  { value: 'generation-iii', label: 'Gen III' }, { value: 'generation-iv', label: 'Gen IV' },
  { value: 'generation-v', label: 'Gen V' }, { value: 'generation-vi', label: 'Gen VI' },
  { value: 'generation-vii', label: 'Gen VII' }, { value: 'generation-viii', label: 'Gen VIII' },
  { value: 'generation-ix', label: 'Gen IX' },
];

async function init() {
  const [pokemon, rankings] = await Promise.all([
    fetch('/data/pokemon.json').then(r => r.json()),
    fetch('/data/wolfe-rankings.json').then(r => r.json()),
  ]);

  allPokemon = pokemon;
  wolfeRankings = rankings;
  pokemonById = Object.fromEntries(pokemon.map(p => [p.id, p]));

  renderPyramid();
  refreshGenFilter();
  refreshTypeFilters();
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

  const container = document.getElementById('wolfe-list');
  container.innerHTML = `
    <table class="ratings-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th></th>
          <th>Name</th>
          <th class="col-detail">Dex #</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(entry => {
          const p = pokemonById[entry.id];
          if (!p) return '';
          const dex = String(p.baseId ?? p.id).padStart(4, '0');
          return `
            <tr class="main-row row-rated">
              <td class="rank-num wolfe-rank">#${entry.rank}</td>
              <td><div class="list-sprite-wrapper"><canvas class="list-sprite-canvas" data-id="${p.id}" width="86" height="86"></canvas><img class="list-sprite" src="${p.sprite || ''}" alt="${p.name}" loading="lazy" /></div></td>
              <td>
                <div class="list-dex">#${dex}</div>
                ${nameHTML(p, allPokemon)}
              </td>
              <td class="col-detail" style="color:#a07850">#${dex}</td>
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

function getPool() {
  const search = document.getElementById('search').value.trim().toLowerCase();
  const gen = document.getElementById('filter-gen').value;
  const rankedIds = new Set(wolfeRankings.map(r => r.id));
  return allPokemon.filter(p => {
    if (!rankedIds.has(p.id)) return false;
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    return true;
  });
}

function getGenPool() {
  const search = document.getElementById('search').value.trim().toLowerCase();
  const type = document.getElementById('filter-type').value;
  const type2 = document.getElementById('filter-type2').value;
  const rankedIds = new Set(wolfeRankings.map(r => r.id));
  return allPokemon.filter(p => {
    if (!rankedIds.has(p.id)) return false;
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (type && !p.types.includes(type)) return false;
    if (type2 === 'mono') { if (p.types.length !== 1) return false; }
    else if (type2 && !p.types.includes(type2)) return false;
    return true;
  });
}

function refreshGenFilter() {
  const present = new Set(getGenPool().map(p => p.generation));
  const genEl = document.getElementById('filter-gen');
  const prev = genEl.value;
  genEl.innerHTML = '<option value="">All Gens</option>' +
    ALL_GENS.filter(g => present.has(g.value))
      .map(g => `<option value="${g.value}">${g.label}</option>`).join('');
  genEl.value = present.has(prev) ? prev : '';
}

function refreshType2Filter(pool) {
  const type = document.getElementById('filter-type').value;
  const type2El = document.getElementById('filter-type2');
  if (!type) { type2El.value = ''; type2El.classList.add('hidden'); return; }
  const withType = pool.filter(p => p.types.includes(type));
  const secondary = new Set();
  withType.forEach(p => p.types.forEach(t => { if (t !== type) secondary.add(t); }));
  const hasMono = withType.some(p => p.types.length === 1);
  const prev = type2El.value;
  type2El.innerHTML =
    '<option value="">+ Second Type</option>' +
    (hasMono ? '<option value="mono">Mono-type</option>' : '') +
    ALL_TYPES.filter(t => secondary.has(t)).map(t => `<option>${t}</option>`).join('');
  const valid = new Set(['', 'mono', ...secondary]);
  type2El.value = valid.has(prev) ? prev : '';
  type2El.classList.remove('hidden');
}

function refreshTypeFilters() {
  const pool = getPool();
  const present = new Set();
  pool.forEach(p => p.types.forEach(t => present.add(t)));
  const typeEl = document.getElementById('filter-type');
  const prev = typeEl.value;
  typeEl.innerHTML = '<option value="">All Types</option>' +
    ALL_TYPES.filter(t => present.has(t)).map(t => `<option>${t}</option>`).join('');
  if (prev && !present.has(prev)) {
    typeEl.value = '';
    const type2El = document.getElementById('filter-type2');
    type2El.value = ''; type2El.classList.add('hidden');
  } else {
    typeEl.value = prev;
    if (prev) refreshType2Filter(pool);
  }
}

function clearFilters() {
  document.getElementById('search').value = '';
  document.getElementById('filter-gen').value = '';
  document.getElementById('filter-type').value = '';
  document.getElementById('filter-type2').value = '';
  document.getElementById('filter-type2').classList.add('hidden');
  refreshGenFilter();
  refreshTypeFilters();
  renderList();
  updateClearButton();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onTypeChange() {
  refreshType2Filter(getPool());
  refreshGenFilter();
  renderList();
  updateClearButton();
}

document.getElementById('search').addEventListener('input', () => { refreshGenFilter(); refreshTypeFilters(); renderList(); updateClearButton(); });
document.getElementById('filter-gen').addEventListener('change', () => { refreshTypeFilters(); renderList(); updateClearButton(); });
document.getElementById('filter-type').addEventListener('change', onTypeChange);
document.getElementById('filter-type2').addEventListener('change', () => { refreshGenFilter(); renderList(); updateClearButton(); });
document.getElementById('clear-filters').addEventListener('click', clearFilters);

init();
