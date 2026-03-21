// ── Filter constants ──────────────────────────────────────────────────────────
// Shared across all list pages (myratings, globalratings, wolferatings).
const ALL_TYPES = ['Bug','Dark','Dragon','Electric','Fairy','Fighting','Fire','Flying','Ghost','Grass','Ground','Ice','Normal','Poison','Psychic','Rock','Steel','Water'];
const ALL_GENS = [
  { value: 'generation-i',    label: 'Gen I'    },
  { value: 'generation-ii',   label: 'Gen II'   },
  { value: 'generation-iii',  label: 'Gen III'  },
  { value: 'generation-iv',   label: 'Gen IV'   },
  { value: 'generation-v',    label: 'Gen V'    },
  { value: 'generation-vi',   label: 'Gen VI'   },
  { value: 'generation-vii',  label: 'Gen VII'  },
  { value: 'generation-viii', label: 'Gen VIII' },
  { value: 'generation-ix',   label: 'Gen IX'   },
];

// ── Shared filter UI helpers ──────────────────────────────────────────────────
// Each function receives a pre-filtered pool so pages can apply page-specific
// constraints (e.g. wolferatings limits to ranked Pokémon) before calling.

/**
 * Rebuilds the gen dropdown to only show generations present in pool.
 * Restores the previous selection if still valid; clears it otherwise.
 * @param {object[]} pool - Pokémon objects filtered by current type/search state.
 */
function refreshGenFilter(pool) {
  const present = new Set(pool.map(p => p.generation));
  const genEl = document.getElementById('filter-gen');
  const prev = genEl.value;
  genEl.innerHTML = '<option value="">All Gens</option>' +
    ALL_GENS.filter(g => present.has(g.value))
      .map(g => `<option value="${g.value}">${g.label}</option>`).join('');
  genEl.value = present.has(prev) ? prev : '';
}

/**
 * Rebuilds the secondary type dropdown for the Pokémon in pool that match
 * the currently selected primary type. Hides the dropdown if no primary type
 * is selected.
 * @param {object[]} pool - Pokémon objects filtered by current gen/search state.
 */
function refreshType2Filter(pool) {
  const type = document.getElementById('filter-type').value;
  const type2El = document.getElementById('filter-type2');
  const type2Wrap = document.getElementById('filter-type2-wrap');
  if (!type) { type2El.value = ''; type2Wrap.classList.add('hidden'); return; }
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
  type2Wrap.classList.remove('hidden');
}

/**
 * Rebuilds the primary type dropdown to show only types present in pool.
 * Clears type2 if the previously selected primary type is no longer available.
 * @param {object[]} pool - Pokémon objects filtered by current gen/search state.
 */
function refreshTypeFilters(pool) {
  const present = new Set();
  pool.forEach(p => p.types.forEach(t => present.add(t)));
  const typeEl = document.getElementById('filter-type');
  const prev = typeEl.value;
  typeEl.innerHTML = '<option value="">All Types</option>' +
    ALL_TYPES.filter(t => present.has(t)).map(t => `<option>${t}</option>`).join('');
  if (prev && !present.has(prev)) {
    typeEl.value = '';
    document.getElementById('filter-type2').value = '';
    document.getElementById('filter-type2-wrap').classList.add('hidden');
  } else {
    typeEl.value = prev;
    if (prev) refreshType2Filter(pool);
  }
}

// ── Cookies & User ID ────────────────────────────────────────────────────────
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, days) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getUserId() {
  const key = 'pkmnrank_uid';
  let id = getCookie(key);
  if (!id) {
    id = crypto.randomUUID();
    setCookie(key, id, 365);
  }
  return id;
}

// ── Type badges ───────────────────────────────────────────────────────────────

/**
 * Returns the HTML string for a coloured type lozenge.
 * @param {string} type - Capitalised type name (e.g. "Fire").
 */
function typeBadgeHTML(type) {
  return `<span class="type-badge type-${type}">${type}</span>`;
}

// ── Rating helpers ────────────────────────────────────────────────────────────

/** Returns the sum of all three rating fields for a rating object. */
function ratingSum(r) {
  return (r.battleAbility ?? 0) + (r.appeal ?? 0) + (r.iconicness ?? 0);
}

/**
 * Returns the Serebii pokédex URL for a Pokémon.
 * Forms resolve to their base Pokémon's page.
 * @param {object} p - Pokémon entry.
 * @param {object[]} allPokemon - Full Pokémon list (needed to resolve base forms).
 */
function serebiiUrl(p, allPokemon) {
  const base = p.isForm ? allPokemon.find(b => b.id === p.baseId) : p;
  const name = (base ? base.name : p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/g, '');
  return `https://www.serebii.net/pokemon/${name}/`;
}

// ── Name helpers ──────────────────────────────────────────────────────────────
function parseName(p, allPokemon) {
  if (!p.isForm) return { base: p.name, form: null };
  const base = allPokemon.find(b => b.id === p.baseId);
  const baseName = base ? base.name : '';
  const formPart = p.name.startsWith(baseName)
    ? p.name.slice(baseName.length).replace(/^-/, '').replace(/-/g, ' ')
    : p.name.replace(/-/g, ' ');
  return { base: baseName || p.name, form: formPart || null };
}

function nameHTML(p, allPokemon, small = false) {
  const { base, form } = parseName(p, allPokemon);
  if (!form) return `<span class="poke-name${small ? ' poke-name-sm' : ''}">${base}</span>`;
  return `<span class="poke-name${small ? ' poke-name-sm' : ''}">${base} <span class="form-label">(${form})</span></span>`;
}

// ── Stat triangle ─────────────────────────────────────────────────────────────
const _TRI_ANGLES = [
  -Math.PI / 2,
  -Math.PI / 2 + (2 * Math.PI / 3),
  -Math.PI / 2 + (4 * Math.PI / 3),
];

// rowAlign: true shifts cy so equal padding appears above/below the triangle in a fixed-height row.
// false keeps centroid at canvas center (use when sprite fills the canvas area).
function drawStatTriangle(canvas, vals, rowAlign = true) {
  const size = canvas.width;
  const cx = size / 2;
  const r = size * 0.44;
  const cy = rowAlign ? size / 2 + r / 4 : size / 2;
  const verts = _TRI_ANGLES.map(a => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }));
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  // Grid lines for each value 1–10
  for (let v = 1; v <= 10; v++) {
    const t = v / 10;
    const pts = verts.map(v => ({ x: cx + (v.x - cx) * t, y: cy + (v.y - cy) * t }));
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.strokeStyle = v === 10 ? 'rgba(232,149,42,0.5)' : 'rgba(232,149,42,0.15)';
    ctx.lineWidth = v === 10 ? 1.5 : 1;
    ctx.stroke();
  }

  // Filled stat shape
  if (vals && vals.every(v => v != null)) {
    const pts = verts.map((v, i) => {
      const t = vals[i] / 10;
      return { x: cx + (v.x - cx) * t, y: cy + (v.y - cy) * t };
    });
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(232,149,42,0.30)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,149,42,0.90)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// ── Sidebar nav ───────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const sidebar  = document.getElementById('sidebar');
  const overlay  = document.getElementById('sidebar-overlay');
  const toggle   = document.getElementById('sidebar-toggle');
  const close    = document.getElementById('sidebar-close');

  function open()  { sidebar.classList.add('open');  overlay.classList.add('open'); }
  function shut()  { sidebar.classList.remove('open'); overlay.classList.remove('open'); }

  toggle.addEventListener('click', open);
  close.addEventListener('click', shut);
  overlay.addEventListener('click', shut);

  // Mark active link
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(a => {
    if (a.getAttribute('href') === page) a.classList.add('active');
  });
});
