let allPokemon = [];
let globalAverages = {};
const ALL_TYPES = ['Bug','Dark','Dragon','Electric','Fairy','Fighting','Fire','Flying','Ghost','Grass','Ground','Ice','Normal','Poison','Psychic','Rock','Steel','Water'];
const ALL_GENS = [
  { value: 'generation-i', label: 'Gen I' }, { value: 'generation-ii', label: 'Gen II' },
  { value: 'generation-iii', label: 'Gen III' }, { value: 'generation-iv', label: 'Gen IV' },
  { value: 'generation-v', label: 'Gen V' }, { value: 'generation-vi', label: 'Gen VI' },
  { value: 'generation-vii', label: 'Gen VII' }, { value: 'generation-viii', label: 'Gen VIII' },
  { value: 'generation-ix', label: 'Gen IX' },
];

async function init() {
  const [pokemon, averages] = await Promise.all([
    fetch('/data/pokemon.json').then(r => r.json()),
    fetch('/api/averages').then(r => r.json()),
  ]);

  allPokemon = pokemon;
  globalAverages = averages;

  renderPyramid();
  refreshGenFilter();
  refreshTypeFilters();
  renderList();
}

function globalPyramidCard(p, rank, large) {
  const avg = globalAverages[p.id];
  const canvasSize = large ? 180 : 130;
  return `
    <div class="pyramid-card${large ? ' pyramid-card-large' : ''} global-pyramid-card" data-id="${p.id}">
      <div class="pyramid-rank">#${rank}</div>
      <div class="pyramid-body">
        <div class="pyramid-sprite-wrapper">
          <canvas class="pyramid-sprite-canvas" data-id="${p.id}" width="${canvasSize}" height="${canvasSize}"></canvas>
          <img class="pyramid-sprite" src="${p.sprite || ''}" alt="${p.name}" loading="lazy" />
        </div>
        <div class="pyramid-name">${p.name}</div>
        <div class="pyramid-scores">
          <span>Battle</span><span>${avg ? avg.battleAbility : '—'}</span>
          <span>Appeal</span><span>${avg ? avg.appeal : '—'}</span>
          <span>Iconic</span><span>${avg ? avg.iconicness : '—'}</span>
          <span>Total</span><span>${avg ? avgSum(avg).toFixed(2) : '—'}</span>
          <span>Ratings</span><span>${avg ? avg.count : '—'}</span>
        </div>
      </div>
    </div>
  `;
}

function renderPyramid() {
  const sorted = allPokemon.slice().sort((a, b) => {
    const aa = globalAverages[a.id], ab = globalAverages[b.id];
    return (ab ? avgSum(ab) : -1) - (aa ? avgSum(aa) : -1);
  });
  const top10 = sorted.slice(0, 10);
  const rows = [
    top10.slice(0, 1),
    top10.slice(1, 3),
    top10.slice(3, 6),
    top10.slice(6, 10),
  ];

  const container = document.getElementById('global-pyramid');
  let rank = 1;
  container.innerHTML = rows.map((row, i) => {
    const html = `
      <div class="pyramid-row pyramid-row-${i + 1}">
        ${row.map(p => globalPyramidCard(p, rank++, i === 0)).join('')}
      </div>
    `;
    return html;
  }).join('');

  container.querySelectorAll('.pyramid-sprite-canvas').forEach(canvas => {
    const avg = globalAverages[canvas.dataset.id];
    drawStatTriangle(canvas, avg ? [avg.battleAbility, avg.appeal, avg.iconicness] : null);
  });

}

function avgSum(avg) {
  return (avg.battleAbility ?? 0) + (avg.appeal ?? 0) + (avg.iconicness ?? 0);
}

function getFilters() {
  return {
    search: document.getElementById('search').value.trim().toLowerCase(),
    gen: document.getElementById('filter-gen').value,
    type: document.getElementById('filter-type').value,
    type2: document.getElementById('filter-type2').value,
    sortBy: document.getElementById('sort-by').value,
  };
}

function renderList() {
  const { search, gen, type, type2, sortBy } = getFilters();
  const filtered = search || gen || type || type2 || sortBy !== 'total';

  document.getElementById('global-pyramid').style.display = filtered ? 'none' : '';

  let list = allPokemon.filter(p => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    if (type && !p.types.includes(type)) return false;
    if (type2 === 'mono') { if (p.types.length !== 1) return false; }
    else if (type2 && !p.types.includes(type2)) return false;
    return true;
  });

  if (!filtered) {
    const sorted = list.slice().sort((a, b) => {
      const aa = globalAverages[a.id], ab = globalAverages[b.id];
      return (ab ? avgSum(ab) : -1) - (aa ? avgSum(aa) : -1);
    });
    const top10ids = new Set(sorted.slice(0, 10).map(p => p.id));
    list = list.filter(p => !top10ids.has(p.id));
  }

  list.sort((a, b) => {
    if (sortBy === 'dex') return (a.baseId ?? a.id) - (b.baseId ?? b.id);
    const aa = globalAverages[a.id], ab = globalAverages[b.id];
    if (sortBy === 'total') {
      return (ab ? avgSum(ab) : -1) - (aa ? avgSum(aa) : -1);
    }
    return (ab ? ab[sortBy] ?? -1 : -1) - (aa ? aa[sortBy] ?? -1 : -1);
  });

  const container = document.getElementById('global-list');
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
          <th class="col-detail">Ratings</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((p, i) => {
          const avg = globalAverages[p.id];
          const dex = String(p.baseId ?? p.id).padStart(4, '0');
          return `
            <tr class="main-row ${avg ? 'row-rated' : 'row-unrated'}">
              <td class="rank-num">${i + 1}</td>
              <td><div class="list-sprite-wrapper"><canvas class="list-sprite-canvas" data-id="${p.id}" width="86" height="86"></canvas><img class="list-sprite" src="${p.sprite || ''}" alt="${p.name}" loading="lazy" /></div></td>
              <td>
                <div class="list-dex">#${dex}</div>
                ${nameHTML(p, allPokemon)}
              </td>
              <td class="col-detail">${avg ? avg.battleAbility : '—'}</td>
              <td class="col-detail">${avg ? avg.appeal : '—'}</td>
              <td class="col-detail">${avg ? avg.iconicness : '—'}</td>
              <td class="total-score">${avg ? avgSum(avg).toFixed(2) : '—'}</td>
              <td class="col-detail rating-count">${avg ? avg.count : '—'}</td>
            </tr>
            <tr class="row-expand hidden">
              <td colspan="4">
                <div class="expand-grid">
                  <span>Battle Ability</span><span>${avg ? avg.battleAbility : '—'}</span>
                  <span>Appeal</span><span>${avg ? avg.appeal : '—'}</span>
                  <span>Iconicness</span><span>${avg ? avg.iconicness : '—'}</span>
                  <span>Ratings</span><span>${avg ? avg.count : '—'}</span>
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;

  container.querySelectorAll('.list-sprite-canvas').forEach(canvas => {
    const avg = globalAverages[canvas.dataset.id];
    drawStatTriangle(canvas, avg ? [avg.battleAbility, avg.appeal, avg.iconicness] : null);
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
  const { search, gen, type, type2, sortBy } = getFilters();
  const active = search || gen || type || type2 || sortBy !== 'total';
  document.getElementById('clear-filters').classList.toggle('hidden', !active);
}

function getPool() {
  const search = document.getElementById('search').value.trim().toLowerCase();
  const gen = document.getElementById('filter-gen').value;
  return allPokemon.filter(p => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    return true;
  });
}

function getGenPool() {
  const search = document.getElementById('search').value.trim().toLowerCase();
  const type = document.getElementById('filter-type').value;
  const type2 = document.getElementById('filter-type2').value;
  return allPokemon.filter(p => {
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
  document.getElementById('sort-by').value = 'total';
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
document.getElementById('sort-by').addEventListener('change', () => { renderList(); updateClearButton(); });
document.getElementById('clear-filters').addEventListener('click', clearFilters);

init();
