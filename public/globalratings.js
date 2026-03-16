let allPokemon = [];
let globalAverages = {};

async function init() {
  const [pokemon, averages] = await Promise.all([
    fetch('/api/pokemon').then(r => r.json()),
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
          <th>Battle Ability</th>
          <th>Appeal</th>
          <th>Iconicness</th>
          <th>Total</th>
          <th>Ratings</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((p, i) => {
          const avg = globalAverages[p.id];
          const dex = String(p.baseId ?? p.id).padStart(4, '0');
          return `
            <tr class="${avg ? 'row-rated' : 'row-unrated'}">
              <td class="rank-num">${i + 1}</td>
              <td><div class="list-sprite-wrapper"><canvas class="list-sprite-canvas" data-id="${p.id}" width="86" height="86"></canvas><img class="list-sprite" src="${p.sprite || ''}" alt="${p.name}" loading="lazy" /></div></td>
              <td>
                <div class="list-dex">#${dex}</div>
                ${nameHTML(p, allPokemon)}
              </td>
              <td>${avg ? avg.battleAbility : '—'}</td>
              <td>${avg ? avg.appeal : '—'}</td>
              <td>${avg ? avg.iconicness : '—'}</td>
              <td class="total-score">${avg ? avgSum(avg).toFixed(2) : '—'}</td>
              <td class="rating-count">${avg ? avg.count : '—'}</td>
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
}

document.getElementById('search').addEventListener('input', renderList);
document.getElementById('filter-gen').addEventListener('change', renderList);
document.getElementById('filter-type').addEventListener('change', renderList);

document.getElementById('sort-by').addEventListener('change', renderList);

init();
