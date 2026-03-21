// ── Name helpers ─────────────────────────────────────────────────────────────
function parseName(p) {
  if (!p.isForm) return { base: p.name, form: null };
  const base = allPokemon.find(b => b.id === p.baseId);
  const baseName = base ? base.name : '';
  const formPart = p.name.startsWith(baseName)
    ? p.name.slice(baseName.length).replace(/^-/, '').replace(/-/g, ' ')
    : p.name.replace(/-/g, ' ');
  return { base: baseName || p.name, form: formPart || null };
}

function nameHTML(p, small = false) {
  const { base, form } = parseName(p);
  if (!form) return `<span class="poke-name${small ? ' poke-name-sm' : ''}">${base}</span>`;
  return `<span class="poke-name${small ? ' poke-name-sm' : ''}">${base} <span class="form-label">(${form})</span></span>`;
}

// ── User ID ──────────────────────────────────────────────────────────────────
function getUserId() {
  const key = 'pkmnrank_uid';
  let id = getCookie(key);
  if (!id) {
    id = crypto.randomUUID();
    setCookie(key, id, 365);
  }
  return id;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

// ── State ─────────────────────────────────────────────────────────────────────
const userId = getUserId();
let allPokemon = [];
let userRatings = {};
let globalAverages = {};

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  const [pokemon, ratings, averages] = await Promise.all([
    fetch('/api/pokemon').then(r => r.json()),
    fetch(`/api/ratings/${userId}`).then(r => r.json()),
    fetch('/api/averages').then(r => r.json()),
  ]);

  allPokemon = pokemon;
  userRatings = ratings;
  globalAverages = averages;

  populateTypeFilter();
  renderGrid();
  updateProgress();
}

// ── Type filter ───────────────────────────────────────────────────────────────
function populateTypeFilter() {
  const types = [...new Set(allPokemon.flatMap(p => p.types))].sort();
  const sel = document.getElementById('filter-type');
  types.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    sel.appendChild(opt);
  });
}

// ── Grid ──────────────────────────────────────────────────────────────────────
function getFilteredPokemon() {
  const type = document.getElementById('filter-type').value;
  const status = document.getElementById('filter-status').value;
  const search = document.getElementById('search').value.toLowerCase();

  return allPokemon.filter(p => {
    if (type && !p.types.includes(type)) return false;
    if (status === 'rated' && !userRatings[p.id]) return false;
    if (status === 'unrated' && userRatings[p.id]) return false;
    const forms = document.getElementById('filter-forms').value;
    if (forms === 'base' && p.isForm) return false;
    if (forms === 'forms' && !p.isForm) return false;
    if (search && !p.name.toLowerCase().includes(search)) return false;
    return true;
  });
}

function renderGrid() {
  const grid = document.getElementById('pokemon-grid');
  grid.innerHTML = '';
  const filtered = getFilteredPokemon();

  filtered.forEach(p => {
    const rated = !!userRatings[p.id];
    const card = document.createElement('div');
    card.className = 'poke-card' + (rated ? ' rated' : '');
    card.innerHTML = `
      ${rated ? '<div class="rated-indicator"></div>' : ''}
      <img src="${p.sprite || ''}" alt="${p.name}" loading="lazy" />
      <div class="poke-id">#${String(p.baseId ?? p.id).padStart(4, '0')}</div>
      ${nameHTML(p, true)}
      <div class="type-badges">
        ${p.types.map(typeBadgeHTML).join('')}
      </div>
    `;
    card.addEventListener('click', () => openModal(p));
    grid.appendChild(card);
  });
}

// ── Progress ──────────────────────────────────────────────────────────────────
function updateProgress() {
  const total = allPokemon.length;
  const rated = Object.keys(userRatings).length;
  const pct = total ? (rated / total) * 100 : 0;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('progress-label').textContent = `${rated} / ${total} rated`;
}

// ── Modal ─────────────────────────────────────────────────────────────────────
function openModal(p) {
  const existing = userRatings[p.id] || {};
  const avg = globalAverages[p.id];

  const val = field => existing[field] ?? 5;
  const avgStr = (field) => avg
    ? `Global avg: ${avg[field]} (${avg.count} ${avg.count === 1 ? 'rating' : 'ratings'})`
    : 'No ratings yet';

  document.getElementById('modal-content').innerHTML = `
    <img src="${p.sprite || ''}" alt="${p.name}" />
    <div class="poke-id">#${String(p.baseId ?? p.id).padStart(4, '0')}</div>
    <h2>${nameHTML(p)}</h2>
    <div class="type-badges" style="justify-content:center;margin-top:8px;">
      ${p.types.map(typeBadgeHTML).join('')}
    </div>

    <div class="rating-section">
      ${['battleAbility', 'appeal', 'iconicness'].map(field => {
        const labels = { battleAbility: 'Battle Ability', appeal: 'Appeal', iconicness: 'Iconicness' };
        return `
          <div class="rating-row" data-field="${field}">
            <label>${labels[field]} <span class="score-display">${val(field)}</span></label>
            <input type="range" min="1" max="10" value="${val(field)}" data-field="${field}" />
            <div class="global-avg">${avgStr(field)}</div>
          </div>
        `;
      }).join('')}
    </div>

    <button id="modal-save">Save Rating</button>
  `;

  // Live score display
  document.querySelectorAll('.rating-row input[type="range"]').forEach(input => {
    input.addEventListener('input', () => {
      input.closest('.rating-row').querySelector('.score-display').textContent = input.value;
    });
  });

  document.getElementById('modal-save').addEventListener('click', () => saveRating(p));
  document.getElementById('modal-overlay').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
}

async function saveRating(p) {
  const getVal = field => Number(document.querySelector(`input[data-field="${field}"]`).value);

  const body = {
    pokemonId: p.id,
    battleAbility: getVal('battleAbility'),
    appeal: getVal('appeal'),
    iconicness: getVal('iconicness'),
  };

  const res = await fetch(`/api/ratings/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (res.ok) {
    const { rating } = await res.json();
    userRatings[p.id] = rating;

    // Refresh averages
    globalAverages = await fetch('/api/averages').then(r => r.json());

    closeModal();
    renderGrid();
    updateProgress();
  }
}

// ── Events ────────────────────────────────────────────────────────────────────
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', e => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});
document.getElementById('filter-type').addEventListener('change', renderGrid);
document.getElementById('filter-status').addEventListener('change', renderGrid);
document.getElementById('filter-forms').addEventListener('change', renderGrid);
document.getElementById('search').addEventListener('input', renderGrid);

// ── Start ─────────────────────────────────────────────────────────────────────
init();
