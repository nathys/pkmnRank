let allPokemon = [];
let wolfeRankings = [];
let pokemonById = {};

async function init() {
  const [pokemon, rankings] = await Promise.all([
    fetch('/data/pokemon.json').then(r => r.json()),
    fetch('/data/wolfe-rankings.json').then(r => r.json()),
  ]);

  allPokemon = pokemon;
  wolfeRankings = rankings;
  pokemonById = Object.fromEntries(pokemon.map(p => [p.id, p]));

  renderList();
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

  let list = wolfeRankings.filter(entry => {
    const p = pokemonById[entry.id];
    if (!p) return false;
    if (search && !p.name.toLowerCase().includes(search)) return false;
    if (gen && p.generation !== gen) return false;
    if (type && !p.types.includes(type)) return false;
    return true;
  });

  list.sort((a, b) => {
    if (sortBy === 'dex') {
      const pa = pokemonById[a.id], pb = pokemonById[b.id];
      return (pa.baseId ?? pa.id) - (pb.baseId ?? pb.id);
    }
    return a.rank - b.rank;
  });

  let lastCategory = null;

  const container = document.getElementById('wolfe-list');
  container.innerHTML = `
    <table class="ratings-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th></th>
          <th>Name</th>
          <th class="col-detail">Category</th>
          <th class="col-detail">Dex #</th>
        </tr>
      </thead>
      <tbody>
        ${list.map(entry => {
          const p = pokemonById[entry.id];
          if (!p) return '';
          const dex = String(p.baseId ?? p.id).padStart(4, '0');
          const categoryRow = (sortBy === 'wolfe' && entry.category !== lastCategory)
            ? (() => { lastCategory = entry.category; return `<tr class="category-row"><td colspan="5">${entry.category}</td></tr>`; })()
            : '';
          return `
            ${categoryRow}
            <tr class="main-row row-rated">
              <td class="rank-num wolfe-rank">#${entry.rank}</td>
              <td><div class="list-sprite-wrapper"><canvas class="list-sprite-canvas" data-id="${p.id}" width="86" height="86"></canvas><img class="list-sprite" src="${p.sprite || ''}" alt="${p.name}" loading="lazy" /></div></td>
              <td>
                <div class="list-dex">#${dex}</div>
                ${nameHTML(p, allPokemon)}
              </td>
              <td class="col-detail category-cell">${entry.category}</td>
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

document.getElementById('search').addEventListener('input', renderList);
document.getElementById('filter-gen').addEventListener('change', renderList);
document.getElementById('filter-type').addEventListener('change', renderList);
document.getElementById('sort-by').addEventListener('change', renderList);

init();
