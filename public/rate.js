const userId = getUserId();
let allPokemon = [];
let userRatings = {};
let globalAverages = {};
let wolfeRankings = [];
let queue = [];
let currentIndex = 0;

function shuffleQueue() {
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  currentIndex = 0;
}

function preloadImages(startIndex, count = 5) {
  for (let i = startIndex; i < Math.min(startIndex + count, queue.length); i++) {
    const img = new Image();
    img.src = queue[i].sprite || '';
  }
}

async function init() {
  const [pokemon, ratings, averages, wolfe] = await Promise.all([
    fetch('/data/pokemon.json').then(r => r.json()),
    fetch(`/api/ratings/${userId}`).then(r => r.json()),
    fetch('/api/averages').then(r => r.json()),
    fetch('/data/wolfe-rankings.json').then(r => r.json()),
  ]);

  allPokemon = pokemon;
  userRatings = ratings;
  globalAverages = averages;
  wolfeRankings = wolfe;

  queue = allPokemon.filter(p => !userRatings[p.id]);
  shuffleQueue();
  preloadImages(0);

  updateProgress();
  showCurrent();

  const ratedCount = Object.keys(userRatings).length;
  if (ratedCount > 0 && ratedCount < allPokemon.length) {
    document.getElementById('header-pdf-btn').classList.remove('hidden');
  }
  if (ratedCount === 0) {
    document.getElementById('welcome-overlay').classList.remove('hidden');
    document.getElementById('welcome-close').addEventListener('click', () => {
      document.getElementById('welcome-overlay').classList.add('hidden');
    });
  }
}

function updateProgress() {
  const total = allPokemon.length;
  const rated = Object.keys(userRatings).length;
  const pct = total ? (rated / total) * 100 : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `${rated} / ${total} rated`;
}

function showComplete() {
  document.getElementById('rate-pokemon-info').classList.add('hidden');
  document.querySelector('.rating-section').classList.add('hidden');
  document.getElementById('rate-next-btn').classList.add('hidden');
  document.getElementById('rate-complete').classList.remove('hidden');
  document.getElementById('rate-card').classList.add('complete');
  document.getElementById('header-pdf-btn').classList.add('hidden');
}

function downloadPDF() {
  const globalRankById = {};
  [...allPokemon]
    .sort((a, b) => {
      const aa = globalAverages[a.id], ab = globalAverages[b.id];
      return (ab ? ratingSum(ab) : -1) - (aa ? ratingSum(aa) : -1);
    })
    .forEach((p, i) => { globalRankById[p.id] = i + 1; });

  const wolfeRankById = Object.fromEntries(wolfeRankings.map(e => [e.id, e.rank]));

  // Single pass: partition into rated (sorted by total desc) and unrated (sorted by dex).
  const rated = [], unrated = [];
  for (const p of allPokemon) (userRatings[p.id] ? rated : unrated).push(p);
  rated.sort((a, b) => ratingSum(userRatings[b.id]) - ratingSum(userRatings[a.id]));
  unrated.sort((a, b) => a.id - b.id);
  const sorted = [...rated, ...unrated];

  const rows = sorted.map((p, i) => {
    const r   = userRatings[p.id];
    const avg = globalAverages[p.id];
    const dex = String(p.baseId ?? p.id).padStart(4, '0');
    return `<tr${r ? '' : ' class="unrated"'}>
      <td>${i + 1}</td>
      <td>#${dex}</td>
      <td>${p.name}</td>
      <td>${p.types.join(', ')}</td>
      <td>${r ? r.battleAbility : '—'}</td>
      <td>${r ? r.appeal       : '—'}</td>
      <td>${r ? r.iconicness   : '—'}</td>
      <td><strong>${r ? ratingSum(r) : '—'}</strong></td>
      <td>${avg ? ratingSum(avg).toFixed(2) : '—'}</td>
      <td>${globalRankById[p.id] ?? '—'}</td>
      <td>${wolfeRankById[p.id] ?? '—'}</td>
    </tr>`;
  }).join('');

  const ratedCount = rated.length;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>My pkmnRank Rankings</title>
  <style>
    body { font-family: sans-serif; font-size: 11px; color: #111; margin: 24px; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    p { color: #555; margin-bottom: 16px; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e0900; color: #E8952A; text-align: left; padding: 6px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
    td { padding: 5px 10px; border-bottom: 1px solid #ddd; }
    tr:nth-child(even) td { background: #f9f3eb; }
    tr.unrated td { color: #aaa; }
    td strong { font-weight: 700; color: #c07030; }
  </style>
</head>
<body>
  <h1>My pkmnRank Rankings</h1>
  <p>Generated ${new Date().toLocaleDateString()} · ${ratedCount} / ${allPokemon.length} Pokémon rated</p>
  <table>
    <thead><tr>
      <th>#</th><th>Dex</th><th>Name</th><th>Types</th>
      <th>Battle Ability</th><th>Appeal</th><th>Iconicness</th><th>My Total</th>
      <th>Global Avg</th><th>Global Rank</th><th>Wolfe's Rank</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.print();
}

function showCurrent() {
  if (currentIndex >= queue.length) {
    showComplete();
    return;
  }

  document.getElementById('rate-pokemon-info').classList.remove('hidden');
  document.querySelector('.rating-section').classList.remove('hidden');
  document.getElementById('rate-next-btn').classList.remove('hidden');

  const p = queue[currentIndex];
  const url = serebiiUrl(p, allPokemon);

  const sprite = document.getElementById('rate-sprite');
  sprite.src = p.sprite || '';
  sprite.alt = p.name;
  sprite.onclick = () => window.open(url, '_blank', 'noopener');

  document.getElementById('rate-dex').textContent = '#' + String(p.baseId ?? p.id).padStart(4, '0');
  document.getElementById('rate-name').innerHTML =
    `<a href="${url}" target="_blank" rel="noopener" class="serebii-link">${nameHTML(p, allPokemon)}</a>`;

  const typesEl = document.getElementById('rate-types');
  typesEl.innerHTML = p.types.map(typeBadgeHTML).join('');

  document.querySelectorAll('.rating-row input[type="range"]').forEach(input => {
    input.value = 5;
    input.closest('.rating-row').querySelector('.score-display').textContent = '5';
  });
  drawStatTriangle(triCanvas, [5, 5, 5], false);

}

async function saveAndNext() {
  const p = queue[currentIndex];
  const getVal = field => Number(document.querySelector(`input[data-field="${field}"]`).value);

  const res = await fetch(`/api/ratings/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pokemonId: p.id,
      battleAbility: getVal('battleAbility'),
      appeal: getVal('appeal'),
      iconicness: getVal('iconicness'),
    }),
  });

  if (res.ok) {
    const { rating } = await res.json();
    userRatings[p.id] = rating;
    currentIndex++;
    preloadImages(currentIndex + 1);
    updateProgress();
    showCurrent();
  }
}

const triCanvas = document.getElementById('stat-triangle');

function getSliderVals() {
  return ['battleAbility', 'appeal', 'iconicness'].map(
    f => Number(document.querySelector(`input[data-field="${f}"]`).value)
  );
}

document.querySelectorAll('.info-icon').forEach(el => {
  el.dataset.tip = `0: ${el.dataset.tipLow}\n10: ${el.dataset.tipHigh}`;
});

document.querySelectorAll('.rating-row input[type="range"]').forEach(input => {
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    input.closest('.rating-row').querySelector('.score-display').textContent = Number.isInteger(v) ? v : v.toFixed(1);
    drawStatTriangle(triCanvas, getSliderVals(), false);
  });
});

document.getElementById('rate-next-btn').addEventListener('click', saveAndNext);
document.getElementById('download-pdf-btn').addEventListener('click', downloadPDF);
document.getElementById('header-pdf-btn').addEventListener('click', downloadPDF);

init();
