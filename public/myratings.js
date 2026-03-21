const userId = getUserId();
let allPokemon = [];
let userRatings = {};

const ALL_TYPES = ['Bug','Dark','Dragon','Electric','Fairy','Fighting','Fire','Flying','Ghost','Grass','Ground','Ice','Normal','Poison','Psychic','Rock','Steel','Water'];
const ALL_GENS = [
  { value: 'generation-i', label: 'Gen I' }, { value: 'generation-ii', label: 'Gen II' },
  { value: 'generation-iii', label: 'Gen III' }, { value: 'generation-iv', label: 'Gen IV' },
  { value: 'generation-v', label: 'Gen V' }, { value: 'generation-vi', label: 'Gen VI' },
  { value: 'generation-vii', label: 'Gen VII' }, { value: 'generation-viii', label: 'Gen VIII' },
  { value: 'generation-ix', label: 'Gen IX' },
];

async function init() {
  const [pokemon, ratings] = await Promise.all([
    fetch('/data/pokemon.json').then(r => r.json()),
    fetch(`/api/ratings/${userId}`).then(r => r.json()).catch(() => ({})),
  ]);

  allPokemon = pokemon;
  userRatings = ratings;

  refreshGenFilter();
  refreshTypeFilters();
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
  const { search, gen, type, type2, rated } = getFilters();
  const active = search || gen || type || type2 || rated;
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
  document.getElementById('filter-rated').value = '';
  refreshGenFilter();
  refreshTypeFilters();
  renderList();
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
document.getElementById('filter-rated').addEventListener('change', () => { renderList(); updateClearButton(); });
document.getElementById('sort-by').addEventListener('change', renderList);
document.getElementById('clear-filters').addEventListener('click', clearFilters);

init();
