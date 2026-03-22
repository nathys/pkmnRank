let allPokemon = [];
let globalAverages = {};

async function init() {
  const [pokemon, averages] = await Promise.all([
    fetch('/data/pokemon.json').then(r => r.json()),
    fetch('/api/averages').then(r => r.json()),
  ]);

  allPokemon = pokemon;
  globalAverages = averages;

  renderPyramid();
  refreshGenFilter(getGenPool());
  refreshTypeFilters(getPool());
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

  // Rank every pokemon globally by total score, regardless of current filters.
  // Unrated pokemon share the last rank.
  const totalRankById = {};
  allPokemon.slice()
    .sort((a, b) => {
      const aa = globalAverages[a.id], ab = globalAverages[b.id];
      return (ab ? avgSum(ab) : -1) - (aa ? avgSum(aa) : -1);
    })
    .forEach((p, i) => { totalRankById[p.id] = i + 1; });

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

  // When the pyramid is visible it already shows ranks 1–10, so start the table at 11.
  const rankOffset = filtered ? 0 : 10;

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
          <th>Total Rank</th>
          <th class="col-detail">Ratings</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((p, i) => {
          const avg = globalAverages[p.id];
          const dex = String(p.baseId ?? p.id).padStart(4, '0');
          return `
            <tr class="main-row ${avg ? 'row-rated' : 'row-unrated'}">
              <td class="rank-num">${i + 1 + rankOffset}</td>
              <td><div class="list-sprite-wrapper"><canvas class="list-sprite-canvas" data-id="${p.id}" width="86" height="86"></canvas><img class="list-sprite" src="${p.sprite || ''}" alt="${p.name}" loading="lazy" /></div></td>
              <td>
                <div class="list-dex">#${dex}</div>
                ${nameHTML(p, allPokemon)}
              </td>
              <td class="col-detail">${avg ? avg.battleAbility : '—'}</td>
              <td class="col-detail">${avg ? avg.appeal : '—'}</td>
              <td class="col-detail">${avg ? avg.iconicness : '—'}</td>
              <td class="total-score">${avg ? avgSum(avg).toFixed(2) : '—'}</td>
              <td class="rank-num">#${totalRankById[p.id]}</td>
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

  // Row expand is mobile-only on the global page — desktop shows all stats inline
  if (window.innerWidth <= 600) {
    container.querySelectorAll('.main-row').forEach(row => {
      row.addEventListener('click', () => {
        const detail = row.nextElementSibling;
        const isOpen = !detail.classList.contains('hidden');
        container.querySelectorAll('.row-expand').forEach(r => r.classList.add('hidden'));
        if (!isOpen) detail.classList.remove('hidden');
      });
    });
  }
}

function updateClearButton() {
  const { search, gen, type, type2, sortBy } = getFilters();
  const active = search || gen || type || type2 || sortBy !== 'total';
  document.getElementById('clear-filters').classList.toggle('hidden', !active);
}

function updateFilterXButtons() {
  const { search, gen, type, type2 } = getFilters();
  document.getElementById('clear-search').classList.toggle('hidden', !search);
  document.getElementById('clear-gen').classList.toggle('hidden', !gen);
  document.getElementById('clear-type').classList.toggle('hidden', !type);
  document.getElementById('clear-type2').classList.toggle('hidden', !type2);
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

init();
