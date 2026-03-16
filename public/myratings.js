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

  updateProgress();
  renderList();
}

function updateProgress() {
  const total = allPokemon.length;
  const rated = Object.keys(userRatings).length;
  const pct = total ? (rated / total) * 100 : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `${rated} / ${total} rated`;
}

function ratingSum(r) {
  return (r.battleAbility ?? 0) + (r.appeal ?? 0) + (r.iconicness ?? 0);
}

function getFilters() {
  return {
    search: document.getElementById('search').value.trim().toLowerCase(),
    gen: document.getElementById('filter-gen').value,
    type: document.getElementById('filter-type').value,
    rated: document.getElementById('filter-rated').value,
    sortBy: document.getElementById('sort-by').value,
  };
}

function renderList() {
  const { search, gen, type, rated, sortBy } = getFilters();

  let list = allPokemon.filter(p => {
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    if (type && !p.types.includes(type)) return false;
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
          <th>Battle Ability</th>
          <th>Appeal</th>
          <th>Iconicness</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${list.map((p, i) => {
          const r = userRatings[p.id];
          const dex = String(p.baseId ?? p.id).padStart(4, '0');
          return `
            <tr class="${r ? 'row-rated' : 'row-unrated'}">
              <td class="rank-num">${i + 1}</td>
              <td><div class="list-sprite-wrapper"><canvas class="list-sprite-canvas" data-id="${p.id}" width="86" height="86"></canvas><img class="list-sprite" src="${p.sprite || ''}" alt="${p.name}" loading="lazy" /></div></td>
              <td>
                <div class="list-dex">#${dex}</div>
                ${nameHTML(p, allPokemon)}
              </td>
              <td>${r ? r.battleAbility : '—'}</td>
              <td>${r ? r.appeal : '—'}</td>
              <td>${r ? r.iconicness : '—'}</td>
              <td class="total-score">${r ? ratingSum(r) : '—'}</td>
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
}

document.getElementById('search').addEventListener('input', renderList);
document.getElementById('filter-gen').addEventListener('change', renderList);
document.getElementById('filter-type').addEventListener('change', renderList);
document.getElementById('filter-rated').addEventListener('change', renderList);
document.getElementById('sort-by').addEventListener('change', renderList);

init();
