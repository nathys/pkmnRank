const userId = getUserId();
let allPokemon = [];
let userRatings = {};
let globalAverages = {};
let queue = [];
let currentIndex = 0;

function shuffleQueue() {
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  currentIndex = 0;
}

async function init() {
  const [pokemon, ratings, averages] = await Promise.all([
    fetch('/api/pokemon').then(r => r.json()),
    fetch(`/api/ratings/${userId}`).then(r => r.json()),
    fetch('/api/averages').then(r => r.json()),
  ]);

  allPokemon = pokemon;
  userRatings = ratings;
  globalAverages = averages;

  queue = allPokemon.filter(p => !userRatings[p.id]);
  shuffleQueue();

  updateProgress();
  showCurrent();
}

function updateProgress() {
  const total = allPokemon.length;
  const rated = Object.keys(userRatings).length;
  const pct = total ? (rated / total) * 100 : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `${rated} / ${total} rated`;
}

function showCurrent() {
  if (currentIndex >= queue.length) {
    document.getElementById('rate-card').classList.add('hidden');
    document.getElementById('rate-complete').classList.remove('hidden');
    return;
  }

  const p = queue[currentIndex];
  const avg = globalAverages[p.id];

  document.getElementById('rate-sprite').src = p.sprite || '';
  document.getElementById('rate-sprite').alt = p.name;
  document.getElementById('rate-dex').textContent = '#' + String(p.baseId ?? p.id).padStart(4, '0');
  document.getElementById('rate-name').innerHTML = nameHTML(p, allPokemon);

  const typesEl = document.getElementById('rate-types');
  typesEl.innerHTML = p.types.map(t => `<span class="type-badge type-${t}">${t}</span>`).join('');

  // Reset sliders to 5
  document.querySelectorAll('.rating-row input[type="range"]').forEach(input => {
    input.value = 5;
    input.closest('.rating-row').querySelector('.score-display').textContent = '5';
  });
  drawStatTriangle(triCanvas, [5, 5, 5], false);

  // Global averages
  ['battleAbility', 'appeal', 'iconicness'].forEach(field => {
    const el = document.getElementById('avg-' + field);
    el.textContent = avg
      ? `Global avg: ${avg[field]} (${avg.count} ${avg.count === 1 ? 'rating' : 'ratings'})`
      : 'No ratings yet';
  });
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
    globalAverages = await fetch('/api/averages').then(r => r.json());
    currentIndex++;
    updateProgress();
    showCurrent();
  }
}

// Stat triangle
const triCanvas = document.getElementById('stat-triangle');

function getSliderVals() {
  return ['battleAbility', 'appeal', 'iconicness'].map(
    f => Number(document.querySelector(`input[data-field="${f}"]`).value)
  );
}

// Live slider display
document.querySelectorAll('.rating-row input[type="range"]').forEach(input => {
  input.addEventListener('input', () => {
    const v = parseFloat(input.value);
    input.closest('.rating-row').querySelector('.score-display').textContent = Number.isInteger(v) ? v : v.toFixed(1);
    drawStatTriangle(triCanvas, getSliderVals(), false);
  });
});

document.getElementById('rate-next-btn').addEventListener('click', saveAndNext);

init();
