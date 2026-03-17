let allPokemon = [];
let globalAverages = {};

async function init() {
  const [pokemon, averages] = await Promise.all([
    fetch('/data/pokemon.json').then(r => r.json()),
    fetch('/api/averages').then(r => r.json()),
  ]);

  allPokemon = pokemon;
  globalAverages = averages;

  renderList();
}

function avgSum(avg) {
  return (avg.battleAbility ?? 0) + (avg.appeal ?? 0) + (avg.iconicness ?? 0);
}

function getFilters() {
  return {
    search: document.getElementById('search').value.trim().toLowerCase(),
    gen: document.getElementById('filter-gen').value,
    type: document.getElementById('filter-type').value,

    sortBy: document.getElementById('sort-by').value,
  };
}

function renderList() {
  const { search, gen, type, sortBy } = getFilters();

  let list = allPokemon.filter(p => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    if (type && !p.types.includes(type)) return false;
    return true;
  });

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

document.getElementById('search').addEventListener('input', renderList);
document.getElementById('filter-gen').addEventListener('change', renderList);
document.getElementById('filter-type').addEventListener('change', renderList);

document.getElementById('sort-by').addEventListener('change', renderList);

init();
